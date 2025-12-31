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
    // --- SCRAPED DATA (The Running Clinic) ---
    { id: 'merrell-vapor-6-boa', brand: 'Merrell', model: 'Vapor Glove 6 Boa®', type: 'road', weight: 195, drop: 0, stackHeight: 6, flexibility: 'high', stabilityControl: false, minimalismIndex: 92 },
    { id: 'puma-propio', brand: 'Puma', model: 'Propio', type: 'road', weight: 145, drop: 4, stackHeight: 20, flexibility: 'high', stabilityControl: false, minimalismIndex: 68 },
    { id: 'hoka-mach-x-3', brand: 'Hoka', model: 'Mach X 3', type: 'road', weight: 264, drop: 9.5, stackHeight: 42.9, flexibility: 'low', stabilityControl: true, minimalismIndex: 28 },
    { id: 'saucony-kinvara-16', brand: 'Saucony', model: 'Kinvara 16', type: 'road', weight: 206, drop: 4, stackHeight: 28, flexibility: 'medium', stabilityControl: false, minimalismIndex: 60 },
    { id: 'altra-olympus-275', brand: 'Altra', model: 'Olympus 275', type: 'trail', weight: 339, drop: 0, stackHeight: 33, flexibility: 'medium', stabilityControl: false, minimalismIndex: 44 },
    { id: 'kiprun-jogflow-190', brand: 'Kiprun', model: 'JogFlow 190.1', type: 'road', weight: 243, drop: 4, stackHeight: 30, flexibility: 'medium', stabilityControl: false, minimalismIndex: 56 },
    { id: 'saucony-endorphin-speed-5', brand: 'Saucony', model: 'Endorphin Speed 5', type: 'road', weight: 237, drop: 8, stackHeight: 36, flexibility: 'low', stabilityControl: false, minimalismIndex: 34 },
    { id: 'topo-phantom-4', brand: 'Topo Athletic', model: 'Phantom 4', type: 'road', weight: 264, drop: 5, stackHeight: 35, flexibility: 'low', stabilityControl: true, minimalismIndex: 48 },
    { id: 'topo-cyclone-3', brand: 'Topo Athletic', model: 'Cyclone 3', type: 'road', weight: 196, drop: 5, stackHeight: 28, flexibility: 'high', stabilityControl: false, minimalismIndex: 60 },
    { id: 'inov8-mudtalon-zero', brand: 'Inov8', model: 'Mudtalon Zero', type: 'trail', weight: 232, drop: 0, stackHeight: 27.5, flexibility: 'high', stabilityControl: false, minimalismIndex: 68 },
    { id: 'nb-minimus-trail', brand: 'New Balance', model: 'Minimus Trail', type: 'trail', weight: 213, drop: 4, stackHeight: 20, flexibility: 'high', stabilityControl: false, minimalismIndex: 68 },
    { id: 'scott-supertrac-speed', brand: 'Scott', model: 'Supertrac Speed RC', type: 'trail', weight: 215, drop: 3, stackHeight: 18, flexibility: 'high', stabilityControl: false, minimalismIndex: 72 },
    { id: 'asics-metaspeed-sky', brand: 'Asics', model: 'Metaspeed Sky Tokyo', type: 'race', weight: 170, drop: 5, stackHeight: 39.5, flexibility: 'low', stabilityControl: true, minimalismIndex: 40 },
    { id: 'vivo-primus-flow', brand: 'Vivobarefoot', model: 'Primus Flow', type: 'road', weight: 156, drop: 0, stackHeight: 6, flexibility: 'high', stabilityControl: false, minimalismIndex: 96 },
    { id: 'salomon-slab-phantasm-2', brand: 'Salomon', model: 'S/Lab Phantasm 2', type: 'race', weight: 219, drop: 9, stackHeight: 37, flexibility: 'low', stabilityControl: true, minimalismIndex: 44 },
    { id: 'nike-vomero-plus', brand: 'Nike', model: 'Vomero Plus', type: 'road', weight: 272, drop: 10, stackHeight: 45, flexibility: 'low', stabilityControl: true, minimalismIndex: 22 },
    { id: 'brooks-divide-6', brand: 'Brooks', model: 'Divide 6', type: 'trail', weight: 297, drop: 8, stackHeight: 38, flexibility: 'low', stabilityControl: true, minimalismIndex: 24 },
    { id: 'adidas-boston-13', brand: 'Adidas', model: 'Adizero Boston 13', type: 'road', weight: 254, drop: 6, stackHeight: 34.3, flexibility: 'low', stabilityControl: true, minimalismIndex: 40 },
    { id: 'salomon-aero-blaze-3', brand: 'Salomon', model: 'Aero Blaze 3', type: 'trail', weight: 230, drop: 8, stackHeight: 35, flexibility: 'medium', stabilityControl: false, minimalismIndex: 40 },
    { id: 'topo-mtn-racer-4', brand: 'Topo Athletic', model: 'MTN Racer 4', type: 'trail', weight: 295, drop: 5, stackHeight: 33, flexibility: 'medium', stabilityControl: false, minimalismIndex: 44 },

    // --- CLASSICS & OTHERS ---
    { id: 'vibram-kso', brand: 'Vibram', model: 'FiveFingers KSO', type: 'minimalist', weight: 120, drop: 0, stackHeight: 5, flexibility: 'high', stabilityControl: false, minimalismIndex: 95 },
    { id: 'merrell-vapor-original', brand: 'Merrell', model: 'Vapor Glove 6', type: 'minimalist', weight: 150, drop: 0, stackHeight: 6, flexibility: 'high', stabilityControl: false, minimalismIndex: 90 },
    { id: 'vivo-primus-lite', brand: 'Vivobarefoot', model: 'Primus Lite III', type: 'minimalist', weight: 180, drop: 0, stackHeight: 4, flexibility: 'high', stabilityControl: false, minimalismIndex: 92 },
    { id: 'altra-escalante', brand: 'Altra', model: 'Escalante 3', type: 'transitional', weight: 260, drop: 0, stackHeight: 24, flexibility: 'medium', stabilityControl: false, minimalismIndex: 70 },
    { id: 'saucony-kinvara-14', brand: 'Saucony', model: 'Kinvara 14', type: 'transitional', weight: 200, drop: 4, stackHeight: 31, flexibility: 'medium', stabilityControl: false, minimalismIndex: 60 },
    { id: 'nike-free-5', brand: 'Nike', model: 'Free Run 5.0', type: 'transitional', weight: 190, drop: 6, stackHeight: 20, flexibility: 'high', stabilityControl: false, minimalismIndex: 65 },
    { id: 'hoka-bondi-8', brand: 'Hoka One One', model: 'Bondi 8', type: 'maximalist', weight: 300, drop: 4, stackHeight: 33, flexibility: 'low', stabilityControl: true, minimalismIndex: 30 },
    { id: 'asics-nimbus-25', brand: 'Asics', model: 'Gel Nimbus 25', type: 'maximalist', weight: 290, drop: 8, stackHeight: 41, flexibility: 'low', stabilityControl: true, minimalismIndex: 25 },
    { id: 'asics-kayano-30', brand: 'Asics', model: 'Gel Kayano 30', type: 'stability', weight: 305, drop: 10, stackHeight: 40, flexibility: 'low', stabilityControl: true, minimalismIndex: 20 },
    { id: 'brooks-adrenaline-23', brand: 'Brooks', model: 'Adrenaline GTS 23', type: 'stability', weight: 285, drop: 12, stackHeight: 24, flexibility: 'low', stabilityControl: true, minimalismIndex: 15 },

    // Additional Scraped Batch (Simulated/Enriched)
    { id: 'nike-pegasus-40', brand: 'Nike', model: 'Air Zoom Pegasus 40', type: 'road', weight: 280, drop: 10, stackHeight: 33, flexibility: 'medium', stabilityControl: false, minimalismIndex: 40 },
    { id: 'mizuno-wave-rider', brand: 'Mizuno', model: 'Wave Rider 27', type: 'road', weight: 285, drop: 12, stackHeight: 38, flexibility: 'low', stabilityControl: true, minimalismIndex: 30 },
    { id: 'new-balance-1080', brand: 'New Balance', model: 'Fresh Foam 1080 v13', type: 'maximalist', weight: 260, drop: 6, stackHeight: 38, flexibility: 'medium', stabilityControl: false, minimalismIndex: 45 },
    { id: 'on-cloud-monster', brand: 'On Running', model: 'Cloudmonster', type: 'maximalist', weight: 275, drop: 6, stackHeight: 30, flexibility: 'low', stabilityControl: true, minimalismIndex: 35 },
    { id: 'adidas-adizero-sl', brand: 'Adidas', model: 'Adizero SL', type: 'road', weight: 240, drop: 8, stackHeight: 35, flexibility: 'medium', stabilityControl: false, minimalismIndex: 50 },
    { id: 'hoka-clifton-9', brand: 'Hoka', model: 'Clifton 9', type: 'maximalist', weight: 248, drop: 5, stackHeight: 32, flexibility: 'medium', stabilityControl: false, minimalismIndex: 42 }
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
