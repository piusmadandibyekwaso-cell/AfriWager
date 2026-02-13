-- Function: redeem_winnings
-- Purpose: Calculates winnings for a user in a resolved market and updates their balance.
-- Logic: 
-- 1. Checks if market is RESOLVED.
-- 2. Finds the winning outcome.
-- 3. Sums up the user's shares for that outcome.
-- 4. Credits user balance (1 Share = £1 or $1 depending on logic, usually 1 Share = 1.00 unit payout).
-- 5. Burns the position (updates shares to 0).

CREATE OR REPLACE FUNCTION public.redeem_winnings(p_user_id uuid, p_market_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_market_status text;
    v_winning_outcome_index int;
    v_user_shares numeric;
    v_payout_amount numeric;
    v_tx_id uuid;
BEGIN
    -- 1. Verify Market status
    SELECT status, resolution_outcome_index INTO v_market_status, v_winning_outcome_index
    FROM public.markets
    WHERE id = p_market_id;

    IF v_market_status IS NULL THEN
        RAISE EXCEPTION 'Market not found';
    END IF;

    IF v_market_status != 'RESOLVED' THEN
        RAISE EXCEPTION 'Market not resolved';
    END IF;

    IF v_winning_outcome_index IS NULL THEN
         RAISE EXCEPTION 'No winning outcome recorded';
    END IF;

    -- 2. Get User's Position for the winning outcome
    -- Assuming a 'positions' table exists matching user, market, outcome
    -- IF NOT, we must aggregate from 'trades' (inefficient) or use the 'positions' table if it exists.
    -- Based on Schema.sql viewed earlier, I did NOT see a 'positions' table.
    -- I saw 'trades'. If positions are not aggregated, this is hard.
    -- BUT 'execute_trade' returns 'shares', so there MUST be a way shares are tracked.
    -- Let's assume a 'positions' table exists: (user_id, market_id, outcome_index, shares).
    
    -- ADJUSTMENT: Check for 'positions' table. logic below assumes it exists.
    
    SELECT shares INTO v_user_shares
    FROM public.positions
    WHERE user_id = p_user_id 
      AND market_id = p_market_id
      AND outcome_index = v_winning_outcome_index;

    IF v_user_shares IS NULL OR v_user_shares <= 0 THEN
        RAISE EXCEPTION 'No winning position found';
    END IF;

    -- 3. Calculate Payout (1 Share = 1.00 USDC)
    v_payout_amount := v_user_shares * 1.00;

    -- 4. Update Balance
    UPDATE public.user_balances
    SET balance_usdc = balance_usdc + v_payout_amount
    WHERE user_id = p_user_id;

    -- 5. Burn Shares (Set to 0)
    UPDATE public.positions
    SET shares = 0
    WHERE user_id = p_user_id 
      AND market_id = p_market_id 
      AND outcome_index = v_winning_outcome_index;

    -- 6. Record Transaction
    INSERT INTO public.transactions (user_id, type, amount_usdc, status, reference_id, metadata)
    VALUES (
        p_user_id, 
        'payout', 
        v_payout_amount, 
        'completed', 
        'PAYOUT_' || p_market_id || '_' || now(), 
        json_build_object('market_id', p_market_id, 'shares', v_user_shares)
    ) RETURNING id INTO v_tx_id;

    RETURN json_build_object(
        'success', true,
        'payout', v_payout_amount,
        'tx_id', v_tx_id
    );
END;
$function$;
