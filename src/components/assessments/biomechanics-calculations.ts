
import { ANATOMICAL_ZONES } from './steps/constants'

export const calculateMinimalismIndex = (currentShoe: any) => {
    const s = currentShoe.specs
    const m = currentShoe.minScoreData
    let score = 0
    score += Math.max(0, 5 - (s.weight - 150) / 40)
    score += Math.max(0, 5 - (s.drop / 2.4))
    score += Math.max(0, 5 - (s.stack - 10) / 5)
    score += m.flexLong * 0.5
    score += m.flexTor * 0.5
    score += Math.max(0, 5 - m.stability)
    return Math.min(100, Math.round((score / 25) * 100))
}

export const calculateSmartRecommendation = (patientProfile: any, painPoints: any) => {
    const { goals, experience, injuryStatus } = patientProfile || {}
    let suggestion = { indexRange: [0, 100], traits: [] as string[], description: "Análise geral baseada no perfil." }
    const hasProximalPain = painPoints.knee?.left || painPoints.knee?.right || painPoints.hip?.left || painPoints.hip?.right
    const hasDistalPain = painPoints.achilles?.left || painPoints.achilles?.right || painPoints.calcaneus?.left || painPoints.calcaneus?.right || painPoints.arch?.left || painPoints.arch?.right || painPoints.metatarsal1?.left || painPoints.metatarsal1?.right || painPoints.metatarsal5?.left || painPoints.metatarsal5?.right

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
        } else if (experience === 'competitive' || goals?.includes('Performance')) {
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
    const fpiRight = getFpiClass(data.fpi.right)
    const fpiLeft = getFpiClass(data.fpi.left)

    const mapRange = (val: number, min: number, max: number) => Math.min(100, Math.max(0, ((val - min) / (max - min)) * 100))
    const scorePain = 100 - (data.eva * 10)
    const efepItems = data.efep?.items || []
    const efepSum = efepItems.reduce((acc: number, item: any) => acc + (+item.score || 0), 0)
    const scoreFunc = efepItems.length > 0 ? (efepSum / efepItems.length) * 10 : 0
    const slsLeft = ((data.singleLegSquat?.pelvicDrop?.left || 0) + (data.singleLegSquat?.dynamicValgus?.left || 0)) / 2
    const slsRight = ((data.singleLegSquat?.pelvicDrop?.right || 0) + (data.singleLegSquat?.dynamicValgus?.right || 0)) / 2
    const scoreStab = mapRange((slsLeft + slsRight) / 2, -5, 5)
    const strAvg = ((data.strength?.gluteMedRight || 5) + (data.strength?.gluteMedLeft || 5) + (data.strength?.gluteMaxRight || 5) + (data.strength?.gluteMaxLeft || 5)) / 4
    const scoreStr = strAvg * 10
    const scorePosture = Math.max(0, 100 - (((Math.abs(fpiRight.score) + Math.abs(fpiLeft.score)) / 2) * 8))

    const calcFlexItem = (valLeft: any, valRight: any, min: number, max: number, weight: number, invert = false) => {
        if (valLeft === undefined || valRight === undefined) return null
        let score = (((valLeft + valRight) / 2 - min) / (max - min)) * 100
        score = Math.min(100, Math.max(0, score))
        if (invert) score = 100 - score
        return { score, weight }
    }
    const flexItems = [
        calcFlexItem(data.flexibility.mobilityRaysLeft, data.flexibility.mobilityRaysRight, -5, 5, 1),
        calcFlexItem(data.flexibility.thomasLeft, data.flexibility.thomasRight, 0, 10, 1, true),
        calcFlexItem(data.flexibility.hamstringLeft, data.flexibility.hamstringRight, 90, 132, 1),
        calcFlexItem(data.flexibility.jackLeft, data.flexibility.jackRight, -5, 5, 1),
        calcFlexItem(data.flexibility.lungeLeft, data.flexibility.lungeRight, 20, 45, 2),
        calcFlexItem(data.rotation?.left, data.rotation?.right, 20, 40, 2)
    ].filter(Boolean) as { score: number, weight: number }[]
    const totalFlex = flexItems.length > 0 ? flexItems.reduce((acc, item) => acc + (item.score * item.weight), 0) / flexItems.reduce((acc, item) => acc + item.weight, 0) : 0

    const calculateSymmetry = () => {
        let totalLsi = 0; let count = 0
        const addLsi = (v1: number, v2: number, type: 'magnitude' | 'signed' = 'magnitude') => {
            let val1 = v1 || 0; let val2 = v2 || 0
            if (type === 'signed') { val1 += 5; val2 += 5 }
            if (Math.abs(val1) < 0.01 && Math.abs(val2) < 0.01) return
            const min = Math.min(Math.abs(val1), Math.abs(val2)); const max = Math.max(Math.abs(val1), Math.abs(val2))
            totalLsi += max === 0 ? 0 : (min / max) * 100; count++
        }
        addLsi(data.anthropometry.legLengthLeft, data.anthropometry.legLengthRight)
        addLsi(data.anthropometry.navicularLeft, data.anthropometry.navicularRight)
        addLsi(data.strength?.gluteMedLeft, data.strength?.gluteMedRight)
        addLsi(data.flexibility.lungeLeft, data.flexibility.lungeRight)
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
