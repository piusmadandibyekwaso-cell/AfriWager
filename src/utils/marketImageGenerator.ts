
// Reliable, Hotlink-Safe Image Sources (Wikimedia/Wikipedia)
const IMAGE_MAP: Record<string, string> = {
    // PERSONALITIES
    'Tinubu': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Bola_Tinubu_portrait.jpg/640px-Bola_Tinubu_portrait.jpg',
    'Seyi Tinubu': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Lagos_State_flag.png/640px-Lagos_State_flag.png',
    'Joshua Baraka': 'https://softpower.ug/wp-content/uploads/2024/05/Joshua-Baraka.jpg',
    'Museveni': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Yoweri_Museveni_2015.jpg/640px-Yoweri_Museveni_2015.jpg',
    'Ruto': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/William_Ruto_2022.jpg/640px-William_Ruto_2022.jpg',

    // BRANDS & COMPANIES
    'Starlink': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Starlink_Logo.svg/2560px-Starlink_Logo.svg.png',
    'Glovo': 'https://upload.wikimedia.org/wikipedia/en/thumb/8/82/Glovo_logo.svg/1200px-Glovo_logo.svg.png',
    'Bitcoin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Bitcoin.svg/1200px-Bitcoin.svg.png',
    'Billboard': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Billboard_logo_2013.svg/1024px-Billboard_logo_2013.svg.png',

    // ORGANIZATIONS & ENTITIES
    'African Union': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Flag_of_the_African_Union.svg/1200px-Flag_of_the_African_Union.svg.png',
    'ANC': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/African_National_Congress_logo.svg/1200px-African_National_Congress_logo.svg.png',
    'MK Party': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Umkhonto_weSizwe_Party_Logo.png/640px-Umkhonto_weSizwe_Party_Logo.png',
    'SEC': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Flag_of_Nigeria.svg/1200px-Flag_of_Nigeria.svg.png',

    // CONCEPTS & ECONOMICS
    'GDP': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/GDP_per_capita_development_in_Africa.svg/2560px-GDP_per_capita_development_in_Africa.svg.png',
    'Inflation': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/CBN_logo.svg/1200px-CBN_logo.svg.png',
    'NGN/USD': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Flag_of_Nigeria.svg/1200px-Flag_of_Nigeria.svg.png',
    'USD/UGX': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Flag_of_Uganda.svg/2560px-Flag_of_Uganda.svg.png',
    'PMS': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/NNPC_Logo.svg/1200px-NNPC_Logo.svg.png',
    'Petrol': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/NNPC_Logo.svg/1200px-NNPC_Logo.svg.png',
    'Gold-backed': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Flag_of_Zimbabwe.svg/1200px-Flag_of_Zimbabwe.svg.png',

    // EVENTS
    'AFCON': 'https://www.cafonline.com/media/ylplke4l/itri-hd.jpg',
    'World Cup': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/2026_FIFA_World_Cup_logo.svg/1200px-2026_FIFA_World_Cup_logo.svg.png',
    'Grammys': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Grammy_Awards_logo_2023.svg/1024px-Grammy_Awards_logo_2023.svg.png',
    'Tech Fest': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Lagos_State_flag.png/640px-Lagos_State_flag.png'
};

const CATEGORY_DEFAULTS: Record<string, string> = {
    'Politics': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Flag_of_the_African_Union.svg/1200px-Flag_of_the_African_Union.svg.png',
    'Economics': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Africa_satellite_orthographic_runin.jpg/1024px-Africa_satellite_orthographic_runin.jpg',
    'Sports': 'https://www.cafonline.com/media/ylplke4l/itri-hd.jpg',
    'Technology': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Starlink_Logo.svg/2560px-Starlink_Logo.svg.png',
    'Crypto': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Bitcoin.svg/1200px-Bitcoin.svg.png'
};

export function getMarketImage(question: string, category: string, currentImage?: string): string {
    // 1. If current image is valid (not empty, not default placeholder), use it? 
    // Actually, user wants "best fit" regardless. But let's verify if current is broken.
    // For now, we prioritize keyword matches if they exist, as they are "High Quality" overrides.

    const qLower = question.toLowerCase();

    // 2. Keyword Matching (Specific -> General)
    for (const [key, url] of Object.entries(IMAGE_MAP)) {
        if (qLower.includes(key.toLowerCase())) {
            return url;
        }
    }

    // 3. Fallback to Category Default
    if (CATEGORY_DEFAULTS[category]) {
        return CATEGORY_DEFAULTS[category];
    }

    // 4. Absolute Fallback (Africa Map)
    return "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Africa_satellite_orthographic_runin.jpg/1024px-Africa_satellite_orthographic_runin.jpg";
}
