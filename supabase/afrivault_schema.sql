-- AfriVault v1.0 Schema
-- Centralized Ledger for High-Frequency, Low-Cost Trading

-- 1. ENHANCED PROFILES (KYC Data)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS kyc_status text DEFAULT 'unverified' CHECK (kyc_status IN ('unverified', 'pending', 'verified')),
ADD COLUMN IF NOT EXISTS phone_number text,
ADD COLUMN IF NOT EXISTS nin text,
ADD COLUMN IF NOT EXISTS district text,
ADD COLUMN IF NOT EXISTS country_code text DEFAULT 'UG';

-- 2. USER BALANCES (The Central Ledger)
-- Tracks the user's "Cash" holdings (denominated in USD for internal standardization)
CREATE TABLE IF NOT EXISTS public.user_balances (
    user_id uuid REFERENCES auth.users(id) PRIMARY KEY,
    balance_usdc numeric(20, 6) DEFAULT 0.000000, -- High precision for fractional USD
    currency_preference text DEFAULT 'USD', -- UI preference
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS for Balances
ALTER TABLE public.user_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own balance" 
ON public.user_balances FOR SELECT 
USING (auth.uid() = user_id);

-- 3. TRANSACTIONS (The Immutable History)
-- Records every Deposit, Withdrawal, and Trade Execution
CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    type text NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'trade_buy', 'trade_sell', 'settlement_payout')),
    amount_usdc numeric(20, 6) NOT NULL, -- Negative for debits (buy/withdraw), Positive for credits (deposit/sell/win)
    fee_usdc numeric(20, 6) DEFAULT 0,
    reference_id text, -- Mobile Money Ref ID or Market ID
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    metadata jsonb DEFAULT '{}', -- Store market_id, outcome_idx, shares for trades
    created_at timestamptz DEFAULT now()
);

-- Enable RLS for Transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" 
ON public.transactions FOR SELECT 
USING (auth.uid() = user_id);

-- 4. POSITIONS (Off-Chain Event Contracts)
-- Tracks the user's ownership of outcomes in specific markets
CREATE TABLE IF NOT EXISTS public.positions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    market_id text NOT NULL, -- References the Market ID (could be UUID if we migrate markets table)
    outcome_index integer NOT NULL, -- 0 for Yes, 1 for No, etc.
    shares_owned numeric(20, 6) DEFAULT 0,
    average_price numeric(10, 6) DEFAULT 0, -- Cost basis tracking
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, market_id, outcome_index) -- One position row per outcome per user
);

-- Enable RLS for Positions
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own positions" 
ON public.positions FOR SELECT 
USING (auth.uid() = user_id);

-- 5. FUNCTION: SAFELY CREATE BALANCE ON SIGNUP
-- Trigger to ensure every new user has a balance row
CREATE OR REPLACE FUNCTION public.handle_new_user_balance() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_balances (user_id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution
DROP TRIGGER IF EXISTS on_auth_user_created_balance ON auth.users;
CREATE TRIGGER on_auth_user_created_balance
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_balance();

-- 6. INDEXES for Performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_user_market ON public.positions(user_id, market_id);

-- 7. AUDIT & COMPLIANCE (LDC Mandate)
-- 7.1 "Black Box" Traceability
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS trace_id uuid DEFAULT gen_random_uuid();

-- 7.2 Revenue Vault (The 2% Fee)
CREATE TABLE IF NOT EXISTS public.revenue_ledger (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    amount_usdc numeric(20, 6) NOT NULL, -- Positive Value
    source_transaction_id uuid REFERENCES public.transactions(id),
    market_category text DEFAULT 'GENERAL', -- Politics, Sports, etc.
    created_at timestamptz DEFAULT now()
);

-- 7.3 The Kill Switch (Market Control)
CREATE TABLE IF NOT EXISTS public.market_controls (
    market_id text PRIMARY KEY,
    is_halted boolean DEFAULT false,
    halt_reason text,
    updated_at timestamptz DEFAULT now(),
    updated_by uuid REFERENCES auth.users(id)
);

-- 7.4 Identity Integrity
-- Ensure phone numbers are unique to prevent "Smurfing"
ALTER TABLE public.profiles
ADD CONSTRAINT unique_phone_number UNIQUE (phone_number);
