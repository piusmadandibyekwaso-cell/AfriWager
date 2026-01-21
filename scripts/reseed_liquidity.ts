
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Using Service Role Key for Update

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function reseedLiquidity() {
    console.log('💧 Starting Retroactive Liquidity Seeding (Flood 500)...');

    // 1. Fetch all current markets
    const { data: markets, error } = await supabase
        .from('markets')
        .select('id, yes_pool, no_pool, question');

    if (error) {
        console.error('Error fetching markets:', error);
        return;
    }

    console.log(`Found ${markets.length} markets. Checking liquidity levels...`);

    const LIQUIDITY_FLOOR = 500;

    for (const market of markets) {
        const curYes = Number(market.yes_pool) || 0;
        const curNo = Number(market.no_pool) || 0;

        if (curYes < LIQUIDITY_FLOOR || curNo < LIQUIDITY_FLOOR) {
            console.log(`⚠️ Market "${market.question.substring(0, 30)}..." has low liquidity (${curYes}/${curNo}). Seeding to ${LIQUIDITY_FLOOR}...`);

            const { error: updateError } = await supabase
                .from('markets')
                .update({
                    yes_pool: LIQUIDITY_FLOOR,
                    no_pool: LIQUIDITY_FLOOR,
                    // Optionally reset volume if it was just broken? No, keep volume.
                })
                .eq('id', market.id);

            if (updateError) {
                console.error(`❌ Failed to update market ${market.id}:`, updateError);
            } else {
                console.log(`✅ Seeded Market ${market.id} to 500/500.`);
            }
        } else {
            console.log(`✅ Market "${market.question.substring(0, 30)}..." is healthy (${curYes}/${curNo}).`);
        }
    }

    console.log('🌊 Liquidity Re-Seeding Complete.');
}

reseedLiquidity().catch(console.error);
