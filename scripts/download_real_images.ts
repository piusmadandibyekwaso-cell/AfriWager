import fs from 'fs';
import path from 'path';

async function downloadImage(url: string, filename: string) {
    console.log(`Downloading ${url}...`);
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const dest = path.join('public', 'markets', filename);
    fs.writeFileSync(dest, Buffer.from(buffer));
    console.log(`✅ Saved to ${dest} (${buffer.byteLength} bytes)`);
}

async function run() {
    try {
        if (!fs.existsSync('public/markets')) {
            fs.mkdirSync('public/markets', { recursive: true });
        }

        // 1. Parliament of Uganda (Real Photo via Wikimedia CDN)
        await downloadImage(
            'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Parliament_of_Uganda_Building_Kampala.jpg/800px-Parliament_of_Uganda_Building_Kampala.jpg',
            'parliament.png'
        );

        // 2. General Muhoozi (Real Photo via X/Twitter CDN)
        await downloadImage(
            'https://pbs.twimg.com/media/FPs5f-qXMAA-k8y?format=jpg&name=large',
            'muhoozi.png'
        );

        console.log("🚀 All real images downloaded successfully.");
    } catch (e) {
        console.error("❌ Error downloading images:", e);
        process.exit(1);
    }
}

run();
