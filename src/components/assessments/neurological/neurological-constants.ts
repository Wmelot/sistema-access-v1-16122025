
export const NERVE_ROOTS = {
    cervical: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'T1'],
    lumbar: ['L2', 'L3', 'L4', 'L5', 'S1', 'S2']
}

export const REFLEXES = {
    cervical: [
        { id: 'biceps', label: 'Bicipital', root: 'C5, C6' },
        { id: 'triceps', label: 'Tricipital', root: 'C7, C8' },
    ],
    lumbar: [
        { id: 'patellar', label: 'Patelar', root: 'L3, L4' },
        { id: 'tibial_calcaneus', label: 'Tibial Posterior', root: 'L4, L5' }, // Using 'tibial_calcaneus' ID ?? Wait, Tibial Posterior.
        { id: 'semitendinosus', label: 'Semitendíneo', root: 'L5, S1' },
        { id: 'biceps_femoris', label: 'Bíceps Femoral', root: 'S1, S2' },
        { id: 'achilles', label: 'Aquileu', root: 'S1, S2' },
    ]
}

export const MYOTOMES = {
    cervical: [
        { root: 'C1-C2', muscle: 'Flexores Pescoço', action: 'Flexão Cervical' },
        { root: 'C3', muscle: 'Flexores Laterais', action: 'Flexão Lateral Cervical' },
        { root: 'C4', muscle: 'Trapézio', action: 'Elevação de Ombro' },
        { root: 'C5', muscle: 'Deltóide', action: 'Abdução de Ombro' },
        { root: 'C6', muscle: 'Bíceps/Extensores', action: 'Flexão Cotovelo / Extensão Punho' },
        { root: 'C7', muscle: 'Tríceps/Flexores', action: 'Extensão Cotovelo / Flexão Punho' },
        { root: 'C8', muscle: 'Extensor Polegar', action: 'Extensão de Polegar' },
        { root: 'T1', muscle: 'Interósseos', action: 'Abdução / Adução Dedos' },
    ],
    lumbar: [
        { root: 'L2', muscle: 'Iliopsoas', action: 'Flexão de Quadril' },
        { root: 'L3', muscle: 'Quadríceps', action: 'Extensão de Joelho' },
        { root: 'L4', muscle: 'Tibial Anterior', action: 'Dorsiflexão de Tornozelo' },
        { root: 'L5', muscle: 'Extensor Hálux', action: 'Extensão de Hálux' },
        { root: 'S1', muscle: 'Tríceps Sural', action: 'Flexão Plantar de Tornozelo' },
        { root: 'S2', muscle: 'Isquiotibiais', action: 'Flexão de Joelho' }
    ]
}

export const NEURAL_TENSION_TESTS = {
    cervical: [
        { id: 'ultt1', label: 'ULTT 1 (Mediano)', nerve: 'Mediano' },
        { id: 'ultt2', label: 'ULTT 2 (Musculocutâneo)', nerve: 'Musculocutâneo' },
        { id: 'ultt3', label: 'ULTT 3 (Radial)', nerve: 'Radial' },
        { id: 'ultt4', label: 'ULTT 4 (Ulnar)', nerve: 'Ulnar' },
    ],
    lumbar: [
        { id: 'slr', label: 'SLR (Elevação Perna Reta)', nerve: 'Ciático' },
        { id: 'slump', label: 'Slump Test', nerve: 'Dural/Ciático' },
        { id: 'pkb', label: 'Prone Knee Bend (Femoral)', nerve: 'Femoral' },
    ]
}


export const DERMATOMES_MAP = [
    // Simplified representation logic for SVG Map
    { id: 'C4', area: 'Clavicula', region: 'upper' },
    { id: 'C5', area: 'Ombro Lateral', region: 'upper' },
    { id: 'C6', area: 'Polegar', region: 'upper' },
    { id: 'C7', area: 'Dedo Médio', region: 'upper' },
    { id: 'C8', area: 'Dedo Mínimo', region: 'upper' },
    { id: 'T1', area: 'Braço Medial', region: 'upper' },
    { id: 'L2', area: 'Coxa Proximal', region: 'lower' },
    { id: 'L3', area: 'Joelho Medial', region: 'lower' },
    { id: 'L4', area: 'Maléolo Medial', region: 'lower' },
    { id: 'L5', area: 'Dorso Pé', region: 'lower' },
    { id: 'S1', area: 'Lateral Pé', region: 'lower' },
    { id: 'S2', area: 'Fossa Poplítea', region: 'lower' },
]

export function suggestRootPathology(data: any, region: 'cervical' | 'lumbar') {
    const hits: Record<string, number> = {}
    const roots = region === 'cervical' ? NERVE_ROOTS.cervical : NERVE_ROOTS.lumbar

    roots.forEach(root => hits[root] = 0)

    // Helper to add score to potential roots
    const addScore = (rootStr: string, points: number) => {
        // Split by comma, slash or hyphen
        const parts = rootStr.split(/[,/-]/).map(s => s.trim())
        parts.forEach(r => {
            // Find best match in known roots
            const match = roots.find(known => known === r)
            if (match && hits[match] !== undefined) {
                hits[match] += points
            }
        })
    }

    // Check Reflexes
    const reflexList = region === 'cervical' ? REFLEXES.cervical : REFLEXES.lumbar
    reflexList.forEach(r => {
        const val = data.neurological?.reflexes?.[r.id]
        if (val && val !== 'normal') {
            addScore(r.root, 2) // High weight
        }
    })

    // Check Myotomes
    const myoList = region === 'cervical' ? MYOTOMES.cervical : MYOTOMES.lumbar
    myoList.forEach(m => {
        if (data.neurological?.myotomes?.[m.root]) {
            addScore(m.root, 1)
        }
    })

    // Check Dermatomes
    data.neurological?.dermatomes?.forEach((d: string) => {
        if (hits[d] !== undefined) hits[d] += 1
    })

    // Return roots with score > 1
    return Object.entries(hits)
        .filter(([_, score]) => score > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([root, score]) => ({ root, score }))
}
