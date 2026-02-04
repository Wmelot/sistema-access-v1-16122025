'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { AlertCircle, Activity, Dumbbell, Ruler, HeartPulse } from 'lucide-react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { STRENGTH_TESTS, FORCE_REFERENCES_BY_AGE } from '@/app/dashboard/[slug]/assessments/strength-references'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { generateAssessmentReport } from "@/actions/attendance"
import { EvolutionCharts } from '@/features/pbe/components/evolution-charts'
import { Bot, Loader2, Sparkles, FileText, CheckCircle, Printer, Camera, TrendingUp, Save, Zap, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useDebounce } from 'use-debounce'
import { FunctionalAssessmentSection } from './sections/FunctionalAssessmentSection'
import { RapidAssessmentModal } from './RapidAssessmentModal'


/**
 * Calculates Z-Score and returns classification properties
 */
function getForceClassification(value: number, weight: number, reference: { mean: number, std_dev: number } | undefined) {
    if (!value || !weight || !reference) return null

    const relForce = value / weight
    const zScore = (relForce - reference.mean) / reference.std_dev

    let label = 'Normal'
    let status: 'weak' | 'normal' | 'strong' = 'normal'

    if (zScore < -1) {
        label = 'Abaixo da Média'
        status = 'weak'
    } else if (zScore > 1) {
        label = 'Acima da Média'
        status = 'strong'
    } else {
        label = 'Na Média'
        status = 'normal'
    }

    return { relForce, zScore, label, status }
}

// KCAL Table for Sports (MET values converted to kcal/hour for 70kg person)
const KCAL_TABLE: Record<string, number> = { "Arremesso de Peso/Disco": 300, "Balé": 450, "Basquete": 650, "Beach Tênis": 550, "Bicicleta Ergométrica (Intensa)": 600, "Bike (Ciclismo de Estrada)": 500, "Boxe (Treino)": 800, "Caminhada (5 km/h)": 300, "Caminhada em Trilha (Hiking)": 450, "Capoeira": 650, "Corrida (10 km/h)": 900, "Crossfit": 700, "Dança de Salão": 350, "Danças Urbanas/Hip Hop": 500, "Escalada": 600, "Esgrima": 450, "Frescobol": 400, "Futebol": 800, "Futsal": 750, "Futevôlei": 600, "Ginástica Artística": 400, "Ginástica Laboral": 150, "Ginástica Olímpica": 500, "Golfe": 250, "Handebol": 700, "Hidroginástica": 400, "Jiu-Jitsu": 750, "Judô": 700, "Karatê": 650, "Kickboxing": 850, "Krav Maga": 700, "Musculação": 350, "Muay Thai": 800, "Natação (Crawl moderado)": 600, "Natação (Borboleta/Intenso)": 850, "Padel": 550, "Patinação": 500, "Pilates": 300, "Pular Corda (Rápido)": 950, "Remo": 600, "Rugby": 800, "Skate": 400, "Spinning": 700, "Squash": 900, "Surf": 350, "Tênis": 500, "Tênis de Mesa": 300, "Treino Funcional": 550, "Triatlo": 900, "Vôlei de Praia": 600, "Vôlei de Quadra": 400, "Yoga": 250, "Zumba": 550 };

// --- PROPS & STATE ---
interface PhysicalAssessmentFormProps {
    initialData?: any
    onSave?: (data: any) => void
    onDataChange?: (data: any) => void // [NEW] Support for embedding
    readOnly?: boolean
    patientId: string
    hideHeader?: boolean
    hideButtons?: boolean
}

export function AdvancedPhysicalForm({ initialData, onSave, onDataChange, readOnly = false, patientId, hideHeader = false, hideButtons = false }: PhysicalAssessmentFormProps) {
    // 1. Antropometria (Pineau Protocol)
    const [antro, setAntro] = useState(initialData?.antro || {
        gender: 'male', // 'male' | 'female'
        age: '', // Anos
        weight: '', // kg
        height: '', // cm
        thigh: '', // mm (Coxa)
        suprailiac: '', // mm (Suprailíaca)
        abdominal: '', // mm (Abdominal)
    })

    // 2. Cardio (VO2)
    const [cardio, setCardio] = useState(initialData?.cardio || {
        method: 'rockport', // 'rockport' | 'cooper'
        timeMin: '', // Rockport: Minutos para caminhar 1 milha
        heartRate: '', // Rockport: FC Final
        distance: '', // Cooper: Metros em 12min
    })

    // 3. Força (Dynamic State)
    // We store all dynamic keys in a flat object or nested? Flat is easier for Inputs.
    // keys: "testId_inputId" e.g. "kneeExtension_right"
    const [strength, setStrength] = useState<Record<string, string>>(initialData?.strength || {})

    // 4. Mobilidade e Flexibilidade
    const [mobility, setMobility] = useState(initialData?.mobility || {
        wells: '', // cms
        legRaiseRight: '', // graus
        legRaiseLeft: '', // graus
        shoulderReachRight: '', // cm (Direito por cima)
        shoulderReachLeft: '', // cm (Esquerdo por cima)
    })

    // 5. Perimetria (Medidas)

    const [perimetry, setPerimetry] = useState(initialData?.perimetry || {
        armRelaxedRight: '',
        armContractedRight: '',
        chest: '',
        waist: '',
        hip: '',
        thighRight: '',
        calfRight: '',
        neck: '', // Perímetro do Pescoço
    })

    // 6. Anamnese & Vitals
    const [anamnesis, setAnamnesis] = useState(initialData?.anamnesis || {
        mainComplaint: '',
        history: '',
        trainingLevel: 'intermediate', // beginner, intermediate, advanced
        goal: 'hypertrophy', // hypertrophy, weight_loss, rehab, performance
    })

    const [vitals, setVitals] = useState(initialData?.vitals || {
        restingHeartRate: '',
        bloodPressureSys: '',
        bloodPressureDia: '',
    })

    // 7. Postural Assessment
    const [posture, setPosture] = useState(initialData?.posture || {
        observations: [] as string[], // Checklist items selected
        // Photos are usually URLs after upload. For now, we simulate file selection or hold local preview URLs.
        photos: {
            anterior: null,
            posterior: null,
            left: null,
            right: null
        }
    })

    // 8. Stability (New)
    const [stability, setStability] = useState(initialData?.stability || {
        isManual: false,
        left: '', // 0-10
        right: '' // 0-10
    })

    // 9. Sports Routine (IPAQ Logic)
    const [sports, setSports] = useState(initialData?.sports || [
        { type: "", freq: "", duration: "" }
    ])

    // 10. Functional & Questionnaires (New)
    const [functional, setFunctional] = useState(initialData?.functional || {
        efep: [{ activity: "", score: "" }],
        questionnaires: [],
        plan: { followUpDays: [], monitorPain: true, extraQuestionnaire: "none" }
    })

    // 8. AI Report State
    const [report, setReport] = useState<any>(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [isReportOpen, setIsReportOpen] = useState(false)
    const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false)

    // Auto-save effect
    // Auto-save effect
    const [debouncedData] = useDebounce({
        antro,
        cardio,
        strength,
        mobility,
        perimetry,
        anamnesis,
        vitals, // Ensure vitals is defined? Yes, line 137 in previous view.
        posture,
        stability,
        sports,
        functional,
        report
    }, 2000)

    useEffect(() => {
        if (!readOnly && debouncedData) {
            if (onSave) onSave(debouncedData)
            if (onDataChange) onDataChange(debouncedData)
        }
    }, [debouncedData, onSave, onDataChange, readOnly])

    // --- CALCULATIONS (Reative logic via useMemo) ---

    // 1. Antropometria Logic (Pineau et al)
    const antroResult = useMemo(() => {
        const weight = Number(antro.weight) || 0
        const height = Number(antro.height) || 0
        const thigh = Number(antro.thigh) || 0
        const supra = Number(antro.suprailiac) || 0
        const abdo = Number(antro.abdominal) || 0

        if (!weight || !height || !thigh || !supra || !abdo) return null

        // Sum of folds
        const sum = thigh + supra + abdo
        let density = 0

        // Pineau Density Formula
        if (antro.gender === 'male') {
            density = 1.18568 - (0.09062 * Math.log10(sum))
        } else {
            density = 1.13702 - (0.05742 * Math.log10(sum))
        }

        // Siri Formula for Body Fat %
        const fatPercent = (495 / density) - 450

        // Simple Classification
        let classification = 'Normal'
        if (antro.gender === 'male') {
            if (fatPercent < 6) classification = 'Essencial'
            else if (fatPercent < 14) classification = 'Atleta'
            else if (fatPercent < 18) classification = 'Fitness'
            else if (fatPercent < 25) classification = 'Aceitável'
            else classification = 'Obeso'
        } else {
            if (fatPercent < 14) classification = 'Essencial'
            else if (fatPercent < 21) classification = 'Atleta'
            else if (fatPercent < 25) classification = 'Fitness'
            else if (fatPercent < 32) classification = 'Aceitável'
            else classification = 'Obeso'
        }

        // Calculate Lean Body Mass and FFMI
        const fatMass = weight * (fatPercent / 100)
        const leanMass = weight - fatMass
        const heightM = height / 100
        const ffmi = leanMass / (heightM * heightM) // Fat-Free Mass Index

        return { fatPercent: Math.max(0, fatPercent), classification, leanMass, ffmi }
    }, [antro])

    // 2. Corrected Perimeters (Hypertrophy Tracking)
    const correctedPerimeters = useMemo(() => {
        const armContracted = Number(perimetry.armContractedRight) || 0
        const armRelaxed = Number(perimetry.armRelaxedRight) || 0
        const thighPerim = Number(perimetry.thighRight) || 0
        const calfPerim = Number(perimetry.calfRight) || 0

        // Get fat thickness from ultrasound (we don't have arm US, so we'll use abdominal as proxy)
        // In a real scenario, you'd have specific US measurements for each body part
        const abdominalFat = Number(antro.abdominal) || 0
        const thighFat = Number(antro.thigh) || 0

        // Corrected Perimeter = Measured Perimeter - (π * fat_thickness_mm / 10)
        // Divide by 10 to convert mm to cm
        const armContractedCorrected = armContracted > 0 ? armContracted - (Math.PI * abdominalFat / 10) : 0
        const armRelaxedCorrected = armRelaxed > 0 ? armRelaxed - (Math.PI * abdominalFat / 10) : 0
        const thighCorrected = thighPerim > 0 ? thighPerim - (Math.PI * thighFat / 10) : 0
        const calfCorrected = calfPerim > 0 ? calfPerim - (Math.PI * thighFat / 10) : 0

        return {
            armContracted: armContractedCorrected,
            armRelaxed: armRelaxedCorrected,
            thigh: thighCorrected,
            calf: calfCorrected
        }
    }, [perimetry, antro])

    // 3. Health Risk Assessment (Real-time)
    const healthRisks = useMemo(() => {
        const waist = Number(perimetry.waist) || 0
        const hip = Number(perimetry.hip) || 0
        const height = Number(antro.height) || 0
        const weight = Number(antro.weight) || 0
        const neck = Number(perimetry.neck) || 0
        const gender = antro.gender

        if (!waist || !height) return null

        // WHR - Waist-to-Hip Ratio (Relação Cintura-Quadril)
        const whr = hip > 0 ? waist / hip : 0
        let whrRisk = 'Baixo'
        let whrColor = 'green'

        if (gender === 'male') {
            if (whr >= 1.0) { whrRisk = 'Muito Alto'; whrColor = 'red' }
            else if (whr >= 0.95) { whrRisk = 'Alto'; whrColor = 'orange' }
            else if (whr >= 0.90) { whrRisk = 'Moderado'; whrColor = 'yellow' }
        } else {
            if (whr >= 0.85) { whrRisk = 'Muito Alto'; whrColor = 'red' }
            else if (whr >= 0.80) { whrRisk = 'Alto'; whrColor = 'orange' }
            else if (whr >= 0.75) { whrRisk = 'Moderado'; whrColor = 'yellow' }
        }

        // WHtR - Waist-to-Height Ratio (Razão Cintura-Estatura)
        const whtr = waist / height
        const whtrRisk = whtr > 0.50

        // Conicity Index (Índice de Conicidade - Valdez)
        const conicityIndex = weight > 0 && height > 0 ?
            (waist / 100) / (0.109 * Math.sqrt(weight / (height / 100))) : 0

        // Neck Circumference Risk
        const neckRisk = neck > 0 && (
            (gender === 'male' && neck > 37.9) ||
            (gender === 'female' && neck > 34.7)
        )

        return {
            whr: whr > 0 ? whr : null,
            whrRisk,
            whrColor,
            whtr: whtr > 0 ? whtr : null,
            whtrRisk,
            conicityIndex: conicityIndex > 0 ? conicityIndex : null,
            neck,
            neckRisk,
            neckLimit: gender === 'male' ? 37.9 : 34.7
        }
    }, [perimetry, antro])

    // 4. Sports Calorie Calculation (IPAQ Logic)
    const calData = useMemo(() => {
        const weight = Number(antro.weight) || 70
        let totalWeekly = 0
        let totalMinutes = 0

        sports.forEach((s: any) => {
            const met = KCAL_TABLE[s?.type] || 300
            const freq = Number(s?.freq) || 0
            const duration = Number(s?.duration) || 0
            const weeklyMinutes = freq * duration
            const kcalPerHour = (met / 70) * weight
            const kcalWeekly = (kcalPerHour / 60) * weeklyMinutes
            totalWeekly += kcalWeekly
            totalMinutes += weeklyMinutes
        })

        let level = 'Sedentário'
        let color = 'bg-red-500'
        if (totalMinutes >= 300) {
            level = 'Muito Ativo'
            color = 'bg-green-600'
        } else if (totalMinutes >= 150) {
            level = 'Ativo'
            color = 'bg-green-500'
        } else if (totalMinutes >= 75) {
            level = 'Moderado'
            color = 'bg-yellow-500'
        } else if (totalMinutes > 0) {
            level = 'Insuficiente'
            color = 'bg-orange-500'
        }

        return {
            weekly: Math.round(totalWeekly),
            minutes: totalMinutes,
            level,
            color
        }
    }, [sports, antro.weight])

    // 5. Cardio Logic (VO2 Max)
    const cardioResult = useMemo(() => {
        const age = Number(antro.age) || 30
        const weight = Number(antro.weight) || 70
        const genderVal = antro.gender === 'male' ? 1 : 0

        if (cardio.method === 'rockport') {
            const time = Number(cardio.timeMin) || 0
            const hr = Number(cardio.heartRate) || 0
            if (!time || !hr || !weight) return null

            const weightLb = weight * 2.20462
            const vo2 = 132.853 - (0.0769 * weightLb) - (0.3877 * age) + (6.315 * genderVal) - (3.2649 * time) - (0.1565 * hr)

            return { vo2: Math.max(0, vo2), type: 'Walk (Rockport)' }
        } else {
            const dist = Number(cardio.distance) || 0
            if (!dist) return null
            const vo2 = (dist - 504.9) / 44.73
            return { vo2: Math.max(0, vo2), type: 'Run (Cooper)' }
        }
    }, [antro.age, antro.weight, antro.gender, cardio])

    // 3. Strength Logic (Dynamic)
    const strengthResult = useMemo(() => {
        const weight = Number(antro.weight)
        if (!weight) return null

        // Calculate results for each test
        const testResults = STRENGTH_TESTS.map(test => {
            const gender = antro.gender as 'male' | 'female'
            const age = Number(antro.age) || 30 // Default age if missing

            // Get Reference based on Age
            let ref: { mean: number, std_dev: number } | undefined = undefined

            const ageRefs = FORCE_REFERENCES_BY_AGE[test.id as keyof typeof FORCE_REFERENCES_BY_AGE]
            if (ageRefs && ageRefs.ranges) {
                // Find range that includes age
                const range = ageRefs.ranges.find(r => age >= r.min && age <= r.max)
                // If found, use it. If not, fallback to nearest (e.g. max range if older, min if younger)
                if (range) {
                    ref = range.vals[gender]
                } else {
                    // Fallback logic
                    if (age < 20) ref = ageRefs.ranges[0].vals[gender] // Youngest
                    else ref = ageRefs.ranges[ageRefs.ranges.length - 1].vals[gender] // Oldest
                }
            }

            const hasRight = !!strength[`${test.id}_right`]
            const hasLeft = !!strength[`${test.id}_left`]
            const hasAny = hasRight || hasLeft
            const hasBoth = hasRight && hasLeft

            const rightVal = Number(strength[`${test.id}_right`]) || 0
            const leftVal = Number(strength[`${test.id}_left`]) || 0

            if (!hasAny) {
                return {
                    id: test.id,
                    label: test.label,
                    status: 'empty',
                    isPrimary: (test as any).isPrimary
                }
            }

            if (!hasBoth) {
                return {
                    id: test.id,
                    label: test.label,
                    status: 'incomplete', // One side missing
                    isPrimary: (test as any).isPrimary
                }
            }

            const maxVal = Math.max(rightVal, leftVal)
            const minVal = Math.min(rightVal, leftVal)

            // Symmetry (if both exist)
            let symmetryIndex = 0
            if (rightVal > 0 && leftVal > 0) {
                symmetryIndex = 100 - ((minVal / maxVal) * 100)
            }

            const avgVal = (rightVal + leftVal) / 2
            const classification = getForceClassification(avgVal, weight, ref)

            return {
                id: test.id,
                label: test.label,
                avgVal,
                symmetryIndex,
                isAsymmetric: symmetryIndex > 15,
                classification,
                status: 'complete',
                isPrimary: (test as any).isPrimary
            }
        })

        // Global Aggregations - Filter only COMPLETE tests
        const completeTests = testResults.filter(r => r.status === 'complete' && r.classification)
        const relativeForces = completeTests.map(r => r.classification!.relForce)

        // Use average of completed tests, or 0 if none
        const avgGlobalRelativeForce = relativeForces.length ? relativeForces.reduce((a, b) => a + b, 0) / relativeForces.length : 0

        // Find "Primary" test for main card, or fallback to first COMPLETE test, or undefined
        const primaryResult = testResults.find(r => r.isPrimary && r.status === 'complete') || completeTests[0]

        return {
            testResults,
            relativeForce: avgGlobalRelativeForce,
            classRel: primaryResult?.classification?.label || (completeTests.length ? 'Geral' : 'Incompleto'),
            isAsymmetric: completeTests.some(r => r.isAsymmetric),
            symmetryIndex: completeTests.length ? Math.max(...completeTests.map(r => r.symmetryIndex!)) : 0,
            hasActiveTests: completeTests.length > 0
        }
    }, [strength, antro.weight, antro.gender])

    // --- DASHBOARD DATA PREPARATION ---
    const chartData = useMemo(() => {
        let cVal = 0
        if (cardioResult?.vo2) {
            cVal = Math.min(100, Math.max(0, (cardioResult.vo2 - 20) * 2.5))
        }

        let bVal = 0
        if (antroResult?.fatPercent) {
            bVal = Math.min(100, Math.max(0, (30 - antroResult.fatPercent) * 5))
        }

        let fRelVal = 0
        if (strengthResult?.relativeForce) {
            fRelVal = Math.min(100, Math.max(0, (strengthResult.relativeForce - 0.3) * 250))
        }

        let symVal = 0
        if (strengthResult) {
            symVal = Math.min(100, Math.max(0, 100 - (strengthResult.symmetryIndex * 5)))
        }

        // New Metrics
        let flexVal = 0
        const wells = parseFloat(mobility.wells)
        if (!isNaN(wells)) {
            // Assume 40cm is "Perfect" (100%), 0cm is 0%
            flexVal = Math.min(100, Math.max(0, (wells / 40) * 100))
        }

        let vitalsVal = 0
        const hr = parseFloat(vitals.restingHeartRate)
        if (!isNaN(hr) && hr > 0) {
            // Lower is better. 50bpm -> 100%, 100bpm -> 0%
            // Score = 100 - (HR - 50) * 2 ?
            // HR 60 -> 100 - (10)*2 = 80
            // HR 80 -> 100 - (30)*2 = 40
            vitalsVal = Math.min(100, Math.max(0, 100 - ((hr - 50) * 2)))
        }

        let stabVal = 0
        if (stability.isManual) {
            const l = parseFloat(stability.left) || 0
            const r = parseFloat(stability.right) || 0
            const avg = (l + r) / 2
            stabVal = avg * 10 // 0-10 -> 0-100%
        }

        return [
            { subject: 'Cardio (VO2)', A: cVal, fullMark: 100 },
            { subject: 'Comp. Corporal', A: bVal, fullMark: 100 },
            { subject: 'Força Relativa', A: fRelVal, fullMark: 100 },
            { subject: 'Simetria', A: symVal, fullMark: 100 },
            { subject: 'Flexibilidade', A: flexVal, fullMark: 100 },
            { subject: 'Vitalidade (FC)', A: vitalsVal, fullMark: 100 },
            { subject: 'Estabilidade', A: stabVal, fullMark: 100 },
        ]
    }, [cardioResult, antroResult, strengthResult, mobility.wells, vitals.restingHeartRate, stability])

    // --- HANDLERS ---
    const handleAntroChange = (f: string, v: string) => setAntro((prev: any) => ({ ...prev, [f]: v }))
    const handleCardioChange = (f: string, v: string) => setCardio((prev: any) => ({ ...prev, [f]: v }))
    const handleStrengthChange = (key: string, v: string) => setStrength(prev => ({ ...prev, [key]: v }))
    const handleMobilityChange = (f: string, v: string) => setMobility((prev: any) => ({ ...prev, [f]: v }))
    const handlePerimetryChange = (f: string, v: string) => setPerimetry((prev: any) => ({ ...prev, [f]: v }))

    // New Handlers
    const handleAnamnesisChange = (f: string, v: string) => setAnamnesis((prev: any) => ({ ...prev, [f]: v }))
    const handleVitalsChange = (f: string, v: string) => setVitals((prev: any) => ({ ...prev, [f]: v }))
    const handlePostureChange = (f: string, v: any) => setPosture((prev: any) => ({ ...prev, [f]: v }))
    const handleStabilityChange = (f: string, v: any) => setStability((prev: any) => ({ ...prev, [f]: v }))

    const handleSportsChange = (index: number, field: string, value: string) => {
        setSports((prev: any[]) => {
            const updated = [...prev]
            updated[index] = { ...updated[index], [field]: value }
            return updated
        })
    }
    const addSport = () => setSports((prev: any[]) => [...prev, { type: "", freq: "", duration: "" }])
    const removeSport = (index: number) => setSports((prev: any[]) => prev.filter((_, i) => i !== index))


    const handlePhotoUpload = (view: 'anterior' | 'posterior' | 'left' | 'right', file: File | null) => {
        if (file) {
            const url = URL.createObjectURL(file)
            setPosture((prev: any) => ({
                ...prev,
                photos: { ...prev.photos, [view]: url }
            }))
        }
    }

    const handleGenerateReport = async () => {
        setIsGenerating(true)
        setIsReportOpen(true)

        try {
            // Collect all data including computed results if possible, or just raw input
            // Ideally we pass everything needed
            const payload = {
                antro, antroResult,
                cardio, cardioResult,
                strength, strengthResult,
                mobility,
                perimetry,
                anamnesis,
                vitals,
                posture
            }

            const response = await generateAssessmentReport(payload)

            if (response.success && response.report) {
                setReport(response.report)
            } else {
                setReport('Ocorreu um erro ao gerar o relatório. Verifique a configuração da API Key.')
            }
        } catch (error) {
            console.error(error)
            setReport('Erro ao conectar com o serviço de IA.')
        } finally {
            setIsGenerating(false)
        }
    }

    const handlePrint = () => {
        // Use the hidden full report container
        const content = document.getElementById('full-printable-report')
        if (!content) return

        const printWindow = window.open('', '_blank', 'width=1200,height=800')
        if (!printWindow) return

        const clonedContent = content.cloneNode(true) as HTMLElement
        // CRITICAL: Remove hidden/fixed classes to make it visible in the new window
        clonedContent.classList.remove('fixed', 'top-0', 'left-[-9999px]', 'z-[-50]', 'pointer-events-none', 'opacity-0', 'overflow-hidden')
        clonedContent.classList.add('block', 'visible', 'relative', 'w-full', 'h-auto')

        // Basic HTML structure
        printWindow.document.write(`
            <html>
                <head>
                    <title>Relatório - ${report?.header?.patient_name || 'Paciente'}</title>
                    <style>
                        body { background: white; padding: 40px; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
                        /* Utility classes simulation */
                        .text-primary { color: #0f172a; }
                        .text-muted-foreground { color: #64748b; }
                        .font-bold { font-weight: 700; }
                        .no-print { display: none !important; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
                        .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
                    </style>
                </head>
                <body>
                    ${clonedContent.outerHTML}
                    <script>
                        // Remove no-print elements inside the cloned content
                        document.querySelectorAll('.no-print').forEach(el => el.remove());
                    </script>
                </body>
            </html>
        `)

        // Attempt to copy styles from parent (Tailwind)
        // Note: External stylesheets might take time to load or be blocked by CORS if not local.
        // We iterate and try to copy.
        const styles = document.querySelectorAll('style, link[rel="stylesheet"]')
        styles.forEach(style => {
            printWindow.document.head.appendChild(style.cloneNode(true))
        })

        printWindow.document.close()
        printWindow.focus()

        // Wait a bit for styles to apply
        setTimeout(() => {
            printWindow.print()
            printWindow.close()
        }, 500)
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-20">
            {!hideHeader && (
                <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            <Activity className="h-8 w-8 text-primary" />
                            Avaliação Física Avançada
                        </h2>
                        <p className="text-muted-foreground">Protocolos: Pineau (US), Rockport/Cooper (VO2), Lafayette (Força)</p>
                    </div>
                    {!hideButtons && (
                        <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={handleGenerateReport} variant="outline" className="gap-2 border-primary/20 hover:bg-primary/5">
                                    <Sparkles className="h-4 w-4 text-primary" />
                                    Gerar Relatório IA
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <Bot className="h-5 w-5 text-primary" />
                                        Relatório Inteligente (Antigravity AI)
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="mt-4 space-y-4">
                                    {isGenerating ? (
                                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                            <p className="text-muted-foreground animate-pulse">Analisando dados biomecânicos...</p>
                                        </div>
                                    ) : report && typeof report === 'object' ? (
                                        <div className="space-y-6" id="printable-report">
                                            <div className="flex justify-between items-start no-print">
                                                <div className="flex gap-2">
                                                    <Badge variant="outline">{report.header?.patient_name || 'Paciente'}</Badge>
                                                    <Badge variant="secondary">{report.header?.goal || 'Objetivo'}</Badge>
                                                </div>
                                                <Button size="sm" variant="outline" onClick={handlePrint} className="gap-2">
                                                    <Printer className="h-4 w-4" /> Imprimir
                                                </Button>
                                            </div>

                                            {/* HIDDEN FULL REPORT FOR PRINTING */}
                                            <div id="full-printable-report" className="fixed top-0 left-[-9999px] w-[800px] h-auto bg-white p-10 z-[-50] pointer-events-none opacity-0 overflow-hidden">
                                                {/* HEADER */}
                                                <div className="border-b pb-6 mb-6 text-center">
                                                    <h3 className="text-3xl font-bold text-black">{report.header?.title}</h3>
                                                    <p className="text-gray-600 text-lg">{report.header?.subtitle}</p>
                                                </div>

                                                {/* SECTION 1: SUMMARY */}
                                                <div className="mb-8">
                                                    <h4 className="text-xl font-bold mb-4 border-b border-gray-200 pb-2 text-primary">1. Resumo Clínico</h4>

                                                    <div className="mb-6 p-4 border rounded bg-gray-50">
                                                        <h5 className="font-bold text-lg mb-2">Status Geral: {report.semaphor_health?.status}</h5>
                                                        <p className="mb-2">{report.semaphor_health?.message}</p>
                                                        <p className="text-sm italic bg-white p-2 rounded border">Foco Clínico: {report.semaphor_health?.clinical_focus}</p>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                                        <div className="border p-4 rounded">
                                                            <h5 className="font-bold text-green-700 mb-2">Pontos Fortes</h5>
                                                            <ul className="list-disc list-inside text-sm">
                                                                {report.patient_text?.key_wins?.map((p: string, i: number) => <li key={i}>{p}</li>)}
                                                            </ul>
                                                        </div>
                                                        <div className="border p-4 rounded">
                                                            <h5 className="font-bold text-orange-700 mb-2">Onde Melhorar</h5>
                                                            <ul className="list-disc list-inside text-sm">
                                                                {report.patient_text?.key_improvements?.map((p: string, i: number) => <li key={i}>{p}</li>)}
                                                            </ul>
                                                        </div>
                                                    </div>

                                                    <div className="italic text-gray-600 border-l-4 border-primary pl-4 py-2">
                                                        "{report.patient_text?.summary}"
                                                    </div>
                                                </div>

                                                {/* PAGE BREAK (Force CSS) */}
                                                <div style={{ pageBreakBefore: 'always' }}></div>

                                                {/* SECTION 2: TECHNICAL */}
                                                <div className="mb-8">
                                                    <h4 className="text-xl font-bold mb-4 border-b border-gray-200 pb-2 text-primary">2. Análise Técnica & Prescrição</h4>

                                                    <div className="mb-6">
                                                        <h5 className="font-bold mb-2">Orientação ao Treinador</h5>
                                                        <p className="text-sm text-gray-700 mb-4">{report.trainer_text?.guidance}</p>
                                                        <div className="p-3 bg-gray-100 rounded text-sm mb-4">
                                                            <strong>Periodização Sugerida:</strong> {report.trainer_text?.periodization_suggestion}
                                                        </div>
                                                        <div className="flex gap-2 flex-wrap mb-6">
                                                            {report.trainer_text?.attention_points?.map((pt: string, i: number) => (
                                                                <span key={i} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded font-bold">{pt}</span>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="mb-6">
                                                        <h5 className="font-bold mb-2">Alertas Biomecânicos</h5>
                                                        {report.biomechanics?.alerts?.map((alert: any, idx: number) => (
                                                            <div key={idx} className="mb-2 p-2 border-l-4 border-red-500 bg-red-50">
                                                                <span className="font-bold text-red-700">{alert.issue} ({alert.severity})</span>
                                                                <p className="text-xs text-gray-600">{alert.explanation}</p>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="mb-6">
                                                        <h5 className="font-bold mb-2">Guia de Exercícios</h5>
                                                        <table className="w-full text-sm border">
                                                            <thead className="bg-gray-100 text-left">
                                                                <tr>
                                                                    <th className="p-2 border">Ação</th>
                                                                    <th className="p-2 border">Exercícios</th>
                                                                    <th className="p-2 border">Justificativa</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {report.workout_guide?.map((guide: any, idx: number) => (
                                                                    <tr key={idx} className="border-b">
                                                                        <td className="p-2 border font-bold">{guide.action}</td>
                                                                        <td className="p-2 border">
                                                                            <ul className="list-disc list-inside">
                                                                                {guide.exercises?.map((ex: string, i: number) => <li key={i}>{ex}</li>)}
                                                                            </ul>
                                                                        </td>
                                                                        <td className="p-2 border text-gray-600 italic">{guide.reason}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>

                                                {/* SECTION 3: VISUALS (Fixed Size Chart) */}
                                                <div>
                                                    <h4 className="text-xl font-bold mb-4 border-b border-gray-200 pb-2 text-primary">3. Gráficos de Performance</h4>

                                                    <div className="flex justify-center mb-6">
                                                        {/* FIXED SIZE CHART FOR PRINT - No ResponsiveContainer */}
                                                        <div style={{ width: '500px', height: '400px', margin: '0 auto' }}>
                                                            <RadarChart cx={250} cy={200} outerRadius={140} width={500} height={400} data={chartData}>
                                                                <PolarGrid />
                                                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#333', fontSize: 12 }} />
                                                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                                                <Radar name="Paciente" dataKey="A" stroke="#84c8b9" fill="#84c8b9" fillOpacity={0.6} />
                                                            </RadarChart>
                                                        </div>
                                                    </div>

                                                    <div className="mb-6">
                                                        <div className="p-4 bg-gray-50 rounded border">
                                                            <h5 className="font-bold mb-2">Análise do Gráfico</h5>
                                                            <p className="text-sm mb-2">{report.radar_analysis?.summary}</p>
                                                            <p className="text-sm"><strong>Ponto Forte:</strong> {report.radar_analysis?.strongest_point}</p>
                                                            <p className="text-sm"><strong>Ponto Fraco:</strong> {report.radar_analysis?.weakest_point}</p>
                                                        </div>
                                                    </div>

                                                    {/* PHOTOS GRID */}
                                                    {Object.values(posture.photos).some(p => !!p) && (
                                                        <div className="border-t pt-4 mt-8" style={{ pageBreakBefore: 'auto' }}>
                                                            <h4 className="font-bold mb-4">Registros Fotográficos</h4>
                                                            <div className="grid grid-cols-4 gap-2">
                                                                {posture.photos.anterior && <img src={posture.photos.anterior} className="aspect-[3/4] object-cover border w-full" />}
                                                                {posture.photos.posterior && <img src={posture.photos.posterior} className="aspect-[3/4] object-cover border w-full" />}
                                                                {posture.photos.left && <img src={posture.photos.left} className="aspect-[3/4] object-cover border w-full" />}
                                                                {posture.photos.right && <img src={posture.photos.right} className="aspect-[3/4] object-cover border w-full" />}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* WEB VIEW HEADER */}
                                            <div className="border-b pb-4 text-center">
                                                <h3 className="text-3xl font-bold text-primary">{report.header?.title}</h3>
                                                <p className="text-muted-foreground text-lg">{report.header?.subtitle}</p>
                                            </div>


                                            <Tabs defaultValue="summary" className="w-full">
                                                <TabsList className="grid w-full grid-cols-3 no-print">
                                                    <TabsTrigger value="summary">Resumo (Paciente)</TabsTrigger>
                                                    <TabsTrigger value="technical">Técnico (Personal)</TabsTrigger>
                                                    <TabsTrigger value="visuals">Gráficos & Fotos</TabsTrigger>
                                                </TabsList>

                                                {/* TAB 1: SUMMARY (PATIENT) */}
                                                <TabsContent value="summary" className="space-y-6 mt-4">
                                                    {/* SEMAPHORE */}
                                                    <div className={`p-6 rounded-lg border flex items-start gap-4 ${report.semaphor_health?.color_code === 'red' ? 'bg-red-50 border-red-200 dark:bg-red-900/20' :
                                                        report.semaphor_health?.color_code === 'yellow' ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20' :
                                                            'bg-green-50 border-green-200 dark:bg-green-900/20'
                                                        }`}>
                                                        <HeartPulse className={`h-8 w-8 shrink-0 ${report.semaphor_health?.color_code === 'red' ? 'text-red-600' :
                                                            report.semaphor_health?.color_code === 'yellow' ? 'text-yellow-600' :
                                                                'text-green-600'
                                                            }`} />
                                                        <div>
                                                            <h4 className="text-lg font-bold flex items-center gap-2">
                                                                STATUS: {report.semaphor_health?.status}
                                                            </h4>
                                                            <p className="text-base mt-1 mb-2 font-medium opacity-90">{report.semaphor_health?.message}</p>
                                                            <p className="text-sm text-muted-foreground bg-white/60 p-2 rounded">
                                                                🎯 Foco Clínico: {report.semaphor_health?.clinical_focus}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* PATIENT TEXT */}
                                                    <div className="space-y-4">
                                                        <div className="bg-muted/30 p-4 rounded-lg italic border-l-4 border-primary text-muted-foreground text-lg">
                                                            "{report.patient_text?.summary}"
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="border p-4 rounded-lg bg-green-50/30 border-green-100">
                                                                <h4 className="font-semibold mb-2 flex items-center gap-2 text-green-700">
                                                                    <Sparkles className="h-4 w-4" /> Pontos Fortes
                                                                </h4>
                                                                <ul className="list-disc list-inside text-sm space-y-1">
                                                                    {report.patient_text?.key_wins?.map((point: string, i: number) => (
                                                                        <li key={i}>{point}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                            <div className="border p-4 rounded-lg bg-orange-50/30 border-orange-100">
                                                                <h4 className="font-semibold mb-2 flex items-center gap-2 text-orange-700">
                                                                    <Ruler className="h-4 w-4" /> Onde Melhorar
                                                                </h4>
                                                                <ul className="list-disc list-inside text-sm space-y-1">
                                                                    {report.patient_text?.key_improvements?.map((point: string, i: number) => (
                                                                        <li key={i}>{point}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TabsContent>

                                                {/* TAB 2: TECHNICAL (TRAINER) */}
                                                <TabsContent value="technical" className="space-y-6 mt-4">
                                                    {/* TRAINER TEXT */}
                                                    <div className="bg-slate-50 border p-4 rounded-lg">
                                                        <h4 className="font-semibold mb-2 flex items-center gap-2 text-slate-800">
                                                            <Dumbbell className="h-4 w-4" /> Orientação Técnica
                                                        </h4>
                                                        <p className="text-sm text-muted-foreground mb-4">{report.trainer_text?.guidance}</p>

                                                        <div className="bg-white p-3 rounded border text-sm">
                                                            <span className="font-bold text-primary">Sugestão de Periodização:</span> {report.trainer_text?.periodization_suggestion}
                                                        </div>

                                                        <div className="mt-4">
                                                            <h5 className="text-xs font-bold uppercase text-muted-foreground mb-2">Pontos de Atenção</h5>
                                                            <div className="flex flex-wrap gap-2">
                                                                {report.trainer_text?.attention_points?.map((pt: string, i: number) => (
                                                                    <Badge key={i} variant="destructive" className="font-normal">{pt}</Badge>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* BIOMECHANICS ALERTS */}
                                                    <div>
                                                        <h4 className="font-semibold mb-3">Alertas Biomecânicos</h4>
                                                        <div className="grid grid-cols-1 gap-3">
                                                            {report.biomechanics?.alerts?.map((alert: any, idx: number) => (
                                                                <div key={idx} className="border p-3 rounded bg-red-50/20 border-red-100 flex justify-between items-center">
                                                                    <div>
                                                                        <span className="font-bold text-red-600 block">{alert.issue}</span>
                                                                        <span className="text-xs text-muted-foreground">{alert.explanation}</span>
                                                                    </div>
                                                                    <Badge variant={alert.severity === 'high' ? 'destructive' : 'outline'}>
                                                                        {alert.severity}
                                                                    </Badge>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* WORKOUT GUIDE TABLE */}
                                                    <div className="border rounded-lg overflow-hidden">
                                                        <table className="w-full text-sm">
                                                            <thead className="bg-muted text-left">
                                                                <tr>
                                                                    <th className="p-2 font-medium">Ação</th>
                                                                    <th className="p-2 font-medium">Exercícios</th>
                                                                    <th className="p-2 font-medium">Justificativa</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y">
                                                                {report.workout_guide?.map((guide: any, idx: number) => (
                                                                    <tr key={idx} className="bg-card">
                                                                        <td className="p-2">
                                                                            <Badge variant={guide.action === 'PRIORIZAR' ? 'default' : guide.action === 'EVITAR' ? 'destructive' : 'secondary'}>
                                                                                {guide.action}
                                                                            </Badge>
                                                                        </td>
                                                                        <td className="p-2 font-medium">
                                                                            <ul className="list-disc list-inside">
                                                                                {guide.exercises?.map((ex: string, i: number) => (
                                                                                    <li key={i}>{ex}</li>
                                                                                ))}
                                                                            </ul>
                                                                        </td>
                                                                        <td className="p-2 text-muted-foreground text-xs italic">
                                                                            {guide.reason}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </TabsContent>

                                                {/* TAB 3: VISUALS */}
                                                <TabsContent value="visuals" className="space-y-6 mt-4">
                                                    {/* RADAR CHART EMBEDDED */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="border rounded-lg p-4 flex flex-col items-center justify-center bg-card">
                                                            <h4 className="font-semibold mb-4 text-center w-full">Gráfico de Performance</h4>
                                                            <div className="h-[300px] w-full">
                                                                <ResponsiveContainer width="100%" height="100%">
                                                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                                                        <PolarGrid />
                                                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#888888', fontSize: 12 }} />
                                                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                                                        <Radar name="Paciente" dataKey="A" stroke="#84c8b9" fill="#84c8b9" fillOpacity={0.5} />
                                                                        <RechartsTooltip />
                                                                    </RadarChart>
                                                                </ResponsiveContainer>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-4">
                                                            <div className="bg-muted/30 p-4 rounded-lg">
                                                                <h4 className="font-semibold mb-2">Análise do Gráfico</h4>
                                                                <p className="text-sm text-muted-foreground mb-3">{report.radar_analysis?.summary}</p>
                                                                <div className="space-y-2 text-sm">
                                                                    <div className="flex items-start gap-2">
                                                                        <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                                                                        <div>
                                                                            <span className="font-bold">Ponto Forte:</span> {report.radar_analysis?.strongest_point}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-start gap-2">
                                                                        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                                                        <div>
                                                                            <span className="font-bold">Ponto Fraco:</span> {report.radar_analysis?.weakest_point}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* PHOTOS GRID */}
                                                    {Object.values(posture.photos).some(p => !!p) && (
                                                        <div className="border-t pt-4">
                                                            <h4 className="font-semibold mb-4 flex items-center gap-2">
                                                                <Camera className="h-4 w-4" /> Registros Fotográficos
                                                            </h4>
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                                {posture.photos.anterior && (
                                                                    <div className="space-y-1">
                                                                        <p className="text-xs text-center font-medium">Anterior</p>
                                                                        <img src={posture.photos.anterior} className="aspect-[3/4] object-cover rounded border bg-muted" alt="Anterior" />
                                                                    </div>
                                                                )}
                                                                {posture.photos.posterior && (
                                                                    <div className="space-y-1">
                                                                        <p className="text-xs text-center font-medium">Posterior</p>
                                                                        <img src={posture.photos.posterior} className="aspect-[3/4] object-cover rounded border bg-muted" alt="Posterior" />
                                                                    </div>
                                                                )}
                                                                {posture.photos.left && (
                                                                    <div className="space-y-1">
                                                                        <p className="text-xs text-center font-medium">Lateral Esq</p>
                                                                        <img src={posture.photos.left} className="aspect-[3/4] object-cover rounded border bg-muted" alt="Lateral Esq" />
                                                                    </div>
                                                                )}
                                                                {posture.photos.right && (
                                                                    <div className="space-y-1">
                                                                        <p className="text-xs text-center font-medium">Lateral Dir</p>
                                                                        <img src={posture.photos.right} className="aspect-[3/4] object-cover rounded border bg-muted" alt="Lateral Dir" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </TabsContent>
                                            </Tabs>
                                        </div>
                                    ) : (
                                        <div className="p-4 rounded-md border text-red-600 bg-red-50">
                                            {typeof report === 'string' ? report : 'Erro ao exibir relatório.'}
                                        </div>
                                    )}
                                </div>
                            </DialogContent>
                        </Dialog >
                    )}
                </div >
            )}

            {/* TABS WRAPPER */}
            < Tabs defaultValue="assessment" className="w-full" >
                <TabsList className="grid w-full grid-cols-2 mb-6 no-print">
                    <TabsTrigger value="assessment">Nova Avaliação</TabsTrigger>
                    <TabsTrigger value="evolution" className="gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Histórico & Evolução
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="assessment">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* --- LEFT COL (INPUTS) --- */}
                        <div className="lg:col-span-2 space-y-6">
                            <Accordion type="single" collapsible defaultValue="antro" className="w-full">

                                {/* 0. ANAMNESE */}
                                <AccordionItem value="anamnese" className="border rounded-lg px-4 mb-4 shadow-sm bg-card">
                                    <AccordionTrigger className="hover:no-underline py-4">
                                        <div className="flex items-center gap-2">
                                            <Activity className="h-5 w-5 text-indigo-500" />
                                            <span className="text-lg font-semibold">1. Anamnese & Sinais Vitais</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-2 pb-4 space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Queixa Principal</Label>
                                                <Input
                                                    placeholder="Descreva a queixa principal..."
                                                    value={anamnesis.mainComplaint}
                                                    onChange={e => handleAnamnesisChange('mainComplaint', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>História da Moléstia Atual (HMA)</Label>
                                                <Input
                                                    placeholder="Detalhes históricos..."
                                                    value={anamnesis.history}
                                                    onChange={e => handleAnamnesisChange('history', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Nível de Treino</Label>
                                                <Select value={anamnesis.trainingLevel} onValueChange={v => handleAnamnesisChange('trainingLevel', v)}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="beginner">Iniciante</SelectItem>
                                                        <SelectItem value="intermediate">Intermediário</SelectItem>
                                                        <SelectItem value="advanced">Avançado</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Objetivo Principal</Label>
                                                <Select value={anamnesis.goal} onValueChange={v => handleAnamnesisChange('goal', v)}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="hypertrophy">Hipertrofia</SelectItem>
                                                        <SelectItem value="weight_loss">Emagrecimento</SelectItem>
                                                        <SelectItem value="rehab">Reabilitação</SelectItem>
                                                        <SelectItem value="performance">Performance</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="border-t pt-4 mt-2">
                                            <Label className="text-base font-medium mb-3 block text-muted-foreground">Sinais Vitais</Label>
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs">FC Repouso (bpm)</Label>
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        value={vitals.restingHeartRate}
                                                        onChange={e => handleVitalsChange('restingHeartRate', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs">PA Sistólica (mmHg)</Label>
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        value={vitals.bloodPressureSys}
                                                        onChange={e => handleVitalsChange('bloodPressureSys', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs">PA Diastólica (mmHg)</Label>
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        value={vitals.bloodPressureDia}
                                                        onChange={e => handleVitalsChange('bloodPressureDia', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>


                                {/* 1. MÓDULO COMPOSIÇÃO CORPORAL & HIPERTROFIA (UNIFICADO) */}
                                <AccordionItem value="antro" className="border rounded-lg px-4 mb-4 shadow-sm bg-card">
                                    <AccordionTrigger className="hover:no-underline py-4">
                                        <div className="flex items-center gap-2">
                                            <Ruler className="h-5 w-5 text-blue-500" />
                                            <span className="text-lg font-semibold">1. Composição Corporal & Hipertrofia</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-2 pb-4 space-y-6">
                                        {/* Dados Básicos */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Gênero</Label>
                                                <Select value={antro.gender} onValueChange={(v) => handleAntroChange('gender', v)}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="male">Masculino</SelectItem>
                                                        <SelectItem value="female">Feminino</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Idade (anos)</Label>
                                                <Input type="number" placeholder="0" value={antro.age} onChange={e => handleAntroChange('age', e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Peso (kg)</Label>
                                                <Input type="number" placeholder="0.0" value={antro.weight} onChange={e => handleAntroChange('weight', e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Altura (cm)</Label>
                                                <Input type="number" placeholder="0" value={antro.height} onChange={e => handleAntroChange('height', e.target.value)} />
                                            </div>
                                        </div>

                                        {/* Ultrassom (Dobras) */}
                                        <div className="border-t pt-4">
                                            <Label className="text-base font-medium mb-3 block">Ultrassom - Espessura de Gordura (mm)</Label>
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs text-muted-foreground">Coxa</Label>
                                                    <Input type="number" placeholder="0" value={antro.thigh} onChange={e => handleAntroChange('thigh', e.target.value)} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs text-muted-foreground">Suprailíaca</Label>
                                                    <Input type="number" placeholder="0" value={antro.suprailiac} onChange={e => handleAntroChange('suprailiac', e.target.value)} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs text-muted-foreground">Abdomem</Label>
                                                    <Input type="number" placeholder="0" value={antro.abdominal} onChange={e => handleAntroChange('abdominal', e.target.value)} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Perimetria */}
                                        <div className="border-t pt-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <Label className="text-base font-medium">Perimetria (Medidas Corporais - cm)</Label>
                                                <Badge variant="secondary" className="text-xs">Lado Direito</Badge>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs">Braço Relaxado</Label>
                                                    <Input
                                                        type="number"
                                                        placeholder="0.0"
                                                        value={perimetry.armRelaxedRight}
                                                        onChange={e => handlePerimetryChange('armRelaxedRight', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs">Braço Contraído</Label>
                                                    <Input
                                                        type="number"
                                                        placeholder="0.0"
                                                        value={perimetry.armContractedRight}
                                                        onChange={e => handlePerimetryChange('armContractedRight', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs">Tórax</Label>
                                                    <Input
                                                        type="number"
                                                        placeholder="0.0"
                                                        value={perimetry.chest}
                                                        onChange={e => handlePerimetryChange('chest', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs">Cintura</Label>
                                                    <Input
                                                        type="number"
                                                        placeholder="0.0"
                                                        value={perimetry.waist}
                                                        onChange={e => handlePerimetryChange('waist', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs">Quadril</Label>
                                                    <Input
                                                        type="number"
                                                        placeholder="0.0"
                                                        value={perimetry.hip}
                                                        onChange={e => handlePerimetryChange('hip', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs">Coxa Medial</Label>
                                                    <Input
                                                        type="number"
                                                        placeholder="0.0"
                                                        value={perimetry.thighRight}
                                                        onChange={e => handlePerimetryChange('thighRight', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs">Panturrilha</Label>
                                                    <Input
                                                        type="number"
                                                        placeholder="0.0"
                                                        value={perimetry.calfRight}
                                                        onChange={e => handlePerimetryChange('calfRight', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs">Pescoço</Label>
                                                    <Input
                                                        type="number"
                                                        placeholder="0.0"
                                                        value={perimetry.neck}
                                                        onChange={e => handlePerimetryChange('neck', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                {/* 2. MÓDULO CARDIO */}
                                <AccordionItem value="cardio" className="border rounded-lg px-4 mb-4 shadow-sm bg-card">
                                    <AccordionTrigger className="hover:no-underline py-4">
                                        <div className="flex items-center gap-2">
                                            <HeartPulse className="h-5 w-5 text-red-500" />
                                            <span className="text-lg font-semibold">2. Cardio (VO2 Max)</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-2 pb-4 space-y-4">
                                        <div className="space-y-2">
                                            <Label>Protocolo</Label>
                                            <Select value={cardio.method} onValueChange={(v) => handleCardioChange('method', v)}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="rockport">Teste de Rockport (Caminhada 1 milha)</SelectItem>
                                                    <SelectItem value="cooper">Teste de Cooper (Corrida 12min)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {cardio.method === 'rockport' ? (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Tempo (min)</Label>
                                                    <Input type="number" step="0.1" placeholder="Ex: 15.5" value={cardio.timeMin} onChange={e => handleCardioChange('timeMin', e.target.value)} />
                                                    <p className="text-xs text-muted-foreground">Tempo para percorrer 1609m</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>FC Final (bpm)</Label>
                                                    <Input type="number" placeholder="Ex: 120" value={cardio.heartRate} onChange={e => handleCardioChange('heartRate', e.target.value)} />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Label>Distância Percorrida (metros)</Label>
                                                <Input type="number" placeholder="Ex: 2400" value={cardio.distance} onChange={e => handleCardioChange('distance', e.target.value)} />
                                                <p className="text-xs text-muted-foreground">Distância correu ou andou em 12 min</p>
                                            </div>
                                        )}
                                    </AccordionContent>
                                </AccordionItem>

                                {/* 3. MÓDULO FORÇA */}
                                <AccordionItem value="strength" className="border rounded-lg px-4 mb-4 shadow-sm bg-card">
                                    <AccordionTrigger className="hover:no-underline py-4">
                                        <div className="flex items-center gap-2">
                                            <Dumbbell className="h-5 w-5 text-slate-700" />
                                            <span className="text-lg font-semibold">3. Força & Dinamometria</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-2 pb-4">
                                        <Tabs defaultValue="upper" className="w-full">
                                            <TabsList className="grid w-full grid-cols-2 mb-4">
                                                <TabsTrigger value="upper">Membros Superiores</TabsTrigger>
                                                <TabsTrigger value="lower">Membros Inferiores</TabsTrigger>
                                            </TabsList>

                                            <TabsContent value="upper" className="space-y-6">
                                                {STRENGTH_TESTS.filter(t => (t as any).category === 'upper').map(test => {
                                                    const result = strengthResult?.testResults.find(r => r.id === test.id)

                                                    return (
                                                        <div key={test.id} className="w-full border-b last:border-0 pb-6 last:pb-0">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <Label className="text-base font-medium flex items-center gap-2">
                                                                    {test.label}
                                                                    {result?.status === 'incomplete' && (
                                                                        <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                                                                            Simetria Incompleta
                                                                        </Badge>
                                                                    )}
                                                                </Label>
                                                                {result?.status === 'complete' && result.classification && (
                                                                    <Badge variant={
                                                                        result.classification.status === 'weak' ? 'destructive' :
                                                                            result.classification.status === 'strong' ? 'default' : 'secondary'
                                                                    } className={
                                                                        result.classification.status === 'strong' ? 'bg-blue-600 hover:bg-blue-700' :
                                                                            result.classification.status === 'normal' ? 'bg-green-600 hover:bg-green-700 text-white' : ''
                                                                    }>
                                                                        {result.classification.label} (Z: {result.classification.zScore.toFixed(2)})
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                {test.inputs.map(input => (
                                                                    <div key={input.id} className="space-y-2">
                                                                        <Label className="text-xs text-muted-foreground">{input.label} ({test.unit})</Label>
                                                                        <Input
                                                                            type="number"
                                                                            placeholder={test.unit}
                                                                            value={strength[`${test.id}_${input.id}`] || ''}
                                                                            onChange={e => handleStrengthChange(`${test.id}_${input.id}`, e.target.value)}
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </TabsContent>

                                            <TabsContent value="lower" className="space-y-6">
                                                {STRENGTH_TESTS.filter(t => (t as any).category === 'lower').map(test => {
                                                    const result = strengthResult?.testResults.find(r => r.id === test.id)

                                                    return (
                                                        <div key={test.id} className="w-full border-b last:border-0 pb-6 last:pb-0">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <Label className="text-base font-medium flex items-center gap-2">
                                                                    {test.label}
                                                                    {result?.status === 'incomplete' && (
                                                                        <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                                                                            Simetria Incompleta
                                                                        </Badge>
                                                                    )}
                                                                </Label>
                                                                {result?.status === 'complete' && result.classification && (
                                                                    <Badge variant={
                                                                        result.classification.status === 'weak' ? 'destructive' :
                                                                            result.classification.status === 'strong' ? 'default' : 'secondary'
                                                                    } className={
                                                                        result.classification.status === 'strong' ? 'bg-blue-600 hover:bg-blue-700' :
                                                                            result.classification.status === 'normal' ? 'bg-green-600 hover:bg-green-700 text-white' : ''
                                                                    }>
                                                                        {result.classification.label} (Z: {result.classification.zScore.toFixed(2)})
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                {test.inputs.map(input => (
                                                                    <div key={input.id} className="space-y-2">
                                                                        <Label className="text-xs text-muted-foreground">{input.label} ({test.unit})</Label>
                                                                        <Input
                                                                            type="number"
                                                                            placeholder={test.unit}
                                                                            value={strength[`${test.id}_${input.id}`] || ''}
                                                                            onChange={e => handleStrengthChange(`${test.id}_${input.id}`, e.target.value)}
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </TabsContent>
                                        </Tabs>
                                    </AccordionContent>
                                </AccordionItem>

                                {/* 4. MÓDULO MOBILIDADE E FLEXIBILIDADE */}
                                <AccordionItem value="mobility" className="border rounded-lg px-4 mb-4 shadow-sm bg-card">
                                    <AccordionTrigger className="hover:no-underline py-4">
                                        <div className="flex items-center gap-2">
                                            <Ruler className="h-5 w-5 text-indigo-600" />
                                            <span className="text-lg font-semibold">4. Mobilidade e Flexibilidade</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-2 pb-4 space-y-8">

                                        {/* 1. Testes de Flexibilidade */}
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b pb-2">Testes de Flexibilidade</h3>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-4 border p-4 rounded-md">
                                                    <Label className="text-base font-medium">Banco de Wells (Sentar e Alcançar)</Label>
                                                    <div className="flex gap-2 items-center">
                                                        <Label className="w-24">Resultado:</Label>
                                                        <Input
                                                            type="number"
                                                            placeholder="cm"
                                                            className="w-24"
                                                            value={mobility.wells}
                                                            onChange={e => handleMobilityChange('wells', e.target.value)}
                                                        />
                                                        <span className="text-sm text-muted-foreground">cm</span>
                                                    </div>
                                                </div>

                                                <div className="space-y-4 border p-4 rounded-md">
                                                    <Label className="text-base font-medium">Elevação Perna Reta (Isquiotibiais)</Label>
                                                    <div className="flex flex-col gap-3">
                                                        <div className="flex gap-2 items-center">
                                                            <Label className="w-24">Direita:</Label>
                                                            <Input
                                                                type="number"
                                                                placeholder="graus"
                                                                className="w-24"
                                                                value={mobility.legRaiseRight}
                                                                onChange={e => handleMobilityChange('legRaiseRight', e.target.value)}
                                                            />
                                                            <span className="text-sm text-muted-foreground"> graus (º)</span>
                                                        </div>
                                                        <div className="flex gap-2 items-center">
                                                            <Label className="w-24">Esquerda:</Label>
                                                            <Input
                                                                type="number"
                                                                placeholder="graus"
                                                                className="w-24"
                                                                value={mobility.legRaiseLeft}
                                                                onChange={e => handleMobilityChange('legRaiseLeft', e.target.value)}
                                                            />
                                                            <span className="text-sm text-muted-foreground"> graus (º)</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-4 border p-4 rounded-md md:col-span-2">
                                                    <Label className="text-base font-medium">Alcance Posterior (Ombros)</Label>
                                                    <p className="text-xs text-muted-foreground mb-2">
                                                        Toque as pontas dos dedos. Toque = 0. Sobreposição = (+). Falta espaço = (-).
                                                    </p>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="flex gap-2 items-center">
                                                            <Label className="w-auto min-w-[140px]">Dir. por Cima:</Label>
                                                            <Input
                                                                type="number"
                                                                placeholder="cm"
                                                                className="w-24"
                                                                value={mobility.shoulderReachRight}
                                                                onChange={e => handleMobilityChange('shoulderReachRight', e.target.value)}
                                                            />
                                                            <span className="text-sm text-muted-foreground">cm</span>
                                                        </div>
                                                        <div className="flex gap-2 items-center">
                                                            <Label className="w-auto min-w-[140px]">Esq. por Cima:</Label>
                                                            <Input
                                                                type="number"
                                                                placeholder="cm"
                                                                className="w-24"
                                                                value={mobility.shoulderReachLeft}
                                                                onChange={e => handleMobilityChange('shoulderReachLeft', e.target.value)}
                                                            />
                                                            <span className="text-sm text-muted-foreground">cm</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                    </AccordionContent>
                                </AccordionItem>

                                {/* 5. AVALIAÇÃO POSTURAL */}
                                <AccordionItem value="posture" className="border rounded-lg px-4 mb-4 shadow-sm bg-card">
                                    <AccordionTrigger className="hover:no-underline py-4">
                                        <div className="flex items-center gap-2">
                                            <Activity className="h-5 w-5 text-purple-500" />
                                            <span className="text-lg font-semibold">5. Avaliação Postural (Fotos)</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-2 pb-4 space-y-4">
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                            {['anterior', 'posterior', 'left', 'right'].map((view) => (
                                                <div key={view} className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-accent/50 transition relative overflow-hidden h-40">
                                                    <Input
                                                        type="file"
                                                        accept="image/*"
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                        onChange={(e) => handlePhotoUpload(view as any, e.target.files?.[0] || null)}
                                                    />
                                                    {posture.photos[view as keyof typeof posture.photos] ? (
                                                        <img
                                                            src={posture.photos[view as keyof typeof posture.photos]!}
                                                            alt={view}
                                                            className="absolute inset-0 w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <>
                                                            <div className="bg-primary/10 p-3 rounded-full">
                                                                <Activity className="h-6 w-6 text-primary" />
                                                            </div>
                                                            <span className="text-sm font-medium capitalize">{view === 'left' ? 'Lateral Esquerda' : view === 'right' ? 'Lateral Direita' : view}</span>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Checklist de Alterações</Label>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                {['Cabeça Anteriorizada', 'Hiperlordose', 'Hipercifose', 'Escoliose', 'Joelho Valgo', 'Joelho Varo', 'Pé Plano', 'Pé Cavo'].map(item => (
                                                    <div key={item} className="flex items-center space-x-2">
                                                        <input
                                                            type="checkbox"
                                                            id={item}
                                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                            checked={posture.observations?.includes(item)}
                                                            onChange={(e) => {
                                                                const newObs = e.target.checked
                                                                    ? [...(posture.observations || []), item]
                                                                    : (posture.observations || []).filter((i: string) => i !== item)
                                                                handlePostureChange('observations', newObs)
                                                            }}
                                                        />
                                                        <Label htmlFor={item} className="font-normal cursor-pointer">{item}</Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                {/* 6. ROTINA DESPORTIVA (IPAQ Logic) */}
                                <AccordionItem value="sports" className="border rounded-lg px-4 mb-4 shadow-sm bg-card">
                                    <AccordionTrigger className="hover:no-underline py-4">
                                        <div className="flex items-center gap-2">
                                            <Zap className="h-5 w-5 text-yellow-500" />
                                            <span className="text-lg font-semibold">6. Rotina Desportiva (IPAQ)</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-2 pb-4 space-y-4">
                                        {sports.map((sport: any, index: number) => (
                                            <div key={index} className="grid grid-cols-12 gap-2 items-end border-b pb-4">
                                                <div className="col-span-5">
                                                    <Label className="text-xs">Modalidade</Label>
                                                    <Input
                                                        list="sports-list"
                                                        value={sport.type}
                                                        onChange={(e) => handleSportsChange(index, 'type', e.target.value)}
                                                        className="h-9"
                                                    />
                                                </div>
                                                <div className="col-span-3">
                                                    <Label className="text-xs">Freq (dias/sem)</Label>
                                                    <Input
                                                        type="number"
                                                        value={sport.freq}
                                                        onChange={(e) => handleSportsChange(index, 'freq', e.target.value)}
                                                        placeholder="Ex: 3"
                                                        className="h-9"
                                                    />
                                                </div>
                                                <div className="col-span-3">
                                                    <Label className="text-xs">Duração (min)</Label>
                                                    <Input
                                                        type="number"
                                                        value={sport.duration}
                                                        onChange={(e) => handleSportsChange(index, 'duration', e.target.value)}
                                                        placeholder="Ex: 60"
                                                        className="h-9"
                                                    />
                                                </div>
                                                <div className="col-span-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeSport(index)}
                                                        className="h-9 w-9 text-red-500 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}

                                        <datalist id="sports-list">
                                            {Object.keys(KCAL_TABLE).map(s => <option key={s} value={s} />)}
                                        </datalist>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={addSport}
                                            className="w-full border-dashed py-5"
                                        >
                                            <Plus className="w-4 h-4 mr-2" /> ADICIONAR MODALIDADE
                                        </Button>
                                    </AccordionContent>
                                </AccordionItem>

                                {/* 7. FUNCIONALIDADE & QUESTIONÁRIOS (NEW) */}
                                <FunctionalAssessmentSection
                                    value={functional}
                                    onChange={setFunctional}
                                    readonly={readOnly}
                                    onOpenAssessment={(type) => {
                                        setFunctional((prev: any) => ({
                                            ...prev,
                                            plan: { ...(prev.plan || {}), extraQuestionnaire: type }
                                        }));
                                        setIsAssessmentModalOpen(true);
                                    }}
                                />
                            </Accordion>
                        </div>

                        {/* --- RIGHT COL (DASHBOARD) --- */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="grid grid-cols-1 gap-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">Composição Corporal</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            <div>
                                                <div className="text-2xl font-bold">
                                                    {antroResult ? `${antroResult.fatPercent.toFixed(1)}%` : '--'}
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {antroResult?.classification || 'Aguardando dados'}
                                                </p>
                                            </div>
                                            {antroResult?.leanMass && (
                                                <div className="border-t pt-2">
                                                    <p className="text-xs text-muted-foreground">Massa Muscular Estimada</p>
                                                    <p className="text-lg font-semibold text-green-600">
                                                        {antroResult.leanMass.toFixed(1)} kg
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* NEW: Hypertrophy Tracking Card */}
                                <Card className="border-blue-200 bg-blue-50/30">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
                                            <Activity className="h-4 w-4" />
                                            Hipertrofia & FFMI
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {antroResult?.ffmi ? (
                                                <>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Fat-Free Mass Index</p>
                                                        <div className="text-2xl font-bold text-blue-600">
                                                            {antroResult.ffmi.toFixed(1)}
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground mt-0.5">
                                                            {antroResult.ffmi < 18 ? 'Abaixo da Média' :
                                                                antroResult.ffmi < 20 ? 'Média' :
                                                                    antroResult.ffmi < 22 ? 'Acima da Média' :
                                                                        antroResult.ffmi < 25 ? 'Atlético' : 'Elite'}
                                                        </p>
                                                    </div>

                                                    {(correctedPerimeters.armContracted > 0 || correctedPerimeters.thigh > 0) && (
                                                        <div className="border-t pt-2 space-y-2">
                                                            <p className="text-xs font-semibold text-muted-foreground">Perímetros Corrigidos</p>
                                                            {correctedPerimeters.armContracted > 0 && (
                                                                <div className="flex justify-between text-xs">
                                                                    <span className="text-muted-foreground">Braço:</span>
                                                                    <span className="font-semibold">{correctedPerimeters.armContracted.toFixed(1)} cm</span>
                                                                </div>
                                                            )}
                                                            {correctedPerimeters.thigh > 0 && (
                                                                <div className="flex justify-between text-xs">
                                                                    <span className="text-muted-foreground">Coxa:</span>
                                                                    <span className="font-semibold">{correctedPerimeters.thigh.toFixed(1)} cm</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <p className="text-xs text-muted-foreground">Preencha US e Perimetria</p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                                {/* NEW: Health Risk Tracker Card */}
                                <Card className="border-red-200 bg-red-50/20">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
                                            <HeartPulse className="h-4 w-4" />
                                            Rastreador de Riscos
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {healthRisks ? (
                                                <>
                                                    {/* WHR - Relação Cintura-Quadril */}
                                                    {healthRisks.whr && (
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-xs text-muted-foreground">RCQ</span>
                                                                <Badge
                                                                    variant={healthRisks.whrColor === 'green' ? 'default' : 'destructive'}
                                                                    className={`text-[10px] ${healthRisks.whrColor === 'green' ? 'bg-green-600' :
                                                                        healthRisks.whrColor === 'yellow' ? 'bg-yellow-500' :
                                                                            healthRisks.whrColor === 'orange' ? 'bg-orange-500' : 'bg-red-600'
                                                                        }`}
                                                                >
                                                                    {healthRisks.whrRisk}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-lg font-bold">{healthRisks.whr.toFixed(2)}</p>
                                                        </div>
                                                    )}

                                                    {/* WHtR - Razão Cintura-Estatura */}
                                                    {healthRisks.whtr && (
                                                        <div className="space-y-1 border-t pt-2">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-xs text-muted-foreground">RCE</span>
                                                                <Badge
                                                                    variant={healthRisks.whtrRisk ? 'destructive' : 'default'}
                                                                    className={`text-[10px] ${healthRisks.whtrRisk ? 'bg-red-600' : 'bg-green-600'}`}
                                                                >
                                                                    {healthRisks.whtrRisk ? 'Risco Elevado' : 'Normal'}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-lg font-bold">{healthRisks.whtr.toFixed(2)}</p>
                                                            {healthRisks.whtrRisk && (
                                                                <p className="text-[9px] text-red-600 font-medium">
                                                                    ⚠️ Risco Cardiometabólico Aumentado
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Conicity Index */}
                                                    {healthRisks.conicityIndex && (
                                                        <div className="space-y-1 border-t pt-2">
                                                            <span className="text-xs text-muted-foreground">Índice de Conicidade</span>
                                                            <p className="text-lg font-bold">{healthRisks.conicityIndex.toFixed(3)}</p>
                                                            <p className="text-[9px] text-muted-foreground">Preditor de gordura visceral</p>
                                                        </div>
                                                    )}

                                                    {/* Neck Circumference Alert */}
                                                    {healthRisks.neck > 0 && (
                                                        <div className="space-y-1 border-t pt-2">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-xs text-muted-foreground">Pescoço</span>
                                                                {healthRisks.neckRisk && (
                                                                    <Badge variant="destructive" className="text-[10px] bg-orange-500">
                                                                        Alerta
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-lg font-bold">{healthRisks.neck.toFixed(1)} cm</p>
                                                            {healthRisks.neckRisk && (
                                                                <p className="text-[9px] text-orange-600 font-medium">
                                                                    ⚠️ Acima de {healthRisks.neckLimit}cm (limite)
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <p className="text-xs text-muted-foreground">Preencha Cintura e Altura</p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* NEW: Sports Routine Card */}
                                <Card className="border-yellow-200 bg-yellow-50/20">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-yellow-700 flex items-center gap-2">
                                            <Zap className="h-4 w-4" />
                                            Rotina Desportiva
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-xs text-muted-foreground">Gasto Semanal</p>
                                                <div className="text-2xl font-bold text-orange-600">
                                                    {calData.weekly} kcal
                                                </div>
                                            </div>
                                            <div className="border-t pt-2 space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-muted-foreground">Tempo/Semana</span>
                                                    <span className="font-semibold text-sm">{calData.minutes} min</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-muted-foreground">Nível</span>
                                                    <Badge className={`text-[10px] ${calData.color}`}>
                                                        {calData.level}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className=" text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <Activity className="h-4 w-4 text-indigo-500" />
                                            Estabilidade (Manual)
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between mb-2">
                                            <Label htmlFor="stab-switch" className="text-xs">Avaliação Manual?</Label>
                                            <Switch
                                                id="stab-switch"
                                                checked={stability.isManual}
                                                onCheckedChange={(c) => handleStabilityChange('isManual', c)}
                                            />
                                        </div>
                                        {stability.isManual ? (
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Esq (0-10)"
                                                    className="h-8 text-xs"
                                                    type="number"
                                                    value={stability.left}
                                                    onChange={e => handleStabilityChange('left', e.target.value)}
                                                />
                                                <Input
                                                    placeholder="Dir (0-10)"
                                                    className="h-8 text-xs"
                                                    type="number"
                                                    value={stability.right}
                                                    onChange={e => handleStabilityChange('right', e.target.value)}
                                                />
                                            </div>
                                        ) : (
                                            <div className="text-2xl font-bold">--</div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">VO2 Máximo</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {cardioResult ? `${cardioResult.vo2.toFixed(1)}` : '--'}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            ml/kg/min ({cardioResult?.type || '-'})
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">Força Relativa (Média)</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {strengthResult ? strengthResult.relativeForce.toFixed(2) : '--'}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {strengthResult?.hasActiveTests ? `${strengthResult.testResults.filter((r: any) => r.status === 'complete').length} testes ativos` : 'Aguardando dados completos'}
                                        </p>
                                    </CardContent>
                                </Card>

                                {strengthResult?.testResults.some((r: any) => r.status === 'incomplete') && (
                                    <Alert className="bg-amber-50 border-amber-200 text-amber-800">
                                        <AlertCircle className="h-4 w-4 text-amber-600" />
                                        <AlertTitle>Dados Incompletos</AlertTitle>
                                        <AlertDescription>
                                            Preencha ambos os lados (Dir/Esq) para calcular a simetria dos testes iniciados.
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {strengthResult?.isAsymmetric && (
                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>Assimetria Detectada</AlertTitle>
                                        <AlertDescription>
                                            Assimetria de {strengthResult.symmetryIndex.toFixed(1)}% detectada (Max).
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>

                            <Card className="overflow-hidden">
                                <CardHeader>
                                    <CardTitle className="text-sm">Performance Global</CardTitle>
                                </CardHeader>
                                <CardContent className="h-[300px] flex items-center justify-center p-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                                            <PolarGrid />
                                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                            <Radar
                                                name="Paciente"
                                                dataKey="A"
                                                stroke="#84c8b9"
                                                fill="#84c8b9"
                                                fillOpacity={0.6}
                                            />
                                            <RechartsTooltip />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="evolution">
                    <EvolutionCharts patientId={patientId} />
                </TabsContent>
            </Tabs >

            {!hideButtons && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t flex justify-end gap-4 max-w-5xl mx-auto z-10">
                    {!readOnly && (
                        <>
                            <Button variant="outline">Limpar</Button>
                            <Button onClick={() => {
                                if (onSave) {
                                    onSave({
                                        antro,
                                        cardio,
                                        strength,
                                        mobility,
                                        perimetry,
                                        anamnesis,
                                        vitals,
                                        posture,
                                        functional,
                                        aiReport: report
                                    })
                                    toast.success("Avaliação salva com sucesso!")
                                }
                            }}>Salvar Avaliação</Button>
                        </>
                    )}
                </div>
            )}
            <RapidAssessmentModal
                isOpen={isAssessmentModalOpen}
                onClose={() => setIsAssessmentModalOpen(false)}
                assessmentType={functional?.plan?.extraQuestionnaire}
                onSave={async (data: any) => {
                    const type = functional?.plan?.extraQuestionnaire;
                    const current = functional?.questionnaires || [];

                    // Calculate score if possible
                    let score = 0;
                    if (data && typeof data === 'object') {
                        score = Object.values(data).reduce((acc: number, v: any) => acc + (Number(v) || 0), 0);
                    }

                    const newEntry = { type, data, score, savedAt: new Date().toISOString() };
                    const updatedQuestionnaires = [...current, newEntry];

                    setFunctional((prev: any) => ({
                        ...prev,
                        questionnaires: updatedQuestionnaires,
                        plan: { ...(prev.plan || {}), extraQuestionnaire: 'none' }
                    }));
                    toast.success("Avaliação funcional adicionada!");
                }}
            />
        </div >
    )
}
