import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_DIR = path.resolve(__dirname, '../public/market-images');

if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
}

const assets = [
    {
        filename: 'uganda_election.jpg',
        url: 'https://upload.wikimedia.org/wikipedia/commons/1/18/Yoweri_Museveni_September_2015.jpg'
    },
    {
        filename: 'ghana_inflation.jpg',
        url: 'https://images.unsplash.com/photo-1526304640152-d4619684e484?auto=format&fit=crop&q=80&w=1000'
    },
    {
        filename: 'sa_anc.jpg',
        url: 'https://images.unsplash.com/photo-1577962917302-cd874c4e3169?auto=format&fit=crop&q=80&w=1000'
    },
    {
        filename: 'afcon_stadium.jpg',
        url: 'https://images.unsplash.com/photo-1522778119026-d647f0565c71?auto=format&fit=crop&q=80&w=1000'
    },
    {
        filename: 'salah.jpg',
        url: 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Mohamed_Salah%2C_Liverpool_FC_vs_West_Ham_United%2C_April_2023_%2805%29_%28cropped%29.jpg'
        // Using a known Wikimedia Commons structure. If this fails, we catch error.
    },
    {
        filename: 'dricus.jpg',
        url: 'https://upload.wikimedia.org/wikipedia/commons/0/0d/IMG-Dricus-Duplessis.jpg'
    },
    {
        filename: 'ethiopia_birr.jpg',
        url: 'https://images.unsplash.com/photo-1620822601934-2e21b77742d2?auto=format&fit=crop&q=80&w=1000'
    },
    {
        filename: 'dangote.jpg',
        url: 'https://upload.wikimedia.org/wikipedia/commons/f/fc/Aliko_Dangote_Petroleum_Company_04.jpg'
    },
    {
        filename: 'mpesa.jpg',
        url: 'https://images.unsplash.com/photo-1565514020176-6c509025e6e6?auto=format&fit=crop&q=80&w=1000'
    },
    {
        filename: 'burna_boy.jpg',
        url: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/Burna_Boy_%28cropped%29.jpg'
    },
    {
        filename: 'starlink.jpg',
        url: 'https://images.unsplash.com/photo-1548695607-9c73430ba065?auto=format&fit=crop&q=80&w=1000'
    }
];

function downloadImage(url: string, filepath: string) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        https.get(url, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log(`✅ Downloaded: ${path.basename(filepath)}`);
                    resolve(true);
                });
            } else if (response.statusCode === 301 || response.statusCode === 302) {
                // Handle simple redirect
                if (response.headers.location) {
                    downloadImage(response.headers.location, filepath).then(resolve).catch(reject);
                } else {
                    reject(new Error(`Redirect with no location`));
                }
            } else {
                file.close();
                fs.unlink(filepath, () => { }); // Delete partial
                reject(new Error(`Server responded with ${response.statusCode}: ${response.statusMessage}`));
            }
        }).on('error', (err) => {
            fs.unlink(filepath, () => { });
            reject(err);
        });
    });
}

async function run() {
    console.log(`📥 Downloading ${assets.length} assets to ${TARGET_DIR}...`);

    for (const asset of assets) {
        try {
            await downloadImage(asset.url, path.join(TARGET_DIR, asset.filename));
        } catch (error) {
            console.error(`❌ Failed to download ${asset.filename}:`, error.message);
        }
    }
    console.log("Assets download complete.");
}

run();
