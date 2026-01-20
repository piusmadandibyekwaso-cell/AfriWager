import { marketService } from '../src/services/marketService';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function listAll() {
    console.log("Fetching all markets...");
    try {
        const markets = await marketService.getMarkets();
        console.log(`Found ${markets.length} markets.`);
        markets.forEach(m => {
            console.log(`- [${m.id}] ${m.question.substring(0, 50)}...`);
        });
    } catch (e) {
        console.error("Error listing markets:", e);
    }
}

listAll();
