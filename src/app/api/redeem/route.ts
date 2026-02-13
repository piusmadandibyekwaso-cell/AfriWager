
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value; },
            },
        }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    // Admin client
    const { createClient } = require('@supabase/supabase-js');
    const adminSupabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    try {
        const body = await request.json();
        const { marketId } = body;

        console.log("Redeem Request:", { user: user.email, marketId });

        if (!marketId) return NextResponse.json({ error: 'Missing marketId' }, { status: 400 });

        // Call RPC 'redeem_winnings'
        const { data: redeemResult, error: rpcError } = await adminSupabase.rpc('redeem_winnings', {
            p_user_id: user.id,
            p_market_id: marketId
        });

        if (rpcError) {
            console.error("Redeem RPC Error:", rpcError);
            return NextResponse.json({ error: rpcError.message }, { status: 400 });
        }

        console.log("Redeem Success:", redeemResult);
        return NextResponse.json({
            success: true,
            payout: redeemResult.payout,
            txId: redeemResult.tx_id
        });

    } catch (error: any) {
        console.error('Redeem Route Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
