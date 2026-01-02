-- Migration to add detailed Shoulder Protocols (Rotator Cuff, Frozen Shoulder, Instability)
-- Depends on 20260102150000_update_sources_schema.sql having run (evidence_sources is JSONB)

-- 1. Rotator Cuff Related Shoulder Pain (RCRSP)
INSERT INTO clinical_protocols (title, region, description, evidence_sources, interventions, is_custom, is_active)
VALUES (
    'Dor Relacionada ao Manguito Rotador (Síndrome do Impacto)',
    'Ombro',
    'Termo moderno para ''Bursite/Tendinite''. A dor vem da fraqueza/sobrecarga dos tendões, não do ''osso raspando''.',
    '[
      {
        "titulo": "Decompression surgery for subacromial shoulder pain (CSaw Trial)",
        "autor": "Beard DJ et al. (The Lancet)",
        "ano": "2018",
        "doi_link": "https://doi.org/10.1016/S0140-6736(17)32457-1",
        "nivel_evidencia": "Ensaio Clínico Randomizado (Nível 1A)",
        "status": "Ativo"
      },
      {
        "titulo": "Exercise for rotator cuff related shoulder pain",
        "autor": "Naik et al. (Cochrane Database)",
        "ano": "2020",
        "doi_link": "https://doi.org/10.1002/14651858.CD012419.pub2",
        "nivel_evidencia": "Revisão Sistemática",
        "status": "Ativo"
      }
    ]'::jsonb,
    '[
      {
        "categoria": "Exercício Terapêutico",
        "tipo": "Carga Progressiva do Manguito e Escápula",
        "fonte_referencia": "Cochrane 2020 / Littlewood 2019",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível A (Ouro)",
          "tamanho_efeito": "SMD > 0.8 (Superior à Cirurgia a longo prazo)"
        },
        "visualizacao_paciente": {
          "confianca": 5,
          "potencia": 5,
          "cor": "green",
          "texto_amigavel": "Tratamento Definitivo"
        },
        "conduta_sugerida": "Exercícios simples de carga (abdução/rotação) tolerando dor leve (<3/10). Foco em capacidade do tendão, não em ''corrigir cinesia''.",
        "dosagem": "1x ao dia ou dias alternados (mínimo 12 semanas)."
      },
      {
        "categoria": "Cirurgia",
        "tipo": "Acromioplastia (Raspagem) / Descompressão",
        "fonte_referencia": "CSaw Trial (The Lancet)",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível A (Contraindicado como rotina)",
          "tamanho_efeito": "Igual ao Placebo (Sham Surgery)"
        },
        "visualizacao_paciente": {
          "confianca": 5,
          "potencia": 1,
          "cor": "red",
          "texto_amigavel": "Não Recomendado"
        },
        "conduta_sugerida": "A ciência provou que ''limpar o osso'' não resolve a dor mais do que apenas fisioterapia. Evitar encaminhamento cirúrgico precoce.",
        "dosagem": "N/A"
      },
      {
        "categoria": "Eletroterapia",
        "tipo": "Ultrassom Terapêutico",
        "fonte_referencia": "Cochrane Database",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível D (Sem efeito)",
          "tamanho_efeito": "Ineficaz"
        },
        "visualizacao_paciente": {
          "confianca": 5,
          "potencia": 1,
          "cor": "yellow",
          "texto_amigavel": "Pouco Útil"
        },
        "conduta_sugerida": "Não usar tempo de sessão valioso com modalidades passivas.",
        "dosagem": "N/A"
      }
    ]'::jsonb,
    false,
    true
);

-- 2. Frozen Shoulder (Capsulite Adesiva)
INSERT INTO clinical_protocols (title, region, description, evidence_sources, interventions, is_custom, is_active)
VALUES (
    'Capsulite Adesiva (Ombro Congelado)',
    'Ombro',
    'Classificar por Nível de Irritabilidade (Alta vs Baixa). Forçar alongamento na fase inflamatória PIORA o quadro.',
    '[
      {
        "titulo": "Adhesive Capsulitis: Clinical Practice Guidelines",
        "autor": "Kelley MJ et al. (JOSPT)",
        "ano": "2013",
        "doi_link": "https://www.jospt.org/doi/10.2519/jospt.2013.0302",
        "nivel_evidencia": "Diretriz Clínica (CPG)",
        "status": "Ativo"
      }
    ]'::jsonb,
    '[
      {
        "categoria": "Fase de Alta Irritabilidade (Dor > 7/10)",
        "tipo": "Educação + Mobilidade Suave",
        "fonte_referencia": "JOSPT 2013",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível A",
          "tamanho_efeito": "Prevenção de Piora"
        },
        "visualizacao_paciente": {
          "confianca": 5,
          "potencia": 5,
          "cor": "green",
          "texto_amigavel": "Gerenciamento de Dor"
        },
        "conduta_sugerida": "Exercícios pendulares e AAROM (Assistidos) sem forçar dor. Considerar encaminhamento médico para Corticoide Intra-articular (Nível A para dor a curto prazo).",
        "dosagem": "Diariamente, curta duração."
      },
      {
        "categoria": "Fase de Rigidez (Baixa Irritabilidade)",
        "tipo": "Alongamento e Mobilização (Fim de ADM)",
        "fonte_referencia": "JOSPT 2013",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível B",
          "tamanho_efeito": "Moderado para ganho de ADM"
        },
        "visualizacao_paciente": {
          "confianca": 4,
          "potencia": 4,
          "cor": "green",
          "texto_amigavel": "Ganho de Movimento"
        },
        "conduta_sugerida": "Agora sim: Mobilização grau III/IV e alongamento sustentado.",
        "dosagem": "Sustentar alongamentos por períodos maiores (ex: 30s a 60s)."
      }
    ]'::jsonb,
    false,
    true
);

-- 3. Anterior Shoulder Instability
INSERT INTO clinical_protocols (title, region, description, evidence_sources, interventions, is_custom, is_active)
VALUES (
    'Instabilidade Glenoumeral (Luxação/Subluxação)',
    'Ombro',
    'O medo do movimento (apreensão) é a principal barreira. Reabilitação foca em controle dinâmico, não em ''cicatrizar'' o labrum.',
    '[
      {
        "titulo": "Multidirectional instability of the shoulder: biomechanics and rehabilitation",
        "autor": "Warby SA et al. (Manual Therapy)",
        "ano": "2016",
        "doi_link": "https://doi.org/10.1016/j.math.2016.02.009",
        "nivel_evidencia": "Revisão Narrativa / Protocolo Derby",
        "status": "Ativo"
      },
      {
        "titulo": "Rehabilitation for Anterior Shoulder Instability",
        "autor": "Olds et al. (JOSPT)",
        "ano": "2015",
        "doi_link": "https://www.jospt.org/doi/10.2519/jospt.2015.0302",
        "nivel_evidencia": "Revisão Sistemática",
        "status": "Ativo"
      }
    ]'::jsonb,
    '[
      {
        "categoria": "Exercício Terapêutico",
        "tipo": "Controle Neuromuscular (Watson/Derby Protocol)",
        "fonte_referencia": "Warby 2016",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível B",
          "tamanho_efeito": "Redução de Recorrência"
        },
        "visualizacao_paciente": {
          "confianca": 4,
          "potencia": 5,
          "cor": "green",
          "texto_amigavel": "Estabilidade Dinâmica"
        },
        "conduta_sugerida": "Focar nos estabilizadores da cabeça umeral. 1. Controle Escapular. 2. Controle Rotador em posições seguras (evitar Abdução+Rot Ext inicial). 3. Pliometria.",
        "dosagem": "Progressão baseada em ausência de apreensão."
      },
      {
        "categoria": "Imobilização Prolongada",
        "tipo": "Tipoia por > 3 semanas",
        "fonte_referencia": "Olds et al 2015",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível C (Controverso)",
          "tamanho_efeito": "Baixo impacto na recorrência em jovens"
        },
        "visualizacao_paciente": {
          "confianca": 3,
          "potencia": 2,
          "cor": "yellow",
          "texto_amigavel": "Uso Restrito"
        },
        "conduta_sugerida": "Em jovens ativos (<25 anos), a taxa de recidiva é alta independente da imobilização. Encaminhar para opinião ortopédica se atleta de contato. Em >30 anos, foco total em reabilitação.",
        "dosagem": "Mínimo necessário para conforto (1 semana)."
      }
    ]'::jsonb,
    false,
    true
);
