-- ============================================
-- SEED: InfinitePay Fees for Access Fisioterapia
-- ============================================
-- Run this SQL in Supabase SQL Editor

-- 1. Get Access Fisioterapia organization_id
DO $$
DECLARE
    v_org_id UUID;
    v_visa_id UUID;
    v_master_id UUID;
    v_elo_id UUID;
    v_amex_id UUID;
BEGIN
    -- Get organization ID for Access Fisioterapia
    SELECT id INTO v_org_id FROM organizations WHERE name ILIKE '%access%fisio%' LIMIT 1;
    
    IF v_org_id IS NULL THEN
        RAISE EXCEPTION 'Organization "Access Fisioterapia" not found';
    END IF;

    -- 2. Create Card Brands (if not exist)
    INSERT INTO card_brands (name, slug, icon_emoji, organization_id, active)
    VALUES 
        ('Visa', 'visa', '💳', v_org_id, true),
        ('Mastercard', 'mastercard', '💳', v_org_id, true),
        ('Elo', 'elo', '💳', v_org_id, true),
        ('Amex', 'amex', '💳', v_org_id, true),
        ('Hipercard', 'hipercard', '💳', v_org_id, true)
    ON CONFLICT (slug, organization_id) DO NOTHING
    RETURNING id;

    -- Get brand IDs
    SELECT id INTO v_visa_id FROM card_brands WHERE slug = 'visa' AND organization_id = v_org_id;
    SELECT id INTO v_master_id FROM card_brands WHERE slug = 'mastercard' AND organization_id = v_org_id;
    SELECT id INTO v_elo_id FROM card_brands WHERE slug = 'elo' AND organization_id = v_org_id;
    SELECT id INTO v_amex_id FROM card_brands WHERE slug = 'amex' AND organization_id = v_org_id;

    -- 3. Insert InfinitePay Fees

    -- VISA - Debit
    INSERT INTO payment_method_fees (method, installments, fee_percent, card_brand_id, organization_id)
    VALUES ('debit_card', 1, 1.37, v_visa_id, v_org_id)
    ON CONFLICT DO NOTHING;

    -- VISA - Credit (1x to 12x)
    INSERT INTO payment_method_fees (method, installments, fee_percent, card_brand_id, organization_id)
    VALUES 
        ('credit_card', 1, 3.15, v_visa_id, v_org_id),
        ('credit_card', 2, 4.48, v_visa_id, v_org_id),
        ('credit_card', 3, 5.81, v_visa_id, v_org_id),
        ('credit_card', 4, 7.14, v_visa_id, v_org_id),
        ('credit_card', 5, 8.47, v_visa_id, v_org_id),
        ('credit_card', 6, 9.80, v_visa_id, v_org_id),
        ('credit_card', 7, 10.41, v_visa_id, v_org_id),
        ('credit_card', 8, 11.02, v_visa_id, v_org_id),
        ('credit_card', 9, 11.63, v_visa_id, v_org_id),
        ('credit_card', 10, 12.24, v_visa_id, v_org_id),
        ('credit_card', 11, 12.32, v_visa_id, v_org_id),
        ('credit_card', 12, 12.40, v_visa_id, v_org_id)
    ON CONFLICT DO NOTHING;

    -- MASTERCARD - Debit
    INSERT INTO payment_method_fees (method, installments, fee_percent, card_brand_id, organization_id)
    VALUES ('debit_card', 1, 1.37, v_master_id, v_org_id)
    ON CONFLICT DO NOTHING;

    -- MASTERCARD - Credit (same as Visa)
    INSERT INTO payment_method_fees (method, installments, fee_percent, card_brand_id, organization_id)
    VALUES 
        ('credit_card', 1, 3.15, v_master_id, v_org_id),
        ('credit_card', 2, 4.48, v_master_id, v_org_id),
        ('credit_card', 3, 5.81, v_master_id, v_org_id),
        ('credit_card', 4, 7.14, v_master_id, v_org_id),
        ('credit_card', 5, 8.47, v_master_id, v_org_id),
        ('credit_card', 6, 9.80, v_master_id, v_org_id),
        ('credit_card', 7, 10.41, v_master_id, v_org_id),
        ('credit_card', 8, 11.02, v_master_id, v_org_id),
        ('credit_card', 9, 11.63, v_master_id, v_org_id),
        ('credit_card', 10, 12.24, v_master_id, v_org_id),
        ('credit_card', 11, 12.32, v_master_id, v_org_id),
        ('credit_card', 12, 12.40, v_master_id, v_org_id)
    ON CONFLICT DO NOTHING;

    -- ELO - Debit
    INSERT INTO payment_method_fees (method, installments, fee_percent, card_brand_id, organization_id)
    VALUES ('debit_card', 1, 5.58, v_elo_id, v_org_id)
    ON CONFLICT DO NOTHING;

    -- ELO - Credit
    INSERT INTO payment_method_fees (method, installments, fee_percent, card_brand_id, organization_id)
    VALUES 
        ('credit_card', 1, 4.91, v_elo_id, v_org_id),
        ('credit_card', 2, 6.24, v_elo_id, v_org_id),
        ('credit_card', 3, 7.57, v_elo_id, v_org_id),
        ('credit_card', 4, 8.90, v_elo_id, v_org_id),
        ('credit_card', 5, 10.23, v_elo_id, v_org_id),
        ('credit_card', 6, 11.56, v_elo_id, v_org_id),
        ('credit_card', 7, 12.17, v_elo_id, v_org_id),
        ('credit_card', 8, 12.78, v_elo_id, v_org_id),
        ('credit_card', 9, 13.39, v_elo_id, v_org_id),
        ('credit_card', 10, 14.00, v_elo_id, v_org_id),
        ('credit_card', 11, 14.08, v_elo_id, v_org_id),
        ('credit_card', 12, 14.16, v_elo_id, v_org_id)
    ON CONFLICT DO NOTHING;

    -- AMEX - Debit
    INSERT INTO payment_method_fees (method, installments, fee_percent, card_brand_id, organization_id)
    VALUES ('debit_card', 1, 5.58, v_amex_id, v_org_id)
    ON CONFLICT DO NOTHING;

    -- AMEX - Credit (same as Elo)
    INSERT INTO payment_method_fees (method, installments, fee_percent, card_brand_id, organization_id)
    VALUES 
        ('credit_card', 1, 4.91, v_amex_id, v_org_id),
        ('credit_card', 2, 6.24, v_amex_id, v_org_id),
        ('credit_card', 3, 7.57, v_amex_id, v_org_id),
        ('credit_card', 4, 8.90, v_amex_id, v_org_id),
        ('credit_card', 5, 10.23, v_amex_id, v_org_id),
        ('credit_card', 6, 11.56, v_amex_id, v_org_id),
        ('credit_card', 7, 12.17, v_amex_id, v_org_id),
        ('credit_card', 8, 12.78, v_amex_id, v_org_id),
        ('credit_card', 9, 13.39, v_amex_id, v_org_id),
        ('credit_card', 10, 14.00, v_amex_id, v_org_id),
        ('credit_card', 11, 14.08, v_amex_id, v_org_id),
        ('credit_card', 12, 14.16, v_amex_id, v_org_id)
    ON CONFLICT DO NOTHING;

    -- 4. Set max installments for organization
    INSERT INTO organization_payment_settings (organization_id, max_installments)
    VALUES (v_org_id, 12)
    ON CONFLICT (organization_id) DO UPDATE SET max_installments = 12;

    RAISE NOTICE 'InfinitePay fees seeded successfully for Access Fisioterapia!';
END $$;

-- Verify
SELECT 
    cb.name as bandeira,
    pmf.method as metodo,
    pmf.installments as parcelas,
    pmf.fee_percent as taxa
FROM payment_method_fees pmf
JOIN card_brands cb ON cb.id = pmf.card_brand_id
ORDER BY cb.name, pmf.method, pmf.installments;
