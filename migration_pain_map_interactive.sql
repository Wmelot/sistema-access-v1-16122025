DO $$
DECLARE
    target_template_id uuid;
    new_fields jsonb;
BEGIN
    SELECT id INTO target_template_id FROM form_templates WHERE title = 'Prontuário de Palmilhas' LIMIT 1;
    IF target_template_id IS NULL THEN RAISE NOTICE 'Template não encontrado.'; RETURN; END IF;

    -- Remove old Pain Map fields if they exist (naive approach: we just append new ones, user can delete old ones manually or we could jsonb_set to replace if we knew the index. Appending is safer for now effectively "Updating" the section.)
    -- Actually, to be clean, let's just append the new "Interactive" section.

    new_fields := '[
        {"type": "section", "label": "Mapa de Dor Interativo", "textAlign": "center", "fontSize": "xl"},
        
        {
            "id": "pain_body_interactive",
            "type": "pain_map",
            "label": "Localização da Dor (Corpo)",
            "imageUrl": "/assets/body_map_clean.png",
            "points": [
                {"id": "head", "label": "Cabeça", "x": 50, "y": 6},
                {"id": "neck", "label": "Pescoço", "x": 50, "y": 13},
                {"id": "shoulder_r", "label": "Ombro Dir", "x": 35, "y": 18},
                {"id": "shoulder_l", "label": "Ombro Esq", "x": 65, "y": 18},
                {"id": "elbow_r", "label": "Cotovelo Dir", "x": 30, "y": 30},
                {"id": "elbow_l", "label": "Cotovelo Esq", "x": 70, "y": 30},
                {"id": "wrist_r", "label": "Punho/Mão Dir", "x": 25, "y": 42},
                {"id": "wrist_l", "label": "Punho/Mão Esq", "x": 75, "y": 42},
                {"id": "chest", "label": "Tórax", "x": 50, "y": 25},
                {"id": "lumbar", "label": "Lombar/Abd", "x": 50, "y": 42},
                {"id": "hip_r", "label": "Quadril Dir", "x": 40, "y": 48},
                {"id": "hip_l", "label": "Quadril Esq", "x": 60, "y": 48},
                {"id": "knee_r", "label": "Joelho Dir", "x": 40, "y": 70},
                {"id": "knee_l", "label": "Joelho Esq", "x": 60, "y": 70},
                {"id": "ankle_r", "label": "Tornozelo Dir", "x": 40, "y": 88},
                {"id": "ankle_l", "label": "Tornozelo Esq", "x": 60, "y": 88}
            ]
        },

        {
            "id": "pain_foot_interactive",
            "type": "pain_map",
            "label": "Localização da Dor (Pés)",
            "imageUrl": "/assets/foot_map_clean.png",
            "points": [
                {"id": "halux", "label": "Hálux/Dedão", "x": 18, "y": 15},
                {"id": "toes", "label": "Dedos Menores", "x": 28, "y": 20},
                {"id": "meta_1", "label": "1º Metatarso", "x": 15, "y": 35},
                {"id": "meta_5", "label": "5º Metatarso", "x": 32, "y": 35},
                {"id": "meta_center", "label": "Metatarsos Centrais", "x": 23, "y": 35},
                {"id": "arch", "label": "Arco Plantar (Fascia)", "x": 20, "y": 55},
                {"id": "heel", "label": "Calcanhar", "x": 20, "y": 80},
                
                {"id": "ankle_ant", "label": "Tornozelo Ant.", "x": 50, "y": 30},
                {"id": "midfoot", "label": "Médio Pé/Dorso", "x": 50, "y": 55},
                
                {"id": "achilles", "label": "Tendão Aquiles", "x": 88, "y": 70},
                {"id": "ankle_lat", "label": "Maléolo Lateral", "x": 82, "y": 60}
            ]
        }
    ]'::jsonb;

    UPDATE form_templates SET fields = fields || new_fields WHERE id = target_template_id;
END $$;
