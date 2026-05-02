-- Liquidity Injection Protocol v1.0
-- Allows authorized builders to allocate capital to market pools

CREATE OR REPLACE FUNCTION public.inject_liquidity(
    p_market_id uuid,
    p_amount_usdc numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_yes_pool numeric;
    v_no_pool numeric;
    v_split numeric;
BEGIN
    -- 1. Split amount 50/50
    v_split := p_amount_usdc / 2;

    -- 2. Update Market Pools
    -- This increases both pools equally, maintaining the 50/50 price but increasing depth
    UPDATE public.markets
    SET yes_pool = yes_pool + v_split,
        no_pool = no_pool + v_split,
        total_volume_usdc = total_volume_usdc + p_amount_usdc
    WHERE id = p_market_id
    RETURNING yes_pool, no_pool INTO v_yes_pool, v_no_pool;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Market not found';
    END IF;

    -- 3. Log Event
    INSERT INTO public.compliance_logs (market_id, attempted_amount, block_reason, metadata)
    VALUES (p_market_id::text, p_amount_usdc, 'HALTED', jsonb_build_object('type', 'LIQUIDITY_INJECTION', 'yes_pool', v_yes_pool, 'no_pool', v_no_pool));

    RETURN jsonb_build_object(
        'success', true,
        'new_yes_pool', v_yes_pool,
        'new_no_pool', v_no_pool
    );
END;
$$;
