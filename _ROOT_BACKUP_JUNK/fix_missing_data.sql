-- ============================================
-- EMERGENCY FIX: Restore Missing Financial Data
-- ============================================

-- 1. Restore Payment Methods
INSERT INTO public.payment_methods (name, active) VALUES 
('Dinheiro', true),
('Pix', true),
('Cartão de Crédito', true),
('Cartão de Débito', true),
('Boleto', true),
('Transferência', true)
ON CONFLICT DO NOTHING;

-- 2. Restore Card Brands for Access Fisioterapia
DO $$
DECLARE
    v_org_id UUID;
BEGIN
    SELECT id INTO v_org_id FROM organizations WHERE name ILIKE '%access%fisio%' LIMIT 1;
    
    IF v_org_id IS NOT NULL THEN
        -- Create Brands
        INSERT INTO public.card_brands (name, slug, icon_emoji, organization_id, active)
        VALUES 
            ('Visa', 'visa', '💳', v_org_id, true),
            ('Mastercard', 'mastercard', '💳', v_org_id, true),
            ('Elo', 'elo', '💳', v_org_id, true),
            ('Amex', 'amex', '💳', v_org_id, true),
            ('Hipercard', 'hipercard', '💳', v_org_id, true)
        ON CONFLICT (slug, organization_id) DO UPDATE SET active = true;

        -- Link existing fees (that have NULL card_brand_id) to Visa by default as a fallback 
        -- OR just clean and re-run seed.
        
        -- Let's re-seed the InfinitePay ones properly now that brands exist
    END IF;
END $$;
