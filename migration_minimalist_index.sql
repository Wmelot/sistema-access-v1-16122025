DO $$
DECLARE
    target_template_id uuid;
    new_fields jsonb;
BEGIN
    -- 1. Find the template ID
    SELECT id INTO target_template_id
    FROM form_templates
    WHERE title = 'Prontuário de Palmilhas'
    LIMIT 1;

    IF target_template_id IS NULL THEN
        RAISE NOTICE 'Template "Prontuário de Palmilhas" not found.';
        RETURN;
    END IF;

    -- 2. Define the new fields to append
    new_fields := '[
        {"type": "section", "label": "Índice de Minimalismo", "textAlign": "center", "fontSize": "xl"},
        
        {"type": "group_row", "fields": [
            {
                "id": "min_peso",
                "type": "radio_group", 
                "label": "Peso (g)", 
                "options": ["5/5 = < 125", "4/5 = 125 a 175", "3/5 = 176 a 225", "2/5 = 226 a 275", "1/5 = 276 a 325", "0/5 = 325g <"]
            },
            {
                "id": "min_drop",
                "type": "radio_group", 
                "label": "Drop (mm)", 
                "options": ["5/5 = <1mm", "4/5 = 1 a 4", "3/5 = 4 a 7", "2/5 = 7 a 10", "1/5 = 10 a 13", "0/5 = 13 <"]
            }
        ]},

        {"type": "group_row", "fields": [
            {
                "id": "min_pilha",
                "type": "radio_group", 
                "label": "Altura de Pilha (mm)", 
                "options": ["5/5 = < 8mm", "4/5 = 8 a 13.9", "3/5 = 14 a 19.9", "2/5 = 20 a 25.9", "1/5 = 26 a 31.9", "0/5 = 32 mm <"]
            },
            {
                "id": "min_controle",
                "type": "radio_group", 
                "label": "Dispositivos de Controle", 
                "options": ["5/5 = Nenhum", "4/5 = 1", "3/5 = 2", "2/5 = 3", "1/5 = 4", "0/5 = 5 ou 6"]
            }
        ]},

        {"type": "group_row", "fields": [
            {
                "id": "min_flex_long",
                "type": "radio_group", 
                "label": "Flexibilidade Longitudinal", 
                "options": ["2.5/2.5", "2.0/2.5", "1.5/2.5", "1.0/2.5", "0.5/2.5"]
            },
            {
                "id": "min_flex_tor",
                "type": "radio_group", 
                "label": "Flexibilidade Torsional", 
                "options": ["2.5/2.5", "2.0/2.5", "1.5/2.5", "1.0/2.5", "0.5/2.5"]
            }
        ]},

        {
            "id": "min_calc_index",
            "type": "calculated",
            "label": "Índice de Minimalismo (%)",
            "formula": "(A + B + C + D + E + F) * 4",
            "variableMap": [
                {"letter": "A", "targetId": "min_peso"},
                {"letter": "B", "targetId": "min_drop"},
                {"letter": "C", "targetId": "min_pilha"},
                {"letter": "D", "targetId": "min_controle"},
                {"letter": "E", "targetId": "min_flex_long"},
                {"letter": "F", "targetId": "min_flex_tor"}
            ]
        }
    ]'::jsonb;

    -- 3. Update the template by appending new fields
    -- We use jsonb_concat (|| operator)
    UPDATE form_templates
    SET fields = fields || new_fields
    WHERE id = target_template_id;

    RAISE NOTICE 'Template updated successfully with Minimalist Index fields.';
END $$;
