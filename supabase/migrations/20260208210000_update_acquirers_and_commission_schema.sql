-- Update Receipt Days for Acquirers and Enhance Commissioning Schema
-- Asaas and C6 now pay in D+30

-- 1. Update Acquirers
UPDATE public.payment_acquirers 
SET receipt_days = 30 
WHERE name IN ('Asaas', 'C6 Pay') AND organization_id IS NULL;

-- 2. Enhance professional_commission_rules with calculation_basis
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'professional_commission_rules' AND column_name = 'calculation_basis') THEN
        ALTER TABLE public.professional_commission_rules ADD COLUMN calculation_basis TEXT DEFAULT 'gross' CHECK (calculation_basis IN ('gross', 'net'));
    END IF;
END $$;

-- 3. Enhance profiles for Partner status and deductions (LGPD compliant as it's operational)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_partner') THEN
        ALTER TABLE public.profiles ADD COLUMN is_partner BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'tax_percent') THEN
        ALTER TABLE public.profiles ADD COLUMN tax_percent NUMERIC(5,2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'professional_expenses') THEN
        ALTER TABLE public.profiles ADD COLUMN professional_expenses NUMERIC(10,2) DEFAULT 0;
    END IF;
END $$;

-- 4. Reload schema cache
NOTIFY pgrst, 'reload config';
