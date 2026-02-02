DO $$
DECLARE
    target_template_id uuid;
    new_fields jsonb;
BEGIN
    SELECT id INTO target_template_id FROM form_templates WHERE title = 'Prontuário de Palmilhas' LIMIT 1;

    IF target_template_id IS NULL THEN
        RAISE NOTICE 'Template não encontrado.';
        RETURN;
    END IF;

    new_fields := '[
        {"type": "section", "label": "Mapa de Dor (Body Map)", "textAlign": "center", "fontSize": "xl"},
        
        {
            "id": "pain_body_ref",
            "type": "image",
            "label": "Referência Corporal",
            "src": "/assets/body_map_ref.png",
            "alt": "Mapa Corporal",
            "height": 300
        },
        {
            "id": "pain_body",
            "type": "checkbox_group",
            "label": "Marque os locais de dor (Corpo)",
            "columns": 3,
            "options": [
                "Cabeça", "Pescoço", "Ombro Eq", "Ombro Dir", 
                "Cotovelo Esq", "Cotovelo Dir", "Punho/Mão Esq", "Punho/Mão Dir",
                "Tórax", "Lombar", "Quadril Esq", "Quadril Dir",
                "Joelho Esq", "Joelho Dir", "Tornozelo Esq", "Tornozelo Dir"
            ]
        },

        {"type": "section", "label": "Mapa de Dor (Pés)", "textAlign": "center", "fontSize": "lg"},
        {
            "id": "pain_foot_ref",
            "type": "image",
            "label": "Referência Pés",
            "src": "/assets/foot_map_ref.png",
            "alt": "Mapa Pés",
            "height": 300
        },
        {
            "id": "pain_foot",
            "type": "checkbox_group",
            "label": "Marque os locais de dor (Pé)",
            "columns": 2,
            "options": [
                "Dedão / Hálux", "Menores Dedos", 
                "1º Metatarso (Cabeça)", "5º Metatarso (Cabeça)", "Metatarsos Centrais",
                "Médio Pé (Dorso)", "Arco Plantar (Fascia)",
                "Calcanhar", "Tendão de Aquiles", "Tornozelo Anterior"
            ]
        }
    ]'::jsonb;

    UPDATE form_templates SET fields = fields || new_fields WHERE id = target_template_id;
    RAISE NOTICE 'Campos de Mapa de Dor adicionados com sucesso.';
END $$;
