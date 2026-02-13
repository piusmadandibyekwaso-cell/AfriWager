
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// USE THE PUBLIC ANON KEY (Simulating a Hacker / Public User)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function verifySecurity() {
    console.log("🕵️‍♂️ SECURITY AUDIT: Attempting Unauthorized Write...");

    // Attempt to insert a FAKE trade using the PUBLIC key
    const { error } = await supabase.from('trades').insert({
        market_id: '00000000-0000-0000-0000-000000000000', // Fake ID
        user_id: '00000000-0000-0000-0000-000000000000',   // Fake User
        outcome_index: 0,
        is_buy: true,
        share_amount: 100,
        usdc_amount: 100,
        tx_hash: '0xFAKE_HASH'
    });

    if (error) {
        // PERMISSION DENIED is the EXPECTED result for a secure DB
        if (error.code === '42501' || error.message.includes('row-level security')) {
            console.log("✅ SUCCESS: Database Blocked the Write!");
            console.log("   Reason:", error.message);
            console.log("🛡️  RLS Policies are ACTIVE. The Database is SECURE.");
        } else {
            console.log("⚠️  BLOCKED, but unexpected error code:", error.code, error.message);
        }
    } else {
        console.error("❌ CRITICAL FAILURE: The Write SUCCEEDED.");
        console.error("   The Database is NOT Secure. Anyone can write fake data.");
    }
}

verifySecurity();
