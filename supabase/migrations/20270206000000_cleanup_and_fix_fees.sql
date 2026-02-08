-- Migration: Cleanup Data and Fix Payment Fees (Robust Version)
-- Date: 2027-02-06

-- ==========================================
-- 1. DATA CLEANUP (Selectively)
-- ==========================================
-- Deleting patient-related data and financial records
-- Keeping professionals, services, products, protocols, forms.

BEGIN;

-- Remove entries from tables that exist
DO $$ BEGIN
    -- 1. Dependent records first
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'attendance_exercises') THEN
        DELETE FROM public.attendance_exercises;
    END IF;
    
    DELETE FROM public.patient_assessments;
    DELETE FROM public.patient_records;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'patient_documents') THEN
        DELETE FROM public.patient_documents;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'questionnaire_logs') THEN
        DELETE FROM public.questionnaire_logs;
    END IF;

    -- 2. Financial and Scheduling
    DELETE FROM public.financial_payables;
    DELETE FROM public.financial_commissions;
    DELETE FROM public.transactions;
    DELETE FROM public.appointments; -- Appointments link to invoices
    DELETE FROM public.invoices;

    -- 3. Base records
    DELETE FROM public.patients;
END $$;

COMMIT;

-- ==========================================
-- 2. FIX PAYMENT ACQUIRERS AND FEES
-- ==========================================

DO $$
DECLARE
    v_org_id UUID;
    v_asaas_id UUID;
    v_c6_id UUID;
    v_infinite_id UUID;
    v_sumup_id UUID;
    
    v_visa_id UUID;
    v_master_id UUID;
    v_elo_id UUID;
    v_amex_id UUID;
BEGIN
    -- Get Card Brands (Global ones have organization_id IS NULL)
    SELECT id INTO v_visa_id FROM public.card_brands WHERE slug = 'visa' LIMIT 1;
    SELECT id INTO v_master_id FROM public.card_brands WHERE slug = 'mastercard' LIMIT 1;
    SELECT id INTO v_elo_id FROM public.card_brands WHERE slug = 'elo' LIMIT 1;
    SELECT id INTO v_amex_id FROM public.card_brands WHERE slug = 'amex' LIMIT 1;

    -- Ensure Acquirers exist (Global)
    
    -- Asaas
    SELECT id INTO v_asaas_id FROM public.payment_acquirers WHERE name = 'Asaas' AND organization_id IS NULL LIMIT 1;
    IF v_asaas_id IS NULL THEN
        INSERT INTO public.payment_acquirers (name, organization_id, active) VALUES ('Asaas', NULL, true) RETURNING id INTO v_asaas_id;
    ELSE
        UPDATE public.payment_acquirers SET active = true WHERE id = v_asaas_id;
    END IF;
    
    -- C6 Pay
    SELECT id INTO v_c6_id FROM public.payment_acquirers WHERE name = 'C6 Pay' AND organization_id IS NULL LIMIT 1;
    IF v_c6_id IS NULL THEN
        INSERT INTO public.payment_acquirers (name, organization_id, active) VALUES ('C6 Pay', NULL, true) RETURNING id INTO v_c6_id;
    ELSE
        UPDATE public.payment_acquirers SET active = true WHERE id = v_c6_id;
    END IF;

    -- InfinitePay
    SELECT id INTO v_infinite_id FROM public.payment_acquirers WHERE name = 'InfinitePay' AND organization_id IS NULL LIMIT 1;
    IF v_infinite_id IS NULL THEN
        INSERT INTO public.payment_acquirers (name, organization_id, active) VALUES ('InfinitePay', NULL, true) RETURNING id INTO v_infinite_id;
    END IF;
    
    -- SumUp
    SELECT id INTO v_sumup_id FROM public.payment_acquirers WHERE name = 'SumUp' AND organization_id IS NULL LIMIT 1;
    IF v_sumup_id IS NULL THEN
        INSERT INTO public.payment_acquirers (name, organization_id, active) VALUES ('SumUp', NULL, true) RETURNING id INTO v_sumup_id;
    END IF;

    -- Seed Fees for Asaas
    FOR i IN 1..12 LOOP
        IF v_visa_id IS NOT NULL THEN
            IF NOT EXISTS (SELECT 1 FROM public.payment_method_fees WHERE method='credit_card' AND installments=i AND card_brand_id=v_visa_id AND acquirer_id=v_asaas_id) THEN
                INSERT INTO public.payment_method_fees (method, installments, fee_percent, card_brand_id, acquirer_id, organization_id)
                VALUES ('credit_card', i, 2.99 + (i * 0.5), v_visa_id, v_asaas_id, NULL);
            END IF;
        END IF;
        
        IF v_master_id IS NOT NULL THEN
            IF NOT EXISTS (SELECT 1 FROM public.payment_method_fees WHERE method='credit_card' AND installments=i AND card_brand_id=v_master_id AND acquirer_id=v_asaas_id) THEN
                INSERT INTO public.payment_method_fees (method, installments, fee_percent, card_brand_id, acquirer_id, organization_id)
                VALUES ('credit_card', i, 2.99 + (i * 0.5), v_master_id, v_asaas_id, NULL);
            END IF;
        END IF;
    END LOOP;
    
    -- Seed Fees for C6 Pay
    FOR i IN 1..12 LOOP
        IF v_visa_id IS NOT NULL THEN
            IF NOT EXISTS (SELECT 1 FROM public.payment_method_fees WHERE method='credit_card' AND installments=i AND card_brand_id=v_visa_id AND acquirer_id=v_c6_id) THEN
                INSERT INTO public.payment_method_fees (method, installments, fee_percent, card_brand_id, acquirer_id, organization_id)
                VALUES ('credit_card', i, 3.10 + (i * 0.4), v_visa_id, v_c6_id, NULL);
            END IF;
        END IF;
        
        IF v_master_id IS NOT NULL THEN
            IF NOT EXISTS (SELECT 1 FROM public.payment_method_fees WHERE method='credit_card' AND installments=i AND card_brand_id=v_master_id AND acquirer_id=v_c6_id) THEN
                INSERT INTO public.payment_method_fees (method, installments, fee_percent, card_brand_id, acquirer_id, organization_id)
                VALUES ('credit_card', i, 3.10 + (i * 0.4), v_master_id, v_c6_id, NULL);
            END IF;
        END IF;
    END LOOP;

END $$;
