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

async function zeroBalances() {
    console.log("Setting all user balances to 0...");
    
    try {
        const { error } = await supabase
            .from('user_balances')
            .update({ balance_usdc: 0 })
            .neq('balance_usdc', -1); // Hack to update all rows
            
        if (error) throw error;

        console.log("✅ All user balances have been reset to $0.00");
    } catch (e) {
        console.error("FAILED to reset balances:", e);
    }
}

zeroBalances();
