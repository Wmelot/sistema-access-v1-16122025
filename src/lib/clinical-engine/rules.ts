import { ClinicalPhase, ClinicalState, Dosimetry, ProgressionResult, TissueType } from "./types";

export const PHASE_VARS: Record<ClinicalPhase, { name: string; focus: string; criteria: string }> = {
    1: { name: "Proteção e Ativação", focus: "Analgesia e Input Neural", criteria: "Dor < 3/10 e ADM > 75%" },
    2: { name: "Resistência e Controle", focus: "Capacidade Tecidual Local", criteria: "RPE < 4 e Sem Fadiga Precoce" },
    3: { name: "Força e Hipertrofia", focus: "Remodelamento Mecânico", criteria: "Simetria Força > 85%" },
    4: { name: "Potência e Retorno", focus: "Performance e Pliometria", criteria: "Hop Test > 90%" }
};

export const DOSIMETRY_DEFAULTS: Record<ClinicalPhase, Dosimetry> = {
    1: { sets: "2-3", reps: "15-20 (ou isometria 45s)", rest: "< 1 min", focus: "Resistência Local / Ativação" },
    2: { sets: "2-3", reps: "12-15", rest: "< 1 min", focus: "Resistência / Controle" },
    3: { sets: "3-4", reps: "8-12 (Hip) ou 4-6 (Força)", rest: "2-3 min", focus: "Força / Hipertrofia" },
    4: { sets: "3-5", reps: "3-6 (Explosivo)", rest: "3-5 min", focus: "Potência / Velocidade" }
};

export const TISSUE_RULES: Record<TissueType, string> = {
    'tendon': "Priorizar Heavy Slow Resistance (HSR) e Isometria. EVITAR alongamento compressivo na fase aguda.",
    'muscle': "Protocolo PEACE & LOVE. Ênfase em excêntricos nas fases 2/3.",
    'joint_ligament': "Proteção de ADM e priorizar Cadeia Cinética Fechada (CCF) antes de Aberta (CCA)."
};

// Deterministic Logic Helper (Can be used by UI or passed to AI)
export function evaluateCriteria(state: ClinicalState): 'maintain' | 'advance' | 'regress' {
    const { currentPhase, painLevel, rpe, romSymmetry, strengthSymmetry } = state;

    // Safety Regression
    if (painLevel > 5) return 'regress';

    // Progression Logic
    if (currentPhase === 1) {
        if (painLevel < 3 && (romSymmetry || 0) > 75) return 'advance';
    }
    if (currentPhase === 2) {
        if (rpe < 4 && painLevel <= 2) return 'advance';
    }
    if (currentPhase === 3) {
        if ((strengthSymmetry || 0) > 85) return 'advance';
    }

    // Default
    return 'maintain';
}
