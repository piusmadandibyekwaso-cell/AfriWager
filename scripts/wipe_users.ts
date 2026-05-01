
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function wipeUsers() {
    console.log("🚀 Wiping all user accounts and balances...");
    
    try {
        // Order matters for foreign keys
        console.log("Cleaning positions...");
        await supabase.from('positions').delete().neq('user_id', '00000000-0000-0000-0000-000000000000');
        
        console.log("Cleaning transactions...");
        await supabase.from('transactions').delete().neq('user_id', '00000000-0000-0000-0000-000000000000');
        
        console.log("Cleaning compliance logs...");
        await supabase.from('compliance_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        
        console.log("Cleaning user balances...");
        await supabase.from('user_balances').delete().neq('user_id', '00000000-0000-0000-0000-000000000000');
        
        console.log("Cleaning user profiles...");
        await supabase.from('profiles').delete().neq('wallet_address', '0x0000000000000000000000000000000000000000');

        console.log("✅ ALL USER DATA WIPED SUCCESSFULLY.");
        process.exit(0);
    } catch (e) {
        console.error("FAILED to wipe user data:", e);
        process.exit(1);
    }
}

wipeUsers();
