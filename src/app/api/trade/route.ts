
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const cookieStore = cookies();

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

        // 3. Simple AMM Logic (Fixed Price for Sandbox V1 - 50/50 probability simulation)
        // In real V2: fetch market pool state and calc slippage.
        // For V1 Demo: Assume fixed price of $0.50 per share (2x payout).
        const pricePerShare = 0.50;
        const sharesToBuy = amountUSD / pricePerShare;
        const potentialReturn = sharesToBuy * 1.00; // $1.00 payout per share

        if (type === 'CHECK') {
            return NextResponse.json({
                price: pricePerShare,
                shares: sharesToBuy,
                return: potentialReturn,
                fee: 0,
                canTrade: true
            });
        }

        // 4. EXECUTE TRADE (Atomic Database Transaction)
        // Note: Supabase JS direct client doesn't support complex SQL Transactions easily without RPC.
        // For Sandbox V1, we will do sequential updates (Risk of race condition, but acceptable for demo).
        // A better way is to call a Postgres Function `execute_trade(...)`.

        // A. Debit Balance
        const { error: debitError } = await supabase
            .from('user_balances')
            .update({ balance_usdc: currentBalance - amountUSD })
            .eq('user_id', user.id);

        if (debitError) throw new Error('Debit failed');

        // B. Credit Position (Upsert)
        // First check existing
        const { data: existingPos } = await supabase
            .from('positions')
            .select('*')
            .eq('user_id', user.id)
            .eq('market_id', marketId)
            .eq('outcome_index', outcomeIndex)
            .single();

        const currentShares = existingPos ? Number(existingPos.shares_owned) : 0;
        const newShares = currentShares + sharesToBuy;

        // Upsert Position
        const { error: posError } = await supabase
            .from('positions')
            .upsert({
                user_id: user.id,
                market_id: marketId,
                outcome_index: outcomeIndex,
                shares_owned: newShares,
                average_price: pricePerShare // Simplified avg price logic
            }, { onConflict: 'user_id, market_id, outcome_index' });

        if (posError) throw new Error('Position update failed');

        // C. Record Transaction
        const { error: txError } = await supabase
            .from('transactions')
            .insert({
                user_id: user.id,
                type: 'trade_buy',
                amount_usdc: -amountUSD,
                fee_usdc: 0,
                metadata: { marketId, outcomeIndex, shares: sharesToBuy, price: pricePerShare },
                status: 'completed'
            });

        return NextResponse.json({ success: true, shares: sharesToBuy, newBalance: currentBalance - amountUSD });

    } catch (e: any) {
        console.error('Trade execution error:', e);
        return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
    }
}
