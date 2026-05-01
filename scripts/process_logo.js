const fs = require('fs');
const Jimp = require('jimp');

async function main() {
    try {
        console.log("Loading uploaded image...");
        const imagePath = 'C:/Users/DELL/.gemini/antigravity/brain/1b9568f0-51d6-4d77-95d1-44ab56b75ac1/uploaded_media_1773348218636.jpg';
        const image = await Jimp.read(imagePath);

        let r_sum = 0, g_sum = 0, b_sum = 0, count = 0;

        // Find average color of the bright parts (the green bars)
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
            const r = this.bitmap.data[idx];
            const g = this.bitmap.data[idx + 1];
            const b = this.bitmap.data[idx + 2];
            const brightness = Math.max(r, g, b); // The green is very bright, black is ~0
            if (brightness > 100) {
                r_sum += r; g_sum += g; b_sum += b; count++;
            }
        });

        let r_avg = 16, g_avg = 185, b_avg = 129; // Fallback to emerald (#10b981)
        if (count > 0) {
            r_avg = Math.round(r_sum / count);
            g_avg = Math.round(g_sum / count);
            b_avg = Math.round(b_sum / count);
        }

        console.log(`Detected logo color: rgb(${r_avg}, ${g_avg}, ${b_avg})`);

        // Process alpha: we use the green channel (or max brightness) as the alpha mask
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
            const r = this.bitmap.data[idx];
            const g = this.bitmap.data[idx + 1];
            const b = this.bitmap.data[idx + 2];

            // Brightness becomes opacity. This preserves anti-aliasing edges perfectly.
            const alpha = Math.max(r, g, b);

            this.bitmap.data[idx] = r_avg;     // R
            this.bitmap.data[idx + 1] = g_avg; // G
            this.bitmap.data[idx + 2] = b_avg; // B
            this.bitmap.data[idx + 3] = alpha; // Alpha
        });

        // Crop excess transparent space
        image.autocrop();

        await image.writeAsync('./public/logo_v3.png');
        console.log("✅ Saved public/logo_v3.png");

        // Export an app icon with the dark background intact for places that need it (OpenGraph/Apple)
        const darkBgLogo = await Jimp.read(imagePath);
        darkBgLogo.autocrop();

        // Favicon (transparent) 32x32
        const favicon = image.clone().scaleToFit(32, 32);
        await favicon.writeAsync('./public/favicon.ico');

        // Icon for Next.js App directory (transparent)
        const appIcon = image.clone().scaleToFit(512, 512);
        await appIcon.writeAsync('./src/app/icon.png');

        console.log("✅ Saved icons (favicon.ico and src/app/icon.png).");
    } catch (e) {
        console.error("❌ Error processing logo:", e);
    }
}

main();
