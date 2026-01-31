"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AudioTextarea } from "@/features/pbe/components/audio-textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
    Microscope,
    Bot,
    Sparkles,
    ShieldAlert,
    ArrowRight,
    ArrowLeft,
    CheckCircle2,
    AlertTriangle,
    Stethoscope,
    Dna,
    Activity,
    BrainCircuit,
    Save,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CLINICAL_PROTOCOLS } from "@/lib/data/clinical-protocols";
import { toast } from "sonner";

interface AdvancedSmartAssessmentProps {
    patientId: string;
}

type Step = 'welcome' | 'hma' | 'region' | 'flags' | 'analysis';

export default function AdvancedSmartAssessment({ patientId }: AdvancedSmartAssessmentProps) {
    const [currentStep, setCurrentStep] = useState<Step>('welcome');
    const [selectedRegion, setSelectedRegion] = useState<string>("");
    const [hma, setHma] = useState("");
    const [qp, setQp] = useState("");
    const [flags, setFlags] = useState<Record<string, boolean>>({});
    const [isPending, startTransition] = useTransition();

    // Mapping of scripted questions for flags
    const FLAG_QUESTIONS = {
        general: [
            { id: 'cancer', label: 'Histórico prévio de câncer?', type: 'red' },
            { id: 'weight_loss', label: 'Perda de peso inexplicada?', type: 'red' },
            { id: 'night_pain', label: 'Dor noturna constante (não mecânica)?', type: 'red' },
            { id: 'systemic', label: 'Febre, calafrios ou mal-estar recente?', type: 'red' },
        ],
        spine: [
            { id: 'cauda_equina', label: 'Alteração no controle fecal ou urinário?', type: 'red' },
            { id: 'saddle_anesthesia', label: 'Dormência na região genital (em sela)?', type: 'red' },
            { id: 'motor_weakness', label: 'Fraqueza súbita nas pernas?', type: 'red' },
            { id: 'fear_avoidance', label: 'Medo de se mover e piorar a dor?', type: 'yellow' },
            { id: 'catastrophizing', label: 'Acha que o problema é "o pior possível" (catastrofização)?', type: 'yellow' },
        ],
        peripheral: [
            { id: 'trauma', label: 'Trauma grave recente (queda/acidente)?', type: 'red' },
            { id: 'septic', label: 'Calor, vermelhidão e inchaço súbito na articulação?', type: 'red' },
            { id: 'low_expectancy', label: 'Baixa expectativa de recuperação?', type: 'yellow' },
        ]
    };

    const nextStep = () => {
        if (currentStep === 'welcome') setCurrentStep('hma');
        else if (currentStep === 'hma') setCurrentStep('region');
        else if (currentStep === 'region') setCurrentStep('flags');
        else if (currentStep === 'flags') setCurrentStep('analysis');
    };

    const prevStep = () => {
        if (currentStep === 'hma') setCurrentStep('welcome');
        else if (currentStep === 'region') setCurrentStep('hma');
        else if (currentStep === 'flags') setCurrentStep('region');
        else if (currentStep === 'analysis') setCurrentStep('flags');
    };

    const handleFlagToggle = (id: string, checked: boolean) => {
        setFlags(prev => ({ ...prev, [id]: checked }));
    };

    const getRelevantFlags = () => {
        let questions = [...FLAG_QUESTIONS.general];
        if (selectedRegion.includes('spine')) {
            questions = [...questions, ...FLAG_QUESTIONS.spine];
        } else if (selectedRegion) {
            questions = [...questions, ...FLAG_QUESTIONS.peripheral];
        }
        return questions;
    };

    const renderStep = () => {
        switch (currentStep) {
            case 'welcome':
                return (
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-8 animate-in fade-in zoom-in duration-500">
                        <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur opacity-25 animate-pulse"></div>
                            <div className="relative bg-white p-6 rounded-full shadow-xl">
                                <BrainCircuit className="w-16 h-16 text-indigo-600" />
                            </div>
                        </div>
                        <div className="space-y-4 max-w-2xl">
                            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                                Avaliação Clínica Inteligente
                            </h1>
                            <p className="text-xl text-slate-600">
                                Seu copiloto PBE para uma avaliação precisa, baseada em evidências e orientada por subgrupos.
                            </p>
                        </div>
                        <Button size="lg" onClick={nextStep} className="h-14 px-8 text-lg bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200">
                            Iniciar Nova Avaliação <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                    </div>
                );

            case 'hma':
                return (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center gap-3">
                            <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 px-3 py-1 text-sm font-bold">PASSO 1</Badge>
                            <h2 className="text-2xl font-bold text-slate-800">História & Queixa</h2>
                        </div>
                        <Card className="border-2 border-slate-100 shadow-sm">
                            <CardContent className="pt-6 space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase font-black text-slate-400">Queixa Principal</Label>
                                    <Input
                                        value={qp}
                                        onChange={(e) => setQp(e.target.value)}
                                        placeholder="O que trouxe o paciente hoje?"
                                        className="text-lg font-medium h-12 border-slate-200 focus:border-indigo-400"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase font-black text-slate-400">História da Moléstia Atual (Grave seu Relato)</Label>
                                    <AudioTextarea
                                        value={hma}
                                        onChange={(e) => setHma(e.target.value)}
                                        placeholder="Relate como os sintomas começaram, evolução e tratamentos prévios..."
                                        className="min-h-[200px]"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                        <div className="flex justify-between">
                            <Button variant="ghost" onClick={prevStep}><ArrowLeft className="mr-2 w-4 h-4" /> Voltar</Button>
                            <Button onClick={nextStep} disabled={!qp || !hma} className="bg-indigo-600 px-8">Próximo Passo <ArrowRight className="ml-2 w-4 h-4" /></Button>
                        </div>
                    </div>
                );

            case 'region':
                return (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center gap-3">
                            <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 px-3 py-1 text-sm font-bold">PASSO 2</Badge>
                            <h2 className="text-2xl font-bold text-slate-800">Região de Interesse</h2>
                        </div>
                        <Card className="border-2 border-slate-100 shadow-sm">
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {[
                                        { id: 'spine_lumbar', label: 'Coluna Lombar', icon: <Activity className="w-5 h-5" /> },
                                        { id: 'spine_cervical', label: 'Coluna Cervical', icon: <Activity className="w-5 h-5" /> },
                                        { id: 'shoulder', label: 'Ombro', icon: <Activity className="w-5 h-5" /> },
                                        { id: 'knee', label: 'Joelho', icon: <Activity className="w-5 h-5" /> },
                                        { id: 'ankle_foot', label: 'Tornozelo e Pé', icon: <Activity className="w-5 h-5" /> },
                                        { id: 'hip', label: 'Quadril', icon: <Activity className="w-5 h-5" /> },
                                    ].map((r) => (
                                        <button
                                            key={r.id}
                                            onClick={() => setSelectedRegion(r.id)}
                                            className={cn(
                                                "flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                                                selectedRegion === r.id
                                                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md"
                                                    : "border-slate-100 hover:border-slate-200 text-slate-600 hover:bg-slate-50"
                                            )}
                                        >
                                            <div className={cn(
                                                "p-2 rounded-lg",
                                                selectedRegion === r.id ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"
                                            )}>
                                                {r.icon}
                                            </div>
                                            <span className="font-bold">{r.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                        <div className="flex justify-between">
                            <Button variant="ghost" onClick={prevStep}><ArrowLeft className="mr-2 w-4 h-4" /> Voltar</Button>
                            <Button onClick={nextStep} disabled={!selectedRegion} className="bg-indigo-600 px-8">Configurar Script de Triagem <ArrowRight className="ml-2 w-4 h-4" /></Button>
                        </div>
                    </div>
                );

            case 'flags':
                const qs = getRelevantFlags();
                return (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 px-3 py-1 text-sm font-bold">PASSO 3</Badge>
                                <h2 className="text-2xl font-bold text-slate-800">Triagem de Segurança (Flags)</h2>
                            </div>
                            <div className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4 text-orange-500" /> Triagem Obrigatória
                            </div>
                        </div>

                        <Card className="border-2 border-slate-100 overflow-hidden">
                            <div className="bg-slate-50 p-4 border-b">
                                <p className="text-sm text-slate-600 italic">
                                    "Faça estas perguntas ao paciente para excluir patologias sérias ou barreiras psicológicas à recuperação."
                                </p>
                            </div>
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    {qs.map((q) => (
                                        <div key={q.id} className="flex items-start gap-4 p-6 hover:bg-indigo-50/30 transition-colors">
                                            <div className="pt-1">
                                                <Checkbox
                                                    id={q.id}
                                                    checked={!!flags[q.id]}
                                                    onCheckedChange={(checked) => handleFlagToggle(q.id, !!checked)}
                                                    className="w-5 h-5 border-2"
                                                />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <Label htmlFor={q.id} className="text-base font-bold text-slate-700 cursor-pointer">
                                                    {q.label}
                                                </Label>
                                                <div className="flex gap-2">
                                                    {q.type === 'red' ? (
                                                        <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50 text-[10px] py-0">RED FLAG</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="border-orange-200 text-orange-700 bg-orange-50 text-[10px] py-0">YELLOW FLAG</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-between">
                            <Button variant="ghost" onClick={prevStep}><ArrowLeft className="mr-2 w-4 h-4" /> Voltar</Button>
                            <Button onClick={nextStep} className="bg-indigo-600 px-8">Gerar Sugestões de Exame <Sparkles className="ml-2 w-4 h-4" /></Button>
                        </div>
                    </div>
                );

            case 'analysis':
                return (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center gap-3">
                            <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 px-3 py-1 text-sm font-bold">PASSO 4</Badge>
                            <h2 className="text-2xl font-bold text-slate-800">IA Copilot: Sugestões PBE</h2>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <Card className="border-indigo-200 ring-1 ring-indigo-50 bg-white">
                                <CardHeader className="bg-indigo-50/50 pb-4">
                                    <CardTitle className="text-lg flex items-center gap-2 text-indigo-900">
                                        <Bot className="w-5 h-5" /> Testes Físicos Sugeridos
                                    </CardTitle>
                                    <CardDescription>Baseado na HMA e na região selecionada.</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    {/* Mocking for now, will connect to AI later */}
                                    <ul className="space-y-3">
                                        {[
                                            { test: "Teste de Lachman", reason: "Suspeita de lesão ligamentar baseada no relato de trauma." },
                                            { test: "Pivot Shift", reason: "Avaliação de instabilidade rotatória." },
                                            { test: "Teste de McMurray", reason: "Excluir lesão de menisco associada." }
                                        ].map((t, i) => (
                                            <li key={i} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                    <span className="font-bold text-slate-800">{t.test}</span>
                                                </div>
                                                <p className="text-xs text-slate-500 pl-3.5 leading-relaxed">{t.reason}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card className="border-purple-200 ring-1 ring-purple-50 bg-white">
                                <CardHeader className="bg-purple-50/50 pb-4">
                                    <CardTitle className="text-lg flex items-center gap-2 text-purple-900">
                                        <Sparkles className="w-5 h-5" /> Questionários (PROMs)
                                    </CardTitle>
                                    <CardDescription>Escalas validadas recomendadas.</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <ul className="space-y-3">
                                        {[
                                            { scale: "WOMAC", icon: <FileText className="w-4 h-4" /> },
                                            { scale: "Lysholm Knee Scoring Scale", icon: <FileText className="w-4 h-4" /> },
                                            { scale: "Tampa Scale (TSK-11)", icon: <AlertTriangle className="w-4 h-4" /> }
                                        ].map((s, i) => (
                                            <li key={i} className="flex items-center justify-between bg-purple-50/30 p-4 rounded-xl border border-purple-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="text-purple-600">{s.icon}</div>
                                                    <span className="font-bold text-slate-700">{s.scale}</span>
                                                </div>
                                                <Button size="sm" variant="ghost" className="text-purple-700 hover:text-purple-800 hover:bg-purple-100 font-bold">Selecionar</Button>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="border-green-200 bg-green-50/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg text-green-900 flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5" /> Resumo de Triagem de Segurança
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {Object.values(flags).some(v => v) ? (
                                    <div className="flex items-start gap-4 p-4 bg-orange-100/50 border border-orange-200 rounded-lg">
                                        <AlertTriangle className="w-6 h-6 text-orange-600 shrink-0" />
                                        <div className="space-y-1">
                                            <p className="font-bold text-orange-900">Atenção Médica Requerida</p>
                                            <p className="text-sm text-orange-800">Foram detectadas bandeiras de alerta. Considere a possibilidade de patologia não mecânica e avaliação cirúrgica ou medicamentosa.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-4 p-4 bg-green-100/50 border border-green-200 rounded-lg">
                                        <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
                                        <div className="space-y-1">
                                            <p className="font-bold text-green-900">Triagem de Segurança Ok</p>
                                            <p className="text-sm text-green-800">Nenhum sinal de alerta sistêmico ou grave detectado. Paciente apto para tratamento fisioterapêutico.</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <div className="flex justify-between pt-8">
                            <Button variant="ghost" onClick={prevStep}><ArrowLeft className="mr-2 w-4 h-4" /> Voltar</Button>
                            <Button onClick={() => toast.success("Avaliação enviada para o banco de dados!")} className="bg-indigo-600 px-12 h-12 text-lg">
                                <Save className="mr-2 w-5 h-5" /> Finalizar e Salvar
                            </Button>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-32">
            {/* Minimal Progress Bar */}
            {currentStep !== 'welcome' && (
                <div className="w-full bg-slate-100 rounded-full h-1 mb-8 overflow-hidden">
                    <div
                        className="bg-indigo-600 h-full transition-all duration-700 ease-in-out"
                        style={{ width: `${(Object.keys({ welcome: 0, hma: 25, region: 50, flags: 75, analysis: 100 }) as any)[currentStep]}%` }}
                    />
                </div>
            )}

            <div className="animate-in fade-in duration-700">
                {renderStep()}
            </div>
        </div>
    );
}

// Sub-components as needed or just keep it monolithic for now given the complexity
function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            className={cn(
                "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            {...props}
        />
    )
}
