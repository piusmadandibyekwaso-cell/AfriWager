import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const { authenticator } = require('otplib');

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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.email !== ADMIN_EMAIL) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { code } = await request.json();
        const secret = process.env.ADMIN_MFA_SECRET;

        if (!secret) {
            console.error('MFA_ERROR: ADMIN_MFA_SECRET missing');
            return NextResponse.json({ error: 'MFA not configured on server' }, { status: 500 });
        }

        // Set window to 1 (allows 1 step before/after) to handle clock drift
        authenticator.options = { window: 1 };
        const isValid = authenticator.verify({ token: code.replace(/\s/g, ''), secret: secret.trim() });

        console.log(`MFA_AUTH_ATTEMPT: email=${user.email} success=${isValid}`);

        if (isValid) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: 'Invalid authentication code' }, { status: 403 });
        }
    } catch (error: any) {
        console.error('MFA_EXCEPTION:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
