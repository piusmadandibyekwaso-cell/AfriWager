
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyFlow() {
    console.log("🧪 Starting End-to-End RPC Verification (Debug Mode)...");

    // SKIP AUTH (Use existing user from previous run to avoid rate limits)
    // Ensure this user ID exists in your DB from previous run
    const userId = 'fdf3e5b2-65d3-420f-b964-da9b183507b5';
    console.log(`👤 Using Existing User ID: ${userId}`);

    // 2. Fund Wallet
    console.log("💰 Funding Wallet (Deposit $100)...");

    // Check if row exists
    const { data: existingBal, error: checkError } = await supabase.from('user_balances').select('*').eq('user_id', userId);

    let fundError;
    if (existingBal && existingBal.length === 0) {
        console.log("   Row missing, attempting INSERT...");
        const { error } = await supabase.from('user_balances').insert({ user_id: userId, balance_usdc: 100 });
        fundError = error;
    } else {
        console.log("   Row exists, attempting UPDATE...");
        const { error } = await supabase.from('user_balances').update({ balance_usdc: 100 }).eq('user_id', userId);
        fundError = error;
    }

    if (fundError) {
        console.error("❌ Funding Failed Details:", JSON.stringify(fundError, null, 2));

        // Diagnosis based on common Supabase errors
        if (fundError.code === '42P01') console.error("   ➡️  DIAGNOSIS: Table 'user_balances' DOES NOT EXIST.");
        if (fundError.code === '42501') console.error("   ➡️  DIAGNOSIS: RLS Violation (Permission Denied).");
        if (fundError.code === '23503') console.error("   ➡️  DIAGNOSIS: Foreign Key Violation (User ID invalid).");
    }

    const { data: balance } = await supabase.from('user_balances').select('balance_usdc').eq('user_id', userId).single();
    console.log(`   Balance: $${balance?.balance_usdc}`);

    if (!balance || balance.balance_usdc < 10) {
        console.error("⛔ Stopping: Insufficient balance to trade.");
        return;
    }

    // 3. Execute Trade
    const { data: market } = await supabase.from('markets').select('id, question').limit(1).single();
    if (!market) { console.error("❌ No markets found"); return; }

    console.log(`📈 Executing Trade on: "${market.question.substring(0, 20)}..."`);
    const amount = 10;

    const { data: tradeResult, error: tradeError } = await supabase.rpc('execute_trade', {
        p_user_id: userId,
        p_market_id: market.id,
        p_outcome_index: 0,
        p_amount_usd: amount,
        p_min_shares_out: 0
    });

    if (tradeError) {
        console.error("❌ Trade Failed:", tradeError);
        return;
    }
    console.log(`   ✅ Trade Success! Shares: ${tradeResult.shares}`);

    // 4. Redeem
    console.log("🏆 Attempting Redemption (Expect 'Not Resolved')...");
    const { data: redeemResult, error: redeemError } = await supabase.rpc('redeem_winnings', {
        p_user_id: userId,
        p_market_id: market.id
    });

    if (redeemError) {
        console.log(`   ℹ️ Redeem Response: ${redeemError.message}`);
        if (redeemError.message.includes("not resolved") || redeemError.message.includes("No winning position")) {
            console.log("   ✅ Redeem RPC Logic Verified (Validation working)");
        } else {
            console.error("   ❌ Redeem Unexpected Error:", redeemError);
        }
    } else {
        console.log("   ✅ Redeem Success:", redeemResult);
    }

    console.log("🏁 E2E Verification Complete.");
}

verifyFlow();
