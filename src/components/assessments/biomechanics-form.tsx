"use client"

import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
    Activity, Ruler, Dumbbell, Footprints, Save, FileText, Loader2, ArrowLeft, ArrowRight
} from "lucide-react"

import {
    calculateMinimalismIndex,
    calculateSmartRecommendation,
    getFpiClass,
} from './biomechanics-constants'

import { getRecommendedShoes } from '@/app/dashboard/assessments/shoe-database'

import { PatientDataStep } from './steps/patient-data-step'
import { CustomPoint } from './body-pain-map'

// Lazy loaded heavy components
const BodyPainMap = lazy(() => import('./body-pain-map').then(module => ({ default: module.BodyPainMap })))
const PosturalStep = lazy(() => import('./steps/postural-step').then(module => ({ default: module.PosturalStep })))
const FunctionalStep = lazy(() => import('./steps/functional-step').then(module => ({ default: module.FunctionalStep })))
const ShoeAnalysisStep = lazy(() => import('./steps/shoe-analysis-step').then(module => ({ default: module.ShoeAnalysisStep })))

import { PropulsaoButton } from '@/components/integrations/propulsao-button'

interface BiomechanicsFormProps {
    initialData?: any
    patientId: string
    patientName?: string
    patientEmail?: string
    patientPhone?: string
    onSave: (data: any) => void
    readOnly?: boolean
}

const TABS = ['patient-data', 'pain-map', 'postural', 'functional', 'shoes']

export function BiomechanicsForm({ initialData, patientId, patientName, patientEmail, patientPhone, onSave, readOnly }: BiomechanicsFormProps) {
    const DEFAULT_DATA = {
        qp: '', hma: '', painDuration: '', eva: 0,
        painPoints: {},
        customPainPoints: [] as CustomPoint[],
        history: { hp: '', medication: '', prevTreatment: [], physicalActivity: [], activityFrequency: 'sedentary' },
        patientProfile: { goals: [], experience: 'recreational', injuryStatus: 'none' },
        anthropometry: { legLengthRight: 0, legLengthLeft: 0, navicularRight: 0, navicularLeft: 0, archTypeRight: 'NORMAL', archTypeLeft: 'NORMAL' },
        shoeSize: 0,
        fpi: { right: [0, 0, 0, 0, 0, 0], left: [0, 0, 0, 0, 0, 0] },
        flexibility: {
            jackLeft: 0, jackRight: 0, lungeLeft: 35, lungeRight: 35,
            mobilityRaysLeft: 0, mobilityRaysRight: 0, mobilityRearLeft: 0, mobilityRearRight: 0,
            thomasLeft: 0, thomasRight: 0, hamstringLeft: 90, hamstringRight: 90
        },
        measurements: { retrope: { left: 0, right: 0 }, antepe: { left: 0, right: 0 }, apa: { left: 0, right: 0 } },
        anteversion: { left: 0, right: 0 },
        rotation: { left: 0, right: 0 },
        strength: { gluteMedLeft: 5, gluteMedRight: 5, gluteMaxLeft: 5, gluteMaxRight: 5 },
        singleLegSquat: { pelvicDrop: { left: 0, right: 0 }, dynamicValgus: { left: 0, right: 0 } },
        dfi: { left: { initial: 0, loading: 0, propulsion: 0 }, right: { initial: 0, loading: 0, propulsion: 0 } },
        dfiImages: { initial: { left: '', right: '' }, loading: { left: '', right: '' }, propulsion: { left: '', right: '' } },
        baro2d: '', baro3d: '',
        exams: '', exercises: [], orientations: '',
        currentShoe: { model: '', size: '', selectionId: '', specs: { weight: 250, drop: 8, stack: 20, flexLong: 2, flexTor: 2, stability: 0 }, minScoreData: { flexLong: 2, flexTor: 2, stability: 0 } }
    }

    const [data, setData] = useState(() => {
        if (!initialData) return DEFAULT_DATA

        // Helper to ensure nested objects exist
        const mergeDefaults = (input: any, defaults: any) => {
            if (!input) return defaults
            return {
                ...defaults,
                ...input,
                fpi: { ...defaults.fpi, ...(input.fpi || {}) },
                flexibility: { ...defaults.flexibility, ...(input.flexibility || {}) },
                anthropometry: { ...defaults.anthropometry, ...(input.anthropometry || {}) },
                measurements: { ...defaults.measurements, ...(input.measurements || {}) },
                strength: { ...defaults.strength, ...(input.strength || {}) },
                singleLegSquat: { ...defaults.singleLegSquat, ...(input.singleLegSquat || {}) },
                dfi: {
                    left: { ...defaults.dfi.left, ...(input.dfi?.left || {}) },
                    right: { ...defaults.dfi.right, ...(input.dfi?.right || {}) }
                },
                currentShoe: { ...defaults.currentShoe, ...(input.currentShoe || {}) },
                minScoreData: { ...defaults.currentShoe.minScoreData, ...(input.currentShoe?.minScoreData || {}) } // Flattened in some versions?
            }
        }

        return mergeDefaults(initialData, DEFAULT_DATA)
    })

    // Update state if initialData changes (e.g. async load)
    useEffect(() => {
        if (initialData) {
            setData((prev: any) => {
                // Only update if actually different to avoid loops.
                // For now, simple merge strategy to respect async data loading
                return {
                    ...DEFAULT_DATA,
                    ...initialData,
                    fpi: { ...DEFAULT_DATA.fpi, ...(initialData.fpi || {}) },
                    anthropometry: { ...DEFAULT_DATA.anthropometry, ...(initialData.anthropometry || {}) },
                    currentShoe: { ...DEFAULT_DATA.currentShoe, ...(initialData.currentShoe || {}) }
                    // ... (simplified merge for update)
                }
            })
        }
    }, [initialData])

    const updateField = (path: string, val: any) => {
        if (readOnly) return
        setData((prev: any) => {
            const newData = { ...prev }
            const keys = path.split('.')
            let current = newData
            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i]
                if (!current[key]) current[key] = {}
                current[key] = { ...current[key] }
                current = current[key]
            }
            current[keys[keys.length - 1]] = val
            return newData
        })
    }

    // Calculations
    const minimalismIndex = useMemo(() => calculateMinimalismIndex(data.currentShoe), [data.currentShoe])
    const recommendations = useMemo(() => {
        const leftFpi = data.fpi?.left || []
        const fpiSum = leftFpi.reduce((a: number, b: number) => a + b, 0)
        let footType: 'flat' | 'neutral' | 'cavus' = 'neutral'
        if (fpiSum > 6) footType = 'flat'
        else if (fpiSum < -6) footType = 'cavus'

        return getRecommendedShoes({
            footType,
            weight: 75,
            experienceLevel: data.patientProfile?.experience || 'beginner',
            currentMinimalismIndex: minimalismIndex
        })
    }, [minimalismIndex, data.fpi, data.patientProfile])

    const smartRecommendation = useMemo(() => calculateSmartRecommendation(data.patientProfile || {}, data.painPoints || {}), [data.patientProfile, data.painPoints])
    const fpiRight = useMemo(() => getFpiClass(data.fpi?.right || []), [data.fpi])
    const fpiLeft = useMemo(() => getFpiClass(data.fpi?.left || []), [data.fpi])

    const [activeTab, setActiveTab] = useState("patient-data")

    const handleTabChange = (direction: 'next' | 'prev') => {
        const currentIndex = TABS.indexOf(activeTab)
        if (direction === 'next' && currentIndex < TABS.length - 1) {
            setActiveTab(TABS[currentIndex + 1])
        } else if (direction === 'prev' && currentIndex > 0) {
            setActiveTab(TABS[currentIndex - 1])
        }
    }

    const LoadingFallback = () => (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            <span className="ml-2 text-slate-500">Carregando módulo...</span>
        </div>
    )

    const NavButtons = () => {
        const currentIndex = TABS.indexOf(activeTab)
        const isFirst = currentIndex === 0
        const isLast = currentIndex === TABS.length - 1

        return (
            <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
                <Button
                    variant="outline"
                    onClick={() => handleTabChange('prev')}
                    disabled={isFirst}
                    className={isFirst ? "invisible" : ""}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
                </Button>

                {isLast ? (
                    <div className="flex gap-2">
                        {!readOnly && patientName && (
                            <PropulsaoButton
                                data={data}
                                patientId={patientId}
                                patientName={patientName}
                                patientEmail={patientEmail}
                                patientPhone={patientPhone}
                            />
                        )}
                        {!readOnly && (
                            <Button onClick={() => onSave(data)} className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200">
                                <Save className="mr-2 h-4 w-4" /> Salvar Avaliação
                            </Button>
                        )}
                    </div>
                ) : (
                    <Button onClick={() => handleTabChange('next')}>
                        Próximo <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header / Save */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-800">Palmilha Biomecânica 2.0</h2>
                    <p className="text-muted-foreground">Avaliação Completa e Prescrição</p>
                </div>
                {!readOnly && (
                    <div className="flex gap-2">
                        {patientName && (
                            <PropulsaoButton
                                data={data}
                                patientId={patientId}
                                patientName={patientName}
                                patientEmail={patientEmail}
                                patientPhone={patientPhone}
                            />
                        )}
                        <Button onClick={() => onSave(data)} className="gap-2 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200">
                            <Save className="w-4 h-4" /> Salvar
                        </Button>
                    </div>
                )}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full justify-start overflow-x-auto h-auto flex-wrap mb-6 p-1 bg-slate-100/80">
                    <TabsTrigger value="patient-data" className="gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">
                        <FileText className="w-4 h-4" /> Dados do Paciente
                    </TabsTrigger>
                    <TabsTrigger value="pain-map" className="gap-2 data-[state=active]:bg-white data-[state=active]:text-red-500 data-[state=active]:shadow-sm">
                        <Activity className="w-4 h-4" /> Mapa de Dor
                    </TabsTrigger>
                    <TabsTrigger value="postural" className="gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-500 data-[state=active]:shadow-sm">
                        <Ruler className="w-4 h-4" /> Avaliação Postural
                    </TabsTrigger>
                    <TabsTrigger value="functional" className="gap-2 data-[state=active]:bg-white data-[state=active]:text-orange-500 data-[state=active]:shadow-sm">
                        <Dumbbell className="w-4 h-4" /> Testes Funcionais
                    </TabsTrigger>
                    <TabsTrigger value="shoes" className="gap-2 data-[state=active]:bg-white data-[state=active]:text-purple-500 data-[state=active]:shadow-sm">
                        <Footprints className="w-4 h-4" /> Análise de Calçados
                    </TabsTrigger>
                </TabsList>

                {/* 1. Patient Data */}
                <TabsContent value="patient-data" className="mt-0 focus-visible:outline-none ring-offset-background">
                    <PatientDataStep data={data} updateField={updateField} readOnly={readOnly} />
                    <NavButtons />
                </TabsContent>

                {/* 2. Pain Map */}
                <TabsContent value="pain-map" className="mt-0 focus-visible:outline-none ring-offset-background">
                    <Suspense fallback={<LoadingFallback />}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Mapeamento Corporal</CardTitle>
                                <CardDescription>Clique para adicionar pontos de dor ou arraste os existentes.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="max-w-3xl mx-auto">
                                    <BodyPainMap
                                        painPoints={data.painPoints || {}}
                                        onChange={(v) => updateField('painPoints', v)}
                                        customPoints={data.customPainPoints || []}
                                        onCustomPointsChange={(v) => updateField('customPainPoints', v)}
                                        readOnly={readOnly}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                        <NavButtons />
                    </Suspense>
                </TabsContent>

                {/* 3. Postural */}
                <TabsContent value="postural" className="mt-0 focus-visible:outline-none ring-offset-background">
                    <Suspense fallback={<LoadingFallback />}>
                        <PosturalStep data={data} updateField={updateField} readOnly={readOnly} />
                        <NavButtons />
                    </Suspense>
                </TabsContent>

                {/* 4. Functional */}
                <TabsContent value="functional" className="mt-0 focus-visible:outline-none ring-offset-background">
                    <Suspense fallback={<LoadingFallback />}>
                        <FunctionalStep data={data} updateField={updateField} readOnly={readOnly} fpiLeft={fpiLeft} fpiRight={fpiRight} />
                        <NavButtons />
                    </Suspense>
                </TabsContent>

                {/* 5. Shoe Analysis */}
                <TabsContent value="shoes" className="mt-0 focus-visible:outline-none ring-offset-background">
                    <Suspense fallback={<LoadingFallback />}>
                        <ShoeAnalysisStep
                            data={data}
                            updateField={updateField}
                            readOnly={readOnly}
                            minimalismIndex={minimalismIndex}
                            recommendations={recommendations}
                            smartRecommendation={smartRecommendation}
                        />
                        <NavButtons />
                    </Suspense>
                </TabsContent>
            </Tabs>
        </div >
    )
}
