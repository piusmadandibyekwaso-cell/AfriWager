
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
    console.log('🤖 Starting Traffic Simulation...');

    // 1. Create Bot User
    const email = `bot_${Date.now()}@afriwager.test`;
    const password = 'TestBotPassword123!';

    console.log(`\n👤 Creating Bot: ${email}`);
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
            username: 'SimBot_01',
            full_name: 'Simulation Bot'
        }
    });

    if (authError) {
        console.error('Auth Error:', authError.message);
        return;
    }

    const userId = authData.user.id;
    console.log(`   ✅ User Created: ${userId}`);

    // 2. Deposit Funds (Mock Wallet API Logic)
    console.log(`\n💰 Simulating Deposit: $500.00`);
    const depositAmount = 500;

    // Simulate API: Update Balance & Log Tx
    const { error: depError } = await supabase.from('user_balances').update({ balance_usdc: depositAmount }).eq('user_id', userId);
    if (depError) console.error('Deposit Balance Error:', depError);

    const { error: txError } = await supabase.from('transactions').insert({
        user_id: userId,
        type: 'deposit',
        amount_usdc: depositAmount,
        status: 'completed',
        reference_id: `SIM_DEP_${Date.now()}`,
        metadata: { provider: 'SIMULATION' }
    });

    // 3. Execute Trade 1 (Nigeria GDP - YES)
    // Market Logic: Price $0.50. Fee 2%.
    console.log(`\n📈 Executing Trade: Buy $100 of YES (Nigeria GDP)`);
    const tradeAmount = 100;
    const fee = tradeAmount * 0.02; // $2
    const netInvested = tradeAmount - fee; // $98
    const price = 0.50;
    const shares = netInvested / price; // 196 Shares

    const traceId = crypto.randomUUID();

    // A. Debit Balance ($400 remain)
    await supabase.from('user_balances').update({ balance_usdc: depositAmount - tradeAmount }).eq('user_id', userId);

    // B. Upsert Position
    // Need a market ID. Fetch one.
    const { data: market } = await supabase.from('markets').select('id').ilike('category', 'Economics').limit(1).single();
    if (!market) {
        console.error('No Market Found!');
        return;
    }

    await supabase.from('positions').upsert({
        user_id: userId,
        market_id: market.id,
        outcome_index: 0, // YES
        shares_owned: shares,
        average_price: price
    }, { onConflict: 'user_id, market_id, outcome_index' });

    // C. Log Transaction (Audit)
    const { data: txTrade } = await supabase.from('transactions').insert({
        user_id: userId,
        type: 'trade_buy',
        amount_usdc: -tradeAmount,
        fee_usdc: fee,
        trace_id: traceId,
        metadata: { marketId: market.id, shares, price },
        status: 'completed'
    }).select().single();

    // D. Revenue Vault
    if (txTrade) {
        await supabase.from('revenue_ledger').insert({
            amount_usdc: fee,
            source_transaction_id: txTrade.id,
            market_category: 'ECONOMICS'
        });
    }

    console.log(`   ✅ Trade Complete.`);
    console.log(`   Trace ID: ${traceId}`);
    console.log(`   Revenue Generated: $${fee.toFixed(2)}`);

    console.log(`\n🏁 Simulation Finished SUCCESSFULLY.`);
}

simulateTraffic();
