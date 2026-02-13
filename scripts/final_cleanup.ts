import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function finalCleanup() {
    console.log("🧹 Starting Final Cleanup (JS Filter Method)...");

    // 1. Fetch ALL markets
    const { data: markets, error } = await supabase
        .from('markets')
        .select('id, question');

    if (error) {
        console.error("❌ Error fetching markets:", error);
        return;
    }

    // 2. Filter for Mock IDs (550e8400...)
    const mockMarkets = markets.filter(m => m.id.startsWith('550e8400'));
    const mockIds = mockMarkets.map(m => m.id);

    console.log(`Found ${mockIds.length} Mock Markets to delete.`);

    if (mockIds.length > 0) {
        // Delete in batches or all at once (Supabase handles large arrays well usually, but let's be safe)
        const { error: deleteError } = await supabase
            .from('markets')
            .delete()
            .in('id', mockIds);

        if (deleteError) console.error("❌ Error deleting mocks:", deleteError);
        else console.log(`✅ Successfully deleted ${mockIds.length} mock markets.`);
    } else {
        console.log("No mock markets found.");
    }

    // 3. Double check for Institutional Demos
    const institutionalQuestions = [
        "Will the Bank of Uganda hold rates steady in Q1 2026?",
        "Will Uganda Inflation exceed 6.5% in Feb 2026?",
        "Will MTN Uganda (MTNU) share price hit 200 USh by Q2?",
        "Will Nigeria's CBDC (eNaira) adoption grow by 20% in 2026?"
    ];

    // Check if any still exist
    const { data: instMarkets } = await supabase
        .from('markets')
        .select('id, question')
        .in('question', institutionalQuestions);

    if (instMarkets && instMarkets.length > 0) {
        const instIds = instMarkets.map(m => m.id);
        const { error: instDeleteError } = await supabase
            .from('markets')
            .delete()
            .in('id', instIds);

        if (instDeleteError) console.error("❌ Error deleting inst markets:", instDeleteError);
        else console.log(`✅ Removed ${instIds.length} Lingering Institutional Markets.`);
    } else {
        console.log("No institutional markets found.");
    }
}

finalCleanup();
