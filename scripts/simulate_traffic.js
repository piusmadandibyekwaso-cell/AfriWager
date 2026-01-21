
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const crypto = require('crypto');

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Service Role Config Missing. Simulation requires Admin Access.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function simulateTraffic() {
    console.log('🤖 Starting Guardian Protocol Risk Test...');

    // 1. Create Bot User
    const email = `riskbot_${Date.now()}@test.com`;
    const password = 'TestBotPassword123!';
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email, password, email_confirm: true
    });

    if (authError) { console.error('Auth Error:', authError.message); return; }
    const userId = authData.user.id;
    console.log(`✅ Risk Bot Created: ${userId}`);

    // 2. Fund Wallet ($10,000 for Whale Tests)
    // Note: Trigger creates row on signup, so we update instead of insert.
    await supabase.from('user_balances').update({ balance_usdc: 10000 }).eq('user_id', userId);
    console.log(`💰 Funded Wallet: $10,000`);

    // 3. Find Market
    const { data: market } = await supabase.from('markets').select('id, yes_pool, no_pool').limit(1).single();
    if (!market) { console.error('No Market Found!'); return; }
    console.log(`🎯 Target Market: ${market.id}`);

    // TEST 1: Valid Trade ($10)
    console.log(`\n🧪 TEST 1: Normal Trade ($10)`);
    const { data: validTrade, error: validError } = await supabase.rpc('execute_trade', {
        p_user_id: userId,
        p_market_id: market.id,
        p_outcome_index: 0,
        p_amount_usd: 10,
        p_min_shares_out: 0 // Loose slippage for basic test
    });

    if (validError) console.error('❌ VALID TRADE FAILED:', validError.message);
    else console.log(`✅ VALID TRADE SUCCESS: Shares=${validTrade.shares}, Balance=${validTrade.new_balance}`);


    // TEST 2: WHALE TRADE (Slippage Hard Stop)
    // Try to move pool by investing $5000 (likely >10% impact if pools are small)
    console.log(`\n🧪 TEST 2: Whale Trade ($5,000) - Expect SLIPPAGE BLOCK`);

    const { data: whaleTrade, error: whaleError } = await supabase.rpc('execute_trade', {
        p_user_id: userId,
        p_market_id: market.id,
        p_outcome_index: 0,
        p_amount_usd: 5000,
        p_min_shares_out: 10000000 // Impossible amount -> Trigger "High Slippage" or "Negative ROI"
    });

    if (whaleError) {
        console.log(`✅ BLOCKED AS EXPECTED: ${whaleError.message}`);
        // Verify Log
        const { data: logs } = await supabase.from('compliance_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1);
        if (logs && logs.length > 0) console.log(`   📜 Compliance Logged: ${logs[0].block_reason} (Amount: $${logs[0].attempted_amount})`);
    } else {
        console.error('❌ WHALE TRADE SLIPPED THROUGH!');
    }

    console.log(`\n🏁 Risk Simulation Complete.`);
}

simulateTraffic();
