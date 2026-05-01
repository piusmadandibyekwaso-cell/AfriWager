const fs = require('fs');
const path = require('path');

const TARGET_DIR = path.resolve(__dirname, '../public/market-images');

if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
}

// Map of filenames to "Labels" for the placeholder
const assets = {
    'crisis_nigeria.svg': 'Nigeria Fuel',
    'crisis_ghana.svg': 'Ghana Inflation',
    'crisis_kenya.svg': 'Kenya CBK Rates',
    'crisis_zar.svg': 'South Africa ZAR',
    'crisis_brent.svg': 'Brent Crude Oil'
};

// Institutional / Crisis Color Palette (Deep Oranges, Reds, Grays, Greens)
const colors = ['#ef4444', '#f59e0b', '#dc2626', '#3b82f6', '#10b981'];

// Simple SVG Generator
function generateSVG(text, color) {
    return `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${color}"/>
        <text x="50%" y="50%" font-family="monospace, Arial" font-size="60" fill="white" font-weight="bold" text-anchor="middle" dy=".3em">${text}</text>
        <text x="50%" y="65%" font-family="monospace, Arial" font-size="25" fill="white" text-anchor="middle" opacity="0.8">Macro Crisis Market</text>
    </svg>`;
}

async function run() {
    console.log("🎨 Generating FinTech SVG Placeholders for Crisis Markets...");

    Object.keys(assets).forEach((filename, index) => {
        const filePath = path.join(TARGET_DIR, filename);
        const color = colors[index % colors.length];
        const svgContent = generateSVG(assets[filename], color);

        fs.writeFileSync(filePath, svgContent);
        console.log(`✅ Generated: ${filename}`);
    });
}

run();
