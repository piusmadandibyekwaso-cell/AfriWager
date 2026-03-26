const fs = require('fs');
const path = require('path');

const TARGET_DIR = path.resolve(__dirname, '../public/market-images/ea');

if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
}

const assets = {
    "ea_ug_who": "UG Healthcare",
    "ea_ug_statue": "Entebbe Statue",
    "ea_ug_bobi": "Bobi Wine Return",
    "ea_ug_fuel": "UG Fuel Reserves",
    "ea_ug_export": "UG Exports +80%",
    "ea_ug_vipers": "Vipers SC UPL",
    "ea_ug_kcca": "KCCA Top 3",
    "ea_ug_villa": "SC Villa Cup",
    "ea_ug_refs": "FUFA Referees",
    "ea_ug_hoima": "Hoima FIBA",
    "ea_ug_litd": "UG Theatre 10k",
    "ea_ug_afro": "UG Afrobeats Top50",
    "ea_ug_marathon": "Mbarara Marathon",
    "ea_ke_gachagua": "DP Gachagua",
    "ea_ke_uda": "UDA Merger",
    "ea_ke_strikes": "KE Strikes",
    "ea_ke_floods": "NBO Floods",
    "ea_ke_flowers": "KE Flowers $5M",
    "ea_ke_starlets": "Harambee Starlets",
    "ea_ke_golf": "Kibugu OWGR",
    "ea_ke_stadium": "Talanta Stadium",
    "ea_ke_azziad": "Azziad Award",
    "ea_ke_kalasha": "Kalasha 1M",
    "ea_sa_masemola": "SA Masemola",
    "ea_sa_da": "SA DA Vote",
    "ea_sa_afcon": "SA Women's AFCON",
    "ea_sa_proteas": "Proteas T20",
    "ea_ng_opl": "NG OPL 245",
    "ea_ng_wheelchair": "NG Wheelchair",
    "ea_ng_osimhen": "Osimhen EPL"
};

const colors = ['#dc2626', '#16a34a', '#2563eb', '#ca8a04', '#9333ea', '#db2777', '#0891b2', '#ea580c'];

function generateSVG(text, color) {
    return `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${color}"/>
        <text x="50%" y="50%" font-family="monospace, Arial" font-size="55" fill="white" font-weight="bold" text-anchor="middle" dy=".3em">${text}</text>
        <text x="50%" y="65%" font-family="monospace, Arial" font-size="25" fill="white" text-anchor="middle" opacity="0.8">AfriWager Local Market</text>
    </svg>`;
}

async function run() {
    console.log("🎨 Generating SVG Placeholders for 30 EA Markets...");
    let idx = 0;
    Object.keys(assets).forEach((filename) => {
        const filePath = path.join(TARGET_DIR, filename + '.svg');
        const color = colors[idx % colors.length];
        const svgContent = generateSVG(assets[filename], color);
        fs.writeFileSync(filePath, svgContent);
        console.log(`✅ Generated: ${filename}.svg`);
        idx++;
    });
}
run();
