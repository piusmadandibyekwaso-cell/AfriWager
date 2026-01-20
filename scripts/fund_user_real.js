const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.SUPABASE_SERVICE_ROLE_KEY);

async function fundAllUsers() {
    console.log("Fetching all users to fund...");
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error("Error listing users:", listError);
        return;
    }

    console.log(`Found ${users.length} users. Funding each with $1,000...`);

    for (const user of users) {
        console.log(`Processing ${user.email} (${user.id})...`);

        // Upsert balance
        const { error: upsertError } = await supabase
            .from('user_balances')
            .upsert(
                { user_id: user.id, balance_usdc: 1000.00 },
                { onConflict: 'user_id' }
            );

        if (upsertError) {
            console.error(`❌ Failed to fund ${user.email}:`, upsertError.message);
        } else {
            console.log(`✅ Funded ${user.email} ($1,000.00)`);
        }
    }
    console.log("Funding complete.");
}

fundAllUsers();
