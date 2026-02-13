const fs = require('fs');
const path = require('path');

const TARGET_DIR = path.resolve(__dirname, '../public/market-images');

if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
}

// Map of filenames to "Labels" for the placeholder
const assets = {
    'uganda_election.svg': 'Uganda 2026',
    'ghana_inflation.svg': 'Ghana Economy',
    'sa_anc.svg': 'SA Politics',
    'afcon_stadium.svg': 'AFCON 2027',
    'salah.svg': 'Mo Salah',
    'dricus.svg': 'Dricus UFC',
    'ethiopia_birr.svg': 'Ethiopia Birr',
    'dangote.svg': 'Dangote Refinery',
    'mpesa.svg': 'M-Pesa Banking',
    'burna_boy.svg': 'Burna Boy',
    'starlink.svg': 'Starlink Africa'
};

// Simple SVG Generator
function generateSVG(text, color) {
    return `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${color}"/>
        <text x="50%" y="50%" font-family="Arial" font-size="60" fill="white" font-weight="bold" text-anchor="middle" dy=".3em">${text}</text>
        <text x="50%" y="65%" font-family="Arial" font-size="30" fill="white" text-anchor="middle" opacity="0.8">AfriWager Market</text>
    </svg>`;
}

const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

async function run() {
    console.log("🎨 FORCE Generating Labeled Placeholders...");

    Object.keys(assets).forEach((filename, index) => {
        const filePath = path.join(TARGET_DIR, filename);
        const color = colors[index % colors.length];
        const svgContent = generateSVG(assets[filename], color);

        fs.writeFileSync(filePath, svgContent);
        console.log(`✅ Generated: ${filename}`);
    });
}

run();
