"use client"

import React, { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { getRecommendedShoes } from '@/app/dashboard/assessments/shoe-database'
import { ANATOMICAL_ZONES } from './steps/constants'

// Lazy Loaded Steps
const PatientDataStep = dynamic(() => import('./steps/patient-data-step').then(m => m.PatientDataStep), {
    loading: () => <Skeleton className="h-[600px] w-full" />
})
const PainMapStep = dynamic(() => import('./steps/pain-map-step').then(m => m.PainMapStep), {
    loading: () => <Skeleton className="h-[500px] w-full" />
})
const PosturalStep = dynamic(() => import('./steps/postural-step').then(m => m.PosturalStep), {
    loading: () => <Skeleton className="h-[400px] w-full" />
})
const FunctionalStep = dynamic(() => import('./steps/functional-step').then(m => m.FunctionalStep), {
    loading: () => <Skeleton className="h-[800px] w-full" />
})
const ShoeAnalysisStep = dynamic(() => import('./steps/shoe-analysis-step').then(m => m.ShoeAnalysisStep), {
    loading: () => <Skeleton className="h-[400px] w-full" />
})
const AssessmentRadar = dynamic(() => import('./assessment-radar').then(m => m.AssessmentRadar), {
    loading: () => <Skeleton className="h-[300px] w-full" />
})

interface BiomechanicsFormProps {
    initialData?: any
    patientId: string
    onSave: (data: any) => void
    readOnly?: boolean
}

const DEFAULT_DATA = {
    // 1. Anamnese
    qp: '',
    hma: '',
    painDuration: '',
    eva: 0,
    history: {
        hp: '',
        medication: '',
        prevTreatment: [] as string[],
        physicalActivity: [] as string[],
        activityFrequency: 'sedentary'
    },
    patientProfile: {
        goals: [] as string[],
        experience: 'recreational',
        injuryStatus: 'none',
    },
    painPoints: {
        metatarsal1: { right: false, left: false },
        metatarsal3: { right: false, left: false },
        metatarsal5: { right: false, left: false },
        calcaneus: { right: false, left: false },
        arch: { right: false, left: false },
        achilles: { right: false, left: false },
        knee: { right: false, left: false },
        hip: { right: false, left: false },
        shoulder: { right: false, left: false },
        elbow: { right: false, left: false },
        wrist: { right: false, left: false },
        lumbar: { right: false, left: false },
        thoracic: { right: false, left: false },
        cervical: { right: false, left: false },
        sacrum: { right: false, left: false },
        glute: { right: false, left: false },
        ankle: { right: false, left: false },
    },
    customPainPoints: [] as any[],
    currentShoe: {
        model: '',
        size: '',
        selectionId: '',
        isManual: true,
        specs: {
            weight: 250,
            drop: 8,
            stack: 20,
            flexLong: 'medium',
            flexTor: 'medium',
            stability: false
        },
        minScoreData: {
            weight: 0,
            stack: 0,
            drop: 0,
            stability: 0,
            flexLong: 0,
            flexTor: 0
        }
    },
    fpi: {
        right: [0, 0, 0, 0, 0, 0],
        left: [0, 0, 0, 0, 0, 0]
    },
    anthropometry: {
        legLengthRight: 0, legLengthLeft: 0,
        navicularRight: 0, navicularLeft: 0,
        archTypeRight: 'MÉDIO', archTypeLeft: 'MÉDIO'
    },
    anteversion: { right: 0, left: 0 },
    rotation: { right: 35, left: 35 },
    measurements: {
        retrope: { left: 0, right: 0 },
        antepe: { left: 0, right: 0 },
        apa: { left: 0, right: 0 }
    },
    yBalance: {
        limbLength: { l: 0, r: 0 },
        anterior: { l: 0, r: 0 },
        posteromedial: { l: 0, r: 0 },
        posterolateral: { l: 0, r: 0 },
        isManualStability: false,
        manualStability: { l: 0, r: 0 },
        dominantLeg: 'right',
        trials: {
            anterior: { l: [0, 0, 0], r: [0, 0, 0] },
            posteromedial: { l: [0, 0, 0], r: [0, 0, 0] },
            posterolateral: { l: [0, 0, 0], r: [0, 0, 0] }
        }
    },
    dfiImages: {
        initial: { left: '', right: '' },
        loading: { left: '', right: '' },
        propulsion: { left: '', right: '' }
    },
    dfi: {
        left: { initial: 0, loading: 0, propulsion: 0 },
        right: { initial: 0, loading: 0, propulsion: 0 }
    },
    singleLegSquat: {
        pelvicDrop: { left: 0, right: 0 },
        dynamicValgus: { left: 0, right: 0 }
    },
    flexibility: {
        lungeRight: 35, lungeLeft: 35,
        mobilityRaysRight: 0, mobilityRaysLeft: 0,
        mobilityRearRight: 0, mobilityRearLeft: 0,
        thomasRight: 5, thomasLeft: 5,
        hamstringRight: 110, hamstringLeft: 110,
        jackRight: 0, jackLeft: 0,
    },
    strength: {
        gluteMedRight: 5, gluteMedLeft: 5,
        gluteMaxRight: 5, gluteMaxLeft: 5,
        trunkincRight: 0, trunkincLeft: 0
    },
    balance: {
        stabRight: 0, stabLeft: 0
    },
    functionScore: 0,
    efep: {
        items: [
            { activity: '', score: 0 },
            { activity: '', score: 0 },
            { activity: '', score: 0 }
        ],
        total: 0
    },
    exercises: [],
    orientations: '',
    exams: '',
    baro2d: '',
    baro3d: '',
    shoeSize: 0,
}

export function BiomechanicsForm({ initialData, patientId, onSave, readOnly = false }: BiomechanicsFormProps) {
    const [mainTab, setMainTab] = useState("patient")

    // State Initialization with Merge & Migration
    const [data, setData] = useState<any>(() => {
        if (!initialData || Object.keys(initialData).length === 0) return DEFAULT_DATA

        // --- MIGRATION LOGIC (Fix for "Data Lost" issue) ---
        const migrated = { ...initialData }

        // 1. Map old 'anamnese' (text) to 'hma' if hma is empty
        if (migrated.anamnese && !migrated.hma) {
            migrated.hma = migrated.anamnese
        }
        // 2. Map old 'queixa_principal' or 'queixa' to 'qp'
        if ((migrated.queixa_principal || migrated.queixa) && !migrated.qp) {
            migrated.qp = migrated.queixa_principal || migrated.queixa
        }
        // 3. Map flat 'historico' to nested 'history.hp'
        if (migrated.historico && (!migrated.history || !migrated.history.hp)) {
            migrated.history = { ...(migrated.history || {}), hp: migrated.historico }
        }
        // 4. Map 'evolucoes' or 'pain_history' to 'painDuration'
        if (migrated.pain_history && !migrated.painDuration) {
            migrated.painDuration = migrated.pain_history
        }

        return {
            ...DEFAULT_DATA,
            ...migrated,
            history: { ...DEFAULT_DATA.history, ...(migrated.history || {}) },
            painPoints: { ...DEFAULT_DATA.painPoints, ...(migrated.painPoints || {}) },
            customPainPoints: migrated.customPainPoints || [],
            currentShoe: {
                ...DEFAULT_DATA.currentShoe,
                ...(migrated.currentShoe || {}),
                specs: { ...DEFAULT_DATA.currentShoe.specs, ...(migrated.currentShoe?.specs || {}) }
            },
            fpi: {
                ...DEFAULT_DATA.fpi,
                ...(migrated.fpi || {}),
                right: migrated.fpi?.right || DEFAULT_DATA.fpi.right,
                left: migrated.fpi?.left || DEFAULT_DATA.fpi.left
            },
            anthropometry: {
                ...DEFAULT_DATA.anthropometry,
                ...(migrated.anthropometry || {}),
                legLengthRight: (migrated.anthropometry as any)?.legLengthRight ?? (migrated.anthropometry as any)?.dismetria?.right ?? DEFAULT_DATA.anthropometry.legLengthRight,
                legLengthLeft: (migrated.anthropometry as any)?.legLengthLeft ?? (migrated.anthropometry as any)?.dismetria?.left ?? DEFAULT_DATA.anthropometry.legLengthLeft,
                navicularRight: (migrated.anthropometry as any)?.navicularRight ?? (migrated.anthropometry as any)?.naviculometer?.right ?? DEFAULT_DATA.anthropometry.navicularRight,
                navicularLeft: (migrated.anthropometry as any)?.navicularLeft ?? (migrated.anthropometry as any)?.naviculometer?.left ?? DEFAULT_DATA.anthropometry.navicularLeft,
                archTypeRight: (migrated.anthropometry as any)?.archTypeRight ?? DEFAULT_DATA.anthropometry.archTypeRight,
                archTypeLeft: (migrated.anthropometry as any)?.archTypeLeft ?? DEFAULT_DATA.anthropometry.archTypeLeft,
            },
            anteversion: { ...DEFAULT_DATA.anteversion, ...(migrated.anteversion || {}) },
            rotation: { ...DEFAULT_DATA.rotation, ...(migrated.rotation || {}) },
            measurements: {
                ...DEFAULT_DATA.measurements,
                ...(migrated.measurements || {}),
                retrope: { ...DEFAULT_DATA.measurements.retrope, ...(migrated.measurements?.retrope || {}) },
                antepe: { ...DEFAULT_DATA.measurements.antepe, ...(migrated.measurements?.antepe || {}) },
                apa: { ...DEFAULT_DATA.measurements.apa, ...(migrated.measurements?.apa || {}) }
            },
            singleLegSquat: { ...DEFAULT_DATA.singleLegSquat, ...(migrated.singleLegSquat || {}) },
            strength: { ...DEFAULT_DATA.strength, ...(migrated.strength || {}) },
            yBalance: {
                ...DEFAULT_DATA.yBalance,
                ...(migrated.yBalance || {}),
                limbLength: { ...DEFAULT_DATA.yBalance.limbLength, ...(migrated.yBalance?.limbLength || {}) },
                anterior: { ...DEFAULT_DATA.yBalance.anterior, ...(migrated.yBalance?.anterior || {}) },
                posteromedial: { ...DEFAULT_DATA.yBalance.posteromedial, ...(migrated.yBalance?.posteromedial || {}) },
                posterolateral: { ...DEFAULT_DATA.yBalance.posterolateral, ...(migrated.yBalance?.posterolateral || {}) },
                isManualStability: migrated.yBalance?.isManualStability ?? DEFAULT_DATA.yBalance.isManualStability,
                manualStability: { ...DEFAULT_DATA.yBalance.manualStability, ...(migrated.yBalance?.manualStability || {}) },
                dominantLeg: migrated.yBalance?.dominantLeg ?? DEFAULT_DATA.yBalance.dominantLeg,
                trials: {
                    ...DEFAULT_DATA.yBalance.trials, ...(migrated.yBalance?.trials || {}),
                    anterior: { ...DEFAULT_DATA.yBalance.trials.anterior, ...(migrated.yBalance?.trials?.anterior || {}) },
                    posteromedial: { ...DEFAULT_DATA.yBalance.trials.posteromedial, ...(migrated.yBalance?.trials?.posteromedial || {}) },
                    posterolateral: { ...DEFAULT_DATA.yBalance.trials.posterolateral, ...(migrated.yBalance?.trials?.posterolateral || {}) }
                }
            },
            dfi: { ...DEFAULT_DATA.dfi, ...(migrated.dfi || {}) },
            dfiImages: { ...DEFAULT_DATA.dfiImages, ...(migrated.dfiImages || {}) },
            balance: { ...DEFAULT_DATA.balance, ...(migrated.balance || {}) },
            efep: {
                ...DEFAULT_DATA.efep,
                ...(migrated.efep || {}),
                items: (migrated.efep?.items || DEFAULT_DATA.efep.items).map((it: any, idx: number) => ({ ...DEFAULT_DATA.efep.items[idx], ...it }))
            },
            baro2d: migrated.baro2d ?? DEFAULT_DATA.baro2d,
            baro3d: migrated.baro3d ?? DEFAULT_DATA.baro3d,
            shoeSize: migrated.shoeSize ?? DEFAULT_DATA.shoeSize,
            orientations: migrated.orientations ?? DEFAULT_DATA.orientations,
            flexibility: {
                ...DEFAULT_DATA.flexibility,
                ...(migrated.flexibility || {}),
                mobilityRaysRight: migrated.flexibility?.mobilityRaysRight ?? migrated.flexibility?.mobilityRight ?? 0,
                mobilityRaysLeft: migrated.flexibility?.mobilityRaysLeft ?? migrated.flexibility?.mobilityLeft ?? 0,
            }
        }
    })

    // Autosave Effect
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!readOnly && JSON.stringify(data) !== JSON.stringify(initialData)) {
                onSave(data)
            }
        }, 2000)
        return () => clearTimeout(timer)
    }, [data, onSave, readOnly, initialData])

    // Update Logic
    const updateField = (path: string, val: any) => {
        setData((prev: any) => {
            const newState = { ...prev }
            const parts = path.split('.')
            let current = newState
            for (let i = 0; i < parts.length - 1; i++) {
                const key = parts[i]
                if (Array.isArray(current[key])) {
                    current[key] = [...current[key]]
                } else {
                    current[key] = { ...current[key] }
                }
                current = current[key]
            }
            current[parts[parts.length - 1]] = val
            return newState
        })
    }

    // Pain Map Zones Effect
    useEffect(() => {
        const customPoints = data.customPainPoints || []
        const newPainPoints = JSON.parse(JSON.stringify(DEFAULT_DATA.painPoints))
        const isNear = (p1: { x: number, y: number }, p2: { x: number, y: number }, threshold = 12) => {
            const dx = p1.x - p2.x
            const dy = p1.y - p2.y
            return Math.sqrt(dx * dx + dy * dy) < threshold
        }
        customPoints.forEach((point: any) => {
            let zoneGroup: any = null
            if (point.view === 'anterior') zoneGroup = ANATOMICAL_ZONES.anterior
            else if (point.view === 'posterior') zoneGroup = ANATOMICAL_ZONES.posterior
            else if (point.view === 'feetLeft' || point.view === 'feetRight') zoneGroup = ANATOMICAL_ZONES.feet
            if (!zoneGroup) return

            Object.entries(zoneGroup).forEach(([zoneName, sides]: [string, any]) => {
                if (!newPainPoints[zoneName]) return
                if (point.view === 'anterior' || point.view === 'posterior') {
                    if (sides.right && isNear(point, sides.right)) newPainPoints[zoneName].right = true
                    if (sides.left && isNear(point, sides.left)) newPainPoints[zoneName].left = true
                }
                if (point.view === 'feetLeft' && sides.left && isNear(point, sides.left)) newPainPoints[zoneName].left = true
                if (point.view === 'feetRight' && sides.right && isNear(point, sides.right)) newPainPoints[zoneName].right = true
            })
        })
        if (JSON.stringify(newPainPoints) !== JSON.stringify(data.painPoints)) {
            setData((prev: any) => ({ ...prev, painPoints: newPainPoints }))
        }
    }, [data.customPainPoints])

    // Arch Calculation Effect
    useEffect(() => {
        const shoeSize = data.shoeSize || 0
        if (shoeSize === 0) return
        const calcArch = (navHeight: number) => {
            const ratio = navHeight / shoeSize
            if (ratio < 0.6) return 'BAIXO'
            if (ratio > 0.9) return 'ALTO'
            return 'MÉDIO'
        }
        const newRight = calcArch(data.anthropometry.navicularRight || 0)
        const newLeft = calcArch(data.anthropometry.navicularLeft || 0)
        if (newRight !== data.anthropometry.archTypeRight || newLeft !== data.anthropometry.archTypeLeft) {
            setData((prev: any) => ({
                ...prev,
                anthropometry: { ...prev.anthropometry, archTypeRight: newRight, archTypeLeft: newLeft }
            }))
        }
    }, [data.anthropometry.navicularRight, data.anthropometry.navicularLeft, data.shoeSize])

    // Calculations & Memos
    const minimalismIndex = useMemo(() => {
        const s = data.currentShoe.specs
        const m = data.currentShoe.minScoreData
        let score = 0
        score += Math.max(0, 5 - (s.weight - 150) / 40)
        score += Math.max(0, 5 - (s.drop / 2.4))
        score += Math.max(0, 5 - (s.stack - 10) / 5)
        score += m.flexLong * 0.5
        score += m.flexTor * 0.5
        score += Math.max(0, 5 - m.stability)
        return Math.min(100, Math.round((score / 25) * 100))
    }, [data.currentShoe.specs, data.currentShoe.minScoreData])

    const smartRecommendation = useMemo(() => {
        const { goals, experience, injuryStatus } = data.patientProfile || {}
        const { painPoints } = data
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
    }, [data.patientProfile, data.painPoints])

    const getFpiClass = (scores: number[]) => {
        const sum = scores.reduce((a, b) => a + b, 0)
        if (sum > 6) return { label: 'Pronado (Plano)', color: 'text-orange-600', score: sum }
        if (sum < -6) return { label: 'Supinado (Cavo)', color: 'text-blue-600', score: sum }
        return { label: 'Neutro', color: 'text-green-600', score: sum }
    }
    const fpiRight = getFpiClass(data.fpi.right)
    const fpiLeft = getFpiClass(data.fpi.left)

    const radarData = useMemo(() => {
        const norm100 = (val: number, max: number) => Math.min(100, (val / max) * 100)
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
    }, [data, fpiRight.score, fpiLeft.score])

    const recommendations = useMemo(() => {
        return getRecommendedShoes({
            footType: fpiRight.label.includes('Plano') ? 'flat' : fpiRight.label.includes('Cavo') ? 'cavus' : 'neutral',
            weight: 75,
            experienceLevel: 'intermediate',
            currentMinimalismIndex: minimalismIndex
        })
    }, [fpiRight, minimalismIndex])

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20">
            <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto overflow-x-auto">
                    <TabsTrigger value="patient">Dados do Paciente</TabsTrigger>
                    <TabsTrigger value="pain">Mapa de Dor</TabsTrigger>
                    <TabsTrigger value="postural">Avaliação Postural</TabsTrigger>
                    <TabsTrigger value="functional">Testes Funcionais</TabsTrigger>
                    <TabsTrigger value="shoe">Análise de Calçados</TabsTrigger>
                </TabsList>

                <TabsContent value="patient" className="mt-6">
                    <PatientDataStep data={data} updateField={updateField} readOnly={readOnly} />
                </TabsContent>

                <TabsContent value="pain" className="mt-6">
                    <PainMapStep data={data} updateField={updateField} readOnly={readOnly} />
                </TabsContent>

                <TabsContent value="postural" className="mt-6">
                    <PosturalStep data={data} updateField={updateField} readOnly={readOnly} />
                </TabsContent>

                <TabsContent value="functional" className="mt-6">
                    <FunctionalStep
                        data={data}
                        updateField={updateField}
                        readOnly={readOnly}
                        fpiLeft={fpiLeft}
                        fpiRight={fpiRight}
                    />
                    <AssessmentRadar data={radarData} />
                </TabsContent>

                <TabsContent value="shoe" className="mt-6">
                    <ShoeAnalysisStep
                        data={data}
                        updateField={updateField}
                        readOnly={readOnly}
                        minimalismIndex={minimalismIndex}
                        recommendations={recommendations}
                        smartRecommendation={smartRecommendation}
                    />
                </TabsContent>
            </Tabs>

            <div className="fixed bottom-6 right-6 z-50">
                <Button size="lg" className="shadow-2xl gap-2 rounded-full px-8" onClick={() => { onSave(data); toast.success("Avaliação salva!") }}>
                    <Save className="w-5 h-5" />
                    Salvar Avaliação
                </Button>
            </div>
        </div>
    )
}
