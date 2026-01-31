export const BIOMECHANICS_RESEARCHER_SYS_PROMPT = `
Aja como um Pesquisador em Biomecânica e Podoposturologia.
Busque evidências científicas para o uso de Órteses Plantares (Palmilhas) na condição solicitada.

**CRITÉRIOS RIGOROSOS DE INCLUSÃO (Filtro de Qualidade):**
1.  **Tipo de Estudo:** Priorize Diretrizes Clínicas (CPGs) e Revisões Sistemáticas.
2.  **Ensaios Clínicos (RCTs):** APENAS inclua RCTs se tiverem pontuação na Escala PEDro ≥ 6/10 ou baixo risco de viés na Cochrane Risk of Bias Tool.
3.  **Fonte:** JOSPT, Cochrane, JAMA, BMJ, The Lancet, Gait & Posture.

**FORMATO DE SAÍDA (JSON):**
Retorne um objeto JSON contendo:
* \`prescricao_biomecanica\`: Quais elementos a palmilha deve ter (ex: Suporte de Arco, Cunha Lateral, Barra Metatarsal).
* \`base_conhecimento\`: Lista com Título, Autor, Ano, DOI e **Nota PEDro Aproximada** (ex: "PEDro 8/10").
* \`eficacia_clinica\`: O que esperar (Alívio de dor? Melhora de função? Apenas conforto?).

**REGRA DE OURO:**
Se a evidência científica diz que palmilha NÃO funciona para essa patologia (ex: dor lombar inespecífica sem alteração podal), deixe isso explícito em vermelho.
`

export const CLINICAL_SUMMARIZER_PROMPT = `
Atue como um fisioterapeuta sênior revisando um prontuário.
Resuma os achados principais e sugira uma linha de raciocínio clínico.
Mantenha linguagem técnica e direta.
`;

export const CLINICAL_EVIDENCE_BASE = [
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
        "Suporte de Arco alto e rígido",
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
]
// ... (existing CLINICAL_EVIDENCE_BASE)

export const REGIONAL_EVIDENCE_BASE = {
  spine_cervical: {
    title: "Coluna Cervical (Neck Pain)",
    guidelines: ["JOSPT CPG 2017: Neck Pain", "Sahrmann: Cervical Extension/Rotation Syndromes"],
    key_tests: [
      "Teste de Spurling",
      "Teste de Distração",
      "Teste de ULTT 1",
      "Teste de Flexão-Rotação",
      "CCFT (Craniocervical Flexion Test)",
      "Avaliação de Movimento Sahrmann"
    ],
    functional_tests: [
      "Teste de Resistência dos Flexores Profundos (Neck Flexion Endurance)",
      "Qualidade de movimento de alcance acima da cabeça"
    ],
    red_flags: ["Instabilidade Ligamentar (Alar/Transverso)", "Artéria Vertebral (5 Ds, 3 Ns)", "Mielopatia Cervical"]
  },
  spine_lumbar: {
    title: "Coluna Lombar (Low Back Pain)",
    guidelines: ["JOSPT CPG 2021: Low Back Pain", "Sahrmann: MSI Pelvic/Lumbar Syndromes", "TBC System (Fritz)"],
    key_tests: [
      "Elevação da Perna Reta (SLR)",
      "Slump Test",
      "Teste de Quadrante (Kemps)",
      "Centralização/Periferização (McKenzie)",
      "Instabilidade Prona (Pit's Test)",
      "Sahrmann: Sentar/Levantar"
    ],
    functional_tests: [
      "Single Leg Stance (Controle Pélvico)",
      "Qualidade do Agachamento (Padrão de carga)",
      "Teste de Biering-Sorensen (Resistência de Extensores)"
    ],
    red_flags: ["Cauda Equina", "Fratura", "Câncer", "Infecção"]
  },
  shoulder: {
    title: "Ombro (Shoulder Pain)",
    guidelines: ["JOSPT CPG: Adhesive Capsulitis", "Sahrmann: Scapular Dyskinesis / Impingement Syndromes"],
    key_tests: [
      "Neer",
      "Hawkins-Kennedy",
      "Jobe / Empty Can",
      "SPLAT (Scapular Posterior Lateral Across Test)",
      "SAT (Scapular Assistance Test)",
      "SRT (Scapular Retraction Test)"
    ],
    functional_tests: [
      "Closed Kinetic Chain Upper Extremity Stability Test (CKCUEST)",
      "Qualidade do Alcance Posterior (Apley Scratch)",
      "Push-Up Test (Estabilidade de Serrato)"
    ],
    red_flags: ["Tumor de Pancoast", "Patologia Visceral (Dor referida)"]
  },
  hip: {
    title: "Quadril (Hip Pain)",
    guidelines: ["JOSPT CPG: Hip OA", "Sahrmann: Femoral Anterior Glide / Hip Extension Syndromes"],
    key_tests: [
      "FADIR",
      "FABER / Patrick",
      "Teste de Thomas",
      "Trendelenburg",
      "Avaliação Sahrmann: Extensão Quadril"
    ],
    functional_tests: [
      "Single Leg Squat (Valgo Dinâmico do Quadril)",
      "Step Down Test (Controle excêntrico)",
      "Single Leg Bridge (Resistência de cadeia posterior)"
    ],
    red_flags: ["Necrose Avascular", "Fratura de Colo de Fêmur", "Artrite Séptica"]
  },
  knee: {
    title: "Joelho (Knee Pain)",
    guidelines: ["JOSPT CPG: Patellofemoral Pain", "Knee Ligament Sprain", "Sahrmann: Knee Extension/Hyperextension Syndromes"],
    key_tests: [
      "Lachman",
      "Thessaly",
      "Apreensão Patelar",
      "Teste de Compressão de Noble",
      "Patellar Grinding",
      "Zohlen's Sign"
    ],
    functional_tests: [
      "Y-Balance Test / Star Excursion (Equilíbrio Dinâmico)",
      "Single Leg Hop Tests (Retorno ao esporte)",
      "Drop Jump Case Analysis (Controle de Valgo)"
    ],
    red_flags: ["Trombose Venosa Profunda (TVP)", "Artrite Séptica"]
  },
  ankle_foot: {
    title: "Tornozelo e Pé (Ankle/Foot)",
    guidelines: ["JOSPT CPG: Ankle Sprain", "Plantar Fasciitis", "Sahrmann: Foot Pronation/Supination Syndromes"],
    key_tests: [
      "Gaveta Anterior (Tornozelo)",
      "Thompson (Aquiles)",
      "Windlass Test",
      "Coleman Block Test",
      "Talar Tilt"
    ],
    functional_tests: [
      "Weight-Bearing Lunge Test (ADM de Dorsiflexão)",
      "Single Leg Calf Raise (Resistência de Gastrocs/Soléus)",
      "Balance Error Scoring System (BESS)"
    ],
    red_flags: ["Fratura (Ottawa Ankle Rules)", "TVP"]
  }
}

export const DETAILED_TEST_INFO: Record<string, { description: string, sn?: string, sp?: string }> = {
  // COLUNA CERVICAL
  "Teste de Spurling": {
    description: "Paciente sentado, cabeça inclinada para o lado afetado. O examinador aplica pressão vertical. Positivo se reproduzir dor radicular para o braço (indicativo de compressão foraminal).",
    sn: "0.50",
    sp: "0.92"
  },
  "Teste de Distração": {
    description: "Paciente em decúbito dorsal. O examinador aplica tração cefálica manual lenta. Positivo se houver alívio ou redução dos sintomas radiculares periféricos.",
    sn: "0.44",
    sp: "0.90"
  },
  "Teste de ULTT 1": {
    description: "Teste de tensão do nervo mediano. Sequência: Depressão escapular, abdução de ombro (110°), extensão de punho e dedos, rotação externa, extensão de cotovelo. Positivo se reproduzir sintomas e houver mudança com inclinação cervical.",
    sn: "0.97",
    sp: "0.22"
  },
  "Teste de Flexão-Rotação": {
    description: "Paciente em decúbito dorsal. O examinador flexiona totalmente a cervical e então rotaciona para cada lado. Avalia restrição em C1-C2 (frequentemente associado a cefaleia cervicogênica).",
    sn: "0.91",
    sp: "0.90"
  },
  "CCFT": {
    description: "Uso de esfignomanômetro sob a cervical. O paciente realiza flexão craniocervical leve para atingir níveis crescentes de pressão. Avalia resistência dos flexores profundos.",
    sn: "N/A",
    sp: "N/A"
  },

  // COLUNA LOMBAR
  "Elevação da Perna Reta (SLR)": {
    description: "Paciente em decúbito dorsal. O examinador eleva passivamente a perna estendida. Positivo se reproduzir dor radicular (choque/queimação) abaixo de 70 graus.",
    sn: "0.91",
    sp: "0.26"
  },
  "Slump Test": {
    description: "Sequência de tensão neural sentada (flexão lombar, cervical, extensão de joelho e dorsiflexão). Muito sensível para herniações discais e tensão dural.",
    sn: "0.84",
    sp: "0.83"
  },
  "Teste de Quadrante (Kemps)": {
    description: "Paciente em pé. Realiza extensão, inclinação e rotação para o mesmo lado. O examinador aplica pressão axial. Positivo se reproduzir dor local (facetária) ou radicular.",
    sn: "N/A",
    sp: "N/A"
  },
  "Centralização/Periferização (McKenzie)": {
    description: "Movimentos repetidos (geralmente extensão ou flexão). Centralização (dor migra para a linha média) é um forte indicador de bom prognóstico e preferência direcional.",
    sn: "0.90 (Prognóstico)",
    sp: "N/A"
  },
  "Instabilidade Prona (Pit's Test)": {
    description: "Paciente deitado com pernas fora da maca. O examinador pressiona segmentos vertebrais. Se houver dor, o paciente levanta as pernas. Se a dor sumir, indica instabilidade tratável com exercícios.",
    sn: "0.72",
    sp: "0.71"
  },

  // OMBRO
  "Neer": {
    description: "Elevação passiva máxima do braço em rotação interna estabilizando a escápula. Positivo se houver dor no arco superior (síndrome do impacto subacromial).",
    sn: "0.79",
    sp: "0.53"
  },
  "Hawkins-Kennedy": {
    description: "Braço em 90° de flexão e cotovelo em 90°. O examinador realiza rotação interna forçada. Positivo se houver dor anterior.",
    sn: "0.79",
    sp: "0.59"
  },
  "Jobe / Empty Can": {
    description: "Braço em 90° de abdução no plano escapular e rotação interna completa (polegar para baixo). O examinador aplica resistência para baixo. Positivo se houver dor ou fraqueza do supraespinhal.",
    sn: "0.77",
    sp: "0.68"
  },
  "SAT (Scapular Assistance Test)": {
    description: "O examinador auxilia o movimento de rotação superior da escápula durante a elevação ativa do braço. Positivo se a dor diminuir com o auxílio (indica discinesia escapular).",
    sn: "N/A",
    sp: "N/A"
  },
  "SPLAT (Scapular Posterior Lateral Across Test)": {
    description: "Avalia a posição da escápula durante o movimento. Observação visual da simetria e ritmo escapuloumeral.",
    sn: "N/A",
    sp: "N/A"
  },
  "SRT (Scapular Retraction Test)": {
    description: "O examinador estabiliza a escápula em retração e o paciente realiza o teste de Jobe. Se houver melhora da força ou redução da dor, indica necessidade de estabilização escapular.",
    sn: "N/A",
    sp: "N/A"
  },

  // QUADRIL
  "FADIR": {
    description: "Flexão, Adução e Rotação Interna do quadril. Comprime a transição colo-cabeça femoral contra o acetábulo. Positivo se houver dor na virilha (Sinfai / Impacto).",
    sn: "0.94-0.99",
    sp: "0.10"
  },
  "FABER / Patrick": {
    description: "Flexão, Abdução e Rotação Externa. Calcanhar do lado afetado sobre o joelho oposto. O examinador estabiliza a pelve oposta e pressiona o joelho afetado. Positivo se houver dor no quadril ou na articulação sacroilíaca.",
    sn: "0.60-0.97",
    sp: "0.18-0.37"
  },
  "Teste de Thomas": {
    description: "Paciente abraça o joelho oposto contra o peito. O examinador observa se o fêmur da perna testada se eleva da maca (indicativo de encurtamento de flexores do quadril/psoas).",
    sn: "N/A",
    sp: "N/A"
  },
  "Trendelenburg": {
    description: "Paciente em apoio unipodal. Positivo se a pelve do lado sem apoio cair (indicativo de fraqueza do glúteo médio do lado de apoio).",
    sn: "0.23",
    sp: "0.94"
  },

  // JOELHO
  "Lachman": {
    description: "Joelho em 20-30° de flexão. Gaveta anterior súbita da tíbia. O teste mais confiável para integridade do Ligamento Cruzado Anterior (LCA).",
    sn: "0.85",
    sp: "0.94"
  },
  "Thessaly": {
    description: "Paciente em apoio unipodal rotacionando o tronco sobre o joelho em 20° de flexão. Simula carga funcional para detectar lesões meniscais.",
    sn: "0.90",
    sp: "0.97"
  },
  "Apreensão Patelar": {
    description: "O examinador pressiona a patela lateralmente enquanto flexiona passivamente o joelho. Positivo se o paciente contrair o quadríceps por medo de luxação.",
    sn: "N/A",
    sp: "N/A"
  },
  "Teste de Compressão de Noble": {
    description: "Pressão sobre o epicôndilo lateral do fêmur durante a extensão passiva do joelho a partir de 90°. Dor em torno de 30° indica síndrome do trato iliotibial.",
    sn: "N/A",
    sp: "N/A"
  },
  "Patellar Grinding": {
    description: "Paciente em decúbito dorsal. O examinador comprime a patela contra o fêmur e pede para o paciente contrair o quadríceps. Positivo se houver dor crepitação.",
    sn: "N/A",
    sp: "N/A"
  },
  "Zohlen's Sign": {
    description: "Similar ao Patellar Grinding. Pressão na base superior da patela enquanto o paciente realiza contração isométrica do quadríceps.",
    sn: "N/A",
    sp: "N/A"
  },

  // TORNOZELO E PÉ
  "Gaveta Anterior": {
    description: "Tração anterior do calcâneo/talus estabilizando a tíbia. Avalia a integridade do ligamento talofibular anterior (LTFA).",
    sn: "0.73",
    sp: "1.00"
  },
  "Thompson (Aquiles)": {
    description: "Compressão da panturrilha em decúbito ventral. Positivo se NÃO houver flexão plantar (indica ruptura completa do tendão de Aquiles).",
    sn: "0.96",
    sp: "0.98"
  },
  "Windlass Test": {
    description: "Extensão passiva forçada do hálux com o paciente em pé (carga). Positivo se reproduzir a dor na fáscia plantar (indicativo de fasciopatia).",
    sn: "0.32",
    sp: "1.00"
  },
  "Talar Tilt": {
    description: "Paciente em decúbito lateral. O examinador realiza inversão passiva do talus. Avalia o ligamento calcaneofibular (LCF).",
    sn: "0.67",
    sp: "0.75"
  },
  "Coleman Block Test": {
    description: "Uso de bloco sob o antepé lateral e borda lateral do retropé. Avalia a flexibilidade do retropé em casos de pé cavo/varo.",
    sn: "N/A",
    sp: "N/A"
  }
}
