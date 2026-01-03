-- Seed Data for Women's Health Protocols
-- Based on User Request Step Id: 1180
-- FIX: Using JSONB for evidence_sources instead of text[]

insert into clinical_protocols (title, region, evidence_sources, description, interventions, is_custom, is_active)
values 
(
    'Incontinência Urinária de Esforço (IUE)',
    'Pélvica / Saúde da Mulher',
    '[
      {
        "titulo": "Pelvic floor muscle training for urinary incontinence in women",
        "autor": "Dumoulin C et al. (Cochrane Review)",
        "ano": "2018",
        "status": "Ativo"
      },
      {
        "titulo": "NICE Guideline [NG123]: Urinary incontinence and pelvic organ prolapse in women",
        "autor": "NICE UK",
        "ano": "2019",
        "status": "Ativo"
      }
    ]'::jsonb,
    'Perda involuntária de urina ao tossir, espirrar ou exercitar-se. Falha no mecanismo de fechamento uretral. (Ref: SUI_FEMALE_01)',
    '[
      {
        "categoria": "Exercício Terapêutico",
        "tipo": "Treinamento Muscular do Assoalho Pélvico (TMAP/Kegel)",
        "fonte_referencia": "Cochrane 2018 / NICE NG123",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível A (Padrão Ouro)",
          "tamanho_efeito": "SMD > 1.0 (Cura ou Melhora Significativa)"
        },
        "visualizacao_paciente": {
          "confianca": 5,
          "potencia": 5,
          "cor": "green",
          "texto_amigavel": "A Cura sem Cirurgia"
        },
        "conduta_sugerida": "Protocolo de hipertrofia e coordenação. Contrações sustentadas (fibras lentas) e rápidas (fibras rápidas - ''The Knack'' antes do esforço).",
        "dosagem": "3 séries de 8-12 contrações, 3x ao dia. Mínimo 12 semanas supervisionado."
      },
      {
        "categoria": "Biofeedback / Eletroestimulação",
        "tipo": "Biofeedback Eletromiográfico",
        "fonte_referencia": "NICE NG123",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível B (Coadjuvante)",
          "tamanho_efeito": "Útil para aprendizado motor"
        },
        "visualizacao_paciente": {
          "confianca": 4,
          "potencia": 4,
          "cor": "green",
          "texto_amigavel": "Ensinar o Músculo"
        },
        "conduta_sugerida": "Indicado para pacientes que não conseguem contrair corretamente sozinhas (propriocepção baixa). Não é superior ao exercício isolado se a paciente já sabe contrair.",
        "dosagem": "Nas sessões presenciais."
      }
    ]'::jsonb,
    false,
    true
),
(
    'Bexiga Hiperativa / Incontinência de Urgência',
    'Pélvica / Saúde da Mulher',
    '[
      {
        "titulo": "Conservative treatment for overactive bladder in women (Cochrane)",
        "autor": "Rai BP et al.",
        "ano": "2022",
        "status": "Ativo"
      }
    ]'::jsonb,
    'Vontade súbita e incontrolável de urinar. Problema de ''software'' (nervo/músculo detrusor), não de força. (Ref: OAB_URGE_01)',
    '[
      {
        "categoria": "Comportamental",
        "tipo": "Treinamento Vesical (Bladder Training)",
        "fonte_referencia": "Cochrane 2022",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível A",
          "tamanho_efeito": "SMD 0.7"
        },
        "visualizacao_paciente": {
          "confianca": 5,
          "potencia": 5,
          "cor": "green",
          "texto_amigavel": "Reeducar a Bexiga"
        },
        "conduta_sugerida": "Aumentar progressivamente o intervalo entre as micções. Técnicas de inibição da urgência (contrair períneo, distrair mente, não correr para o banheiro).",
        "dosagem": "Diariamente (Diário Miccional)."
      },
      {
        "categoria": "Eletroterapia",
        "tipo": "Neuromodulação do Nervo Tibial Posterior (TENS)",
        "fonte_referencia": "Revisões Sistemáticas",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível A (Eficaz)",
          "tamanho_efeito": "Comparável a medicação, sem efeitos colaterais"
        },
        "visualizacao_paciente": {
          "confianca": 5,
          "potencia": 5,
          "cor": "green",
          "texto_amigavel": "Acalmar o Nervo"
        },
        "conduta_sugerida": "Eletroestimulação no tornozelo (nervo tibial) para modular o plexo sacral e acalmar o detrusor.",
        "dosagem": "1-2x semana por 12 semanas."
      }
    ]'::jsonb,
    false,
    true
),
(
    'Dor Pélvica na Gestação (Cintura Pélvica)',
    'Gestante',
    '[
      {
        "titulo": "European guidelines for the diagnosis and treatment of pelvic girdle pain",
        "autor": "Vleeming A et al. (Eur Spine J)",
        "ano": "2008 (Revalidado 2020)",
        "status": "Ativo"
      }
    ]'::jsonb,
    'Dor na sínfise púbica ou articulação sacroilíaca. Relacionada à instabilidade e alterações hormonais (relaxina). (Ref: PREGNANCY_PGP_01)',
    '[
      {
        "categoria": "Suporte e Estabilidade",
        "tipo": "Cinta Pélvica e Travesseiros",
        "fonte_referencia": "European Guidelines",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível B",
          "tamanho_efeito": "Alívio Funcional"
        },
        "visualizacao_paciente": {
          "confianca": 5,
          "potencia": 4,
          "cor": "green",
          "texto_amigavel": "Estabilidade Externa"
        },
        "conduta_sugerida": "Uso de cinto pélvico (trocantérico) para fechar a articulação sacroilíaca durante caminhada. Dormir com travesseiro entre as pernas.",
        "dosagem": "Durante atividades de carga."
      },
      {
        "categoria": "Exercício Terapêutico",
        "tipo": "Estabilização Lombopélvica (Core)",
        "fonte_referencia": "Cochrane Pregnancy",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível B",
          "tamanho_efeito": "Redução da progressão da dor"
        },
        "visualizacao_paciente": {
          "confianca": 4,
          "potencia": 4,
          "cor": "green",
          "texto_amigavel": "Força Segura"
        },
        "conduta_sugerida": "Ativação de glúteo médio e transverso abdominal. Evitar movimentos de cisalhamento (ficar num pé só, abdução excessiva).",
        "dosagem": "Diariamente, baixa intensidade."
      }
    ]'::jsonb,
    false,
    true
),
(
    'Diástase Abdominal (Pós-Parto)',
    'Pós-Parto',
    '[
      {
        "titulo": "Physiotherapy for prevention and treatment of postpartum diastasis recti",
        "autor": "Gluppe et al. (Physiotherapy)",
        "ano": "2018",
        "status": "Ativo"
      }
    ]'::jsonb,
    'Afastamento dos retos abdominais. O foco moderno não é apenas ''fechar o buraco'', mas gerar tensão funcional na Linha Alba. (Ref: DIASTASIS_RECTI_01)',
    '[
      {
        "categoria": "Exercício Terapêutico",
        "tipo": "Ativação de Transverso (Tensão da Linha Alba)",
        "fonte_referencia": "Gluppe 2018 / Munoz 2021",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível B",
          "tamanho_efeito": "Melhora Funcional"
        },
        "visualizacao_paciente": {
          "confianca": 4,
          "potencia": 5,
          "cor": "green",
          "texto_amigavel": "Recuperar a Barriga"
        },
        "conduta_sugerida": "Pré-contração do Transverso Abdominal antes de movimentos de flexão. O objetivo é evitar o ''doming'' (abaulamento) durante o esforço.",
        "dosagem": "Progressivo."
      },
      {
        "categoria": "Estética / Eletro",
        "tipo": "Ultrassom Estético / Radiofrequência",
        "fonte_referencia": "Evidência Limitada",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível C (Fraca para função muscular)",
          "tamanho_efeito": "Efeito na pele/flacidez apenas"
        },
        "visualizacao_paciente": {
          "confianca": 3,
          "potencia": 2,
          "cor": "yellow",
          "texto_amigavel": "Ajuda na Pele (Não no Músculo)"
        },
        "conduta_sugerida": "Pode ajudar na flacidez de pele (tissular), mas não corrige a diástase muscular. Usar como complemento, não tratamento principal.",
        "dosagem": "Opcional."
      }
    ]'::jsonb,
    false,
    true
);
