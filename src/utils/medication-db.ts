// Objeto de mapeamento para descrições rápidas
export const MED_DESCRIPTIONS: Record<string, string> = {
    // Analgésicos e Antipiréticos
    "Paracetamol (Tylenol)": "Analgésico e Antipirético. Indicado para dor leve a moderada e febre. Pouca atividade anti-inflamatória.",
    "Dipirona (Novalgina)": "Analgésico e Antipirético potente. Indicado para dores viscerais e febre. Risco raro de agranulocitose.",
    "Ibuprofeno (Advil, Alivium)": "AINE (Anti-inflamatório Não Esteroidal). Analgésico, antitérmico e anti-inflamatório.",
    "Aspirina (Ácido Acetilsalicílico)": "AINE e Antiagregante Plaquetário. Usado para dor, inflamação e prevenção cardiovascular.",

    // Anti-inflamatórios (AINEs)
    "Diclofenaco Sódico (Voltaren)": "AINE potente. Indicado para inflamações articulares e dores agudas. Risco gástrico e cardiovascular.",
    "Diclofenaco Potássico (Cataflam)": "AINE de ação rápida. Melhor para dores agudas que exigem alívio imediato.",
    "Nimesulida (Nisulid)": "AINE com afinidade COX-2 preferencial. Potente anti-inflamatório. Risco de hepatotoxicidade em uso prolongado.",
    "Meloxicam": "AINE inibidor preferencial de COX-2. Usado em artrites e osteoartrites com menor impacto gástrico.",
    "Piroxicam": "AINE de meia-vida longa (dose única diária). Usado em condições crônicas como artrite reumatoide.",
    "Celecoxibe (Celebra)": "AINE Inibidor Seletivo da COX-2. Menor risco gástrico, mas exige cautela cardiovascular.",
    "Etoricoxibe (Arcoxia)": "AINE Inibidor Seletivo da COX-2. Potente ação analgésica em dores ortopédicas e pós-cirúrgicas.",
    "Naproxeno (Flanax)": "AINE com perfil cardiovascular mais seguro que outros. Indicado para dores musculares e tendinites.",
    "Cetoprofeno (Profenid)": "AINE com potente ação analgésica e anti-inflamatória. Bastante usado em traumas e contusões.",
    "Indometacina": "AINE muito potente. Usado em gota aguda e espondilite anquilosante. Alto índice de efeitos colaterais.",

    // Corticoides
    "Prednisona": "Corticosteroide. Anti-inflamatório hormonal potente e imunossupressor. Exige desmame gradual.",
    "Prednisolona": "Corticosteroide (metabólito ativo da prednisona). Mesmas indicações, ação mais direta no fígado.",
    "Dexametasona (Decadron)": "Corticosteroide de longa ação e alta potência. Forte efeito anti-inflamatório cerebral e sistêmico.",
    "Betametasona": "Corticosteroide potente de longa ação. Frequentemente usado em injeções de depósito.",
    "Triancinolona": "Corticosteroide de média potência. Usado em infiltrações articulares e dermatologia.",
    "Hidrocortisona": "Corticosteroide de curta ação. Similar ao cortisol endógeno. Usado em emergências alérgicas e reposição.",

    // Relaxantes Musculares
    "Ciclobenzaprina (Miosan)": "Relaxante muscular de ação central. Alivia espasmos musculares agudos. Pode causar sonolência.",
    "Orfenadrina (Dorflex)": "Relaxante muscular e analgésico fraco. Comumente associado à dipirona e cafeína.",
    "Carisoprodol (Mioflex)": "Relaxante muscular. Metabolizado em meprobamato (sedativo). Risco de dependência.",
    "Tizanidina (Sirdalud)": "Relaxante muscular agonista alfa-2. Usado para espasticidade e tensões crônicas.",
    "Baclofeno": "Relaxante muscular agonista GABA-B. Padrão ouro para espasticidade neurológica (esclerose, lesão medular).",

    // Opioides
    "Tramadol (Tramal)": "Opioide fraco. Indicado para dor moderada a grave. Age também na recaptação de serotonina/noradrenalina.",
    "Codeína (Paco)": "Opioide fraco e antitussígeno. Metabolizado em morfina no fígado. Usado com paracetamol.",
    "Morfina": "Opioide forte. Padrão ouro para dor oncológica e aguda grave.",
    "Oxicodona (Oxycontin)": "Opioide forte semissintético. Alta potência analgésica e potencial de dependência.",
    "Metadona": "Opioide sintético de longa duração. Usado em dor crônica e tratamento de dependência de opioides.",

    // Anti-hipertensivos
    "Losartana": "BRA (Bloqueador do Receptor de Angiotensina). Controla pressão arterial e protege os rins em diabéticos.",
    "Enalapril": "IECA (Inibidor da Enzima Conversora de Angiotensina). Vasodilatador, protege coração e rins.",
    "Captopril": "IECA de ação rápida. Muito usado em crises hipertensivas de urgência.",
    "Hidroclorotiazida": "Diurético tiazídico. Remove excesso de sal e água, reduzindo a pressão.",
    "Atenolol": "Betabloqueador seletivo. Reduz frequência cardíaca e pressão.",
    "Propranolol": "Betabloqueador não seletivo. Usado em hipertensão, enxaqueca, tremor essencial e ansiedade.",
    "Anlodipino": "Bloqueador de Canal de Cálcio. Vasodilatador periférico potente.",
    "Furosemida": "Diurético de alça. Potente, usado em edema (inchaço) e insuficiência cardíaca.",
    "Espironolactona": "Diurético poupador de potássio. Usado em insuficiência cardíaca e acne hormonal.",
    "Carvedilol": "Betabloqueador misto. Fundamental no tratamento da insuficiência cardíaca.",

    // Diabetes
    "Metformina (Glifage)": "Biguanida. Melhora sensibilidade à insulina. Primeira escolha no Diabetes Tipo 2.",
    "Glibenclamida": "Sulfonilureia. Estimula o pâncreas a liberar mais insulina. Risco de hipoglicemia.",
    "Insulina": "Hormônio anabólico. Essencial para Diabetes Tipo 1 e casos avançados de Tipo 2.",
    "Dapagliflozina (Forxiga)": "Inibidor SGLT2. Elimina glicose na urina. Proteção cardiovascular e renal.",
    "Sitagliptina (Januvia)": "Inibidor da DPP-4. Aumenta incretinas, estimulando insulina dependente da glicose.",

    // Colesterol
    "Sinvastatina": "Estatina. Reduz produção de colesterol no fígado. Prevenção cardiovascular.",
    "Atorvastatina": "Estatina potente. Reduz LDL e triglicerídeos.",
    "Rosuvastatina": "Estatina de alta potência. Indicada para hipercolesterolemia grave.",

    // Gástricos
    "Omeprazol": "IBP (Inibidor de Bomba de Prótons). Reduz acidez gástrica.",
    "Pantoprazol": "IBP. Menor interação medicamentosa que o omeprazol.",
    "Esomeprazol": "IBP. Isômero S do omeprazol, maior biodisponibilidade.",
    "Lansoprazol": "IBP de ação rápida.",
    "Simeticona": "Antiflatulento. Rompe bolhas de gás no intestino.",

    // Antibióticos
    "Amoxicilina": "Penicilina. Amplo espectro. Infecções respiratórias, urinárias e dentárias.",
    "Azitromicina": "Macrolídeo. Ação prolongada. Infecções respiratórias e DSTs.",
    "Ciprofloxacino": "Quinolona. Infecções urinárias e gastrointestinais.",
    "Levofloxacino": "Quinolona respiratória. Pneumonias e sinusites.",
    "Cefalexina": "Cefalosporina de 1ª geração. Infecções de pele e tecidos moles.",
    "Sulfametoxazol + Trimetoprima (Bactrim)": "Sulfonamida. Infecções urinárias e respiratórias.",

    // Psiquiatria
    "Fluoxetina": "ISRS (Inibidor Seletivo de Recaptação de Serotonina). Depressão e Ansiedade.",
    "Sertralina": "ISRS. Muito usado em pânico e ansiedade social. Seguro em cardiopatas.",
    "Escitalopram": "ISRS. Mais seletivo da classe. Bem tolerado em ansiedade.",
    "Citalopram": "ISRS. Precursor do escitalopram.",
    "Paroxetina": "ISRS. Potente ansiolítico, mas maior risco de ganho de peso e abstinência.",
    "Venlafaxina": "Dual (Serotonina e Noradrenalina). Depressão maior e dor crônica.",
    "Duloxetina": "Dual. Aprovado para fibromialgia, dor neuropática e depressão.",
    "Amitriptilina": "Tricíclico. Antidepressivo antigo, muito usado hoje em dose baixa para dor crônica e sono.",
    "Clonazepam (Rivotril)": "Benzodiazepínico. Sedativo, ansiolítico e anticonvulsivante. Risco de dependência.",
    "Diazepam": "Benzodiazepínico de longa duração. Relaxante muscular e ansiolítico.",
    "Alprazolam": "Benzodiazepínico de curta duração. Crises de pânico agudas.",
    "Zolpidem": "Hipnótico não-benzodiazepínico. Indutor do sono.",

    // Anticoagulantes
    "Varfarina": "Antagonista da Vitamina K. Anticoagulante antigo, exige monitoramento de INR.",
    "Xarelto (Rivaroxabana)": "Anticoagulante oral direto (fator Xa). Não exige monitoramento frequente.",
    "Eliquis (Apixabana)": "Anticoagulante oral direto. Prevenção de AVC em fibrilação atrial.",
    "Clexane (Enoxaparina)": "Heparina de baixo peso molecular. Injetável. Prevenção de trombose hospitalar.",

    // Outros
    "Levotiroxina (Puran T4)": "Hormônio tireoidiano sintético. Reposição em hipotireoidismo.",
    "Sildenafil (Viagra)": "Inibidor da PDE-5. Disfunção erétil e hipertensão pulmonar.",
    "Tadalafila (Cialis)": "Inibidor da PDE-5 de longa duração.",
    "Finasterida": "Inibidor da 5-alfa-redutase. Calvície e hiperplasia prostática benigna.",
    "Alopurinol": "Inibidor da xantina oxidase. Prevenção de crises de gota.",
    "Vitamina D": "Hormônio esteroide. Saúde óssea e imune.",
    "Cálcio": "Mineral essencial para ossos.",
    "Magnésio": "Mineral importante para função muscular e nervosa.",
    "Ômega 3": "Ácido graxo essencial. Saúde cardiovascular e anti-inflamatório.",
    "Glucosamina": "Componente da cartilagem. Uso controverso em artrose.",
    "Condroitina": "Componente da matriz cartilaginosa.",
    "Colágeno Tipo II": "Proteína estrutural da cartilagem articular."
};

export const MEDICATIONS_DB = Object.keys(MED_DESCRIPTIONS).sort();
