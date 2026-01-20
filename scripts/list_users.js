const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

// Use SERVICE_ROLE key to see auth users
const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.SUPABASE_SERVICE_ROLE_KEY);

async function listUsers() {
    console.log("Fetching Users...");
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error("Error fetching users:", error);
        return;
    }

    users.forEach(u => {
        console.log(`- ID: ${u.id} | Email: ${u.email} | Last Sign In: ${u.last_sign_in_at}`);
    });
}

listUsers();
