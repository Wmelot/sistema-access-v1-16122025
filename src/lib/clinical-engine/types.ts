export type ClinicalPhase = 1 | 2 | 3 | 4;

export type TissueType = 'tendon' | 'muscle' | 'joint_ligament';

export interface ClinicalState {
    currentPhase: ClinicalPhase;
    painLevel: number; // 0-10
    rpe: number; // 0-10
    romSymmetry?: number; // percentage 0-100
    strengthSymmetry?: number; // percentage 0-100
    functionalTestSymmetry?: number; // percentage 0-100
    tissueType: TissueType;
}

export interface Dosimetry {
    sets: string;
    reps: string;
    rest: string;
    focus: string;
}

export interface ProgressionResult {
    action: 'maintain' | 'regress' | 'advance';
    nextPhase: ClinicalPhase;
    suggestedDosimetry: Dosimetry;
    exerciseFocus: string; // e.g., "Isometrics", "Plyometrics"
    reasoning: string;
}
