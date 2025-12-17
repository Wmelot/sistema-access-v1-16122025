-- Migration: Add Shoe Recommendation Field to 'Palmilhas Feito por Warley'
-- Description: Appends the new 'shoe_recommendation' field type to the form fields JSON.

DO $$
DECLARE
    target_form_id UUID;
    current_fields JSONB;
BEGIN
    -- 1. Find the target form template ID
    SELECT id INTO target_form_id
    FROM form_templates
    WHERE title = 'Palmilhas Feito por Warley'
    LIMIT 1;

    IF target_form_id IS NOT NULL THEN
        -- 2. Get current fields
        SELECT fields INTO current_fields
        FROM form_templates
        WHERE id = target_form_id;

        -- 3. Append the new field if it doesn't exist (checking by type 'shoe_recommendation' to avoid duplicates)
        IF NOT (current_fields @> '[{"type": "shoe_recommendation"}]') THEN
            UPDATE form_templates
            SET fields = current_fields || jsonb_build_object(
                'id', substring(md5(random()::text), 1, 9),
                'type', 'shoe_recommendation',
                'label', 'Recomendação de Calçados (IA)',
                'required', false,
                'width', 100
            ) || jsonb_build_object(
                'id', substring(md5(random()::text), 1, 9),
                'type', 'section',
                'label', 'Catálogo de Tênis (Referência)',
                'required', false,
                'width', 100
            )
            WHERE id = target_form_id;
            
            RAISE NOTICE 'Field shoe_recommendation added successfully.';
        ELSE
            RAISE NOTICE 'Field shoe_recommendation already exists.';
        END IF;
    ELSE
        RAISE NOTICE 'Target form not found.';
    END IF;
END $$;
