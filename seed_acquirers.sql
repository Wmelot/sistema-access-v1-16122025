-- 1. Create Seeding for Acquirers
INSERT INTO public.payment_acquirers (name, active)
VALUES 
    ('InfinitePay', true),
    ('C6 Pay', true),
    ('SumUp', true)
ON CONFLICT (name, organization_id) DO UPDATE SET active = true;

-- 2. Link existing fees to InfinitePay (assuming they were intended for it)
DO $$
DECLARE
    infinitepay_id UUID;
    visa_id UUID;
    mastercard_id UUID;
    elo_id UUID;
    amex_id UUID;
BEGIN
    SELECT id INTO infinitepay_id FROM public.payment_acquirers WHERE name = 'InfinitePay' LIMIT 1;
    SELECT id INTO visa_id FROM public.card_brands WHERE slug = 'visa' LIMIT 1;
    SELECT id INTO mastercard_id FROM public.card_brands WHERE slug = 'mastercard' LIMIT 1;
    SELECT id INTO elo_id FROM public.card_brands WHERE slug = 'elo' LIMIT 1;
    SELECT id INTO amex_id FROM public.card_brands WHERE slug = 'amex' LIMIT 1;

    IF infinitepay_id IS NOT NULL THEN
        -- Link all fees that don't have an acquirer yet to InfinitePay
        UPDATE public.payment_method_fees SET acquirer_id = infinitepay_id WHERE acquirer_id IS NULL;
        
        -- Seed Elo/Amex specific D+1 rates for InfinitePay (from search results)
        -- Debit
        UPDATE public.payment_method_fees SET fee_percent = 2.58 WHERE acquirer_id = infinitepay_id AND card_brand_id IN (elo_id, amex_id) AND method = 'debit_card';
        
        -- Credit 1x
        UPDATE public.payment_method_fees SET fee_percent = 4.91 WHERE acquirer_id = infinitepay_id AND card_brand_id IN (elo_id, amex_id) AND method = 'credit_card' AND installments = 1;

        -- Credit 2x-12x
        INSERT INTO public.payment_method_fees (method, installments, fee_percent, card_brand_id, acquirer_id) VALUES
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
        ('credit_card', 12, 13.41, elo_id, infinitepay_id),
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
