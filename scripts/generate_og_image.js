const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const svgPath = path.join(__dirname, '../public/logo_final.svg');
const ogPath = path.join(__dirname, '../src/app/opengraph-image.png');

async function createOGImage() {
    try {
        console.log(`Generating new OpenGraph image...`);

        // 1. Convert SVG to a specific size (e.g. 500x500 to fit inside 630 height)
        const logoBuffer = await sharp(svgPath)
            .resize(500, 500, { fit: 'contain' })
            .png()
            .toBuffer();

        // 2. Create the 1200x630 background and composite
        await sharp({
            create: {
                width: 1200,
                height: 630,
                channels: 4,
                background: { r: 11, g: 11, b: 11, alpha: 1 } // #0B0B0B
            }
        })
            .composite([{ input: logoBuffer, gravity: 'center' }])
            .png()
            .toFile(ogPath);

        console.log(`✅ Success: Generated ${ogPath}`);
    } catch (err) {
        console.error("❌ Error generating OG image:", err);
    }
}

createOGImage();
