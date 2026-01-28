-- 1. Ensure Elo and Amex brands exist
INSERT INTO public.card_brands (name, slug, active)
VALUES 
    ('Elo', 'elo', true),
    ('American Express', 'amex', true)
ON CONFLICT (slug) DO UPDATE SET active = true;

-- 2. Get IDs for seeding
DO $$
DECLARE
    infinitepay_id UUID;
    elo_id UUID;
    amex_id UUID;
BEGIN
    SELECT id INTO infinitepay_id FROM public.payment_acquirers WHERE name = 'InfinitePay' LIMIT 1;
    SELECT id INTO elo_id FROM public.card_brands WHERE slug = 'elo' LIMIT 1;
    SELECT id INTO amex_id FROM public.card_brands WHERE slug = 'amex' LIMIT 1;

    -- Only proceed if InfinitePay and both brands exist
    IF infinitepay_id IS NOT NULL AND elo_id IS NOT NULL AND amex_id IS NOT NULL THEN
        
        -- Elo Rates (D+1)
        INSERT INTO public.payment_method_fees (method, installments, fee_percent, card_brand_id, acquirer_id) VALUES
        ('debit_card', 1, 2.58, elo_id, infinitepay_id),
        ('credit_card', 1, 4.91, elo_id, infinitepay_id),
        ('credit_card', 2, 6.47, elo_id, infinitepay_id),
        ('credit_card', 3, 7.20, elo_id, infinitepay_id),
        ('credit_card', 4, 7.92, elo_id, infinitepay_id),
        ('credit_card', 5, 8.63, elo_id, infinitepay_id),
        ('credit_card', 6, 9.33, elo_id, infinitepay_id),
        ('credit_card', 7, 10.03, elo_id, infinitepay_id),
        ('credit_card', 8, 10.72, elo_id, infinitepay_id),
        ('credit_card', 9, 11.41, elo_id, infinitepay_id),
        ('credit_card', 10, 12.08, elo_id, infinitepay_id),
        ('credit_card', 11, 12.75, elo_id, infinitepay_id),
        ('credit_card', 12, 13.41, elo_id, infinitepay_id)
        ON CONFLICT (method, installments, COALESCE(card_brand_id, '00000000-0000-0000-0000-000000000000'), COALESCE(acquirer_id, '00000000-0000-0000-0000-000000000000'), COALESCE(organization_id, '00000000-0000-0000-0000-000000000000')) 
        DO UPDATE SET fee_percent = EXCLUDED.fee_percent;

        -- Amex Rates (D+1)
        INSERT INTO public.payment_method_fees (method, installments, fee_percent, card_brand_id, acquirer_id) VALUES
        ('debit_card', 1, 2.58, amex_id, infinitepay_id),
        ('credit_card', 1, 4.91, amex_id, infinitepay_id),
        ('credit_card', 2, 6.47, amex_id, infinitepay_id),
        ('credit_card', 3, 7.20, amex_id, infinitepay_id),
        ('credit_card', 4, 7.92, amex_id, infinitepay_id),
        ('credit_card', 5, 8.63, amex_id, infinitepay_id),
        ('credit_card', 6, 9.33, amex_id, infinitepay_id),
        ('credit_card', 7, 10.03, amex_id, infinitepay_id),
        ('credit_card', 8, 10.72, amex_id, infinitepay_id),
        ('credit_card', 9, 11.41, amex_id, infinitepay_id),
        ('credit_card', 10, 12.08, amex_id, infinitepay_id),
        ('credit_card', 11, 12.75, amex_id, infinitepay_id),
        ('credit_card', 12, 13.41, amex_id, infinitepay_id)
        ON CONFLICT (method, installments, COALESCE(card_brand_id, '00000000-0000-0000-0000-000000000000'), COALESCE(acquirer_id, '00000000-0000-0000-0000-000000000000'), COALESCE(organization_id, '00000000-0000-0000-0000-000000000000')) 
        DO UPDATE SET fee_percent = EXCLUDED.fee_percent;

    END IF;
END $$;
