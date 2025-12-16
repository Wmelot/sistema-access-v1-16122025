-- Add categories and control flags to financial_payables
ALTER TABLE financial_payables
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general', -- 'simples', 'gps', 'partner_distribution', 'salary', 'general'
ADD COLUMN IF NOT EXISTS is_excluded BOOLEAN DEFAULT FALSE, -- If TRUE, ignored in "Expenses" sum (e.g. personal salary or already deducted tax)
ADD COLUMN IF NOT EXISTS linked_professional_id UUID REFERENCES profiles(id); -- To link a distribution to a specific partner

-- Add comment explaining categories
COMMENT ON COLUMN financial_payables.category IS 'simples, gps, partner_distribution, salary, general';
