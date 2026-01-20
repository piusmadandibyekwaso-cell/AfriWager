-- Add liquidity pool columns to markets table
ALTER TABLE public.markets 
ADD COLUMN IF NOT EXISTS yes_pool numeric(20, 6) DEFAULT 1000.000000,
ADD COLUMN IF NOT EXISTS no_pool numeric(20, 6) DEFAULT 1000.000000;

-- Update existing markets to have the default 1000/1000 liquidity (2000 total) if they are currently 0 or NULL
UPDATE public.markets 
SET yes_pool = 1000, no_pool = 1000 
WHERE yes_pool IS NULL OR no_pool IS NULL;
