import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verify() {
    console.log("🔍 Verifying 2026 Markets...");
    const { data, error } = await supabase
        .from('markets')
        .select('question, end_date')
        .gt('end_date', '2026-01-01');

    if (error) console.error("Error:", error);
    else {
        console.log(`✅ Found ${data?.length} markets for 2026:`);
        data?.forEach(m => console.log(`- ${m.question} (Ends: ${m.end_date})`));
    }
}

verify();
