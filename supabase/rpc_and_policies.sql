-- 1. Reset all market volumes to 0 (Correcting the hardcoded fake data)
UPDATE public.markets
SET total_volume_usdc = 0;

-- 2. Create the RPC function to securely increment volume
-- This function runs on the server, ensuring atomic updates and bypassing local RLS restrictions if declared SECURITY DEFINER
CREATE OR REPLACE FUNCTION increment_market_volume(market_id UUID, amount_usdc NUMERIC)
RETURNS VOID AS $$
BEGIN
  UPDATE public.markets
  SET total_volume_usdc = total_volume_usdc + amount_usdc
  WHERE id = market_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Grant permission to anonymous and authenticated users to call this function
-- This is necessary because the frontend calls it using the ANON_KEY
GRANT EXECUTE ON FUNCTION increment_market_volume(UUID, NUMERIC) TO anon;
GRANT EXECUTE ON FUNCTION increment_market_volume(UUID, NUMERIC) TO authenticated;

-- Confirmation
SELECT 'Volume reset and RPC function created successfully' as status;
