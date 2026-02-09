-- Migration: Create Financial Monthly Configurations
-- Purpose: Store monthly tax rates and other global deductors for payroll calculation.

CREATE TABLE IF NOT EXISTS public.financial_monthly_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    target_month INTEGER NOT NULL CHECK (target_month >= 1 AND target_month <= 12),
    target_year INTEGER NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    other_deductions DECIMAL(12,2) DEFAULT 0,
    monthly_expenses_override DECIMAL(12,2) DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, target_month, target_year)
);

-- Enable RLS
ALTER TABLE public.financial_monthly_configs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can see monthly configs of their organization"
    ON public.financial_monthly_configs
    FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update monthly configs of their organization"
    ON public.financial_monthly_configs
    FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    ));

-- Grant permissions
GRANT ALL ON public.financial_monthly_configs TO authenticated;
GRANT ALL ON public.financial_monthly_configs TO service_role;
