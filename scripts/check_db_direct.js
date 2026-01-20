const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_ID = 'bafe735b-d40d-418d-a5b1-08a114fb09f4';

async function check() {
    console.log(`Checking Market ID: ${TARGET_ID}`);
    const { data, error } = await supabase
        .from('markets')
        .select('*')
        .eq('id', TARGET_ID)
        .single();

    if (error) {
        console.log("❌ Supabase Error/Not Found:", error.message);
    } else if (data) {
        console.log("✅ Market Found:", data.question);
    } else {
        console.log("❌ Market returned null");
    }
}

check();
