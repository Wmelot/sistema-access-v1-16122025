// src/utils/clinical-references.ts

export const CLINICAL_REFS = {
    // 1. FPI-6 (Foot Posture Index)
    // Ref: Redmond et al. (2006)
    fpi: {
        ranges: [
            { min: -12, max: -10, label: "Cavo Excessivo", color: "text-blue-800" },
            { min: -9, max: -6, label: "Cavo", color: "text-blue-600" },
            { min: -5, max: 5, label: "Neutro (Normal)", color: "text-green-600" },
            { min: 6, max: 9, label: "Plano", color: "text-yellow-600" },
            { min: 10, max: 12, label: "Plano Excessivo", color: "text-red-600" }
        ],
        description: "Classificação da postura estática do pé."
    },

    // 2. Jack Test (Mecanismo de Molinete)
    // Ref: Hall & Brody (1999) - Adaptação Visual (-5 a +5)
    // Nota: Originalmente é Grau 1 (ruim) a 3 (bom). Na escala visual:
    jack: {
        ranges: [
            { max: -1, label: "Bloqueio / Rigidez", color: "bg-red-100 text-red-700 border-red-200" }, // Negativo
            { min: 0, max: 0, label: "Neutro", color: "bg-slate-100 text-slate-600 border-slate-200" },
            { min: 1, label: "Mecanismo Eficiente", color: "bg-green-100 text-green-700 border-green-200" } // Positivo
        ],
        description: "Avalia a função do Hallux e a ativação do arco plantar."
    },

    // 3. Lunge Test (Dorsiflexão)
    // Ref: Bennell et al. (1998)
    lunge: {
        unit: "graus",
        ranges: [
            { max: 35, label: "Risco elevado (<35º)", color: "bg-red-100 text-red-600 border-red-200" },
            { min: 36, max: 44, label: "Risco moderado (36-44º)", color: "bg-yellow-100 text-yellow-600 border-yellow-200" },
            { min: 45, label: "Baixo risco (>45º)", color: "bg-green-100 text-green-600 border-green-200" }
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



    // 6. APA (Ângulo Perna-Antepé)
    // Ref: Mendonça et al. (2013)
    apa: {
        target: 14, // Valor ideal
        tolerance: 4, // Aceitável entre 10 e 18
        description: "Alinhamento ideal de 14º - (10-18º)."
    },

    // 7. Rigidez de Rotadores Laterais (Hip Stiffness)
    // Ref: Carvalhais et al. (2011) - Teste de Queda em Decúbito Ventral
    hip_rotation_stiffness: {
        unit: "graus",
        ranges: [
            { max: 39, label: "Rigidez Aumentada (<40º)", color: "bg-red-100 text-red-600 border-red-200" },
            { min: 40, max: 42, label: "Normal (40-42º)", color: "bg-green-100 text-green-600 border-green-200" }, // Faixa estreita do estudo
            { min: 43, label: "Rigidez Diminuída (>42º)", color: "bg-yellow-100 text-yellow-600 border-yellow-200" }
        ],
        description: "Ângulo onde ocorre a primeira resistência passiva."
    },

    // 8. Craig Test (Anteversão Femoral)
    // Ref: Ruwe et al. (1992)
    craig: {
        unit: "graus",
        ranges: [
            { max: 7, label: "Retroversão (<8º)", color: "bg-blue-100 text-blue-600 border-blue-200" },
            { min: 8, max: 15, label: "Normal (8-15º)", color: "bg-green-100 text-green-600 border-green-200" },
            { min: 16, label: "Anteversão (>15º)", color: "bg-orange-100 text-orange-600 border-orange-200" }
        ],
        description: "Avalia a torção femoral."
    },

    // 9. Naviculômetro (Altura do Arco)
    // Ref: Tabela de Referência por Tamanho de Calçado
    navicular_height: {
        description: "Altura do arco (mm) relativa ao tamanho do calçado."
    },

    // 10. Thomas Test (Flexores de Quadril)
    thomas: {
        unit: "graus",
        ranges: [
            { min: -10, max: 0, label: "Normal (-10º a 0º)", color: "bg-green-100 text-green-700 border-green-200" },
            { min: 0.1, label: "Encurtamento (>0º)", color: "bg-red-100 text-red-700 border-red-200" }
        ],
        description: "Normal: Entre -10º e 0º. Encurtamento: Valores acima de 0º (coxa não toca a maca)."
    },

    // 11. SLR (Isquiosurais)
    slr: {
        unit: "graus",
        ranges: [
            { max: 131.9, label: "Déficit de Flexibilidade (<132º)", color: "bg-red-100 text-red-700 border-red-200" },
            { min: 132, label: "Normal (≥132º)", color: "bg-green-100 text-green-700 border-green-200" }
        ],
        description: "Straight Leg Raise - Referência de normalidade: 132º."
    },

    // 12. ITB (Índice Tornozelo-Braço)
    itb: {
        ranges: [
            { max: 0.89, label: "DAOP / Isquemia (<0.90)", color: "bg-red-100 text-red-700 border-red-200" },
            { min: 0.9, max: 1.3, label: "Normal (0.9-1.3)", color: "bg-green-100 text-green-700 border-green-200" },
            { min: 1.31, label: "Calcificação (>1.30)", color: "bg-yellow-100 text-yellow-700 border-yellow-200" }
        ],
        description: "Razão entre a maior pressão sistólica no tornozelo e a maior no braço."
    }
}

// Tabela Auxiliar de Naviculômetro (Tamanho -> Ranges)
export const NAVICULAR_SHOE_TABLE: Record<number, { baixo: number; alto: number }> = {
    25: { baixo: 9, alto: 15 }, 26: { baixo: 10, alto: 16 }, 27: { baixo: 10, alto: 17 },
    28: { baixo: 10, alto: 17 }, 29: { baixo: 11, alto: 18 }, 30: { baixo: 11, alto: 18 },
    31: { baixo: 11, alto: 19 }, 32: { baixo: 11, alto: 19 }, 33: { baixo: 12, alto: 20 },
    34: { baixo: 12, alto: 20 }, 35: { baixo: 12, alto: 20 }, 36: { baixo: 13, alto: 21 },
    37: { baixo: 13, alto: 20 }, 38: { baixo: 13, alto: 21 }, 39: { baixo: 13, alto: 21 },
    40: { baixo: 14, alto: 22 }, 41: { baixo: 14, alto: 22 }, 42: { baixo: 14, alto: 22 },
    43: { baixo: 14, alto: 23 }, 44: { baixo: 15, alto: 23 }, 45: { baixo: 15, alto: 24 },
    46: { baixo: 15, alto: 24 }, 47: { baixo: 16, alto: 25 }, 48: { baixo: 16, alto: 25 },
    49: { baixo: 16, alto: 26 }, 50: { baixo: 17, alto: 26 },
};

// Função auxiliar para verificar status rapidamente baseado em ranges simples ou IDs categóricos
export function checkStatus(test: keyof typeof CLINICAL_REFS, value: any) {
    const ref = CLINICAL_REFS[test] as any;
    if (!ref || !ref.ranges) return null;

    // Se o valor for string, buscamos por ID categórico (ex: Silfverskiold)
    if (typeof value === 'string' && isNaN(Number(value)) && value !== "") {
        return ref.ranges.find((r: any) => r.id === value);
    }

    const v = Number(value);
    if (isNaN(v)) return null;

    return ref.ranges.find((r: any) => {
        // Se min/max não definido, assume infinito
        const min = r.min ?? -Infinity;
        const max = r.max ?? Infinity;
        return v >= min && v <= max;
    });
}

// Função específica para Naviculômetro (Depende do Calçado)
export function checkNavicularStatus(navHeight: number, shoeSize: number) {
    if (!navHeight || !shoeSize || !NAVICULAR_SHOE_TABLE[shoeSize]) return null;

    const ref = NAVICULAR_SHOE_TABLE[shoeSize];
    if (navHeight <= ref.baixo) return { label: "Baixo (Plano)", color: "bg-red-100 text-red-700 border-red-200" };
    if (navHeight >= ref.alto) return { label: "Alto (Cavo)", color: "bg-orange-100 text-orange-700 border-orange-200" };
    return { label: "Médio (Normal)", color: "bg-green-100 text-green-700 border-green-200" };
}

// Função específica para ITB
export function checkITBStatus(value: number) {
    if (value === null || isNaN(value)) return null;
    return checkStatus('itb' as any, value);
}

// --- FÓRMULA DO ÍNDICE MINIMALISTA (The Running Clinic) ---
export const calculateMinimalistIndex = (vals: { weight: any, drop: any, stack: any, flex_long: any, flex_tors: any, stability: any }) => {
    let score = 0;
    const w = Number(vals?.weight);
    const d = Number(vals?.drop);
    const s = Number(vals?.stack);
    const fl = Number(vals?.flex_long) || 0;
    const ft = Number(vals?.flex_tors) || 0;
    const stab = Number(vals?.stability);

    const hasWeight = vals?.weight !== undefined && vals?.weight !== "";
    const hasDrop = vals?.drop !== undefined && vals?.drop !== "";
    const hasStack = vals?.stack !== undefined && vals?.stack !== "";
    const hasStab = vals?.stability !== undefined && vals?.stability !== "";

    // Retorna 0 se os três inputs principais estiverem completamente vazios
    if (!hasWeight && !hasDrop && !hasStack) return 0;

    // 1. Peso (Máx 5 pts)
    if (hasWeight && !isNaN(w)) {
        if (w < 170) score += 5;
        else if (w < 250) score += 3;
        else score += 1;
    }

    // 2. Drop (Máx 5 pts)
    if (hasDrop && !isNaN(d)) {
        if (d === 0) score += 5;
        else if (d <= 4) score += 4;
        else if (d <= 8) score += 2;
        else score += 0;
    }

    // 3. Stack Height (Máx 5 pts)
    if (hasStack && !isNaN(s)) {
        if (s < 15) score += 5;
        else if (s < 25) score += 3;
        else score += 1;
    }

    // 4. Flexibilidade (Máx 10 pts somados)
    score += fl * 2;
    score += ft * 2;

    // 5. Estabilidade (Máx 5 pts) - Quanto MENOS estabilidade, MAIS minimalista
    const stabVal = hasStab && !isNaN(stab) ? stab : 0;
    score += (5 - stabVal);

    // Cálculo Final: (Score / 30) * 100
    return Math.min(100, Math.round((score / 30) * 100));
};

// --- FÓRMULA DE FLEXIBILIDADE (0-100%) ---
export const calculateFlexibilityScore = (tests: any) => {
    let totalScore = 0;
    let count = 0;

    const addScore = (score: number) => {
        totalScore += score;
        count++;
    };

    // Helper para extrair valor numérico seguro
    const getVal = (v: any) => {
        if (v === "" || v === undefined || v === null) return null;
        const n = Number(v);
        return isNaN(n) ? null : n;
    };

    // 1. SLR (Isquiosurais) - Alvo: 132º
    // Se >= 132, 100%. Se < 132, proporcional.
    const slrL = getVal(tests?.slr?.left);
    const slrR = getVal(tests?.slr?.right);
    [slrL, slrR].forEach(v => {
        if (v !== null) addScore(v >= 132 ? 100 : (v / 132) * 100);
    });

    // 2. Thomas Test (Psoas) - Alvo: <= 0º
    // Se <= 0, 100%. Se > 0 (encurtado), penaliza. Ex: 10º encurtamento = 0 pts. (10 pts por grau)
    const thomasL = getVal(tests?.thomas?.left);
    const thomasR = getVal(tests?.thomas?.right);
    [thomasL, thomasR].forEach(v => {
        if (v !== null) addScore(v <= 0 ? 100 : Math.max(0, 100 - (v * 10)));
    });

    // 3. Lunge Test (Dorsiflexão) - Alvo: 45º
    const lungeL = getVal(tests?.lunge?.left);
    const lungeR = getVal(tests?.lunge?.right);
    [lungeL, lungeR].forEach(v => {
        if (v !== null) addScore(v >= 45 ? 100 : (v / 45) * 100);
    });

    // 4. Jack Test (Molinete) - Alvo: >= 1 (Mecanismo Eficiente)
    // -2 (Rigidez), -1 (Difícil), 0 (Neutro), 1 (Bom), 2 (Excelente)
    const jackL = getVal(tests?.jack?.left);
    const jackR = getVal(tests?.jack?.right);
    [jackL, jackR].forEach(v => {
        if (v !== null) {
            // Mapping: >= 1 -> 100, 0 -> 70, < 0 -> 30
            if (v >= 1) addScore(100);
            else if (v === 0) addScore(70);
            else addScore(30);
        }
    });

    // 5. Hip Rotation (Rigidez) - Alvo: 40º
    // Nota: Está dentro de tests.ventral.rotation
    const hipL = getVal(tests?.ventral?.rotation?.left);
    const hipR = getVal(tests?.ventral?.rotation?.right);
    [hipL, hipR].forEach(v => {
        if (v !== null) addScore(v >= 40 ? 100 : (v / 40) * 100);
    });

    return count > 0 ? Math.round(totalScore / count) : 0;
};

// --- CÁLCULO GERAL DO RADAR (0-100 EM TODOS OS EIXOS) ---
export const calculateRadarData = (formValues: any) => {

    // Helper: Extrair número seguro
    const getVal = (v: any) => {
        if (v === "" || v === undefined || v === null) return null;
        const n = Number(v);
        return isNaN(n) ? null : n;
    };

    // 1. DOR (EVA) - Inverso: 0 (Sem dor) = 100pts, 10 (Dor max) = 0pts
    // Se o array estiver vazio ou indefinido, usamos null
    const evaRaw = formValues?.hma?.eva?.[0]; // Slider as array
    // Se EVA não foi mexido, geralmente é [0]. Mas se não existe HMA?
    // Vamos assumir que se hma.eva existe, usamos.
    const eva = getVal(evaRaw);
    const scorePain = eva !== null ? Math.max(0, 100 - (eva * 10)) : null;

    // 2. FUNÇÃO (EFEP) - Escala 0-10 (média) -> 0-100
    // Baseado no Card: Se vazio -> 0.
    const efepItems = formValues?.efep || [];
    let scoreFunction = 0; // Default 0 para aparecer no gráfico mesmo se vazio (como no card)
    if (efepItems.length > 0) {
        let total = 0, count = 0;
        efepItems.forEach((i: any) => {
            const v = getVal(i.score);
            if (v !== null) { total += v; count++; }
        });
        if (count > 0) scoreFunction = (total / count) * 10;
    }

    // 3. FORÇA (Glúteo Médio + Máximo) - Input 0-10 -> 0-100
    const gMedL = getVal(formValues?.tests?.glute_strength?.med_left);
    const gMedR = getVal(formValues?.tests?.glute_strength?.med_right);
    const gMaxL = getVal(formValues?.tests?.glute_strength?.max_left);
    const gMaxR = getVal(formValues?.tests?.glute_strength?.max_right);

    const strengthVals = [gMedL, gMedR, gMaxL, gMaxR].filter(v => v !== null);
    const scoreStrength = strengthVals.length > 0
        ? (strengthVals.reduce((a, b) => a + (b as number), 0) / strengthVals.length) * 10
        : null;

    // 4. FLEXIBILIDADE
    const flexScoreRaw = formValues?.tests ? calculateFlexibilityScore(formValues.tests) : 0;
    const scoreFlex = flexScoreRaw;

    // 5. ESTABILIDADE (Y-Balance)
    let scoreStability = null;
    const yb = formValues?.tests?.ybalance;
    if (yb) {
        const hasY = getVal(yb.Anterior?.left?.t1) !== null || getVal(yb.Anterior?.right?.t1) !== null;
        if (hasY) scoreStability = 70;
    }

    // 6. POSTURA (FPI-6)
    const fpiLVal = formValues?.postural?.fpi_left;
    const fpiRVal = formValues?.postural?.fpi_right;

    const sumFpi = (obj: any) => obj ? Object.values(obj).reduce((a: number, b) => a + (Number(b) || 0), 0) : null;

    const fpiL = (fpiLVal && Object.keys(fpiLVal).length > 0) ? sumFpi(fpiLVal) : null;
    const fpiR = (fpiRVal && Object.keys(fpiRVal).length > 0) ? sumFpi(fpiRVal) : null;

    const calcFpiScore = (val: number | null) => {
        if (val === null) return null;
        if (val >= -5 && val <= 5) return 100;
        const dist = Math.abs(val) - 5;
        return Math.max(0, 100 - (dist * 14.3));
    };

    const fpiScoreL = calcFpiScore(fpiL);
    const fpiScoreR = calcFpiScore(fpiR);
    let scorePosture = null;
    if (fpiScoreL !== null && fpiScoreR !== null) scorePosture = (fpiScoreL + fpiScoreR) / 2;
    else if (fpiScoreL !== null) scorePosture = fpiScoreL;
    else if (fpiScoreR !== null) scorePosture = fpiScoreR;

    // 7. CARGA (Load)
    const sports = formValues?.sports || [];
    let scoreLoad = null;
    if (sports.length > 0) {
        const totalMin = sports.reduce((acc: number, curr: any) => acc + ((Number(curr.freq) || 0) * (Number(curr.duration) || 0)), 0);
        scoreLoad = Math.min(100, (totalMin / 300) * 100);
    }


    // 8. SIMETRIA (Symmetry) - Comparação L/R (Todos numéricos)

    // 8. SIMETRIA (Symmetry) - Comparação L/R (Todos numéricos)
    let symCount = 0;
    let symTotal = 0;

    const checkSym = (l: any, r: any) => {
        const vl = getVal(l);
        const vr = getVal(r);
        if (vl !== null && vr !== null) {
            symTotal++;
            // Se ambos forem 0, é simétrico
            if (vl === 0 && vr === 0) {
                symCount++;
                return;
            }
            // Diferença percentual baseada no maior valor
            const max = Math.max(Math.abs(vl), Math.abs(vr));
            const diff = Math.abs(vl - vr);
            const pctDiff = diff / max; // 0.10 = 10%

            // Aceitamos 10% de tolerância
            if (pctDiff <= 0.10) {
                symCount++;
            }
        }
    };

    const t = formValues?.tests;
    const p = formValues?.postural;

    // --- LISTA DE PARES PARA SIMETRIA ---
    checkSym(p?.navicular?.left, p?.navicular?.right); // Navicular
    checkSym(t?.lunge?.left, t?.lunge?.right); // Lunge
    checkSym(t?.ybalance?.legLength?.left, t?.ybalance?.legLength?.right); // Leg Length
    checkSym(t?.jack?.left, t?.jack?.right); // Jack
    checkSym(t?.thomas?.left, t?.thomas?.right); // Thomas
    checkSym(t?.slr?.left, t?.slr?.right); // SLR
    checkSym(t?.ventral?.rotation?.left, t?.ventral?.rotation?.right); // Hip Rotation
    checkSym(t?.ventral?.craig?.left, t?.ventral?.craig?.right); // Craig
    checkSym(t?.glute_strength?.med_left, t?.glute_strength?.med_right); // Glute Med
    checkSym(t?.glute_strength?.max_left, t?.glute_strength?.max_right); // Glute Max
    checkSym(t?.single_squat?.score_left, t?.single_squat?.score_right); // Squat

    // DFI (0, 1, 2)
    if (t?.dfi) {
        checkSym(t.dfi[0]?.left, t.dfi[0]?.right);
        checkSym(t.dfi[1]?.left, t.dfi[1]?.right);
        checkSym(t.dfi[2]?.left, t.dfi[2]?.right);
    }

    // Y-Balance Anterior (Média)
    if (t?.ybalance?.Anterior) {
        const getMean = (side: any) => {
            const t1 = getVal(side?.t1);
            const t2 = getVal(side?.t2);
            const t3 = getVal(side?.t3);
            const vs = [t1, t2, t3].filter(x => x !== null);
            return vs.length > 0 ? vs.reduce((a: number, b: number) => a + b, 0) / vs.length : null;
        };
        checkSym(getMean(t.ybalance.Anterior.left), getMean(t.ybalance.Anterior.right));
    }

    // Score Simetria (0-100)
    const scoreSymmetry = symTotal > 0 ? Math.round((symCount / symTotal) * 100) : null;

    return [
        { subject: 'Dor', A: scorePain, fullMark: 100 },
        { subject: 'Função', A: scoreFunction, fullMark: 100 },
        { subject: 'Força', A: scoreStrength, fullMark: 100 },
        { subject: 'Flexibilidade', A: scoreFlex, fullMark: 100 },
        { subject: 'Estab.', A: scoreStability, fullMark: 100 },
        { subject: 'Postura', A: scorePosture, fullMark: 100 },
        { subject: 'Carga', A: scoreLoad, fullMark: 100 },
        { subject: 'Simetria', A: scoreSymmetry, fullMark: 100 },
    ].filter(item => item.A !== null); // Remove apenas os verdadeiramente nulos
};
