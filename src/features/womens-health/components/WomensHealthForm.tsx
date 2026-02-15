"use client"
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Save, Baby, HeartPulse, Activity, Brain } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FunctionalAssessmentSection } from "@/features/pbe/components/sections/FunctionalAssessmentSection";
import { cn } from "@/lib/utils"
import { RapidAssessmentModal } from "@/features/pbe/components/RapidAssessmentModal"
import { toast } from "sonner"

interface WomensHealthFormProps {
    initialData?: any
    patientId: string
    onSave: (data: any) => void
    readOnly?: boolean
    hideHeader?: boolean
    hideButtons?: boolean
}

export function WomensHealthForm({ initialData, patientId, onSave, readOnly, hideHeader = false, hideButtons = false }: WomensHealthFormProps) {
    const DEFAULT_DATA = {
        // A. OBSTETRIC HISTORY
        obstetric: {
            gestations: 0,
            births: 0,
            birthType: 'vaginal', // vaginal, c_section, mixed
            abortions: 0,
            episiotomy: false,
            menopause: false
        },
        // B. FUNCTIONAL COMPLAINTS
        complaints: {
            stressUrinaryIncontinence: false,
            urgeIncontinence: false,
            nocturia: false,
            prolapseSensation: false,
            constipation: false,
            dyspareunia: false
        },
        // C. RED FLAGS (PREGNANCY)
        redFlags: {
            vaginalBleeding: false,
            amnioticFluidLeak: false,
            severeHeadache: false,
            reducedFetalMovement: false
        },
        // D. PHYSICAL EXAM (PERFECT)
        perfect: {
            power: 0,
            endurance: 0,
            repetitions: 0,
            fast: 0,
            diastasis: false
        },
        functional: {
            efep: [{ activity: "", score: "" }],
            questionnaires: [],
            plan: { followUpDays: [], monitorPain: true, extraQuestionnaire: "none" }
        }
    }

    const [data, setData] = useState(initialData ? { ...DEFAULT_DATA, ...initialData } : DEFAULT_DATA)
    const [openSection, setOpenSection] = useState("history")
    const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false)

    // Auto-Save Logic
    const { useDebouncedCallback } = require("use-debounce")
    const debouncedSave = useDebouncedCallback((newData: any) => {
        onSave(newData)
    }, 1500)

    // Trigger auto-save when data changes
    React.useEffect(() => {
        // Skip initial save to avoid overwrite if empty? No, initialData is merged. 
        // Just ensure we don't save immediately on mount if unchanged?
        // Actually, saving typically doesn't hurt.
        debouncedSave(data)
    }, [data, debouncedSave])

    const updateField = (path: string, val: any) => {
        if (readOnly) return

        setData((prev: any) => {
            const newData = { ...prev }
            const keys = path.split('.')
            let current = newData

            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i]
                if (!current[key]) current[key] = {}

                if (Array.isArray(current[key])) {
                    current[key] = [...current[key]]
                } else {
                    current[key] = { ...current[key] }
                }
                current = current[key]
            }

            current[keys[keys.length - 1]] = val
            return newData
        })
    }

    const hasRedFlags = Object.values(data.redFlags || {}).some(Boolean)

    return (
        <div className="space-y-6 pb-20 max-w-4xl mx-auto">
            {/* Header */}
            {!hideHeader && (
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6 border-b pb-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-pink-900">Saúde da Mulher & Pélvica</h2>
                        <p className="text-pink-600/80 flex items-center gap-2 font-medium">
                            <HeartPulse className="w-4 h-4" />
                            Avaliação Especializada (Uroginecologia)
                        </p>
                    </div>
                    {!readOnly && !hideButtons && (
                        <Button onClick={() => onSave(data)} className="bg-pink-600 hover:bg-pink-700 text-white shadow-md shadow-pink-100 ring-offset-2 focus:ring-2 ring-pink-500">
                            <Save className="w-4 h-4 mr-2" /> Salvar Avaliação
                        </Button>
                    )}
                </div>
            )}

            <Accordion type="single" collapsible value={openSection} onValueChange={setOpenSection} className="w-full space-y-4">

                {/* 1. OBSTETRIC HISTORY */}
                <AccordionItem value="history" className="border rounded-xl border-l-4 border-l-pink-400 bg-white shadow-sm px-2">
                    <AccordionTrigger className="px-4 py-4 hover:no-underline">
                        <div className="flex items-center gap-3 text-left">
                            <div className="p-2 bg-pink-100 rounded-lg text-pink-600">
                                <Baby className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-lg text-slate-700">1. História Obstétrica</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-0">
                        <div className="grid md:grid-cols-2 gap-6 pt-4">
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <Label>Gestações (G)</Label>
                                        <Input type="number" min={0} value={data.obstetric?.gestations} onChange={e => updateField('obstetric.gestations', +e.target.value)} placeholder="0" className="bg-white" disabled={readOnly} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Partos (P)</Label>
                                        <Input type="number" min={0} value={data.obstetric?.births} onChange={e => updateField('obstetric.births', +e.target.value)} placeholder="0" className="bg-white" disabled={readOnly} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Abortos (A)</Label>
                                        <Input type="number" min={0} value={data.obstetric?.abortions} onChange={e => updateField('obstetric.abortions', +e.target.value)} placeholder="0" className="bg-white" disabled={readOnly} />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label>Tipo de Parto Predominante</Label>
                                    <Select value={data.obstetric?.birthType} onValueChange={v => updateField('obstetric.birthType', v)} disabled={readOnly}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="vaginal">Vaginal</SelectItem>
                                            <SelectItem value="c_section">Cesárea</SelectItem>
                                            <SelectItem value="mixed">Misto</SelectItem>
                                            <SelectItem value="null">Nenhum</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-4 pt-1">
                                <div className="flex items-start gap-3 p-3 rounded-lg border bg-pink-50/30 border-pink-100">
                                    <Checkbox
                                        id="episiotomy"
                                        checked={data.obstetric?.episiotomy}
                                        onCheckedChange={c => updateField('obstetric.episiotomy', c)}
                                        disabled={readOnly}
                                        className="data-[state=checked]:bg-pink-600 border-pink-300 mt-0.5"
                                    />
                                    <div>
                                        <Label htmlFor="episiotomy" className="font-semibold text-pink-900 cursor-pointer">Histórico de Episiotomia / Laceração?</Label>
                                        <p className="text-xs text-pink-700/70">Cicatrizes perineais podem influenciar na função muscular.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 rounded-lg border bg-slate-50 border-slate-200">
                                    <Checkbox
                                        id="menopause"
                                        checked={data.obstetric?.menopause}
                                        onCheckedChange={c => updateField('obstetric.menopause', c)}
                                        disabled={readOnly}
                                        className="mt-0.5"
                                    />
                                    <div>
                                        <Label htmlFor="menopause" className="font-semibold text-slate-900 cursor-pointer">Menopausa / Climatério?</Label>
                                        <p className="text-xs text-slate-500">Alterações hormonais (hipoestrogenismo) afetam tecidos.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* 2. SYMPTOMS & TRIAGE */}
                <AccordionItem value="symptoms" className="border rounded-xl border-l-4 border-l-red-400 bg-white shadow-sm px-2">
                    <AccordionTrigger className="px-4 py-4 hover:no-underline">
                        <div className="flex items-center gap-3 text-left">
                            <div className="p-2 bg-red-100 rounded-lg text-red-600">
                                <Activity className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-lg text-slate-700">2. Queixas & Sintomas</span>
                            {hasRedFlags && (
                                <Badge className="ml-2 bg-red-100 text-red-700 hover:bg-red-200 border-red-200">Red Flag</Badge>
                            )}
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-0">
                        <div className="pt-4 space-y-6">
                            {/* RED FLAGS */}
                            <div className={cn("rounded-lg border p-4 transition-all", hasRedFlags ? "border-l-4 border-red-500 bg-red-50/40 border-red-200" : "border-slate-200 bg-slate-50/50")}>
                                <div className={cn("flex items-center gap-2 text-sm font-bold mb-3 uppercase tracking-wider", hasRedFlags ? "text-red-700" : "text-slate-500")}>
                                    <AlertTriangle className="w-4 h-4" />
                                    Triagem Gestante (Red Flags)
                                </div>
                                <div className="grid md:grid-cols-2 gap-3">
                                    {[
                                        { id: 'vaginalBleeding', label: 'Sangramento Vaginal Recente' },
                                        { id: 'amnioticFluidLeak', label: 'Perda de Líquido Amniótico' },
                                        { id: 'severeHeadache', label: 'Dor de Cabeça Severa / Visão Turva (Pré-Eclâmpsia)' },
                                        { id: 'reducedFetalMovement', label: 'Redução Nítida de Movimentos Fetais' },
                                    ].map((flag) => (
                                        <div key={flag.id} className={cn("flex items-center gap-3 p-3 rounded-lg border transition-all", data.redFlags?.[flag.id] ? "bg-red-100 border-red-300" : "bg-white border-slate-100")}>
                                            <Checkbox
                                                id={flag.id}
                                                checked={data.redFlags?.[flag.id]}
                                                onCheckedChange={(checked) => updateField(`redFlags.${flag.id}`, checked)}
                                                disabled={readOnly}
                                                className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                                            />
                                            <Label htmlFor={flag.id} className="cursor-pointer font-medium text-sm leading-tight text-slate-700">
                                                {flag.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* FUNCTIONAL COMPLAINTS */}
                            <div>
                                <h3 className="text-sm font-bold text-pink-900 uppercase tracking-wider mb-3">Queixas Funcionais</h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <ComplaintCheck id="stressUrinaryIncontinence" label="Perda de Urina aos Esforços (Tossir/Espirrar)" data={data} update={updateField} readOnly={readOnly} />
                                    <ComplaintCheck id="urgeIncontinence" label="Urgência Miccional (Não segura até o banheiro)" data={data} update={updateField} readOnly={readOnly} />
                                    <ComplaintCheck id="nocturia" label="Noctúria (Acorda >2x à noite)" data={data} update={updateField} readOnly={readOnly} />
                                    <ComplaintCheck id="prolapseSensation" label="Sensação de Peso/Bola na Vagina (Prolapso)" data={data} update={updateField} readOnly={readOnly} />
                                    <ComplaintCheck id="constipation" label="Constipação Intestinal / Força p/ Evacuar" data={data} update={updateField} readOnly={readOnly} />
                                    <ComplaintCheck id="dyspareunia" label="Dor na Relação Sexual (Dispareunia)" data={data} update={updateField} readOnly={readOnly} />
                                </div>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* 3. PHYSICAL EXAM */}
                <AccordionItem value="physical" className="border rounded-xl border-l-4 border-l-purple-400 bg-white shadow-sm px-2">
                    <AccordionTrigger className="px-4 py-4 hover:no-underline">
                        <div className="flex items-center gap-3 text-left">
                            <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                <Brain className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-lg text-slate-700">3. Exame Físico (PERFECT)</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-0">
                        <div className="pt-4 space-y-6">
                            <div className="bg-pink-50/30 p-4 rounded-xl border border-pink-100">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="text-sm font-bold text-pink-900 uppercase tracking-widest">Avaliação MAP (Oxford Modificada)</div>
                                    <Badge className="bg-pink-100 text-pink-700 hover:bg-pink-200">PERFECT Scheme</Badge>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="space-y-2 p-3 bg-white rounded-lg border text-center shadow-sm">
                                        <Label className="text-lg font-bold text-pink-700 block">P</Label>
                                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Power</span>
                                        <div className="flex items-center justify-center gap-2 mt-2">
                                            <Input
                                                type="number"
                                                min={0} max={5}
                                                className="text-center font-bold text-lg h-12 w-full bg-slate-50"
                                                value={data.perfect?.power}
                                                onChange={e => updateField('perfect.power', +e.target.value)}
                                                placeholder="0"
                                                disabled={readOnly}
                                            />
                                        </div>
                                        <span className="text-[10px] text-slate-400">Força 0-5</span>
                                    </div>
                                    <div className="space-y-2 p-3 bg-white rounded-lg border text-center shadow-sm">
                                        <Label className="text-lg font-bold text-pink-700 block">E</Label>
                                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Endurance</span>
                                        <div className="flex items-center justify-center gap-2 mt-2">
                                            <Input
                                                type="number"
                                                min={0}
                                                className="text-center font-bold text-lg h-12 w-full bg-slate-50"
                                                value={data.perfect?.endurance}
                                                onChange={e => updateField('perfect.endurance', +e.target.value)}
                                                placeholder="0"
                                            />
                                        </div>
                                        <span className="text-[10px] text-slate-400">Segundos</span>
                                    </div>
                                    <div className="space-y-2 p-3 bg-white rounded-lg border text-center shadow-sm">
                                        <Label className="text-lg font-bold text-pink-700 block">R</Label>
                                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Repetitions</span>
                                        <div className="flex items-center justify-center gap-2 mt-2">
                                            <Input
                                                type="number"
                                                min={0}
                                                className="text-center font-bold text-lg h-12 w-full bg-slate-50"
                                                value={data.perfect?.repetitions}
                                                onChange={e => updateField('perfect.repetitions', +e.target.value)}
                                                placeholder="0"
                                            />
                                        </div>
                                        <span className="text-[10px] text-slate-400">Repetições</span>
                                    </div>
                                    <div className="space-y-2 p-3 bg-white rounded-lg border text-center shadow-sm">
                                        <Label className="text-lg font-bold text-pink-700 block">F</Label>
                                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Fast</span>
                                        <div className="flex items-center justify-center gap-2 mt-2">
                                            <Input
                                                type="number"
                                                min={0}
                                                className="text-center font-bold text-lg h-12 w-full bg-slate-50"
                                                value={data.perfect?.fast}
                                                onChange={e => updateField('perfect.fast', +e.target.value)}
                                                placeholder="0"
                                            />
                                        </div>
                                        <span className="text-[10px] text-slate-400">Contrações Ráp.</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        id="diastasis"
                                        checked={data.perfect?.diastasis}
                                        onCheckedChange={c => updateField('perfect.diastasis', c)}
                                        disabled={readOnly}
                                        className="data-[state=checked]:bg-yellow-600 border-yellow-400"
                                    />
                                    <div>
                                        <Label htmlFor="diastasis" className="font-bold text-yellow-900 cursor-pointer">Diástase Abdominal Presente?</Label>
                                        <p className="text-xs text-yellow-700">Separação dos retos abdominais (Supra ou Infra-umbilical &gt; 2cm).</p>
                                    </div>
                                </div>
                                <Activity className="text-yellow-400 w-8 h-8 opacity-50" />
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <FunctionalAssessmentSection
                    value={data.functional}
                    onChange={(val) => updateField('functional', val)}
                    readonly={readOnly}
                    onOpenAssessment={(type) => {
                        updateField('functional.plan.extraQuestionnaire', type);
                        setIsAssessmentModalOpen(true);
                    }}
                />

            </Accordion>

            <RapidAssessmentModal
                isOpen={isAssessmentModalOpen}
                onClose={() => setIsAssessmentModalOpen(false)}
                assessmentType={data.functional?.plan?.extraQuestionnaire}
                onSave={async (assessmentData) => {
                    const type = data.functional?.plan?.extraQuestionnaire;
                    const current = data.functional?.questionnaires || [];

                    // Calculate score if possible
                    let score = 0;
                    if (assessmentData && typeof assessmentData === 'object') {
                        score = Object.values(assessmentData).reduce((acc: number, v: any) => acc + (Number(v) || 0), 0);
                    }

                    const newEntry = { type, data: assessmentData, score, savedAt: new Date().toISOString() };
                    const updatedQuestionnaires = [...current, newEntry];

                    updateField('functional.questionnaires', updatedQuestionnaires);
                    updateField('functional.plan.extraQuestionnaire', 'none');
                    toast.success("Avaliação funcional adicionada!");
                }}
            />
        </div>
    )
}

function ComplaintCheck({ id, label, data, update, readOnly }: any) {
    return (
        <div className={cn("flex items-center gap-3 p-3 rounded-lg border transition-all", data.complaints?.[id] ? "bg-pink-50 border-pink-200" : "bg-white hover:bg-slate-50 border-slate-200")}>
            <Checkbox
                id={id}
                checked={data.complaints?.[id]}
                onCheckedChange={(c) => update(`complaints.${id}`, c)}
                disabled={readOnly}
                className="data-[state=checked]:bg-pink-600 border-pink-200"
            />
            <Label htmlFor={id} className="cursor-pointer text-sm text-slate-700 font-medium leading-tight">{label}</Label>
        </div>
    )
}

export default WomensHealthForm;
