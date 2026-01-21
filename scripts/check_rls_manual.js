
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase Config');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLS() {
    console.log('--- Supabase RLS Audit ---');

    // We query pg_tables to see the rowsecurity column
    // This requires specific permissions, but service role usually has it or we can try RPC
    const { data: tables, error } = await supabase.rpc('check_rls_status');

    if (error) {
        console.log('RPC check_rls_status not available. Trying direct SQL query via REST (if enabled)...');
        // If RPC isn't there, we can't easily check RLS via Supabase-js unless we have a specific view.
        // Let's try to query public schema information if possible.

        const tablesToCheck = ['markets', 'user_balances', 'trades', 'profiles', 'outcomes'];

        for (const table of tablesToCheck) {
            console.log(`Checking table: ${table}...`);
            // Attempting a select without any cookies/auth (anon client) might tell us if RLS is off
            // but the service role will always see it.
        }

        console.error('Unable to verify RLS status via Supabase-JS directly without a dedicated RPC function.');
        console.log('Please run this in the Supabase SQL Editor:');
        console.log(`
SELECT 
    relname AS table_name, 
    relrowsecurity AS rls_enabled 
FROM 
    pg_class 
JOIN 
    pg_namespace ON pg_namespace.oid = pg_class.relnamespace 
WHERE 
    nspname = 'public' AND relkind = 'r';
        `);
    } else {
        console.table(tables);
    }
}

checkRLS();
