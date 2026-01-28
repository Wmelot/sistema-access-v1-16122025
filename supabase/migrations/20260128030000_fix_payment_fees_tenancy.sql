-- Migration: Fix Multi-tenancy for Payment Fees
-- Add organization_id to payment_method_fees and update constraints

ALTER TABLE public.payment_method_fees 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- Update existing fees to belong to Access Fisioterapia (as a starting point) 
-- but only if they don't have one already
DO $$
DECLARE
    v_org_id UUID;
BEGIN
    SELECT id INTO v_org_id FROM public.organizations WHERE name ILIKE '%access%fisio%' LIMIT 1;
    IF v_org_id IS NOT NULL THEN
        UPDATE public.payment_method_fees SET organization_id = v_org_id WHERE organization_id IS NULL;
    END IF;
END $$;

-- Add RLS to payment_method_fees
ALTER TABLE public.payment_method_fees ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_method_fees
DROP POLICY IF EXISTS "Auth users can view their own fees" ON public.payment_method_fees;
CREATE POLICY "Auth users can view their own fees" 
ON public.payment_method_fees FOR SELECT 
USING (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) OR organization_id IS NULL
);

DROP POLICY IF EXISTS "Auth users can manage their own fees" ON public.payment_method_fees;
CREATE POLICY "Auth users can manage their own fees" 
ON public.payment_method_fees FOR ALL 
USING (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);
