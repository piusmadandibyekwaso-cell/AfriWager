
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Reliable Wikipedia/Wikimedia URLs (Hotlink Safe)
const UPDATES = [
    {
        pattern: "Year-on-Year Inflation",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/CBN_logo.svg/1200px-CBN_logo.svg.png" // Central Bank of Nigeria
    },
    {
        pattern: "Official NGN/USD rate",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Flag_of_Nigeria.svg/1200px-Flag_of_Nigeria.svg.png"
    },
    {
        pattern: "Starlink be officially live",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Starlink_Logo.svg/2560px-Starlink_Logo.svg.png"
    },
    {
        pattern: "Nigerian artist win",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Grammy_Awards_logo_2023.svg/1024px-Grammy_Awards_logo_2023.svg.png"
    },
    {
        pattern: "MK Party win the majority",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Umkhonto_weSizwe_Party_Logo.png/640px-Umkhonto_weSizwe_Party_Logo.png"
    },
    {
        pattern: "President Tinubu replace",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Bola_Tinubu_portrait.jpg/640px-Bola_Tinubu_portrait.jpg"
    },
    {
        pattern: "Startup Act",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Flag_of_South_Africa.svg/1200px-Flag_of_South_Africa.svg.png"
    },
    {
        pattern: "African Union launch a biometric",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Flag_of_the_African_Union.svg/1200px-Flag_of_the_African_Union.svg.png"
    },
    {
        pattern: "Seyi Tinubu declare",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Lagos_State_flag.png/640px-Lagos_State_flag.png"
    },
    {
        pattern: "retail price of PMS",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/NNPC_Logo.svg/1200px-NNPC_Logo.svg.png"
    },
    {
        pattern: "Lagos Tech Fest",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Lagos_State_flag.png/640px-Lagos_State_flag.png"
    },
    {
        pattern: "Glovo officially exit",
        image: "https://upload.wikimedia.org/wikipedia/en/thumb/8/82/Glovo_logo.svg/1200px-Glovo_logo.svg.png"
    },
    {
        pattern: "Zimbabwe's Gold-backed currency",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Flag_of_Zimbabwe.svg/1200px-Flag_of_Zimbabwe.svg.png"
    },
    {
        pattern: "Sub-Saharan Africa average GDP",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Africa_satellite_orthographic_runin.jpg/1024px-Africa_satellite_orthographic_runin.jpg"
    }
];

async function fixImagesV2() {
    console.log('🎨 Starting Comprehensive Image Repair (V2)...');

    for (const item of UPDATES) {
        const { data: markets, error: findError } = await supabase
            .from('markets')
            .select('id, question')
            .ilike('question', `%${item.pattern}%`);

        if (findError) {
            console.error('Find Error:', findError);
            continue;
        }

        if (markets && markets.length > 0) {
            for (const market of markets) {
                console.log(`Fixing: "${market.question.substring(0, 40)}..."`);

                const { error: updateError } = await supabase
                    .from('markets')
                    .update({ image_url: item.image })
                    .eq('id', market.id);

                if (updateError) console.error(`❌ Failed:`, updateError);
                else console.log(`✅ Updated.`);
            }
        } else {
            console.log(`⚠️ Not Found: "${item.pattern}"`);
        }
    }
    console.log('✨ All Images Repaired.');
}

fixImagesV2().catch(console.error);
