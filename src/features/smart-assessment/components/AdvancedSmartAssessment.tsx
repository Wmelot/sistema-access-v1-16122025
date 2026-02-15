"use client";

import { useState, useTransition, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AudioTextarea } from "@/features/pbe/components/audio-textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
    BrainCircuit,
    ArrowRight,
    ArrowLeft,
    Mic,
    Play,
    Square,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    Sparkles,
    Bot,
    FileText,
    ShieldAlert,
    Save,
    Activity,
    Zap,
    ListChecks,
    Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CLINICAL_PROTOCOLS } from "@/lib/data/clinical-protocols";
import { toast } from "sonner";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

import { Input } from "@/components/ui/input";
import { getSmartSuggestions, getHmaQuestions, generateFinalReport } from "../actions/get-smart-suggestions";

interface AdvancedSmartAssessmentProps {
    patientId: string;
    onSave?: (data: any) => void;
    initialData?: any;
    readOnly?: boolean;
}

type Step = 'welcome' | 'hma' | 'region' | 'flags' | 'analysis' | 'exam' | 'report';

export default function AdvancedSmartAssessment({ patientId, onSave, initialData, readOnly = false }: AdvancedSmartAssessmentProps) {
    const [currentStep, setCurrentStep] = useState<Step>('welcome');
    const [selectedRegions, setSelectedRegions] = useState<string[]>(initialData?.regions || []);
    const [hma, setHma] = useState(initialData?.hma || "");
    const [qp, setQp] = useState(initialData?.qp || "");
    const [flags, setFlags] = useState<Record<string, boolean>>(initialData?.flags || {});
    const [suggestions, setSuggestions] = useState<any>(initialData?.suggestions || null);
    const [hmaQuestions, setHmaQuestions] = useState<string[]>([]);
    const [finalReport, setFinalReport] = useState<any>(initialData?.report || null);
    const [examData, setExamData] = useState<any>(initialData?.examData || {
        movements: {},
        neurological: { dermatomes: [], myotomes: {}, reflexes: {} },
        specialTests: {},
        obs: ""
    });
    const [isPending, startTransition] = useTransition();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isFetchingQuestions, setIsFetchingQuestions] = useState(false);
    const [isFallbackMode, setIsFallbackMode] = useState(false);

    // Dynamic HMA Questions Fetching with Debounce
    useEffect(() => {
        if (!qp || qp.length < 3) {
            setHmaQuestions([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsFetchingQuestions(true);
            try {
                const result = await getHmaQuestions(qp);
                if (result.success && result.data) {
                    setHmaQuestions(result.data.questions || []);
                    if (result.data.detectedRegions && result.data.detectedRegions.length > 0 && selectedRegions.length === 0) {
                        setSelectedRegions(result.data.detectedRegions);
                        toast.info(`Inteligência Axiom: ${result.data.detectedRegions.length} regiões detectadas: ${result.data.detectedRegions.map((r: string) => r.replace('_', ' ')).join(', ')}`, {
                            icon: <Sparkles className="w-4 h-4 text-indigo-500" />
                        });
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsFetchingQuestions(false);
            }
        }, 1200);

        return () => clearTimeout(timer);
    }, [qp]);

    // [NEW] Skip to report if readOnly
    useEffect(() => {
        if (readOnly && initialData) {
            setCurrentStep('report');
        }
    }, [readOnly, initialData]);

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
        else if (currentStep === 'hma') {
            // Se a IA já detectou e selecionou regiões, pula direto para as Flags
            if (selectedRegions.length > 0) setCurrentStep('flags');
            else setCurrentStep('region');
        }
        else if (currentStep === 'region') setCurrentStep('flags');
        else if (currentStep === 'flags') {
            handleGenerateSuggestions();
        }
        else if (currentStep === 'analysis') setCurrentStep('exam');
        else if (currentStep === 'exam') setCurrentStep('report');
    };

    const handleGenerateSuggestions = async () => {
        setIsAnalyzing(true);
        setIsFallbackMode(false);
        setCurrentStep('analysis');
        try {
            const result = await getSmartSuggestions(hma, selectedRegions, flags);
            if (result.success) {
                setSuggestions(result.data);
                if (result.isFallback) {
                    setIsFallbackMode(true);
                    toast.warning(result.msg, { duration: 6000 });
                }
            } else {
                toast.error(result.msg || "Não foi possível gerar sugestões automáticas.");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const prevStep = () => {
        if (currentStep === 'hma') setCurrentStep('welcome');
        else if (currentStep === 'region') setCurrentStep('hma');
        else if (currentStep === 'flags') setCurrentStep('region');
        else if (currentStep === 'analysis') setCurrentStep('flags');
        else if (currentStep === 'exam') setCurrentStep('analysis');
    };

    const handleFlagToggle = (id: string, checked: boolean) => {
        setFlags(prev => ({ ...prev, [id]: checked }));
    };

    const getRelevantFlags = () => {
        let questions = [...FLAG_QUESTIONS.general];
        const hasSpine = selectedRegions.some(r => r.includes('spine'));
        const hasPeripheral = selectedRegions.some(r => !r.includes('spine'));

        if (hasSpine) {
            questions = [...questions, ...FLAG_QUESTIONS.spine];
        }
        if (hasPeripheral) {
            questions = [...questions, ...FLAG_QUESTIONS.peripheral];
        }
        // Remove duplicates just in case
        return Array.from(new Set(questions.map(q => q.id)))
            .map(id => questions.find(q => q.id === id)!);
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

                        <div className="grid lg:grid-cols-5 gap-6">
                            <div className="lg:col-span-3 space-y-6">
                                <Card className="border-2 border-slate-100 shadow-sm overflow-hidden">
                                    <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center">
                                        <Label className="text-xs uppercase font-black text-slate-500">Formulário de Entrada</Label>
                                        {isFetchingQuestions && <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />}
                                    </div>
                                    <CardContent className="pt-6 space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-xs uppercase font-black text-slate-400">Queixa Principal (QP)</Label>
                                            <Input
                                                value={qp}
                                                onChange={(e) => setQp(e.target.value)}
                                                placeholder="Ex: Dor no joelho ao agachar..."
                                                className="text-lg font-medium h-12 border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 shadow-sm transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs uppercase font-black text-slate-400">Anamnese Narrativa (HMA)</Label>
                                            <AudioTextarea
                                                value={hma}
                                                onChange={(e: any) => setHma(e.target.value)}
                                                placeholder="Relate ou grave a conversa com o paciente..."
                                                className="min-h-[250px] text-base leading-relaxed"
                                            />
                                            <p className="text-[10px] text-slate-400 italic">Dica: Você pode gravar a conversa completa. A IA irá filtrar os pontos chave.</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="lg:col-span-2 space-y-4">
                                <Card className="border-indigo-100 bg-indigo-50/30 sticky top-6">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-indigo-600" />
                                            <CardTitle className="text-sm font-bold text-indigo-900 uppercase">Roteiro de Coleta sugerido</CardTitle>
                                        </div>
                                        <CardDescription className="text-xs text-indigo-700/70">Assegure-se de fazer estas perguntas:</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {hmaQuestions.length > 0 ? (
                                            <ul className="space-y-3">
                                                {hmaQuestions.map((q, i) => (
                                                    <li key={i} className="group flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 group-hover:scale-125 transition-transform" />
                                                        <p className="text-sm font-medium text-indigo-900/80 leading-snug">{q}</p>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <div className="py-8 text-center text-slate-400 space-y-2">
                                                <Bot className="w-8 h-8 mx-auto opacity-20" />
                                                <p className="text-xs italic">Aguardando QP para gerar roteiro específico...</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <div className="p-4 rounded-xl bg-orange-50 border border-orange-100 flex gap-3 text-orange-800">
                                    <AlertTriangle className="w-5 h-5 shrink-0" />
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold uppercase">Lembrete Clínico</p>
                                        <p className="text-[11px] leading-relaxed">Não esqueça de perguntar sobre sintomas sistêmicos se houver suspeita de dor não mecânica.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between pt-4">
                            <Button variant="ghost" onClick={prevStep}><ArrowLeft className="mr-2 w-4 h-4" /> Voltar</Button>
                            <Button onClick={nextStep} disabled={!qp || !hma} className="bg-indigo-600 px-8 h-12 text-base font-bold shadow-lg shadow-indigo-100">
                                Confirmar História <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
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
                                    ].map((r) => {
                                        const isSelected = selectedRegions.includes(r.id);
                                        return (
                                            <button
                                                key={r.id}
                                                onClick={() => {
                                                    setSelectedRegions(prev =>
                                                        isSelected ? prev.filter(id => id !== r.id) : [...prev, r.id]
                                                    );
                                                }}
                                                className={cn(
                                                    "relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                                                    isSelected
                                                        ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md"
                                                        : "border-slate-100 hover:border-slate-200 text-slate-600 hover:bg-slate-50"
                                                )}
                                            >
                                                <div className={cn(
                                                    "p-2 rounded-lg",
                                                    isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"
                                                )}>
                                                    {r.icon}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold">{r.label}</span>
                                                    {isSelected && (
                                                        <span className="text-[10px] font-black uppercase text-indigo-400 flex items-center gap-1">
                                                            <Sparkles className="w-2.5 h-2.5" /> Selecionado
                                                        </span>
                                                    )}
                                                </div>
                                                {isSelected && (
                                                    <div className="absolute top-2 right-2">
                                                        <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                        <div className="flex justify-between">
                            <Button variant="ghost" onClick={prevStep}><ArrowLeft className="mr-2 w-4 h-4" /> Voltar</Button>
                            <Button onClick={nextStep} disabled={selectedRegions.length === 0} className="bg-indigo-600 px-8">Configurar Script de Triagem <ArrowRight className="ml-2 w-4 h-4" /></Button>
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
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 px-3 py-1 text-sm font-bold">PASSO 4</Badge>
                                <h2 className="text-2xl font-bold text-slate-800">IA Copilot: Sugestões PBE</h2>
                                {isFallbackMode && (
                                    <Badge variant="outline" className="text-[10px] border-amber-200 bg-amber-50 text-amber-700 font-black flex items-center gap-1 uppercase">
                                        <AlertTriangle className="w-2.5 h-2.5" /> Modo Offline
                                    </Badge>
                                )}
                            </div>
                            <div className="text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase">
                                Base: {isFallbackMode ? 'Protocolos PBE Axiom' : 'Gemini AI + Evidência'}
                            </div>
                        </div>

                        {isAnalyzing ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                                <p className="text-slate-500 font-medium italic animate-pulse">Consultando base de evidências ricas...</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <Card className="border-indigo-200 ring-1 ring-indigo-50 bg-white">
                                        <CardHeader className="bg-indigo-50/50 pb-4">
                                            <CardTitle className="text-lg flex items-center gap-2 text-indigo-900">
                                                <Bot className="w-5 h-5" /> Testes Físicos Sugeridos
                                            </CardTitle>
                                            <CardDescription>Baseado na HMA e na região selecionada.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="pt-6">
                                            <TooltipProvider delayDuration={0}>
                                                <ul className="space-y-3">
                                                    {(suggestions?.tests || []).map((t: any, i: number) => (
                                                        <li key={i} className={cn(
                                                            "p-3 rounded-lg border group/item transition-all",
                                                            t.isNeurological ? "bg-amber-50 border-amber-100" : "bg-slate-50 border-slate-100"
                                                        )}>
                                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                                <div className="flex items-center gap-2">
                                                                    <div className={cn("w-1.5 h-1.5 rounded-full", t.isNeurological ? "bg-amber-500" : "bg-indigo-500")} />
                                                                    <span className="font-bold text-slate-800">{t.name}</span>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                                                                                <Info className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent side="right" className="max-w-[280px] p-4 bg-white border-2 border-slate-100 shadow-2xl rounded-xl">
                                                                            <div className="space-y-3">
                                                                                <div className="space-y-1">
                                                                                    <p className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">Execução do Teste</p>
                                                                                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                                                                        {t.description || "Descrição técnica sendo processada pelo copiloto..."}
                                                                                    </p>
                                                                                </div>
                                                                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50">
                                                                                    <div className="bg-green-50 p-2 rounded-lg">
                                                                                        <p className="text-[9px] font-bold text-green-700 uppercase">Sensibilidade</p>
                                                                                        <p className="text-xs font-black text-green-900">{t.sn || "N/A"}</p>
                                                                                    </div>
                                                                                    <div className="bg-blue-50 p-2 rounded-lg">
                                                                                        <p className="text-[9px] font-bold text-blue-700 uppercase">Especificidade</p>
                                                                                        <p className="text-xs font-black text-blue-900">{t.sp || "N/A"}</p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </div>
                                                                {t.isNeurological && <Badge className="bg-amber-100 text-amber-700 text-[9px] h-4">ALERTA NEURO</Badge>}
                                                            </div>
                                                            <p className="text-xs text-slate-500 pl-3.5 leading-relaxed">{t.reason}</p>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </TooltipProvider>
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
                                                {(suggestions?.promps || []).map((s: any, i: number) => (
                                                    <li key={i} className="flex items-center justify-between bg-purple-50/30 p-4 rounded-xl border border-purple-100">
                                                        <div className="flex items-center gap-3">
                                                            <FileText className="w-4 h-4 text-purple-600" />
                                                            <span className="font-bold text-slate-700">{s.name}</span>
                                                        </div>
                                                        <Button size="sm" variant="ghost" className="text-purple-700 hover:text-purple-800 hover:bg-purple-100 font-bold">Ver Escala</Button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                    </Card>
                                </div>

                                <Card className="border-green-200 bg-green-50/20">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg text-green-900 flex items-center gap-2">
                                            <CheckCircle2 className="w-5 h-5" /> Hipóteses & Triagem
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex flex-wrap gap-2">
                                            {(suggestions?.hypotheses || []).map((h: string, i: number) => (
                                                <Badge key={i} variant="secondary" className="bg-white border text-slate-700 font-bold px-3 py-1">
                                                    {h}
                                                </Badge>
                                            ))}
                                        </div>
                                        {Object.values(flags).some(v => v) ? (
                                            <div className="flex items-start gap-4 p-4 bg-amber-50 border border-amber-200 rounded-lg animate-in fade-in duration-500">
                                                <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                                                <div className="space-y-1">
                                                    <p className="font-bold text-amber-900 text-sm uppercase">Alerta de Segurança (Flags detectadas)</p>
                                                    <p className="text-xs text-amber-800 leading-relaxed">
                                                        Foram identificados potenciais sinais de alerta. <strong>Continue a investigação com cautela</strong>, adaptando os testes físicos à tolerância do paciente. A decisão clínica final será consolidada após o término do exame completo.
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-start gap-4 p-4 bg-green-100/50 border border-green-200 rounded-lg">
                                                <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
                                                <div className="space-y-1">
                                                    <p className="font-bold text-green-900 uppercase text-xs">Sem alertas críticos</p>
                                                    <p className="text-xs text-green-800">Prossiga para o exame físico seguindo o roteiro sugerido.</p>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </>
                        )}

                        <div className="flex justify-between pt-8">
                            <Button variant="ghost" onClick={prevStep}><ArrowLeft className="mr-2 w-4 h-4" /> Voltar</Button>
                            <Button onClick={nextStep} className="bg-indigo-600 px-12 h-12 text-lg font-bold">
                                Prosseguir para Exame <ListChecks className="ml-2 w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                );

            case 'exam':
                const isSpine = selectedRegions.some(r => r.includes('spine'));
                const hasNeuroSuggestion = suggestions?.tests?.some((t: any) => t.isNeurological);

                return (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 px-3 py-1 text-sm font-bold">PASSO 5</Badge>
                                <h2 className="text-2xl font-bold text-slate-800">Execução do Exame Físico</h2>
                            </div>
                            <div className="text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase">
                                Paciente ID: {patientId.slice(0, 8)}
                            </div>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-8">
                            {/* Movement Assessment */}
                            <div className="space-y-6">
                                <Card className="border-2 border-slate-100 shadow-sm overflow-hidden">
                                    <CardHeader className="bg-slate-50/50 border-b pb-3">
                                        <div className="flex items-center gap-2">
                                            <Activity className="w-5 h-5 text-indigo-600" />
                                            <CardTitle className="text-sm font-black uppercase text-slate-700 tracking-tight">Avaliação de Movimento Ativo</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-6 space-y-8">
                                        {selectedRegions.map((regionId) => {
                                            const isRegionSpine = regionId.includes('spine');
                                            const regionLabel = [
                                                { id: 'spine_lumbar', label: 'Lombar' },
                                                { id: 'spine_cervical', label: 'Cervical' },
                                                { id: 'shoulder', label: 'Ombro' },
                                                { id: 'knee', label: 'Joelho' },
                                                { id: 'ankle_foot', label: 'Tornozelo/Pé' },
                                                { id: 'hip', label: 'Quadril' },
                                            ].find(r => r.id === regionId)?.label || regionId;

                                            const movements = isRegionSpine
                                                ? ['Flexão', 'Extensão', 'Inclinação Lateral', 'Rotação']
                                                : ['Flexão', 'Extensão', 'Abdução', 'Adução', 'Rotação Interna', 'Rotação Externa'];

                                            return (
                                                <div key={regionId} className="space-y-3">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="w-1 h-4 bg-indigo-600 rounded-full" />
                                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{regionLabel}</span>
                                                    </div>
                                                    {movements.map((m) => {
                                                        const key = `${regionId}_${m}`;
                                                        return (
                                                            <div key={key} className="group flex flex-col gap-2 p-3 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50/50 transition-all">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-xs font-bold text-slate-600">{m}</span>
                                                                    <div className="flex gap-1.5">
                                                                        {['Normal', 'Limitado', 'Doloroso'].map((status) => (
                                                                            <button
                                                                                key={status}
                                                                                onClick={() => setExamData((prev: any) => ({
                                                                                    ...prev,
                                                                                    movements: { ...prev.movements, [key]: status }
                                                                                }))}
                                                                                className={cn(
                                                                                    "px-3 py-1 text-[9px] font-black rounded-md border-2 transition-all",
                                                                                    examData.movements[key] === status
                                                                                        ? status === 'Doloroso' ? "bg-red-600 border-red-600 text-white shadow-lg shadow-red-100"
                                                                                            : status === 'Limitado' ? "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-100"
                                                                                                : "bg-green-600 border-green-600 text-white shadow-lg shadow-green-100"
                                                                                        : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                                                                                )}
                                                                            >
                                                                                {status.toUpperCase()}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })}
                                    </CardContent>
                                </Card>

                                <Card className="border-2 border-indigo-100 bg-indigo-50/10">
                                    <CardHeader className="pb-3 border-b border-indigo-50">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-indigo-600" />
                                            <CardTitle className="text-sm font-black uppercase text-indigo-900">Observações Clínicas</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        <textarea
                                            className="w-full min-h-[100px] bg-white border-2 border-indigo-50 rounded-xl p-4 text-sm focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 outline-none transition-all placeholder:text-slate-300"
                                            placeholder="Descreva padrões de compensação, desvios ou comportamentos observados..."
                                        />
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Neurological Screen (Dynamic) */}
                            {(isSpine || hasNeuroSuggestion) ? (
                                <Card className="border-2 border-amber-200 ring-8 ring-amber-50 shadow-xl shadow-amber-100/20 overflow-hidden">
                                    <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Zap className="w-6 h-6 animate-pulse" />
                                                <CardTitle className="text-lg font-black uppercase tracking-widest">Triagem Neurológica</CardTitle>
                                            </div>
                                            <Badge className="bg-white/20 text-white border-none text-[10px]">CRÍTICO</Badge>
                                        </div>
                                        <CardDescription className="text-white/80 font-medium">Avaliação de Integridade de Raiz Nervosa</CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-8 space-y-8">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-xs font-black text-amber-900 uppercase tracking-tighter">Dermatômos (Sensibilidade)</Label>
                                                <span className="text-[10px] text-amber-600 font-bold uppercase">Marque os níveis alterados</span>
                                            </div>
                                            <div className="flex flex-wrap gap-3">
                                                {(isSpine && selectedRegions.some(r => r.includes('lumbar')) ? ['L1', 'L2', 'L3', 'L4', 'L5', 'S1', 'S2'] : ['C4', 'C5', 'C6', 'C7', 'C8', 'T1']).map(d => (
                                                    <button
                                                        key={d}
                                                        onClick={() => {
                                                            const current = examData.neurological.dermatomes;
                                                            setExamData((prev: any) => ({
                                                                ...prev,
                                                                neurological: {
                                                                    ...prev.neurological,
                                                                    dermatomes: current.includes(d) ? current.filter((x: string) => x !== d) : [...current, d]
                                                                }
                                                            }));
                                                        }}
                                                        className={cn(
                                                            "w-12 h-12 rounded-xl border-2 flex items-center justify-center font-black text-sm transition-all shadow-sm",
                                                            examData.neurological.dermatomes.includes(d)
                                                                ? "bg-amber-600 border-amber-600 text-white scale-110 rotate-3 shadow-lg shadow-amber-200"
                                                                : "bg-white border-amber-100 text-amber-500 hover:border-amber-300"
                                                        )}
                                                    >
                                                        {d}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-6 border-t-2 border-amber-100 border-dashed">
                                            <Label className="text-xs font-black text-amber-900 uppercase tracking-tighter">Miótoms (Força Muscular segmentar)</Label>
                                            <div className="grid gap-3">
                                                {(isSpine && selectedRegions.some(r => r.includes('lumbar')) ?
                                                    ['L2 Flex. Quadril', 'L3 Ext. Joelho', 'L4 Dorsiflex.', 'L5 Ext. Hálux', 'S1 Plantiflex.'] :
                                                    ['C5 Abd. Ombro', 'C6 Flex. Cotovelo', 'C7 Ext. Cotovelo', 'C8 Flex. Dedos', 'T1 Abd. Dedos']
                                                ).map(m => (
                                                    <div key={m} className="flex items-center justify-between p-3 bg-amber-50/50 rounded-xl border border-amber-100 group">
                                                        <span className="text-xs font-black text-amber-900">{m}</span>
                                                        <div className="flex gap-2">
                                                            {[0, 1, 2, 3, 4, 5].map(grade => (
                                                                <button
                                                                    key={grade}
                                                                    onClick={() => setExamData((prev: any) => ({
                                                                        ...prev,
                                                                        neurological: { ...prev.neurological.myotomes, [m]: grade }
                                                                    }))}
                                                                    className={cn(
                                                                        "w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-black transition-all",
                                                                        examData.neurological.myotomes?.[m] === grade
                                                                            ? "bg-amber-600 text-white shadow-md shadow-amber-200 scale-110"
                                                                            : "bg-white text-amber-400 border border-amber-100 hover:bg-amber-100"
                                                                    )}
                                                                >
                                                                    {grade}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-[10px] text-amber-500 italic text-center">Escala de 0 a 5 (Medical Research Council - MRC)</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card className="border-2 border-slate-100 bg-slate-50/50 flex flex-col items-center justify-center p-8 text-center space-y-4 h-full">
                                    <ShieldAlert className="w-12 h-12 text-slate-200" />
                                    <div className="space-y-2">
                                        <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Triagem Neuro No Necessária</p>
                                        <p className="text-[11px] text-slate-400 max-w-[200px]">Baseado no relato e região, não há sinais de compressão radicular latente.</p>
                                    </div>
                                </Card>
                            )}

                            {/* Special Tests Recording */}
                            <Card className="border-2 border-slate-100 lg:col-span-2 shadow-sm overflow-hidden">
                                <CardHeader className="bg-slate-50/50 border-b py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <ListChecks className="w-5 h-5 text-indigo-600" />
                                            <CardTitle className="text-sm font-black text-slate-700 uppercase tracking-tight">Testes Especiais Sugeridos (AI Copilot)</CardTitle>
                                        </div>
                                        <Badge className="bg-green-100 text-green-700 border-none font-black text-[9px]">PBE ALIGNED</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-8">
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {(suggestions?.tests || []).filter((t: any) => !t.isNeurological).map((t: any, i: number) => (
                                            <div key={i} className="group p-5 rounded-2xl border-2 border-slate-50 bg-white hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-50/50 transition-all flex flex-col gap-4">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-black text-slate-800 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{t.name}</p>
                                                    <p className="text-[11px] text-slate-400 leading-snug">{t.reason}</p>
                                                </div>
                                                <div className="flex gap-2 mt-auto">
                                                    {['Positivo', 'Negativo'].map(res => (
                                                        <button
                                                            key={res}
                                                            onClick={() => setExamData((prev: any) => ({
                                                                ...prev,
                                                                specialTests: { ...prev.specialTests, [t.name]: res }
                                                            }))}
                                                            className={cn(
                                                                "flex-1 py-2 rounded-xl text-[10px] font-black border-2 transition-all",
                                                                examData.specialTests[t.name] === res
                                                                    ? res === 'Positivo'
                                                                        ? "bg-red-500 border-red-500 text-white shadow-lg shadow-red-100"
                                                                        : "bg-green-500 border-green-500 text-white shadow-lg shadow-green-100"
                                                                    : "bg-white border-slate-50 text-slate-400 hover:bg-slate-50"
                                                            )}
                                                        >
                                                            {res.toUpperCase()}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="flex justify-between items-center pt-12">
                            <Button variant="ghost" onClick={prevStep} className="font-bold text-slate-400 hover:text-slate-600">
                                <ArrowLeft className="mr-2 w-4 h-4" /> REVISAR ANÁLISE
                            </Button>

                            <div className="flex gap-4">
                                <Button variant="outline" className="border-2 border-slate-100 font-bold px-8 h-14 rounded-2xl">
                                    IMPRIMIR ROTEIRO
                                </Button>
                                <Button
                                    onClick={async () => {
                                        setIsAnalyzing(true);
                                        setCurrentStep('report');
                                        try {
                                            const res = await generateFinalReport({
                                                hma,
                                                qp,
                                                regions: selectedRegions,
                                                flags,
                                                examData
                                            });

                                            if (res.success) {
                                                setFinalReport(res.data);
                                            } else {
                                                toast.error("Erro ao gerar laudo: " + res.msg);
                                            }
                                        } catch (error) {
                                            console.error(error);
                                            toast.error("Erro crítico ao processar laudo.");
                                        } finally {
                                            setIsAnalyzing(false);
                                        }
                                    }}
                                    className="bg-indigo-600 hover:bg-indigo-700 px-12 h-14 text-xl font-black rounded-2xl shadow-2xl shadow-indigo-200 group overflow-hidden relative"
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        GERAR LAUDO FINAL <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                </Button>
                            </div>
                        </div>
                    </div>
                );

            case 'report':
                return (
                    <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500 pb-20">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="bg-green-100 p-4 rounded-full">
                                <CheckCircle2 className="w-10 h-10 text-green-600" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-800">Avaliação Concluída</h2>
                            <p className="text-slate-500 max-w-lg">O IA Copilot cruzou todos os achados e gerou uma síntese diagnóstica baseada em evidências.</p>
                        </div>

                        {isAnalyzing ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <div className="relative">
                                    <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Bot className="w-5 h-5 text-indigo-400" />
                                    </div>
                                </div>
                                <p className="text-slate-400 font-bold italic animate-pulse tracking-widest text-xs uppercase">Consolidando achados clínicos...</p>
                            </div>
                        ) : (
                            <div className="grid lg:grid-cols-3 gap-8">
                                {/* Left Side: Clinical Summary */}
                                <div className="lg:col-span-2 space-y-6">
                                    <Card className="border-t-4 border-t-indigo-600 shadow-2xl shadow-indigo-100">
                                        <CardHeader className="border-b bg-slate-50/50">
                                            <CardTitle className="text-xl font-black text-slate-800 uppercase tracking-tight">Síntese Diagnóstica Fisioterapêutica</CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-8 space-y-8">
                                            <div className="space-y-3">
                                                <Badge className="bg-indigo-100 text-indigo-700 uppercase font-black text-[10px]">Impressão Clínica</Badge>
                                                <p className="text-lg font-bold text-slate-700 leading-relaxed italic border-l-4 border-indigo-200 pl-4">
                                                    "{finalReport?.diagnostic}"
                                                </p>
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-8">
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2 text-indigo-900 font-black text-xs uppercase">
                                                        <Activity className="w-4 h-4" /> Principais Objetivos
                                                    </div>
                                                    <ul className="space-y-2">
                                                        {['Reduzir periferização da dor', 'Restaurar ADM de flexão', 'Melhorar força de miótomo L5'].map(o => (
                                                            <li key={o} className="flex items-center gap-2 text-sm text-slate-600">
                                                                <div className="w-1 h-1 rounded-full bg-indigo-400" /> {o}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2 text-indigo-900 font-black text-xs uppercase">
                                                        <Sparkles className="w-4 h-4" /> Plano de Conduta sugerido
                                                    </div>
                                                    <p className="text-sm text-slate-500 leading-relaxed">{finalReport?.conduct}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 space-y-2">
                                            <p className="text-[10px] font-black text-amber-700 uppercase">Prognóstico</p>
                                            <p className="text-sm font-bold text-amber-900">Bom (Melhora esperada em 4-6 semanas com aderência ao plano).</p>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                                            <p className="text-[10px] font-black text-slate-500 uppercase">Frequência Recomendada</p>
                                            <p className="text-sm font-bold text-slate-700">{finalReport?.plan}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Quick Stats & Export */}
                                <div className="space-y-6">
                                    <Card className="bg-slate-900 text-white border-none shadow-xl">
                                        <CardHeader>
                                            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Dados Consolidados</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex justify-between items-end border-b border-slate-800 pb-3">
                                                <span className="text-[10px] text-slate-500 font-bold uppercase">Testes Realizados</span>
                                                <span className="text-2xl font-black text-indigo-400">{(suggestions?.tests?.length || 0)}</span>
                                            </div>
                                            <div className="flex justify-between items-end border-b border-slate-800 pb-3">
                                                <span className="text-[10px] text-slate-500 font-bold uppercase">Alertas Ativos</span>
                                                <span className="text-2xl font-black text-orange-400">{Object.values(flags).filter(v => v).length}</span>
                                            </div>
                                            <div className="pt-4">
                                                <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 font-black h-12 rounded-xl">
                                                    <FileText className="mr-2 w-4 h-4" /> COMPARTILHAR C/ PACIENTE
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {!readOnly && (
                                        <>
                                            <Button variant="outline" onClick={() => setCurrentStep('exam')} className="w-full h-12 font-bold border-2">
                                                VOLTAR E EDITAR EXAME
                                            </Button>

                                            <Button
                                                onClick={async () => {
                                                    if (onSave) {
                                                        await onSave({
                                                            hma,
                                                            qp,
                                                            regions: selectedRegions,
                                                            flags,
                                                            suggestions,
                                                            examData,
                                                            report: finalReport,
                                                            _record_type: 'Trilha Inteligente IA'
                                                        });
                                                    }
                                                    toast.success("Prontuário salvo com sucesso!");
                                                    setCurrentStep('welcome');
                                                }}
                                                className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-green-100"
                                            >
                                                SALVAR NO PRONTUÁRIO
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                );
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-32">
            {/* Minimal Progress Bar */}
            {currentStep !== 'welcome' && (
                <div className="w-full bg-slate-100 rounded-full h-1 mb-8 overflow-hidden">
                    <div
                        className="bg-indigo-600 h-full transition-all duration-700 ease-in-out"
                        style={{
                            width: `${({
                                welcome: 0,
                                hma: 15,
                                region: 30,
                                flags: 45,
                                analysis: 60,
                                exam: 80,
                                report: 100
                            } as any)[currentStep]}%`
                        }}
                    />
                </div>
            )}

            <div className="animate-in fade-in duration-700">
                {renderStep()}
            </div>
        </div>
    );
}
