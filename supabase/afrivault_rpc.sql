
-- ATOMIC TRADE FUNCTION (SECURITY DEFINER)
-- Bypasses RLS to safely update Balance, Position, Transaction, and Revenue.

CREATE OR REPLACE FUNCTION public.execute_trade(
    p_market_id text,
    p_outcome_index integer,
    p_amount_usdc numeric, -- The user's input amount
    p_price_per_share numeric
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres)
SET search_path = public -- Secure search path
AS $$
DECLARE
    v_user_id uuid;
    v_new_balance numeric;
    v_current_shares numeric;
    v_trace_id uuid;
    v_fee numeric;
    v_net_invested numeric;
    v_shares_to_buy numeric;
    v_tx_id uuid;
    v_is_halted boolean;
BEGIN
    -- 1. Get Current User
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- 2. Kill Switch Check
    SELECT is_halted INTO v_is_halted FROM public.market_controls WHERE market_id = p_market_id;
    IF v_is_halted THEN
        RAISE EXCEPTION 'Market Halted';
    END IF;

    -- 3. Calculate Fees & Shares (2% Logic)
    v_fee := p_amount_usdc * 0.02;
    v_net_invested := p_amount_usdc - v_fee;
    v_shares_to_buy := v_net_invested / p_price_per_share;

    -- 4. Debit Balance (Atomic Check)
    UPDATE public.user_balances
    SET balance_usdc = balance_usdc - p_amount_usdc
    WHERE user_id = v_user_id AND balance_usdc >= p_amount_usdc
    RETURNING balance_usdc INTO v_new_balance;

    IF v_new_balance IS NULL THEN
        RAISE EXCEPTION 'Insufficient Funds';
    END IF;

    -- 5. Upsert Position
    INSERT INTO public.positions (user_id, market_id, outcome_index, shares_owned, average_price)
    VALUES (v_user_id, p_market_id, p_outcome_index, v_shares_to_buy, p_price_per_share)
    ON CONFLICT (user_id, market_id, outcome_index)
    DO UPDATE SET 
        shares_owned = positions.shares_owned + v_shares_to_buy,
        average_price = p_price_per_share, -- Simplified avg
        updated_at = now();

    -- 6. Generate Trace ID
    v_trace_id := gen_random_uuid();

    -- 7. Log Transaction
    INSERT INTO public.transactions (user_id, type, amount_usdc, fee_usdc, trace_id, metadata, status)
    VALUES (
        v_user_id, 
        'trade_buy', 
        -p_amount_usdc, 
        v_fee, 
        v_trace_id, 
        jsonb_build_object('marketId', p_market_id, 'shares', v_shares_to_buy, 'price', p_price_per_share), 
        'completed'
    )
    RETURNING id INTO v_tx_id;

    -- 8. Credit Revenue Vault
    INSERT INTO public.revenue_ledger (amount_usdc, source_transaction_id, market_category)
    VALUES (v_fee, v_tx_id, 'GENERAL');

    -- 9. Return Result
    RETURN json_build_object(
        'success', true,
        'new_balance', v_new_balance,
        'shares_bought', v_shares_to_buy,
        'trace_id', v_trace_id
    );
END;
$$;

-- Grant Execute to Auth Users
GRANT EXECUTE ON FUNCTION public.execute_trade TO authenticated;
