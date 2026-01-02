-- Migration to add detailed Hip and Spine Protocols (GTPS, FAI, Acute LBP, Cervicogenic Headache)
-- Depends on 20260102150000_update_sources_schema.sql having run (evidence_sources is JSONB)

-- 1. GTPS (Bursite Trocanterica / Tendinopatia Glútea)
INSERT INTO clinical_protocols (title, region, description, evidence_sources, interventions, is_custom, is_active)
VALUES (
    'Síndrome da Dor Trocantérica Maior (Tendinopatia Glútea)',
    'Quadril',
    'A dor lateral do quadril geralmente é uma tendinopatia insercional do glúteo médio/mínimo, não apenas uma ''bursite''. O segredo é evitar compressão (cruzar pernas) e gerir carga.',
    '[
      {
        "titulo": "Education plus exercise versus corticosteroid injection for gluteal tendinopathy (LEAP Trial)",
        "autor": "Mellor R et al. (BMJ)",
        "ano": "2018",
        "doi_link": "https://www.bmj.com/content/361/bmj.k1662",
        "nivel_evidencia": "Ensaio Clínico Randomizado (Nível 1A)",
        "status": "Ativo"
      },
      {
        "titulo": "Gluteal Tendinopathy: Integrating Pathomechanics and Clinical Features",
        "autor": "Grimaldi A et al. (JOSPT)",
        "ano": "2015",
        "doi_link": "https://www.jospt.org/doi/10.2519/jospt.2015.5829",
        "nivel_evidencia": "Diretriz Clínica",
        "status": "Ativo"
      }
    ]'::jsonb,
    '[
      {
        "categoria": "Educação e Gestão de Carga",
        "tipo": "Evitar Compressão Tendínea",
        "fonte_referencia": "Grimaldi 2015 / LEAP Trial",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível A",
          "tamanho_efeito": "Crucial para redução de dor noturna"
        },
        "visualizacao_paciente": {
          "confianca": 5,
          "potencia": 5,
          "cor": "green",
          "texto_amigavel": "Alívio Imediato (Higiene Postural)"
        },
        "conduta_sugerida": "NÃO cruzar as pernas ao sentar. Dormir com travesseiro entre os joelhos. Evitar ficar em pé ''pendurado'' no quadril doloroso.",
        "dosagem": "24 horas por dia."
      },
      {
        "categoria": "Exercício Terapêutico",
        "tipo": "Fortalecimento de Abdutores (Isometria -> Isotônico)",
        "fonte_referencia": "LEAP Trial (BMJ 2018)",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível A (Ouro)",
          "tamanho_efeito": "SMD > 0.8 (Superior a Corticoide em 1 ano)"
        },
        "visualizacao_paciente": {
          "confianca": 5,
          "potencia": 5,
          "cor": "green",
          "texto_amigavel": "A Cura do Tendão"
        },
        "conduta_sugerida": "Início com isometria (sem adução) para analgesia. Progressão para carga lenta (Heavy Slow Resistance). Evitar alongamento excessivo da banda iliotibial (piora a compressão).",
        "dosagem": "Diariamente (Isometria) / 3x semana (Força)."
      },
      {
        "categoria": "Procedimento Médico",
        "tipo": "Injeção de Corticoide",
        "fonte_referencia": "LEAP Trial (BMJ 2018)",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível A (Efeito Curto Prazo apenas)",
          "tamanho_efeito": "Inferior à Fisioterapia em longo prazo"
        },
        "visualizacao_paciente": {
          "confianca": 5,
          "potencia": 2,
          "cor": "yellow",
          "texto_amigavel": "Cuidado: Efeito Temporário"
        },
        "conduta_sugerida": "Alivia a dor por 4-8 semanas, mas tem altas taxas de recidiva. Não cura o tendão.",
        "dosagem": "Máximo 1 aplicação (se dor intratável)."
      }
    ]'::jsonb,
    false,
    true
);

-- 2. FAI Hip (Impacto Femoroacetabular)
INSERT INTO clinical_protocols (title, region, description, evidence_sources, interventions, is_custom, is_active)
VALUES (
    'Impacto Femoroacetabular (FAI)',
    'Quadril',
    'Dor na virilha relacionada a flexão/rotação interna. A morfologia óssea (CAM/Pincer) não dita o prognóstico; a função muscular sim.',
    '[
      {
        "titulo": "The Warwick Agreement on femoroacetabular impingement syndrome (FAI syndrome)",
        "autor": "Griffin DR et al. (BJSM)",
        "ano": "2016",
        "doi_link": "https://bjsm.bmj.com/content/50/19/1169",
        "nivel_evidencia": "Consenso Internacional",
        "status": "Ativo"
      },
      {
        "titulo": "Physiotherapy for FAI syndrome (FASHIoN Trial)",
        "autor": "Wall PDH et al.",
        "ano": "2016",
        "doi_link": "https://doi.org/10.1302/0301-620X.98B5.37217",
        "nivel_evidencia": "Ensaio Clínico (Protocolo)",
        "status": "Ativo"
      }
    ]'::jsonb,
    '[
      {
        "categoria": "Exercício Terapêutico",
        "tipo": "Controle Lumbopélvico e Core",
        "fonte_referencia": "Warwick Agreement",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível A",
          "tamanho_efeito": "Primeira Linha de Tratamento"
        },
        "visualizacao_paciente": {
          "confianca": 5,
          "potencia": 5,
          "cor": "green",
          "texto_amigavel": "Melhora sem Cirurgia"
        },
        "conduta_sugerida": "Melhorar o controle do tilt pélvico posterior durante o agachamento para evitar o impacto ósseo. Fortalecimento profundo do quadril.",
        "dosagem": "2-3x semana."
      }
    ]'::jsonb,
    false,
    true
);

-- 3. Acute Low Back Pain (Lombar Aguda)
INSERT INTO clinical_protocols (title, region, description, evidence_sources, interventions, is_custom, is_active)
VALUES (
    'Dor Lombar Aguda (< 6 semanas)',
    'Coluna Lombar',
    'História natural favorável (90% melhora). O objetivo é evitar a cronificação. ''Não transforme um problema simples em complexo''.',
    '[
      {
        "titulo": "Low back pain and sciatica in over 16s: assessment and management (NG59)",
        "autor": "NICE Guidelines",
        "ano": "2020",
        "doi_link": "https://www.nice.org.uk/guidance/ng59",
        "nivel_evidencia": "Diretriz Clínica",
        "status": "Ativo"
      },
      {
        "titulo": "The Lancet Series on Low Back Pain",
        "autor": "Buchbinder R et al. (The Lancet)",
        "ano": "2018",
        "doi_link": "https://doi.org/10.1016/S0140-6736(18)30488-4",
        "nivel_evidencia": "Revisão Global",
        "status": "Ativo"
      }
    ]'::jsonb,
    '[
      {
        "categoria": "Educação",
        "tipo": "Manter-se Ativo (Stay Active)",
        "fonte_referencia": "NICE NG59 / The Lancet",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível A (Forte)",
          "tamanho_efeito": "SMD > 0.5 (Prevenção de Incapacidade)"
        },
        "visualizacao_paciente": {
          "confianca": 5,
          "potencia": 5,
          "cor": "green",
          "texto_amigavel": "O Melhor Remédio"
        },
        "conduta_sugerida": "Evitar repouso no leito. Tentar manter rotina normal dentro do limite da dor. Tranquilizar que dor aguda é autolimitada.",
        "dosagem": "Diariamente."
      },
      {
        "categoria": "Terapia Manual",
        "tipo": "Manipulação Vertebral",
        "fonte_referencia": "NICE NG59",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível B",
          "tamanho_efeito": "Alívio Curto Prazo"
        },
        "visualizacao_paciente": {
          "confianca": 4,
          "potencia": 3,
          "cor": "green",
          "texto_amigavel": "Alívio Rápido"
        },
        "conduta_sugerida": "Pode ser usada para alívio imediato e facilitar o retorno ao movimento. Não criar dependência.",
        "dosagem": "Máximo 2-4 sessões."
      }
    ]'::jsonb,
    false,
    true
);

-- 4. Cervicogenic Headache (Cefaleia Cervicogênica)
INSERT INTO clinical_protocols (title, region, description, evidence_sources, interventions, is_custom, is_active)
VALUES (
    'Cefaleia Cervicogênica',
    'Coluna Cervical / Cabeça',
    'Dor de cabeça unilateral que começa no pescoço. Piora com movimento cervical ou palpação suboccipital.',
    '[
      {
        "titulo": "Physical Therapist Interventions for Cervicogenic Headache: Systematic Review",
        "autor": "Fernandez-de-las-Penas C et al. (PTJ)",
        "ano": "2024",
        "doi_link": "https://academic.oup.com/ptj/article-abstract/104/2/pzad166/7454228",
        "nivel_evidencia": "Revisão Sistemática / Network Meta-analysis",
        "status": "Ativo"
      }
    ]'::jsonb,
    '[
      {
        "categoria": "Multimodal (Combo)",
        "tipo": "Manipulação + Agulhamento Seco (Dry Needling)",
        "fonte_referencia": "PTJ 2024",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível B (Rank 1 na Meta-análise)",
          "tamanho_efeito": "SMD > 0.8 (Redução de Intensidade)"
        },
        "visualizacao_paciente": {
          "confianca": 4,
          "potencia": 5,
          "cor": "green",
          "texto_amigavel": "Combinação Mais Eficaz"
        },
        "conduta_sugerida": "Manipulação cervical alta (C1-C2) combinada com Dry Needling em pontos gatilho suboccipitais/trapézio.",
        "dosagem": "1-2x semana."
      },
      {
        "categoria": "Exercício Terapêutico",
        "tipo": "Flexores Profundos e Controle Escapular",
        "fonte_referencia": "JOSPT / PTJ 2024",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível A (Longo Prazo)",
          "tamanho_efeito": "SMD 0.6 (Manutenção)"
        },
        "visualizacao_paciente": {
          "confianca": 5,
          "potencia": 4,
          "cor": "green",
          "texto_amigavel": "Previne o Retorno"
        },
        "conduta_sugerida": "Reeducação craniocervical para manter os ganhos da terapia manual.",
        "dosagem": "Diariamente em casa."
      }
    ]'::jsonb,
    false,
    true
);
