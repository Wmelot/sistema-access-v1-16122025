-- Migration to add detailed Upper Limb Protocols (Elbow, Wrist, Hand, Shoulder Trauma)
-- Depends on 20260102150000_update_sources_schema.sql having run (evidence_sources is JSONB)

-- 1. Lateral Elbow Tendinopathy (Tennis Elbow)
INSERT INTO clinical_protocols (title, region, description, evidence_sources, interventions, is_custom, is_active)
VALUES (
    'Epicondilalgia Lateral (Cotovelo de Tenista)',
    'Cotovelo',
    'Não é uma inflamação aguda (''ite''), mas uma falha na cicatrização do tendão. O gelo ajuda na dor, mas apenas o exercício cura o tendão.',
    '[
      {
        "titulo": "Lateral Elbow Pain and Muscle Function Impairments: CPG 2022",
        "autor": "Lucado AM et al. (JOSPT)",
        "ano": "2022",
        "doi_link": "https://www.jospt.org/doi/10.2519/jospt.2022.0302",
        "nivel_evidencia": "Diretriz Clínica (CPG)",
        "status": "Ativo"
      },
      {
        "titulo": "Management of Lateral Elbow Tendinopathy: One Size Does Not Fit All",
        "autor": "Coombes BK et al. (JOSPT)",
        "ano": "2015",
        "doi_link": "https://www.jospt.org/doi/10.2519/jospt.2015.5841",
        "nivel_evidencia": "Revisão Clínica",
        "status": "Ativo"
      }
    ]'::jsonb,
    '[
      {
        "categoria": "Exercício Terapêutico",
        "tipo": "Carga Progressiva (Isométrico -> Excêntrico)",
        "fonte_referencia": "JOSPT CPG 2022",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível A (Forte)",
          "tamanho_efeito": "SMD > 0.8 (Longo Prazo)"
        },
        "visualizacao_paciente": {
          "confianca": 5,
          "potencia": 5,
          "cor": "green",
          "texto_amigavel": "Único Tratamento Curativo"
        },
        "conduta_sugerida": "1. Isometria de punho (30-45s) para analgesia. 2. Exercícios de força isotônica (pesinhos). A dor leve durante o exercício é permitida.",
        "dosagem": "Diariamente (Isometria) / 3x semana (Força)."
      },
      {
        "categoria": "Procedimento Médico",
        "tipo": "Injeção de Corticoide",
        "fonte_referencia": "Coombes et al. (JAMA / JOSPT)",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível A (Prejudicial a Longo Prazo)",
          "tamanho_efeito": "Piora o prognóstico em 1 ano"
        },
        "visualizacao_paciente": {
          "confianca": 5,
          "potencia": 1,
          "cor": "red",
          "texto_amigavel": "Evitar (Risco de Recorrência)"
        },
        "conduta_sugerida": "Embora tire a dor rápido, aumenta o risco de recidiva e degeneração do tendão em 1 ano. Não recomendado como primeira linha.",
        "dosagem": "Apenas casos refratários."
      }
    ]'::jsonb,
    false,
    true
);

-- 2. Carpal Tunnel Syndrome (Túnel do Carpo)
INSERT INTO clinical_protocols (title, region, description, evidence_sources, interventions, is_custom, is_active)
VALUES (
    'Síndrome do Túnel do Carpo',
    'Punho e Mão',
    'Compressão do nervo mediano. Sintomas noturnos são a marca registrada. Cirurgia nem sempre é necessária.',
    '[
      {
        "titulo": "Carpal Tunnel Syndrome: Clinical Practice Guidelines",
        "autor": "Erickson M et al. (JOSPT)",
        "ano": "2019",
        "doi_link": "https://www.jospt.org/doi/10.2519/jospt.2019.0301",
        "nivel_evidencia": "Diretriz Clínica (CPG)",
        "status": "Ativo"
      },
      {
        "titulo": "Surgical versus non-surgical treatment for carpal tunnel syndrome",
        "autor": "Cochrane Database",
        "ano": "2024",
        "doi_link": "https://doi.org/10.1002/14651858.CD001552.pub3",
        "nivel_evidencia": "Revisão Cochrane",
        "status": "Ativo"
      }
    ]'::jsonb,
    '[
      {
        "categoria": "Órtese (Splint)",
        "tipo": "Uso Noturno (Posição Neutra)",
        "fonte_referencia": "JOSPT 2019",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível A",
          "tamanho_efeito": "SMD 0.6 (Redução de Sintomas)"
        },
        "visualizacao_paciente": {
          "confianca": 5,
          "potencia": 4,
          "cor": "green",
          "texto_amigavel": "Essencial para Dormir"
        },
        "conduta_sugerida": "Manter o punho em posição neutra (0 graus) durante a noite para reduzir a pressão no túnel.",
        "dosagem": "Todas as noites por 4-6 semanas."
      },
      {
        "categoria": "Terapia Manual",
        "tipo": "Mobilização de Neurodinâmica",
        "fonte_referencia": "JOSPT 2019",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível B",
          "tamanho_efeito": "Moderado"
        },
        "visualizacao_paciente": {
          "confianca": 4,
          "potencia": 4,
          "cor": "green",
          "texto_amigavel": "Deslizamento do Nervo"
        },
        "conduta_sugerida": "Exercícios de ''Tendon Gliding'' e mobilização neural suave (sem provocar sintomas fortes).",
        "dosagem": "Diariamente."
      }
    ]'::jsonb,
    false,
    true
);

-- 3. Distal Radius Fracture (Fratura de Punho)
INSERT INTO clinical_protocols (title, region, description, evidence_sources, interventions, is_custom, is_active)
VALUES (
    'Fratura de Rádio Distal (Pós-Imobilização)',
    'Punho e Mão',
    'A fratura mais comum do membro superior. A rigidez é a principal complicação. Mobilização precoce é segura em fraturas estáveis.',
    '[
      {
        "titulo": "Rehabilitation for distal radial fractures in adults (Cochrane Review)",
        "autor": "Handoll HH et al.",
        "ano": "2015",
        "doi_link": "https://doi.org/10.1002/14651858.CD003324.pub3",
        "nivel_evidencia": "Revisão Sistemática",
        "status": "Ativo"
      },
      {
        "titulo": "Distal Radius Fracture Rehabilitation Guidelines",
        "autor": "APTA Hand & Upper Extremity",
        "ano": "2024",
        "doi_link": "https://www.orthopt.org/uploads/content_files/files/mehta_et_al_2024_distal_radius_fracture_rehabilitation.pdf",
        "nivel_evidencia": "Guideline Clínico",
        "status": "Ativo"
      }
    ]'::jsonb,
    '[
      {
        "categoria": "Fase Pós-Gesso (6 semanas+)",
        "tipo": "Mobilização Ativa e Passiva",
        "fonte_referencia": "Cochrane 2015",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível A",
          "tamanho_efeito": "Crucial para Função"
        },
        "visualizacao_paciente": {
          "confianca": 5,
          "potencia": 5,
          "cor": "green",
          "texto_amigavel": "Recuperar Movimento"
        },
        "conduta_sugerida": "Focar em supinação e extensão de punho (os movimentos mais difíceis de recuperar). Mobilização articular grau III/IV.",
        "dosagem": "Diariamente."
      },
      {
        "categoria": "Exercício Terapêutico",
        "tipo": "Fortalecimento de Preensão (Grip)",
        "fonte_referencia": "APTA 2024",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível B",
          "tamanho_efeito": "Moderado"
        },
        "visualizacao_paciente": {
          "confianca": 4,
          "potencia": 4,
          "cor": "green",
          "texto_amigavel": "Força da Mão"
        },
        "conduta_sugerida": "Iniciar assim que a consolidação óssea for confirmada (Rx). Uso de massinha (Putty) e gripper.",
        "dosagem": "3x semana."
      }
    ]'::jsonb,
    false,
    true
);

-- 4. De Quervain Tenosynovitis
INSERT INTO clinical_protocols (title, region, description, evidence_sources, interventions, is_custom, is_active)
VALUES (
    'Tenossinovite de De Quervain',
    'Punho e Mão',
    'Dor na base do polegar. Teste de Finkelstein positivo. Comum em pós-parto e uso excessivo de celular.',
    '[
      {
        "titulo": "Management of de Quervain Tenosynovitis: A Systematic Review",
        "autor": "Larsen et al.",
        "ano": "2023",
        "doi_link": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10611995/",
        "nivel_evidencia": "Revisão Sistemática",
        "status": "Ativo"
      }
    ]'::jsonb,
    '[
      {
        "categoria": "Órtese",
        "tipo": "Splint de Polegar (Spica)",
        "fonte_referencia": "Systematic Review 2023",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível B",
          "tamanho_efeito": "SMD 0.7 (Combo com Fisio)"
        },
        "visualizacao_paciente": {
          "confianca": 4,
          "potencia": 4,
          "cor": "green",
          "texto_amigavel": "Repouso do Tendão"
        },
        "conduta_sugerida": "Imobilização relativa do polegar para reduzir a inflamação da bainha tendínea.",
        "dosagem": "Uso intermitente (atividades de dor) ou noturno."
      }
    ]'::jsonb,
    false,
    true
);

-- 5. Proximal Humerus Fracture (Trauma de Ombro)
INSERT INTO clinical_protocols (title, region, description, evidence_sources, interventions, is_custom, is_active)
VALUES (
    'Fratura de Úmero Proximal (Ombro - Trauma)',
    'Ombro',
    'Comum em idosos. A maioria das fraturas sem desvio grande NÃO precisa de cirurgia e tem resultado igual ao operado.',
    '[
      {
        "titulo": "Surgical vs nonsurgical treatment of adults with displaced fractures of the proximal humerus (PROFHER Trial)",
        "autor": "Rangan A et al. (JAMA)",
        "ano": "2015",
        "doi_link": "https://jamanetwork.com/journals/jama/fullarticle/2190988",
        "nivel_evidencia": "Ensaio Clínico Randomizado (Nível 1A)",
        "status": "Ativo"
      }
    ]'::jsonb,
    '[
      {
        "categoria": "Tratamento Conservador",
        "tipo": "Mobilização Precoce (Pêndulo)",
        "fonte_referencia": "PROFHER Trial (JAMA)",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível A (Ouro)",
          "tamanho_efeito": "Igual à Cirurgia em 2 anos"
        },
        "visualizacao_paciente": {
          "confianca": 5,
          "potencia": 5,
          "cor": "green",
          "texto_amigavel": "Seguro e Eficaz"
        },
        "conduta_sugerida": "Iniciar exercícios pendulares na 1ª ou 2ª semana (conforme dor). Uso de tipoia apenas para conforto, não imobilização estrita.",
        "dosagem": "Diariamente."
      },
      {
        "categoria": "Cirurgia",
        "tipo": "Placa e Parafusos (ORIF)",
        "fonte_referencia": "PROFHER Trial",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível A (Questionável)",
          "tamanho_efeito": "Riscos > Benefícios (em muitos casos)"
        },
        "visualizacao_paciente": {
          "confianca": 5,
          "potencia": 2,
          "cor": "yellow",
          "texto_amigavel": "Avaliar Risco/Benefício"
        },
        "conduta_sugerida": "O estudo PROFHER mostrou que em idosos, a cirurgia não gerou melhor função que a fisioterapia, mas trouxe riscos cirúrgicos.",
        "dosagem": "Decisão Médica."
      }
    ]'::jsonb,
    false,
    true
);
