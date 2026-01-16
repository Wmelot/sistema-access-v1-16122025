
export const ORTHOTICS_PROTOCOLS = [
    {
        "id": "ORTHOTICS_PLANTAR_FASCIITIS",
        "patologia": "Fasciopatia Plantar (Fascite)",
        "indicacao_palmilha": "Primeira Linha (Curto Prazo) e Coadjuvante (Longo Prazo)",
        "base_conhecimento": [
            {
                "titulo": "Effectiveness of foot orthoses to treat plantar fasciitis (RCT)",
                "autor": "Landorf KB et al. (Arch Intern Med)",
                "ano": "2006",
                "nota_qualidade": "PEDro Score 8/10 (Alta Qualidade)",
                "doi_link": "https://jamanetwork.com/journals/jamainternalmedicine/fullarticle/410854",
                "conclusao": "Palmilhas (pré-fabricadas ou customizadas) são superiores ao placebo para alívio da dor em curto prazo."
            },
            {
                "titulo": "Heel Pain - Plantar Fasciitis: CPG Revision 2014/2023",
                "autor": "Martin RL et al. (JOSPT)",
                "ano": "2014",
                "nota_qualidade": "Diretriz Clínica (Nível A)",
                "doi_link": "https://www.jospt.org/doi/10.2519/jospt.2014.0303"
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
                "titulo": "Foot orthoses and physiotherapy in the treatment of patellofemoral pain syndrome (RCT)",
                "autor": "Collins N et al. (BMJ)",
                "ano": "2008",
                "nota_qualidade": "PEDro Score 8/10 (Alta Qualidade)",
                "doi_link": "https://www.bmj.com/content/337/bmj.a1735",
                "conclusao": "Palmilhas são eficazes para redução de dor em 6 semanas, sendo uma ótima intervenção inicial junto com exercícios."
            },
            {
                "titulo": "Patellofemoral Pain Clinical Practice Guidelines",
                "autor": "Willy RW et al. (JOSPT)",
                "ano": "2019",
                "nota_qualidade": "Diretriz Clínica (Nível A)",
                "doi_link": "https://www.jospt.org/doi/10.2519/jospt.2019.0302"
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
                "titulo": "Interventions for the treatment of Morton's neuroma (Cochrane Review)",
                "autor": "Matthews BG et al.",
                "ano": "2021",
                "nota_qualidade": "Revisão Sistemática (Alta)",
                "doi_link": "https://doi.org/10.1002/14651858.CD014687",
                "conclusao": "Modificações de calçado e órteses com apoio metatarsal mostram benefício significativo na dor."
            },
            {
                "titulo": "Metatarsalgia: Diagnosis and Treatment",
                "autor": "Various",
                "ano": "2020",
                "nota_qualidade": "Consenso Clínico",
                "doi_link": ""
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
                "autor": "Bus SA et al.",
                "ano": "2019/2023",
                "nota_qualidade": "Diretriz Internacional (Consenso)",
                "doi_link": "https://iwgdfguidelines.org/prevention-guideline/",
                "conclusao": "Órteses plantares que reduzem a pressão de pico em >30% são eficazes na prevenção de úlceras."
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
                "titulo": "Nonsurgical management of posterior tibial tendon dysfunction (RCT)",
                "autor": "Kulig K et al. (Phys Ther)",
                "ano": "2009",
                "nota_qualidade": "PEDro Score 7/10",
                "doi_link": "https://academic.oup.com/ptj/article/89/1/26/2737529",
                "conclusao": "Palmilhas customizadas combinadas com exercícios excêntricos são eficazes para dor e função."
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
