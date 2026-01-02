-- Migration to add detailed Knee Protocols (ACL, PFPS, Jumper's Knee, Meniscus)
-- Depends on 20260102150000_update_sources_schema.sql having run (evidence_sources is JSONB)

-- 1. ACL Reconstruction (LCA)
INSERT INTO clinical_protocols (title, region, description, evidence_sources, interventions, is_custom, is_active)
VALUES (
    'Reconstrução de Ligamento Cruzado Anterior (LCA)',
    'Joelho',
    'O sucesso depende de critérios de progressão (não apenas tempo). Foco em extensão completa imediata e força de quadríceps.',
    '[
      {
        "titulo": "Clinical Practice Guidelines: Knee Ligament Sprains",
        "autor": "Logerstedt DS et al. (JOSPT)",
        "ano": "2017",
        "doi_link": "https://www.jospt.org/doi/10.2519/jospt.2017.0303",
        "nivel_evidencia": "Diretriz Clínica (CPG)",
        "status": "Ativo"
      },
      {
        "titulo": "Rehabilitation Practice Patterns for ACL Reconstruction (Delaware-Oslo)",
        "autor": "Grindem H et al. (BJSM)",
        "ano": "2016",
        "doi_link": "https://bjsm.bmj.com/content/50/13/804",
        "nivel_evidencia": "Coorte Prospectiva",
        "status": "Ativo"
      }
    ]'::jsonb,
    '[
      {
        "categoria": "Fase 1: Pós-Op Imediato (0-4 semanas)",
        "tipo": "Mobilização e Ativação",
        "fonte_referencia": "JOSPT 2017",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível A",
          "tamanho_efeito": "Crucial para evitar Artrofibrose"
        },
        "visualizacao_paciente": {
          "confianca": 5,
          "potencia": 5,
          "cor": "green",
          "texto_amigavel": "Prioridade Máxima"
        },
        "conduta_sugerida": "1. Extensão Completa (igual ao lado oposto). 2. Redução de Edema. 3. Ativação de Quadríceps (NMES/FES recomendado).",
        "dosagem": "Diariamente. Carga conforme tolerância (muletas até controle do quadríceps)."
      },
      {
        "categoria": "Exercício Terapêutico",
        "tipo": "Cadeia Cinética Aberta (CCA)",
        "fonte_referencia": "JOSPT 2017 / Cochrane",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível A",
          "tamanho_efeito": "Seguro a partir da 4ª semana (90-45º)"
        },
        "visualizacao_paciente": {
          "confianca": 5,
          "potencia": 4,
          "cor": "green",
          "texto_amigavel": "Seguro e Eficaz"
        },
        "conduta_sugerida": "Pode iniciar CCA (Cadeira Extensora) precocemente (a partir da 4ª semana) em angulação restrita (90º a 45º) para hipertrofia sem risco ao enxerto.",
        "dosagem": "3-4x semana, foco em hipertrofia (8-12 reps)."
      }
    ]'::jsonb,
    false,
    true
);

-- 2. Patellofemoral Pain (PFPS)
INSERT INTO clinical_protocols (title, region, description, evidence_sources, interventions, is_custom, is_active)
VALUES (
    'Dor Patelofemoral (Síndrome da Dor Anterior)',
    'Joelho',
    'Mais comum em corredores e mulheres jovens. A causa geralmente é proximal (quadril) e não no joelho.',
    '[
      {
        "titulo": "Patellofemoral Pain: Clinical Practice Guidelines",
        "autor": "Willy RW et al. (JOSPT)",
        "ano": "2019",
        "doi_link": "https://www.jospt.org/doi/10.2519/jospt.2019.0302",
        "nivel_evidencia": "Diretriz Clínica (CPG)",
        "status": "Ativo"
      }
    ]'::jsonb,
    '[
      {
        "categoria": "Exercício Terapêutico",
        "tipo": "Fortalecimento de Quadril e Joelho (Combinado)",
        "fonte_referencia": "JOSPT 2019",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível A (Ouro)",
          "tamanho_efeito": "SMD > 1.0 (Muito Grande)"
        },
        "visualizacao_paciente": {
          "confianca": 5,
          "potencia": 5,
          "cor": "green",
          "texto_amigavel": "A Solução do Problema"
        },
        "conduta_sugerida": "Focar em Glúteo Médio/Máximo (Abdução e Rotação Externa) + Quadríceps. Exercícios de quadril isolados no início reduzem dor mais rápido.",
        "dosagem": "3x semana. Carga progressiva."
      },
      {
        "categoria": "Órteses / Palmilhas",
        "tipo": "Palmilhas Pré-fabricadas",
        "fonte_referencia": "JOSPT 2019",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível A (Curto Prazo)",
          "tamanho_efeito": "SMD 0.4 (Moderado)"
        },
        "visualizacao_paciente": {
          "confianca": 5,
          "potencia": 3,
          "cor": "green",
          "texto_amigavel": "Ajuda no Início"
        },
        "conduta_sugerida": "Indicado para pacientes com pronação excessiva do pé como estratégia de alívio de dor nas primeiras 6 semanas.",
        "dosagem": "Uso temporário."
      },
      {
        "categoria": "Terapia Manual",
        "tipo": "Mobilização Patelar/Lombar",
        "fonte_referencia": "JOSPT 2019",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível A (Não Recomendado Isoladamente)",
          "tamanho_efeito": "Sem efeito clínico se usado sozinho"
        },
        "visualizacao_paciente": {
          "confianca": 4,
          "potencia": 1,
          "cor": "yellow",
          "texto_amigavel": "Apenas se Necessário"
        },
        "conduta_sugerida": "Não deve ser o tratamento principal. Usar apenas se houver restrições claras de mobilidade.",
        "dosagem": "Sob demanda."
      }
    ]'::jsonb,
    false,
    true
);

-- 3. Patellar Tendinopathy (Jumper's Knee)
INSERT INTO clinical_protocols (title, region, description, evidence_sources, interventions, is_custom, is_active)
VALUES (
    'Tendinopatia Patelar (Jumper''s Knee)',
    'Joelho',
    'Patologia de carga. O tendão precisa de carga progressiva para remodelar. Repouso absoluto piora a tolerância à carga.',
    '[
      {
        "titulo": "Achilles and Patellar Tendinopathy Rehabilitation",
        "autor": "Malliaras P et al. (JOSPT)",
        "ano": "2015",
        "doi_link": "https://www.jospt.org/doi/10.2519/jospt.2015.0302",
        "nivel_evidencia": "Revisão Sistemática",
        "status": "Ativo"
      }
    ]'::jsonb,
    '[
      {
        "categoria": "Exercício Terapêutico",
        "tipo": "Gestão de Carga Progressiva (HSR)",
        "fonte_referencia": "Malliaras 2015",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível A",
          "tamanho_efeito": "SMD > 0.8"
        },
        "visualizacao_paciente": {
          "confianca": 5,
          "potencia": 5,
          "cor": "green",
          "texto_amigavel": "Essencial para Cura"
        },
        "conduta_sugerida": "1. Isometria (Alívio de dor - Spanish Squat 5x45s). 2. Isotônicos (Heavy Slow Resistance). 3. Armazenamento de Energia (Pliometria - Fases finais).",
        "dosagem": "Isometria diária se dor alta. HSR 3x semana (dias alternados)."
      },
      {
        "categoria": "Modalidades Passivas",
        "tipo": "Ultrassom / Laser / Choque",
        "fonte_referencia": "JOSPT 2015",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível D (Não Recomendado)",
          "tamanho_efeito": "Ineficaz"
        },
        "visualizacao_paciente": {
          "confianca": 4,
          "potencia": 1,
          "cor": "red",
          "texto_amigavel": "Não Cura o Tendão"
        },
        "conduta_sugerida": "Não investir tempo de sessão. O tendão precisa de estímulo mecânico, não térmico.",
        "dosagem": "N/A"
      }
    ]'::jsonb,
    false,
    true
);

-- 4. Meniscus (Degenerative)
INSERT INTO clinical_protocols (title, region, description, evidence_sources, interventions, is_custom, is_active)
VALUES (
    'Lesão Meniscal (Degenerativa)',
    'Joelho',
    'Em pacientes >35 anos sem travamento mecânico, a cirurgia não é superior ao exercício.',
    '[
      {
        "titulo": "Surgery versus Physical Therapy for a Meniscal Tear (METEOR Trial)",
        "autor": "Katz JN et al. (NEJM)",
        "ano": "2013",
        "doi_link": "https://www.nejm.org/doi/full/10.1056/NEJMoa1301408",
        "nivel_evidencia": "Ensaio Clínico Randomizado (RCT)",
        "status": "Ativo"
      },
      {
        "titulo": "ESSKA Consensus: Degenerative Meniscal Lesions",
        "autor": "Beaufils P et al.",
        "ano": "2017",
        "doi_link": "https://doi.org/10.1007/s00167-016-4406-6",
        "nivel_evidencia": "Consenso Europeu",
        "status": "Ativo"
      }
    ]'::jsonb,
    '[
      {
        "categoria": "Exercício Terapêutico",
        "tipo": "Fortalecimento Supervisionado",
        "fonte_referencia": "METEOR Trial / ESSKA",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível A",
          "tamanho_efeito": "Igual à Cirurgia em 1 ano"
        },
        "visualizacao_paciente": {
          "confianca": 5,
          "potencia": 5,
          "cor": "green",
          "texto_amigavel": "Primeira Opção"
        },
        "conduta_sugerida": "Foco em fortalecimento de quadríceps e controle neuromuscular.",
        "dosagem": "Mínimo 3 meses de tentativa conservadora antes de considerar cirurgia."
      },
      {
        "categoria": "Cirurgia",
        "tipo": "Meniscectomia Parcial (Artroscopia)",
        "fonte_referencia": "BMJ Guidelines 2017",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível C (Não Recomendado como 1ª linha)",
          "tamanho_efeito": "Risco de Artrose Precoce"
        },
        "visualizacao_paciente": {
          "confianca": 5,
          "potencia": 2,
          "cor": "yellow",
          "texto_amigavel": "Evitar Inicialmente"
        },
        "conduta_sugerida": "Não indicada para lesões degenerativas sem travamento articular claro.",
        "dosagem": "Apenas falha conservadora."
      }
    ]'::jsonb,
    false,
    true
);
