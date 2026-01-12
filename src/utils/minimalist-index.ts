export interface ShoeData {
    specs?: {
        weight?: number;
        drop?: number;
        stack?: number;
    };
    minScoreData?: {
        flexLong?: number; // 0-5 scale
        flexTor?: number; // 0-5 scale
        stability?: number; // 0-5 count
    };
}

export function calculateMinimalistScore(shoe: ShoeData | undefined): number {
    if (!shoe || !shoe.specs || !shoe.minScoreData) return 0;

    let totalScore = 0;

    // 1. Weight (Max 5)
    // < 125g: 5, 125-174: 4, 175-224: 3, 225-274: 2, 275-324: 1, >= 325: 0
    const w = shoe.specs.weight || 0;
    if (w < 125) totalScore += 5;
    else if (w < 175) totalScore += 4;
    else if (w < 225) totalScore += 3;
    else if (w < 275) totalScore += 2;
    else if (w < 325) totalScore += 1;
    else totalScore += 0;

    // 2. Stack Height (Max 5)
    // < 8mm: 5, 8-13: 4, 14-19: 3, 20-25: 2, 26-31: 1, >= 32: 0
    const s = shoe.specs.stack || 0;
    if (s < 8) totalScore += 5;
    else if (s < 14) totalScore += 4;
    else if (s < 20) totalScore += 3;
    else if (s < 26) totalScore += 2;
    else if (s < 32) totalScore += 1;
    else totalScore += 0;

    // 3. Drop (Max 5)
    // < 1mm: 5, 1-3: 4, 4-6: 3, 7-9: 2, 10-12: 1, >= 13: 0
    const d = shoe.specs.drop || 0;
    if (d < 1) totalScore += 5;
    else if (d < 4) totalScore += 4;
    else if (d < 7) totalScore += 3;
    else if (d < 10) totalScore += 2;
    else if (d < 13) totalScore += 1;
    else totalScore += 0;

    // 4. Technologies (Max 5)
    // 0 tech = 5 pts, 1 = 4, ..., 5+ = 0
    // Provided input 'stability' is 0-5 COUNT of technologies?
    // User Prompt: "O usuário seleciona a QUANTIDADE de tecnologias... 0 tecnologias presentes = 5 pts (Minimalista puro)"
    // So if shoe.minScoreData.stability represents COUNT, then:
    // Score = 5 - count (clamped at 0)
    const techCount = shoe.minScoreData.stability || 0;
    const techScore = Math.max(0, 5 - techCount);
    totalScore += techScore;


    // 5. Flexibility (Max 5)
    // Longitudinal: 0-2.5 (step 0.5)
    // Torsional: 0-2.5 (step 0.5)
    // The component `ShoeAnalysisStep` has buttons 0, 1, 2, 3, 4, 5. 
    // And displays "val * 0.5".
    // So the stored value in `minScoreData.flexLong` is likely 0-5 (integer index).
    // We need to convert it to points.
    // Prompt says: "Longitudinal: 0 a 2.5 pts (passo de 0.5)".
    // If input is 0 -> 0 pts. If input is 5 -> 2.5 pts. 
    // Wait, usually HIGH flexibility = HIGHER score for minimalism.
    // In `ShoeAnalysisStep`:
    // button 5 -> displays 2.5. 
    // button 0 -> displays 0.
    // Usually, 5/5 flexibility is minimal. 0/5 is rigid (maximal).
    // So input 5 (display 2.5) -> meant to be 2.5 points? 
    // Let's assume input value maps directly to points if we multiply by 0.5.
    // input 0 -> 0 pts
    // input 5 -> 2.5 pts
    const flexLongPoints = (shoe.minScoreData.flexLong || 0) * 0.5;
    const flexTorPoints = (shoe.minScoreData.flexTor || 0) * 0.5;

    totalScore += (flexLongPoints + flexTorPoints);

    // Final Calc
    // Max Possible = 25
    // % = (Total / 25) * 100
    const percent = Math.round((totalScore / 25) * 100);

    return percent;
}
