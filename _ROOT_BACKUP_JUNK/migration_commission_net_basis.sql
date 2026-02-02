ALTER TABLE professional_commission_rules ADD COLUMN IF NOT EXISTS calculation_basis TEXT DEFAULT 'gross' CHECK (calculation_basis IN ('gross', 'net'));
