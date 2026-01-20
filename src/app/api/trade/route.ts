
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
        const { marketId, outcomeIndex, amountUSD, type } = body; // type = 'CHECK' or 'EXECUTE'

        if (!marketId || outcomeIndex === undefined || !amountUSD) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // 2. Fetch Market Pools & User Balance (Using Admin Client to bypass RLS for lookups)
        const [balanceResult, marketResult] = await Promise.all([
            adminSupabase.from('user_balances').select('balance_usdc').eq('user_id', user.id).single(),
            adminSupabase.from('markets').select('yes_pool, no_pool, is_halted').eq('id', marketId).single()
        ]);

        if (balanceResult.error || !balanceResult.data) {
            console.error("Balance Lookup Failed for ID:", user.id, "Error:", balanceResult.error?.message);
            return NextResponse.json({ error: 'Balance record not found' }, { status: 404 });
        }

        if (marketResult.error || !marketResult.data) {
            console.error("Market Lookup Failed for ID:", marketId, "Error:", marketResult.error?.message);
            return NextResponse.json({ error: 'Market not found in Supabase' }, { status: 404 });
        }

        // Checks
        const currentBalance = Number(balanceResult.data.balance_usdc);
        if (currentBalance < amountUSD) return NextResponse.json({ error: 'Insufficient funds' }, { status: 402 });
        // @ts-ignore
        if (marketResult.data.is_halted) return NextResponse.json({ error: 'Market is currently HALTED.' }, { status: 503 });

        // 3. CPMM Logic (x * y = k)
        // Outcome 0 = YES, Outcome 1 = NO
        let yesPool = Number(marketResult.data.yes_pool);
        let noPool = Number(marketResult.data.no_pool);
        const k = yesPool * noPool;

        // Calculate Shares & Price
        let sharesBought = 0;
        let newYesPool = yesPool;
        let newNoPool = noPool;
        let pricePerShare = 0;

        // Fee (2%)
        const fee = amountUSD * 0.02;
        const investAmount = amountUSD - fee;

        if (outcomeIndex === 0) { // BUY YES
            // Add investment to NO pool
            newNoPool = noPool + investAmount;
            newYesPool = k / newNoPool;
            sharesBought = yesPool - newYesPool;
            pricePerShare = investAmount / sharesBought; // Avg execution price
        } else { // BUY NO
            // Add investment to YES pool
            newYesPool = yesPool + investAmount;
            newNoPool = k / newYesPool;
            sharesBought = noPool - newNoPool;
            pricePerShare = investAmount / sharesBought;
        }

        // Return Estimate for CHECK
        if (type === 'CHECK') {
            return NextResponse.json({
                price: pricePerShare, // Effective price
                shares: sharesBought,
                return: sharesBought * 1.00, // Pays out $1 if wins
                fee: fee,
                canTrade: true,
                priceImpact: Math.abs((pricePerShare - (outcomeIndex === 0 ? (noPool / (yesPool + noPool)) : (yesPool / (yesPool + noPool)))) / (noPool / (yesPool + noPool))) * 100
            });
        }

        // 4. EXECUTE TRADE (Privileged Updates)
        // A. Deduction
        const { error: balanceUpdateError } = await adminSupabase
            .from('user_balances')
            .update({ balance_usdc: currentBalance - amountUSD })
            .eq('user_id', user.id);

        if (balanceUpdateError) {
            console.error("Balance Update Error:", balanceUpdateError);
            throw balanceUpdateError;
        }

        // B. Update Pools
        const { error: poolUpdateError } = await adminSupabase
            .from('markets')
            .update({ yes_pool: newYesPool, no_pool: newNoPool })
            .eq('id', marketId);

        if (poolUpdateError) console.error("Pool update failed (critical):", poolUpdateError);

        // C. Record Transaction & Position (Optional but recommended)
        // For now preventing 'Trade Failed' is priority.

        return NextResponse.json({
            success: true,
            shares: sharesBought,
            newBalance: currentBalance - amountUSD,
            avgPrice: pricePerShare
        });

    } catch (error) {
        console.error('Trade Failed:', error);
        return NextResponse.json({ error: 'Trade Failed' }, { status: 500 });
    }
}
