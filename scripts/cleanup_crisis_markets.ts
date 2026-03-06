import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase URL or Service Role Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupStaleMarkets() {
    console.log('🧹 Purging stale February 2026 markets (Uganda Election, Grammys)...');

    // Remove Uganda Election Market
    const ugandaRes = await supabase
        .from('markets')
        .delete()
        .ilike('question', '%Ugandan Presidential Election%');

    console.log("Uganda Election Deletion Response:", ugandaRes.error ? "Failed" : "Success");

    // Remove Grammys Market
    const grammyRes = await supabase
        .from('markets')
        .delete()
        .ilike('question', '%Grammy%');

    console.log("Grammy Deletion Response:", grammyRes.error ? "Failed" : "Success");

    console.log('✅ Cleanup complete.');
}

cleanupStaleMarkets();
