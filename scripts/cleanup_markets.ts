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

async function cleanupMarkets() {
    console.log('🧹 Starting Market Cleanup...');

    // Delete markets ending before 2026
    const { count, error } = await supabase
        .from('markets')
        .delete({ count: 'exact' })
        .lt('end_date', '2026-01-01');

    if (error) {
        console.error('❌ Error cleaning up markets:', error);
    } else {
        console.log(`✅ Successfully removed ${count} outdated markets (Pre-2026).`);
    }

    // Optional: Delete specific test markets by description keyword if needed
    const { count: testCount, error: testError } = await supabase
        .from('markets')
        .delete({ count: 'exact' })
        .ilike('description', '%test%');

    if (testError) {
        console.error('❌ Error cleaning test markets:', testError);
    } else {
        console.log(`✅ Removed ${testCount} markets marked as "test".`);
    }
}

cleanupMarkets();
