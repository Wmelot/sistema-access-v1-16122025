
import { ANATOMICAL_ZONES } from './steps/constants'

export const calculateMinimalismIndex = (currentShoe: any) => {
    if (!currentShoe) return 0;

    // Support both nested structure (specs/minScoreData) and flat structure from form
    const s = currentShoe.specs || currentShoe;
    const m = currentShoe.minScoreData || {};

    const weight = Number(s.weight) || 0;
    const drop = Number(s.drop) || 0;
    const stack = Number(s.stack) || 0;
    const flexLong = Number(m.flexLong) || 0;
    const flexTor = Number(m.flexTor) || 0;
    const stability = Number(m.stability) || 0;

    let score = 0;
    if (weight > 0) score += Math.max(0, 5 - (weight - 150) / 40);
    score += Math.max(0, 5 - (drop / 2.4));
    score += Math.max(0, 5 - (stack - 10) / 5);
    score += flexLong * 0.5;
    score += flexTor * 0.5;
    score += Math.max(0, 5 - stability);

    return Math.min(100, Math.round((score / 25) * 100));
}

export const calculateSmartRecommendation = (patientProfile: any, painPoints: any) => {
    const { experience, injuryStatus } = patientProfile || {}
    const goals = patientProfile?.goals || []

    let suggestion = { indexRange: [0, 100], traits: [] as string[], description: "Análise geral baseada no perfil." }

    // Unified pain point checking (supports both object and array from form)
    const checkPain = (zone: string, side?: 'left' | 'right') => {
        if (!painPoints) return false
        if (Array.isArray(painPoints)) {
            return painPoints.some((p: any) => {
                const matchesZone = p.point?.toLowerCase().includes(zone.toLowerCase())
                const matchesSide = !side || p.side === side
                return matchesZone && matchesSide
            })
        }
        if (typeof painPoints === 'object') {
            const zoneData = painPoints[zone]
            if (!zoneData) return false
            return side ? !!zoneData[side] : (!!zoneData.left || !!zoneData.right)
        }
        return false
    }

    const hasProximalPain = checkPain('knee') || checkPain('hip')
    const hasDistalPain = checkPain('achilles') || checkPain('calcaneus') || checkPain('arch') ||
        checkPain('metatarsal') || checkPain('hallux') || checkPain('ankle')

    if (injuryStatus === 'acute') {
        if (hasDistalPain) {
            suggestion.indexRange = [0, 50]
            suggestion.traits.push('Drop Alto (>8mm)', 'Amortecimento Generoso', 'Solado Rígido')
            suggestion.description = "Fase Aguda Distal (Pé/Tendão): Priorizar proteção e descarga mecânica. Calçado maximalista ou tradicional ajuda a reduzir carga no tendão de Aquiles e fáscia."
        } else if (hasProximalPain) {
            suggestion.indexRange = [60, 100]
            suggestion.traits.push('Drop Baixo (<6mm)', 'Baixo Amortecimento')
            suggestion.description = "Fase Aguda Proximal (Joelho/Quadril): Priorizar redução de impacto transiente. Calçado minimalista estimula cadência mais alta e menor impacto nas articulações."
        } else {
            suggestion.description = "Lesão Aguda: Manter calçado confortável atual ou aumentar proteção temporariamente."
        }
    } else if (injuryStatus === 'persistent') {
        if (hasProximalPain) {
            suggestion.indexRange = [80, 100]
            suggestion.traits.push('Minimalismo Alto', 'Zero Drop', 'Leveza')
            suggestion.description = "Lesão Persistente Proximal: Evidência forte para aumentar o Índice Minimalista (>80%) para reduzir carga articular no joelho e quadril."
        } else if (hasDistalPain) {
            suggestion.indexRange = [0, 40]
            suggestion.traits.push('Estruturado', 'Drop > 10mm')
            suggestion.description = "Lesão Persistente Distal: Reduzir carga tecidual local. Manter em calçados com maior suporte e drop elevado."
        }
    } else {
        if (experience === 'beginner') {
            suggestion.indexRange = [60, 90]
            suggestion.traits.push('Leve', 'Flexível')
            suggestion.description = "Iniciante: Evite calçados muito pesados ou muito rígidos. Um índice moderado a alto (>60%) favorece o fortalecimento natural e boa técnica."
        } else if (experience === 'competitive' || goals.some((g: string) => g?.includes('Performance'))) {
            suggestion.indexRange = [80, 100]
            suggestion.traits.push('Performance', 'Baixo Peso', 'Responsivo')
            suggestion.description = "Performance: Calçados com alto índice minimalista ou super-shoes (placa) dependendo da prova. Foco em economia de corrida."
        } else {
            suggestion.description = "Sem Lesões: Manter hábitos atuais ('Não se mexe em time que está ganhando'). Se desejar transição, faça de forma gradual."
        }
    }
    return suggestion
}


export const getFpiClass = (scores: number[]) => {
    const sum = scores.reduce((a, b) => a + b, 0)
    if (sum > 6) return { label: 'Pronado (Plano)', color: 'text-orange-600', score: sum }
    if (sum < -6) return { label: 'Supinado (Cavo)', color: 'text-blue-600', score: sum }
    return { label: 'Neutro', color: 'text-green-600', score: sum }
}

export const calculateRadarData = (data: any) => {
    if (!data) return [];

    // Helper to get FPI score safely
    const getFpiScore = (fpiArr: any) => {
        if (!fpiArr || !Array.isArray(fpiArr)) return { label: 'Neutro', color: 'text-green-600', score: 0 };
        return getFpiClass(fpiArr);
    };

    const fpiRight = getFpiScore(data.fpi?.right || data.postural?.fpi_right);
    const fpiLeft = getFpiScore(data.fpi?.left || data.postural?.fpi_left);

    const mapRange = (val: number, min: number, max: number) => Math.min(100, Math.max(0, ((val - min) / (max - min)) * 100))

    const painVal = data.eva ?? (data.hma?.eva?.[0]) ?? 0;
    const scorePain = 100 - (Number(painVal) * 10)

    const efepItems = data.efep?.items || data.efep || []
    const efepSum = Array.isArray(efepItems)
        ? efepItems.reduce((acc: number, item: any) => acc + (Number(item?.score) || 0), 0)
        : 0
    const efepCount = Array.isArray(efepItems) ? efepItems.filter((i: any) => i?.activity).length : 0
    const scoreFunc = efepCount > 0 ? (efepSum / (efepCount * 10)) * 100 : 0

    const sls = data.singleLegSquat || data.tests?.single_squat || {}
    const slsLeft = ((Number(sls.pelvicDrop?.left) || 0) + (Number(sls.dynamicValgus?.left) || 0)) / 2
    const slsRight = ((Number(sls.pelvicDrop?.right) || 0) + (Number(sls.dynamicValgus?.right) || 0)) / 2
    const scoreStab = mapRange((slsLeft + slsRight) / 2, -5, 5)

    const str = data.strength || data.tests?.glute_strength || {}
    const strAvg = ((Number(str.gluteMedRight || str.med_right) || 5) +
        (Number(str.gluteMedLeft || str.med_left) || 5) +
        (Number(str.gluteMaxRight || str.max_right) || 5) +
        (Number(str.gluteMaxLeft || str.max_left) || 5)) / 4
    const scoreStr = strAvg * 10

    const scorePosture = Math.max(0, 100 - (((Math.abs(fpiRight.score) + Math.abs(fpiLeft.score)) / 2) * 8))

    const calcFlexItem = (valLeft: any, valRight: any, min: number, max: number, weight: number, invert = false) => {
        if (valLeft === undefined || valRight === undefined || valLeft === null || valRight === null) return null
        let score = (((Number(valLeft) + Number(valRight)) / 2 - min) / (max - min)) * 100
        score = Math.min(100, Math.max(0, score))
        if (invert) score = 100 - score
        return { score, weight }
    }

    const flex = data.flexibility || data.tests || {}
    const rot = data.rotation || data.tests?.ventral?.rotation || {}

    const flexItems = [
        calcFlexItem(flex.mobilityRaysLeft, flex.mobilityRaysRight, -5, 5, 1),
        calcFlexItem(flex.thomasLeft || flex.thomas?.left, flex.thomasRight || flex.thomas?.right, 0, 10, 1, true),
        calcFlexItem(flex.hamstringLeft || flex.slr?.left, flex.hamstringRight || flex.slr?.right, 90, 132, 1),
        calcFlexItem(flex.jackLeft || flex.jack?.left, flex.jackRight || flex.jack?.right, -5, 5, 1),
        calcFlexItem(flex.lungeLeft || flex.lunge?.left, flex.lungeRight || flex.lunge?.right, 20, 45, 2),
        calcFlexItem(rot.left, rot.right, 20, 40, 2)
    ].filter(Boolean) as { score: number, weight: number }[]
    const totalFlex = flexItems.length > 0 ? flexItems.reduce((acc, item) => acc + (item.score * item.weight), 0) / flexItems.reduce((acc, item) => acc + item.weight, 0) : 0

    const calculateSymmetry = () => {
        let totalLsi = 0; let count = 0
        const addLsi = (v1: any, v2: any, type: 'magnitude' | 'signed' = 'magnitude') => {
            let val1 = Number(v1) || 0; let val2 = Number(v2) || 0
            if (type === 'signed') { val1 += 5; val2 += 5 }
            if (Math.abs(val1) < 0.01 && Math.abs(val2) < 0.01) return
            const min = Math.min(Math.abs(val1), Math.abs(val2)); const max = Math.max(Math.abs(val1), Math.abs(val2))
            totalLsi += max === 0 ? 0 : (min / max) * 100; count++
        }

        const anthro = data.anthropometry || data.tests?.ybalance || {}
        addLsi(anthro.legLengthLeft || anthro.legLength?.left, anthro.legLengthRight || anthro.legLength?.right)
        addLsi(anthro.navicularLeft || data.postural?.navicular?.left, anthro.navicularRight || data.postural?.navicular?.right)
        addLsi(str.gluteMedLeft || str.med_left, str.gluteMedRight || str.med_right)
        addLsi(flex.lungeLeft || flex.lunge?.left, flex.lungeRight || flex.lunge?.right)

        return count === 0 ? 100 : (totalLsi / count)
    }
    const scoreSym = calculateSymmetry()

    return [
        { subject: 'Dor (Alívio)', A: scorePain, fullMark: 100 },
        { subject: 'Função', A: scoreFunc, fullMark: 100 },
        { subject: 'Estabilidade', A: scoreStab, fullMark: 100 },
        { subject: 'Força', A: scoreStr, fullMark: 100 },
        { subject: 'Postura', A: scorePosture, fullMark: 100 },
        { subject: 'Simetria', A: Math.round(scoreSym), fullMark: 100 },
        { subject: 'Flexibilidade', A: Math.round(totalFlex), fullMark: 100 },
    ]
}

