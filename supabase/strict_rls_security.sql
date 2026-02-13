-- ==========================================
-- SECURING AFRIMARKETS DATABASE
-- Fixes "Security Advisor" Warnings (2 Errors)
-- ==========================================

-- 1. Enable Row Level Security (RLS) on ALL Tables
-- This ensures no table is left wide open.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- 2. Clean Up old Policies (To prevent duplicates or conflicts)
DROP POLICY IF EXISTS "Public read access for users" ON public.users;
DROP POLICY IF EXISTS "Public read access for markets" ON public.markets;
DROP POLICY IF EXISTS "Public read access for outcomes" ON public.outcomes;
DROP POLICY IF EXISTS "Public read access for market_prices" ON public.market_prices;
DROP POLICY IF EXISTS "Public read access for trades" ON public.trades;

-- Also drop any potentially permissive "write" policies if they exist (Wildcard cleanup)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.markets;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.trades;

-- 3. Create STRICT "Read Only" Policies
-- Allows anyone (Anon/Public) to VIEW data, but NOT edit it.
CREATE POLICY "Public Read Only: Users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Public Read Only: Markets" ON public.markets FOR SELECT USING (true);
CREATE POLICY "Public Read Only: Outcomes" ON public.outcomes FOR SELECT USING (true);
CREATE POLICY "Public Read Only: Prices" ON public.market_prices FOR SELECT USING (true);
CREATE POLICY "Public Read Only: Trades" ON public.trades FOR SELECT USING (true);

-- 4. Verify Write Access
-- By DEFAULT, relying on ENABLE ROW LEVEL SECURITY and NOT creating "FOR INSERT/UPDATE" policies
-- automatically BLOCKS all frontend writes.
-- This is CORRECT because our API (`/api/trade`) uses the SERVICE_ROLE key (Admin),
-- which bypasses these rules securely.

-- Done!
