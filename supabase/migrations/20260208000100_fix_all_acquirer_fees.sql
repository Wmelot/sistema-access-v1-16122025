-- Migration: Comprehensive Fix for All Acquirer Fees based on User Photos
-- Date: 2026-02-08

DO $$
DECLARE
    v_asaas_id UUID;
    v_infinite_id UUID;
    v_c6_id UUID;
    v_sumup_id UUID;
    
    v_visa_id UUID;
    v_master_id UUID;
    v_elo_id UUID;
    v_amex_id UUID;
    v_hiper_id UUID;
BEGIN
    -- 1. Get Acquirer IDs
    SELECT id INTO v_asaas_id FROM public.payment_acquirers WHERE name = 'Asaas' LIMIT 1;
    SELECT id INTO v_infinite_id FROM public.payment_acquirers WHERE name = 'InfinitePay' LIMIT 1;
    SELECT id INTO v_c6_id FROM public.payment_acquirers WHERE name = 'C6 Pay' LIMIT 1;
    SELECT id INTO v_sumup_id FROM public.payment_acquirers WHERE name = 'SumUp' LIMIT 1;

    -- Ensure they exist
    IF v_asaas_id IS NULL THEN INSERT INTO public.payment_acquirers (name, active) VALUES ('Asaas', true) RETURNING id INTO v_asaas_id; END IF;
    IF v_infinite_id IS NULL THEN INSERT INTO public.payment_acquirers (name, active) VALUES ('InfinitePay', true) RETURNING id INTO v_infinite_id; END IF;
    IF v_c6_id IS NULL THEN INSERT INTO public.payment_acquirers (name, active) VALUES ('C6 Pay', true) RETURNING id INTO v_c6_id; END IF;
    IF v_sumup_id IS NULL THEN INSERT INTO public.payment_acquirers (name, active) VALUES ('SumUp', true) RETURNING id INTO v_sumup_id; END IF;

    -- 2. Get Card Brand IDs
    SELECT id INTO v_visa_id FROM public.card_brands WHERE slug = 'visa' LIMIT 1;
    SELECT id INTO v_master_id FROM public.card_brands WHERE slug = 'mastercard' LIMIT 1;
    SELECT id INTO v_elo_id FROM public.card_brands WHERE slug = 'elo' LIMIT 1;
    SELECT id INTO v_amex_id FROM public.card_brands WHERE slug = 'amex' LIMIT 1;
    SELECT id INTO v_hiper_id FROM public.card_brands WHERE slug = 'hipercard' LIMIT 1;

    -- 3. Clear existing GLOBAL fees for these acquirers
    DELETE FROM public.payment_method_fees 
    WHERE acquirer_id IN (v_asaas_id, v_infinite_id, v_c6_id, v_sumup_id) 
    AND organization_id IS NULL;

    -- ==========================================
    -- 4. ASAAS (Photo 1 - Using Promotional Rates)
    -- ==========================================
    -- Credit (Online)
    FOR i IN 1..21 LOOP
        DECLARE
            v_per NUMERIC := 3.29; -- 13-21x
        BEGIN
            IF i = 1 THEN v_per := 1.99;
            ELSIF i <= 6 THEN v_per := 2.49;
            ELSIF i <= 12 THEN v_per := 2.99;
            END IF;
            
            INSERT INTO public.payment_method_fees (method, installments, fee_percent, fee_fixed, card_brand_id, acquirer_id)
            VALUES ('credit_card', i, v_per, 0.49, v_visa_id, v_asaas_id),
                   ('credit_card', i, v_per, 0.49, v_master_id, v_asaas_id),
                   ('credit_card', i, v_per, 0.49, v_elo_id, v_asaas_id),
                   ('credit_card', i, v_per, 0.49, v_amex_id, v_asaas_id),
                   ('credit_card', i, v_per, 0.49, v_hiper_id, v_asaas_id);
        END;
    END LOOP;
    -- Debit (Online)
    INSERT INTO public.payment_method_fees (method, installments, fee_percent, fee_fixed, card_brand_id, acquirer_id)
    VALUES ('debit_card', 1, 1.89, 0.35, v_visa_id, v_asaas_id),
           ('debit_card', 1, 1.89, 0.35, v_master_id, v_asaas_id);
    -- Boleto
    INSERT INTO public.payment_method_fees (method, installments, fee_percent, fee_fixed, card_brand_id, acquirer_id)
    VALUES ('boleto', 1, 0.00, 0.99, NULL, v_asaas_id);
    -- Pix
    INSERT INTO public.payment_method_fees (method, installments, fee_percent, fee_fixed, card_brand_id, acquirer_id)
    VALUES ('pix', 1, 0.00, 0.00, NULL, v_asaas_id);

    -- ==========================================
    -- 5. INFINITEPAY (Photo 2)
    -- ==========================================
    -- Visa/Master
    INSERT INTO public.payment_method_fees (method, installments, fee_percent, fee_fixed, card_brand_id, acquirer_id)
    VALUES ('debit_card', 1, 1.37, 0.00, v_visa_id, v_infinite_id),
           ('debit_card', 1, 1.37, 0.00, v_master_id, v_infinite_id),
           ('credit_card', 1, 3.15, 0.00, v_visa_id, v_infinite_id),
           ('credit_card', 1, 3.15, 0.00, v_master_id, v_infinite_id),
           ('credit_card', 2, 5.39, 0.00, v_visa_id, v_infinite_id),
           ('credit_card', 2, 5.39, 0.00, v_master_id, v_infinite_id),
           ('credit_card', 3, 6.12, 0.00, v_visa_id, v_infinite_id),
           ('credit_card', 3, 6.12, 0.00, v_master_id, v_infinite_id),
           ('credit_card', 4, 6.85, 0.00, v_visa_id, v_infinite_id),
           ('credit_card', 4, 6.85, 0.00, v_master_id, v_infinite_id),
           ('credit_card', 5, 7.57, 0.00, v_visa_id, v_infinite_id),
           ('credit_card', 5, 7.57, 0.00, v_master_id, v_infinite_id),
           ('credit_card', 6, 8.28, 0.00, v_visa_id, v_infinite_id),
           ('credit_card', 6, 8.28, 0.00, v_master_id, v_infinite_id),
           ('credit_card', 7, 8.99, 0.00, v_visa_id, v_infinite_id),
           ('credit_card', 7, 8.99, 0.00, v_master_id, v_infinite_id),
           ('credit_card', 8, 9.69, 0.00, v_visa_id, v_infinite_id),
           ('credit_card', 8, 9.69, 0.00, v_master_id, v_infinite_id),
           ('credit_card', 9, 10.38, 0.00, v_visa_id, v_infinite_id),
           ('credit_card', 9, 10.38, 0.00, v_master_id, v_infinite_id),
           ('credit_card', 10, 11.06, 0.00, v_visa_id, v_infinite_id),
           ('credit_card', 10, 11.06, 0.00, v_master_id, v_infinite_id),
           ('credit_card', 11, 11.74, 0.00, v_visa_id, v_infinite_id),
           ('credit_card', 11, 11.74, 0.00, v_master_id, v_infinite_id),
           ('credit_card', 12, 12.40, 0.00, v_visa_id, v_infinite_id),
           ('credit_card', 12, 12.40, 0.00, v_master_id, v_infinite_id);
    
    -- Elo/Amex
    INSERT INTO public.payment_method_fees (method, installments, fee_percent, fee_fixed, card_brand_id, acquirer_id)
    VALUES ('debit_card', 1, 2.58, 0.00, v_elo_id, v_infinite_id),
           ('debit_card', 1, 2.58, 0.00, v_amex_id, v_infinite_id),
           ('credit_card', 1, 4.91, 0.00, v_elo_id, v_infinite_id),
           ('credit_card', 1, 4.91, 0.00, v_amex_id, v_infinite_id),
           ('credit_card', 2, 6.47, 0.00, v_elo_id, v_infinite_id),
           ('credit_card', 2, 6.47, 0.00, v_amex_id, v_infinite_id),
           ('credit_card', 3, 7.20, 0.00, v_elo_id, v_infinite_id),
           ('credit_card', 3, 7.20, 0.00, v_amex_id, v_infinite_id),
           ('credit_card', 4, 7.92, 0.00, v_elo_id, v_infinite_id),
           ('credit_card', 4, 7.92, 0.00, v_amex_id, v_infinite_id),
           ('credit_card', 5, 8.63, 0.00, v_elo_id, v_infinite_id),
           ('credit_card', 5, 8.63, 0.00, v_amex_id, v_infinite_id),
           ('credit_card', 6, 9.33, 0.00, v_elo_id, v_infinite_id),
           ('credit_card', 6, 9.33, 0.00, v_amex_id, v_infinite_id),
           ('credit_card', 7, 10.03, 0.00, v_elo_id, v_infinite_id),
           ('credit_card', 7, 10.03, 0.00, v_amex_id, v_infinite_id),
           ('credit_card', 8, 10.72, 0.00, v_elo_id, v_infinite_id),
           ('credit_card', 8, 10.72, 0.00, v_amex_id, v_infinite_id),
           ('credit_card', 9, 11.41, 0.00, v_elo_id, v_infinite_id),
           ('credit_card', 9, 11.41, 0.00, v_amex_id, v_infinite_id),
           ('credit_card', 10, 12.08, 0.00, v_elo_id, v_infinite_id),
           ('credit_card', 10, 12.08, 0.00, v_amex_id, v_infinite_id),
           ('credit_card', 11, 12.75, 0.00, v_elo_id, v_infinite_id),
           ('credit_card', 11, 12.75, 0.00, v_amex_id, v_infinite_id),
           ('credit_card', 12, 13.41, 0.00, v_elo_id, v_infinite_id),
           ('credit_card', 12, 13.41, 0.00, v_amex_id, v_infinite_id);

    -- Pix
    INSERT INTO public.payment_method_fees (method, installments, fee_percent, fee_fixed, card_brand_id, acquirer_id)
    VALUES ('pix', 1, 0.00, 0.00, NULL, v_infinite_id);

    -- ==========================================
    -- 6. C6 PAY (Photo 3 & 4)
    -- ==========================================
    -- Visa/Master
    INSERT INTO public.payment_method_fees (method, installments, fee_percent, fee_fixed, card_brand_id, acquirer_id)
    VALUES ('debit_card', 1, 1.89, 0.35, v_visa_id, v_c6_id),
           ('debit_card', 1, 1.89, 0.35, v_master_id, v_c6_id),
           ('credit_card', 1, 3.39, 0.35, v_visa_id, v_c6_id),
           ('credit_card', 1, 3.39, 0.35, v_master_id, v_c6_id);
    FOR i IN 2..12 LOOP
        INSERT INTO public.payment_method_fees (method, installments, fee_percent, fee_fixed, card_brand_id, acquirer_id)
        VALUES ('credit_card', i, 3.69, 0.35, v_visa_id, v_c6_id),
               ('credit_card', i, 3.69, 0.35, v_master_id, v_c6_id);
    END LOOP;

    -- Amex/Elo/Hiper
    INSERT INTO public.payment_method_fees (method, installments, fee_percent, fee_fixed, card_brand_id, acquirer_id)
    VALUES ('debit_card', 1, 2.59, 0.35, v_elo_id, v_c6_id),
           ('debit_card', 1, 2.59, 0.35, v_amex_id, v_c6_id),
           ('debit_card', 1, 2.59, 0.35, v_hiper_id, v_c6_id),
           ('credit_card', 1, 4.09, 0.35, v_elo_id, v_c6_id),
           ('credit_card', 1, 4.09, 0.35, v_amex_id, v_c6_id),
           ('credit_card', 1, 4.09, 0.35, v_hiper_id, v_c6_id);
    FOR i IN 2..12 LOOP
        INSERT INTO public.payment_method_fees (method, installments, fee_percent, fee_fixed, card_brand_id, acquirer_id)
        VALUES ('credit_card', i, 4.39, 0.35, v_elo_id, v_c6_id),
               ('credit_card', i, 4.39, 0.35, v_amex_id, v_c6_id),
               ('credit_card', i, 4.39, 0.35, v_hiper_id, v_c6_id);
    END LOOP;

    -- ==========================================
    -- 7. SUMUP (Photo 5)
    -- ==========================================
    -- Assuming Mastercard/Visa based on photo logo
    INSERT INTO public.payment_method_fees (method, installments, fee_percent, fee_fixed, card_brand_id, acquirer_id)
    VALUES ('debit_card', 1, 1.90, 0.00, v_visa_id, v_sumup_id),
           ('debit_card', 1, 1.90, 0.00, v_master_id, v_sumup_id),
           ('credit_card', 1, 3.70, 0.00, v_visa_id, v_sumup_id),
           ('credit_card', 1, 3.70, 0.00, v_master_id, v_sumup_id);
    FOR i IN 2..12 LOOP
        INSERT INTO public.payment_method_fees (method, installments, fee_percent, fee_fixed, card_brand_id, acquirer_id)
        VALUES ('credit_card', i, 4.90, 0.00, v_visa_id, v_sumup_id),
               ('credit_card', i, 4.90, 0.00, v_master_id, v_sumup_id);
    END LOOP;

END $$;
