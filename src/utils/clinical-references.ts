// src/utils/clinical-references.ts

export const CLINICAL_REFS = {
    // 1. FPI-6 (Foot Posture Index)
    // Ref: Redmond et al. (2006)
    fpi: {
        ranges: [
            { min: -12, max: -5, label: "Supinado Excessivo", color: "text-blue-800" },
            { min: -4, max: -1, label: "Supinado", color: "text-blue-600" },
            { min: 0, max: 5, label: "Neutro (Normal)", color: "text-green-600" },
            { min: 6, max: 9, label: "Pronado", color: "text-yellow-600" },
            { min: 10, max: 12, label: "Pronado Excessivo", color: "text-red-600" }
        ],
        description: "Classificação da postura estática do pé."
    },

    // 2. Jack Test (Mecanismo de Molinete)
    // Ref: Hall & Brody (1999) - Adaptação Visual (-5 a +5)
    // Nota: Originalmente é Grau 1 (ruim) a 3 (bom). Na escala visual:
    jack: {
        ranges: [
            { max: -1, label: "Bloqueio / Rigidez", color: "text-red-600" }, // Negativo
            { min: 0, max: 0, label: "Neutro", color: "text-slate-500" },
            { min: 1, label: "Mecanismo Eficiente", color: "text-green-600" } // Positivo
        ],
        description: "Avalia a função do Hallux e a ativação do arco plantar."
    },

    // 3. Lunge Test (Dorsiflexão)
    // Ref: Bennell et al. (1998)
    lunge: {
        unit: "graus",
        ranges: [
            { max: 35, label: "Restrito (<35º) - Risco", color: "text-red-600" },
            { min: 36, max: 44, label: "Moderado (36-44º)", color: "text-yellow-600" },
            { min: 45, label: "Normal (>45º)", color: "text-green-600" }
        ],
        description: "Amplitude de dorsiflexão em cadeia fechada."
    },

    // 4. Y-Balance Test (Controle Dinâmico)
    // Ref: Plisky et al. (2009) / Gonell (2015)
    ybalance: {
        asymmetry_cutoff: 4, // Diferença maior que 4cm é risco
        unit: "cm",
        description: "Assimetria anterior > 4cm indica risco aumentado de lesão."
    },

    // 5. Thomas Test (Flexores de Quadril)
    // Ref: Harvey (1998)
    thomas: {
        unit: "graus",
        // Normal: 0º (Coxa paralela à maca). Positivo: >0º (Encurtamento)
        cutoff: 0,
        label_normal: "Normal (0º)",
        label_short: "Encurtamento (>0º)"
    },

    // 6. APA (Ângulo Perna-Antepé)
    // Ref: Mendonça et al. (2013)
    apa: {
        target: 14, // Valor ideal
        tolerance: 4, // Aceitável entre 10 e 18
        description: "Alinhamento ideal de 14º de rotação externa."
    },

    // 7. Rigidez de Rotadores Laterais (Hip Stiffness)
    // Ref: Carvalhais et al. (2011) - Teste de Queda em Decúbito Ventral
    hip_rotation_stiffness: {
        unit: "graus",
        ranges: [
            { max: 39, label: "Rigidez Aumentada (<40º)", color: "text-red-600" },
            { min: 40, max: 42, label: "Normal (40-42º)", color: "text-green-600" }, // Faixa estreita do estudo
            { min: 43, label: "Rigidez Diminuída (>42º)", color: "text-yellow-600" }
        ],
        description: "Ângulo onde ocorre a primeira resistência passiva."
    },

    // 8. Craig Test (Anteversão Femoral)
    // Ref: Ruwe et al. (1992)
    craig: {
        unit: "graus",
        ranges: [
            { max: 7, label: "Retroversão (<8º)", color: "text-blue-600" },
            { min: 8, max: 15, label: "Normal (8-15º)", color: "text-green-600" },
            { min: 16, label: "Anteversão Excessiva (>15º)", color: "text-orange-600" }
        ],
        description: "Avalia a torção femoral."
    },

    // 9. Naviculômetro (Altura do Arco Absoluta)
    // Ref: Brody (1982) adaptado para altura absoluta
    navicular_height: {
        ranges: [
            { max: 20, label: "Arco Baixo/Plano (<=20mm)", color: "bg-red-100 text-red-800" },
            { min: 21, max: 27, label: "Arco Médio (21-27mm)", color: "bg-green-100 text-green-800" },
            { min: 28, label: "Arco Alto/Cavo (>=28mm)", color: "bg-orange-100 text-orange-800" }
        ]
    }
};

// Função auxiliar para verificar status rapidamente
export function checkStatus(test: keyof typeof CLINICAL_REFS, value: number) {
    const ref = CLINICAL_REFS[test] as any;
    if (!ref || !ref.ranges) return null;

    return ref.ranges.find((r: any) => {
        const isMin = r.min === undefined || value >= r.min;
        const isMax = r.max === undefined || value <= r.max;
        return isMin && isMax;
    });
}
