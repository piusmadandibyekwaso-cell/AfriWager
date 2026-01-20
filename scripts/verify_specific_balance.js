const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.SUPABASE_SERVICE_ROLE_KEY);

const TARGET_EMAIL = 'madandipiusb@gmail.com';
const TARGET_ID = '2be32802-980b-4b31-a65c-f166ed374c53';

async function verifyBalance() {
    console.log(`Verifying balance for: ${TARGET_EMAIL} (${TARGET_ID})`);

    const { data: balance, error } = await supabase
        .from('user_balances')
        .select('*')
        .eq('user_id', TARGET_ID)
        .single();

    if (error) {
        console.error("❌ Error/Not Found:", error.message);
        // Attempt to see if ANY balances exist
        const { count } = await supabase.from('user_balances').select('*', { count: 'exact', head: true });
        console.log(`Total rows in user_balances: ${count}`);
    } else {
        console.log(`✅ Balance Record Found:`);
        console.log(`   - Balance USDC: $${balance.balance_usdc}`);
        console.log(`   - Updated At: ${balance.updated_at || 'N/A'}`);
    }
}

verifyBalance();
