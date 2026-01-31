
export const CLINICAL_PROTOCOLS = [
    {
        "id": "LBP_CHRONIC_01",
        "patologia": "Dor Lombar Crônica (Não Específica)",
        "regiao": "Coluna Lombar",
        "ultima_atualizacao": "2025-01-20",
        "base_conhecimento": [
            {
                "titulo": "Clinical Practice Guidelines: Low Back Pain",
                "tipo_estudo": "Diretriz Clínica (CPG)",
                "autor": "George SZ et al. (JOSPT)",
                "ano": "2021",
                "nota_qualidade": "Nível A (Ouro)",
                "doi_link": "https://www.jospt.org/doi/10.2519/jospt.2021.0304",
                "resumo_educativo": "Foco em exercício terapêutico e abordagem biopsicossocial. Desencoraja exames de imagem precoces e repouso.",
                "pontos_chave": [
                    "Classificação por fatores de risco (STarT Back Tool)",
                    "A educação em dor reduz a catastrofização",
                    "Exercícios de alta carga são seguros se progredidos adequadamente"
                ]
            }
        ],
        "resumo_clinico": "Condição multifatorial onde fatores psicossociais (medo, cinesiofobia) predizem o resultado melhor que a anatomia. O tratamento deve ser ativo.",
        "intervencoes": [
            {
                "categoria": "Avaliação e Prognóstico",
                "nivel_evidencia": "Nível A",
                "tipo": "Triagem Biopsicossocial",
                "descricao": "Identificação de Yellow Flags (fatores psicológicos) e Red Flags.",
                "conduta_sugerida": "Aplicar Questionário Roland-Morris ou Oswestry para funcionalidade e STarT Back para prognóstico.",
                "prognostico": "80% dos pacientes apresentam melhora significativa em 6 semanas, mas 30% podem ter recorrências leves se cessarem os exercícios."
            },
            {
                "categoria": "Exercício Terapêutico",
                "nivel_evidencia": "Nível A",
                "tipo": "Exposição Gradual e Fortalecimento",
                "descricao": "Exercícios de controle motor, Pilares e fortalecimento global.",
                "conduta_sugerida": "Progressão de ativação isolada para movimentos funcionais (Deadlift, Squat) e aeróbico.",
                "dosagem": {
                    "frequencia": "2-3x semana",
                    "intensidade": "Moderada (Escala de Borg 6-7)"
                }
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
            }
        ],
        "resumo_clinico": "Foco na restauração da artrocinemática cervical e torácica, seguida de resistência muscular dos flexores profundos e estabilizadores de escápula.",
        "intervencoes": [
            {
                "categoria": "Avaliação",
                "nivel_evidencia": "Nível A",
                "tipo": "Classificação Baseada em Sintomas",
                "descricao": "Diferenciar entre mobilidade, cefaleia cervicogênica ou radiculopatia.",
                "conduta_sugerida": "Teste de Flexão-Rotação (C1-C2) e Teste de Flexores Profundos (CCF Test).",
                "prognostico": "Alta taxa de resolução em 4-8 semanas com terapia multimodal."
            },
            {
                "categoria": "Terapia Manual",
                "nivel_evidencia": "Nível B",
                "tipo": "Manipulação Torácica e Cervical",
                "descricao": "Mobilização PA centrais e técnicas de Thrust (quando seguro).",
                "conduta_sugerida": "Iniciar com manipulação torácica alta para reduzir sintomas cervicais sem estresse local imediato."
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
            }
        ],
        "resumo_clinico": "Doença degenerativa que responde excepcionalmente ao fortalecimento muscular. A cirurgia (prótese) deve ser o último recurso após falha do tratamento conservador por 6 meses.",
        "intervencoes": [
            {
                "categoria": "Avaliação funcional",
                "nivel_evidencia": "Nível A",
                "tipo": "Testes Clínicos",
                "descricao": "Monitoramento da capacidade de carga e mobilidade.",
                "conduta_sugerida": "Teste da Caminhada de 6 minutos, TUG (Timed Up and Go) e Escala WOMAC.",
                "prognostico": "Tratamento conservador reduz a necessidade de cirurgia em até 60% dos casos moderados."
            },
            {
                "categoria": "Exercício Terapêutico",
                "nivel_evidencia": "Nível A",
                "tipo": "Fortalecimento de Quadríceps e Glúteos",
                "descricao": "Foco em aumentar a estabilidade dinâmica e reduzir a pressão intra-articular.",
                "conduta_sugerida": "Agachamentos (ângulo de conforto), Leg Press e Cadeira Extensora (Isometria/Isotonia)."
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
            }
        ],
        "resumo_clinico": "Reabilitação dividida em fases. Foco inicial em extensão completa e controle de efusão. Progressão para hipertrofia, potência e retorno ao esporte (RTS) baseado em critérios funcionais.",
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
            }
        ],
        "resumo_clinico": "Frequentemente relacionada ao valgo dinâmico e déficit de força dos abdutores e rotadores externos do quadril. Tratamento focado em controle mecânico e reforço muscular.",
        "intervencoes": [
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
            }
        ],
        "resumo_clinico": "Patologia de carga. O tendão falha ao gerir estresse de tração. Reabilitação foca em aumentar a tolerância do tendão à carga.",
        "intervencoes": [
            {
                "categoria": "Exercício Terapêutico",
                "nivel_evidencia": "Nível A",
                "tipo": "Isometria Analgésica (Spanish Squat)",
                "descricao": "Contrações sustentadas de quadríceps.",
                "conduta_sugerida": "5 séries de 45 segundos, carga moderada, sem dor excessiva.",
                "dosagem": {
                    "frequencia": "Pode ser feito diariamente para alívio de dor."
                }
            },
            {
                "categoria": "Exercício Terapêutico",
                "nivel_evidencia": "Nível A",
                "tipo": "Heavy Slow Resistance (HSR)",
                "descricao": "Exercícios isotônicos lentos (3s fase concêntrica, 3s fase excêntrica).",
                "conduta_sugerida": "Leg Press ou Agachamento com carga alta (>70% 1RM) e velocidade controlada.",
                "dosagem": {
                    "frequencia": "3x por semana (dias alternados)"
                },
                "prognostico": "Lento. Esperar 12 semanas para mudanças estruturais significativas no tendão."
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
                "titulo": "Surgery versus Physical Therapy for a Meniscal Tear (METEOR Trial)",
                "tipo_estudo": "Ensaio Clínico Randomizado (RCT)",
                "autor": "Katz JN et al. (NEJM)",
                "ano": "2013",
                "nota_qualidade": "PEDro 9/10",
                "doi_link": "https://www.nejm.org/doi/full/10.1056/NEJMoa1301408",
                "resumo_educativo": "Provou que em pacientes com mais de 45 anos com lesões degenerativas, a fisioterapia é tão eficaz quanto a meniscectomia em 1 ano.",
                "pontos_chave": [
                    "Evitar cirurgias desnecessárias em meniscos degenerativos",
                    "O exercício melhora a função e protege contra OA secundária"
                ]
            }
        ],
        "resumo_clinico": "Comum em pacientes de meia-idade. O foco deve ser o controle de sintomas e fortalecimento periarticular.",
        "intervencoes": [
            {
                "categoria": "Exercício Terapêutico",
                "nivel_evidencia": "Nível A",
                "tipo": "Fortalecimento Progressivo",
                "descricao": "Reforço de Quadríceps e Isquiotibiais.",
                "conduta_sugerida": "Foco em controle de valgo e força de extensão.",
                "dosagem": {
                    "frequencia": "3x por semana",
                    "periodo": "Mínimo 12 semanas antes de reavaliar necessidade cirúrgica"
                },
                "prognostico": "Muito bom. A maioria dos pacientes evita cirurgia com tratamento conservador adequado."
            }
        ]
    },
    {
        "id": "SHOULDER_RCRSP_01",
        "patologia": "Dor Relacionada ao Manguito Rotador (RCRSP)",
        "regiao": "Ombro",
        "ultima_atualizacao": "2025-01-20",
        "base_conhecimento": [
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
                ]
            }
        ],
        "resumo_clinico": "Termo moderno para 'Bursite/Tendinite'. A dor vem da fraqueza/sobrecarga dos tendões, não do 'osso raspando'.",
        "intervencoes": [
            {
                "categoria": "Exercício Terapêutico",
                "nivel_evidencia": "Nível A (Ouro)",
                "tipo": "Carga Progressiva do Manguito e Escápula",
                "descricao": "Fortalecimento específico com foco em capacidade de carga.",
                "conduta_sugerida": "Exercícios simples de carga (abdução/rotação) tolerando dor leve (<3/10).",
                "dosagem": {
                    "frequencia": "1x ao dia ou dias alternados",
                    "duracao": "Mínimo 12 semanas"
                },
                "prognostico": "Boa evolução em 3 meses de protocolo ativo."
            }
        ]
    },
    {
        "id": "SHOULDER_FROZEN_01",
        "patologia": "Capsulite Adesiva (Ombro Congelado)",
        "regiao": "Ombro",
        "ultima_atualizacao": "2025-01-20",
        "base_conhecimento": [
            {
                "titulo": "Adhesive Capsulitis: Clinical Practice Guidelines",
                "tipo_estudo": "Diretriz Clínica (CPG)",
                "autor": "Kelley MJ et al. (JOSPT)",
                "ano": "2013",
                "nota_qualidade": "Nível A",
                "doi_link": "https://www.jospt.org/doi/10.2519/jospt.2013.0302",
                "resumo_educativo": "O tratamento depende da fase de irritabilidade. Alongamento agressivo na fase inflamatória agrava o quadro.",
                "pontos_chave": [
                    "Fase de alta irritabilidade: Educar, evitar calor excessivo, mobilização suave",
                    "Injeções de corticoide são eficazes para dor a curto prazo",
                    "Fase de baixa irritabilidade: Estiramento prolongado e mobilização grau III/IV"
                ]
            }
        ],
        "resumo_clinico": "Condição inflamatória e fibrótica da cápsula articular. Caracterizada por perda progressiva de ADM, especialmente rotação externa.",
        "intervencoes": [
            {
                "categoria": "Terapia Manual",
                "nivel_evidencia": "Nível B",
                "tipo": "Mobilização Articular",
                "descricao": "Baseada na fase de irritabilidade.",
                "conduta_sugerida": "Técnicas de Maitland ou Mulligan para ganho de espaço articular.",
                "dosagem": { "info": "Nas fases de rigidez predominante." },
                "prognostico": "Condição autolimitada (12-24 meses), mas a fisioterapia reduz o tempo de incapacidade."
            }
        ]
    },
    {
        "id": "SHOULDER_INSTAB_01",
        "patologia": "Instabilidade Glenoumeral (Watson Protocol)",
        "regiao": "Ombro",
        "ultima_atualizacao": "2025-01-20",
        "base_conhecimento": [
            {
                "titulo": "Rehabilitation following shoulder dislocation",
                "tipo_estudo": "Revisão Sistemática",
                "autor": "Warby SA et al.",
                "ano": "2016",
                "nota_qualidade": "PEDro 8/10",
                "doi_link": "https://pubmed.ncbi.nlm.nih.gov/27045610/",
                "resumo_educativo": "Protocolos específicos de controle motor (como o Watson) são mais eficazes que exercícios genéricos de fortalecimento.",
                "pontos_chave": [
                    "Atrasar o início da abdução com rotação externa",
                    "Focar no controle da cabeça umeral pela escápula",
                    "Treino de propriocepção é fundamental"
                ]
            }
        ],
        "resumo_clinico": "Relacionada a luxações prévias ou hipermobilidade global. Foco total em 'estabilidade dinâmica'.",
        "intervencoes": [
            {
                "categoria": "Exercício Terapêutico",
                "nivel_evidencia": "Nível B",
                "tipo": "Protocolo Watson (Estágios)",
                "descricao": "Progressão do controle escapular para controle em posições de apreensão.",
                "conduta_sugerida": "Estágio 1: Controle escapular neutro. Estágio 2: Co-contração em carga. Estágio 3: Pliometria e RTS.",
                "dosagem": { "info": "Progressivo conforme estabilidade." },
                "prognostico": "Redução do risco de recidiva em atletas."
            }
        ]
    },
    {
        "id": "WH_UI_01",
        "patologia": "Incontinência Urinária de Esforço (IUE)",
        "regiao": "Saúde da Mulher",
        "ultima_atualizacao": "2025-01-20",
        "base_conhecimento": [
            {
                "titulo": "Pelvic floor muscle training for urinary incontinence in women",
                "tipo_estudo": "Revisão Sistemática Cochrane",
                "autor": "Dumoulin C et al.",
                "ano": "2018",
                "nota_qualidade": "Nível 1A (Padrão Ouro)",
                "doi_link": "https://doi.org/10.1002/14651858.CD005654.pub4",
                "resumo_educativo": "O Treinamento dos Músculos do Assoalho Pélvico (TMAP) deve ser a primeira linha de tratamento. É eficaz e tem baixo risco de eventos adversos.",
                "pontos_chave": [
                    "TMAP supervisionado é superior ao não supervisionado",
                    "Eficácia demonstrada em todas as faixas etárias",
                    "Aderência é o principal preditor de sucesso a longo prazo"
                ]
            }
        ],
        "resumo_clinico": "Perda involuntária de urina durante esforço físico, tosse ou espirro. Condição altamente responsiva à reabilitação funcional do assoalho pélvico.",
        "intervencoes": [
            {
                "categoria": "Avaliação",
                "nivel_evidencia": "Nível A",
                "tipo": "Avaliação Funcional do Assoalho Pélvico",
                "descricao": "Uso do esquema PERFECT para avaliar força, resistência e coordenação.",
                "conduta_sugerida": "Toque vaginal para graduar força (Modified Oxford Scale) e verificar presença de co-contração abdominal excessiva.",
                "prognostico": "Cura ou melhora significativa em 70-80% dos casos em 12 semanas de TMAP."
            },
            {
                "categoria": "Exercício Terapêutico",
                "nivel_evidencia": "Nível A",
                "tipo": "Treinamento dos Músculos do Assoalho Pélvico (TMAP)",
                "descricao": "Protocolo progressivo de contrações rápidas (fibras tipo II) e sustentadas (fibras tipo I).",
                "conduta_sugerida": "Séries de 10 contrações de 10 segundos, seguidas de 10 contrações rápidas.",
                "dosagem": {
                    "frequencia": "Diariamente",
                    "volume": "3 séries por dia"
                }
            }
        ]
    },
    {
        "id": "WH_POP_01",
        "patologia": "Prolapso de Órgãos Pélvicos (POP)",
        "regiao": "Saúde da Mulher",
        "ultima_atualizacao": "2025-01-20",
        "base_conhecimento": [
            {
                "titulo": "Pelvic floor muscle training for visceral pelvic organ prolapse",
                "tipo_estudo": "Ensaio Clínico Randomizado (POPPY Trial)",
                "autor": "Hagen S et al. (The Lancet)",
                "ano": "2014",
                "nota_qualidade": "PEDro 8/10",
                "doi_link": "https://doi.org/10.1016/S0140-6736(13)61971-8",
                "resumo_educativo": "TMAP reduz sintomas e gravidade do prolapso em estágios I e II. Deve ser oferecido antes de considerar cirurgia.",
                "pontos_chave": [
                    "Melhora da 'elevação' do assoalho pélvico reduz a protrusão",
                    "Fisioterapia reduz o impacto na qualidade de vida",
                    "Coadjuvante essencial mesmo se houver indicação de pressário"
                ]
            }
        ],
        "resumo_clinico": "Descida de um ou mais órgãos pélvicos. Fisioterapia foca em aumentar o suporte muscular e gerir a pressão intra-abdominal.",
        "intervencoes": [
            {
                "categoria": "Avaliação",
                "nivel_evidencia": "Nível A",
                "tipo": "Sistema POP-Q",
                "descricao": "Estadiamento clínico do prolapso durante manobra de Valsalva.",
                "conduta_sugerida": "Avaliar sintomas de 'peso' ou 'bola na vagina'.",
                "prognostico": "Excelente controle de sintomas em estágios leves/moderados."
            },
            {
                "categoria": "Educação / Comportamental",
                "nivel_evidencia": "Nível B",
                "tipo": "Gestão de Pressão Intra-abdominal",
                "descricao": "Educação sobre técnicas de evacuação e levantamento de peso.",
                "conduta_sugerida": "Ensinar 'The Knack' (contração prévia ao esforço)."
            }
        ]
    },
    {
        "id": "WH_CPP_01",
        "patologia": "Dor Pélvica Crônica / Disfunção Miofascial",
        "regiao": "Saúde da Mulher",
        "ultima_atualizacao": "2025-01-20",
        "base_conhecimento": [
            {
                "titulo": "Management of Chronic Pelvic Pain",
                "tipo_estudo": "Diretriz Clínica (EAU)",
                "autor": "Engeler A et al.",
                "ano": "2022",
                "nota_qualidade": "Nível A (Atualizada)",
                "doi_link": "https://uroweb.org/guidelines/chronic-pelvic-pain",
                "resumo_educativo": "A dor pélvica frequentemente envolve sensibilização central e pontos gatilho na musculatura pélvica.",
                "pontos_chave": [
                    "Abordagem multidisciplinar é mandatória",
                    "Fisioterapia foca no relaxamento e dessensibilização",
                    "Evitar foco único em órgão específico (bexiga/útero)"
                ]
            }
        ],
        "resumo_clinico": "Dor persistente por > 6 meses. Frequentemente associada a hipertonia do assoalho pélvico e fatores psicossociais.",
        "intervencoes": [
            {
                "categoria": "Avaliação",
                "nivel_evidencia": "Nível B",
                "tipo": "Mapeamento de Dor e Trigger Points",
                "descricao": "Palpação interna e externa para identificar áreas de hipertonia e dor referida.",
                "conduta_sugerida": "Avaliar cinesiofobia e impacto na função sexual.",
                "prognostico": "Melhora gradual. Requer paciência e abordagem biopsicossocial."
            },
            {
                "categoria": "Terapia Manual",
                "nivel_evidencia": "Nível A",
                "tipo": "Técnicas de Relaxamento e Liberação",
                "descricao": "Massagem de Thiele, liberação miofascial interna e exercícios de 'down-training'.",
                "conduta_sugerida": "Focar em respiração diafragmática para reduzir a tensão basal do assoalho."
            }
        ]
    },
    {
        "id": "WH_PP_DIAST_01",
        "patologia": "Diástase dos Músculos Retos Abdominais (DMRA) - Pós-Parto",
        "regiao": "Saúde da Mulher",
        "ultima_atualizacao": "2025-01-20",
        "base_conhecimento": [
            {
                "titulo": "Diastasis recti abdominis during pregnancy and 12 months postpartum",
                "tipo_estudo": "Estudo de Coorte",
                "autor": "Sperstad JB et al. (BJSM)",
                "ano": "2016",
                "nota_qualidade": "Alta Relevância",
                "doi_link": "https://doi.org/10.1136/bjsports-2016-096065",
                "resumo_educativo": "A diástase é comum no pós-parto. O foco da reabilitação deve ser a função e a transferência de carga, não apenas o fechamento do 'gap'.",
                "pontos_chave": [
                    "A distância inter-retos (DIR) não prediz dor ou disfunção",
                    "Fortalecimento abdominal progressivo é seguro",
                    "Coordenação com o assoalho pélvico é essencial"
                ]
            }
        ],
        "resumo_clinico": "Afastamento dos retos abdominais. A reabilitação visa restaurar a tensão da linha alba e a estabilidade do tronco (lombo-pélvica).",
        "intervencoes": [
            {
                "categoria": "Avaliação",
                "nivel_evidencia": "Nível B",
                "tipo": "Funcionalidade Abdominal",
                "descricao": "Medir DIR e avaliar a capacidade de gerar tensão na linha alba (doming/coning).",
                "conduta_sugerida": "Teste de carga progressiva (curls, pernas) monitorando a parede abdominal.",
                "prognostico": "Excelente recuperação funcional em 4-6 meses de treinamento focado."
            },
            {
                "categoria": "Exercício Terapêutico",
                "nivel_evidencia": "Nível B",
                "tipo": "Fortalecimento do Core e Transverso",
                "descricao": "Exercícios de controle motor integrando respiração e ativação profunda.",
                "conduta_sugerida": "Progressão para exercícios funcionais globais (Pranchas adaptadas, carregamento de carga)."
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
        "ultima_atualizacao": "2025-01-20",
        "base_conhecimento": [
            {
                "titulo": "Metatarsalgia: Diagnosis and Treatment",
                "tipo_estudo": "Consenso de Especialistas",
                "autor": "Espinosa N et al.",
                "ano": "2010",
                "nota_qualidade": "Revisão Clínica",
                "doi_link": "https://pubmed.ncbi.nlm.nih.gov/20471556/",
                "resumo_educativo": "A dor nos metatarsos geralmente é por sobrecarga mecânica decorrente de encurtamento da cadeia posterior ou calçados inadequados.",
                "pontos_chave": [
                    "Barra metatarsal e botões metatarsais (palmilhas) reduzem a pressão local",
                    "Neuroma de Morton: teste de Mulder positivo indica compressão do nervo digital",
                    "Calçados com biqueira larga são fundamentais"
                ]
            }
        ],
        "resumo_clinico": "Sobrecarga nas cabeças dos metatarsos. Condição com forte componente biomecânico corrigível por órteses e alongamento.",
        "intervencoes": [
            {
                "categoria": "Dispositivos Médicos",
                "nivel_evidencia": "Nível B",
                "tipo": "Palmilhas com Barra Metatarsal",
                "descricao": "Apoio retro-capital para transferir a pressão das cabeças dos metatarsos para os colos.",
                "conduta_sugerida": "Aplicar o elemento na palmilha exatamente atrás da zona de maior pressão (detectada por baropodometria).",
                "prognostico": "Alívio sintomático em 2-4 semanas de uso contínuo."
            },
            {
                "categoria": "Terapia Manual",
                "nivel_evidencia": "Nível C",
                "tipo": "Mobilização das Articulações Metatarsofalângicas",
                "descricao": "Melhorar a artrocinemática e mobilidade do antepé.",
                "conduta_sugerida": "Deslizamentos dorsais e plantares e tração leve."
            }
        ]
    },
    {
        "id": "ANKLE_DIAB_01",
        "patologia": "Gestão Preventiva do Pé Diabético",
        "regiao": "Tornozelo e Pé",
        "ultima_atualizacao": "2025-01-20",
        "base_conhecimento": [
            {
                "titulo": "IWGDF Guidelines on the prevention of foot ulcers in persons with diabetes",
                "tipo_estudo": "Diretriz Clínica Internacional",
                "autor": "Bus SA et al.",
                "ano": "2019",
                "nota_qualidade": "Nível A (Diretriz Mundial)",
                "doi_link": "https://iwgdfguidelines.org/prevention-guideline/",
                "resumo_educativo": "A prevenção foca na triagem de neuropatia sensorial e gestão de pontos de pressão elevada.",
                "pontos_chave": [
                    "Avaliação regular com monofilamento de 10g (Semmes-Weinstein)",
                    "O uso de calçados terapêuticos e palmilhas de preenchimento total reduz o risco de úlceras em 50%",
                    "Educação do paciente para inspeção diária dos pés"
                ]
            }
        ],
        "resumo_clinico": "Risco de ulceração devido à neuropatia, deformidade e pressão excessiva. O papel da fisioterapia e órtese é majoritariamente preventivo.",
        "intervencoes": [
            {
                "categoria": "Dispositivos Médicos",
                "nivel_evidencia": "Nível A",
                "tipo": "Palmilhas de Acomodação Total (Total Contact)",
                "descricao": "Palmilhas macias com suporte total para distribuir a pressão por toda a superfície plantar.",
                "conduta_sugerida": "Usar materiais como Plastazote ou EVA de baixa densidade. Evitar correções rígidas ou proeminentes.",
                "prognostico": "A adesão ao uso dos calçados e palmilhas protege contra a formação de úlceras neuropáticas.",
                "dosagem": {
                    "nota": "Uso constante (100% do tempo em pé)."
                }
            }
        ]
    },
    {
        "id": "GTPS_01",
        "patologia": "Síndrome da Dor Trocantérica (Tendinopatia Glútea)",
        "regiao": "Quadril",
        "ultima_atualizacao": "2025-01-20",
        "base_conhecimento": [
            {
                "titulo": "Education plus exercise versus corticosteroid injection (LEAP Trial)",
                "tipo_estudo": "Ensaio Clínico Randomizado",
                "autor": "Mellor R et al. (BMJ)",
                "ano": "2018",
                "nota_qualidade": "PEDro 9/10",
                "doi_link": "https://doi.org/10.1136/bmj.k1662",
                "resumo_educativo": "Educação sobre evitar compressão (cruzar pernas) + exercício de carga foi superior à infiltração em 1 ano.",
                "pontos_chave": [
                    "Evitar adução excessiva do quadril (dormir com travesseiro entre joelhos)",
                    "Infiltração dá alívio rápido mas tem piores resultados em 1 ano",
                    "Carga isométrica ajuda no controle da dor"
                ]
            }
        ],
        "resumo_clinico": "Dor na lateral do quadril. Foco em reduzir compressão do tendão no trocânter e aumentar a força do glúteo médio/mínimo.",
        "intervencoes": [
            {
                "categoria": "Educação",
                "nivel_evidencia": "Nível A",
                "tipo": "Gestão de Carga Compressiva",
                "descricao": "Evitar posições que estirem o tendão sobre o trocânter.",
                "conduta_sugerida": "Não cruzar as pernas; dormir de lado com travesseiro entre os joelhos.",
                "prognostico": "Melhora consistente em 8-12 semanas."
            },
            {
                "categoria": "Exercício Terapêutico",
                "nivel_evidencia": "Nível A",
                "tipo": "Fortalecimento Glúteo (Tensão Gradual)",
                "descricao": "Isometria em abdução e progressão para exercícios em pé.",
                "conduta_sugerida": "Evitar 'clamshells' excessivos se houver muita dor compressiva inicial.",
                "dosagem": { "frequencia": "3x por semana" }
            }
        ]
    },
    {
        "id": "HIP_FAI_01",
        "patologia": "Impacto Femoroacetabular (IFA)",
        "regiao": "Quadril",
        "ultima_atualizacao": "2025-01-20",
        "base_conhecimento": [
            {
                "titulo": "Warwick Agreement on FAI Syndrome",
                "tipo_estudo": "Consenso Internacional",
                "autor": "Griffin DR et al. (BJSM)",
                "ano": "2016",
                "nota_qualidade": "Referência Mundial",
                "doi_link": "https://bjsm.bmj.com/content/50/19/1169",
                "resumo_educativo": "O diagnóstico exige tríade: sintomas, sinais clínicos (FADIR) e imagem (CAM/Pincer). O tratamento conservador deve focar em controle motor.",
                "pontos_chave": [
                    "Muitas pessoas têm IFA na imagem e não têm dor",
                    "Fisioterapia foca no controle da cabeça umeral e core"
                ]
            }
        ],
        "resumo_clinico": "Dor profunda na virilha associada a movimentos de flexão e rotação interna.",
        "intervencoes": [
            {
                "categoria": "Exercício Terapêutico",
                "nivel_evidencia": "Nível B",
                "tipo": "Controle Motor e Estabilização Pélvica",
                "descricao": "Fortalecimento de rotadores profundos e glúteo máximo.",
                "conduta_sugerida": "Evitar amplitudes extremas de flexão e RI dolorosas no início."
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
        "ultima_atualizacao": "2025-01-20",
        "base_conhecimento": [
            {
                "titulo": "Management of Lateral Elbow Tendinopathy",
                "tipo_estudo": "Revisão Sistemática",
                "autor": "Coombes BK et al.",
                "ano": "2015",
                "nota_qualidade": "PEDro 9/10",
                "doi_link": "https://pubmed.ncbi.nlm.nih.gov/25562772/",
                "resumo_educativo": "A infiltração de corticoide é pior que a fisioterapia a longo prazo. O exercício excêntrico/isotônico é a chave.",
                "pontos_chave": [
                    "Evitar uso prolongado de AINEs",
                    "Mobilização com movimento (Mulligan) para alívio imediato"
                ]
            }
        ],
        "resumo_clinico": "Tendinopatia dos extensores do punho.",
        "intervencoes": [
            {
                "categoria": "Exercício Terapêutico",
                "nivel_evidencia": "Nível A",
                "tipo": "Carga Progressiva de Extensores",
                "descricao": "Treino de resistência com halter ou theraband.",
                "conduta_sugerida": "Isometria inicial para analgesia."
            }
        ]
    },
    {
        "id": "UE_DQ_01",
        "patologia": "Tenossinovite de De Quervain",
        "regiao": "Membro Superior",
        "ultima_atualizacao": "2025-01-20",
        "base_conhecimento": [
            {
                "titulo": "Surgical versus non-surgical treatment for De Quervain's",
                "tipo_estudo": "Cochrane Review",
                "autor": "Peters-Veluthamaningal C et al.",
                "ano": "2014",
                "nota_qualidade": "Nível A",
                "doi_link": "https://pubmed.ncbi.nlm.nih.gov/24435728/",
                "resumo_educativo": "A órtese de punho e polegar associada a exercícios tem bons resultados funcionais.",
                "pontos_chave": [
                    "Teste de Finkelstein positivo",
                    "Reduzir movimentos de pinça fina/repetição"
                ]
            }
        ],
        "resumo_clinico": "Inflamação do 1º túnel extensor (EPB e APL).",
        "intervencoes": [
            {
                "categoria": "Órtese",
                "nivel_evidencia": "Nível B",
                "tipo": "Órtese de Polegar (Spica)",
                "descricao": "Restrição de movimento do polegar.",
                "conduta_sugerida": "Alternar uso com períodos de mobilização suave."
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
