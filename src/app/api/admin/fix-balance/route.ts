
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    // 1. Init Admin Client (Bypass RLS)
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    try {
        // 2. Get User ID
        const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
        if (userError) throw userError;

        const user = users.find(u => u.email === email);
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // 3. Upsert Balance
        const { error: upsertError } = await supabase
            .from('user_balances')
            .upsert({
                user_id: user.id,
                balance_usdc: 100.00,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

        if (upsertError) throw upsertError;

        return NextResponse.json({ success: true, message: `Balance set to $100 for ${email}` });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
