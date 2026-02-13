import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const LOCAL_PATH_PREFIX = '/market-images/';

const updates = [
    {
        pattern: 'Ugandan Presidential Election',
        filename: 'uganda_election.jpg'
    },
    {
        pattern: 'Ghana',
        filename: 'ghana_inflation.jpg'
    },
    {
        pattern: 'ANC',
        filename: 'sa_anc.jpg'
    },
    {
        pattern: 'Pamoja Bid',
        filename: 'afcon_stadium.jpg'
    },
    {
        pattern: 'Mohamed Salah',
        filename: 'salah.jpg'
    },
    {
        pattern: 'Dricus',
        filename: 'dricus.jpg'
    },
    {
        pattern: 'Ethiopian Birr',
        filename: 'ethiopia_birr.jpg'
    },
    {
        pattern: 'Dangote',
        filename: 'dangote.jpg'
    },
    {
        pattern: 'M-Pesa',
        filename: 'mpesa.jpg'
    },
    {
        pattern: 'Burna Boy',
        filename: 'burna_boy.jpg'
    },
    {
        pattern: 'Starlink',
        filename: 'starlink.jpg'
    }
];

async function updateImages() {
    console.log("🖼️ Updating Market Images to Local Paths...");

    for (const update of updates) {
        // Find market by pattern
        const { data: markets, error: findError } = await supabase
            .from('markets')
            .select('id, question')
            .ilike('question', `%${update.pattern}%`);

        if (findError || !markets || markets.length === 0) {
            console.log(`⚠️ Market not found for pattern: "${update.pattern}"`);
            continue;
        }

        for (const market of markets) {
            // Update
            const newUrl = `${LOCAL_PATH_PREFIX}${update.filename}`;
            const { error: updateError } = await supabase
                .from('markets')
                .update({ image_url: newUrl })
                .eq('id', market.id);

            if (updateError) {
                console.error(`❌ Failed to update ${market.question}:`, updateError.message);
            } else {
                console.log(`✅ Updated: "${market.question.substring(0, 30)}..." -> ${newUrl}`);
            }
        }
    }
}

updateImages();
