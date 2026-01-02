-- Migration to add detailed Ankle and Foot Protocols (Sprain, Plantar Fasciitis, Achilles, Metatarsalgia, Morton)
-- Depends on 20260102150000_update_sources_schema.sql having run (evidence_sources is JSONB)

-- 1. Ankle Sprain (Entorse Lateral)
INSERT INTO clinical_protocols (title, region, description, evidence_sources, interventions, is_custom, is_active)
VALUES (
    'Entorse Lateral de Tornozelo (Aguda e Instabilidade Crônica)',
    'Tornozelo e Pé',
    'O tratamento precoce focado em carga protegida e treino neuromuscular previne a instabilidade crônica (CAI).',
    '[
      {
        "titulo": "Ankle Stability and Movement Coordination Impairments (CPG Revision 2021)",
        "autor": "Martin RL et al. (JOSPT)",
        "ano": "2021",
        "doi_link": "https://www.jospt.org/doi/10.2519/jospt.2021.0302",
        "nivel_evidencia": "Diretriz Clínica (CPG)",
        "status": "Ativo"
      }
    ]'::jsonb,
    '[
      {
        "categoria": "Exercício Terapêutico",
        "tipo": "Treino Neuromuscular e Propriocepção",
        "fonte_referencia": "JOSPT 2021",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível A (Forte)",
          "tamanho_efeito": "SMD > 0.7 (Redução de Recorrência)"
        },
        "visualizacao_paciente": {
          "confianca": 5,
          "potencia": 5,
          "cor": "green",
          "texto_amigavel": "Vacina contra Recorrência"
        },
        "conduta_sugerida": "Exercícios de equilíbrio unipodal (olhos abertos/fechados) e pliometria controlada.",
        "dosagem": "3x por semana (Início imediato tolerado)."
      },
      {
        "categoria": "Terapia Manual",
        "tipo": "Mobilização Talocrural (Mulligan/Maitland)",
        "fonte_referencia": "JOSPT 2021",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível A",
          "tamanho_efeito": "SMD 0.6 (Aumento de Dorsiflexão)"
        },
        "visualizacao_paciente": {
          "confianca": 5,
          "potencia": 4,
          "cor": "green",
          "texto_amigavel": "Desbloqueio Articular"
        },
        "conduta_sugerida": "Mobilização com movimento (MWM) para ganho de dorsiflexão, essencial para marcha normal.",
        "dosagem": "Sessões iniciais para ganho de ADM."
      },
      {
        "categoria": "Eletroterapia",
        "tipo": "Ultrassom",
        "fonte_referencia": "JOSPT 2021",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível A (Contraindicado)",
          "tamanho_efeito": "Ineficaz"
        },
        "visualizacao_paciente": {
          "confianca": 5,
          "potencia": 1,
          "cor": "red",
          "texto_amigavel": "Não Recomendado"
        },
        "conduta_sugerida": "Não deve ser utilizado para tratamento de entorses agudas ou crônicas.",
        "dosagem": "N/A"
      }
    ]'::jsonb,
    false,
    true
);

-- 2. Plantar Fasciitis (Fasciopatia Plantar)
INSERT INTO clinical_protocols (title, region, description, evidence_sources, interventions, is_custom, is_active)
VALUES (
    'Fasciopatia Plantar (Fascite)',
    'Tornozelo e Pé',
    'Dor matinal (''primeiro passo'') é o sinal clássico. Tratamento multimodal é superior a isolado.',
    '[
      {
        "titulo": "Heel Pain - Plantar Fasciitis: Revision 2023",
        "autor": "Martin RL et al. (JOSPT)",
        "ano": "2023",
        "doi_link": "https://www.jospt.org/doi/10.2519/jospt.2023.0303",
        "nivel_evidencia": "Diretriz Clínica (CPG)",
        "status": "Ativo"
      }
    ]'::jsonb,
    '[
      {
        "categoria": "Terapia Manual e Alongamento",
        "tipo": "Alongamento Específico da Fáscia e Panturrilha",
        "fonte_referencia": "JOSPT 2023",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível A",
          "tamanho_efeito": "SMD 0.8 (Alívio Curto/Médio Prazo)"
        },
        "visualizacao_paciente": {
          "confianca": 5,
          "potencia": 4,
          "cor": "green",
          "texto_amigavel": "Alívio Essencial"
        },
        "conduta_sugerida": "Alongamento da fáscia (dedos em extensão) e mobilização de tecidos moles.",
        "dosagem": "Diariamente (manhã e noite)."
      },
      {
        "categoria": "Órteses e Taping",
        "tipo": "Taping (Low-Dye) e Palmilhas",
        "fonte_referencia": "JOSPT 2023",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível A",
          "tamanho_efeito": "SMD 0.5 (Suporte de Arco)"
        },
        "visualizacao_paciente": {
          "confianca": 5,
          "potencia": 3,
          "cor": "green",
          "texto_amigavel": "Descanso para o Pé"
        },
        "conduta_sugerida": "Taping antipronação para alívio imediato (até 1 semana) e palmilhas para médio prazo.",
        "dosagem": "Uso durante atividades de carga."
      },
      {
        "categoria": "Equipamento",
        "tipo": "Night Splints (Órtese Noturna)",
        "fonte_referencia": "JOSPT 2023",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível A (Para dor persistente)",
          "tamanho_efeito": "Moderado"
        },
        "visualizacao_paciente": {
          "confianca": 5,
          "potencia": 3,
          "cor": "yellow",
          "texto_amigavel": "Para Dor Matinal Forte"
        },
        "conduta_sugerida": "Indicado se a dor ao levantar for o principal sintoma e persistir > 1 mês.",
        "dosagem": "Uso noturno por 1-3 meses."
      }
    ]'::jsonb,
    false,
    true
);

-- 3. Achilles Tendinopathy (Tendinopatia de Aquiles)
INSERT INTO clinical_protocols (title, region, description, evidence_sources, interventions, is_custom, is_active)
VALUES (
    'Tendinopatia de Aquiles (Porção Média)',
    'Tornozelo e Pé',
    'Gestão de carga é a chave. Repouso total é prejudicial.',
    '[
      {
        "titulo": "Achilles Pain, Stiffness, and Muscle Power Deficits: Revision 2018 (Valid for 2024)",
        "autor": "Martin RL et al. (JOSPT)",
        "ano": "2018",
        "doi_link": "https://www.jospt.org/doi/10.2519/jospt.2018.0302",
        "nivel_evidencia": "Diretriz Clínica (CPG)",
        "status": "Ativo"
      }
    ]'::jsonb,
    '[
      {
        "categoria": "Exercício Terapêutico",
        "tipo": "Carga Mecânica (Excêntrico ou HSR)",
        "fonte_referencia": "JOSPT 2018 / Alfredson Protocol",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível A (Ouro)",
          "tamanho_efeito": "SMD > 1.0 (Remodelagem)"
        },
        "visualizacao_paciente": {
          "confianca": 5,
          "potencia": 5,
          "cor": "green",
          "texto_amigavel": "Único que Cura"
        },
        "conduta_sugerida": "Protocolo de Alfredson (Excêntrico) ou Heavy Slow Resistance. A dor durante o exercício (até 5/10) é aceitável e necessária.",
        "dosagem": "3 séries de 15 reps (2x ao dia para Alfredson) ou 3x semana (HSR)."
      }
    ]'::jsonb,
    false,
    true
);

-- 4. Metatarsalgia (Mecânica)
INSERT INTO clinical_protocols (title, region, description, evidence_sources, interventions, is_custom, is_active)
VALUES (
    'Metatarsalgia Mecânica (Sobrecarga)',
    'Tornozelo e Pé',
    'Dor sob a ''bola do pé''. Geralmente associada a queda do arco transverso ou encurtamento de gastrocnêmio.',
    '[
      {
        "titulo": "Gastrocnemius release procedures in the treatment of mechanical metatarsalgia: a systematic review",
        "autor": "Mazzotti et al.",
        "ano": "2025",
        "doi_link": "https://doi.org/10.1007/s00402-025-06043-z",
        "nivel_evidencia": "Revisão Sistemática",
        "status": "Ativo"
      }
    ]'::jsonb,
    '[
      {
        "categoria": "Gestão de Carga e Calçado",
        "tipo": "Barra Metatarsal e Calçado com Rocker",
        "fonte_referencia": "Consenso Clínico / Revisões",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível B (Moderado)",
          "tamanho_efeito": "Alívio Mecânico Imediato"
        },
        "visualizacao_paciente": {
          "confianca": 4,
          "potencia": 4,
          "cor": "green",
          "texto_amigavel": "Alívio de Pressão"
        },
        "conduta_sugerida": "Uso de ''Metatarsal Pad'' (domo) logo atrás das cabeças dos metatarsos para elevar o arco transverso. Calçados com solado rígido (Rocker Bottom).",
        "dosagem": "Uso diário."
      },
      {
        "categoria": "Exercício Terapêutico",
        "tipo": "Alongamento da Cadeia Posterior",
        "fonte_referencia": "Mazzotti 2025",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível B",
          "tamanho_efeito": "Moderado"
        },
        "visualizacao_paciente": {
          "confianca": 4,
          "potencia": 3,
          "cor": "green",
          "texto_amigavel": "Redução de Carga"
        },
        "conduta_sugerida": "O encurtamento de Gastrocnêmio aumenta a pressão no antepé. Alongamento agressivo de panturrilha.",
        "dosagem": "3x30s diariamente."
      }
    ]'::jsonb,
    false,
    true
);

-- 5. Morton's Neuroma (Neuroma de Morton)
INSERT INTO clinical_protocols (title, region, description, evidence_sources, interventions, is_custom, is_active)
VALUES (
    'Neuroma de Morton',
    'Tornozelo e Pé',
    'Compressão do nervo interdigital (geralmente 3º espaço). Calçados apertados são a causa primária.',
    '[
      {
        "titulo": "Non-surgical treatments for Morton''s neuroma: A systematic review",
        "autor": "Thomson CE et al.",
        "ano": "2020",
        "doi_link": "https://doi.org/10.1016/j.fas.2019.09.009",
        "nivel_evidencia": "Revisão Sistemática",
        "status": "Ativo"
      },
      {
        "titulo": "Treatments for Morton''s neuroma (Cochrane Review)",
        "autor": "Matthews BG et al.",
        "ano": "2021",
        "doi_link": "https://doi.org/10.1002/14651858.CD014687",
        "nivel_evidencia": "Revisão Cochrane",
        "status": "Ativo"
      }
    ]'::jsonb,
    '[
      {
        "categoria": "Modificação de Calçado",
        "tipo": "Toe Box Amplo (Espaço para Dedos)",
        "fonte_referencia": "Thomson 2020",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível B",
          "tamanho_efeito": "Moderado (Primeira Linha)"
        },
        "visualizacao_paciente": {
          "confianca": 4,
          "potencia": 4,
          "cor": "green",
          "texto_amigavel": "Descompressão Essencial"
        },
        "conduta_sugerida": "Trocar calçados de bico fino por bico largo (Wide Toe Box) e drop baixo. Uso de separadores de dedos pode ajudar.",
        "dosagem": "Permanente."
      },
      {
        "categoria": "Procedimento Médico",
        "tipo": "Injeção de Corticoide",
        "fonte_referencia": "Cochrane 2021",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível B (Curto Prazo)",
          "tamanho_efeito": "SMD > 0.6 (Alívio de Dor)"
        },
        "visualizacao_paciente": {
          "confianca": 4,
          "potencia": 4,
          "cor": "yellow",
          "texto_amigavel": "Opção se Falhar Conservador"
        },
        "conduta_sugerida": "Se a mudança de calçado e fisioterapia não resolverem em 6-8 semanas, considerar encaminhamento para infiltração.",
        "dosagem": "Avaliação médica."
      }
    ]'::jsonb,
    false,
    true
);
