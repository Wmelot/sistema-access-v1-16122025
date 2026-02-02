-- Add professional_id column to transactions table to link expenses/incomes to professionals
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS professional_id UUID REFERENCES profiles(id);

-- Optional: Add index for performance if filtering by professional happens often
CREATE INDEX IF NOT EXISTS idx_transactions_professional_id ON transactions(professional_id);

-- Reload Schema Cache (Supabase usually does this automatically on DDL, but good to know)
NOTIFY pgrst, 'reload config';
