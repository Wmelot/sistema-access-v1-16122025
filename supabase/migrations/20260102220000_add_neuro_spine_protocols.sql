-- Migration to add detailed Neurological Spine Protocols (Sciatica, Stenosis, Cervical Radiculopathy)
-- Depends on 20260102150000_update_sources_schema.sql having run (evidence_sources is JSONB)

-- 1. Sciatica (Ciatalgia)
INSERT INTO clinical_protocols (title, region, description, evidence_sources, interventions, is_custom, is_active)
VALUES (
    'Ciatalgia / Radiculopatia Lombar',
    'Coluna Lombar',
    'Dor irradiada para a perna (abaixo do joelho). A história natural é favorável, mas a dor neuropática exige paciência. Diferenciar de dor referida somática.',
    '[
      {
        "titulo": "Pathology and intervention in musculoskeletal rehabilitation (Sciatica Guidelines)",
        "autor": "NICE Guidelines NG59",
        "ano": "2020",
        "doi_link": "https://www.nice.org.uk/guidance/ng59",
        "nivel_evidencia": "Diretriz Clínica",
        "status": "Ativo"
      },
      {
        "titulo": "Diagnosis and treatment of sciatica",
        "autor": "Jensen RK et al. (BMJ)",
        "ano": "2019",
        "doi_link": "https://www.bmj.com/content/367/bmj.l6273",
        "nivel_evidencia": "Revisão Clínica",
        "status": "Ativo"
      }
    ]'::jsonb,
    '[
      {
        "categoria": "Educação e Modificação",
        "tipo": "Manter-se Ativo (Respeitando a Dor)",
        "fonte_referencia": "NICE NG59 / BMJ 2019",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível A",
          "tamanho_efeito": "Crucial para evitar cronificação"
        },
        "visualizacao_paciente": {
          "confianca": 5,
          "potencia": 5,
          "cor": "green",
          "texto_amigavel": "O Nervo precisa de Movimento"
        },
        "conduta_sugerida": "O repouso absoluto no leito retarda a recuperação. Manter caminhadas leves. Explicar que a dor do nervo demora mais para passar que a dor muscular.",
        "dosagem": "Diariamente."
      },
      {
        "categoria": "Terapia Manual",
        "tipo": "Mobilização Neural (Neurodinâmica)",
        "fonte_referencia": "Revisões Sistemáticas (Ellis et al)",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível B (Moderado)",
          "tamanho_efeito": "SMD 0.6 (Redução de Dor)"
        },
        "visualizacao_paciente": {
          "confianca": 4,
          "potencia": 4,
          "cor": "green",
          "texto_amigavel": "Deslizamento do Nervo"
        },
        "conduta_sugerida": "Mobilização suave (Sliders) para melhorar a oxigenação e deslizamento do nervo ciático. Evitar tensionamento agressivo (Tensioners) na fase aguda.",
        "dosagem": "Séries curtas, sem provocar latência de dor."
      },
      {
        "categoria": "Procedimento Médico",
        "tipo": "Injeção Epidural de Corticoide",
        "fonte_referencia": "NICE NG59",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível A (Para dor severa aguda)",
          "tamanho_efeito": "Alívio a Curto Prazo apenas"
        },
        "visualizacao_paciente": {
          "confianca": 5,
          "potencia": 3,
          "cor": "yellow",
          "texto_amigavel": "Opção para Dor Intensa"
        },
        "conduta_sugerida": "Considerar encaminhamento se a dor for incapacitante e não responder à fisio em 4 semanas. Não cura, mas alivia.",
        "dosagem": "Decisão Médica."
      }
    ]'::jsonb,
    false,
    true
);

-- 2. Lumbar Stenosis (Estenose)
INSERT INTO clinical_protocols (title, region, description, evidence_sources, interventions, is_custom, is_active)
VALUES (
    'Estenose de Canal Lombar (Claudicação Neurogênica)',
    'Coluna Lombar',
    'Estreitamento do canal. Sintoma clássico: dor/peso nas pernas ao caminhar que melhora ao sentar ou inclinar para frente (Carrinho de Supermercado).',
    '[
      {
        "titulo": "Surgical vs Nonoperative Treatment for Lumbar Spinal Stenosis (Cochrane)",
        "autor": "Zaina F et al. (Cochrane)",
        "ano": "2016",
        "doi_link": "https://doi.org/10.1002/14651858.CD010264.pub2",
        "nivel_evidencia": "Revisão Cochrane",
        "status": "Ativo"
      },
      {
        "titulo": "Effectiveness of Physical Therapy in Lumbar Spinal Stenosis (Annals Int Med)",
        "autor": "Minetove et al.",
        "ano": "2015",
        "doi_link": "https://doi.org/10.7326/M18-1912",
        "nivel_evidencia": "Ensaio Clínico Randomizado",
        "status": "Ativo"
      }
    ]'::jsonb,
    '[
      {
        "categoria": "Exercício Terapêutico",
        "tipo": "Protocolo de Flexão e Bicicleta",
        "fonte_referencia": "Minetove 2015 / Cochrane",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível A",
          "tamanho_efeito": "Igual à Cirurgia em casos moderados"
        },
        "visualizacao_paciente": {
          "confianca": 5,
          "potencia": 5,
          "cor": "green",
          "texto_amigavel": "Abrir Espaço na Coluna"
        },
        "conduta_sugerida": "Exercícios de flexão lombar (Prayer stretch, Child pose) para abrir o canal. Bicicleta estacionária é melhor tolerada que esteira.",
        "dosagem": "3x semana."
      },
      {
        "categoria": "Gestão de Caminhada",
        "tipo": "Caminhada Intervalada / Inclinada",
        "fonte_referencia": "Consenso Clínico",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível B",
          "tamanho_efeito": "Melhora da Distância Percorrida"
        },
        "visualizacao_paciente": {
          "confianca": 4,
          "potencia": 4,
          "cor": "green",
          "texto_amigavel": "Aumentar Resistência"
        },
        "conduta_sugerida": "Caminhar em esteira inclinada (subida) favorece a flexão do tronco e reduz sintomas. Caminhada intervalada (para antes da dor aparecer).",
        "dosagem": "Diariamente."
      }
    ]'::jsonb,
    false,
    true
);

-- 3. Cervical Radiculopathy (Radiculopatia Cervical)
INSERT INTO clinical_protocols (title, region, description, evidence_sources, interventions, is_custom, is_active)
VALUES (
    'Radiculopatia Cervical (Hérnia de Disco Cervical)',
    'Coluna Cervical',
    'Dor irradiada para o braço, com ou sem déficit motor. O Cluster de Wainner ajuda no diagnóstico.',
    '[
      {
        "titulo": "Neck Pain: Clinical Practice Guidelines (Revision 2017)",
        "autor": "Blanpied PR et al. (JOSPT)",
        "ano": "2017",
        "doi_link": "https://www.jospt.org/doi/10.2519/jospt.2017.0302",
        "nivel_evidencia": "Diretriz Clínica (CPG)",
        "status": "Ativo"
      }
    ]'::jsonb,
    '[
      {
        "categoria": "Modalidade Mecânica",
        "tipo": "Tração Cervical Intermitente",
        "fonte_referencia": "JOSPT 2017",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível B (Moderado)",
          "tamanho_efeito": "Eficaz quando combinado com exercício"
        },
        "visualizacao_paciente": {
          "confianca": 4,
          "potencia": 5,
          "cor": "green",
          "texto_amigavel": "Alívio da Compressão"
        },
        "conduta_sugerida": "Tração mecânica ou manual intermitente. Único subgrupo cervical onde a tração é fortemente recomendada pelas diretrizes.",
        "dosagem": "Combinado com terapia manual e exercício."
      },
      {
        "categoria": "Exercício Terapêutico",
        "tipo": "Fortalecimento Profundo e Neurodinâmica",
        "fonte_referencia": "JOSPT 2017",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível A",
          "tamanho_efeito": "Manutenção dos Ganhos"
        },
        "visualizacao_paciente": {
          "confianca": 5,
          "potencia": 5,
          "cor": "green",
          "texto_amigavel": "Estabilidade"
        },
        "conduta_sugerida": "Fortalecimento dos flexores profundos do pescoço e deslizamento neural do nervo mediano/ulnar/radial conforme sintomas.",
        "dosagem": "Diariamente."
      }
    ]'::jsonb,
    false,
    true
);
