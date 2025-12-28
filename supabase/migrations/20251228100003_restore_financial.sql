-- Restore Missing Financial Tables

-- 1. Payment Methods
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    active BOOLEAN DEFAULT true
);

-- Seed defaults
INSERT INTO public.payment_methods (name) VALUES 
('Dinheiro'),
('Pix'),
('Cartão de Crédito'),
('Cartão de Débito')
ON CONFLICT DO NOTHING;

-- 2. Payment Method Fees
CREATE TABLE IF NOT EXISTS public.payment_method_fees (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    method TEXT NOT NULL, -- slug: credit_card, debit_card, pix
    installments INTEGER DEFAULT 1,
    fee_percent NUMERIC(5,2) DEFAULT 0
);

-- 3. Financial Categories
CREATE TABLE IF NOT EXISTS public.financial_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('income', 'expense'))
);

-- 4. Invoices (Faturas/Recibos)
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    total NUMERIC(10,2) NOT NULL DEFAULT 0,
    payment_method TEXT, -- Storing name for simplicity or historical
    payment_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'canceled')),
    patient_id UUID REFERENCES public.patients(id),
    appointment_id UUID REFERENCES public.appointments(id)
);

-- 5. Financial Payables (Contas a Pagar linked to Pros)
CREATE TABLE IF NOT EXISTS public.financial_payables (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    due_date DATE NOT NULL,
    description TEXT,
    linked_professional_id UUID REFERENCES public.profiles(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'canceled')),
    paid_at TIMESTAMP WITH TIME ZONE
);

-- 6. Financial Commissions (Comissões)
CREATE TABLE IF NOT EXISTS public.financial_commissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL, -- usually appointment date
    amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'canceled')),
    paid_at TIMESTAMP WITH TIME ZONE,
    appointment_id UUID REFERENCES public.appointments(id),
    professional_id UUID REFERENCES public.profiles(id)
);

-- 7. Commission Rules
CREATE TABLE IF NOT EXISTS public.professional_commission_rules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    professional_id UUID REFERENCES public.profiles(id),
    service_id UUID REFERENCES public.services(id), -- Nullable for Global Rule
    type TEXT CHECK (type IN ('percentage', 'fixed')),
    value NUMERIC(10,2) NOT NULL DEFAULT 0
);

-- 8. Update Appointments with Payment Method FK
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS payment_method_id UUID REFERENCES public.payment_methods(id);

-- Enable RLS (Simple generic policy)
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_method_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_payables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_commission_rules ENABLE ROW LEVEL SECURITY;

-- Grant access to authenticated users
CREATE POLICY "Auth users full access payment_methods" ON public.payment_methods FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users full access payment_method_fees" ON public.payment_method_fees FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users full access financial_categories" ON public.financial_categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users full access invoices" ON public.invoices FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users full access financial_payables" ON public.financial_payables FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users full access financial_commissions" ON public.financial_commissions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users full access professional_commission_rules" ON public.professional_commission_rules FOR ALL USING (auth.role() = 'authenticated');

-- Reload schema cache
NOTIFY pgrst, 'reload config';
