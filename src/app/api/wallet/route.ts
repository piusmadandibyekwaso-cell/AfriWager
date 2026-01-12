
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const cookieStore = cookies();
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { type, amountUSD, phoneNumber } = body;

        if (!['DEPOSIT', 'WITHDRAW'].includes(type) || !amountUSD) {
            return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
        }

        // Mock Mobile Money Delay
        // await new Promise(resolve => setTimeout(resolve, 2000));

        // Get current balance
        const { data: balanceData } = await supabase
            .from('user_balances')
            .select('balance_usdc')
            .eq('user_id', user.id)
            .single();

        const currentBalance = Number(balanceData?.balance_usdc || 0);

        if (type === 'WITHDRAW' && currentBalance < amountUSD) {
            return NextResponse.json({ error: 'Insufficient funds' }, { status: 402 });
        }

        const newBalance = type === 'DEPOSIT' ? currentBalance + amountUSD : currentBalance - amountUSD;

        // Update Balance
        const { error: updateError } = await supabase
            .from('user_balances')
            .update({ balance_usdc: newBalance })
            .eq('user_id', user.id);

        if (updateError) throw updateError;

        // Record Transaction
        const { error: txError } = await supabase
            .from('transactions')
            .insert({
                user_id: user.id,
                type: type === 'DEPOSIT' ? 'deposit' : 'withdrawal',
                amount_usdc: type === 'DEPOSIT' ? amountUSD : -amountUSD,
                status: 'completed',
                reference_id: `MOCK_MM_${Date.now()}`,
                metadata: { phoneNumber, provider: 'MTN_MOMO' }
            });

        return NextResponse.json({ success: true, newBalance });

    } catch (e: any) {
        console.error('Wallet transaction failed:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
