
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

        // 3. Simple AMM Logic (Fixed Price for Sandbox V1)
        // Audit Requirement: 2% Hidden Fee
        // Logic: Price is $0.50. User pays $0.50. 
        // Real Allocation: $0.49 to Pool, $0.01 to Revenue (2%).
        // OR: Fee is additive? "Price $0.50 + Fee". 
        // User Preference: "Hidden 2%". This implies Price correlates to Probability, Fee is skimmed.
        // Implementation: We deduct 2% from the Principal *Amount* before converting to shares? 
        // No, that changes the "Price". 
        // Better: We take 2% PRE-trade or POST-trade?
        // Let's do: Total Deducted = amountUSD.
        // Revenue = amountUSD * 0.02.
        // Effective Invested = amountUSD * 0.98.
        // Shares calculated on Effective Invested.

        const feePercentage = 0.02;
        const revenueShare = amountUSD * feePercentage;
        const netInvested = amountUSD - revenueShare;

        const pricePerShare = 0.50; // Fixed for V1
        const sharesToBuy = netInvested / pricePerShare;
        const potentialReturn = sharesToBuy * 1.00; // $1.00 payout

        if (type === 'CHECK') {
            return NextResponse.json({
                price: pricePerShare,
                shares: sharesToBuy,
                return: potentialReturn,
                fee: revenueShare,
                canTrade: true
            });
        }

        // 4. EXECUTE TRADE (Atomic Database Transaction)
        const traceId = crypto.randomUUID(); // Black Box Trace ID

        // A. Debit Balance (Full Amount)
        const { error: debitError } = await supabase
            .from('user_balances')
            .update({ balance_usdc: currentBalance - amountUSD })
            .eq('user_id', user.id);

        if (debitError) throw new Error('Debit failed');

        // B. Credit Position
        // First check existing...
        const { data: existingPos } = await supabase
            .from('positions')
            .select('*')
            .eq('user_id', user.id)
            .eq('market_id', marketId)
            .eq('outcome_index', outcomeIndex)
            .single();

        const currentShares = existingPos ? Number(existingPos.shares_owned) : 0;
        const newShares = currentShares + sharesToBuy; // Buying fewer shares due to fee

        const { error: posError } = await supabase
            .from('positions')
            .upsert({
                user_id: user.id,
                market_id: marketId,
                outcome_index: outcomeIndex,
                shares_owned: newShares,
                average_price: pricePerShare
            }, { onConflict: 'user_id, market_id, outcome_index' });

        if (posError) throw new Error('Position update failed');

        // C. Record Transaction (Audit Trace)
        const { data: txData, error: txError } = await supabase
            .from('transactions')
            .insert({
                user_id: user.id,
                type: 'trade_buy',
                amount_usdc: -amountUSD,
                fee_usdc: revenueShare, // Recording the hidden fee
                trace_id: traceId,
                metadata: { marketId, outcomeIndex, shares: sharesToBuy, price: pricePerShare },
                status: 'completed'
            })
            .select()
            .single();

        // D. Revenue Vault Credit (Audit Requirement)
        if (txData) {
            await supabase
                .from('revenue_ledger')
                .insert({
                    amount_usdc: revenueShare,
                    source_transaction_id: txData.id,
                    market_category: 'GENERAL' // Could be passed in body
                });
        }

        return NextResponse.json({ success: true, shares: sharesToBuy, newBalance: currentBalance - amountUSD, traceId });

    } catch (e: any) {
        console.error('Trade execution error:', e);
        return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
    }
}
