export interface ShoeModel {
    id: string;
    brand: string;
    model: string;
    type: 'minimalist' | 'transitional' | 'maximalist' | 'stability';
    weight: number; // grams
    drop: number; // mm
    stackHeight: number; // mm
    flexibility: 'high' | 'medium' | 'low';
    stabilityControl: boolean; // has rigid counters/shanks
    minimalismIndex: number; // 0-100% (Calculated or pre-defined)
    imageUrl?: string;
}

export const SHOE_DATABASE: ShoeModel[] = [
    // Minimalistas (High Score ~80-100%)
    {
        id: 'vibram-kso',
        brand: 'Vibram',
        model: 'FiveFingers KSO',
        type: 'minimalist',
        weight: 120,
        drop: 0,
        stackHeight: 5,
        flexibility: 'high',
        stabilityControl: false,
        minimalismIndex: 95
    },
    {
        id: 'merrell-vapor',
        brand: 'Merrell',
        model: 'Vapor Glove 6',
        type: 'minimalist',
        weight: 150,
        drop: 0,
        stackHeight: 6,
        flexibility: 'high',
        stabilityControl: false,
        minimalismIndex: 90
    },
    {
        id: 'vivo-primus',
        brand: 'Vivobarefoot',
        model: 'Primus Lite III',
        type: 'minimalist',
        weight: 180,
        drop: 0,
        stackHeight: 4,
        flexibility: 'high',
        stabilityControl: false,
        minimalismIndex: 92
    },

    // Transição / Natural (Medium Score ~50-80%)
    {
        id: 'altra-escalante',
        brand: 'Altra',
        model: 'Escalante 3',
        type: 'transitional',
        weight: 260,
        drop: 0,
        stackHeight: 24,
        flexibility: 'medium',
        stabilityControl: false,
        minimalismIndex: 70
    },
    {
        id: 'kinvara-14',
        brand: 'Saucony',
        model: 'Kinvara 14',
        type: 'transitional',
        weight: 200,
        drop: 4,
        stackHeight: 31,
        flexibility: 'medium',
        stabilityControl: false,
        minimalismIndex: 60
    },
    {
        id: 'nike-free',
        brand: 'Nike',
        model: 'Free Run 5.0',
        type: 'transitional',
        weight: 190,
        drop: 6,
        stackHeight: 20,
        flexibility: 'high',
        stabilityControl: false,
        minimalismIndex: 65
    },

    // Maximalistas / Amortecimento (Low Score ~20-50%)
    {
        id: 'hoka-bondi',
        brand: 'Hoka One One',
        model: 'Bondi 8',
        type: 'maximalist',
        weight: 300,
        drop: 4,
        stackHeight: 33,
        flexibility: 'low',
        stabilityControl: true, // Wide base provides stability
        minimalismIndex: 30
    },
    {
        id: 'asics-nimbus',
        brand: 'Asics',
        model: 'Gel Nimbus 25',
        type: 'maximalist',
        weight: 290,
        drop: 8,
        stackHeight: 41,
        flexibility: 'low',
        stabilityControl: true,
        minimalismIndex: 25
    },

    // Controle / Estabilidade (Very Low Score ~0-30%)
    {
        id: 'asics-kayano',
        brand: 'Asics',
        model: 'Gel Kayano 30',
        type: 'stability',
        weight: 305,
        drop: 10,
        stackHeight: 40,
        flexibility: 'low',
        stabilityControl: true,
        minimalismIndex: 20
    },
    {
        id: 'brooks-adrenalina',
        brand: 'Brooks',
        model: 'Adrenaline GTS 23',
        type: 'stability',
        weight: 285,
        drop: 12,
        stackHeight: 24,
        flexibility: 'low',
        stabilityControl: true,
        minimalismIndex: 15
    }
];

export function getRecommendedShoes(userProfile: {
    footType: 'flat' | 'neutral' | 'cavus';
    weight: number;
    experienceLevel: 'beginner' | 'intermediate' | 'advanced';
    currentMinimalismIndex: number;
}): ShoeModel[] {
    // Logic for recommendation
    // 1. If Flat foot + Beginner -> Suggest Stability
    // 2. If Neutral + Advanced -> Suggest Minimalist
    // 3. Aim for a graduated transition (don't jump from 0% to 100%)

    let targetType: ShoeModel['type'][] = [];

    // Simple Rule Engine
    if (userProfile.footType === 'flat' && userProfile.experienceLevel === 'beginner') {
        targetType = ['stability', 'maximalist'];
    } else if (userProfile.footType === 'cavus' || (userProfile.footType === 'flat' && userProfile.experienceLevel === 'advanced')) {
        targetType = ['transitional', 'minimalist'];
    } else {
        // Neutral
        if (userProfile.experienceLevel === 'beginner') targetType = ['maximalist', 'transitional'];
        else targetType = ['transitional', 'minimalist'];
    }

    // Filter by target Minimalism Index (Target should be slightly higher than current if functional, or same/lower if pathological)
    // For now, simple type filter
    const matches = SHOE_DATABASE.filter(s => targetType.includes(s.type));

    // Sort logic could go here
    return matches.slice(0, 3);
}
