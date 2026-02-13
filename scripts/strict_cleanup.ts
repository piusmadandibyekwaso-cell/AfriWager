import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function strictCleanup() {
    console.log("🧹 Starting Strict Cleanup...");

    // 1. Delete Mock Markets (Hardcoded IDs from seed.ts start with 550e8400)
    const { count: mockCount, error: mockError } = await supabase
        .from('markets')
        .delete({ count: 'exact' })
        .like('id', '550e8400%');

    if (mockError) console.error("Error deleting mocks:", mockError);
    else console.log(`✅ Removed ${mockCount} Mock Markets (ID: 550e8400...)`);

    // 2. Delete Institutional Demo Markets (Specific questions)
    const institutionalQuestions = [
        "Will the Bank of Uganda hold rates steady in Q1 2026?",
        "Will Uganda Inflation exceed 6.5% in Feb 2026?",
        "Will MTN Uganda (MTNU) share price hit 200 USh by Q2?",
        "Will Nigeria's CBDC (eNaira) adoption grow by 20% in 2026?"
    ];

    const { count: instCount, error: instError } = await supabase
        .from('markets')
        .delete({ count: 'exact' })
        .in('question', institutionalQuestions);

    if (instError) console.error("Error deleting institutional markets:", instError);
    else console.log(`✅ Removed ${instCount} Institutional Demo Markets.`);
}

strictCleanup();
