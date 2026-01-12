-- FORCE IMPORT LEGACY FORMS (Palmilha 2.0 & PBE)
-- Generated to recover missing data caused by seed failure.
-- Compliant with Schema V3 (Atomic Layout + Logic Engine)

-- 1. Cleanup specific legacy titles if they exist (to avoid dupes)
DELETE FROM public.form_templates WHERE title IN ('Palmilha Biomecânica 2.0', 'Avaliação Clínica PBE');

-- 2. Insert Palmilha Biomecânica 2.0
INSERT INTO public.form_templates (title, description, fields, is_active, schema_version)
VALUES (
    'Palmilha Biomecânica 2.0',
    'Protocolo completo para prescrição de órteses e análise de pisada.',
    '[
        {
            "id": "sec_anamnese",
            "type": "section",
            "label": "Anamnese Biomecânica",
            "width": "full",
            "children": []
        },
        {
            "id": "queixa_principal",
            "type": "textarea",
            "label": "Queixa Principal",
            "width": "full",
            "required": true,
            "placeholder": "Descreva a dor, localização e fator de melhora/piora..."
        },
        {
            "id": "dor_eva",
            "type": "number",
            "label": "Intensidade da Dor (EVA 0-10)",
            "width": "1/2",
            "min": 0,
            "max": 10
        },
        {
            "id": "peso_kg",
            "type": "number",
            "label": "Peso (kg)",
            "width": "1/4",
            "placeholder": "00.0"
        },
        {
            "id": "altura_cm",
            "type": "number",
            "label": "Altura (cm)",
            "width": "1/4",
            "placeholder": "000"
        },
        {
            "id": "sec_estatica",
            "type": "section",
            "label": "Avaliação Estática (Em Pé)",
            "width": "full"
        },
        {
            "id": "tipo_pisada",
            "type": "select",
            "label": "Tipo de Pisada (FPI-6 Estimado)",
            "width": "1/2",
            "options": ["Neutra", "Pronada Leve", "Pronada Severa", "Supinada Leve", "Supinada Severa"]
        },
        {
            "id": "arco_plantar",
            "type": "radio_group",
            "label": "Arco Plantar",
            "width": "1/2",
            "options": ["Normal", "Plano (Chato)", "Cavo"]
        },
        {
            "id": "teste_windlass",
            "type": "radio_group",
            "label": "Teste de Windlass (Dedão)",
            "width": "1/2",
            "options": ["Negativo (Sem dor)", "Positivo (Dor reproduzida)"]
        },
        {
            "id": "sec_calc",
            "type": "section",
            "label": "Cálculo de Risco & Prescrição",
            "width": "full"
        },
        {
            "id": "risco_biomecanico",
            "type": "score_display",
            "label": "Risco Biomecânico (Calculado)",
            "width": "full",
            "mode": "ring",
            "color": "#f59e0b",
            "calculation": {
                "formula": "(field_dor_eva * 5) + (field_peso_kg / 2)" 
            },
            "helpText": "Cálculo demonstrativo: (EVA * 5) + (Peso / 2)"
        },
        {
            "id": "prescricao_elementos",
            "type": "checkbox_group",
            "label": "Elementos da Palmilha",
            "width": "full",
            "options": ["Barra Metatarsal", "Cunha Varizante (Retropé)", "Cunha Valgizante", "Apoio de Arco", "Piloto", "Correção de Discorria"]
        }
    ]'::jsonb,
    true,
    3
);

-- 3. Insert Avaliação Clínica PBE (Evidence Based)
INSERT INTO public.form_templates (title, description, fields, is_active, schema_version)
VALUES (
    'Avaliação Clínica PBE',
    'Questionários validados e triagem baseada em evidência (STarT Back, Bandeiras Vermelhas).',
    '[
        {
            "id": "sec_triagem",
            "type": "section",
            "label": "Triagem (Bandeiras Vermelhas)",
            "width": "full"
        },
        {
            "id": "cancer_history",
            "type": "radio_group",
            "label": "Histórico de Câncer?",
            "width": "1/2",
            "options": ["Não", "Sim"]
        },
        {
            "id": "weight_loss",
            "type": "radio_group",
            "label": "Perda de peso inexplicada?",
            "width": "1/2",
            "options": ["Não", "Sim"]
        },
        {
            "id": "trauma_recent",
            "type": "radio_group",
            "label": "Trauma recente relevante?",
            "width": "1/2",
            "options": ["Não", "Sim"]
        },
        {
            "id": "red_flag_alert",
            "type": "date",
            "label": "Data do Início dos Sintomas",
            "width": "1/2"
        },
        {
            "id": "sec_startback",
            "type": "section",
            "label": "STarT Back Screening Tool",
            "width": "full"
        },
        {
            "id": "sb_q1",
            "type": "radio_group",
            "label": "1. Dor espalhou para as pernas?",
            "width": "full",
            "options": ["Não", "Sim"],
            "calculation": { "formula": "0" } 
        },
        {
            "id": "sb_q2",
            "type": "radio_group",
            "label": "2. Dor no ombro/pescoço?",
            "width": "full",
            "options": ["Não", "Sim"]
        },
        {
            "id": "sb_result",
            "type": "score_display",
            "label": "Pontuação STarT Back",
            "width": "full",
            "mode": "bar",
            "color": "#3b82f6",
            "calculation": {
                "formula": "0" 
            },
            "helpText": "Lógica de cálculo será implementada na Fase 4."
        }
    ]'::jsonb,
    true,
    3
);
