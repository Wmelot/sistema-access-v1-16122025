import { describe, it, expect } from 'vitest';

// Simulação da lógica do frontend para teste
function calculateMinimalistIndex(scores: { peso: number, drop: number, flexL: number, flexT: number, estab: number }) {
    const total = scores.peso + scores.drop + scores.flexL + scores.flexT + scores.estab;
    return total * 4;
}

describe('Palmilha Logic Tests', () => {
    it('should calculate minimalist index correctly for max score', () => {
        const scores = { peso: 5, drop: 5, flexL: 5, flexT: 5, estab: 5 };
        const result = calculateMinimalistIndex(scores);
        expect(result).toBe(100);
    });

    it('should calculate minimalist index correctly for zero score', () => {
        const scores = { peso: 0, drop: 0, flexL: 0, flexT: 0, estab: 0 };
        const result = calculateMinimalistIndex(scores);
        expect(result).toBe(0);
    });

    it('should calculate minimalist index correctly for mixed scores', () => {
        const scores = { peso: 3, drop: 2, flexL: 4, flexT: 1, estab: 5 };
        // Sum = 15. Result should be 15 * 4 = 60
        const result = calculateMinimalistIndex(scores);
        expect(result).toBe(60);
    });
});
