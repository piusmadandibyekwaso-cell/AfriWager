import { marketService } from '../src/services/marketService';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// ID from the user screenshot URL
const TARGET_ID = 'bafe735b-d40d-418d-a5b1-08a114fb09f4';

async function check() {
    console.log(`Checking Market ID: ${TARGET_ID}`);
    try {
        const market = await marketService.getMarketById(TARGET_ID);
        if (market) {
            console.log("✅ Market Found!");
            console.log(`Question: ${market.question}`);
            console.log(`Pools: YES=${market.yes_pool}, NO=${market.no_pool}`);
        } else {
            console.error("❌ Market NOT Found (returned null)");
        }
    } catch (e) {
        console.error("❌ Error fetching market:", e);
    }
}

check();
