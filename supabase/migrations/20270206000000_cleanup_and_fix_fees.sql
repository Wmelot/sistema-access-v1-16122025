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
    
    -- Asaas (D+30)
    SELECT id INTO v_asaas_id FROM public.payment_acquirers WHERE name = 'Asaas' AND organization_id IS NULL LIMIT 1;
    IF v_asaas_id IS NULL THEN
        INSERT INTO public.payment_acquirers (name, organization_id, active, receipt_days) VALUES ('Asaas', NULL, true, 30) RETURNING id INTO v_asaas_id;
    ELSE
        UPDATE public.payment_acquirers SET active = true, receipt_days = 30 WHERE id = v_asaas_id;
    END IF;
    
    -- C6 Pay (D+30)
    SELECT id INTO v_c6_id FROM public.payment_acquirers WHERE name = 'C6 Pay' AND organization_id IS NULL LIMIT 1;
    IF v_c6_id IS NULL THEN
        INSERT INTO public.payment_acquirers (name, organization_id, active, receipt_days) VALUES ('C6 Pay', NULL, true, 30) RETURNING id INTO v_c6_id;
    ELSE
        UPDATE public.payment_acquirers SET active = true, receipt_days = 30 WHERE id = v_c6_id;
    END IF;

    -- InfinitePay (D+1)
    SELECT id INTO v_infinite_id FROM public.payment_acquirers WHERE name = 'InfinitePay' AND organization_id IS NULL LIMIT 1;
    IF v_infinite_id IS NULL THEN
        INSERT INTO public.payment_acquirers (name, organization_id, active, receipt_days) VALUES ('InfinitePay', NULL, true, 1) RETURNING id INTO v_infinite_id;
    ELSE
        UPDATE public.payment_acquirers SET receipt_days = 1 WHERE id = v_infinite_id;
    END IF;
    
    -- SumUp (D+30) - Actually SumUp is usually configurable, but user might want D+30? Or D+1? 
    -- Let's stick to D+30 for SumUp too if they want older behavior or follow what they see. Actually screenshot shows SumUp as D+30.
    SELECT id INTO v_sumup_id FROM public.payment_acquirers WHERE name = 'SumUp' AND organization_id IS NULL LIMIT 1;
    IF v_sumup_id IS NULL THEN
        INSERT INTO public.payment_acquirers (name, organization_id, active, receipt_days) VALUES ('SumUp', NULL, true, 30) RETURNING id INTO v_sumup_id;
    ELSE
        UPDATE public.payment_acquirers SET receipt_days = 30 WHERE id = v_sumup_id;
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

-- Ensure financial_monthly_configs table exists
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

-- Policies (Safe check)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can see monthly configs of their organization' AND tablename = 'financial_monthly_configs') THEN
        CREATE POLICY "Users can see monthly configs of their organization"
            ON public.financial_monthly_configs
            FOR SELECT
            USING (organization_id IN (
                SELECT organization_id FROM public.profiles WHERE id = auth.uid()
            ));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update monthly configs of their organization' AND tablename = 'financial_monthly_configs') THEN
        CREATE POLICY "Users can update monthly configs of their organization"
            ON public.financial_monthly_configs
            FOR ALL
            USING (organization_id IN (
                SELECT organization_id FROM public.profiles WHERE id = auth.uid()
            ));
    END IF;
END $$;
