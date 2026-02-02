-- ============================================
-- REPAIR & SEED: InfinitePay Fees based on FOTO 2
-- ============================================

-- 1. Ensure table structure is correct (fix for potential previous issues)
ALTER TABLE public.organization_payment_settings ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.payment_method_fees ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.card_brands ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 2. Ensure Unique constraints
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'card_brands_slug_organization_id_key') THEN
        ALTER TABLE public.card_brands ADD CONSTRAINT card_brands_slug_organization_id_key UNIQUE (slug, organization_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'organization_payment_settings_organization_id_key') THEN
        ALTER TABLE public.organization_payment_settings ADD CONSTRAINT organization_payment_settings_organization_id_key UNIQUE (organization_id);
    END IF;
END $$;

-- 3. Get Organization ID for Access Fisioterapia
DO $$
DECLARE
    v_org_id UUID;
    v_visa_id UUID;
    v_master_id UUID;
    v_elo_id UUID;
    v_amex_id UUID;
    v_hiper_id UUID;
BEGIN
    SELECT id INTO v_org_id FROM organizations WHERE name ILIKE '%access%fisio%' LIMIT 1;
    
    IF v_org_id IS NOT NULL THEN
        -- Ensure brands exist for this org (or use global ones, but let's make them org-specific for best control)
        INSERT INTO public.card_brands (name, slug, organization_id, active)
        VALUES 
            ('Visa', 'visa', v_org_id, true),
            ('Mastercard', 'mastercard', v_org_id, true),
            ('Elo', 'elo', v_org_id, true),
            ('Amex', 'amex', v_org_id, true),
            ('Hipercard', 'hipercard', v_org_id, true)
        ON CONFLICT (slug, organization_id) DO UPDATE SET active = true
        RETURNING id INTO v_visa_id; -- Just to get one, we'll fetch others

        SELECT id INTO v_visa_id FROM card_brands WHERE slug = 'visa' AND organization_id = v_org_id;
        SELECT id INTO v_master_id FROM card_brands WHERE slug = 'mastercard' AND organization_id = v_org_id;
        SELECT id INTO v_elo_id FROM card_brands WHERE slug = 'elo' AND organization_id = v_org_id;
        SELECT id INTO v_amex_id FROM card_brands WHERE slug = 'amex' AND organization_id = v_org_id;
        SELECT id INTO v_hiper_id FROM card_brands WHERE slug = 'hipercard' AND organization_id = v_org_id;

        -- DELETE OLD FEES to avoid "Sem Bandeira" and duplicates
        DELETE FROM public.payment_method_fees WHERE organization_id = v_org_id OR organization_id IS NULL;

        -- SEED GRUPO 1: Visa / Mastercard
        -- Pix
        INSERT INTO public.payment_method_fees (method, installments, fee_percent, card_brand_id, organization_id)
        VALUES ('pix', 1, 0.00, v_visa_id, v_org_id), ('pix', 1, 0.00, v_master_id, v_org_id);
        -- Débito
        INSERT INTO public.payment_method_fees (method, installments, fee_percent, card_brand_id, organization_id)
        VALUES ('debit_card', 1, 1.37, v_visa_id, v_org_id), ('debit_card', 1, 1.37, v_master_id, v_org_id);
        -- Crédito (1x-12x)
        INSERT INTO public.payment_method_fees (method, installments, fee_percent, card_brand_id, organization_id) VALUES
        ('credit_card', 1, 3.15, v_visa_id, v_org_id), ('credit_card', 2, 5.39, v_visa_id, v_org_id),
        ('credit_card', 3, 6.12, v_visa_id, v_org_id), ('credit_card', 4, 6.85, v_visa_id, v_org_id),
        ('credit_card', 5, 7.57, v_visa_id, v_org_id), ('credit_card', 6, 8.28, v_visa_id, v_org_id),
        ('credit_card', 7, 8.99, v_visa_id, v_org_id), ('credit_card', 8, 9.69, v_visa_id, v_org_id),
        ('credit_card', 9, 10.38, v_visa_id, v_org_id), ('credit_card', 10, 11.06, v_visa_id, v_org_id),
        ('credit_card', 11, 11.74, v_visa_id, v_org_id), ('credit_card', 12, 12.40, v_visa_id, v_org_id);

        INSERT INTO public.payment_method_fees (method, installments, fee_percent, card_brand_id, organization_id) VALUES
        ('credit_card', 1, 3.15, v_master_id, v_org_id), ('credit_card', 2, 5.39, v_master_id, v_org_id),
        ('credit_card', 3, 6.12, v_master_id, v_org_id), ('credit_card', 4, 6.85, v_master_id, v_org_id),
        ('credit_card', 5, 7.57, v_master_id, v_org_id), ('credit_card', 6, 8.28, v_master_id, v_org_id),
        ('credit_card', 7, 8.99, v_master_id, v_org_id), ('credit_card', 8, 9.69, v_master_id, v_org_id),
        ('credit_card', 9, 10.38, v_master_id, v_org_id), ('credit_card', 10, 11.06, v_master_id, v_org_id),
        ('credit_card', 11, 11.74, v_master_id, v_org_id), ('credit_card', 12, 12.40, v_master_id, v_org_id);

        -- SEED GRUPO 2: Elo / Amex / Hiper
        -- Pix
        INSERT INTO public.payment_method_fees (method, installments, fee_percent, card_brand_id, organization_id)
        VALUES ('pix', 1, 0.00, v_elo_id, v_org_id), ('pix', 1, 0.00, v_amex_id, v_org_id), ('pix', 1, 0.00, v_hiper_id, v_org_id);
        -- Débito
        INSERT INTO public.payment_method_fees (method, installments, fee_percent, card_brand_id, organization_id)
        VALUES ('debit_card', 1, 2.58, v_elo_id, v_org_id), ('debit_card', 1, 2.58, v_amex_id, v_org_id), ('debit_card', 1, 2.58, v_hiper_id, v_org_id);
        -- Crédito (1x-12x)
        INSERT INTO public.payment_method_fees (method, installments, fee_percent, card_brand_id, organization_id) VALUES
        ('credit_card', 1, 4.91, v_elo_id, v_org_id), ('credit_card', 2, 6.47, v_elo_id, v_org_id),
        ('credit_card', 3, 7.20, v_elo_id, v_org_id), ('credit_card', 4, 7.92, v_elo_id, v_org_id),
        ('credit_card', 5, 8.63, v_elo_id, v_org_id), ('credit_card', 6, 9.33, v_elo_id, v_org_id),
        ('credit_card', 7, 10.03, v_elo_id, v_org_id), ('credit_card', 8, 10.72, v_elo_id, v_org_id),
        ('credit_card', 9, 11.41, v_elo_id, v_org_id), ('credit_card', 10, 12.08, v_elo_id, v_org_id),
        ('credit_card', 11, 12.75, v_elo_id, v_org_id), ('credit_card', 12, 13.41, v_elo_id, v_org_id);

        INSERT INTO public.payment_method_fees (method, installments, fee_percent, card_brand_id, organization_id) VALUES
        ('credit_card', 1, 4.91, v_amex_id, v_org_id), ('credit_card', 2, 6.47, v_amex_id, v_org_id),
        ('credit_card', 3, 7.20, v_amex_id, v_org_id), ('credit_card', 4, 7.92, v_amex_id, v_org_id),
        ('credit_card', 5, 8.63, v_amex_id, v_org_id), ('credit_card', 6, 9.33, v_amex_id, v_org_id),
        ('credit_card', 7, 10.03, v_amex_id, v_org_id), ('credit_card', 8, 10.72, v_amex_id, v_org_id),
        ('credit_card', 9, 11.41, v_amex_id, v_org_id), ('credit_card', 10, 12.08, v_amex_id, v_org_id),
        ('credit_card', 11, 12.75, v_amex_id, v_org_id), ('credit_card', 12, 13.41, v_amex_id, v_org_id);

        INSERT INTO public.payment_method_fees (method, installments, fee_percent, card_brand_id, organization_id) VALUES
        ('credit_card', 1, 4.91, v_hiper_id, v_org_id), ('credit_card', 2, 6.47, v_hiper_id, v_org_id),
        ('credit_card', 3, 7.20, v_hiper_id, v_org_id), ('credit_card', 4, 7.92, v_hiper_id, v_org_id),
        ('credit_card', 5, 8.63, v_hiper_id, v_org_id), ('credit_card', 6, 9.33, v_hiper_id, v_org_id),
        ('credit_card', 7, 10.03, v_hiper_id, v_org_id), ('credit_card', 8, 10.72, v_hiper_id, v_org_id),
        ('credit_card', 9, 11.41, v_hiper_id, v_org_id), ('credit_card', 10, 12.08, v_hiper_id, v_org_id),
        ('credit_card', 11, 12.75, v_hiper_id, v_org_id), ('credit_card', 12, 13.41, v_hiper_id, v_org_id);
    END IF;
END $$;
