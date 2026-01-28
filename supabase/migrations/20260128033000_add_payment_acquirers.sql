-- 1. Create Payment Acquirers Table
CREATE TABLE IF NOT EXISTS public.payment_acquirers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    organization_id UUID REFERENCES public.organizations(id),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(name, organization_id)
);

-- 2. Add acquirer_id to payment_method_fees
ALTER TABLE public.payment_method_fees 
ADD COLUMN IF NOT EXISTS acquirer_id UUID REFERENCES public.payment_acquirers(id);

-- 3. Add acquirer_id to appointments
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS acquirer_id UUID REFERENCES public.payment_acquirers(id);

-- 4. Enable RLS
ALTER TABLE public.payment_acquirers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can view their acquirers" 
ON public.payment_acquirers FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Auth users can manage their acquirers" 
ON public.payment_acquirers FOR ALL 
USING (auth.role() = 'authenticated');
