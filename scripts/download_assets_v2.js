const fs = require('fs');
const https = require('https');
const path = require('path');

const TARGET_DIR = path.resolve(__dirname, '../public/market-images');

if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
}

// User-Agent is critical for Wikimedia
const REQUEST_OPTIONS = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
};

const assets = [
    {
        filename: 'uganda_election.jpg',
        // Wikimedia: Museveni (Thumbnail URL is often safer/more direct)
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Yoweri_Museveni_September_2015.jpg/800px-Yoweri_Museveni_September_2015.jpg'
    },
    {
        filename: 'ghana_inflation.jpg',
        // Unsplash: Generic Market/Money (Corrected to 'images' with no fancy params or a known good one)
        // Using a reliable specific ID for "Market/Trade"
        url: 'https://images.unsplash.com/photo-1534951009668-7e0870c9eb87?q=80&w=1000&auto=format&fit=crop'
    },
    {
        filename: 'sa_anc.jpg',
        // Unsplash: South Africa Flag (Corrected)
        url: 'https://images.unsplash.com/photo-1580136608260-4eb11f4b64fe?q=80&w=1000&auto=format&fit=crop'
    },
    {
        filename: 'afcon_stadium.jpg',
        // Unsplash: Stadium (Corrected)
        url: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=1000&auto=format&fit=crop'
    },
    {
        filename: 'salah.jpg',
        // Wikimedia: Salah (Thumbnail)
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Mohamed_Salah%2C_Liverpool_FC_vs_West_Ham_United%2C_April_2023_%2805%29_%28cropped%29.jpg/640px-Mohamed_Salah%2C_Liverpool_FC_vs_West_Ham_United%2C_April_2023_%2805%29_%28cropped%29.jpg'
    },
    {
        filename: 'dricus.jpg',
        // Wikimedia: Dricus (Thumbnail)
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/IMG-Dricus-Duplessis.jpg/640px-IMG-Dricus-Duplessis.jpg'
    },
    {
        filename: 'ethiopia_birr.jpg',
        // Unsplash: Money (Generic)
        url: 'https://images.unsplash.com/photo-1559589689-577aabd1db4f?q=80&w=1000&auto=format&fit=crop'
    },
    {
        filename: 'dangote.jpg',
        // Wikimedia: Dangote (Thumbnail)
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Aliko_Dangote_Petroleum_Company_04.jpg/800px-Aliko_Dangote_Petroleum_Company_04.jpg'
    },
    {
        filename: 'mpesa.jpg',
        // Unsplash: Mobile Phone/Money
        url: 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?q=80&w=1000&auto=format&fit=crop'
    },
    {
        filename: 'burna_boy.jpg',
        // Wikimedia: Burna Boy (Thumbnail)
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Burna_Boy_at_The_Ends_Festival_2019_%2848123281987%29.jpg/640px-Burna_Boy_at_The_Ends_Festival_2019_%2848123281987%29.jpg'
    },
    {
        filename: 'starlink.jpg',
        // Unsplash: Satellite/Space
        url: 'https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?q=80&w=1000&auto=format&fit=crop'
    }
];

function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        https.get(url, REQUEST_OPTIONS, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log(`✅ Downloaded: ${path.basename(filepath)}`);
                    resolve(true);
                });
            } else if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307) {
                if (response.headers.location) {
                    downloadImage(response.headers.location, filepath).then(resolve).catch(reject);
                } else {
                    reject(new Error(`Redirect with no location`));
                }
            } else {
                file.close();
                fs.unlink(filepath, () => { });
                reject(new Error(`Server responded with ${response.statusCode}: ${response.statusMessage}`));
            }
        }).on('error', (err) => {
            fs.unlink(filepath, () => { });
            reject(err);
        });
    });
}

async function run() {
    console.log(`📥 Downloading ${assets.length} assets (V2 URLs)...`);

    for (const asset of assets) {
        try {
            await downloadImage(asset.url, path.join(TARGET_DIR, asset.filename));
        } catch (error) {
            console.error(`❌ Failed to download ${asset.filename}:`, error.message);
        }
    }
}

run();
