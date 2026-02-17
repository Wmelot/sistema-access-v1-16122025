
export interface ShoeModel {
    id: string;
    brand: string;
    model: string;
    type: 'minimalist' | 'transitional' | 'maximalist' | 'stability' | 'race' | 'trail' | 'road';
    weight: number; // grams
    drop: number; // mm
    stackHeight: number; // mm
    flexibility: 'high' | 'medium' | 'low'; // Inferred from index if not available
    stabilityControl: boolean; // Inferred
    minimalismIndex: number; // 0-100%
    imageUrl?: string;
}

export const SHOE_DATABASE: ShoeModel[] = [
    // --- 2024/2025 BEST SELLERS & RELEASES ---
    { id: 'adidas-adios-pro-evo-2', brand: 'Adidas', model: 'Adizero Adios Pro Evo 2', type: 'race', weight: 138, drop: 3, stackHeight: 39, flexibility: 'low', stabilityControl: true, minimalismIndex: 30 },
    { id: 'adidas-evo-sl', brand: 'Adidas', model: 'Adizero Evo SL', type: 'road', weight: 223, drop: 6, stackHeight: 38, flexibility: 'medium', stabilityControl: false, minimalismIndex: 50 },
    { id: 'asics-nimbus-27', brand: 'Asics', model: 'GEL-Nimbus 27', type: 'maximalist', weight: 305, drop: 8, stackHeight: 42, flexibility: 'low', stabilityControl: true, minimalismIndex: 20 },
    { id: 'asics-novablast-5', brand: 'Asics', model: 'Novablast 5', type: 'road', weight: 250, drop: 8, stackHeight: 41.5, flexibility: 'medium', stabilityControl: false, minimalismIndex: 35 },
    { id: 'asics-metaspeed-sky-paris', brand: 'Asics', model: 'Metaspeed Sky Paris', type: 'race', weight: 183, drop: 5, stackHeight: 39.5, flexibility: 'low', stabilityControl: true, minimalismIndex: 40 },
    { id: 'hoka-clifton-10', brand: 'Hoka', model: 'Clifton 10', type: 'maximalist', weight: 280, drop: 5, stackHeight: 42, flexibility: 'medium', stabilityControl: false, minimalismIndex: 40 },
    { id: 'hoka-mach-6', brand: 'Hoka', model: 'Mach 6', type: 'road', weight: 232, drop: 5, stackHeight: 37, flexibility: 'medium', stabilityControl: false, minimalismIndex: 55 },
    { id: 'nb-rebel-v4', brand: 'New Balance', model: 'FuelCell Rebel v4', type: 'road', weight: 213, drop: 6, stackHeight: 30, flexibility: 'high', stabilityControl: false, minimalismIndex: 65 },
    { id: 'nike-alphafly-3', brand: 'Nike', model: 'Alphafly 3', type: 'race', weight: 218, drop: 8, stackHeight: 40, flexibility: 'low', stabilityControl: true, minimalismIndex: 30 },
    { id: 'nike-vaporfly-3', brand: 'Nike', model: 'Vaporfly 3', type: 'race', weight: 198, drop: 8, stackHeight: 40, flexibility: 'low', stabilityControl: true, minimalismIndex: 35 },
    { id: 'nike-pegasus-41', brand: 'Nike', model: 'Pegasus 41', type: 'road', weight: 290, drop: 10, stackHeight: 37, flexibility: 'medium', stabilityControl: false, minimalismIndex: 35 },

    // --- ON RUNNING (PREMIUM CLOUD SERIES) ---
    { id: 'on-cloud-5', brand: 'On Running', model: 'Cloud 5', type: 'road', weight: 230, drop: 8, stackHeight: 28, flexibility: 'high', stabilityControl: false, minimalismIndex: 45 },
    { id: 'on-cloudmonster-2', brand: 'On Running', model: 'Cloudmonster 2', type: 'maximalist', weight: 295, drop: 6, stackHeight: 35, flexibility: 'low', stabilityControl: true, minimalismIndex: 30 },
    { id: 'on-cloudsurfer-7', brand: 'On Running', model: 'Cloudsurfer 7', type: 'road', weight: 245, drop: 10, stackHeight: 32, flexibility: 'medium', stabilityControl: false, minimalismIndex: 35 },
    { id: 'on-cloudstratus-3', brand: 'On Running', model: 'Cloudstratus 3', type: 'maximalist', weight: 300, drop: 8, stackHeight: 36, flexibility: 'low', stabilityControl: true, minimalismIndex: 25 },
    { id: 'on-cloudrunner-2', brand: 'On Running', model: 'Cloudrunner 2', type: 'road', weight: 277, drop: 10, stackHeight: 30, flexibility: 'low', stabilityControl: true, minimalismIndex: 30 },

    // --- OLYMPIKUS (NATIONAL BENCHMARKS) ---
    { id: 'olympikus-corre-vento-2', brand: 'Olympikus', model: 'Corre Vento 2', type: 'road', weight: 168, drop: 4, stackHeight: 23, flexibility: 'high', stabilityControl: false, minimalismIndex: 76 },
    { id: 'olympikus-corre-3', brand: 'Olympikus', model: 'Corre 3', type: 'road', weight: 210, drop: 8, stackHeight: 28, flexibility: 'medium', stabilityControl: false, minimalismIndex: 48 },
    { id: 'olympikus-corre-grafeno-2', brand: 'Olympikus', model: 'Corre Grafeno 2', type: 'race', weight: 241, drop: 8, stackHeight: 30, flexibility: 'low', stabilityControl: true, minimalismIndex: 36 },
    { id: 'olympikus-veloz-2', brand: 'Olympikus', model: 'Veloz 2', type: 'road', weight: 230, drop: 8, stackHeight: 25, flexibility: 'medium', stabilityControl: false, minimalismIndex: 44 },
    { id: 'olympikus-corre-max', brand: 'Olympikus', model: 'Corre Max', type: 'maximalist', weight: 270, drop: 8, stackHeight: 35, flexibility: 'low', stabilityControl: true, minimalismIndex: 30 },

    // --- NEW FROM GOOGLE SHEETS / CLINICAL DATA ---
    { id: 'inov8-trailtalon', brand: 'Inov8', model: 'Trailtalon', type: 'trail', weight: 289, drop: 8, stackHeight: 34, flexibility: 'medium', stabilityControl: true, minimalismIndex: 34 },
    { id: 'xero-shoes-hfs-2', brand: 'Xero Shoes', model: 'HFS II', type: 'minimalist', weight: 210, drop: 0, stackHeight: 11, flexibility: 'high', stabilityControl: false, minimalismIndex: 92 },
    { id: 'vivo-primus-lite-3', brand: 'Vivobarefoot', model: 'Primus Lite III', type: 'minimalist', weight: 200, drop: 0, stackHeight: 6, flexibility: 'high', stabilityControl: false, minimalismIndex: 96 },
    { id: 'merrell-vapor-6-boa', brand: 'Merrell', model: 'Vapor Glove 6 Boa®', type: 'road', weight: 195, drop: 0, stackHeight: 6, flexibility: 'high', stabilityControl: false, minimalismIndex: 92 },
    { id: 'altra-olympus-2', brand: 'Altra', model: 'Olympus 2.75', type: 'trail', weight: 339, drop: 0, stackHeight: 33, flexibility: 'medium', stabilityControl: false, minimalismIndex: 44 },
    { id: 'scott-supertrac-speed', brand: 'Scott', model: 'Supertrac Speed RC', type: 'trail', weight: 215, drop: 3, stackHeight: 18, flexibility: 'high', stabilityControl: false, minimalismIndex: 72 },

    // --- SPECIALIZED BRANDS (Topo, Salomon, Kiprun) ---
    { id: 'topo-cyclone-3', brand: 'Topo Athletic', model: 'Cyclone 3', type: 'road', weight: 196, drop: 5, stackHeight: 28, flexibility: 'high', stabilityControl: false, minimalismIndex: 60 },
    { id: 'topo-phantom-4', brand: 'Topo Athletic', model: 'Phantom 4', type: 'road', weight: 264, drop: 5, stackHeight: 35, flexibility: 'low', stabilityControl: true, minimalismIndex: 48 },
    { id: 'inov8-mudtalon-zero', brand: 'Inov8', model: 'Mudtalon Zero', type: 'trail', weight: 232, drop: 0, stackHeight: 27.5, flexibility: 'high', stabilityControl: false, minimalismIndex: 68 },
    { id: 'salomon-slab-phantasm-2', brand: 'Salomon', model: 'S/Lab Phantasm 2', type: 'race', weight: 219, drop: 9, stackHeight: 37, flexibility: 'low', stabilityControl: true, minimalismIndex: 44 },
    { id: 'salomon-aero-blaze-3', brand: 'Salomon', model: 'Aero Blaze 3', type: 'trail', weight: 230, drop: 8, stackHeight: 35, flexibility: 'medium', stabilityControl: false, minimalismIndex: 40 },
    { id: 'kiprun-jogflow-190', brand: 'Kiprun', model: 'JogFlow 190.1', type: 'road', weight: 243, drop: 4, stackHeight: 30, flexibility: 'medium', stabilityControl: false, minimalismIndex: 56 },

    // --- CLASSICS & STANDARDS ---
    { id: 'vibram-kso', brand: 'Vibram', model: 'FiveFingers KSO', type: 'minimalist', weight: 120, drop: 0, stackHeight: 5, flexibility: 'high', stabilityControl: false, minimalismIndex: 95 },
    { id: 'altra-escalante-4', brand: 'Altra', model: 'Escalante 4', type: 'road', weight: 260, drop: 0, stackHeight: 24, flexibility: 'medium', stabilityControl: false, minimalismIndex: 70 },
    { id: 'nike-free-rn', brand: 'Nike', model: 'Free Run 5.0 NN', type: 'road', weight: 190, drop: 6, stackHeight: 22, flexibility: 'high', stabilityControl: false, minimalismIndex: 72 },
    { id: 'asics-nimbus-26', brand: 'Asics', model: 'Gel Nimbus 26', type: 'maximalist', weight: 290, drop: 8, stackHeight: 41, flexibility: 'low', stabilityControl: true, minimalismIndex: 25 },
    { id: 'brooks-adrenaline-23', brand: 'Brooks', model: 'Adrenaline GTS 23', type: 'stability', weight: 285, drop: 12, stackHeight: 24, flexibility: 'low', stabilityControl: true, minimalismIndex: 15 },
    { id: 'mizuno-wave-rider-27', brand: 'Mizuno', model: 'Wave Rider 27', type: 'road', weight: 285, drop: 12, stackHeight: 38, flexibility: 'low', stabilityControl: true, minimalismIndex: 30 }
];

export function getRecommendedShoes(userProfile: {
    footType: 'flat' | 'neutral' | 'cavus';
    weight: number;
    experienceLevel: 'beginner' | 'intermediate' | 'advanced';
    currentMinimalismIndex: number;
}): ShoeModel[] {
    let targetType: ShoeModel['type'][] = [];

    // Simple Rule Engine
    if (userProfile.footType === 'flat' && userProfile.experienceLevel === 'beginner') {
        targetType = ['stability', 'maximalist', 'road'];
    } else if (userProfile.footType === 'cavus' || (userProfile.footType === 'flat' && userProfile.experienceLevel === 'advanced')) {
        targetType = ['transitional', 'minimalist', 'trail'];
    } else {
        // Neutral
        if (userProfile.experienceLevel === 'beginner') targetType = ['maximalist', 'transitional', 'road'];
        else targetType = ['transitional', 'minimalist'];
    }

    const matches = SHOE_DATABASE.filter(s => targetType.includes(s.type));

    // Sort logic could go here
    return matches.slice(0, 3);
}
