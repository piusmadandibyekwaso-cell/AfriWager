
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkBalance() {
    console.log('--- Checking User Balance ---');

    // 1. Get User ID
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) {
        console.error('Error listing users:', userError);
        return;
    }

    const targetUser = users.find(u => u.email === 'madandipiusb@gmail.com');
    if (!targetUser) {
        console.error('User madandipiusb@gmail.com NOT FOUND in Auth.');
        return;
    }

    console.log(`User Found: ${targetUser.email} (ID: ${targetUser.id})`);

    // 2. Check Balance Table
    const { data: balance, error: balanceError } = await supabase
        .from('user_balances')
        .select('*')
        .eq('user_id', targetUser.id)
        .maybeSingle();

    if (balanceError) {
        console.error('Error fetching balance:', balanceError);
    } else {
        console.log('Balance Record:', balance);
    }
}

checkBalance();
