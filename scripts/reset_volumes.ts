
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetVolumes() {
    console.log('🔄 Starting Volume Reset...');

    // 1. Fetch all OPEN markets
    const { data: markets, error: fetchError } = await supabase
        .from('markets')
        .select('*')
        .eq('status', 'OPEN');

    if (fetchError) {
        console.error('Error fetching markets:', fetchError);
        return;
    }

    if (!markets || markets.length === 0) {
        console.log('No open markets found.');
        return;
    }

    console.log(`Found ${markets.length} markets to reset.`);

    // 2. Iterate and Reset
    for (const market of markets) {
        // Skip if volume is already 0
        if (market.total_volume_usdc === 0) {
            console.log(`Skipping ${market.id} (already 0)`);
            continue;
        }

        console.log(`Resetting volume for: ${market.question.substring(0, 30)}... (${market.total_volume_usdc})`);

        // A. Delete
        const { error: deleteError } = await supabase
            .from('markets')
            .delete()
            .eq('id', market.id);

        if (deleteError) {
            console.error(`❌ Failed to delete ${market.id}:`, deleteError.message);
            // If delete fails (e.g. constraints), we can't proceed with re-insert for this one.
            continue;
        }

        // B. Re-insert with 0 volume
        const { total_volume_usdc, created_at, ...marketData } = market;
        const { error: insertError } = await supabase
            .from('markets')
            .insert({
                ...marketData,
                total_volume_usdc: 0,
                // We let created_at update or keep it? Ideally keep it but letting it refresh is fine for now.
                // Or explicitly set it if we captured it.
            });

        if (insertError) {
            console.error(`❌ Failed to re-insert ${market.id}:`, insertError.message);
            // This is bad, we lost a market! (In a real persisted prod env we'd wrap in transaction if possible)
        } else {
            console.log(`✅ Reset ${market.id}`);
        }

        // Small delay to be nice to the API
        await new Promise(r => setTimeout(r, 200));
    }

    console.log('🎉 Volume reset complete.');
}

resetVolumes().catch(console.error);
