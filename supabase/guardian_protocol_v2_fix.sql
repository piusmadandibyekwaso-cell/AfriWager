-- Guardian Protocol v1.1 (FIX)
-- Corrects CPMM Math to use "Split + Swap" logic for accurate Share calculation

CREATE OR REPLACE FUNCTION public.execute_trade(
    p_user_id uuid,
    p_market_id uuid,
    p_outcome_index integer,
    p_amount_usd numeric,
    p_min_shares_out numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_balance numeric;
    v_yes_pool numeric;
    v_no_pool numeric;
    v_is_halted boolean;
    v_fee numeric;
    v_invest_amount numeric;
    v_k numeric;
    v_new_yes_pool numeric;
    v_new_no_pool numeric;
    v_shares_out numeric;
    v_new_balance numeric;
    v_tx_id uuid;
BEGIN
    -- A. MARKET CHECKS
    SELECT yes_pool, no_pool, is_halted INTO v_yes_pool, v_no_pool, v_is_halted
    FROM public.markets
    WHERE id = p_market_id
    FOR UPDATE;

    IF NOT FOUND THEN RAISE EXCEPTION 'Market not found'; END IF;

    IF v_is_halted THEN
        INSERT INTO public.compliance_logs (user_id, market_id, attempted_amount, block_reason, metadata)
        VALUES (p_user_id, p_market_id::text, p_amount_usd, 'HALTED', '{"reason": "Market Halted"}'::jsonb);
        RAISE EXCEPTION 'Market is HALTED by Guardian Protocol';
    END IF;

    -- B. BALANCE CHECK
    SELECT balance_usdc INTO v_user_balance
    FROM public.user_balances
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF v_user_balance < p_amount_usd THEN
        INSERT INTO public.compliance_logs (user_id, market_id, attempted_amount, block_reason, metadata)
        VALUES (p_user_id, p_market_id::text, p_amount_usd, 'INSUFFICIENT_BALANCE', jsonb_build_object('balance', v_user_balance));
        RAISE EXCEPTION 'Insufficient Funds';
    END IF;

    -- C. CPMM MATH (CORRECTED: Split + Swap)
    v_fee := p_amount_usd * 0.02;
    v_invest_amount := p_amount_usd - v_fee;
    v_k := v_yes_pool * v_no_pool;

    IF p_outcome_index = 0 THEN -- BUY YES
        -- Split: Users gets InvestAmount YES + InvestAmount NO
        -- Swap: User swaps InvestAmount NO into pool for YES
        v_new_no_pool := v_no_pool + v_invest_amount;
        v_new_yes_pool := v_k / v_new_no_pool;
        -- Total Shares = Shares from Split (InvestAmount) + Shares from Swap (Delta Yes)
        v_shares_out := v_invest_amount + (v_yes_pool - v_new_yes_pool);
    ELSE -- BUY NO
        v_new_yes_pool := v_yes_pool + v_invest_amount;
        v_new_no_pool := v_k / v_new_yes_pool;
        v_shares_out := v_invest_amount + (v_no_pool - v_new_no_pool);
    END IF;

    -- D. GUARDIAN PROTOCOL CHECKS

    -- 1. Negative ROI Check (Zero-Loss Hard Stop)
    -- Payout ($1 * Shares) vs Investment
    IF v_shares_out < p_amount_usd THEN
        INSERT INTO public.compliance_logs (user_id, market_id, attempted_amount, block_reason, metadata)
        VALUES (p_user_id, p_market_id::text, p_amount_usd, 'NEGATIVE_ROI', jsonb_build_object('shares', v_shares_out, 'invest', p_amount_usd));
        RAISE EXCEPTION 'Guardian Protocol: Negative ROI Trade Blocked';
    END IF;

    -- 2. Slippage Check (Min Shares)
    IF v_shares_out < p_min_shares_out THEN
        INSERT INTO public.compliance_logs (user_id, market_id, attempted_amount, block_reason, metadata)
        VALUES (p_user_id, p_market_id::text, p_amount_usd, 'SLIPPAGE', jsonb_build_object('shares', v_shares_out, 'min_shares', p_min_shares_out));
        RAISE EXCEPTION 'Guardian Protocol: High Slippage Detected';
    END IF;

    -- E. EXECUTION (Atomic)
    v_new_balance := v_user_balance - p_amount_usd;
    UPDATE public.user_balances SET balance_usdc = v_new_balance WHERE user_id = p_user_id;

    UPDATE public.markets
    SET yes_pool = v_new_yes_pool, no_pool = v_new_no_pool, total_volume_usdc = total_volume_usdc + p_amount_usd
    WHERE id = p_market_id;

    INSERT INTO public.transactions (user_id, type, amount_usdc, fee_usdc, status, metadata)
    VALUES (p_user_id, 'trade_buy', p_amount_usd, v_fee, 'completed', jsonb_build_object('market_id', p_market_id, 'outcome', p_outcome_index, 'shares', v_shares_out))
    RETURNING id INTO v_tx_id;

    INSERT INTO public.revenue_ledger (amount_usdc, source_transaction_id, market_category)
    VALUES (v_fee, v_tx_id, 'TRADING_FEE');

    INSERT INTO public.positions (user_id, market_id, outcome_index, shares_owned, average_price)
    VALUES (p_user_id, p_market_id::text, p_outcome_index, v_shares_out, p_amount_usd / v_shares_out)
    ON CONFLICT (user_id, market_id, outcome_index)
    DO UPDATE SET 
        shares_owned = public.positions.shares_owned + EXCLUDED.shares_owned,
        average_price = (public.positions.average_price * public.positions.shares_owned + EXCLUDED.average_price * EXCLUDED.shares_owned) / (public.positions.shares_owned + EXCLUDED.shares_owned);

    RETURN jsonb_build_object('success', true, 'shares', v_shares_out, 'new_balance', v_new_balance, 'tx_id', v_tx_id);
END;
$$;
