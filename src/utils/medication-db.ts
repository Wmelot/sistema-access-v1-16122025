export interface MedicationDetail {
    activePrinciple: string;
    tradeNames: string[];
    description: string;
    category: string;
}

export const MEDICATIONS_DATA: MedicationDetail[] = [
    // Analgésicos e Opioides
    {
        activePrinciple: "Paracetamol",
        tradeNames: ["Tylenol", "Tylemax", "Vick Pyrena"],
        description: "Analgésico e Antipirético. Indicado para dor leve a moderada e febre. Pouca atividade anti-inflamatória.",
        category: "Analgésicos"
    },
    {
        activePrinciple: "Dipirona",
        tradeNames: ["Novalgina", "Neosaldina", "Lisador", "Doralgina", "Maxalgina"],
        description: "Analgésico e Antipirético potente. Muito usado no Brasil para febre e dores variadas.",
        category: "Analgésicos"
    },
    {
        activePrinciple: "Tramadol",
        tradeNames: ["Tramal", "Sylador"],
        description: "Opioide fraco. Indicado para dor moderada a grave. Age também na recaptação de serotonina/noradrenalina.",
        category: "Analgésicos / Opioides"
    },
    {
        activePrinciple: "Codeína",
        tradeNames: ["Paco", "Tylex", "Codaten"],
        description: "Opioide fraco. Frequentemente associado ao paracetamol ou diclofenaco para dores moderadas.",
        category: "Analgésicos / Opioides"
    },
    {
        activePrinciple: "Morfina",
        tradeNames: ["Dimorf"],
        description: "Opioide forte. Padrão ouro para dor oncológica e dor aguda intensa.",
        category: "Analgésicos / Opioides"
    },
    {
        activePrinciple: "Oxicodona",
        tradeNames: ["Oxycontin", "Oxypynal"],
        description: "Opioide forte semissintético. Alta potência analgésica.",
        category: "Analgésicos / Opioides"
    },

    // AINEs (Anti-inflamatórios Não Esteroidais)
    {
        activePrinciple: "Ibuprofeno",
        tradeNames: ["Advil", "Alivium", "Buscofem", "Doraliv"],
        description: "AINE. Analgésico, antitérmico e anti-inflamatório. Comum em dores musculares.",
        category: "Anti-inflamatórios"
    },
    {
        activePrinciple: "Diclofenaco",
        tradeNames: ["Voltaren", "Cataflam", "Biofenac"],
        description: "AINE potente. Indicado para inflamações articulares, agudas e pós-traumáticas.",
        category: "Anti-inflamatórios"
    },
    {
        activePrinciple: "Nimesulida",
        tradeNames: ["Nisulid", "Scaflam", "Maxsulid"],
        description: "AINE com afinidade COX-2 preferencial. Potente anti-inflamatório. Uso limitado a 7-10 dias.",
        category: "Anti-inflamatórios"
    },
    {
        activePrinciple: "Cetoprofeno",
        tradeNames: ["Profenid", "Artrosil", "Artrodar"],
        description: "AINE com potente ação analgésica. Muito usado em traumas e pós-operatório ortopédico.",
        category: "Anti-inflamatórios"
    },
    {
        activePrinciple: "Naproxeno",
        tradeNames: ["Flanax", "Naprosyn"],
        description: "AINE com perfil cardiovascular mais seguro. Longa duração (12h).",
        category: "Anti-inflamatórios"
    },
    {
        activePrinciple: "Celecoxibe",
        tradeNames: ["Celebra"],
        description: "AINE Inibidor Seletivo da COX-2. Menor risco gástrico, usado em osteoartrite e AR.",
        category: "Anti-inflamatórios"
    },
    {
        activePrinciple: "Etoricoxibe",
        tradeNames: ["Arcoxia"],
        description: "AINE Inibidor Seletivo da COX-2. Potência elevada para dores ortopédicas.",
        category: "Anti-inflamatórios"
    },
    {
        activePrinciple: "Meloxicam",
        tradeNames: ["Movalis"],
        description: "AINE para uso prolongado em artrites com melhor tolerância gástrica.",
        category: "Anti-inflamatórios"
    },
    {
        activePrinciple: "Tenoxicam",
        tradeNames: ["Tilasur", "Tebic"],
        description: "AINE de longa vida média. Dose única diária.",
        category: "Anti-inflamatórios"
    },
    {
        activePrinciple: "Piroxicam",
        tradeNames: ["Feldene"],
        description: "AINE potente de ação lenta, muito usado em condições inflamatórias crônicas.",
        category: "Anti-inflamatórios"
    },

    // Corticoides
    {
        activePrinciple: "Prednisona",
        tradeNames: ["Meticorten"],
        description: "Corticosteroide. Anti-inflamatório hormonal potente. Exige desmame gradual.",
        category: "Corticosteroides"
    },
    {
        activePrinciple: "Prednisolona",
        tradeNames: ["Prelone", "Predsim"],
        description: "Corticosteroide. Ação direta, muito usada em processos alérgicos e inflamatórios.",
        category: "Corticosteroides"
    },
    {
        activePrinciple: "Dexametasona",
        tradeNames: ["Decadron"],
        description: "Corticosteroide de alta potência e longa ação.",
        category: "Corticosteroides"
    },
    {
        activePrinciple: "Betametasona",
        tradeNames: ["Celestone", "Diprospan"],
        description: "Corticosteroide potente. Diprospan é a forma de depósito (injetável).",
        category: "Corticosteroides"
    },
    {
        activePrinciple: "Metilprednisolona",
        tradeNames: ["Solu-Medrol", "Depo-Medrol"],
        description: "Corticosteroide potente, frequentemente usado em pulsoterapia ou infiltrações.",
        category: "Corticosteroides"
    },

    // Relaxantes Musculares
    {
        activePrinciple: "Ciclobenzaprina",
        tradeNames: ["Miosan", "Musculare", "Benziflex"],
        description: "Relaxante muscular de ação central. Pode causar sonolência e boca seca.",
        category: "Relaxantes Musculares"
    },
    {
        activePrinciple: "Tizanidina",
        tradeNames: ["Sirdalud"],
        description: "Relaxante muscular agonista alfa-2. Usado para espasticidade e tensões crônicas.",
        category: "Relaxantes Musculares"
    },
    {
        activePrinciple: "Baclofeno",
        tradeNames: ["Lioresal"],
        description: "Relaxante muscular para espasticidade neurológica severa.",
        category: "Relaxantes Musculares"
    },
    {
        activePrinciple: "Carisoprodol",
        tradeNames: ["Mioflex", "Beserol", "Tandrilax"],
        description: "Relaxante muscular geralmente associado a AINEs. Risco de dependência.",
        category: "Relaxantes Musculares"
    },

    // Psiquiatria e Neurologia
    {
        activePrinciple: "Fluoxetina",
        tradeNames: ["Prozac", "Daforin", "Verup"],
        description: "ISRS. Depressão, ansiedade e transtornos alimentares.",
        category: "Psiquiatria"
    },
    {
        activePrinciple: "Sertralina",
        tradeNames: ["Zoloft", "Assert", "Tolrest"],
        description: "ISRS. Primeira linha para pânico e ansiedade social.",
        category: "Psiquiatria"
    },
    {
        activePrinciple: "Escitalopram",
        tradeNames: ["Lexapro", "Reconter", "Exodus"],
        description: "ISRS. Alta seletividade, bem tolerado.",
        category: "Psiquiatria"
    },
    {
        activePrinciple: "Paroxetina",
        tradeNames: ["Pondera", "Paxil"],
        description: "ISRS potente, muito usado em transtorno de ansiedade generalizada.",
        category: "Psiquiatria"
    },
    {
        activePrinciple: "Duloxetina",
        tradeNames: ["Cymbalta", "Velija", "Dual"],
        description: "Dual (Serotonina/Noradrenalina). Excelente para dor crônica e fibromialgia.",
        category: "Psiquiatria / Dor Crônica"
    },
    {
        activePrinciple: "Venlafaxina",
        tradeNames: ["Efexor", "Alenthus"],
        description: "Dual. Depressão maior e ansiedade generalizada.",
        category: "Psiquiatria"
    },
    {
        activePrinciple: "Desvenlafaxina",
        tradeNames: ["Pristiq", "Deller"],
        description: "Dual. Metabólito ativo da venlafaxina, menor interação medicamentosa.",
        category: "Psiquiatria"
    },
    {
        activePrinciple: "Amitriptilina",
        tradeNames: ["Tryptanol", "Amytril"],
        description: "Tricíclico. Muito usado para modulação de dor crônica e sono em doses baixas.",
        category: "Neurologia / Dor"
    },
    {
        activePrinciple: "Nortriptilina",
        tradeNames: ["Pamelor"],
        description: "Tricíclico com menos efeitos colaterais que a amitriptilina.",
        category: "Neurologia / Dor"
    },
    {
        activePrinciple: "Pregabalina",
        tradeNames: ["Lyrica", "Prebictal", "Insit"],
        description: "Neuromodulador. Padrão ouro para dor neuropática e fibromialgia.",
        category: "Neurologia / Dor"
    },
    {
        activePrinciple: "Gabapentina",
        tradeNames: ["Neurontin"],
        description: "Neuromodulador para dor neuropática e crises convulsivas.",
        category: "Neurologia / Dor"
    },
    {
        activePrinciple: "Clonazepam",
        tradeNames: ["Rivotril"],
        description: "Benzodiazepínico. Sedativo e ansiolítico potente. Risco de dependência.",
        category: "Psiquiatria"
    },
    {
        activePrinciple: "Alprazolam",
        tradeNames: ["Frontal"],
        description: "Benzodiazepínico para crises agudas de pânico.",
        category: "Psiquiatria"
    },
    {
        activePrinciple: "Zolpidem",
        tradeNames: ["Stilnox", "Patz"],
        description: "Hipnótico para insônia de curta duração.",
        category: "Psiquiatria"
    },
    {
        activePrinciple: "Quetiapina",
        tradeNames: ["Seroquel", "Quetros"],
        description: "Antipsicótico atípico. Usado em transtorno bipolar e como adjuvante no sono.",
        category: "Psiquiatria"
    },
    {
        activePrinciple: "Risperidona",
        tradeNames: ["Risperdal"],
        description: "Antipsicótico usado para transtornos de conduta e bipolaridade.",
        category: "Psiquiatria"
    },
    {
        activePrinciple: "Topiramato",
        tradeNames: ["Topamax", "Amato"],
        description: "Anticonvulsivante usado na prevenção de enxaqueca e controle de impulsos.",
        category: "Neurologia"
    },

    // Anti-hipertensivos e Cardiovasculares
    {
        activePrinciple: "Losartana",
        tradeNames: ["Aradois", "Torlós"],
        description: "BRA. Anti-hipertensivo mais usado e proteção renal.",
        category: "Cardiovascular"
    },
    {
        activePrinciple: "Enalapril",
        tradeNames: ["Renitec"],
        description: "IECA. Vasodilatador para pressão e insuficiência cardíaca.",
        category: "Cardiovascular"
    },
    {
        activePrinciple: "Captopril",
        tradeNames: ["Capoten"],
        description: "IECA de ação rápida.",
        category: "Cardiovascular"
    },
    {
        activePrinciple: "Anlodipino",
        tradeNames: ["Norvasc", "Cordarex"],
        description: "Bloqueador de canal de cálcio. Vasodilatador periférico.",
        category: "Cardiovascular"
    },
    {
        activePrinciple: "Atenolol",
        tradeNames: ["Atenol", "Ablok"],
        description: "Betabloqueador. Reduz frequência cardíaca e pressão.",
        category: "Cardiovascular"
    },
    {
        activePrinciple: "Propranolol",
        tradeNames: ["Inderal"],
        description: "Betabloqueador. Usado também em enxaqueca e tremores.",
        category: "Cardiovascular"
    },
    {
        activePrinciple: "Carvedilol",
        tradeNames: ["Coreg"],
        description: "Betabloqueador misto para insuficiência cardíaca.",
        category: "Cardiovascular"
    },
    {
        activePrinciple: "Furosemida",
        tradeNames: ["Lasix"],
        description: "Diurético potente.",
        category: "Cardiovascular"
    },
    {
        activePrinciple: "Hidroclorotiazida",
        tradeNames: ["Clorana"],
        description: "Diurético tiazídico.",
        category: "Cardiovascular"
    },
    {
        activePrinciple: "Rosuvastatina",
        tradeNames: ["Crestor", "Vivacor"],
        description: "Estatina de alta potência para colesterol.",
        category: "Cardiovascular"
    },
    {
        activePrinciple: "Atorvastatina",
        tradeNames: ["Lipitor"],
        description: "Estatina potente.",
        category: "Cardiovascular"
    },
    {
        activePrinciple: "Sinvastatina",
        tradeNames: ["Zocor", "Sinvascor"],
        description: "Estatina clássica.",
        category: "Cardiovascular"
    },
    {
        activePrinciple: "Varfarina",
        tradeNames: ["Marevan"],
        description: "Anticoagulante antagonista da Vitamina K.",
        category: "Cardiovascular"
    },
    {
        activePrinciple: "Rivaroxabana",
        tradeNames: ["Xarelto"],
        description: "Anticoagulante oral de ação direta (Fator Xa).",
        category: "Cardiovascular"
    },
    {
        activePrinciple: "Apixabana",
        tradeNames: ["Eliquis"],
        description: "Anticoagulante oral de ação direta.",
        category: "Cardiovascular"
    },

    // Diabetes e Metabolismo
    {
        activePrinciple: "Metformina",
        tradeNames: ["Glifage"],
        description: "Biguanida para Diabetes Tipo 2. Proteção cardiovascular.",
        category: "Metabólico"
    },
    {
        activePrinciple: "Dapagliflozina",
        tradeNames: ["Forxiga"],
        description: "Inibidor SGLT2. Elimina glicose via urina.",
        category: "Metabólico"
    },
    {
        activePrinciple: "Empagliflozina",
        tradeNames: ["Jardiance"],
        description: "Inibidor SGLT2. Forte proteção renal e cardíaca.",
        category: "Metabólico"
    },
    {
        activePrinciple: "Liraglutida",
        tradeNames: ["Victoza", "Saxenda"],
        description: "Análogo de GLP-1 (Injetável). Diabetes e obesidade.",
        category: "Metabólico"
    },
    {
        activePrinciple: "Semaglutida",
        tradeNames: ["Ozempic", "Rybelsus", "Wegovy"],
        description: "Análogo de GLP-1 potente. Diabetes e perda de peso.",
        category: "Metabólico"
    },
    {
        activePrinciple: "Glibenclamida",
        tradeNames: ["Daonil"],
        description: "Sulfonilureia. Estimula a liberação de insulina pelo pâncreas.",
        category: "Metabólico"
    },

    // Osteoporose e Reumatologia
    {
        activePrinciple: "Alendronato",
        tradeNames: ["Fosamax"],
        description: "Bisfosfonato para tratamento de osteoporose.",
        category: "Osteometabólico"
    },
    {
        activePrinciple: "Risedronato",
        tradeNames: ["Actonel"],
        description: "Bisfosfonato para osteoporose.",
        category: "Osteometabólico"
    },
    {
        activePrinciple: "Denosumabe",
        tradeNames: ["Prolia", "Xgeva"],
        description: "Anticorpo monoclonal. Inibidor de RANKL para osteoporose severa.",
        category: "Osteometabólico"
    },
    {
        activePrinciple: "Metotrexato",
        tradeNames: ["Metoject"],
        description: "Imunossupressor para Artrite Reumatoide e Psoríase.",
        category: "Reumatologia"
    },
    {
        activePrinciple: "Leflunomida",
        tradeNames: ["Arava"],
        description: "Drogas modificadoras do curso da doença (DMARD) para AR.",
        category: "Reumatologia"
    },
    {
        activePrinciple: "Hidroxicloroquina",
        tradeNames: ["Reuquinol"],
        description: "Antimalárico usado em Lúpus e Artrite Reumatoide.",
        category: "Reumatologia"
    },

    // Gástricos
    {
        activePrinciple: "Omeprazol",
        tradeNames: ["Losec", "Gastrium"],
        description: "IBP. Reduz acidez gástrica.",
        category: "Gastrointestinal"
    },
    {
        activePrinciple: "Pantoprazol",
        tradeNames: ["Pantozol"],
        description: "IBP com menos interações.",
        category: "Gastrointestinal"
    },
    {
        activePrinciple: "Esomeprazol",
        tradeNames: ["Nexium"],
        description: "IBP potente.",
        category: "Gastrointestinal"
    },
    {
        activePrinciple: "Vonoprazana",
        tradeNames: ["Inzelm"],
        description: "Novo bloqueador de ácido altamente potente.",
        category: "Gastrointestinal"
    },
    {
        activePrinciple: "Domperidona",
        tradeNames: ["Motilium"],
        description: "Procinético, ajuda no esvaziamento gástrico.",
        category: "Gastrointestinal"
    },

    // Antibióticos
    {
        activePrinciple: "Amoxicilina",
        tradeNames: ["Amoxil", "Hiconcil", "Novamox"],
        description: "Penicilina de amplo espectro.",
        category: "Antibióticos"
    },
    {
        activePrinciple: "Amoxicilina + Clavulanato",
        tradeNames: ["Clavulin"],
        description: "Antibiótico reforçado para resistências bacterianas.",
        category: "Antibióticos"
    },
    {
        activePrinciple: "Azitromicina",
        tradeNames: ["Zitromax", "Astro"],
        description: "Macrolídeo. Curto tempo de tratamento.",
        category: "Antibióticos"
    },
    {
        activePrinciple: "Ciprofloxacino",
        tradeNames: ["Cipro"],
        description: "Quinolona para infecções urinárias e outras.",
        category: "Antibióticos"
    },
    {
        activePrinciple: "Levofloxacino",
        tradeNames: ["Levaquin"],
        description: "Quinolona respiratória.",
        category: "Antibióticos"
    },
    {
        activePrinciple: "Cefalexina",
        tradeNames: ["Keflex"],
        description: "Cefalosporina para infecções de pele e respiratórias.",
        category: "Antibióticos"
    },

    // Endócrino e Outros
    {
        activePrinciple: "Levotiroxina",
        tradeNames: ["Puran T4", "Synthroid", "Euthyrox"],
        description: "Hormônio tireoidiano para hipotireoidismo.",
        category: "Endócrino"
    },
    {
        activePrinciple: "Alopurinol",
        tradeNames: ["Zyloric"],
        description: "Reduz produção de ácido úrico (Gota).",
        category: "Reumatologia"
    },
    {
        activePrinciple: "Vitamina D3 (Colecalciferol)",
        tradeNames: ["Addera D3"],
        description: "Mineralização óssea e função imune.",
        category: "Suplementos"
    },
    {
        activePrinciple: "Finasterida",
        tradeNames: ["Proscar", "Finalop"],
        description: "Inibidor da 5-alfa-redutase para próstata e calvície.",
        category: "Outros"
    }
];

// Mapper de descrições robusto
export const MED_DESCRIPTIONS: Record<string, string> = {};
MEDICATIONS_DATA.forEach(m => {
    const fullLabel = `${m.activePrinciple} (${m.tradeNames.join(', ')})`;
    MED_DESCRIPTIONS[fullLabel] = m.description;
    
    // Mapeia também o princípio e as marcas individualmente para facilitar lookups inteligentes
    if (!MED_DESCRIPTIONS[m.activePrinciple]) MED_DESCRIPTIONS[m.activePrinciple] = m.description;
    m.tradeNames.forEach(t => {
        if (!MED_DESCRIPTIONS[t]) MED_DESCRIPTIONS[t] = m.description;
    });
});

// Lista única para o Combobox ordenada
export const MEDICATIONS_DB = MEDICATIONS_DATA.map(m => 
    `${m.activePrinciple} (${m.tradeNames.join(', ')})`
).sort();
