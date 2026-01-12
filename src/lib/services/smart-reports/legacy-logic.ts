
// Legacy Logic ported from biomechanics-calculations.ts
// Preserving exact business rules as requested.

export const calculateSmartRecommendation = (patientProfile: any, painPoints: any) => {
    const { goals, experience, injuryStatus } = patientProfile || {};
    let suggestion = { indexRange: [0, 100], traits: [] as string[], description: "Análise geral baseada no perfil." };

    // Safety check for painPoints
    const pp = painPoints || {};
    const hasProximalPain = pp.knee?.left || pp.knee?.right || pp.hip?.left || pp.hip?.right;
    const hasDistalPain = pp.achilles?.left || pp.achilles?.right || pp.calcaneus?.left || pp.calcaneus?.right || pp.arch?.left || pp.arch?.right || pp.metatarsal1?.left || pp.metatarsal1?.right || pp.metatarsal5?.left || pp.metatarsal5?.right;

    if (injuryStatus === 'acute') {
        if (hasDistalPain) {
            suggestion.indexRange = [0, 50];
            suggestion.traits.push('Drop Alto (>8mm)', 'Amortecimento Generoso', 'Solado Rígido');
            suggestion.description = "Fase Aguda Distal (Pé/Tendão): Priorizar proteção e descarga mecânica. Calçado maximalista ou tradicional ajuda a reduzir carga no tendão de Aquiles e fáscia.";
        } else if (hasProximalPain) {
            suggestion.indexRange = [60, 100];
            suggestion.traits.push('Drop Baixo (<6mm)', 'Baixo Amortecimento');
            suggestion.description = "Fase Aguda Proximal (Joelho/Quadril): Priorizar redução de impacto transiente. Calçado minimalista estimula cadência mais alta e menor impacto nas articulações.";
        } else {
            suggestion.description = "Lesão Aguda: Manter calçado confortável atual ou aumentar proteção temporariamente.";
        }
    } else if (injuryStatus === 'persistent') {
        if (hasProximalPain) {
            suggestion.indexRange = [80, 100];
            suggestion.traits.push('Minimalismo Alto', 'Zero Drop', 'Leveza');
            suggestion.description = "Lesão Persistente Proximal: Evidência forte para aumentar o Índice Minimalista (>80%) para reduzir carga articular no joelho e quadril.";
        } else if (hasDistalPain) {
            suggestion.indexRange = [0, 40];
            suggestion.traits.push('Estruturado', 'Drop > 10mm');
            suggestion.description = "Lesão Persistente Distal: Reduzir carga tecidual local. Manter em calçados com maior suporte e drop elevado.";
        }
    } else {
        if (experience === 'beginner') {
            suggestion.indexRange = [60, 90];
            suggestion.traits.push('Leve', 'Flexível');
            suggestion.description = "Iniciante: Evite calçados muito pesados ou muito rígidos. Um índice moderado a alto (>60%) favorece o fortalecimento natural e boa técnica.";
        } else if (experience === 'competitive' || goals?.includes('Performance')) {
            suggestion.indexRange = [80, 100];
            suggestion.traits.push('Performance', 'Baixo Peso', 'Responsivo');
            suggestion.description = "Performance: Calçados com alto índice minimalista ou super-shoes (placa) dependendo da prova. Foco em economia de corrida.";
        } else {
            suggestion.description = "Sem Lesões: Manter hábitos atuais ('Não se mexe em time que está ganhando'). Se desejar transição, faça de forma gradual.";
        }
    }
    return suggestion;
};

// Helper for Radar
const getFpiClass = (scores: number[]) => {
    if (!scores) return { label: 'N/A', score: 0 };
    const sum = scores.reduce((a, b) => a + b, 0);
    if (sum > 6) return { label: 'Pronado (Plano)', color: 'text-orange-600', score: sum };
    if (sum < -6) return { label: 'Supinado (Cavo)', color: 'text-blue-600', score: sum };
    return { label: 'Neutro', color: 'text-green-600', score: sum };
};

export const calculateRadarData = (data: any) => {
    // Safety checks
    const safeData = data || {};
    const fpiRight = getFpiClass(safeData.fpi?.right || []);
    const fpiLeft = getFpiClass(safeData.fpi?.left || []);

    const mapRange = (val: number, min: number, max: number) => Math.min(100, Math.max(0, ((val - min) / (max - min)) * 100));

    // 1. Pain (Relief score: 10 -> 0%, 0 -> 100%)
    const scorePain = 100 - ((safeData.eva || 0) * 10);

    // 2. Function (EFEP)
    const efepItems = safeData.efep?.items || [];
    const efepSum = efepItems.reduce((acc: number, item: any) => acc + (+item.score || 0), 0);
    const scoreFunc = efepItems.length > 0 ? (efepSum / efepItems.length) * 10 : 0;

    // 3. Stability (SLS)
    const slsLeft = ((safeData.singleLegSquat?.pelvicDrop?.left || 0) + (safeData.singleLegSquat?.dynamicValgus?.left || 0)) / 2;
    const slsRight = ((safeData.singleLegSquat?.pelvicDrop?.right || 0) + (safeData.singleLegSquat?.dynamicValgus?.right || 0)) / 2;
    const scoreStab = mapRange((slsLeft + slsRight) / 2, -5, 5); // Assuming -5 to 5 range for deviation? Or is it 0 good, 5 bad? 
    // Wait, original logic was: scoreStab = mapRange((slsLeft + slsRight) / 2, -5, 5)
    // If Valgus is bad (high number), score should be low. 
    // The legacy mapRange maps [min, max] to [0, 100].
    // If I pass 5 (bad), output is 100? No, usually Stability 100 is good.
    // Let's blindly trust the legacy code for now, but note:
    // Original: mapRange((slsLeft + slsRight) / 2, -5, 5)
    // If inputs are 0 (perfect), mapRange(0, -5, 5) -> ((0 - (-5)) / 10) * 100 = 50% ?? 
    // This seems odd for a "Stability" score where 0 deviation is ideal. 
    // Checking legacy again: 
    // const mapRange = (val, min, max) => ...
    // If val=0, range -5..5 => 50%.
    // Maybe SLS uses negative numbers? 
    // Regardless, I am copying logic strictly.

    // 4. Strength
    const strAvg = ((safeData.strength?.gluteMedRight || 5) + (safeData.strength?.gluteMedLeft || 5) + (safeData.strength?.gluteMaxRight || 5) + (safeData.strength?.gluteMaxLeft || 5)) / 4;
    const scoreStr = strAvg * 10; // 0-10 -> 0-100%

    // 5. Posture (FPI)
    // Deviation from neutral lowers score.
    const scorePosture = Math.max(0, 100 - (((Math.abs(fpiRight.score) + Math.abs(fpiLeft.score)) / 2) * 8));

    // 6. Symmetry (LSI)
    const calculateSymmetry = () => {
        let totalLsi = 0; let count = 0;
        const addLsi = (v1: number, v2: number) => {
            const min = Math.min(Math.abs(v1 || 0), Math.abs(v2 || 0));
            const max = Math.max(Math.abs(v1 || 0), Math.abs(v2 || 0));
            // Avoid division by zero
            if (max === 0 && min === 0) { totalLsi += 100; count++; return; }
            totalLsi += max === 0 ? 0 : (min / max) * 100; count++;
        };

        // Safe access to nested
        if (safeData.anthropometry) {
            addLsi(safeData.anthropometry.legLengthLeft, safeData.anthropometry.legLengthRight);
            addLsi(safeData.anthropometry.navicularLeft, safeData.anthropometry.navicularRight);
        }
        if (safeData.strength) {
            addLsi(safeData.strength.gluteMedLeft, safeData.strength.gluteMedRight);
        }
        if (safeData.flexibility) {
            addLsi(safeData.flexibility.lungeLeft, safeData.flexibility.lungeRight);
        }
        return count === 0 ? 100 : (totalLsi / count);
    };
    const scoreSym = calculateSymmetry();

    // 7. Flexibility
    // Placeholder fixed value 50 in original code? 
    // Original: 
    // const flexItems = [ { score: 50, weight: 1 } ]
    // const totalFlex = 50
    // Wait, lines 91-98 in original calculateRadarData actually implement logic.
    // "calcFlexItem" ...
    // I should copy THAT part, not the placeholder I might have glanced over elsewhere.

    const calcFlexItem = (valLeft: any, valRight: any, min: number, max: number, weight: number, invert = false) => {
        if (valLeft === undefined || valRight === undefined) return null;
        let score = (((valLeft + valRight) / 2 - min) / (max - min)) * 100;
        score = Math.min(100, Math.max(0, score));
        if (invert) score = 100 - score;
        return { score, weight };
    };

    const flexItems = [
        safeData.flexibility ? calcFlexItem(safeData.flexibility.mobilityRaysLeft, safeData.flexibility.mobilityRaysRight, -5, 5, 1) : null,
        safeData.flexibility ? calcFlexItem(safeData.flexibility.thomasLeft, safeData.flexibility.thomasRight, 0, 10, 1, true) : null,
        safeData.flexibility ? calcFlexItem(safeData.flexibility.hamstringLeft, safeData.flexibility.hamstringRight, 90, 132, 1) : null,
        safeData.flexibility ? calcFlexItem(safeData.flexibility.jackLeft, safeData.flexibility.jackRight, -5, 5, 1) : null,
        safeData.flexibility ? calcFlexItem(safeData.flexibility.lungeLeft, safeData.flexibility.lungeRight, 20, 45, 2) : null,
        safeData.rotation ? calcFlexItem(safeData.rotation.left, safeData.rotation.right, 20, 40, 2) : null
    ].filter(Boolean) as { score: number, weight: number }[];

    const totalFlex = flexItems.length > 0 ? flexItems.reduce((acc, item) => acc + (item.score * item.weight), 0) / flexItems.reduce((acc, item) => acc + item.weight, 0) : 50; // Fallback to 50 if no data

    return [
        { subject: 'Dor (Alívio)', A: Math.round(scorePain), fullMark: 100 },
        { subject: 'Função', A: Math.round(scoreFunc), fullMark: 100 },
        { subject: 'Estabilidade', A: Math.round(scoreStab), fullMark: 100 },
        { subject: 'Força', A: Math.round(scoreStr), fullMark: 100 },
        { subject: 'Postura', A: Math.round(scorePosture), fullMark: 100 },
        { subject: 'Simetria', A: Math.round(scoreSym), fullMark: 100 },
        { subject: 'Flexibilidade', A: Math.round(totalFlex), fullMark: 100 },
    ];
};
