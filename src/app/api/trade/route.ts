
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    console.log("Trade route hit. Path:", request.url);
    const cookieStore = await cookies();
    console.log("Cookies Present:", cookieStore.getAll().length > 0);

    // Server-side Supabase client for Session verification
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    const cookie = cookieStore.get(name);
                    console.log(`Supabase looking for: ${name} | Found: ${cookie?.value ? 'YES' : 'NO'}`);
                    return cookie?.value;
                },
            },
        }
    );

    // 1. Verify Session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        console.error("Auth Failed. User:", user?.email || 'NULL', "Error:", authError?.message || 'NONE');
        return NextResponse.json({ error: 'Unauthorized: Please sign in again' }, { status: 401 });
    }

    console.log("Auth Success. User:", user.email);

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
        console.error("CRITICAL: Missing SUPABASE_SERVICE_ROLE_KEY");
        return NextResponse.json({ error: 'Server Misconfiguration: Missing Admin Key' }, { status: 500 });
    }

    // Admin Client for Privileged Operations (Bypassing RLS for Balance/Pool updates)
    const { createClient } = require('@supabase/supabase-js');
    const adminSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );

    try {
        const body = await request.json();
        const { marketId, outcomeIndex, amountUSD, type, minSharesOut = 0 } = body;

        console.log("Trade Request:", { marketId, outcomeIndex, amountUSD, type, minSharesOut });

        if (!marketId || outcomeIndex === undefined || !amountUSD) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // 1. Fetch Market for 'CHECK' Estimate / Verification
        const { data: marketData, error: marketError } = await adminSupabase
            .from('markets')
            .select('yes_pool, no_pool, is_halted, total_volume_usdc')
            .eq('id', marketId)
            .single();

        if (marketError || !marketData) {
            return NextResponse.json({ error: 'Market not found' }, { status: 404 });
        }

        // @ts-ignore
        if (marketData.is_halted) {
            return NextResponse.json({ error: 'Market is currently HALTED by Guardian Protocol.' }, { status: 503 });
        }

        // CPMM Estimates for UI / Checks
        let yesPool = Number(marketData.yes_pool);
        let noPool = Number(marketData.no_pool);
        const k = yesPool * noPool;
        const fee = amountUSD * 0.02;
        const investAmount = amountUSD - fee;

        let estimatedShares = 0;
        let pricePerShare = 0;
        let newYesPool = yesPool, newNoPool = noPool;

        if (outcomeIndex === 0) { // BUY YES
            newNoPool = noPool + investAmount;
            newYesPool = k / newNoPool;
            estimatedShares = yesPool - newYesPool;
        } else { // BUY NO
            newYesPool = yesPool + investAmount;
            newNoPool = k / newYesPool;
            estimatedShares = noPool - newNoPool;
        }
        pricePerShare = investAmount / estimatedShares;

        const currentPrice = outcomeIndex === 0 ? (noPool / (yesPool + noPool)) : (yesPool / (yesPool + noPool));
        const priceImpact = Math.abs((pricePerShare - currentPrice) / currentPrice);

        // CHECK ENDPOINT (UI Quotes)
        if (type === 'CHECK') {
            return NextResponse.json({
                price: pricePerShare,
                shares: estimatedShares,
                return: estimatedShares * 1.00,
                fee: fee,
                canTrade: true,
                priceImpact: priceImpact * 100,
                isHalted: false // Explicit
            });
        }

        // 2. EXECUTE TRADE (ATOMIC RPC)
        // Guardian Protocol: Backend calculates minShares if not provided, or validates it
        // We enforce a 10% tolerance if UI didn't send strict bounds, OR strict bounds if sent.

        const finalMinShares = minSharesOut > 0 ? minSharesOut : (estimatedShares * 0.90); // Default 10% slippage guard if UI is old

        console.log("Invoking Guardian RPC:", { marketId, outcomeIndex, amountUSD, finalMinShares });

        const { data: tradeResult, error: rpcError } = await adminSupabase.rpc('execute_trade', {
            p_user_id: user.id,
            p_market_id: marketId,
            p_outcome_index: outcomeIndex,
            p_amount_usd: amountUSD,
            p_min_shares_out: finalMinShares
        });

        if (rpcError) {
            console.error("RPC Error:", rpcError);
            // Parse custom error messages from PL/PGSQL
            if (rpcError.message.includes('Insufficient Funds')) return NextResponse.json({ error: 'Insufficient Funds' }, { status: 402 });
            if (rpcError.message.includes('Market limit reached') || rpcError.message.includes('Slippage')) return NextResponse.json({ error: 'Trade Blocked: High Slippage detected > 10%' }, { status: 400 });
            if (rpcError.message.includes('Negative ROI')) return NextResponse.json({ error: 'Trade Blocked: Negative Return on Investment (Zero-Loss Guard)' }, { status: 400 });

            return NextResponse.json({ error: `Transaction Failed: ${rpcError.message}` }, { status: 500 });
        }

        console.log("Trade Success:", tradeResult);

        return NextResponse.json({
            success: true,
            shares: tradeResult.shares, // RPC returns this
            newBalance: tradeResult.new_balance,
            txId: tradeResult.tx_id
        });

    } catch (error: any) {
        console.error('Trade Route Fatal Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
