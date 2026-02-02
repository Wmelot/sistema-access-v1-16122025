-- Insert the Palmilhas Template
insert into form_templates (title, description, fields)
values (
    'Prontuário de Palmilhas', 
    'Avaliação completa para confecção de palmilhas (Baropodometria e Exame Físico).',
    '[
        {"type": "section", "label": "Anamnese"},
        {"type": "text", "label": "QP (Queixa Principal)", "required": true},
        {"type": "textarea", "label": "HMA (História da Moléstia Atual)"},

        {"type": "section", "label": "EVA e EFEP"},
        {"type": "grid", "label": "Avaliação da Dor (EVA) e Funcionalidade (EFEP)", "columns": ["EVA Atividade", "EVA Repouso", "EFEP"], "rows": ["Atividade 1", "Atividade 2", "Atividade 3"]},

        {"type": "section", "label": "Histórico e Tratamentos"},
        {"type": "checkbox_group", "label": "Tratamento Prévio", "options": ["Acupuntura", "Crioterapia", "Fisioterapia", "Mackenzie", "Medicação", "Palmilha", "Pilates", "Repouso", "Outros"]},
        {"type": "text", "label": "Outros Tratamentos Prévios"},
        {"type": "textarea", "label": "HP (História Patológica)"},
        {"type": "text", "label": "Medicação"},

        {"type": "section", "label": "Estilo de Vida"},
        {"type": "checkbox_group", "label": "Atividade Física Regular", "options": ["Atletismo", "Basquete", "Beach Tênis", "Caminhada", "Ciclismo", "Corrida", "Dança", "Futebol", "Futvôlei", "Funcional", "Hidroginástica", "Musculação", "Natação", "Pilates", "Tênis", "Vôlei", "Artes Marciais", "Outros"]},
        {"type": "text", "label": "Outros Esportes"},
        {"type": "radio_group", "label": "Frequência Atividade Física", "options": ["Sedentário", "1x por semana", "2x por semana", "3x por semana", "4x por semana", "5x por semana", "6x por semana", "7x por semana"]},

        {"type": "section", "label": "Calçados"},
        {"type": "checkbox_group", "label": "Calçado que Utiliza", "options": ["Chinelo", "Sandália", "Sapatilha", "Sapatênis", "Sapato social", "Salto Alto", "Tênis"]},
        {"type": "checkbox_group", "label": "Número do Calçado", "options": ["33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45"]},

        {"type": "section", "label": "Exame Físico"},
        {"type": "group_row", "fields": [
            {"type": "text", "label": "Discrepância Catálogo E"},
            {"type": "text", "label": "Discrepância Catálogo D"}
        ]},

        {"type": "section", "label": "FPI (Foot Posture Index)"},
        {"type": "group_row", "fields": [
            {"type": "number", "label": "Tálus E"},
            {"type": "number", "label": "Maléolo E"},
            {"type": "number", "label": "Navicular E"},
            {"type": "number", "label": "Arco E"},
            {"type": "number", "label": "Calcâneo E"},
            {"type": "number", "label": "Dedos E"},
            {"type": "number", "label": "FPI Total E"}
        ]},
        {"type": "group_row", "fields": [
            {"type": "number", "label": "Tálus D"},
            {"type": "number", "label": "Maléolo D"},
            {"type": "number", "label": "Navicular D"},
            {"type": "number", "label": "Arco D"},
            {"type": "number", "label": "Calcâneo D"},
            {"type": "number", "label": "Dedos D"},
            {"type": "number", "label": "FPI Total D"}
        ]},

        {"type": "section", "label": "Testes Específicos"},
        {"type": "group_row", "fields": [
            {"type": "radio_group", "label": "Teste de Jack E", "options": ["Normal", "Hipomóvel", "Hipermóvel"]},
            {"type": "radio_group", "label": "Teste de Jack D", "options": ["Normal", "Hipomóvel", "Hipermóvel"]}
        ]},
        {"type": "group_row", "fields": [
            {"type": "select", "label": "Queda Pélvica E", "options": ["Normal", "Presente"]},
            {"type": "select", "label": "Valgo Dinâmico E", "options": ["Normal", "Presente"]},
            {"type": "select", "label": "Queda Pélvica D", "options": ["Normal", "Presente"]},
            {"type": "select", "label": "Valgo Dinâmico D", "options": ["Normal", "Presente"]}
        ]},
        {"type": "group_row", "fields": [
            {"type": "select", "label": "Restrição Dorsiflexão E", "options": ["Normal", "Presente"]},
            {"type": "select", "label": "Restrição Dorsiflexão D", "options": ["Normal", "Presente"]}
        ]},

        {"type": "section", "label": "Conduta"},
        {"type": "checkbox_group", "label": "Sugestões de Exercícios", "options": [
            "Fortalecimento do músculo glúteo médio com o quadril em extensão (Ex. Drop pélvico)",
            "Fortalecimento do músculo glúteo médio com o quadril e joelhos fletidos (Ex. Ostra)",
            "Fortalecimento excêntrico na posição alongada do músculo tríceps sural",
            "Fortalecimento do músculo glúteo máximo",
            "Fortalecimento de músculos do CORE, principalmente transverso abdominal e multífidos associados a respiração",
            "Fortalecimento de glúteo médio (Ex. Ponte unilateral e/ou ponte lateral com toque de joelhos e cotovelos)",
            "Fortalecimento de quadríceps em cadeia cinética fechada e/ou aberta observando o movimento do joelho",
            "Fortalecimento excêntrico de isquiosurais em posição alongada",
            "Exercícios para ganho de mobilidade de quadril",
            "Exercícios para ganho de mobilidade de tornozelo"
        ]},
        {"type": "textarea", "label": "Informações Adicionais"}
    ]'::jsonb
);
