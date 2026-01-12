
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const cookieStore = await cookies();
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

    // 1. Admin Verification (TODO: Add stricter role check)
    // For now, checks if user is logged in. In prod, check `if (user.role !== 'admin')`.
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 2. Fetch Aggregates

        // A. Net Transfers (The "Real Money" entered)
        // Deposits - Withdrawals
        const { data: transfers } = await supabase
            .from('transactions')
            .select('amount_usdc, type');

        const totalDeposits = transfers
            ?.filter(t => t.type === 'deposit')
            .reduce((acc, curr) => acc + Number(curr.amount_usdc), 0) || 0;

        const totalWithdrawals = transfers
            ?.filter(t => t.type === 'withdrawal')
            .reduce((acc, curr) => acc + Math.abs(Number(curr.amount_usdc)), 0) || 0; // Stored as neg?

        const netLiquidity = totalDeposits - totalWithdrawals;

        // B. Current User Holdings (Cash on Hand)
        const { data: balances } = await supabase
            .from('user_balances')
            .select('balance_usdc');

        const totalUserCash = balances?.reduce((acc, curr) => acc + Number(curr.balance_usdc), 0) || 0;

        // C. Revenue Vault (Fees)
        const { data: revenue } = await supabase
            .from('revenue_ledger')
            .select('amount_usdc');

        const totalRevenue = revenue?.reduce((acc, curr) => acc + Number(curr.amount_usdc), 0) || 0;

        // D. Market Escrow (Money locked in bets)
        // Hard to sum perfectly without querying every active market logic. 
        // Approx: Net Liquidity - (User Cash + Revenue) = Expected Escrow.
        // We can check against `transactions` of type `trade_buy`.
        const totalTradeVolume = transfers
            ?.filter(t => t.type === 'trade_buy')
            .reduce((acc, curr) => acc + Math.abs(Number(curr.amount_usdc)), 0) || 0;

        // Note: Trade Volume isn't "Currently Locked" if they sold/won. 
        // Simple Audit: NetIn should >= Cash + Revenue.
        // The Remainder is "At Risk" (Escrow).

        const calculatedDelta = netLiquidity - (totalUserCash + totalRevenue);

        return NextResponse.json({
            status: 'success',
            audit_timestamp: new Date().toISOString(),
            metrics: {
                net_external_deposits: netLiquidity,
                liabilities: {
                    user_cash_on_hand: totalUserCash,
                    platform_revenue: totalRevenue,
                    implied_market_escrow: calculatedDelta
                },
                health: calculatedDelta >= 0 ? 'SOLVENT' : 'INSOLVENT_RISK'
            }
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
