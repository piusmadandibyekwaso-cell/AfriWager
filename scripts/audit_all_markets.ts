import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function listAllMarkets() {
    console.log("🔍 Listing ALL Markets in DB...");
    const { data, error } = await supabase
        .from('markets')
        .select('id, question, end_date, created_at')
        .order('end_date', { ascending: true });

    if (error) console.error("Error:", error);
    else {
        console.log(`📊 Total Markets: ${data?.length}`);
        data?.forEach(m => {
            console.log(`[${m.id.substring(0, 8)}] ${m.question} \n   Ends: ${m.end_date} | Created: ${m.created_at}`);
        });
    }
}

listAllMarkets();
