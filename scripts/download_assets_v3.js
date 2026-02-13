const fs = require('fs');
const https = require('https');
const path = require('path');

const TARGET_DIR = path.resolve(__dirname, '../public/market-images');

if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
}

// Wikimedia requires a very specific User-Agent format to allow bots.
const HEADERS = {
    'User-Agent': 'AfriWagerBot/1.0 (https://afriwager.com; contact@afriwager.com)'
};

const assets = [
    {
        filename: 'uganda_election.jpg',
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Yoweri_Museveni_September_2015.jpg/800px-Yoweri_Museveni_September_2015.jpg',
        fallback: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Yoweri_Museveni_September_2015.jpg/320px-Yoweri_Museveni_September_2015.jpg'
    },
    {
        filename: 'ghana_inflation.jpg',
        // Generic Money
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Ghana_currency_notes.jpg/800px-Ghana_currency_notes.jpg'
    },
    {
        filename: 'sa_anc.jpg',
        // ANC Flag or SA Flag
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Flag_of_South_Africa.svg/800px-Flag_of_South_Africa.svg.png'
    },
    {
        filename: 'afcon_stadium.jpg',
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Soccer_City_Stadium.jpg/800px-Soccer_City_Stadium.jpg'
    },
    {
        filename: 'salah.jpg',
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Mohamed_Salah%2C_Liverpool_FC_vs_West_Ham_United%2C_April_2023_%2805%29_%28cropped%29.jpg/640px-Mohamed_Salah%2C_Liverpool_FC_vs_West_Ham_United%2C_April_2023_%2805%29_%28cropped%29.jpg'
    },
    {
        filename: 'dricus.jpg',
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/IMG-Dricus-Duplessis.jpg/640px-IMG-Dricus-Duplessis.jpg'
    },
    {
        filename: 'ethiopia_birr.jpg',
        // Ethiopia Money
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Ethiopian_200_Birr_Notes.jpg/800px-Ethiopian_200_Birr_Notes.jpg'
    },
    {
        filename: 'dangote.jpg',
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Aliko_Dangote_Petroleum_Company_04.jpg/600px-Aliko_Dangote_Petroleum_Company_04.jpg'
    },
    {
        filename: 'mpesa.jpg',
        // Mpesa or Mobile Money
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/M-Pesa_Logo.png/640px-M-Pesa_Logo.png'
    },
    {
        filename: 'burna_boy.jpg',
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Burna_Boy_%28cropped%29.jpg/640px-Burna_Boy_%28cropped%29.jpg'
    },
    {
        filename: 'starlink.jpg',
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Starlink_Mission_%2847926144123%29.jpg/800px-Starlink_Mission_%2847926144123%29.jpg'
    }
];

function download(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        const req = https.get(url, { headers: HEADERS }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                download(res.headers.location, dest).then(resolve).catch(reject);
                return;
            }
            if (res.statusCode !== 200) {
                return reject(new Error(`Status ${res.statusCode}`));
            }
            res.pipe(file);
            file.on('finish', () => {
                file.close(() => resolve());
            });
        });
        req.on('error', (err) => {
            fs.unlink(dest, () => { });
            reject(err);
        });
    });
}

async function run() {
    console.log("🚀 Starting Force Download (V3)...");

    // Ensure we have at least one valid image to copy as fallback
    let fallbackImage = path.join(TARGET_DIR, 'starlink.jpg');

    for (const asset of assets) {
        const dest = path.join(TARGET_DIR, asset.filename);
        try {
            console.log(`Downloading ${asset.filename}...`);
            await download(asset.url, dest);
            console.log(`✅ Success: ${asset.filename}`);
            if (asset.filename === 'starlink.jpg') fallbackImage = dest;
        } catch (err) {
            console.error(`⚠️ Primary URL failed for ${asset.filename}: ${err.message}`);
            if (asset.fallback) {
                try {
                    console.log(`   Retrying fallback...`);
                    await download(asset.fallback, dest);
                    console.log(`   ✅ Fallback Success: ${asset.filename}`);
                    continue;
                } catch (err2) {
                    console.error(`   Fallback failed too.`);
                }
            }

            // Text Last Resort: Copy the safe image
            if (fs.existsSync(fallbackImage) && fallbackImage !== dest) {
                console.log(`   ⚠️ COPYING SAFE PLACEHOLDER for ${asset.filename}`);
                fs.copyFileSync(fallbackImage, dest);
            }
        }
    }
    console.log("🏁 Download V3 Complete.");
}

run();
