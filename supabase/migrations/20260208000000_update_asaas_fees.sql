-- Migration: Update Asaas Fees with values from screenshots
-- Date: 2026-02-08

-- Ensure fee_fixed column exists
ALTER TABLE public.payment_method_fees ADD COLUMN IF NOT EXISTS fee_fixed NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS fee_fixed NUMERIC(10,2) DEFAULT 0;

DO $$
DECLARE
    v_asaas_id UUID;
    v_visa_id UUID;
    v_master_id UUID;
    v_elo_id UUID;
    v_amex_id UUID;
    v_hiper_id UUID;
BEGIN
    -- 1. Get Asaas Acquirer ID
    SELECT id INTO v_asaas_id FROM public.payment_acquirers WHERE name = 'Asaas' LIMIT 1;
    
    IF v_asaas_id IS NULL THEN
        INSERT INTO public.payment_acquirers (name, active) VALUES ('Asaas', true) RETURNING id INTO v_asaas_id;
    END IF;

    -- 2. Get/Ensure Card Brands
    SELECT id INTO v_visa_id FROM public.card_brands WHERE slug = 'visa' LIMIT 1;
    SELECT id INTO v_master_id FROM public.card_brands WHERE slug = 'mastercard' LIMIT 1;
    SELECT id INTO v_elo_id FROM public.card_brands WHERE slug = 'elo' LIMIT 1;
    SELECT id INTO v_amex_id FROM public.card_brands WHERE slug = 'amex' LIMIT 1;
    SELECT id INTO v_hiper_id FROM public.card_brands WHERE slug = 'hipercard' LIMIT 1;

    -- 3. Clear existing fees for Asaas (Global ones) to re-seed correctly
    DELETE FROM public.payment_method_fees WHERE acquirer_id = v_asaas_id AND organization_id IS NULL;

    -- 4. Seed Credit Card Online (Promotional rates valid until 11/04/2026)
    -- 1x: 1.99% + 0.49
    -- 2-6x: 2.49% + 0.49
    -- 7-12x: 2.99% + 0.49
    -- 13-21x: 3.29% + 0.49

    FOR i IN 1..21 LOOP
        DECLARE
            v_percent NUMERIC(5,2);
            v_fixed NUMERIC(10,2) := 0.49;
        BEGIN
            IF i = 1 THEN v_percent := 1.99;
            ELSIF i <= 6 THEN v_percent := 2.49;
            ELSIF i <= 12 THEN v_percent := 2.99;
            ELSE v_percent := 3.29;
            END IF;

            -- Insert for each brand
            IF v_visa_id IS NOT NULL THEN
                INSERT INTO public.payment_method_fees (method, installments, fee_percent, fee_fixed, card_brand_id, acquirer_id, organization_id)
                VALUES ('credit_card', i, v_percent, v_fixed, v_visa_id, v_asaas_id, NULL);
            END IF;
            IF v_master_id IS NOT NULL THEN
                INSERT INTO public.payment_method_fees (method, installments, fee_percent, fee_fixed, card_brand_id, acquirer_id, organization_id)
                VALUES ('credit_card', i, v_percent, v_fixed, v_master_id, v_asaas_id, NULL);
            END IF;
            IF v_elo_id IS NOT NULL THEN
                INSERT INTO public.payment_method_fees (method, installments, fee_percent, fee_fixed, card_brand_id, acquirer_id, organization_id)
                VALUES ('credit_card', i, v_percent, v_fixed, v_elo_id, v_asaas_id, NULL);
            END IF;
            IF v_amex_id IS NOT NULL THEN
                INSERT INTO public.payment_method_fees (method, installments, fee_percent, fee_fixed, card_brand_id, acquirer_id, organization_id)
                VALUES ('credit_card', i, v_percent, v_fixed, v_amex_id, v_asaas_id, NULL);
            END IF;
            IF v_hiper_id IS NOT NULL THEN
                INSERT INTO public.payment_method_fees (method, installments, fee_percent, fee_fixed, card_brand_id, acquirer_id, organization_id)
                VALUES ('credit_card', i, v_percent, v_fixed, v_hiper_id, v_asaas_id, NULL);
            END IF;
        END;
    END LOOP;

    -- 5. Seed Debit Card Online (1.89% + 0.35)
    IF v_visa_id IS NOT NULL THEN
        INSERT INTO public.payment_method_fees (method, installments, fee_percent, fee_fixed, card_brand_id, acquirer_id, organization_id)
        VALUES ('debit_card', 1, 1.89, 0.35, v_visa_id, v_asaas_id, NULL);
    END IF;
    IF v_master_id IS NOT NULL THEN
        INSERT INTO public.payment_method_fees (method, installments, fee_percent, fee_fixed, card_brand_id, acquirer_id, organization_id)
        VALUES ('debit_card', 1, 1.89, 0.35, v_master_id, v_asaas_id, NULL);
    END IF;

    -- 6. Seed Pix (0% + 0)
    INSERT INTO public.payment_method_fees (method, installments, fee_percent, fee_fixed, card_brand_id, acquirer_id, organization_id)
    VALUES ('pix', 1, 0.00, 0.00, NULL, v_asaas_id, NULL);

    -- 7. Seed Boleto (Promotional: 0.99)
    INSERT INTO public.payment_method_fees (method, installments, fee_percent, fee_fixed, card_brand_id, acquirer_id, organization_id)
    VALUES ('boleto', 1, 0.00, 0.99, NULL, v_asaas_id, NULL);

END $$;
