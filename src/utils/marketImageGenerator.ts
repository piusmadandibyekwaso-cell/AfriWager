
// Reliable, Copyright-Safe Image Sources (Wikimedia/Wikipedia)
const IMAGE_MAP: Record<string, string> = {
    // --- 1. PERSONAS (Highest Priority) ---
    // "If a topic is about Museveni, it should point out Museveni's picture"
    'Tinubu': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Bola_Tinubu_portrait.jpg/640px-Bola_Tinubu_portrait.jpg',
    'Seyi Tinubu': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Lagos_State_flag.png/640px-Lagos_State_flag.png', // Fallback for Seyi if no clear pic
    'Joshua Baraka': 'https://softpower.ug/wp-content/uploads/2024/05/Joshua-Baraka.jpg',
    'Parliament of Uganda': '/markets/parliament.png',
    'Anita Among': '/markets/parliament.png',
    'Osimhen': '/markets/osimhen.png',
    'Muhoozi': '/markets/muhoozi.png',

    // --- 2. BRANDS & SPECIFIC ENTITIES ---
    'Starlink': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Starlink_Logo.svg/2560px-Starlink_Logo.svg.png',
    'Glovo': 'https://upload.wikimedia.org/wikipedia/en/thumb/8/82/Glovo_logo.svg/1200px-Glovo_logo.svg.png',
    'Bitcoin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Bitcoin.svg/1200px-Bitcoin.svg.png',
    'Billboard': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Billboard_logo_2013.svg/1024px-Billboard_logo_2013.svg.png',
    'Grammy': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Grammy_Awards_logo_2023.svg/1024px-Grammy_Awards_logo_2023.svg.png',

    // --- 3. NATIONAL / BROAD CONCEPTS (Lower Priority) ---
    // Will only be picked if NO Persona is found.
    'Uganda': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Flag_of_Uganda.svg/2560px-Flag_of_Uganda.svg.png',
    'Nigeria': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Flag_of_Nigeria.svg/1200px-Flag_of_Nigeria.svg.png',
    'South Africa': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Flag_of_South_Africa.svg/1200px-Flag_of_South_Africa.svg.png',
    'Zimbabwe': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Flag_of_Zimbabwe.svg/1200px-Flag_of_Zimbabwe.svg.png',

    // --- 4. ECONOMICS ---
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
    const qLower = question.toLowerCase();

    // STRICT HIERARCHY:
    // 1. Iterate through IMAGE_MAP in defined order (Personas are at top).
    // The first match WINS.
    for (const [key, url] of Object.entries(IMAGE_MAP)) {
        if (qLower.includes(key.toLowerCase())) {
            // "Museveni" match returns here, ignoring "Uganda" further down.
            return url;
        }
    }

    // 2. Fallback to Category Default
    if (CATEGORY_DEFAULTS[category]) {
        return CATEGORY_DEFAULTS[category];
    }

    // 3. Absolute Fallback (Africa Map)
    return "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Africa_satellite_orthographic_runin.jpg/1024px-Africa_satellite_orthographic_runin.jpg";
}
