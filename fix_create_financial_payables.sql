-- Fix: Create missing financial_payables table
CREATE TABLE IF NOT EXISTS public.financial_payables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    description TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    due_date DATE,
    paid_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    category TEXT DEFAULT 'general', -- simples, gps, salary, marketing, etc.
    is_excluded BOOLEAN DEFAULT false,
    recurrence TEXT, -- monthly, etc
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) -- Optional: who created
);

-- Index
CREATE INDEX IF NOT EXISTS idx_fin_payables_status ON public.financial_payables(status);
CREATE INDEX IF NOT EXISTS idx_fin_payables_due_date ON public.financial_payables(due_date);

-- RLS
ALTER TABLE public.financial_payables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view payables" ON public.financial_payables FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert payables" ON public.financial_payables FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update payables" ON public.financial_payables FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete payables" ON public.financial_payables FOR DELETE USING (auth.role() = 'authenticated');

-- Grant
GRANT ALL ON public.financial_payables TO authenticated;
GRANT ALL ON public.financial_payables TO service_role;
