
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// DUPLICATE logic from src/utils/marketImageGenerator.ts 
// (Since we can't easily import TS into this JS script without build steps)
const IMAGE_MAP = {
    'Tinubu': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Bola_Tinubu_portrait.jpg/640px-Bola_Tinubu_portrait.jpg',
    'Seyi Tinubu': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Lagos_State_flag.png/640px-Lagos_State_flag.png',
    'Joshua Baraka': 'https://softpower.ug/wp-content/uploads/2024/05/Joshua-Baraka.jpg',
    'Museveni': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Yoweri_Museveni_2015.jpg/640px-Yoweri_Museveni_2015.jpg',
    'Ruto': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/William_Ruto_2022.jpg/640px-William_Ruto_2022.jpg',
    'Ramaphosa': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Cyril_Ramaphosa_in_2018.jpg/640px-Cyril_Ramaphosa_in_2018.jpg',
    'Malema': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Umkhonto_weSizwe_Party_Logo.png/640px-Umkhonto_weSizwe_Party_Logo.png',

    'Starlink': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Starlink_Logo.svg/2560px-Starlink_Logo.svg.png',
    'Glovo': 'https://upload.wikimedia.org/wikipedia/en/thumb/8/82/Glovo_logo.svg/1200px-Glovo_logo.svg.png',
    'Bitcoin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Bitcoin.svg/1200px-Bitcoin.svg.png',
    'Billboard': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Billboard_logo_2013.svg/1024px-Billboard_logo_2013.svg.png',
    'Grammy': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Grammy_Awards_logo_2023.svg/1024px-Grammy_Awards_logo_2023.svg.png',

    'African Union': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Flag_of_the_African_Union.svg/1200px-Flag_of_the_African_Union.svg.png',
    'ANC': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/African_National_Congress_logo.svg/1200px-African_National_Congress_logo.svg.png',
    'MK Party': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Umkhonto_weSizwe_Party_Logo.png/640px-Umkhonto_weSizwe_Party_Logo.png',
    'SEC': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Flag_of_Nigeria.svg/1200px-Flag_of_Nigeria.svg.png',

    // NATIONAL (Lower Priority)
    'Uganda': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Flag_of_Uganda.svg/2560px-Flag_of_Uganda.svg.png',
    'Nigeria': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Flag_of_Nigeria.svg/1200px-Flag_of_Nigeria.svg.png',
    'South Africa': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Flag_of_South_Africa.svg/1200px-Flag_of_South_Africa.svg.png',
    'Zimbabwe': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Flag_of_Zimbabwe.svg/1200px-Flag_of_Zimbabwe.svg.png',

    'GDP': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/GDP_per_capita_development_in_Africa.svg/2560px-GDP_per_capita_development_in_Africa.svg.png',
    'Inflation': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/CBN_logo.svg/1200px-CBN_logo.svg.png',
    'NGN/USD': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Flag_of_Nigeria.svg/1200px-Flag_of_Nigeria.svg.png',
    'USD/UGX': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Flag_of_Uganda.svg/2560px-Flag_of_Uganda.svg.png',
    'PMS': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/NNPC_Logo.svg/1200px-NNPC_Logo.svg.png',
    'Petrol': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/NNPC_Logo.svg/1200px-NNPC_Logo.svg.png',
    'Gold-backed': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Flag_of_Zimbabwe.svg/1200px-Flag_of_Zimbabwe.svg.png',

    'AFCON': 'https://www.cafonline.com/media/ylplke4l/itri-hd.jpg',
    'World Cup': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/2026_FIFA_World_Cup_logo.svg/1200px-2026_FIFA_World_Cup_logo.svg.png',
    'Grammys': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Grammy_Awards_logo_2023.svg/1024px-Grammy_Awards_logo_2023.svg.png',
    'Tech Fest': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Lagos_State_flag.png/640px-Lagos_State_flag.png'
};

const CATEGORY_DEFAULTS = {
    'Politics': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Flag_of_the_African_Union.svg/1200px-Flag_of_the_African_Union.svg.png',
    'Economics': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Africa_satellite_orthographic_runin.jpg/1024px-Africa_satellite_orthographic_runin.jpg',
    'Sports': 'https://www.cafonline.com/media/ylplke4l/itri-hd.jpg',
    'Technology': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Starlink_Logo.svg/2560px-Starlink_Logo.svg.png',
    'Crypto': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Bitcoin.svg/1200px-Bitcoin.svg.png'
};

function resolveImage(question, category) {
    const qLower = question.toLowerCase();

    // STRICT CHECK: Personas First
    for (const [key, url] of Object.entries(IMAGE_MAP)) {
        if (qLower.includes(key.toLowerCase())) {
            return url;
        }
    }

    // Category Fallback
    if (CATEGORY_DEFAULTS[category]) return CATEGORY_DEFAULTS[category];

    // Absolute Fallback
    return "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Africa_satellite_orthographic_runin.jpg/1024px-Africa_satellite_orthographic_runin.jpg";
}

async function run() {
    console.log("🔍 Fetching markets...");
    const { data: markets, error } = await supabase.from('markets').select('*');

    if (error) {
        console.error("Error fetching markets:", error);
        return;
    }

    console.log(`🔍 Found ${markets.length} markets. processing...`);

    for (const market of markets) {
        // Resolve Best Fit Image
        const bestFitUrl = resolveImage(market.question, market.category);

        // Update DB regardless (to enforce permanence)
        const { error: updateError } = await supabase
            .from('markets')
            .update({ image_url: bestFitUrl })
            .eq('id', market.id);

        if (updateError) {
            console.error(`❌ Failed to update ${market.id}:`, updateError);
        } else {
            console.log(`✅ Updated: "${market.question.substring(0, 30)}..." -> ${bestFitUrl.substring(0, 40)}...`);
        }
    }
}

run();
