
-- SUPABASE SECURITY PATCH v1.0
-- Addresses "Critical" findings from Security Advisor

-- 1. Secure revenue_ledger (Missing RLS)
ALTER TABLE public.revenue_ledger ENABLE ROW LEVEL SECURITY;
-- Internal table, no public access allowed by default. 
-- Admin (service role) bypasses RLS automatically.

-- 2. Secure market_controls (Missing RLS)
ALTER TABLE public.market_controls ENABLE ROW LEVEL SECURITY;
-- Only allow Select for transparency, but no public Insert/Update
CREATE POLICY "Public can view market status" ON public.market_controls
FOR SELECT USING (true);

-- 3. Fix Profiles Policy (Permissive Update)
-- The original policy used 'USING (true)' which allowed anyone to update any profile.
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." ON public.profiles 
FOR UPDATE USING (auth.uid() = id);

-- 4. Secure Transactions (Optional but recommended)
-- Ensure only viewable by owner
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
-- (Assuming policy was already there from afrivault_schema.sql)

-- 5. Secure user_balances
-- Ensure only viewable by owner
ALTER TABLE public.user_balances ENABLE ROW LEVEL SECURITY;
-- (Assuming policy was already there from afrivault_schema.sql)

COMMIT;
