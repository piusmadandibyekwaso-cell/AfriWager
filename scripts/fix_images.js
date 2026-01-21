
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables (Role Key needed for update)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const UPDATES = [
    {
        pattern: "Will Nigeria's GDP grow",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Flag_of_Nigeria.svg/1200px-Flag_of_Nigeria.svg.png"
    },
    {
        pattern: "Will Nigeria's Year-on-Year Inflation",
        image: "https://cdn-icons-png.flaticon.com/512/2454/2454282.png"
    },
    {
        pattern: "Official NGN/USD rate",
        image: "https://img.freepik.com/premium-vector/nigeria-currency-symbol-ngn-naira-money-sign-vector-illustration-iso-4217_762744-245.jpg"
    },
    {
        pattern: "USD/UGX exchange rate",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Flag_of_Uganda.svg/2560px-Flag_of_Uganda.svg.png"
    },
    {
        pattern: "Starlink be officially live",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Starlink_Logo.svg/2560px-Starlink_Logo.svg.png"
    },
    {
        pattern: "ANC win more than 40%",
        image: "https://upload.wikimedia.org/wikipedia/commons/a/af/Flag_of_South_Africa.svg"
    }
];

async function fixImages() {
    console.log('🎨 Starting Image Repair Operation...');

    for (const item of UPDATES) {
        // Find ID first
        const { data: markets, error: findError } = await supabase
            .from('markets')
            .select('id, question')
            .ilike('question', `%${item.pattern}%`)
            .limit(1);

        if (findError) {
            console.error('Find Error:', findError);
            continue;
        }

        if (markets && markets.length > 0) {
            const market = markets[0];
            console.log(`Found market: "${market.question}". Fixing image...`);

            const { error: updateError } = await supabase
                .from('markets')
                .update({ image_url: item.image })
                .eq('id', market.id);

            if (updateError) console.error(`Failed to update ${market.id}:`, updateError);
            else console.log(`✅ Fixed image for: ${market.question.substring(0, 30)}...`);
        } else {
            console.log(`❌ Market not found for pattern: "${item.pattern}"`);
        }
    }
    console.log('✨ Image Repair Complete.');
}

fixImages().catch(console.error);
