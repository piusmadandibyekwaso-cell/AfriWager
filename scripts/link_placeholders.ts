import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const LOCAL_PATH_PREFIX = '/market-images/';

// Mapping of original JPG name -> New SVG name (if we generated a placeholder)
const fallbacks = [
    { pattern: 'Ugandan', file: 'uganda_election.svg' },
    { pattern: 'Ghana', file: 'ghana_inflation.svg' },
    { pattern: 'ANC', file: 'sa_anc.svg' },
    { pattern: 'Pamoja', file: 'afcon_stadium.svg' },
    { pattern: 'Salah', file: 'salah.svg' },
    { pattern: 'Dricus', file: 'dricus.svg' },
    { pattern: 'Ethiopian', file: 'ethiopia_birr.svg' },
    { pattern: 'Dangote', file: 'dangote.svg' },
    { pattern: 'M-Pesa', file: 'mpesa.svg' },
    { pattern: 'Burna', file: 'burna_boy.svg' },
    { pattern: 'Starlink', file: 'starlink.svg' }
];

async function updateToFallbacks() {
    console.log("🔄 Linking Database to Generated Placeholders...");

    for (const item of fallbacks) {
        // Only update if I verify the SVG exists? 
        // For this script, we assume generate_placeholders.js ran.

        const newUrl = `${LOCAL_PATH_PREFIX}${item.file}`;

        const { error } = await supabase
            .from('markets')
            .update({ image_url: newUrl })
            .ilike('question', `%${item.pattern}%`);

        if (error) console.error(`Error updating ${item.pattern}:`, error.message);
        else console.log(`✅ Linked ${item.pattern} -> ${newUrl}`);
    }
}

updateToFallbacks();
