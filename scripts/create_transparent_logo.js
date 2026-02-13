const Jimp = require('jimp');
const path = require('path');

const srcPath = path.join(__dirname, '../public/app_icon_512.png');
const destPath = path.join(__dirname, '../public/logo.png');

async function processImage() {
    try {
        console.log(`Reading image from ${srcPath}...`);
        const image = await Jimp.read(srcPath);

        // Iterate over all pixels
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
            // Get pixel color
            const red = this.bitmap.data[idx + 0];
            const green = this.bitmap.data[idx + 1];
            const blue = this.bitmap.data[idx + 2];
            const alpha = this.bitmap.data[idx + 3];

            // If pixel is black (or near black), make it transparent
            // Threshold: R, G, B < 30
            if (red < 30 && green < 30 && blue < 30) {
                this.bitmap.data[idx + 3] = 0; // Set Alpha to 0 (Transparent)
            }
        });

        console.log(`Writing transparent logo to ${destPath}...`);
        await image.writeAsync(destPath);
        console.log("✅ Success: Created transparent logo.png");

    } catch (err) {
        console.error("❌ Error processing image:", err);
    }
}

processImage();
