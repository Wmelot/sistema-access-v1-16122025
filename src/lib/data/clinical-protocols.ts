
export const CLINICAL_PROTOCOLS = [
    {
        "id": "LBP_CHRONIC_01",
        "patologia": "Dor Lombar Crônica (Não Específica)",
        "regiao": "Coluna Lombar",
        "ultima_atualizacao": "2025-01-31",
        "base_conhecimento": [
            {
                "titulo": "Interventions for the Management of Acute and Chronic Low Back Pain: Revision 2021",
                "tipo_estudo": "Diretriz Clínica (CPG)",
                "autor": "George SZ et al. (JOSPT)",
                "ano": "2021",
                "nota_qualidade": "A (Ouro)",
                "doi_link": "https://www.jospt.org/doi/10.2519/jospt.2021.0304",
                "resumo_educativo": "Foco em intervenções não farmacológicas. Recomenda fortemente o exercício e a educação, desencorajando o uso isolado de terapias passivas e exames de imagem desnecessários.",
                "pontos_chave": [
                    "Exercício Aeróbico e de Resiliência: Recomendação A",
                    "PNE (Educação em Neurociência da Dor): Recomendação A para redução de cinesiofobia",
                    "Tratamento Baseado em Classificação (TBC) melhora resultados funcionais"
                ]
            },
            {
                "titulo": "Exercise therapy for chronic non-specific low back pain",
                "tipo_estudo": "Revisão Sistemática Cochrane",
                "autor": "Hayden JA et al.",
                "ano": "2021",
                "nota_qualidade": "Qualidade Moderada/Alta",
                "doi_link": "https://doi.org/10.1002/14651858.CD000335.pub3",
                "resumo_educativo": "O exercício é provavelmente eficaz para dor crônica. Reduz a dor em média 15.2 pontos (escala 0-100) em comparação ao cuidado usual.",
                "pontos_chave": [
                    "SMD (Diferença Média Padronizada) para dor: 0.52 (curto prazo)",
                    "Tipos mais eficazes: Pilates, McKenzie e Restauração Funcional",
                    "Incentivar a autogestão e adesão a longo prazo"
                ],
                "analise_antispin": "Embora os autores enfatizem o exercício, o efeito na função (6.8/100) é menor que na dor, sugerindo que o exercício ajuda mais na dessensibilização do que na mecânica funcional per se."
            },
            {
                "titulo": "Low back pain and sciatica in over 16s: assessment and management (NG59)",
                "tipo_estudo": "Diretriz Clínica (NICE)",
                "autor": "NICE (UK)",
                "ano": "2020",
                "nota_qualidade": "Padrão Ouro Europeu",
                "doi_link": "https://www.nice.org.uk/guidance/ng59",
                "resumo_educativo": "Recomenda uma abordagem estratificada de risco. Fortemente contra tração, cintas, palmilhas e ultrassom para dor lombar.",
                "pontos_chave": [
                    "Considerar programas de exercícios em grupo (biomecânico, aeróbico ou mind-body)",
                    "Terapia manual apenas se combinada com exercícios",
                    "Não oferecer acupuntura para dor lombar"
                ]
            },
            {
                "titulo": "Low back pain: a call for action (The Lancet Series)",
                "tipo_estudo": "Série de Revisões",
                "autor": "Buchbinder R et al.",
                "ano": "2018",
                "nota_qualidade": "Impacto Global Altíssimo",
                "doi_link": "https://doi.org/10.1016/S0140-6736(18)30488-4",
                "resumo_educativo": "Alerta sobre o uso massivo de tratamentos de baixo valor (imagem, opioides, cirurgia). O foco deve ser no modelo biopsicossocial.",
                "pontos_chave": [
                    "A dor lombar é a principal causa de incapacidade no mundo",
                    "Fatores psicológicos (distress, crenças) são preditores de cronicidade",
                    "A prevenção primária foca em exercício e educação"
                ]
            },
            {
                "titulo": "Cognitive functional therapy for chronic low back pain (RESTORE Trial)",
                "tipo_estudo": "Ensaio Clínico Randomizado (RCT)",
                "autor": "O'Sullivan PB et al. (The Lancet)",
                "ano": "2023",
                "nota_qualidade": "PEDro 9/10 (Excelência)",
                "doi_link": "https://doi.org/10.1016/S0140-6736(23)00441-X",
                "resumo_educativo": "A Terapia Funcional Cognitiva (CFT) produziu melhoras clínicas grandes e sustentadas (1 ano) comparado ao cuidado usual.",
                "pontos_chave": [
                    "Redução significativa na incapacidade funcional e intensidade da dor",
                    "Altamente custo-efetiva (economia de tempo e recursos)",
                    "Foco na mudança de comportamento e exposição ao movimento"
                ]
            }
        ],
        "resumo_clinico": "Condição complexa e multifatorial (>12 semanas). A persistência da dor está mais ligada à sensibilização do sistema nervoso central e fatores biopsicossociais do que a danos estruturais detectáveis por imagem.",
        "diagnostico": {
            "testes_recomendados": [
                "Triagem de 'Red Flags' (Cauda Equina, Fratura, Neoplasia): IFOMPT Framework",
                "Straight Leg Raise (SLR): Alta sensibilidade (91%) para excluir compressão radicular",
                "Slump Test: Alta especificidade (83%) para tensão neural",
                "Prone Instability Test: Para identificar subgrupo de estabilização"
            ],
            "questionarios": [
                "Oswestry Disability Index (ODI): Avalia incapacidade funcional",
                "Roland-Morris Questionnaire: Alternativa rápida para incapacidade",
                "STarT Back Tool: Triagem de risco prognóstico (Baixo, Médio, Alto risco)",
                "Tampa Scale for Kinesiofobia (TSK): Mede medo do movimento"
            ]
        },
        "prognostico": {
            "fatores_risco_cronificacao": [
                "Yellow Flags: Catastrofização, medo-evitação (FABQ), depressão e ansiedade",
                "Expectativas negativas sobre a recuperação",
                "Blue Flags: Baixo suporte social no trabalho",
                "Black Flags: Questões trabalhistas/legais e isolamento social"
            ],
            "expectativa_recuperacao": "A dor lombar crônica tende a flutuar. O objetivo é a gestão da carga e função. Reduções de 30% na dor são consideradas sucesso clínico moderado."
        },
        "contraindicacoes": "EVITAR: Repouso no leito > 48h (Grau A), uso de órteses lombares de rotina, e exames de imagem rotineiros em ausência de Red Flags (Iatrogenia diagnóstica).",
        "intervencoes": [
            {
                "categoria": "Exercício Terapêutico",
                "nivel_evidencia": "Nível A (Forte)",
                "recomendacao": "MUST",
                "tipo": "Fortalecimento Global e Pilates",
                "descricao": "Abordagem ativa focada em tolerância à carga e redução do medo do movimento.",
                "conduta_sugerida": "Progressão: Isometria -> Carga de Resistência -> Atividades de Impacto/Funcionais. Focar na autonomia do paciente.",
                "tamanho_efeito": "Redução média de 15/100 pontos em dor. NNT = 4 (Clinicamente relevante).",
                "dosagem": {
                    "frequencia": "2-3x semana",
                    "intensidade": "70% 1RM (Fadiga controlada)",
                    "sets": "3 x 12"
                }
            },
            {
                "categoria": "Educação em Dor",
                "nivel_evidencia": "Nível A (Forte)",
                "recomendacao": "MUST",
                "tipo": "Explain Pain / PNE",
                "descricao": "Intervenção cognitiva para mudar a percepção da dor como 'ameaça'.",
                "conduta_sugerida": "Utilizar metáforas sobre o sistema de segurança do cérebro. Mostrar que tecido cicatrizado é forte.",
                "tamanho_efeito": "Efeito moderado na dor (ES: 0.4) e alto na cinesiofobia (ES: 0.65).",
                "dosagem": { "frequencia": "Sessão inicial de 40min + reforços breves." }
            },
            {
                "categoria": "Terapia Manual",
                "nivel_evidencia": "Nível B (Moderado)",
                "recomendacao": "CAN",
                "tipo": "Mobilização e Manipulação Vertebral",
                "descricao": "Técnicas manuais para modulação de sintomas a curto prazo.",
                "conduta_sugerida": "Utilizar APENAS para abrir 'janela terapêutica' para o exercício. Não usar como tratamento isolado.",
                "tamanho_efeito": "Efeito moderado a curto prazo (1-4 semanas). Sem benefício superior a longo prazo isoladamente."
            },
            {
                "categoria": "Eletroterapia Passiva",
                "nivel_evidencia": "Nível D/F (Fraco/Contraindicado)",
                "recomendacao": "NOT",
                "tipo": "Ultrassom, TENS isolado, Laser",
                "descricao": "Modalidades puramente passivas sem componente ativo.",
                "conduta_sugerida": "EVITAR. Desencorajado pela diretriz NICE e JOSPT. Aumenta a dependência e reforça modelo biomédico de cura externa.",
                "tamanho_efeito": "Efeito não superior ao placebo em estudos de alta qualidade."
            },
            {
                "categoria": "Órteses Podais (Palmilhas)",
                "nivel_evidencia": "Nível C (Baixo/Especifico)",
                "recomendacao": "CAN",
                "tipo": "Palmilhas de Compensação / Termomoldagem",
                "descricao": "Uso em pacientes com Discrepância de Comprimento de Membros (LLD) ou pronação excessiva associada.",
                "conduta_sugerida": "Compensação de LLD > 1cm com palmilha interna ou elevação externa conforme avaliação biomecânica. Meta-análise 2023 indica melhora funcional em subgrupos específicos.",
                "tamanho_efeito": "Redução clinicamente relevante para dor e incapacidade se houver desequilíbrio postural ascendente."
            },
            {
                "categoria": "Intervenções Acessórias",
                "nivel_evidencia": "Nível D (Fraco)",
                "recomendacao": "NOT",
                "tipo": "Ventosaterapia (Cupping) e Kinesiotaping",
                "descricao": "Técnicas de aplicação superficial com baixa plausibilidade biológica para dor crônica.",
                "conduta_sugerida": "NÃO RECOMENDADO como parte do plano de cuidados principal. Pode gerar efeito placebo temporário mas não altera o prognóstico.",
                "tamanho_efeito": "Inexistente ou clinicamente irrelevante em revisões sistemáticas (Cochrane)."
            },
            {
                "categoria": "Técnicas Invasivas",
                "nivel_evidencia": "Nível C (Fraco)",
                "recomendacao": "CAN",
                "tipo": "Dry Needling",
                "descricao": "Agulhamento a seco para pontos gatilho miofasciais.",
                "conduta_sugerida": "Pode ser usado como adjuvante para alívio de dor localizada, sempre acompanhado de exercício ativo.",
                "tamanho_efeito": "Baixo a moderado para dor no curto prazo."
            }
        ]
    },
    {
        "id": "NP_MEC_01",
        "patologia": "Cervicalgia Mecânica (Déficit de Mobilidade)",
        "regiao": "Coluna Cervical",
        "ultima_atualizacao": "2025-01-20",
        "base_conhecimento": [
            {
                "titulo": "Neck Pain: Clinical Practice Guidelines",
                "tipo_estudo": "Diretriz Clínica (CPG)",
                "autor": "Blanpied PR et al. (JOSPT)",
                "ano": "2017",
                "nota_qualidade": "Nível A",
                "doi_link": "https://www.jospt.org/doi/10.2519/jospt.2017.0302",
                "resumo_educativo": "Recomenda multimodalidade: Manipulação torácica e cervical combinada com exercícios de flexores profundos.",
                "pontos_chave": [
                    "Manipulação tem efeito analgésico imediato superior ao alongamento",
                    "Fortalecimento escapular é fundamental para evitar recidiva",
                    "Acurácia diagnóstica foca em restrição de movimento e dor referida"
                ]
            },
            {
                "titulo": "Exercise and components of exercise for patients with non-specific neck pain",
                "tipo_estudo": "Revisão Sistemática Cochrane",
                "autor": "Gross A et al.",
                "ano": "2015",
                "nota_qualidade": "Qualidade Alta",
                "doi_link": "https://doi.org/10.1002/14651858.CD004250.pub5",
                "resumo_educativo": "O uso de exercícios de força e resistência para a região cervico-escapular reduz a dor no curto e longo prazo.",
                "pontos_chave": [
                    "Exercícios de flexores profundos são mais eficazes que o cuidado mínimo",
                    "A evidência para alongamento isolado é fraca",
                    "Combinar força com mobilização melhora os resultados"
                ]
            }
        ],
        "resumo_clinico": "Condição caracterizada por restrição de mobilidade e dor mecânica. A restauração da função cervical depende da integração entre mobilidade articular e resistência muscular profunda.",
        "diagnostico": {
            "testes_recomendados": [
                "Cervical Rotation Lateral Flexion (CRLF): P/ restrição de 1ª costela",
                "Cervical Flexion Rotation Test (CFRT): Alta acurácia p/ disfunção C1-C2",
                "Cranial Cervical Flexion Test (CCFT): Avalia resistência de flexores profundos",
                "Spurling Test: Alta especificidade p/ radiculopatia (regra de exclusão)"
            ],
            "questionarios": [
                "Neck Disability Index (NDI): Principal ferramenta de incapacidade",
                "Visual Analogue Scale (VAS): Intensidade da dor",
                "Patient-Specific Functional Scale (PSFS)"
            ]
        },
        "prognostico": {
            "fatores_risco_cronificacao": [
                "Alta pontuação inicial no NDI (>15/50)",
                "Catastrofização e hiperalgesia ao frio",
                "Histórico de traumatismo (Whiplash) com altos níveis de estresse pós-traumático"
            ],
            "expectativa_recuperacao": "A maioria das cervicalgias mecânicas melhora significativamente em 4 a 6 semanas com foco em mobilidade e força."
        },
        "contraindicacoes": "EVITAR: Manipulação de alta velocidade em pacientes com suspeita de insuficiência vertebrobasilar ou instabilidade ligamentar (Teste de Sharp-Purser negativo é obrigatório).",
        "intervencoes": [
            {
                "categoria": "Terapia Manual",
                "nivel_evidencia": "Nível B (Moderado/Forte)",
                "recomendacao": "MUST",
                "tipo": "Mobilização Cervical e Manipulação Torácica",
                "descricao": "Uso de técnicas neurofisiológicas para redução imediata da dor e ganho de ADM.",
                "conduta_sugerida": "Manipulação torácica superior provou reduzir dor cervical mecânica imediatamente. Maitland (Graus III e IV) ou Mulligan (SNAGs).",
                "tamanho_efeito": "Melhora imediata de 1.5 a 2 pontos na escala de dor. Efeito neurofisiológico de curta duração.",
                "dosagem": { "frequencia": "1-2x semana nas fases agudas" }
            },
            {
                "categoria": "Exercício Terapêutico",
                "nivel_evidencia": "Nível A (Forte)",
                "recomendacao": "MUST",
                "tipo": "Fortalecimento Cervico-Escapular e Flexores Profundos",
                "descricao": "Essencial para estabilidade e redução de recidiva.",
                "conduta_sugerida": "Ativação de flexores profundos (CCF Test) e fortalecimento de trapézio médio/inferior e serrátil.",
                "tamanho_efeito": "Redução superior de dor a longo prazo comparado a alongamento isolado.",
                "dosagem": { "volume": "3 séries de 15-20 (Resistência)" }
            },
            {
                "categoria": "Técnicas Invasivas",
                "nivel_evidencia": "Nível B",
                "recomendacao": "CAN",
                "tipo": "Dry Needling (Agulhamento Seco)",
                "descricao": "Tratamento de pontos gatilho miofasciais ativos nos trapézios e elevadores da escápula.",
                "conduta_sugerida": "Combinar SEMPRE com exercícios ativos. O efeito é principalmente na redução do limiar de dor à pressão.",
                "tamanho_efeito": "Efeito positivo no curto prazo (até 12 semanas) mas não altera a biomecânica isoladamente."
            },
            {
                "categoria": "Órteses Podais (Palmilhas)",
                "nivel_evidencia": "Nível C (Específico)",
                "recomendacao": "CAN",
                "tipo": "Elementos de Posturologia (Palmilhas Posturais)",
                "descricao": "Uso de estímulos podocutâneos para influenciar a cadeia tônica postural em cervicalgias recalcitrantes.",
                "conduta_sugerida": "Avaliar se há entrada sensorial podal perturbada (ex: pé plano/cavo severo) influenciando a inclinação anterior do tronco e cabeça. Uso de propionato de 1mm a 3mm para modulação tônica.",
                "tamanho_efeito": "Melhora na estabilidade postural e redução da tensão de trapézio superior em casos biomecânicos selecionados."
            }
        ]
    },
    {
        "id": "KOA_01",
        "patologia": "Osteoartrose de Joelho",
        "regiao": "Joelho",
        "ultima_atualizacao": "2025-01-20",
        "base_conhecimento": [
            {
                "titulo": "OARSI guidelines for non-surgical management of knee OA",
                "tipo_estudo": "Diretriz Clínica",
                "autor": "Bannuru RR et al. (OARSI)",
                "ano": "2019",
                "nota_qualidade": "A mais respeitada",
                "doi_link": "https://oarsi.org/research/guidelines-care",
                "resumo_educativo": "O 'Core Treatment' envolve exercício, controle de peso e educação. Outros tratamentos são acessórios.",
                "pontos_chave": [
                    "Exercício em água ou solo são recomendados igualmente",
                    "Redução de 5-10% do peso corporal altera a biomecânica da dor",
                    "Uso de AINEs deve ser criterioso e de curto prazo"
                ]
            },
            {
                "titulo": "Effectiveness of therapeutic exercise in knee osteoarthritis (STEPS Trial)",
                "tipo_estudo": "Ensaio Clínico Randomizado (RCT)",
                "autor": "Bennell KL et al.",
                "ano": "2014",
                "nota_qualidade": "PEDro 8/10",
                "doi_link": "https://doi.org/10.1136/annrheumdis-2013-204510",
                "resumo_educativo": "Confirmou que o fortalecimento de quadril e joelho reduz a dor de forma superior ao placebo educativo.",
                "pontos_chave": [
                    "Adesão ao exercício em casa é fundamental para manter ganhos",
                    "A dor durante o exercício (<3/10) é aceitável",
                    "O efeito wash-out ocorre se o exercício for interrompido"
                ]
            }
        ],
        "resumo_clinico": "Processo degenerativo articular crônico. O foco da fisioterapia é aumentar a capacidade de suporte de carga das estruturas periarticulares e reduzir a inflamação de baixo grau.",
        "diagnostico": {
            "testes_recomendados": [
                "Critérios do ACR (Dor + Crepitação + Rigidez matinal < 30min)",
                "Baropodometria Dinâmica: Identificar picos de pressão e desvio de centro de gravidade",
                "Análise Biomecânica de Marcha: Avaliar ângulo de progressão do pé e 'Knee Adduction Moment'",
                "Stroke Test: Para avaliação de derrame articular"
            ],
            "questionarios": [
                "WOMAC (Western Ontario and McMaster Universities Osteoarthritis Index)",
                "KOOS (Knee Injury and Osteoarthritis Outcome Score)",
                "VAS (Dor)"
            ]
        },
        "prognostico": {
            "fatores_risco_cronificacao": [
                "Obesidade (IMC > 30)",
                "Fraqueza grave de quadríceps",
                "Depressão e ansiedade (centralização da dor)",
                "Inatividade física persistente"
            ],
            "expectativa_recuperacao": "Condição crônica. O objetivo é o manejo de sintomas e preservação da articulação, evitando a prótese por 5-10 anos."
        },
        "contraindicacoes": "EVITAR: Exercícios de alto impacto em fases de crise inflamatória (exsudato evidente). NÃO prometer cura estrutural por meio de técnicas passivas.",
        "intervencoes": [
            {
                "categoria": "Exercício Terapêutico",
                "nivel_evidencia": "Nível A (Ouro)",
                "recomendacao": "MUST",
                "tipo": "Fortalecimento de Quadríceps e Glúteos",
                "descricao": "Padrão ouro de tratamento. Reduz drasticamente a necessidade de prótese se realizado precocemente.",
                "conduta_sugerida": "Agachamentos (ângulo de conforto), Leg Press e Cadeira Extensora (Isometria/Isotonia). Exercícios aeróbicos terrestres ou aquáticos.",
                "tamanho_efeito": "Redução média de 12 pontos em 100 na dor. Efeito comparável a AINEs mas sem riscos sistêmicos.",
                "dosagem": { "frequencia": "3x por semana (supervisionado)" }
            },
            {
                "categoria": "Órteses Podais (Palmilhas)",
                "nivel_evidencia": "Nível B (Sugerido)",
                "recomendacao": "CAN",
                "tipo": "Cunhas Laterais (Lateral Wedges)",
                "descricao": "Palmilhas com cunha lateral para reduzir o momento de adução do joelho (EKAM) em OA de compartimento medial.",
                "conduta_sugerida": "Utilizar cunhas de 3mm a 7mm. Recomendado para 'respondedores biomecânicos' com varo dinâmico. Age reduzindo a sobrecarga compressiva medial em ~5-6%.",
                "tamanho_efeito": "Melhora sintomática significativa (OARSI 2019), mas sem evidência de alteração estrutural a longo prazo."
            },
            {
                "categoria": "Gestão de Peso",
                "nivel_evidencia": "Nível A (Forte)",
                "recomendacao": "MUST",
                "tipo": "Educação Nutricional e Controle Metabólico",
                "descricao": "Redução da carga mecânica e inflamação sistêmica.",
                "conduta_sugerida": "Perda mínima de 5% a 10% do peso corporal.",
                "tamanho_efeito": "Correlação direta entre perda de peso e redução de dor. Altera a biomecânica articular.",
                "dosagem": { "meta": "Perda de 1-2kg/mês" }
            },
            {
                "categoria": "Infiltrações",
                "nivel_evidencia": "Nível C (Controverso)",
                "recomendacao": "NOT",
                "tipo": "Viscossuplementação de Rotina",
                "descricao": "Injeção de Ácido Hialurônico para lubrificação.",
                "conduta_sugerida": "NÃO RECOMENDADO de rotina pela AAOS/OARSI. Benefício clinicamente irrelevante a longo prazo em meta-análises independentes.",
                "tamanho_efeito": "Efeito próximo ao placebo (Spin Warning: estudos patrocinados tendem a superestimar o efeito)."
            }
        ]
    },

    {
        "id": "LCA_RECON_01",
        "patologia": "Reconstrução de Ligamento Cruzado Anterior (LCA)",
        "regiao": "Joelho",
        "ultima_atualizacao": "2025-01-20",
        "base_conhecimento": [
            {
                "titulo": "Clinical Practice Guidelines: Knee Ligament Sprains",
                "tipo_estudo": "Diretriz Clínica (CPG)",
                "autor": "Logerstedt DS et al. (JOSPT)",
                "ano": "2017",
                "nota_qualidade": "Nível A (Diretriz Padrão Ouro)",
                "doi_link": "https://www.jospt.org/doi/10.2519/jospt.2017.0303",
                "resumo_educativo": "O sucesso depende de critérios de progressão baseados em marcos clínicos e funcionais, não apenas no tempo cronológico.",
                "pontos_chave": [
                    "Ganho de extensão completa imediata é prioritário",
                    "NMES/FES é recomendado para superar a Inibição Muscular Artrogênica",
                    "Critérios de retorno ao esporte devem incluir LSI > 90% em força e saltos"
                ]
            },
            {
                "titulo": "Rehabilitation Practice Patterns for ACL Reconstruction (Delaware-Oslo)",
                "tipo_estudo": "Coorte Prospectiva",
                "autor": "Grindem H et al. (BJSM)",
                "ano": "2016",
                "nota_qualidade": "Alta Relevância Clínica",
                "doi_link": "https://bjsm.bmj.com/content/50/13/804",
                "resumo_educativo": "Atrasar o retorno ao esporte de pivô para 9 meses reduz o risco de nova lesão em 51% para cada mês de espera após o 6º mês.",
                "pontos_chave": [
                    "O tempo biológico de maturação do enxerto deve ser respeitado",
                    "Treino neuromuscular deve ser contínuo"
                ]
            },
            {
                "titulo": "2016 Best Practice Guide of ACL Rehabilitation",
                "tipo_estudo": "Consenso de Especialistas",
                "autor": "Randall Cooper et al. (BJSM)",
                "ano": "2016",
                "nota_qualidade": "Excelente Guia Prático",
                "doi_link": "https://doi.org/10.1136/bjsports-2016-096740",
                "resumo_educativo": "Enfatiza a importância de marcos funcionais (edema zero, ADM completa) antes da progressão de carga.",
                "pontos_chave": [
                    "Fase 1: Extensão zero e controle de efusão",
                    "Fase 2: Fortalecimento em CCA é seguro e necessário",
                    "Fase 3: Treino de agilidade deve ter feedback externo"
                ]
            }
        ],
        "resumo_clinico": "Reabilitação complexa que exige equilíbrio entre proteção do enxerto e ganho de força. A falha no RTS muitas vezes ocorre por déficit persistente de quadríceps (Inibição Muscular Artrogênica).",
        "diagnostico": {
            "testes_recomendados": [
                "Lachman Test (Padrão ouro - Sensibilidade 85%)",
                "Pivot Shift (Especificidade 98%)",
                "Avaliação de força isocinética (Déficit de quadríceps)",
                "Baropodometria: Avaliação de assimetria de carga (LSI - Limb Symmetry Index) na fase de apoio"
            ],
            "questionarios": [
                "IKDC 2000 (International Knee Documentation Committee)",
                "ACL-RSI (Prontidão Psicológica para retorno ao esporte)",
                "KOOS-ACL"
            ]
        },
        "prognostico": {
            "fatores_risco_cronificacao": [
                "Déficit de extensão nas primeiras 4 semanas (risco de artrofibrose)",
                "ACL-RSI baixo (<60): Forte preditor de não retorno ao esporte",
                "LSI de Quadríceps < 80% aos 6 meses"
            ],
            "expectativa_recuperacao": "Retorno ao esporte de pivô em 9-12 meses. Sucesso definido por LSI > 90% em força e saltos, com confiança subjetiva alta."
        },
        "contraindicacoes": "EVITAR: Retorno ao esporte baseado apenas no tempo cronológico (ex: voltar aos 6 meses sem testes funcionais). NÃO negligenciar o ganho de extensão completa.",
        "intervencoes": [
            {
                "categoria": "Avaliação e Prognóstico",
                "nivel_evidencia": "Nível A",
                "tipo": "Critérios de Progressão",
                "descricao": "Avaliação clínica rigorosa de edema, ADM e controle motor.",
                "conduta_sugerida": "Teste de Hop, Dinamometria de Quadríceps (LSI > 90%) e teste qualitativo de movimento.",
                "dosagem": {
                    "avaliação": "Marcos nas semanas 12, 24 e antes do retorno."
                },
                "prognostico": "Retorno ao esporte competitivo seguro entre 9 a 12 meses pós-operatório."
            },
            {
                "categoria": "Exercício Terapêutico",
                "nivel_evidencia": "Nível A",
                "tipo": "Cadeia Cinética Aberta (CCA)",
                "descricao": "Cadeira Extensora (Isotônico/Isométrico).",
                "conduta_sugerida": "Pode iniciar a partir da 4ª semana em angulação protegida (90º a 45º) para isolar quadríceps sem estresse excessivo no enxerto.",
                "dosagem": {
                    "frequencia": "3x por semana",
                    "intensidade": "70-80% 1RM"
                }
            },
            {
                "categoria": "Órteses Podais (Palmilhas)",
                "nivel_evidencia": "Nível B (Controle de Carga)",
                "recomendacao": "CAN",
                "tipo": "Palmilhas de Absorção de Impacto e Estabilidade",
                "descricao": "Uso de materiais com alto coeficiente de absorção para reduzir picos de carga durante a transição para pliometria.",
                "conduta_sugerida": "Indicado para pacientes com instabilidade rotacional residual ou receio de carga (kinesiofobia). Ajuda na propriocepção aferente e equilíbrio durante o LSI (Limb Symmetry Index).",
                "tamanho_efeito": "Facilitação do ganho de confiança na descarga de peso e redução do impacto articular."
            }
        ]
    },
    {
        "id": "PFPS_01",
        "patologia": "Dor Patelofemoral (Dor Anterior)",
        "regiao": "Joelho",
        "ultima_atualizacao": "2025-01-20",
        "base_conhecimento": [
            {
                "titulo": "Patellofemoral Pain: Clinical Practice Guidelines",
                "tipo_estudo": "Diretriz Clínica (CPG)",
                "autor": "Willy RW et al. (JOSPT)",
                "ano": "2019",
                "nota_qualidade": "Nível A",
                "doi_link": "https://www.jospt.org/doi/10.2519/jospt.2019.0302",
                "resumo_educativo": "Recomenda fortemente exercícios de fortalecimento de quadril e joelho para redução de dor e melhora funcional.",
                "pontos_chave": [
                    "Intervenção de fortalecimento proximal (quadril) é mais efetiva no curto prazo",
                    "Educação sobre gestão de carga é essencial",
                    "Palmilhas e Taping podem ser usados como coadjuvantes"
                ]
            },
            {
                "titulo": "Foot orthoses for patellofemoral pain: a Cochrane review",
                "tipo_estudo": "Revisão Sistemática Cochrane",
                "autor": "Hossain M et al.",
                "ano": "2011",
                "nota_qualidade": "Qualidade Moderada",
                "doi_link": "https://doi.org/10.1002/14651858.CD008402.pub2",
                "resumo_educativo": "Palmilhas podem reduzir a dor no curto prazo (até 6 semanas), mas não apresentam benefícios superiores no longo prazo comparado ao exercício.",
                "pontos_chave": [
                    "Utilizar palmilhas apenas em pacientes com pronação excessiva do pé",
                    "Exercício terapêutico continua sendo o tratamento de escolha preferencial"
                ]
            }
        ],
        "resumo_clinico": "Disfunção na interface patelofemoral. Frequentemente relacionada ao valgo dinâmico e déficit de força dos abdutores e rotadores externos do quadril (controle 'top-down') ou pronação excessiva (controle 'bottom-up').",
        "diagnostico": {
            "testes_recomendados": [
                "Teste de Step-Down Excêntrico: Avalia controle motor e reprodução de dor",
                "Palpação das facetas patelares: Alta especificidade",
                "Teste de Compressão Patelar (Zohlen): Baixa acurácia, use com cautela",
                "Avaliação de Valgo Dinâmico em agachamento unipodal"
            ],
            "questionarios": [
                "AKPS (Kujala Scale): Específico para dor anterior de joelho",
                "VAS (Dor em atividades específicas: escadas, agachar)",
                "PSFS (Patient Specific Functional Scale)"
            ]
        },
        "prognostico": {
            "fatores_risco_cronificacao": [
                "Fraqueza dos rotadores externos do quadril",
                "Medo-evitação em atividades de impacto",
                "Uso excessivo de sapatos sem suporte em superfícies rígidas"
            ],
            "expectativa_recuperacao": "Boa resolução em 8-12 semanas com fortalecimento e gestão de carga (Pacing)."
        },
        "contraindicacoes": "EVITAR: Repouso absoluto ou cessação total de atividades. NÃO usar joelheiras de compressão como tratamento único.",
        "intervencoes": [
            {
                "categoria": "Órteses Podais (Palmilhas)",
                "nivel_evidencia": "Nível A (Forte - JOSPT)",
                "recomendacao": "MUST",
                "tipo": "Palmilhas de Suporte Global / Anti-pronação",
                "descricao": "Utilizar em pacientes com excesso de pronação do retropé para reduzir o valgo dinâmico 'bottom-up'.",
                "conduta_sugerida": "Palmilha customizada ou pré-fabricada com suporte de arco medial e/ou postagem de retropé. Cochrane 2011 confirma eficácia no curto prazo (6 semanas) para dor.",
                "tamanho_efeito": "Redução rápida de dor (Curto Prazo). Essencial como coadjuvante ao fortalecimento proximal."
            },
            {
                "categoria": "Exercício Terapêutico",
                "nivel_evidencia": "Nível A",
                "tipo": "Fortalecimento de Quadril e Quadríceps",
                "descricao": "Exercícios de Glúteo Médio/Máximo combinados com Cadeira Extensora e Agachamentos.",
                "conduta_sugerida": "Focar em exercícios de quadril isolados nas primeiras 4 semanas se a dor no joelho for muito reativa.",
                "dosagem": {
                    "frequencia": "3x por semana",
                    "duracao": "Mínimo 8 semanas"
                },
                "prognostico": "Excelente com adesão ao programa, mas tendência à recorrência se a carga não for gerida."
            }
        ]
    },
    {
        "id": "KNEE_JUMP_01",
        "patologia": "Tendinopatia Patelar (Jumper's Knee)",
        "regiao": "Joelho",
        "ultima_atualizacao": "2025-01-20",
        "base_conhecimento": [
            {
                "titulo": "Achilles and Patellar Tendinopathy Rehabilitation",
                "tipo_estudo": "Revisão Sistemática",
                "autor": "Malliaras P et al. (JOSPT)",
                "ano": "2015",
                "nota_qualidade": "Alta (Referência p/ Tendão)",
                "doi_link": "https://www.jospt.org/doi/10.2519/jospt.2015.0302",
                "resumo_educativo": "A reabilitação de tendão exige carga mecânica para remodelamento do colágeno. O gelo e modalidades passivas têm efeito nulo na estrutura do tendão.",
                "pontos_chave": [
                    "Isometria tem efeito analgésico potente",
                    "Heavy Slow Resistance (HSR) é superior a longo prazo",
                    "Respeite a dor 24h pós-exercício"
                ]
            },
            {
                "titulo": "Isometric exercise induces analgesia and reduces inhibition in patellar tendinopathy",
                "tipo_estudo": "Ensaio Clínico (RCT)",
                "autor": "Rio E et al. (BJSM)",
                "ano": "2015",
                "nota_qualidade": "Inovador (Nível A)",
                "doi_link": "https://doi.org/10.1136/bjsports-2014-094386",
                "resumo_educativo": "Isometrias de alta carga (70% MVIC) reduzem a dor por até 45 minutos e diminuem a inibição cortical motora.",
                "pontos_chave": [
                    "Pode ser usado para abrir 'janela' para atividades esportivas",
                    "Sustentação de 45 segundos é o padrão ouro"
                ],
                "analise_antispin": "Embora o efeito analgésico seja forte, ele é temporário. Não deve ser usado como única forma de tratamento, mas sim como facilitador da carga isotônica."
            }
        ],
        "resumo_clinico": "Patologia de má adaptação à carga. O tendão falha ao gerir estresse de tração repetitivo. A reabilitação deve ser baseada em carregamento progressivo, evitando o ciclo de 'repouso e retorno explosivo'.",
        "diagnostico": {
            "testes_recomendados": [
                "Single Leg Decline Squat (30º): Principal teste provocativo",
                "Palpação do polo inferior da patela: Alta sensibilidade",
                "Avaliação da cadeia posterior (encurtamento de isquiotibiais e tríceps sural)"
            ],
            "questionarios": [
                "VISA-P (Victorian Institute of Sport Assessment - Patellar): Padrão ouro para gravidade",
                "VAS (Dor durante o salto/agachamento)"
            ]
        },
        "prognostico": {
            "fatores_risco_cronificacao": [
                "Volume de treino de salto excessivo sem recuperação",
                "IMC elevado (influência sistêmica/inflamatória)",
                "Déficit de força de glúteo máximo e quadríceps (baixa capacidade de absorção)"
            ],
            "expectativa_recuperacao": "Processos tendinosos são lentos. Melhora significativa esperada em 12-24 semanas de carga progressiva (HSR)."
        },
        "contraindicacoes": "EVITAR: Repouso absoluto (induz atrofia e fraqueza tenocitária), injeções de corticoides (risco de ruptura e degeneração), e alongamento agressivo do tendão em posição de compressão (flexão máxima).",
        "intervencoes": [
            {
                "categoria": "Exercício Terapêutico",
                "nivel_evidencia": "Nível A",
                "tipo": "Isometria Analgésica (Spanish Squat)",
                "descricao": "Contrações sustentadas de quadríceps em cadeia fechada.",
                "conduta_sugerida": "5 séries de 45 segundos, carga alta (7-8/10 esforço), repouso de 2 min entre séries.",
                "tamanho_efeito": "Redução imediata de 50-80% na dor pós-sessão.",
                "dosagem": {
                    "frequencia": "Pode ser feito diariamente para manejo de dor."
                }
            },
            {
                "categoria": "Exercício Terapêutico",
                "nivel_evidencia": "Nível A",
                "tipo": "Heavy Slow Resistance (HSR)",
                "descricao": "Exercícios isotônicos lentos (3s concêntrica / 3s excêntrica).",
                "conduta_sugerida": "Leg Press ou Agachamento. Iniciar com 15RM e progredir para 6RM em 12 semanas.",
                "tamanho_efeito": "Superior em satisfação do paciente e função a longo prazo comparado a excêntrico isolado.",
                "dosagem": {
                    "frequencia": "3x por semana (dias alternados)"
                }
            }
        ]
    },

    {
        "id": "KNEE_MENISC_01",
        "patologia": "Lesão Meniscal (Degenerativa)",
        "regiao": "Joelho",
        "ultima_atualizacao": "2025-01-20",
        "base_conhecimento": [
            {
                "titulo": "Knee pain and mobility impairments: meniscal and articular cartilage lesions",
                "tipo_estudo": "Diretriz Clínica (CPG)",
                "autor": "Logerstedt DS et al. (JOSPT)",
                "ano": "2018",
                "nota_qualidade": "Nível A (Ouro)",
                "doi_link": "https://www.jospt.org/doi/10.2519/jospt.2018.0301",
                "resumo_educativo": "Recomenda intervenções progressivas de ADM e fortalecimento. Enfatiza o uso de critérios funcionais para retorno à atividade.",
                "pontos_chave": [
                    "Joint Line Tenderness e McMurray são os testes mais confiáveis",
                    "Exercício supervisionado é recomendado para lesões degenerativas",
                    "NMES pode ser usado para déficit de quadríceps"
                ]
            },
            {
                "titulo": "Surgery versus Physical Therapy for a Meniscal Tear and Osteoarthritis (METEOR Trial)",
                "tipo_estudo": "Ensaio Clínico Randomizado (RCT)",
                "autor": "Katz JN et al. (NEJM)",
                "ano": "2013",
                "nota_qualidade": "Impacto Altíssimo",
                "doi_link": "https://www.nejm.org/doi/full/10.1056/NEJMoa1301408",
                "resumo_educativo": "Não houve diferença significativa nos resultados funcionais entre cirurgia (meniscectomia) e fisioterapia em 6 e 12 meses para pacientes com mais de 45 anos.",
                "pontos_chave": [
                    "A fisioterapia deve ser a primeira linha de tratamento",
                    "70% dos pacientes que iniciaram fisio evitaram a cirurgia",
                    "Resultados sustentados em 5 anos de acompanhamento"
                ],
                "analise_antispin": "A cirurgia é frequentemente vendida como 'cura rápida', mas os dados mostram que a biologia da cicatrização e fortalecimento atinge o mesmo patamar sem os riscos cirúrgicos."
            }
        ],
        "resumo_clinico": "Diferenciar entre lesão traumática aguda (jovem/atleta) e degenerativa (adulto/idoso). Em lesões degenerativas, a evidência favorece fortemente a reabilitação ativa sobre a meniscectomia parcial.",
        "diagnostico": {
            "testes_recomendados": [
                "Joint Line Tenderness: Sensibilidade 76%",
                "McMurray Test: Especificidade 77% (Click audível/palpável)",
                "Thessaly Test (20º flexão): Alta acurácia quando combinado",
                "Composite Score (5 Sinais de Lowery): Maior precisão diagnóstica"
            ],
            "questionarios": [
                "KOOS (Knee Injury and Osteoarthritis Outcome Score)",
                "Lysholm Knee Scoring Scale",
                "IKDC 2000"
            ]
        },
        "prognostico": {
            "fatores_risco_cronificacao": [
                "Déficit inicial grave de força de quadríceps",
                "Obesidade e alto nível de dor basal",
                "Presença de Osteoartrose avançada associada (Kellgren-Lawrence >2)"
            ],
            "expectativa_recuperacao": "Lesões degenerativas: 3-6 meses para estabilização funcional. Lesões agudas (Pós-op): 6-9 meses para retorno ao esporte."
        },
        "contraindicacoes": "EVITAR: Artroscopia de rotina em pacientes >45 anos com lesão degenerativa sem bloqueio articular mecânico. NÃO forçar flexão máxima em fase aguda de lesão em alça de balde.",
        "intervencoes": [
            {
                "categoria": "Exercício Terapêutico",
                "nivel_evidencia": "Nível A",
                "tipo": "Fortalecimento Progressivo de Membro Inferior",
                "descricao": "Foco em Quadríceps, Glúteos e controle sensoriomotor.",
                "conduta_sugerida": "Progressão de CCA para CCFE. Enfatizar controle excêntrico e propriocepção.",
                "tamanho_efeito": "Equivalente à meniscectomia para dor e função a longo prazo.",
                "dosagem": {
                    "frequencia": "3x por semana"
                }
            }
        ]
    },
    {
        "id": "SHOULDER_RCRSP_01",
        "patologia": "Dor Relacionada ao Manguito Rotador (RCRSP)",
        "regiao": "Ombro",
        "ultima_atualizacao": "2025-01-31",
        "base_conhecimento": [
            {
                "titulo": "Rotator cuff–related shoulder pain: a clinical practice guideline",
                "tipo_estudo": "Diretriz Clínica (CPG)",
                "autor": "Lafrance S et al. (JOSPT)",
                "ano": "2020",
                "nota_qualidade": "Nível A",
                "doi_link": "https://www.jospt.org/doi/10.2519/jospt.2020.0301",
                "resumo_educativo": "Foca no exercício supervisionado como primeira linha. Desencoraja o termo 'impacto' por induzir noções de dano estrutural.",
                "pontos_chave": [
                    "Exercícios de fortalecimento progressivo são superiores a injeções",
                    "A educação deve focar na despatologização da imagem (exames)",
                    "Protocolo de carga deve ser respeitado (Janela de dor)"
                ]
            },
            {
                "titulo": "Decompression surgery for subacromial shoulder pain (CSaw Trial)",
                "tipo_estudo": "Ensaio Clínico Randomizado",
                "autor": "Beard DJ et al. (The Lancet)",
                "ano": "2018",
                "nota_qualidade": "PEDro 10/10",
                "doi_link": "https://doi.org/10.1016/S0140-6736(17)32457-1",
                "resumo_educativo": "A cirurgia de descompressão não foi superior ao placebo. O exercício deve ser a primeira e principal linha de tratamento.",
                "pontos_chave": [
                    "A 'raspagem' do acrômio não muda o resultado clínico",
                    "O tendão precisa de carga para se adaptar",
                    "Evitar modalidades puramente passivas"
                ],
                "analise_antispin": "A cirurgia de acromioplastia baseia-se num modelo mecânico ultrapassado. A dor é tendinosa/biológica, não por 'atrito' ósseo."
            }
        ],
        "resumo_clinico": "Condição clínica caracterizada por dor na elevação do braço. O foco mudou da 'descompressão' para o 'fortalecimento' e controle da discinese escapular.",
        "diagnostico": {
            "testes_recomendados": [
                "Cluster de Park (Hawkins-Kennedy, Infraspinatus Strength, Painful Arc)",
                "Empty Can (Jobe): Sensível para supraespinal",
                "SAT (Scapular Assistance Test): Preditivo de resposta ao exercício"
            ],
            "questionarios": [
                "DASH (Disabilities of the Arm, Shoulder and Hand)",
                "SPADI (Shoulder Pain and Disability Index)"
            ]
        },
        "prognostico": {
            "fatores_risco_cronificacao": [
                "Baixa autoeficácia e medo de movimento",
                "Diabetes Mellitus (pior cicatrização tendinosa)"
            ],
            "expectativa_recuperacao": "Tratamento conservador leva de 12 a 24 semanas para consolidação de força e função."
        },
        "contraindicacoes": "EVITAR: Injeções repetitivas de corticoides (enfraquecem o tendão). NÃO forçar ADM passiva se houver sinal de instabilidade.",
        "intervencoes": [
            {
                "categoria": "Exercício Terapêutico",
                "nivel_evidencia": "Nível A",
                "tipo": "Fortalecimento Específico do Manguito e Escápula",
                "descricao": "Rotações externas/internas, remo e Wall Slide.",
                "conduta_sugerida": "Trabalhar com dor tolerável (até 3-4/10). Focar no controle excêntrico da descida do braço.",
                "tamanho_efeito": "Equivalente à cirurgia em 12 meses.",
                "dosagem": { "frequencia": "3x por semana", "duracao": "Mínimo 12 semanas" }
            }
        ]
    },
    {
        "id": "SHOULDER_FROZEN_01",
        "patologia": "Capsulite Adesiva (Ombro Congelado)",
        "regiao": "Ombro",
        "ultima_atualizacao": "2025-01-31",
        "base_conhecimento": [
            {
                "titulo": "Shoulder Pain and Mobility Deficits: Adhesive Capsulitis",
                "tipo_estudo": "Diretriz Clínica (CPG)",
                "autor": "Kelley MJ et al. (JOSPT)",
                "ano": "2013/Atualizada",
                "nota_qualidade": "Nível A",
                "doi_link": "https://www.jospt.org/doi/10.2519/jospt.2013.0302",
                "resumo_educativo": "O tratamento depende da fase de irritabilidade. Alongamento agressivo na fase inflamatória agrava o quadro e prolonga a dor.",
                "pontos_chave": [
                    "Identificar se a dor é dominante sobre a rigidez (Alta Irritabilidade)",
                    "Injeções de corticoide (IAS) são eficazes para alívio rápido de dor a curto prazo",
                    "A educação do paciente sobre a história natural (12-24 meses) reduz a ansiedade"
                ]
            }
        ],
        "resumo_clinico": "Rigidez progressiva por inflamação e fibrose da cápsula articular. Frequentemente idiopática ou associada a Diabetes Mellitus e disfunções da tireoide.",
        "diagnostico": {
            "testes_recomendados": [
                "Perda de Rotação Externa ativa e passiva em neutro (Sinal patognomônico)",
                "Padrão Capsular de Cyriax (RE > Abd > RI)",
                "Triagem de Diabetes (Fator de risco independente)"
            ]
        },
        "prognostico": {
            "fatores_risco_cronificacao": [
                "Diabetes descompensada (pior prognóstico de ADM)",
                "Kinesiofobia por medo da dor noturna"
            ],
            "expectativa_recuperacao": "Evolução lenta em fases. A fase 'thawing' (descongelante) pode levar de 6 a 12 meses. O objetivo é manter função e modular dor."
        },
        "contraindicacoes": "EVITAR: Alongamento agressivo além do limiar de dor na fase de alta irritabilidade. NÃO realizar manipulação sob anestesia sem tentativa mínima de 6 meses de conservador.",
        "intervencoes": [
            {
                "categoria": "Terapia Manual",
                "nivel_evidencia": "Nível B",
                "tipo": "Mobilização Intra-articular de Baixo Grau (Maitland I-II)",
                "descricao": "Oscilações rítmicas para modulação de dor e dessensibilização capsular.",
                "conduta_sugerida": "Focar em analgesia e ganho de RE gradual sem despertar dor residual pós-sessão.",
                "tamanho_efeito": "Redução imediata de dor noturna e melhora do conforto articular.",
                "dosagem": { "frequencia": "2x por semana" }
            }
        ]
    },
    {
        "id": "SHOULDER_INSTAB_01",
        "patologia": "Instabilidade Glenoumeral",
        "regiao": "Ombro",
        "ultima_atualizacao": "2025-01-31",
        "base_conhecimento": [
            {
                "titulo": "Rehabilitation following shoulder dislocation",
                "tipo_estudo": "Revisão Sistemática",
                "autor": "Warby SA et al.",
                "ano": "2016",
                "nota_qualidade": "PEDro 8/10",
                "doi_link": "https://pubmed.ncbi.nlm.nih.gov/27045610/",
                "resumo_educativo": "Protocolos específicos de controle motor (como o Watson) são significativamente mais eficazes que exercícios genéricos de fortalecimento na prevenção de recorrência.",
                "pontos_chave": [
                    "Atrasar o início da abdução com rotação externa extrema (posição de apreensão)",
                    "Focar no controle da cabeça umeral pela escápula e manguito anterior",
                    "Treino de propriocepção e co-contração em cadeia fechada é fundamental"
                ]
            }
        ],
        "resumo_clinico": "Laxidão excessiva (Hipermobilidade) ou lesão labral (Bankart) resultante de trauma. O objetivo é a 'estabilidade dinâmica' através da coordenação muscular infra-glenoidal.",
        "diagnostico": {
            "testes_recomendados": [
                "Teste de Apreensão e Realocação (Apprehension & Relocation)",
                "Teste de Carga e Deslocamento (Load and Shift)",
                "Sulcus Sign (Para instabilidade multidirecional/MDI)"
            ],
            "questionarios": [
                "WOSI (Western Ontario Shoulder Instability Index)",
                "ASES (American Shoulder and Elbow Surgeons)"
            ]
        },
        "prognostico": {
            "fatores_risco_cronificacao": [
                "Idade < 20 anos no primeiro episódio (alto risco de recidiva)",
                "Lesão de Hill-Sachs significativa (defeito ósseo)"
            ],
            "expectativa_recuperacao": "Retorno ao esporte em 3-6 meses se o controle sensoriomotor for restaurado."
        },
        "contraindicacoes": "EVITAR: Alongamentos de cápsula anterior em pacientes com instabilidade traumática anterior. NÃO progredir para arremessos sem controle escapular pleno.",
        "intervencoes": [
            {
                "id_intervencao": "SHOULDER_STAB_01",
                "categoria": "Exercício Terapêutico",
                "nivel_evidencia": "Nível B",
                "tipo": "Protocolo de Estabilização Dinâmica (Watson)",
                "descricao": "Progressão do controle escapular neutro para controle em posições de carga.",
                "conduta_sugerida": "Estágio 1: Isometria de manguito e ajuste escapular. Estágio 2: Co-contração em cadeia fechada (Wall slide/Plank). Estágio 3: Pliometria reativa.",
                "tamanho_efeito": "Redução acentuada na sensação subjetiva de instabilidade.",
                "dosagem": { "frequencia": "3x por semana" }
            }
        ]
    },
    {
        "id": "WH_UI_01",
        "patologia": "Incontinência Urinária de Esforço (IUE)",
        "regiao": "Saúde da Mulher",
        "ultima_atualizacao": "2025-01-31",
        "base_conhecimento": [
            {
                "titulo": "Pelvic floor muscle training for urinary incontinence in women",
                "tipo_estudo": "Revisão Sistemática Cochrane",
                "autor": "Dumoulin C et al.",
                "ano": "2018",
                "nota_qualidade": "Nível 1A (Padrão Ouro)",
                "doi_link": "https://doi.org/10.1002/14651858.CD005654.pub4",
                "resumo_educativo": "O Treinamento dos Músculos do Assoalho Pélvico (TMAP) deve ser a primeira linha de tratamento. Força, resistência e coordenação são as chaves da continência.",
                "pontos_chave": [
                    "TMAP supervisionado por fisioterapeuta especializado é superior",
                    "Aderência é o principal preditor de sucesso a longo prazo",
                    "O efeito é dose-dependente (intensidade correta importa)"
                ]
            }
        ],
        "resumo_clinico": "Perda involuntária de urina em momentos de aumento da pressão intra-abdominal (tosse, salto, riso). Relacionada à fraqueza ou falta de coordenação do assoalho pélvico e esfíncter uretral.",
        "diagnostico": {
            "testes_recomendados": [
                "Teste do Absorvente (Pad Test) - 1h ou 24h",
                "Esquema PERFECT (Power, Endurance, Repetitions, Fast, Every, Contraction, Timed)",
                "Modified Oxford Scale (0-5) via toque vaginal"
            ],
            "questionarios": [
                "ICIQ-UI SF (International Consultation on Incontinence Questionnaire)",
                "KHQ (King's Health Questionnaire)"
            ]
        },
        "prognostico": {
            "fatores_risco_cronificacao": [
                "Obesidade (IMC > 30 aumenta a pressão constante)",
                "Constipação crônica (esforço evacuatório repetido)",
                "Déficit estrogênico (Menopausa)"
            ],
            "expectativa_recuperacao": "Cura ou melhora reportada em 75-80% dos casos em 12 semanas de treino intensivo."
        },
        "contraindicacoes": "EVITAR: Saltos e exercícios de alto impacto (pliometria) sem controle prévio do assoalho. NÃO usar cones vaginais sem avaliação prévia de hipertonia associada.",
        "intervencoes": [
            {
                "id_intervencao": "WH_TMAP_01",
                "categoria": "Exercício Terapêutico",
                "nivel_evidencia": "Nível A",
                "tipo": "Treinamento dos Músculos do Assoalho Pélvico (TMAP)",
                "descricao": "Protocolo de hipertrofia e coordenação de fibras tipo I e II.",
                "conduta_sugerida": "Séries de 8-12 contrações máximas (sustentando 6-10s) + 10 contrações rápidas (reflexo de fechamento).",
                "tamanho_efeito": "NNT = 3 para cura ou melhora.",
                "dosagem": { "frequencia": "Diariamente", "volume": "3 séries/dia" }
            },
            {
                "categoria": "Educação Comportamental",
                "nivel_evidencia": "Nível A",
                "tipo": "The Knack (O Truque)",
                "descricao": "Coordenação motora para contração antecipatória ao esforço.",
                "conduta_sugerida": "Treinar a contração do períneo IMEDIATAMENTE antes de tossir ou levantar peso.",
                "tamanho_efeito": "Redução imediata nos episódios de perda."
            }
        ]
    },
    {
        "id": "WH_POP_01",
        "patologia": "Prolapso de Órgãos Pélvicos (POP)",
        "regiao": "Saúde da Mulher",
        "ultima_atualizacao": "2025-01-31",
        "base_conhecimento": [
            {
                "titulo": "Pelvic floor muscle training for visceral pelvic organ prolapse (POPPY Trial)",
                "tipo_estudo": "Ensaio Clínico Randomizado (The Lancet)",
                "autor": "Hagen S et al.",
                "ano": "2014",
                "nota_qualidade": "Máxima",
                "doi_link": "https://doi.org/10.1016/S0140-6736(13)61971-8",
                "resumo_educativo": "TMAP reduz significativamente os sintomas de prolapso e pode evitar a cirurgia em estágios iniciais (I e II).",
                "pontos_chave": [
                    "Fisioterapia reduz a DIR (Distância Inter-Retos) associada",
                    "A satisfação do paciente com o tratamento conservador é alta"
                ]
            }
        ],
        "resumo_clinico": "Descida de bexiga (cistocele), útero ou reto (retocele) pelo canal vaginal. O objetivo é fortalecer a 'rede' de suporte muscular (elevador do ânus).",
        "diagnostico": {
            "testes_recomendados": [
                "Estagiamento POP-Q (Pelvic Organ Prolapse Quantification)",
                "Avaliação de Hipertonia de parede vaginal",
                "Manobra de Valsalva durante o toque para avaliar descida"
            ],
            "questionarios": [
                "P-QOL (Prolapse Quality of Life)",
                "POP-SS (Pelvic Organ Prolapse Symptom Score)"
            ]
        },
        "prognostico": {
            "fatores_risco_cronificacao": [
                "Avulsão do músculo elevador do ânus (lesão pós-parto traumática)",
                "Atividades de alto impacto repetitivo sem proteção"
            ],
            "expectativa_recuperacao": "Estabilização do estágio e remissão de sintomas de 'peso' em 3-6 meses."
        },
        "contraindicacoes": "EVITAR: Manobra de Valsalva prolongada (prender a respiração no esforço). NÃO sugerir cirurgia sem antes tentar 6 meses de TMAP (especialmente em estágios leves).",
        "intervencoes": [
            {
                "categoria": "Exercício Terapêutico",
                "nivel_evidencia": "Nível A",
                "tipo": "TMAP de Sustentação",
                "descricao": "Foco em aumentar o tônus de repouso e a elevação da placa do elevador.",
                "conduta_sugerida": "Exercícios em posições de gravidade favorável (ex: Trendelenburg) progredindo para bipedestação.",
                "tamanho_efeito": "Melhora subjetiva em 60% dos pacientes."
            }
        ]
    },
    {
        "id": "WH_CPP_01",
        "patologia": "Dor Pélvica Crônica / Disfunção Miofascial",
        "regiao": "Saúde da Mulher",
        "ultima_atualizacao": "2025-01-31",
        "base_conhecimento": [
            {
                "titulo": "Management of Chronic Pelvic Pain",
                "tipo_estudo": "Diretriz Clínica (EAU)",
                "autor": "Engeler A et al.",
                "ano": "2022",
                "nota_qualidade": "Nível A (Atualizada)",
                "doi_link": "https://uroweb.org/guidelines/chronic-pelvic-pain",
                "resumo_educativo": "A dor pélvica crônica é frequentemente uma síndrome de sensibilização central com hipertonia reativa da musculatura pélvica.",
                "pontos_chave": [
                    "Abordagem multidisciplinar é mandatória (Gineco, Fisio, Psico)",
                    "Fisioterapia foca no 'down-training' (relaxamento) e dessensibilização miofascial",
                    "A catastrofização da dor é um forte preditor de cronicidade"
                ]
            }
        ],
        "resumo_clinico": "Dor persistente por > 6 meses sem patologia orgânica ativa equivalente. Associada a pontos gatilho miofasciais e disfunção do sistema inibitório descendente.",
        "diagnostico": {
            "testes_recommendedados": [
                "Mapeamento de dor via 'Clock Face' (via vaginal)",
                "Avaliação de Hipertonia (Tensão basal elevada)",
                "Triagem de Sensibilização Central (CSI - Central Sensitization Inventory)"
            ],
            "questionarios": [
                "IPPS (International Pelvic Pain Society Questionnaire)",
                "FSFI (Female Sexual Function Index)"
            ]
        },
        "prognostico": {
            "fatores_risco_cronificacao": [
                "Histórico de abusos ou traumas psicológicos",
                "Estratégias de enfrentamento desadaptativas (medo-evitação)"
            ],
            "expectativa_recuperacao": "Melhora gradual em 4-8 meses. Foco na redução da intensidade e melhora da qualidade de vida."
        },
        "contraindicacoes": "EVITAR: Exercícios de fortalecimento (Kegels) se houver hipertonia predominante (pode piorar a dor). NÃO focar apenas na anatomia pélvica.",
        "intervencoes": [
            {
                "categoria": "Terapia Manual",
                "nivel_evidencia": "Nível A",
                "tipo": "Massagem de Thiele e Liberação de Pontos Gatilho",
                "descricao": "Mobilização interna suave para redução da tensão miofascial.",
                "conduta_sugerida": "Focar em áreas de restrição (obturador interno, elevador do ânus).",
                "tamanho_efeito": "Redução significativa na dor no coito e dor basal.",
                "dosagem": { "frequencia": "1-2x semana" }
            },
            {
                "categoria": "Biofeedback / Exercício",
                "nivel_evidencia": "Nível B",
                "tipo": "Biofeedback Eletromiográfico (Down-training)",
                "descricao": "Uso de monitoramento visual para ensinar a relaxar a musculatura voluntariamente.",
                "conduta_sugerida": "Utilizar o gráfico para mostrar ao paciente os picos de tensão inconsciente.",
                "tamanho_efeito": "Melhora na consciência corporal pélvica."
            }
        ]
    },
    {
        "id": "WH_PP_DIAST_01",
        "patologia": "Diástase dos Músculos Retos Abdominais (DMRA)",
        "regiao": "Saúde da Mulher",
        "ultima_atualizacao": "2025-01-31",
        "base_conhecimento": [
            {
                "titulo": "Diastasis recti abdominis during pregnancy and 12 months postpartum",
                "tipo_estudo": "Estudo de Coorte",
                "autor": "Sperstad JB et al. (BJSM)",
                "ano": "2016",
                "nota_qualidade": "Alta Relevância",
                "doi_link": "https://doi.org/10.1136/bjsports-2016-096065",
                "resumo_educativo": "A diástase é uma alteração fisiológica na gravidez. O foco deve ser a funcionalidade da linha alba (capacidade de tensão) e não apenas a distância em cm.",
                "pontos_chave": [
                    "A Distância Inter-Retos (DIR) isolada não é critério para dor lombar",
                    "Exercícios abdominais adequados não pioram a diástase no pós-parto",
                    "A integração com o Assoalho Pélvico melhora o resultado global"
                ]
            }
        ],
        "resumo_clinico": "Separação dos retos abdominais mediada pela expansão uterina. Requer restauração da competência da parede abdominal e gestão de pressão.",
        "diagnostico": {
            "testes_recomendados": [
                "Mensuração da DIR (Paquímetro ou Polpa Digital) - Supra/Umbi/Infra-umbilical",
                "Avaliação de Tensão da Linha Alba (Capacidade de gerar resistência)",
                "Teste de Coning/Doming durante o Curl-up"
            ]
        },
        "prognostico": {
            "fatores_risco_cronificacao": [
                "Múltiplas gestações (paridade elevada)",
                "Gestações gemelares ou bebês macrossômicos"
            ],
            "expectativa_recuperacao": "Funcionalidade restaurada em 4-6 meses na maioria dos casos com treino específico."
        },
        "contraindicacoes": "EVITAR: Exercícios de alta pressão intra-abdominal (Vrut/Reverse Crunch) se houver 'coning' incontrolável na fase inicial. NÃO desencorajar atividade física global.",
        "intervencoes": [
            {
                "categoria": "Exercício Terapêutico",
                "nivel_evidencia": "Nível B",
                "tipo": "Treinamento Hipopressivo e Estalibilização Core",
                "descricao": "Ativação do Transverso do Abdômen em coordenação com a expiração.",
                "conduta_sugerida": "Uso de técnicas de aspiração diafragmática e pranchas progressivas.",
                "tamanho_efeito": "Melhora estética e funcional da parede abdominal.",
                "dosagem": { "frequencia": "Diário (10-15min)" }
            }
        ]
    },
    {
        "id": "ANKLE_SPRAIN_01",
        "patologia": "Entorse Lateral de Tornozelo (Aguda e Instabilidade Crônica)",
        "regiao": "Tornozelo e Pé",
        "ultima_atualizacao": "2025-01-20",
        "base_conhecimento": [
            {
                "titulo": "Lateral Ankle Sprain: Revision 2021",
                "tipo_estudo": "Diretriz Clínica (CPG)",
                "autor": "Martin RL et al. (JOSPT)",
                "ano": "2021",
                "nota_qualidade": "Nível A (Diretriz Padrão Ouro)",
                "doi_link": "https://www.jospt.org/doi/10.2519/jospt.2021.0302",
                "resumo_educativo": "Recomenda diagnóstico precoce usando as Regras de Ottawa para excluir fraturas. Foco em carga precoce e treino neuromuscular.",
                "pontos_chave": [
                    "Sempre testar estabilidade dinâmica com o Star Excursion Balance Test (SEBT)",
                    "Uso de órteses (Aircast) é superior ao imobilizador gessado na fase aguda",
                    "Treino proprioceptivo reduz o risco de Instabilidade Crônica (CAI)"
                ]
            }
        ],
        "resumo_clinico": "Lesão ligamentar por inversão. O foco deve ser a retorno precoce à carga (P.O.L.I.C.E. ao invés de R.I.C.E.) e prevenção de recidivas por treino neuromuscular.",
        "intervencoes": [
            {
                "categoria": "Avaliação e Prognóstico",
                "nivel_evidencia": "Nível A",
                "tipo": "Triagem e Testes Funcionais",
                "descricao": "Regras de Ottawa para fraturas e SEBT para estabilidade.",
                "conduta_sugerida": "Graduar a lesão (I a III) e monitorar edema/hematoma.",
                "prognostico": "Retorno ao esporte em 2-4 semanas para graus I/II; 6-12 semanas para grau III."
            },
            {
                "categoria": "Exercício Terapêutico",
                "nivel_evidencia": "Nível A",
                "tipo": "Treino Neuromuscular e Propriocepção",
                "descricao": "Exercícios em superfícies instáveis e treino de equilíbrio unipodal.",
                "conduta_sugerida": "Iniciar o mais precocemente possível (assim que a carga for tolerada).",
                "dosagem": {
                    "frequencia": "Diariamente",
                    "sets": "3-5 minutos de equilíbrio por dia"
                }
            }
        ]
    },
    {
        "id": "ANKLE_FASC_01",
        "patologia": "Fasciopatia Plantar (Fascite)",
        "regiao": "Tornozelo e Pé",
        "ultima_atualizacao": "2025-01-20",
        "base_conhecimento": [
            {
                "titulo": "Heel Pain—Plantar Fasciitis: Revision 2014",
                "tipo_estudo": "Diretriz Clínica (CPG)",
                "autor": "Martin RL et al. (JOSPT)",
                "ano": "2014",
                "nota_qualidade": "Nível A",
                "doi_link": "https://www.jospt.org/doi/10.2519/jospt.2014.0303",
                "resumo_educativo": "A fascite é uma condição degenerativa por sobrecarga. O alongamento da fáscia e da cadeia posterior (panturrilha) tem forte evidência.",
                "pontos_chave": [
                    "A dor é pior nos primeiros passos da manhã",
                    "Órteses plantares (palmilhas) são eficazes para redução de dor no curto prazo",
                    "NÃO focar apenas no 'esporão', pois ele raramente é a causa da dor"
                ]
            },
            {
                "titulo": "High-load strength training and plantar fasciitis",
                "tipo_estudo": "Ensaio Clínico Randomizado",
                "autor": "Rathleff MS et al.",
                "ano": "2015",
                "nota_qualidade": "PEDro 8/10",
                "doi_link": "https://pubmed.ncbi.nlm.nih.gov/25145544/",
                "resumo_educativo": "O protocolo de carga alta (elevação de calcanhar com toalha sob os dedos) foi superior ao alongamento isolado em 3 meses.",
                "pontos_chave": [
                    "Carga mecânica é necessária para o remodelamento tecidual",
                    "Progressão de carga deve ser lenta e controlada"
                ]
            }
        ],
        "resumo_clinico": "Dor na origem da fáscia plantar. Tratamento focado em gestão de carga, alongamento e fortalecimento progressivo.",
        "intervencoes": [
            {
                "categoria": "Dispositivos Médicos",
                "nivel_evidencia": "Nível A",
                "tipo": "Órteses Plantares e Palmilhas",
                "descricao": "Palmilhas sob medida para suporte de arco longitudinal medial e descarga de calcanhar.",
                "conduta_sugerida": "Utilizar em pacientes com pé plano ou pronação excessiva para alívio imediato.",
                "prognostico": "Melhora expressiva em 12 semanas, mas requer manutenção de calçados adequados."
            },
            {
                "categoria": "Exercício Terapêutico",
                "nivel_evidencia": "Nível A",
                "tipo": "High-Load Strength Training (Rathleff Protocol)",
                "descricao": "Elevação de calcanhar unilateral com uma toalha enrolada sob os dedos.",
                "conduta_sugerida": "Fase concêntrica 3s, isometria 2s, excêntrica 3s.",
                "dosagem": {
                    "frequencia": "Dias alternados",
                    "volume": "3 séries de 12 repetições (progredindo para 8 RM)"
                }
            }
        ]
    },
    {
        "id": "ANKLE_ACHILLES_01",
        "patologia": "Tendinopatia de Aquiles (Mid-portion)",
        "regiao": "Tornozelo e Pé",
        "ultima_atualizacao": "2025-01-20",
        "base_conhecimento": [
            {
                "titulo": "Achilles Pain, Stiffness, and Muscle Power Deficits: Revision 2018",
                "tipo_estudo": "Diretriz Clínica (CPG)",
                "autor": "Martin RL et al. (JOSPT)",
                "ano": "2018",
                "nota_qualidade": "Nível A",
                "doi_link": "https://www.jospt.org/doi/10.2519/jospt.2018.0302",
                "resumo_educativo": "Diferencia entre tendinopatia da porção média e insercional. Exercícios excêntricos ou de carga alta são a intervenção prioritária.",
                "pontos_chave": [
                    "O uso de saltinhos (heel lift) pode reduzir a carga no tendão na fase aguda",
                    "Educação sobre não cessar a carga totalmente (evitar destreinamento)",
                    "Protocolo Alfredson (excêntricos) vs Silbernagel (isotônicos)"
                ]
            }
        ],
        "resumo_clinico": "Falha na gestão de carga do tendão calcanhar. Requer estímulo mecânico progressivo para recuperação da rigidez (stiffness) do tendão.",
        "intervencoes": [
            {
                "categoria": "Órteses Podais (Palmilhas)",
                "nivel_evidencia": "Nível C (Sugestão de Experts)",
                "recomendacao": "CAN",
                "tipo": "Calcanheiras / Heel Lifts",
                "descricao": "Elevação temporária do retropé para reduzir a carga de tração no tendão.",
                "conduta_sugerida": "Utilizar durante a fase aguda de carga reativa (especialmente em esportes de salto). Reduz o pico de dorsiflexão e alivia o estresse tensional inicial. JOSPT 2024 aponta benefício modesto mas útil.",
                "tamanho_efeito": "Redução inicial de dor, facilitando o início do protocolo de carga (HSR)."
            },
            {
                "categoria": "Exercício Terapêutico",
                "nivel_evidencia": "Nível A",
                "tipo": "Protocolo de Carga Pesada e Lenta (HSR)",
                "descricao": "Fortalecimento de tríceps sural com controle rigoroso de velocidade.",
                "conduta_sugerida": "Elevação de calcanhar sentada e em pé para focar em Sóleo e Gastrocnêmio.",
                "dosagem": {
                    "frequencia": "3x por semana",
                    "carga": "Progressione até 80-90% de 1RM"
                },
                "prognostico": "Mudança tecidual real leva de 3 a 6 meses. Paciência e monitoramento de dor nas primeiras horas do dia."
            }
        ]
    },
    {
        "id": "ANKLE_META_01",
        "patologia": "Metatarsalgia e Neuroma de Morton",
        "regiao": "Tornozelo e Pé",
        "ultima_atualizacao": "2025-01-31",
        "base_conhecimento": [
            {
                "titulo": "Metatarsalgia: Diagnosis and Treatment",
                "tipo_estudo": "Consenso de Especialistas",
                "autor": "Espinosa N et al.",
                "ano": "2010",
                "nota_qualidade": "Revisão Clínica",
                "doi_link": "https://pubmed.ncbi.nlm.nih.gov/20471556/",
                "resumo_educativo": "A dor nos metatarsos geralmente é causada por sobrecarga mecânica decorrente de encurtamento da cadeia posterior ou calçados inadequados. A redistribuição da pressão é a chave do sucesso.",
                "pontos_chave": [
                    "Barra metatarsal e botões metatarsais (palmilhas) reduzem a pressão local nas cabeças",
                    "Neuroma de Morton: Compressão do nervo interdigital, teste de Mulder positivo",
                    "Calçados com biqueira larga (Wide Toe Box) são fundamentais para reduzir a compressão lateral"
                ]
            }
        ],
        "resumo_clinico": "Sobrecarga mecânica nas cabeças dos metatarsos. Condição com forte componente biomecânico secundário ao pé cavo ou plano severo. O tratamento foca no alívio de pressão retro-capital.",
        "diagnostico": {
            "testes_recomendados": [
                "Teste de Mulder (Para Neuroma de Morton)",
                "Palpação dos espaços intermetatarsais",
                "Baropodometria: Identificar picos de pressão > 600 kPa nas cabeças dos metatarsos",
                "Goniometria de Hálux (ADM de extensão > 60º necessária para marcha eficiente)"
            ]
        },
        "prognostico": {
            "fatores_risco_cronificacao": [
                "Uso persistente de salto alto (shift anterior do centro de pressão)",
                "Encurtamento severo de Gastrocnêmio (Equinismo funcional)"
            ],
            "expectativa_recuperacao": "Alívio imediato com palmilha correta. Estabilização do quadro em 4-6 semanas."
        },
        "contraindicacoes": "EVITAR: Injeções de corticoide intranervosas (no neuroma) sem controle. NÃO usar calçados estreitos ou com sola muito flexível na fase aguda.",
        "intervencoes": [
            {
                "categoria": "Órteses Podais (Palmilhas)",
                "nivel_evidencia": "Nível B (Controle Mecânico)",
                "recomendacao": "MUST",
                "tipo": "Palmilhas com Barra Metatarsal e Botão Meta",
                "descricao": "Apoio retro-capital para transferir a pressão das cabeças dos metatarsos para os colos.",
                "conduta_sugerida": "Posicionar o elemento biomecânico 2mm atrás da zona de hiperpressão detectada no baropodômetro.",
                "tamanho_efeito": "Redução de até 40% na pressão local.",
                "dosagem": { "frequencia": "Uso contínuo nos calçados de trabalho." }
            }
        ]
    },
    {
        "id": "ANKLE_DIAB_01",
        "patologia": "Gestão Preventiva do Pé Diabético",
        "regiao": "Tornozelo e Pé",
        "ultima_atualizacao": "2025-01-31",
        "base_conhecimento": [
            {
                "titulo": "IWGDF Guidelines on the prevention of foot ulcers in persons with diabetes",
                "tipo_estudo": "Diretriz Clínica Internacional",
                "autor": "Bus SA et al.",
                "ano": "2019/2023",
                "nota_qualidade": "Nível A (Ouro)",
                "doi_link": "https://iwgdfguidelines.org/prevention-guideline/",
                "resumo_educativo": "A prevenção foca na triagem de neuropatia sensorial e gestão rigorosa de pontos de pressão elevada (offloading).",
                "pontos_chave": [
                    "Avaliação regular com monofilamento de 10g (Semmes-Weinstein)",
                    "O uso de palmilhas de preenchimento total reduz o risco de úlceras em 50%",
                    "Termometria cutânea pode ser preditora de inflamação pré-ulcerativa"
                ]
            }
        ],
        "resumo_clinico": "Risco de ulceração devido à neuropatia, deformidade e pressão excessiva. O papel operacional do podoposturologista é o 'Offloading' preventivo.",
        "diagnostico": {
            "testes_recomendados": [
                "Teste de Sensibilidade com Monofilamento (10g)",
                "Baropodometria Estática/Dinâmica: Identificar picos de pressão pré-ulcerativos",
                "Avaliação de Pulso Pedioso e Tibial Posterior (Triagem vascular)"
            ]
        },
        "contraindicacoes": "EVITAR: Materiais rígidos ou costuras internas salientes nas palmilhas. NÃO realizar manipulações articulares agressivas se houver sinal de Artropatia de Charcot.",
        "intervencoes": [
            {
                "categoria": "Órteses Podais (Palmilhas)",
                "nivel_evidencia": "Nível A",
                "tipo": "Palmilhas de Acomodação Total (Total Contact Orthotics)",
                "descricao": "Palmilhas multicamadas (EVA + Plastazote) para distribuir a pressão por toda a superfície.",
                "conduta_sugerida": "Uso de materiais de memória (lentos) para moldagem progressiva. Checagem mensal de zonas de desgaste.",
                "tamanho_efeito": "Redução drástica na taxa de amputação e re-ulceração.",
                "dosagem": { "info": "Uso em calçados terapêuticos de volume extra." }
            }
        ]
    },
    {
        "id": "GTPS_01",
        "patologia": "Síndrome da Dor Trocantérica (Tendinopatia Glútea)",
        "regiao": "Quadril",
        "ultima_atualizacao": "2025-01-31",
        "base_conhecimento": [
            {
                "titulo": "Education plus exercise versus corticosteroid injection (LEAP Trial)",
                "tipo_estudo": "Ensaio Clínico Randomizado",
                "autor": "Mellor R et al. (BMJ)",
                "ano": "2018",
                "nota_qualidade": "PEDro 9/10",
                "doi_link": "https://doi.org/10.1136/bmj.k1662",
                "resumo_educativo": "A fisioterapia focada em educação para evitar compressão e carregamento gradual foi superior a injeções de corticoide em 1 ano. A tendinopatia glútea é uma lesão por COMPRESSÃO lateral.",
                "pontos_chave": [
                    "Evitar adução excessiva (cruzar pernas em pé ou sentada)",
                    "Dormir com travesseiro entre os joelhos para neutralizar a adução",
                    "Exercícios isométricos iniciais reduzem a dor por efeito analgésico cortical",
                    "Foot orthoses podem ajudar reduzindo a adução dinâmica durante a marcha"
                ]
            }
        ],
        "resumo_clinico": "Dor na face lateral do quadril envolvendo os tendões do glúteo médio e mínimo. O foco clínico é tirar a 'tensão de compressão' e restaurar a 'capacidade de carga'.",
        "diagnostico": {
            "testes_recomendados": [
                "Single Leg Stance (30s): Dispara dor lateral se houver tendinopatia",
                "FADIR em carga ou descarga: Posição de compressão máxima",
                "Palpação do Trocânter Maior (Sensibilidade alta)",
                "Avaliação do 'Dynamic Valgus' via Baropodometria ou Vídeo"
            ]
        },
        "prognostico": {
            "fatores_risco_cronificacao": [
                "Hábito de dormir sobre o lado afetado sem proteção",
                "Fraqueza acentuada de Core (falha no controle de tronco)"
            ],
            "expectativa_recuperacao": "Melhora funcional significativa em 8-12 semanas de reabilitação focada."
        },
        "contraindicacoes": "EVITAR: Alongamento de glúteo em adução máxima (ex: posição de pombo). NÃO utilizar calor profundo (ondas curtas) sobre proeminências ósseas agudas sem critério.",
        "intervencoes": [
            {
                "categoria": "Educação em Saúde",
                "nivel_evidencia": "Nível A",
                "tipo": "Higiene Postural e Gestão de Compressão",
                "descricao": "Modificação das atividades diárias para remover estresse compressivo.",
                "conduta_sugerida": "Dormir com travesseiro espesso entre pernas; não cruzar pernas; evitar ficar em pé 'encostada' em um dos quadris.",
                "tamanho_efeito": "Redução drástica de dor noturna."
            },
            {
                "categoria": "Órteses Podais (Palmilhas)",
                "nivel_evidencia": "Nível B (Suporte Proximal)",
                "recomendacao": "CAN",
                "tipo": "Palmilhas de Controle de Drop Pélvico",
                "descricao": "Uso de suporte de arco para evitar a queda pélvica contralateral (Trendelenburg).",
                "conduta_sugerida": "Apoio de arco medial para reduzir o colapso do pé que induz a adução do quadril durante a fase de apoio.",
                "tamanho_efeito": "Melhora no conforto durante caminhadas longas."
            }
        ]
    },
    {
        "id": "HIP_FAI_01",
        "patologia": "Impacto Femoroacetabular (IFA)",
        "regiao": "Quadril",
        "ultima_atualizacao": "2025-01-31",
        "base_conhecimento": [
            {
                "titulo": "Warwick Agreement on FAI Syndrome",
                "tipo_estudo": "Consenso Internacional",
                "autor": "Griffin DR et al. (BJSM)",
                "ano": "2016",
                "nota_qualidade": "Referência Mundial",
                "doi_link": "https://bjsm.bmj.com/content/50/19/1169",
                "resumo_educativo": "O diagnóstico exige tríade: sintomas, sinais clínicos e imagem compatível. O tratamento deve ser conservador inicialmente, focado no controle motor.",
                "pontos_chave": [
                    "Achados de imagem (CAM/Pincer) são comuns em assintomáticos",
                    "Fisioterapia deve focar no controle da cabeça femoral no centro do acetábulo",
                    "Evitar movimentos extremos de flexão e rotação interna dolorsos"
                ]
            }
        ],
        "resumo_clinico": "Conflito mecânico entre o fêmur e o acetábulo. Pode levar à lesão de labrum e osteoartrose precoce se não for gerido corretamente.",
        "diagnostico": {
            "testes_recomendados": [
                "Teste FADIR (Flexion-Adduction-Internal Rotation)",
                "Teste FABER (Flexion-Abduction-External Rotation): Diferencial para sacroilíaca",
                "Avaliação de força muscular profunda do quadril"
            ],
            "questionarios": [
                "iHOT-33 (International Hip Outcome Tool)",
                "HAGOS (Copenhagen Hip and Groin Outcome Score)"
            ]
        },
        "prognostico": {
            "fatores_risco_cronificacao": [
                "Prática de esportes com pivots repetitivos e alta flexão (Futebol, Karate)",
                "Presença de osteoartrose de quadril já instalada"
            ],
            "expectativa_recuperacao": "Estabilização de sintomas em 3-4 meses de tratamento focado."
        },
        "contraindicacoes": "EVITAR: Mobilizações articulares agressivas no fim da amplitude de flexão/RI. NÃO forçar o agachamento profundo se houver bloqueio ósseo perceptível.",
        "intervencoes": [
            {
                "categoria": "Exercício Terapêutico",
                "nivel_evidencia": "Nível B",
                "tipo": "Controle Motor Hip-Core e Fortalecimento Glúteo",
                "descricao": "Exercícios para melhorar a estabilidade lombo-pélvica e centralização femoral.",
                "conduta_sugerida": "Isometria de rotadores externos e fortalecimento de glúteo máximo e médio em amplitudes seguras.",
                "tamanho_efeito": "Melhora na função subjetiva do quadril."
            }
        ]
    },
    {
        "id": "SPINE_ACUTE_01",
        "patologia": "Dor Lombar Aguda / Ciatalgia",
        "regiao": "Coluna Lombar",
        "ultima_atualizacao": "2025-01-20",
        "base_conhecimento": [
            {
                "titulo": "Noninvasive Treatments for Acute Low Back Pain",
                "tipo_estudo": "Revisão Sistemática / Guideline",
                "autor": "Qaseem A et al. (Annals of Internal Medicine)",
                "ano": "2017",
                "nota_qualidade": "Padrão Ouro",
                "doi_link": "https://doi.org/10.7326/M16-2367",
                "resumo_educativo": "A maioria das crises agudas melhora espontaneamente. Calor local, massagem e acupuntura são preferíveis a fármacos.",
                "pontos_chave": [
                    "Evitar repouso no leito",
                    "Educar sobre a benignidade do quadro",
                    "AINEs apenas se necessário, evitar opioides"
                ]
            }
        ],
        "resumo_clinico": "Crise de dor súbita. O objetivo é reduzir o medo, modular a dor e manter o paciente ativo.",
        "intervencoes": [
            {
                "categoria": "Educação",
                "nivel_evidencia": "Nível A",
                "tipo": "Tranquilização (Reassurance)",
                "descricao": "Explicar que a dor não significa lesão grave permanente.",
                "conduta_sugerida": "Desmistificar o 'disco deslocado'.",
                "prognostico": "90% de melhora em 4 semanas."
            }
        ]
    },
    {
        "id": "SPINE_HEADACHE_01",
        "patologia": "Cefaleia Cervicogênica",
        "regiao": "Coluna Cervical",
        "ultima_atualizacao": "2025-01-20",
        "base_conhecimento": [
            {
                "titulo": "Clinical Practice Guidelines: Neck Pain with Headache",
                "tipo_estudo": "Guideline JOSPT",
                "autor": "Blanpied PR et al.",
                "ano": "2017",
                "nota_qualidade": "Nível A",
                "doi_link": "https://www.jospt.org/doi/10.2519/jospt.2017.0302",
                "resumo_educativo": "Dor de cabeça que provém do pescoço. Manipulação e exercícios de flexores profundos são as melhores escolhas.",
                "pontos_chave": [
                    "Sintomas unilaterais",
                    "Melhora com mobilização de C1-C2"
                ]
            }
        ],
        "resumo_clinico": "Cefaleia referida da coluna cervical superior.",
        "intervencoes": [
            {
                "categoria": "Terapia Manual",
                "nivel_evidencia": "Nível A",
                "tipo": "Mobilização C1-C2 (SNAGs)",
                "descricao": "Técnicas de Mulligan para ganho de rotação.",
                "conduta_sugerida": "Teste de Flexão-Rotação deve ser positivo."
            }
        ]
    },
    {
        "id": "UE_CTS_01",
        "patologia": "Síndrome do Túnel do Carpo",
        "regiao": "Membro Superior",
        "ultima_atualizacao": "2025-01-20",
        "base_conhecimento": [
            {
                "titulo": "Physical Therapy for Carpal Tunnel Syndrome",
                "tipo_estudo": "Guideline JOSPT",
                "autor": "Erickson M et al.",
                "ano": "2019",
                "nota_qualidade": "Nível A",
                "doi_link": "https://www.jospt.org/doi/10.2519/jospt.2019.0301",
                "resumo_educativo": "O uso de órtese noturna e mobilização do nervo mediano são fundamentais.",
                "pontos_chave": [
                    "Órtese em posição neutra",
                    "Deslizamento neural deve ser indolor"
                ]
            }
        ],
        "resumo_clinico": "Compressão do nervo mediano. Parestesia em território específico.",
        "intervencoes": [
            {
                "categoria": "Terapia Manual",
                "nivel_evidencia": "Nível B",
                "tipo": "Mobilização de Nervo Mediano (Sliders)",
                "descricao": "Técnicas de neurodinâmica.",
                "conduta_sugerida": "Realizar sem reproduzir parestesia intensa."
            }
        ]
    },
    {
        "id": "UE_LE_01",
        "patologia": "Epicondilalgia Lateral (Tennis Elbow)",
        "regiao": "Membro Superior",
        "ultima_atualizacao": "2025-01-31",
        "base_conhecimento": [
            {
                "titulo": "Management of Lateral Elbow Tendinopathy (Systematic Review)",
                "tipo_estudo": "Revisão Sistemática / Metanálise",
                "autor": "Coombes BK et al.",
                "ano": "2015",
                "nota_qualidade": "PEDro 9/10",
                "doi_link": "https://pubmed.ncbi.nlm.nih.gov/25562772/",
                "resumo_educativo": "A infiltração de corticoide apresenta alívio a curto prazo mas é superiormente pior que a 'espera vigilante' ou fisioterapia a longo prazo (52 semanas), com altas taxas de recorrência.",
                "pontos_chave": [
                    "Isometria: Redução imediata de dor (Effect Size: 0.6)",
                    "Fortalecimento Isotônico: Chave para remuneração de carga (Effect Size: 0.82)",
                    "Mobilização com movimento (Mulligan) para ganho de força livre de dor"
                ]
            }
        ],
        "resumo_clinico": "Tendinopatia degenerativa (angiofibroblástica) da origem comum dos extensores, primariamente o ECRB.",
        "contraindicacoes": "EVITAR infiltrações repetidas de corticoide (risco de atrofia e falha na cicatrização do tendão) e repouso absoluto prolongado.",
        "intervencoes": [
            {
                "categoria": "Exercício Terapêutico",
                "nivel_evidencia": "Nível A",
                "tipo": "Carga Progressiva de Extensores (Heavy Slow Resistance)",
                "descricao": "Treino de resistência lenta com carga moderada/alta.",
                "conduta_sugerida": "Começar com isometria (45s, 5 refs) se a dor for > 5/10. Evoluir para isotônico excêntrico-concêntrico.",
                "dosagem": { "frequencia": "3x por semana", "intensidade": "70-80% 1RM" }
            },
            {
                "categoria": "Terapia Manual",
                "nivel_evidencia": "Nível B",
                "tipo": "Mobilização com Movimento (MWM)",
                "descricao": "Deslizamento lateral sustentado enquanto o paciente realiza preensão palmar.",
                "conduta_sugerida": "Deve resultar em aumento imediato da força de preensão sem dor."
            }
        ]
    },
    {
        "id": "UE_DQ_01",
        "patologia": "Tenossinovite de De Quervain",
        "regiao": "Membro Superior",
        "ultima_atualizacao": "2025-01-31",
        "base_conhecimento": [
            {
                "titulo": "Surgical versus non-surgical treatment for De Quervain's",
                "tipo_estudo": "Cochrane Review",
                "autor": "Peters-Veluthamaningal C et al.",
                "ano": "2014",
                "nota_qualidade": "Nível A",
                "doi_link": "https://pubmed.ncbi.nlm.nih.gov/24435728/",
                "resumo_educativo": "A combinação de órtese e injeção de corticoide é eficaz, mas a fisioterapia com foco em mobilização tendínea e controle motor tem melhores resultados funcionais a longo prazo.",
                "pontos_chave": [
                    "Diagnóstico clínico via Teste de Finkelstein (Sensibilidade: 89%)",
                    "Reduzir desvio ulnar repetitivo associado à pinça"
                ]
            }
        ],
        "resumo_clinico": "Estenose inflamatória do primeiro compartimento extensor (EPB e APL).",
        "contraindicacoes": "EVITAR movimentos de pinça fina vigorosa e desvio ulnar forçado durante a fase aguda/reativa.",
        "intervencoes": [
            {
                "categoria": "Órtese",
                "nivel_evidencia": "Nível A",
                "tipo": "Órtese de Polegar Spica em Termoplástico",
                "descricao": "Imobilização da CMC e MCP do polegar, mantendo o punho em neutro.",
                "conduta_sugerida": "Uso contínuo por 2-4 semanas, removendo para higiene e exercícios leves.",
                "dosagem": { "tempo": "24h por dia (inicialmente)" }
            }
        ]
    },
    {
        "id": "TMD_01",
        "patologia": "Disfunção Temporomandibular (DTM)",
        "regiao": "Cabeça e Pescoço",
        "ultima_atualizacao": "2025-01-20",
        "base_conhecimento": [
            {
                "titulo": "Physical therapy for temporomandibular disorders",
                "tipo_estudo": "Revisão Sistemática",
                "autor": "Armijo-Olivo S et al.",
                "ano": "2016",
                "nota_qualidade": "Referência na área",
                "doi_link": "https://pubmed.ncbi.nlm.nih.gov/26735161/",
                "resumo_educativo": "Exercícios de coordenação da mandíbula e terapia manual cervical são eficazes para dor e abertura de boca.",
                "pontos_chave": [
                    "Avaliar hábitos parafuncionais (bruxismo)",
                    "Tratar a coluna cervical em conjunto"
                ]
            }
        ],
        "resumo_clinico": "Dor e disfunção nos músculos da mastigação e ATM.",
        "intervencoes": [
            {
                "categoria": "Exercício Terapêutico",
                "nivel_evidencia": "Nível B",
                "tipo": "Exercícios de Rocabado",
                "descricao": "Coordenação fono-articulatória e estabilização.",
                "conduta_sugerida": "Relaxamento da língua e abertura controlada."
            }
        ]
    },
    {
        "id": "CENTRAL_SENS_01",
        "patologia": "Sensibilização Central / Fibromialgia",
        "regiao": "Sistêmico / Coluna",
        "ultima_atualizacao": "2025-01-20",
        "base_conhecimento": [
            {
                "titulo": "Clinical Practice Guidelines: Pain Neuroscience Education",
                "tipo_estudo": "Consenso",
                "autor": "Louw A et al.",
                "ano": "2021",
                "nota_qualidade": "Nível A",
                "doi_link": "https://pubmed.ncbi.nlm.nih.gov/27351541/",
                "resumo_educativo": "O cérebro superinterpreta sinais de perigo. O tratamento deve ser baseado em educação, higiene do sono e exercício aeróbico gradual.",
                "pontos_chave": [
                    "A dor é real mas o tecido é saudável",
                    "Exercício aeróbico é o 'veneno' contra a dor crônica"
                ]
            }
        ],
        "resumo_clinico": "Dor difusa e hipersensibilidade crônica.",
        "intervencoes": [
            {
                "categoria": "Educação em Dor",
                "nivel_evidencia": "Nível A",
                "tipo": "Reconceituação da Dor",
                "descricao": "Explicar o sistema de alarme do corpo.",
                "conduta_sugerida": "Uso de metáforas (sistema de som com volume alto).",
                "prognostico": "Gestão a longo prazo com melhor qualidade de vida."
            }
        ]
    },
    {
        "id": "FLAGS_SYSTEM_01",
        "patologia": "Sistema de Triagem: Bandeiras (Red, Yellow, Blue, Black Flags)",
        "regiao": "Triagem Clínica / Sistêmico",
        "ultima_atualizacao": "2025-01-20",
        "base_conhecimento": [
            {
                "titulo": "International framework for red flags for potential serious spinal pathologies",
                "tipo_estudo": "Diretriz Clínica (IFOMPT Framework)",
                "autor": "Finucane S et al. (JOSPT)",
                "ano": "2020",
                "nota_qualidade": "Padrão Ouro Internacional",
                "doi_link": "https://www.jospt.org/doi/10.2519/jospt.2020.9971",
                "resumo_educativo": "As Red Flags são sinais de alerta para patologias graves como Síndrome da Cauda Equina, Fraturas, Tumores e Infecções. O framework da IFOMPT foca na 'tomada de decisão clínica' e não apenas em uma lista isolada de sintomas.",
                "pontos_chave": [
                    "Determinar o nível de preocupação (Baixo, Médio, Alto)",
                    "Urgência da referência médica conforme a gravidade",
                    "Atenção especial ao histórico de câncer e perda de peso inexplicada"
                ]
            },
            {
                "titulo": "Yellow Flags: Early identification of risk factors with STarT Back",
                "tipo_estudo": "Estudo de Diagnóstico/Prognóstico",
                "autor": "Hill JC et al. (The Lancet)",
                "ano": "2011",
                "nota_qualidade": "Evidência Alta",
                "doi_link": "https://doi.org/10.1016/S0140-6736(11)60935-1",
                "resumo_educativo": "Yellow Flags são fatores psicossociais (medo, catastrofização) que aumentam o risco de cronicidade. O uso do STarT Back Tool permite estratificar o cuidado de forma eficaz.",
                "pontos_chave": [
                    "Cinesiofobia (medo de se mover)",
                    "Catastrofização da dor",
                    "Baixa expectativa de recuperação"
                ]
            }
        ],
        "resumo_clinico": "O 'Flags System' é a ferramenta de triagem prioritária em fisioterapia. Bandeiras Vermelhas (Espinhais e Periféricas) indicam risco de vida ou perda de função grave; Bandeiras Amarelas indicam risco de cronicidade psicossocial; Bandeiras Azuis/Pretas indicam barreiras ocupacionais.",
        "intervencoes": [
            {
                "categoria": "Triagem (Prioridade 1)",
                "nivel_evidencia": "Nível A",
                "tipo": "Triagem de Red Flags Espinhais e Periféricas",
                "descricao": "Identificação de sinais de alerta para patologias orgânicas graves em qualquer articulação.",
                "conduta_sugerida": "Espinhal: Síndrome da Cauda Equina (incontinência, anestesia em sela). Periférica: Artrite Séptica (dor monoarticular aguda, febre, calor local excessivo), Fraturas (trauma grave, incapacidade de carga - Ottawa Rules), Malignidade (histórico de câncer, dor noturna incessante, perda de peso).",
                "prognostico": "Referência imediata para evitar danos irreversíveis ou risco de vida."
            },
            {
                "categoria": "Prognóstico (Prioridade 2)",
                "nivel_evidencia": "Nível A",
                "tipo": "Triagem de Yellow Flags (Psicossociais)",
                "descricao": "Fatores cognitivos e afetivos que influenciam a percepção da dor.",
                "conduta_sugerida": "Aplicar TSK-11 (Kinesiophobia) ou STarT Back. Uso de Educação em Neurociência da Dor de forma precoce.",
                "prognostico": "Identificação precoce reduz em 50% o risco de incapacidade permanente."
            },
            {
                "categoria": "Retorno ao Trabalho (Prioridade 3)",
                "nivel_evidencia": "Nível B",
                "tipo": "Bandeiras Azuis e Pretas (Ocupacionais)",
                "descricao": "Percepção do ambiente de trabalho (Azul) e políticas de seguro/empresa (Preta).",
                "conduta_sugerida": "Avaliar se o paciente sente-se apoiado pelo superior e se há ergonomia adequada para retorno gradual.",
                "dosagem": { "frequencia": "Avaliação inicial e reavaliações mensais" }
            }
        ]
    },
    {
        "id": "LBP_TBC_01",
        "patologia": "Classificação Baseada em Subgrupos (TBC) e MSI - Coluna Lombar",
        "regiao": "Coluna Lombar",
        "ultima_atualizacao": "2025-01-31",
        "base_conhecimento": [
            {
                "titulo": "Primary Care for Patients With Low Back Pain (TBC System Update)",
                "tipo_estudo": "Diretriz Clínica / Framework",
                "autor": "Fritz JM, George SZ et al. (JOSPT)",
                "ano": "2015/2021",
                "nota_qualidade": "Padrão Ouro para Subgrupos",
                "doi_link": "https://www.jospt.org/doi/10.2519/jospt.2015.0503",
                "resumo_educativo": "Divide os pacientes em subgrupos de tratamento: Modulação de Sintomas (Manipulação/Tração), Controle de Movimento (Estabilização) e Otimização Funcional.",
                "pontos_chave": [
                    "Manipulação: Sintomas < 16 dias e sem sintomas abaixo do joelho",
                    "Estabilização: Pacientes jovens, hipermobilidade segmentar, falha no teste de estabilidade prona",
                    "Exercício Específico: Preferência direcional (Centralização)"
                ]
            },
            {
                "titulo": "Diagnosis and Treatment of Movement System Impairment Syndromes",
                "tipo_estudo": "Livro Texto (Referência)",
                "autor": "Shirley Sahrmann",
                "ano": "2011/2022",
                "nota_qualidade": "Referência em Controle Motor",
                "resumo_educativo": "Foca no diagnóstico das síndromes de dor baseadas em falhas de movimento. Na lombar: Síndrome de Extensão, Flexão, Rotação ou Rotação com Flexão/Extensão.",
                "pontos_chave": [
                    "Identificar o movimento que reproduz a dor durante tarefas funcionais",
                    "A dor é causada por microinstabilidade ou movimento excessivo em um segmento específico"
                ]
            },
            {
                "titulo": "Orthopaedic Examination, Evaluation, and Intervention",
                "tipo_estudo": "Livro Texto (Raciocínio Clínico)",
                "autor": "Mark Dutton",
                "ano": "2020",
                "nota_qualidade": "Referência em Diagnóstico",
                "resumo_educativo": "Integra a anatomia funcional com a tomada de decisão baseada em subgrupos e padrões de dor.",
                "pontos_chave": [
                    "Padrão de Dor: Centralização vs Periferização",
                    "Raciocínio de Cyriax integrado à evidência moderna"
                ]
            }
        ],
        "resumo_clinico": "A abordagem por subgrupos foca em 'quem' se beneficia de 'que' tratamento, ao invés de usar uma intervenção genérica.",
        "contraindicacoes": "EVITAR repouso absoluto no leito (relação direta com cronicidade) e o uso de recursos eletrofísicos (TENS/Calor) como única forma de tratamento.",
        "intervencoes": [
            {
                "categoria": "Triagem de Subgrupo (Prioritária)",
                "nivel_evidencia": "Nível A",
                "tipo": "Matching de Tratamento (TBC) e MSI",
                "descricao": "Identificação rápida do subgrupo dominante através de testes específicos.",
                "conduta_sugerida": "Subgrupo Manipulação: Thrust lombar ou mobilização Maitland IV. Subgrupo MSI: Corrigir alinhamento neutro durante a tarefa dolorosa (ex: sentar/levantar).",
                "prognostico": "Melhora de 50% na incapacidade (Oswestry) nas primeiras 4 semanas se o matching for correto."
            },
            {
                "categoria": "Avaliação Física (Functional)",
                "nivel_evidencia": "Nível B",
                "tipo": "Bateria de Testes Funcionais PBE",
                "descricao": "Conjunto de testes validados por Magee e Sahrmann.",
                "conduta_sugerida": "Realizar SLR (Neurodinâmica), PIT (Estabilidade) e Single Leg Stance (Avaliação de Trendelenburg e Estabilidade Pélvica).",
                "dosagem": { "frequencia": "Avaliação inicial e reavaliação a cada 5 sessões" }
            }
        ]
    },
    {
        "id": "KNEE_COMPREHENSIVE_01",
        "patologia": "Avaliação Avançada de Joelho (PBE + MSI)",
        "regiao": "Joelho",
        "ultima_atualizacao": "2025-01-31",
        "base_conhecimento": [
            {
                "titulo": "Patellofemoral Pain Clinical Practice Guidelines",
                "tipo_estudo": "Diretriz Clínica (CPG)",
                "autor": "Willy RW et al. (JOSPT)",
                "ano": "2019",
                "nota_qualidade": "Padrão Ouro",
                "resumo_educativo": "Prioriza o fortalecimento de quadril (glúteos) e joelho. Uso de órteses plantares se houver pronação excessiva.",
                "pontos_chave": [
                    "Teste de Step Down para avaliar valgo dinâmico",
                    "Treino de controle motor é essencial"
                ]
            },
            {
                "titulo": "MSI Syndromes of the Knee",
                "tipo_estudo": "Referência Sahrmann",
                "autor": "Shirley Sahrmann",
                "ano": "2022",
                "nota_qualidade": "Referência em Movimento",
                "resumo_educativo": "Identifica síndromes como Extensão Excessiva do Joelho (Hiperextensão) e Rotação Patelar.",
                "pontos_chave": [
                    "Avaliar o timing de ativação do quadríceps vs glúteo",
                    "Correção do valgo dinâmico em tarefas de única perna"
                ]
            }
        ],
        "resumo_clinico": "Integração de testes ortopédicos clássicos com análise biomecânica funcional.",
        "contraindicacoes": "EVITAR agachamentos profundos e saltos de alto impacto na fase inicial de dor patelofemoral reativa e repouso total sem ativação de quadríceps.",
        "intervencoes": [
            {
                "categoria": "Testes Funcionais",
                "nivel_evidencia": "Nível A",
                "tipo": "Bateria de Performance",
                "descricao": "Avaliação de controle dinâmico e equilíbrio.",
                "conduta_sugerida": "Aplicar Y-Balance Test (Equilíbrio dinâmico), Step Down Test (Timing glúteo) e Single Leg Squat.",
                "prognostico": "Identificação de déficits prediz risco de lesão em 70%."
            },
            {
                "categoria": "Exercício Terapêutico",
                "nivel_evidencia": "Nível A",
                "tipo": "Fortalecimento Proximal (Hip-Focus)",
                "descricao": "Foco em Glúteo Médio e Máximo para controlar o fêmur.",
                "conduta_sugerida": "Progressão de isometria para saltos controlados (Plyometrics) se o objetivo for retorno ao esporte."
            }
        ]
    },
    {
        "id": "SHOULDER_SAHRMANN_01",
        "patologia": "Discinese Escapular e Síndromes MSI do Ombro",
        "regiao": "Ombro",
        "ultima_atualizacao": "2025-01-31",
        "base_conhecimento": [
            {
                "titulo": "Scapular Dyskinesis and its relation to shoulder pain",
                "tipo_estudo": "Consenso",
                "autor": "Kibler WB et al.",
                "ano": "2013",
                "nota_qualidade": "Padrão Ouro para Escápula",
                "resumo_educativo": "Classifica a discinese em tipos (I, II, III). O SAT (Scapular Assistance Test) ajuda a diagnosticar se a dor diminui com a assistência mecânica.",
                "pontos_chave": [
                    "Teste de Assistência Escapular (SAT)",
                    "Teste de Retração Escapular (SRT)"
                ]
            },
            {
                "titulo": "Movement System Impairment Syndromes of the Shoulder",
                "tipo_estudo": "Livro Texto",
                "autor": "Shirley Sahrmann",
                "ano": "2011",
                "nota_qualidade": "Alta",
                "resumo_educativo": "Foca na Escápula Alada, Rotação Inferior Excessiva e Depressão Escapular.",
                "pontos_chave": [
                    "Observação do ritmo escapuloumeral na fase descendente de elevação"
                ]
            }
        ],
        "resumo_clinico": "A dor no ombro é frequentemente o resultado de um controle escapular ineficiente (Base estável).",
        "intervencoes": [
            {
                "categoria": "Terapia Manual e Funcional",
                "nivel_evidencia": "Nível B",
                "tipo": "Correção de Ritmo Escápulo-Umeral",
                "descricao": "Exercícios de conscientização e ativação do Serrato Anterior e Trapézio Inferior.",
                "conduta_sugerida": "Wall Slide, Push-up Plus e exercícios de 'Serratus Punch'.",
                "prognostico": "Melhora na função em 6 semanas de treino específico."
            }
        ]
    },
    {
        "id": "ANKLE_SPRAIN_01",
        "patologia": "Entorse Lateral de Tornozelo / Instabilidade Crônica",
        "regiao": "Pé e Tornozelo",
        "ultima_atualizacao": "2025-01-31",
        "base_conhecimento": [
            {
                "titulo": "Lateral Ankle Sprain: Revision 2021 Clinical Practice Guidelines",
                "tipo_estudo": "Diretriz Clínica (CPG)",
                "autor": "Martin RL et al. (JOSPT)",
                "ano": "2021",
                "nota_qualidade": "Nível A",
                "doi_link": "https://www.jospt.org/doi/10.2519/jospt.2021.0302",
                "resumo_educativo": "Recomenda mobilização precoce, terapia manual e exercício proprioceptivo. Alerta para o alto risco de recorrência se a reabilitação for incompleta.",
                "pontos_chave": [
                    "Ottawa Ankle Rules para triagem de fratura",
                    "Terapia manual (mobilização com movimento) melhora ADM de dorsiflexão",
                    "Exercícios de equilíbrio são fundamentais para prevenir CAI"
                ]
            },
            {
                "titulo": "Effectiveness of foot orthoses for chronic ankle instability: a systematic review",
                "tipo_estudo": "Revisão Sistemática",
                "autor": "Various (published in 2023)",
                "ano": "2023",
                "nota_qualidade": "Alta (Evidência Recente)",
                "doi_link": "https://doi.org/10.1186/s13047-023-00650-x",
                "resumo_educativo": "Palmilhas melhoram o controle postural e diminuem o risco de entorses recorrentes através de feedback sensorial e suporte mecânico.",
                "pontos_chave": [
                    "Melhora significativa no equilíbrio dinâmico e alcance (Y-Balance)",
                    "Redução da ativação excessiva de tibial anterior em repouso",
                    "Controle de inversão excessiva"
                ],
                "analise_antispin": "Embora a diretriz de 2021 diga para não usar órteses como tratamento 'isolado', a evidência de 2023 mostra que elas são um acelerador potente da estabilidade quando combinadas com exercícios proprioceptivos."
            }
        ],
        "resumo_clinico": "Lesão ligamentar (LFA/LFC). O maior desafio é a transição da fase aguda para a Instabilidade Crônica do Tornozelo (CAI). O tratamento deve focar em controle motor e estabilidade mecânica.",
        "diagnostico": {
            "testes_recomendados": [
                "Ottawa Ankle Rules: Para excluir fraturas (100% sensibilidade)",
                "Anterior Drawer Test: Avalia integridade do LFA",
                "Talar Tilt Test: Avalia integridade do LFC",
                "Weight-Bearing Lunge Test: Avalia restrição de dorsiflexão"
            ],
            "questionarios": [
                "FAAM (Foot and Ankle Ability Measure)",
                "CAIT (Cumberland Ankle Instability Tool): Padrão para CAI"
            ]
        },
        "prognostico": {
            "fatores_risco_cronificacao": [
                "Histórico de entorses prévios (principal preditor)",
                "Incapacidade de realizar carga em 48h",
                "Déficit persistente de equilíbrio unipodal aos 15 dias"
            ],
            "expectativa_recuperacao": "Entorse Grau I: 1-2 semanas; Grau II: 4-6 semanas; Grau III: 8-12 semanas. Proteção mecânica é vital no primeiro mês."
        },
        "contraindicacoes": "EVITAR: Imobilização prolongada (gesso) sem carga (induz rigidez e atrofia). NÃO ignorar o déficit de dorsiflexão, que é preditor de novos entorses.",
        "intervencoes": [
            {
                "categoria": "Órteses Podais (Palmilhas)",
                "nivel_evidencia": "Nível B (Forte suporte clínico)",
                "recomendacao": "MUST",
                "tipo": "Palmilhas Sensoriais e de Estabilidade",
                "descricao": "Uso de palmilhas para aumentar o feedback proprioceptivo e controlar a inversão mecânica.",
                "conduta_sugerida": "Palmilha com barra metatarsal ou suporte de arco para aumentar a superfície de contato e aferência sensorial. Eficaz para reduzir a oscilação do centro de pressão (CoP).",
                "tamanho_efeito": "Redução significativa na taxa de recorrência em atletas (Referência: 2023 Reviews)."
            },
            {
                "categoria": "Propriocepção e Equilíbrio",
                "nivel_evidencia": "Nível A",
                "tipo": "Treino Sensoriomotor em Superfícies Instáveis",
                "descricao": "Progressão de apoio unipodal -> Disco de equilíbrio -> Atividades funcionais com olhos fechados.",
                "conduta_sugerida": "Mínimo 10 min por sessão. O foco deve ser a reeducação do peroneu lateral curto/longo.",
                "tamanho_efeito": "NNT = 5 para prevenção de novos episódios."
            }
        ]
    },
    {
        "id": "PLANTAR_FASCIITIS_01",
        "patologia": "Fascite Plantar / Fasciopatia Plantar",
        "regiao": "Pé e Tornozelo",
        "ultima_atualizacao": "2025-01-31",
        "base_conhecimento": [
            {
                "titulo": "Heel Pain—Plantar Fasciitis: Revision 2023 Clinical Practice Guidelines",
                "tipo_estudo": "Diretriz Clínica (CPG)",
                "autor": "Schneider HP et al. (JOSPT)",
                "ano": "2023",
                "nota_qualidade": "Padrão Ouro Atualizado",
                "doi_link": "https://www.jospt.org/doi/10.2519/jospt.2023.0301",
                "resumo_educativo": "Fascite plantar é uma condição degenerativa, não inflamatória. Recomenda fortemente foot orthoses (pre-fab ou customizadas) e alongamentos de fascia/gastrocnêmio.",
                "pontos_chave": [
                    "Dor ao primeiro passo pela manhã é o sinal patognomônico",
                    "Alongamento de fascia plantar tem efeito superior no curto prazo",
                    "Night Splints recomendados para dor matinal persistente"
                ]
            },
            {
                "titulo": "Custom-made foot orthoses for the treatment of foot pain (Cochrane Review)",
                "tipo_estudo": "Revisão Sistemática Cochrane",
                "autor": "Hawke F et al.",
                "ano": "2022",
                "nota_qualidade": "Qualidade Máxima",
                "doi_link": "https://doi.org/10.1002/14651858.CD006801.pub3",
                "resumo_educativo": "Palmilhas customizadas reduzem significativamente a dor nos pés em diversas condições, incluindo fasciopatia.",
                "pontos_chave": [
                    "Melhora da função física em 3 e 12 meses",
                    "Redução da pressão plantar máxima no calcanhar",
                    "Eficácia superior quando combinada com exercícios"
                ],
                "analise_antispin": "A Cochrane destaca que não há diferença gigante entre pre-fab e customizada *em média*, mas o conforto individual dita a adesão, e palmilhas customizadas tendem a ter maior taxa de uso contínuo."
            }
        ],
        "resumo_clinico": "Degeneração da fascia plantar no tubérculo medial do calcâneo. Frequentemente associada a déficit de dorsiflexão e IMC elevado. Tratamento focado em redução de carga de tração e suporte de arco.",
        "diagnostico": {
            "testes_recomendados": [
                "Palpação do tubérculo medial do calcâneo: Sensibilidade altíssima",
                "Windlass Test: Específico para tensão de fascia",
                "Avaliação do FPI (Foot Posture Index): Para guiar prescrição de palmilha",
                "Teste de força de flexores curtos dos dedos"
            ],
            "questionarios": [
                "FAAM (Subescala de atividades de vida diária)",
                "FHSQ (Foot Health Status Questionnaire)"
            ]
        },
        "prognostico": {
            "fatores_risco_cronificacao": [
                "IMC > 30 (forte correlação)",
                "Déficit de dorsiflexão do tornozelo (< 10º)",
                "Atividades ocupacionais com longos períodos em pé em superfícies rígidas",
                "Presença de esporão de calcâneo (marcador de cronicidade)"
            ],
            "expectativa_recuperacao": "Resolução lenta. 80% dos casos melhoram em 12 meses, mas 20% podem cronificar se a carga mecânica não for controlada."
        },
        "contraindicacoes": "EVITAR: Injeções repetitivas de corticoides (risco de ruptura da fascia e atrofia do coxim gorduroso). NÃO prescrever repouso absoluto, pois piora a rigidez matinal.",
        "intervencoes": [
            {
                "categoria": "Órteses Podais (Palmilhas)",
                "nivel_evidencia": "Nível A (Forte - JOSPT 2023)",
                "recomendacao": "MUST",
                "tipo": "Palmilhas de Suporte de Arco Medial e Amortecimento",
                "descricao": "Uso de palmilhas para distribuir a pressão plantar e reduzir a tensão na fáscia.",
                "conduta_sugerida": "Suporte de arco longitudinal medial para reduzir a deformação da fáscia durante a fase de apoio. Pode-se usar 'calcanheira' vazada se houver sensibilidade pontual extrema.",
                "tamanho_efeito": "Redução de dor clinicamente significativa em 2 a 12 semanas (Efeito superior no médio prazo)."
            },
            {
                "categoria": "Exercício Terapêutico",
                "nivel_evidencia": "Nível A",
                "tipo": "Alongamento Específico de Fascia e Gastrocnêmio",
                "descricao": "Protocolo de alongamento sustentado com dorsiflexão de hálux (Windlass position).",
                "conduta_sugerida": "3-10 repetições de 30 segundos, 3x ao dia. Fundamental para dor ao primeiro passo.",
                "tamanho_efeito": "Redução imediata de dor matinal em 50% dos pacientes."
            }
        ]
    }
];



export function getProtocolOptions() {
    return CLINICAL_PROTOCOLS.map(p => ({
        id: p.id,
        label: p.patologia
    }));
}

export function formatProtocolToReport(protocol: typeof CLINICAL_PROTOCOLS[0]) {
    let text = `## Protocolo Clínico: ${protocol.patologia}\n`;
    text += `**Região:** ${protocol.regiao}\n`;
    text += `**Atualização:** ${protocol.ultima_atualizacao}\n\n`;

    // Tratamento das Referências Ricas
    text += `### Base de Conhecimento (Evidências):\n`;
    protocol.base_conhecimento.forEach(ref => {
        text += `- **${ref.titulo}**\n`;
        text += `  *${ref.tipo_estudo} - ${ref.autor} (${ref.ano})*\n`;
        text += `  Nota: ${ref.nota_qualidade}\n`;
        text += `  > ${ref.resumo_educativo}\n`; // Blockquote para resumo
        if (ref.pontos_chave && ref.pontos_chave.length > 0) {
            text += `  Pontos-chave: ${ref.pontos_chave.join("; ")}\n`;
        }
        text += `\n`;
    });

    text += `**Resumo Clínico:**\n${protocol.resumo_clinico}\n\n`;

    if ((protocol as any).contraindicacoes) {
        text += `> <span style="color: #e11d48; font-weight: bold;">⚠️ CONTRAINDICAÇÕES / O QUE EVITAR:</span>\n`;
        text += `> <span style="color: #e11d48;">${(protocol as any).contraindicacoes}</span>\n\n`;
    }

    text += `### Intervenções Recomendadas:\n`;
    protocol.intervencoes.forEach(intervention => {
        text += `- **${intervention.tipo}** (${intervention.categoria} - Evidência: ${intervention.nivel_evidencia})\n`;
        text += `  - Descrição: ${intervention.descricao}\n`;
        text += `  - Conduta: ${intervention.conduta_sugerida}\n`;
        if ((intervention as any).dosagem) {
            const doseStr = Object.entries((intervention as any).dosagem).map(([k, v]) => `${k}: ${v}`).join(' | ');
            text += `  - Dosagem: ${doseStr}\n`;
        }
        if ((intervention as any).prognostico) {
            text += `  - Prognóstico: ${(intervention as any).prognostico}\n`;
        }
        text += `\n`;
    });

    return text;
}
