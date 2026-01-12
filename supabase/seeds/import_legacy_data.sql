-- Seed mapped from Legacy Data

-- Evidence Data
INSERT INTO public.clinical_knowledge (keywords, evidence, source) VALUES ('{"lombar","lumbar","lombociatalgia","hernia de disco"}', 'Diretrizes de Prática Clínica (CPG) para dor lombar recomendam fortemente a manutenção da atividade física e desencorajam o repouso no leito. Intervenções baseadas em exercícios supervisados e terapia manual mostram nível de evidência A para redução de dor e incapacidade a médio prazo.', 'JOSPT Clinical Practice Guidelines (2021)');
INSERT INTO public.clinical_knowledge (keywords, evidence, source) VALUES ('{"cervical","pescoço","cervicalgia"}', 'Para dor cervical com mobilidade reduzida, a combinação de manipulação torácica, mobilização cervical e exercícios de fortalecimento escapular é mais eficaz do que o tratamento isolado. Exercícios de controle motor profundo são indicados para casos crônicos.', 'JOSPT Neck Pain Guidelines (2017)');
INSERT INTO public.clinical_knowledge (keywords, evidence, source) VALUES ('{"joelho","knee","artrose","oa"}', 'O exercício terapêutico é a primeira linha de tratamento para osteoartrite de joelho, superando intervenções farmacológicas em segurança e eficácia a longo prazo. O fortalecimento de quadríceps e glúteos é essencial.', 'OARSI Guidelines (2019)');
INSERT INTO public.clinical_knowledge (keywords, evidence, source) VALUES ('{"fascite","calcaneo","esporao","fascia","plantar"}', 'Evidência Nível A sustenta que o uso de palmilhas customizadas reduz a dor a curto prazo e melhora a função na Fascite Plantar. O alongamento da fáscia plantar e musculatura da panturrilha é essencial.', 'JOSPT Heel Pain Guidelines (2023)');

-- Form Templates
INSERT INTO public.form_templates (title, description, fields) VALUES (
    'Avaliação Biomecânica (Legacy)', 
    'Imported from Legacy System v1', 
    '[{"id":"qp","label":"Queixa Principal","type":"textarea","section":"Anamnese"},{"id":"hma","label":"História da Moléstia Atual","type":"textarea","section":"Anamnese"},{"id":"painDuration","label":"Duração da Dor","type":"text","section":"Anamnese"},{"id":"eva","label":"Escala de Dor (EVA)","type":"number","min":0,"max":10,"section":"Anamnese"},{"id":"history.hp","label":"História Patológica Pregressa","type":"textarea","section":"Histórico"},{"id":"history.medication","label":"Medicamentos em Uso","type":"textarea","section":"Histórico"}]'::jsonb
);
INSERT INTO public.form_templates (title, description, fields) VALUES (
    'Avaliação Física (Legacy)', 
    'Imported from Legacy System v1', 
    '[{"id":"antro.weight","label":"Peso (kg)","type":"number","section":"Antropometria"},{"id":"antro.height","label":"Altura (cm)","type":"number","section":"Antropometria"},{"id":"cardio.method","label":"Protocolo Cardio","type":"select","options":["rockport","cooper"],"section":"Cardio"},{"id":"anamnesis.mainComplaint","label":"Queixa Principal","type":"textarea","section":"Anamnese"}]'::jsonb
);
