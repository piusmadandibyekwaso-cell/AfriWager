import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const ADMIN_EMAIL = 'piusmadandibyekwaso@gmail.com';

export async function POST(request: Request) {
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

    // 1. Verify Admin Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.email !== ADMIN_EMAIL) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { amount, passcode } = await request.json();

        if (!amount || amount <= 0 || !passcode) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // 2. Verify Passcode (Private Key)
        // We compare the provided passcode with the server-side Private Key
        const serverPrivateKey = process.env.PRIVATE_KEY;
        if (passcode !== serverPrivateKey) {
            return NextResponse.json({ error: 'Invalid Treasury Passcode' }, { status: 403 });
        }

        // 3. Internal Credit: Move from Treasury (Logical) to Admin Profile
        // Note: The physical USDC stays in the Polygon Treasury Wallet.
        
        // Get Admin's current balance
        const { data: balanceData } = await supabase
            .from('user_balances')
            .select('balance_usdc')
            .eq('user_id', user.id)
            .single();

        const currentBalance = Number(balanceData?.balance_usdc || 0);
        const newBalance = currentBalance + Number(amount);

        // 4. Atomic Updates
        const { error: updateError } = await supabase
            .from('user_balances')
            .update({ balance_usdc: newBalance })
            .eq('user_id', user.id);

        if (updateError) throw updateError;

        // 5. Record Admin Treasury Withdrawal
        await supabase.from('transactions').insert({
            user_id: user.id,
            type: 'admin_withdrawal',
            amount_usdc: amount,
            status: 'completed',
            reference_id: `ADMIN_WD_${Date.now()}`,
            metadata: { 
                note: 'Treasury Fee Withdrawal', 
                source: 'TREASURY_REVENUE',
                timestamp: new Date().toISOString()
            }
        });

        return NextResponse.json({ 
            success: true, 
            newBalance, 
            message: `Successfully credited $${amount} to your Admin account.` 
        });

    } catch (error: any) {
        console.error('Admin Withdrawal Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
