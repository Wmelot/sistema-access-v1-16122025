-- Migration: Payment Methods with Card Brands Support
-- This migration adds support for card brands (Visa, Mastercard, Elo, etc.) 
-- and allows different fees per brand and installment

-- 1. Create Card Brands Table
CREATE TABLE IF NOT EXISTS public.card_brands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    icon_emoji TEXT, -- Emoji representation for now (can be replaced with URLs later)
    organization_id UUID REFERENCES public.organizations(id),
    UNIQUE(slug, organization_id)
);

-- 2. Seed Default Card Brands (Global - no organization_id)
INSERT INTO public.card_brands (name, slug, icon_emoji, organization_id) VALUES 
('Visa', 'visa', '💳', NULL),
('Mastercard', 'mastercard', '💳', NULL),
('Elo', 'elo', '💳', NULL),
('American Express', 'amex', '💳', NULL),
('Hipercard', 'hipercard', '💳', NULL)
ON CONFLICT DO NOTHING;

-- 3. Add card_brand_id to payment_method_fees
ALTER TABLE public.payment_method_fees 
ADD COLUMN IF NOT EXISTS card_brand_id UUID REFERENCES public.card_brands(id);

-- 4. Create Organization Settings for Max Installments
CREATE TABLE IF NOT EXISTS public.organization_payment_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) UNIQUE NOT NULL,
    max_installments INTEGER DEFAULT 12 CHECK (max_installments >= 1 AND max_installments <= 24),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Seed InfinitePay Fees (Visa/Mastercard)
-- First, get the Visa brand ID
DO $$
DECLARE
    visa_id UUID;
    mastercard_id UUID;
    elo_id UUID;
    amex_id UUID;
BEGIN
    -- Get brand IDs
    SELECT id INTO visa_id FROM public.card_brands WHERE slug = 'visa' AND organization_id IS NULL LIMIT 1;
    SELECT id INTO mastercard_id FROM public.card_brands WHERE slug = 'mastercard' AND organization_id IS NULL LIMIT 1;
    SELECT id INTO elo_id FROM public.card_brands WHERE slug = 'elo' AND organization_id IS NULL LIMIT 1;
    SELECT id INTO amex_id FROM public.card_brands WHERE slug = 'amex' AND organization_id IS NULL LIMIT 1;

    -- Visa/Mastercard Debit
    INSERT INTO public.payment_method_fees (method, installments, fee_percent, card_brand_id) 
    VALUES ('debit_card', 1, 1.37, visa_id) ON CONFLICT DO NOTHING;
    
    INSERT INTO public.payment_method_fees (method, installments, fee_percent, card_brand_id) 
    VALUES ('debit_card', 1, 1.37, mastercard_id) ON CONFLICT DO NOTHING;

    -- Visa/Mastercard Credit (1x-12x)
    INSERT INTO public.payment_method_fees (method, installments, fee_percent, card_brand_id) VALUES 
    ('credit_card', 1, 3.15, visa_id),
    ('credit_card', 2, 5.39, visa_id),
    ('credit_card', 3, 6.12, visa_id),
    ('credit_card', 4, 6.85, visa_id),
    ('credit_card', 5, 7.57, visa_id),
    ('credit_card', 6, 8.28, visa_id),
    ('credit_card', 7, 8.99, visa_id),
    ('credit_card', 8, 9.69, visa_id),
    ('credit_card', 9, 10.38, visa_id),
    ('credit_card', 10, 11.06, visa_id),
    ('credit_card', 11, 11.74, visa_id),
    ('credit_card', 12, 12.40, visa_id)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.payment_method_fees (method, installments, fee_percent, card_brand_id) VALUES 
    ('credit_card', 1, 3.15, mastercard_id),
    ('credit_card', 2, 5.39, mastercard_id),
    ('credit_card', 3, 6.12, mastercard_id),
    ('credit_card', 4, 6.85, mastercard_id),
    ('credit_card', 5, 7.57, mastercard_id),
    ('credit_card', 6, 8.28, mastercard_id),
    ('credit_card', 7, 8.99, mastercard_id),
    ('credit_card', 8, 9.69, mastercard_id),
    ('credit_card', 9, 10.38, mastercard_id),
    ('credit_card', 10, 11.06, mastercard_id),
    ('credit_card', 11, 11.74, mastercard_id),
    ('credit_card', 12, 12.40, mastercard_id)
    ON CONFLICT DO NOTHING;

    -- Elo/Amex Debit
    INSERT INTO public.payment_method_fees (method, installments, fee_percent, card_brand_id) 
    VALUES ('debit_card', 1, 5.58, elo_id) ON CONFLICT DO NOTHING;
    
    INSERT INTO public.payment_method_fees (method, installments, fee_percent, card_brand_id) 
    VALUES ('debit_card', 1, 5.58, amex_id) ON CONFLICT DO NOTHING;

    -- Elo/Amex Credit (1x-12x)
    INSERT INTO public.payment_method_fees (method, installments, fee_percent, card_brand_id) VALUES 
    ('credit_card', 1, 4.91, elo_id),
    ('credit_card', 2, 6.67, elo_id),
    ('credit_card', 3, 7.20, elo_id),
    ('credit_card', 4, 7.92, elo_id),
    ('credit_card', 5, 8.63, elo_id),
    ('credit_card', 6, 9.33, elo_id),
    ('credit_card', 7, 10.03, elo_id),
    ('credit_card', 8, 10.72, elo_id),
    ('credit_card', 9, 11.41, elo_id),
    ('credit_card', 10, 12.08, elo_id),
    ('credit_card', 11, 12.75, elo_id),
    ('credit_card', 12, 13.41, elo_id)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.payment_method_fees (method, installments, fee_percent, card_brand_id) VALUES 
    ('credit_card', 1, 4.91, amex_id),
    ('credit_card', 2, 6.67, amex_id),
    ('credit_card', 3, 7.20, amex_id),
    ('credit_card', 4, 7.92, amex_id),
    ('credit_card', 5, 8.63, amex_id),
    ('credit_card', 6, 9.33, amex_id),
    ('credit_card', 7, 10.03, amex_id),
    ('credit_card', 8, 10.72, amex_id),
    ('credit_card', 9, 11.41, amex_id),
    ('credit_card', 10, 12.08, amex_id),
    ('credit_card', 11, 12.75, amex_id),
    ('credit_card', 12, 13.41, amex_id)
    ON CONFLICT DO NOTHING;
END $$;

-- 6. Enable RLS
ALTER TABLE public.card_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_payment_settings ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies
CREATE POLICY "Auth users can view card brands" 
ON public.card_brands FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Auth users can manage org card brands" 
ON public.card_brands FOR ALL 
USING (auth.role() = 'authenticated');

CREATE POLICY "Auth users can manage payment settings" 
ON public.organization_payment_settings FOR ALL 
USING (auth.role() = 'authenticated');

-- 8. Reload schema
NOTIFY pgrst, 'reload config';
