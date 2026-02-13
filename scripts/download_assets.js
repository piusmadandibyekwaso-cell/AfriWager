const fs = require('fs');
const https = require('https');
const path = require('path');

const TARGET_DIR = path.resolve(__dirname, '../public/market-images');

if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
}

// Added User-Agent to mimic a browser/legitimate client
const REQUEST_OPTIONS = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
};

const assets = [
    {
        filename: 'uganda_election.jpg',
        // Wikimedia: Museveni
        url: 'https://upload.wikimedia.org/wikipedia/commons/1/18/Yoweri_Museveni_September_2015.jpg'
    },
    {
        filename: 'ghana_inflation.jpg',
        // Unsplash: Money (Ghana Cedi not specific, using generic cash)
        url: 'https://images.unsplash.com/photo-1580519542723-ce9564cab287?auto=format&fit=crop&q=80&w=1000'
    },
    {
        filename: 'sa_anc.jpg',
        // Unsplash: South Africa Flag
        url: 'https://images.unsplash.com/photo-1577962917302-cd874c4e3169?auto=format&fit=crop&q=80&w=1000'
    },
    {
        filename: 'afcon_stadium.jpg',
        // Unsplash: Soccer Stadium
        url: 'https://images.unsplash.com/photo-1522778119026-d647f0565c71?auto=format&fit=crop&q=80&w=1000'
    },
    {
        filename: 'salah.jpg',
        // Wikimedia: Salah
        url: 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Mohamed_Salah%2C_Liverpool_FC_vs_West_Ham_United%2C_April_2023_%2805%29_%28cropped%29.jpg'
    },
    {
        filename: 'dricus.jpg',
        // Wikimedia: Dricus
        url: 'https://upload.wikimedia.org/wikipedia/commons/0/0d/IMG-Dricus-Duplessis.jpg'
    },
    {
        filename: 'ethiopia_birr.jpg',
        // Unsplash: Money (Generic)
        url: 'https://images.unsplash.com/photo-1620822601934-2e21b77742d2?auto=format&fit=crop&q=80&w=1000'
    },
    {
        filename: 'dangote.jpg',
        // Wikimedia: Dangote (Fixed URL)
        url: 'https://upload.wikimedia.org/wikipedia/commons/f/fc/Aliko_Dangote_Petroleum_Company_04.jpg'
    },
    {
        filename: 'mpesa.jpg',
        // Unsplash: Phone/Mobile Payment
        url: 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&q=80&w=1000'
    },
    {
        filename: 'burna_boy.jpg',
        // Wikimedia: Burna Boy
        url: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/Burna_Boy_%28cropped%29.jpg'
    },
    {
        filename: 'starlink.jpg',
        // Unsplash: Satellite Dish/Tech
        url: 'https://images.unsplash.com/photo-1548695607-9c73430ba065?auto=format&fit=crop&q=80&w=1000'
    }
];

function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);

        // Parse URL to handle correct protocol
        const request = https.get(url, REQUEST_OPTIONS, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log(`✅ Downloaded: ${path.basename(filepath)}`);
                    resolve(true);
                });
            } else if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307) {
                if (response.headers.location) {
                    // Recursive call for redirect
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
    console.log(`📥 Downloading ${assets.length} assets to ${TARGET_DIR} (With User-Agent)...`);

    for (const asset of assets) {
        try {
            await downloadImage(asset.url, path.join(TARGET_DIR, asset.filename));
        } catch (error) {
            console.error(`❌ Failed to download ${asset.filename} (${asset.url}):`, error.message);
        }
    }
    console.log("Assets download complete.");
}

run();
