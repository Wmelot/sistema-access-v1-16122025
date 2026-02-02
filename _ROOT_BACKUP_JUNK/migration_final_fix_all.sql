DO $$
DECLARE
    target_template_id uuid;
    new_fields jsonb;
BEGIN
    -- 1. Locate the Renamed Template
    SELECT id INTO target_template_id FROM form_templates WHERE title = 'Palmilhas Feito por Warley' LIMIT 1;
    
    -- Fallback: If renamed failed or user was mistaken, try original
    IF target_template_id IS NULL THEN 
        SELECT id INTO target_template_id FROM form_templates WHERE title = 'Prontuário de Palmilhas' LIMIT 1;
    END IF;

    IF target_template_id IS NULL THEN 
        RAISE NOTICE 'Nenhum template encontrado com os nomes: Palmilhas Feito por Warley ou Prontuário de Palmilhas'; 
        RETURN; 
    END IF;

    -- 2. Define ALL Fields (Ungrouped + Correct IDs)
    -- Using unique IDs to prevent conflict if appended: '_v3' suffix
    
    new_fields := '[
        {"type": "section", "label": "Algoritmo de Tênis (Corrigido)", "textAlign": "center", "fontSize": "xl"},

        {
            "id": "algo_xp_v3",
            "type": "radio_group", 
            "label": "Nível de Experiência do Corredor",
            "options": ["Iniciante (< 6 meses)", "Recreacional (> 6 meses)", "Competitivo / Elite"]
        },
        {
            "id": "algo_status_v3",
            "type": "radio_group", 
            "label": "Status Atual (Lesão)",
            "options": ["Não Lesionado (Prevenção)", "Lesão Aguda (< 3 sem)", "Lesão Persistente (> 3 meses)", "Retorno ao Esporte"]
        },
        {
            "id": "algo_injury_v3",
            "type": "select", 
            "label": "Principal Queixa / Local da Lesão",
            "options": ["Sem Queixa", "Joelho (Patelofemoral)", "Canelite (Stress Tibial)", "Fascite Plantar", "Tendão de Aquiles", "Panturrilha", "Quadril / ITB", "Metatarsalgia", "Fratura por Stress"]
        },
        {
            "id": "algo_goals_v3",
            "type": "checkbox_group", 
            "label": "Objetivos com o Novo Calçado",
            "options": ["Reduzir Dor", "Melhorar Performance (Velocidade)", "Aumentar Conforto", "Transição para Minimalista", "Estabilidade / Controle", "Rodagem / Treino Longo"]
        },

        {"type": "section", "label": "Índice de Minimalismo (Desagrupado)", "textAlign": "center", "fontSize": "xl"},
        
        {
            "id": "min_peso_v3",
            "type": "radio_group", 
            "label": "Peso (g)", 
            "options": ["5/5 = < 125", "4/5 = 125 a 175", "3/5 = 176 a 225", "2/5 = 226 a 275", "1/5 = 276 a 325", "0/5 = 325g <"]
        },
        {
            "id": "min_drop_v3",
            "type": "radio_group", 
            "label": "Drop (mm)", 
            "options": ["5/5 = <1mm", "4/5 = 1 a 4", "3/5 = 4 a 7", "2/5 = 7 a 10", "1/5 = 10 a 13", "0/5 = 13 <"]
        },
        {
            "id": "min_pilha_v3",
            "type": "radio_group", 
            "label": "Altura de Pilha (mm)", 
            "options": ["5/5 = < 8mm", "4/5 = 8 a 13.9", "3/5 = 14 a 19.9", "2/5 = 20 a 25.9", "1/5 = 26 a 31.9", "0/5 = 32 mm <"]
        },
        {
            "id": "min_controle_v3",
            "type": "radio_group", 
            "label": "Dispositivos de Controle", 
            "options": ["5/5 = Nenhum", "4/5 = 1", "3/5 = 2", "2/5 = 3", "1/5 = 4", "0/5 = 5 ou 6"]
        },
        {
            "id": "min_flex_long_v3",
            "type": "radio_group", 
            "label": "Flexibilidade Longitudinal", 
            "options": ["2.5/2.5", "2.0/2.5", "1.5/2.5", "1.0/2.5", "0.5/2.5"]
        },
        {
            "id": "min_flex_tor_v3",
            "type": "radio_group", 
            "label": "Flexibilidade Torsional", 
            "options": ["2.5/2.5", "2.0/2.5", "1.5/2.5", "1.0/2.5", "0.5/2.5"]
        },

        {
            "id": "min_calc_index_v3",
            "type": "calculated",
            "label": "Índice de Minimalismo (%)",
            "formula": "(A + B + C + D + E + F) * 4",
            "variableMap": [
                {"letter": "A", "targetId": "min_peso_v3"},
                {"letter": "B", "targetId": "min_drop_v3"},
                {"letter": "C", "targetId": "min_pilha_v3"},
                {"letter": "D", "targetId": "min_controle_v3"},
                {"letter": "E", "targetId": "min_flex_long_v3"},
                {"letter": "F", "targetId": "min_flex_tor_v3"}
            ]
        }
    ]'::jsonb;

    UPDATE form_templates SET fields = fields || new_fields WHERE id = target_template_id;
END $$;
