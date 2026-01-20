
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase Config');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySchema() {
    console.log('🔍 Verifying markets table schema...');

    // Try to select the new columns
    const { data, error } = await supabase
        .from('markets')
        .select('id, question, yes_pool, no_pool')
        .limit(1);

    if (error) {
        console.error('❌ Schema Check Failed:', error.message);
        console.log('The columns likely do not exist yet.');
    } else {
        console.log('✅ Schema Check Passed!');
        console.log('Sample Data:', data);
    }
}

verifySchema();
