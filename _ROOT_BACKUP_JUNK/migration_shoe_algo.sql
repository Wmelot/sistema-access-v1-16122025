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
        {"type": "section", "label": "Algoritmo de Seleção de Tênis", "textAlign": "center", "fontSize": "xl"},
        
        {"type": "group_row", "fields": [
            {
                "id": "run_xp",
                "type": "radio_group", 
                "label": "Nível de Experiência", 
                "options": ["Iniciante (< 6 meses)", "Recreacional (> 6 meses)", "Competitivo / Elite"]
            },
            {
                "id": "run_status",
                "type": "radio_group", 
                "label": "Status Atual", 
                "options": ["Não Lesionado (Prevenção/Performance)", "Lesão Aguda (< 3 semanas)", "Lesão Persistente (> 3 meses)", "Retorno ao Esporte"]
            }
        ]},

        {
            "id": "run_injury_type",
            "type": "select",
            "label": "Principal Queixa/Lesão (Para Algoritmo)",
            "options": [
                "Nenhuma / Apenas Check-up",
                "Dor Anterior no Joelho (SFP)",
                "Dor Lateral no Joelho (Trato Iliotibial)",
                "Canelite (Tibial Medial)",
                "Tendinopatia de Aquiles",
                "Dor na Panturrilha (Estiramento)",
                "Fascite Plantar",
                "Metatarsalgia / Neuroma",
                "Fratura por Estresse (Metatarso/Tíbia)",
                "Entorse de Tornozelo Recorrente"
            ]
        },

        {"type": "checkbox_group", "label": "Objetivos com o Calçado", "options": ["Reduzir Dor", "Melhorar Performance (Velocidade)", "Aumentar Conforto", "Corrigir Passada", "Transição para Minimalista"]}
    ]'::jsonb;

    UPDATE form_templates SET fields = fields || new_fields WHERE id = target_template_id;
    RAISE NOTICE 'Campos do Algoritmo de Tênis adicionados com sucesso.';
END $$;
