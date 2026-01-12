
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const cookieStore = await cookies();

    // Server-side Supabase client for Session verification
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
        }
    );

    // 1. Verify Session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { marketId, outcomeIndex, amountUSD, type } = body; // type = 'CHECK' or 'EXECUTE'

        if (!marketId || outcomeIndex === undefined || !amountUSD) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // 2. Fetch User Balance (Force fresh read)
        const { data: balanceData, error: balanceError } = await supabase
            .from('user_balances')
            .select('balance_usdc')
            .eq('user_id', user.id)
            .single();

        if (balanceError || !balanceData) {
            return NextResponse.json({ error: 'Balance not found' }, { status: 404 });
        }

        const currentBalance = Number(balanceData.balance_usdc);
        if (currentBalance < amountUSD) {
            return NextResponse.json({ error: 'Insufficient funds' }, { status: 402 });
        }

        // 2a. KILL SWITCH CHECK (Audit Requirement)
        const { data: marketControl } = await supabase
            .from('market_controls')
            .select('is_halted')
            .eq('market_id', marketId)
            .single();

        if (marketControl?.is_halted) {
            return NextResponse.json({ error: 'Market is currently HALTED by Administrator.' }, { status: 503 });
        }

        // 3. Simple AMM Logic (Simulation)
        // For V1 Demo: Assume fixed price of $0.50 per share.
        // The RPC function handles fees and atomic updates.
        const pricePerShare = 0.50;

        // Calculate simplified view for CHECK (Simulation only)
        if (type === 'CHECK') {
            const feeEstimate = amountUSD * 0.02;
            const netEstimate = amountUSD - feeEstimate;
            const sharesEstimate = netEstimate / pricePerShare;
            return NextResponse.json({
                price: pricePerShare,
                shares: sharesEstimate,
                return: sharesEstimate * 1.00,
                fee: feeEstimate,
                canTrade: true
            });
        }

        // 4. EXECUTE TRADE via RPC (Security Definer)
        // Delegate to Database Function to bypass RLS and ensure atomicity.
        const { data: tradeResult, error: rpcError } = await supabase.rpc('execute_trade', {
            p_market_id: marketId,
            p_outcome_index: outcomeIndex,
            p_amount_usdc: amountUSD,
            p_price_per_share: pricePerShare
        });

        if (rpcError) {
            console.error('RPC Error:', rpcError);
            throw new Error(rpcError.message);
        }

        return NextResponse.json({
            success: true,
            shares: tradeResult.shares_bought,
            newBalance: tradeResult.new_balance,
            traceId: tradeResult.trace_id
        });

    } catch (e: any) {
        console.error('Trade execution error:', e);
        // Handle specific Postgres errors
        const msg = e.message || 'Internal Server Error';
        return NextResponse.json({ error: msg }, { status: msg === 'Insufficient Funds' || msg === 'Market Halted' ? 400 : 500 });
    }
}
