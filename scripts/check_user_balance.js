const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkBalances() {
    console.log("Checking User Balances...");

    // Get all profiles to map IDs to emails if possible, but profiles table might be different
    // Let's just check user_balances
    const { data: balances, error } = await supabase
        .from('user_balances')
        .select('*');

    if (error) {
        console.error("Error fetching balances:", error);
        return;
    }

    if (!balances || balances.length === 0) {
        console.log("No balances found in 'user_balances' table.");
    } else {
        console.log(`Found ${balances.length} balance records:`);
        balances.forEach(b => {
            console.log(`- User: ${b.user_id} | Balance: $${b.balance_usdc}`);
        });
    }
}

checkBalances();
