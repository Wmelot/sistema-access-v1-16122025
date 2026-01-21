
export const ORTHOTICS_PROTOCOLS = [
    {
        "id": "ORTHOTICS_PLANTAR_FASCIITIS",
        "patologia": "Fasciopatia Plantar (Fascite)",
        "indicacao_palmilha": "Primeira Linha (Curto Prazo) e Coadjuvante (Longo Prazo)",
        "base_conhecimento": [
            {
                "titulo": "Heel Pain - Plantar Fasciitis: Revision 2014",
                "tipo_estudo": "Diretriz Clínica (CPG)",
                "autor": "Martin RL et al. (JOSPT)",
                "ano": "2014",
                "nota_qualidade": "Nível A (Diretriz Padrão Ouro)",
                "doi_link": "https://www.jospt.org/doi/10.2519/jospt.2014.0303",
                "resumo_educativo": "Diretriz seminal. Recomenda fortemente o uso de palmilhas antipronação para redução de dor imediata (até 3 meses) e alongamento específico da fáscia. Terapias passivas isoladas são desaconselhadas.",
                "pontos_chave": [
                    "Palmilhas pré-fabricadas e customizadas têm eficácia similar no curto prazo",
                    "A Terapia Manual deve focar em articulações e tecidos moles (Tríceps Sural)",
                    "Perda de peso é vital para resultados a longo prazo"
                ]
            },
            {
                "titulo": "Foot orthoses for plantar heel pain: a systematic review and meta-analysis",
                "tipo_estudo": "Revisão Sistemática e Meta-análise",
                "autor": "Whittaker GA et al. (BJSM)",
                "ano": "2018",
                "nota_qualidade": "Alta Qualidade (BJSM)",
                "doi_link": "https://bjsm.bmj.com/content/52/6/372",
                "resumo_educativo": "Confirma que órteses plantares reduzem a dor média em comparação com placebo/sham no curto e médio prazo (até 12 semanas).",
                "pontos_chave": [
                    "Efeito moderado na redução da dor",
                    "Palmilhas customizadas podem ser superiores em casos crônicos (>3 meses)"
                ]
            },
            {
                "titulo": "Cost-effectiveness of custom-made versus sham insoles",
                "tipo_estudo": "Ensaio Clínico Randomizado (RCT)",
                "autor": "Landorf KB et al. (Arch Intern Med)",
                "ano": "2006",
                "nota_qualidade": "PEDro 8/10",
                "doi_link": "https://jamanetwork.com/journals/jamainternalmedicine/fullarticle/410854",
                "resumo_educativo": "Estudo clássico. Demonstrou que tanto palmilhas pré-fabricadas quanto customizadas produziram melhora na função e dor em 12 meses, sem diferença estatística significativa, mas superior ao Sham.",
                "pontos_chave": [
                    "Acomodação do arco é o mecanismo chave",
                    "Material soft é bem tolerado, mas suporte rígido pode durar mais"
                ]
            },
            {
                "titulo": "Manual therapy and exercises for plantar fasciitis",
                "tipo_estudo": "Revisão Sistemática Cochrane",
                "autor": "Salvioli S et al.",
                "ano": "2017",
                "nota_qualidade": "Cochrane Evidence",
                "doi_link": "",
                "resumo_educativo": "A combinação de terapia manual (mobilização articular e miofascial) com exercícios de alongamento é superior ao exercício isolado ou modalidades eletrofísicas.",
                "pontos_chave": [
                    "Mobilização de Talocrural melhora a dorsiflexão, reduzindo tensão na fáscia",
                    "Liberação miofascial do gastrocnêmio é essencial"
                ]
            }
        ],
        "prescricao_biomecanica": {
            "objetivo": "Reduzir a tensão na fáscia plantar e acomodar o calcâneo.",
            "elementos_sugeridos": [
                "Suporte de Arco Longitudinal Medial (Controla o abaixamento do arco)",
                "Deep Heel Cup (Copo do calcanhar profundo)",
                "Material de amortecimento no calcanhar (Poron/EVA soft)"
            ]
        },
        "visualizacao_paciente": {
            "confianca": 5,
            "potencia": 4,
            "cor": "green",
            "texto_amigavel": "Alívio de Pressão",
            "explicacao": "A palmilha funciona como um 'banco' para o seu pé, impedindo que o arco desabe e estique a fáscia machucada."
        }
    },
    {
        "id": "ORTHOTICS_PFP_KNEE",
        "patologia": "Dor Patelofemoral (Dor Anterior no Joelho)",
        "indicacao_palmilha": "Indicado para pacientes com Pronação Excessiva",
        "base_conhecimento": [
            {
                "titulo": "Patellofemoral Pain Clinical Practice Guidelines",
                "tipo_estudo": "Diretriz Clínica (CPG)",
                "autor": "Willy RW et al. (JOSPT)",
                "ano": "2019",
                "nota_qualidade": "Nível A (Referência Mundial)",
                "doi_link": "https://www.jospt.org/doi/10.2519/jospt.2019.0302",
                "resumo_educativo": "A diretriz recomenda palmilhas pré-fabricadas para pacientes com hiperpranação visível, mas APENAS como parte de um programa multimodal que inclua exercícios de quadril e joelho.",
                "pontos_chave": [
                    "Não use palmilhas isoladamente para curar PFP",
                    "Fortalecimento de Glúteo Médio/Máximo é Nível A de evidência",
                    "Alongamento de cadeia posterior pode ajudar se houver encurtamento"
                ]
            },
            {
                "titulo": "Foot orthoses and physiotherapy in the treatment of patellofemoral pain syndrome",
                "tipo_estudo": "Ensaio Clínico Randomizado (RCT)",
                "autor": "Collins N et al. (BMJ)",
                "ano": "2008",
                "nota_qualidade": "PEDro 8/10",
                "doi_link": "https://www.bmj.com/content/337/bmj.a1735",
                "resumo_educativo": "RCT pragmático mostrando que palmilhas reduziram significativamente a dor em 6 semanas comparadas ao placebo. A combinação Fisioterapia + Palmilha não foi superior à Palmilha sozinha no curto prazo, mas superior a nada.",
                "pontos_chave": [
                    "Palmilhas são uma excelente estratégia de 'entrada' para alívio rápido",
                    "Melhoram a adesão ao permitir que o paciente faça exercícios com menos dor"
                ]
            },
            {
                "titulo": "Proximal Muscle Rehabilitation for PFP",
                "tipo_estudo": "Revisão Sistemática",
                "autor": "Lack S et al. (BJSM)",
                "ano": "2015",
                "nota_qualidade": "Alta Relevância",
                "doi_link": "https://bjsm.bmj.com/content/49/21/1365",
                "resumo_educativo": "Demonstrou que o fortalecimento proximal (Quadril/Tronco) é EFETIVO para reduzir a dor patelofemoral e melhorar a função, corrigindo o valgo dinâmico.",
                "pontos_chave": [
                    "Exercícios de cadeia aberta e fechada são úteis",
                    "Controle do fêmur é mais importante que o VMO isolado"
                ]
            },
            {
                "titulo": "Predictors of response to foot orthoses in PFP",
                "tipo_estudo": "Estudo de Coorte/Predição",
                "autor": "Barton CJ et al.",
                "ano": "2011",
                "nota_qualidade": "Alta Aplicabilidade Clínica",
                "doi_link": "",
                "resumo_educativo": "Identificou quem responde melhor às palmilhas: Pacientes com dor menor que 6 meses, dor ao agachar e calçado com suporte ruim.",
                "pontos_chave": [
                    "Teste clínico: Se o suporte no arco alivia a dor no agachamento unipodal imediato, prescreva a palmilha."
                ]
            }
        ],
        "prescricao_biomecanica": {
            "objetivo": "Controlar a rotação interna da tíbia associada à pronação do pé.",
            "elementos_sugeridos": [
                "Cunha Varizante de Retropé (Medial Heel Skive)",
                "Suporte de Arco Medial Rígido/Semirrígido",
                "Postagem medial"
            ]
        },
        "visualizacao_paciente": {
            "confianca": 5,
            "potencia": 4,
            "cor": "green",
            "texto_amigavel": "Alinhamento Joelho-Pé",
            "explicacao": "Ao segurar o pé, impedimos que o joelho rode para dentro, aliviando a pressão atrás da patela."
        }
    },
    {
        "id": "ORTHOTICS_METATARSALGIA",
        "patologia": "Metatarsalgia / Neuroma de Morton",
        "indicacao_palmilha": "Padrão Ouro para Tratamento Conservador",
        "base_conhecimento": [
            {
                "titulo": "Interventions for the treatment of Morton's neuroma",
                "tipo_estudo": "Revisão Sistemática Cochrane",
                "autor": "Matthews BG et al.",
                "ano": "2021",
                "nota_qualidade": "Cochrane Gold Standard",
                "doi_link": "https://doi.org/10.1002/14651858.CD014687",
                "resumo_educativo": "Revisou todas as intervenções para Neuroma. Conclui que modificações de calçado e órteses com domo metatarsal são a primeira linha de tratamento eficaz antes de considerar cirurgia.",
                "pontos_chave": [
                    "Injeções de corticoide dão alívio curto prazo",
                    "Cirurgia tem riscos de dor neuropática residual"
                ]
            },
            {
                "titulo": "Effectiveness of metatarsal pads",
                "tipo_estudo": "Revisão Sistemática",
                "autor": "Haby G et al. (J Foot Ankle Res)",
                "ano": "2015",
                "nota_qualidade": "Boa Qualidade Metodológica",
                "doi_link": "",
                "resumo_educativo": "Demosntra que o uso de apoio retrocapital (metatarsal pad) reduz significativamente os picos de pressão plantar sob as cabeças dos metatarsos durante a marcha.",
                "pontos_chave": [
                    "Posicionamento correto (atrás da cabeça dos metatarsos) é crítico",
                    "Mais eficaz em calçados com toe-box (caixa dos dedos) ampla"
                ]
            },
            {
                "titulo": "Metatarsalgia: Etiology and Treatment Review",
                "tipo_estudo": "Revisão Narrativa / Atualização Clínica",
                "autor": "Bernstein A et al.",
                "ano": "2019",
                "nota_qualidade": "Revisão Clínica Abrangente",
                "doi_link": "",
                "resumo_educativo": "Discute a anatomia do arco transverso e como a falha desse arco leva à sobrecarga central (2º e 3º metatarso). Órteses devem visar restaurar esse arco.",
                "pontos_chave": [
                    "Diferenciação entre neuroma (nervo) e sinovite (articular)",
                    "Suporte de arco longitudinal também é necessário para reduzir a carga anterior"
                ]
            }
        ],
        "prescricao_biomecanica": {
            "objetivo": "Restaurar o arco transverso e abrir espaço interdigital (Neuroma).",
            "elementos_sugeridos": [
                "Oliva Metatarsal (Metatarsal Pad/Dome) posicionada logo atrás das cabeças dos metatarsos (Retrocapital)",
                "Barra Metatarsal (para distribuir pressão de todas as cabeças)"
            ]
        },
        "visualizacao_paciente": {
            "confianca": 5,
            "potencia": 5,
            "cor": "green",
            "texto_amigavel": "Elevar e Separar",
            "explicacao": "A 'oliva' levanta os ossos do meio do pé, tirando a pressão de onde pisa e abrindo espaço para o nervo respirar."
        }
    },
    {
        "id": "ORTHOTICS_DIABETIC_FOOT",
        "patologia": "Pé Diabético (Prevenção de Úlceras)",
        "indicacao_palmilha": "Obrigatório para Risco Moderado/Alto",
        "base_conhecimento": [
            {
                "titulo": "Guidelines on the prevention of foot ulcers in persons with diabetes (IWGDF)",
                "tipo_estudo": "Diretriz Internacional (CPG)",
                "autor": "Bus SA et al. (IWGDF)",
                "ano": "2023",
                "nota_qualidade": "Consenso Global (Ouro)",
                "doi_link": "https://iwgdfguidelines.org/prevention-guideline/",
                "resumo_educativo": "A bíblia do pé diabético. Determina que pacientes com perda de sensibilidade protetora DEVEM usar calçados terapêuticos e palmilhas customizadas que reduzam a pressão plantar de pico em pelo menos 30% em comparação ao calçado padrão.",
                "pontos_chave": [
                    "A educação do paciente sozinha NÃO previne úlceras; é necessário 'irresistible offloading'",
                    "Inspeção diária dos pés é mandatória"
                ]
            },
            {
                "titulo": "Footwear and orthosis interventions for foot ulcer prevention",
                "tipo_estudo": "Revisão Sistemática Cochrane",
                "autor": "Crawford F et al.",
                "ano": "2020",
                "nota_qualidade": "Cochrane Gold Standard",
                "doi_link": "",
                "resumo_educativo": "Confirmou que o uso de calçados terapêuticos com palmilhas customizadas reduz o risco de recidiva de úlceras plantares em comparação com o cuidado padrão.",
                "pontos_chave": [
                    "A adesão ao uso (usar dentro de casa também) é o maior desafio",
                    "Palmilhas devem ser revisadas a cada 3-6 meses devido à compactação do material"
                ]
            },
            {
                "titulo": "Effectiveness of offloading interventions",
                "tipo_estudo": "Revisão Sistemática",
                "autor": "Bus SA et al.",
                "ano": "2016",
                "nota_qualidade": "Alta Qualidade",
                "doi_link": "",
                "resumo_educativo": "Avaliou diversas técnicas de descarregamento. O uso de materiais como Plastazote e Poron é validado para redistribuição de força.",
                "pontos_chave": [
                    "Total Contact Cast (Gesso de Contato Total) é o padrão ouro para tratamento de úlcera ativa",
                    "Palmilha é para PREVENÇÃO (fase pós-aguda)"
                ]
            }
        ],
        "prescricao_biomecanica": {
            "objetivo": "Redistribuição de pressão (Offloading) e proteção total.",
            "elementos_sugeridos": [
                "Contato Total (Total Contact Insole)",
                "Materiais multicamadas (Base firme + Cobertura macia em Plastazote/Poron)",
                "Alívios específicos em áreas de calosidade"
            ]
        },
        "visualizacao_paciente": {
            "confianca": 5,
            "potencia": 5,
            "cor": "green",
            "texto_amigavel": "Proteção Vital",
            "explicacao": "Esta palmilha não é para corrigir pisada, é para salvar sua pele. Ela distribui o peso para que nenhum ponto sofra pressão excessiva."
        }
    },
    {
        "id": "ORTHOTICS_FLATFOOT_ADULT",
        "patologia": "Pé Plano Adquirido do Adulto (Disfunção do Tibial Posterior)",
        "indicacao_palmilha": "Essencial nos Estágios I e II",
        "base_conhecimento": [
            {
                "titulo": "Nonsurgical management of posterior tibial tendon dysfunction",
                "tipo_estudo": "Ensaio Clínico Randomizado (RCT)",
                "autor": "Kulig K et al. (Phys Ther)",
                "ano": "2009",
                "nota_qualidade": "PEDro 7/10",
                "doi_link": "https://academic.oup.com/ptj/article/89/1/26/2737529",
                "resumo_educativo": "Comparou uso de órteses com exercícios concêntricos vs excêntricos. O grupo Órtese + Excêntricos teve os melhores resultados funcionais e de dor.",
                "pontos_chave": [
                    "Fase inflamatória requer controle mecânico rígido (Palmilha)",
                    "Exercício deve focar em resistência, não hipertorfia, do tibial"
                ]
            },
            {
                "titulo": "Adult Acquired Flatfoot Deformity Guidelines",
                "tipo_estudo": "Consenso/Revisão Clínica",
                "autor": "Abousayed MM et al.",
                "ano": "2017",
                "nota_qualidade": "Revisão de Especialistas",
                "doi_link": "",
                "resumo_educativo": "Estadiamento da doença dita o tratamento. Estágios I (sinovite) e II (deformidade flexível) são de manejo conservador obrigatório com órteses e fisioterapia.",
                "pontos_chave": [
                    "Palmilhas devem ter suporte de arco robusto e medial heel skive",
                    "Se houver falha após 3-6 meses, considera-se cirurgia"
                ]
            },
            {
                "titulo": "Kinematic effects of foot orthoses in flatfoot",
                "tipo_estudo": "Revisão Sistemática / Biomecânica",
                "autor": "Nielsen RG et al.",
                "ano": "2019",
                "nota_qualidade": "Estudo Biomecânico",
                "doi_link": "",
                "resumo_educativo": "Demonstra que órteses com suporte de arco e controle de retropé reduzem efetivamente a eversão do calcâneo e a rotação interna da tíbia durante a marcha.",
                "pontos_chave": [
                    "Reduz a demanda contrátil do Tibial Posterior",
                    "Melhora a eficiência da marcha"
                ]
            }
        ],
        "prescricao_biomecanica": {
            "objetivo": "Suportar o arco longitudinal e inverter o calcâneo para tirar carga do tendão.",
            "elementos_sugeridos": [
                "Cunha Supinadora de Retropé (Medial Heel Skive - Kirby)",
                "Suporte de arco alto e rígido",
                "Flange medial (opcional para conter o navicular)"
            ]
        },
        "visualizacao_paciente": {
            "confianca": 5,
            "potencia": 5,
            "cor": "green",
            "texto_amigavel": "Descanso para o Tendão",
            "explicacao": "Seu tendão está cansado de segurar o arco sozinho. A palmilha faz o trabalho pesado de levantar o arco, permitindo que o tendão cicatrize."
        }
    }
];

export type OrthoticsProtocol = typeof ORTHOTICS_PROTOCOLS[0];

export function getOrthoticsOptions() {
    return ORTHOTICS_PROTOCOLS.map(p => ({
        id: p.id,
        label: p.patologia
    }));
}

export function getOrthoticsProtocolById(id: string) {
    return ORTHOTICS_PROTOCOLS.find(p => p.id === id);
}
