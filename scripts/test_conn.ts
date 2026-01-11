
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
    try {
        const { data, error } = await supabase.from('profiles').select('*').limit(1);
        if (error) {
            console.error('Supabase error:', error.message);
        } else {
            console.log('Supabase connection successful! Data:', data);
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

testConnection();
