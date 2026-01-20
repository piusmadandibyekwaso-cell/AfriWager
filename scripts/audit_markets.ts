
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role to see everything

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase Config');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listMarkets() {
    console.log('--- Database Markets Audit ---');
    const { data, error } = await supabase.from('markets').select('id, question, status');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${data.length} markets:`);
    data.forEach(m => {
        console.log(`[${m.status}] ID: ${m.id} - ${m.question}`);
    });
}

listMarkets();
