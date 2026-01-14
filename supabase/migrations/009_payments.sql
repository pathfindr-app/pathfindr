-- Payments Migration
-- Adds purchase tracking to users and creates transactions table

-- Add purchase columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_purchased BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS purchase_date TIMESTAMPTZ;

-- Transactions table for purchase history
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),  -- NULL if user hasn't signed up yet
  email TEXT,
  stripe_customer_id TEXT,
  stripe_session_id TEXT,
  amount INTEGER,  -- Amount in cents
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'pending',  -- pending, completed, refunded, failed
  product_id TEXT,  -- 'pathfindr_premium'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add any missing columns to existing table (idempotent)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS amount INTEGER;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'usd';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS product_id TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Index for looking up transactions by email (for linking to users later)
CREATE INDEX IF NOT EXISTS idx_transactions_email ON transactions(email);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_session ON transactions(stripe_session_id);

-- Enable Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Service role can manage transactions" ON transactions;

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.email() = email
  );

-- Service role can insert/update transactions (webhook)
CREATE POLICY "Service role can manage transactions" ON transactions
  FOR ALL USING (true);

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to link pending transactions when a user signs up
CREATE OR REPLACE FUNCTION link_pending_transactions()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new user is created, check if they have pending transactions by email
  UPDATE transactions
  SET user_id = NEW.id
  WHERE email = NEW.email AND user_id IS NULL;

  -- If they had a completed transaction, mark them as purchased
  IF EXISTS (
    SELECT 1 FROM transactions
    WHERE email = NEW.email AND status = 'completed'
  ) THEN
    NEW.has_purchased := true;
    NEW.purchase_date := (
      SELECT created_at FROM transactions
      WHERE email = NEW.email AND status = 'completed'
      ORDER BY created_at ASC LIMIT 1
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to link transactions on user creation
DROP TRIGGER IF EXISTS on_user_created_link_transactions ON users;
CREATE TRIGGER on_user_created_link_transactions
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION link_pending_transactions();
