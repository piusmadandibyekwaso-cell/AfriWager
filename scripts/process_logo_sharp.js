const sharp = require('sharp');
const fs = require('fs');

async function processLogo() {
    try {
        const imagePath = 'C:/Users/DELL/.gemini/antigravity/brain/1b9568f0-51d6-4d77-95d1-44ab56b75ac1/uploaded_media_1773348218636.jpg';

        console.log("Loading uploaded image into Sharp...");
        // Read raw pixels
        const { data, info } = await sharp(imagePath)
            .ensureAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });

        // info.channels should be 4 (RGBA)
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Use max RGB as brightness for the alpha mask to preserve anti-aliasing
            const brightness = Math.max(r, g, b);

            // Enforce the AfriWager Emerald Green (#10b981)
            data[i] = 16;     // R
            data[i + 1] = 185; // G
            data[i + 2] = 129; // B
            data[i + 3] = brightness; // Alpha
        }

        console.log("Creating transparent PNG and Icons...");
        // Write back to a PNG
        await sharp(data, {
            raw: {
                width: info.width,
                height: info.height,
                channels: 4
            }
        })
            .trim() // Auto-crop empty space
            .png()
            .toFile('./public/logo_v3.png');

        console.log("✅ Saved /public/logo_v3.png");

        // Favicon
        await sharp('./public/logo_v3.png')
            .resize(32, 32)
            .toFile('./public/favicon.ico');
        console.log("✅ Saved /public/favicon.ico");

        // App icon
        await sharp('./public/logo_v3.png')
            .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .toFile('./src/app/icon.png');
        console.log("✅ Saved /src/app/icon.png");

    } catch (e) {
        console.error("❌ Error processing logo with Sharp:", e);
    }
}

processLogo();
