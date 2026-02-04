"use client";

import { useState, useEffect, useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Mic, Dumbbell, Brain, CheckCircle, AlertTriangle, Save, Sparkles, Activity, Calendar } from "lucide-react";
import { toast } from "sonner";
import { VoiceRecorder } from "@/components/ui/voice-recorder";
import { getExercises, generateAIEvolution, saveClinicalEvolution, createExercise } from "../actions/evolution-actions";
import { DynamicInterventionCard } from "./DynamicInterventionCard";
import { ExerciseCommandCenter } from "./ExerciseCommandCenter";

// --- SCHEMA & TYPES ---
const exerciseSchema = z.object({
    exercise_id: z.string().min(1, "Selecione um exercício"),
    sets: z.coerce.number().optional(),
    reps: z.coerce.number().optional(),
    load_value: z.string().optional(),
    parameters: z.record(z.string(), z.any()).optional().nullable(),
    pain_during: z.coerce.number().min(0).max(10).default(0),
    pain_after: z.coerce.number().min(0).max(10).default(0),
    pain_next_morning: z.coerce.number().min(0).max(10).default(0),
    rpe: z.coerce.number().min(0).max(10).default(0)
});

const formSchema = z.object({
    evolution_text: z.string().min(10, "A evolução deve ter pelo menos 10 caracteres"),
    exercises: z.array(exerciseSchema).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface FisioterapiaEvolutionFormProps {
    patientId: string;
    attendanceId?: string;
    initialData?: any;
    onSave?: (data: any) => void;
}

export function FisioterapiaEvolutionForm({ patientId, attendanceId, initialData, onSave }: FisioterapiaEvolutionFormProps) {
    const [activeTab, setActiveTab] = useState("voice");
    const [exercisesList, setExercisesList] = useState<any[]>([]);
    const [isPending, startTransition] = useTransition();

    // Modal State
    const [creationModalOpen, setCreationModalOpen] = useState(false);
    const [pendingExerciseName, setPendingExerciseName] = useState("");
    const [pendingCategory, setPendingCategory] = useState("Cinesioterapia");
    const [isCreatingExercise, setIsCreatingExercise] = useState(false);

    // AI State
    const [aiSuggestions, setAiSuggestions] = useState<any>(null);
    const [loadingAI, setLoadingAI] = useState(false);

    // Engine State
    const [currentPhase, setCurrentPhase] = useState("2");
    const [tissueType, setTissueType] = useState("muscle");

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            evolution_text: initialData?.evolution_text || "",
            exercises: (initialData?.exercises || []).map((ex: any) => ({
                exercise_id: ex.exercise_id,
                sets: Number(ex.sets || 3),
                reps: Number(ex.reps || 10),
                load_value: ex.load_value || "",
                pain_during: Number(ex.pain_during || 0),
                pain_after: Number(ex.pain_after || 0),
                pain_next_morning: Number(ex.pain_next_morning || 0),
                rpe: Number(ex.rpe || 0)
            }))
        }
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "exercises"
    });

    useEffect(() => {
        getExercises().then(data => setExercisesList(data || []));
    }, []);

    const handleSelectExercise = (ex: any) => {
        if (!exercisesList.find(e => e.id === ex.id)) {
            setExercisesList(prev => [...prev, ex]);
        }
        append({
            exercise_id: ex.id,
            sets: 3,
            reps: 10,
            load_value: "",
            pain_during: 0,
            pain_after: 0,
            pain_next_morning: 0,
            rpe: 0
        });
    };

    const handleRequestCreate = (name: string) => {
        setPendingExerciseName(name);
        setCreationModalOpen(true);
    };

    const confirmCreateExercise = async () => {
        setIsCreatingExercise(true);
        const result = await createExercise({
            name: pendingExerciseName,
            category: pendingCategory,
            modality_type: 'Custom'
        });

        if (result.success && result.data) {
            toast.success(`'${result.data.name}' criado com sucesso!`);
            setExercisesList(prev => [...prev, result.data]);
            handleSelectExercise(result.data);
            setCreationModalOpen(false);
        } else {
            toast.error("Erro ao criar exercício.");
        }
        setIsCreatingExercise(false);
    }

    const handleVoiceTranscription = async (text: string) => {
        form.setValue("evolution_text", text);
        handleGenerateAI("audio", text);
    };

    const handleGenerateAI = async (mode: 'audio' | 'structured', transcript?: string) => {
        setLoadingAI(true);
        const structured = form.getValues("exercises");
        const result = await generateAIEvolution({
            mode,
            transcript: transcript || form.getValues("evolution_text"),
            structured_data: structured,
            patient_id: patientId,
            clinical_context: { current_phase: Number(currentPhase), tissue_type: tissueType }
        });
        setLoadingAI(false);

        if (result.success && result.data) {
            form.setValue("evolution_text", result.data.evolution_text);
            setAiSuggestions(result.data);
            toast.success("Evolução gerada com sucesso!");
            if (activeTab === 'structured') {
                setActiveTab('preview');
            }
        } else {
            toast.error("Erro ao gerar evolução com IA.");
        }
    };

    const onSubmit = async (data: FormValues) => {
        startTransition(async () => {
            if (attendanceId && data.exercises?.length) {
                await saveClinicalEvolution(attendanceId, {
                    evolution_text: data.evolution_text,
                    exercises: data.exercises as any
                });
            }
            if (onSave) {
                onSave({ ...data, ai_suggestions: aiSuggestions });
            }
        });
    };

    return (
        <div className="max-w-6xl mx-auto pb-20 animate-in fade-in duration-500">
            {/* HEADER PREMIUM V3 INSPIRED */}
            <div className="mb-8 p-6 rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white shadow-2xl relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-purple-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 animate-pulse delay-1000"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-sm px-3 py-1 text-[10px] uppercase tracking-widest">
                                <Sparkles className="w-3 h-3 mr-1 text-yellow-300" /> Clinical Engine V2.0
                            </Badge>
                            <div className="h-1 w-1 rounded-full bg-green-400"></div>
                            <span className="text-xs font-medium text-slate-300">Online</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-1">Evolução Inteligente</h1>
                        <p className="text-indigo-200 text-sm font-medium">Capture a sessão, processe dados e gere documentação clínica perfeita.</p>
                    </div>

                    {/* SELECTORS - GLASSMORPHISM STYLE */}
                    <div className="flex gap-3">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase font-bold text-indigo-300 ml-1">Tecido Alvo</span>
                            <Select value={tissueType} onValueChange={setTissueType}>
                                <SelectTrigger className="w-[140px] h-9 bg-white/10 border-white/10 text-white font-semibold backdrop-blur-md rounded-xl hover:bg-white/20 transition-all focus:ring-0 focus:ring-offset-0">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="border-indigo-100">
                                    <SelectItem value="muscle">Músculo</SelectItem>
                                    <SelectItem value="tendon">Tendão</SelectItem>
                                    <SelectItem value="joint_ligament">Articulação</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase font-bold text-indigo-300 ml-1">Fase da Reab</span>
                            <Select value={currentPhase} onValueChange={setCurrentPhase}>
                                <SelectTrigger className="w-[160px] h-9 bg-white/10 border-white/10 text-white font-semibold backdrop-blur-md rounded-xl hover:bg-white/20 transition-all focus:ring-0 focus:ring-offset-0">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="border-indigo-100">
                                    <SelectItem value="1">1. Proteção</SelectItem>
                                    <SelectItem value="2">2. Resistência</SelectItem>
                                    <SelectItem value="3">3. Força</SelectItem>
                                    <SelectItem value="4">4. Potência</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODERN TABS */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
                <div className="flex justify-center mb-8">
                    <TabsList className="bg-white border border-slate-100 shadow-sm p-1.5 rounded-full h-auto inline-flex gap-2">
                        <TabsTrigger value="voice" className="rounded-full px-6 py-2.5 text-xs font-bold uppercase tracking-wide data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                            <Mic className="w-4 h-4 mr-2" /> Voz & Rascunho
                        </TabsTrigger>
                        <TabsTrigger value="structured" className="rounded-full px-6 py-2.5 text-xs font-bold uppercase tracking-wide data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                            <Activity className="w-4 h-4 mr-2" /> Dados & Conduta
                        </TabsTrigger>
                        <TabsTrigger value="preview" className="rounded-full px-6 py-2.5 text-xs font-bold uppercase tracking-wide data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                            <CheckCircle className="w-4 h-4 mr-2" /> Validar & Salvar
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* --- CONTENT: VOICE --- */}
                <TabsContent value="voice" className="focus-visible:ring-0 outline-none">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        <Card className="border-0 shadow-xl bg-gradient-to-b from-white to-slate-50 overflow-hidden ring-1 ring-slate-100">
                            <CardHeader className="pb-2 bg-white">
                                <CardTitle className="flex items-center gap-2 text-slate-800">
                                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Mic size={20} /></div>
                                    Gravador Inteligente
                                </CardTitle>
                                <CardDescription>Dite o que foi feito na sessão. Ex: "Evoluímos carga no agachamento..."</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 flex justify-center bg-slate-50/50">
                                <div className="p-4 bg-white rounded-full shadow-lg border border-slate-100 hover:scale-105 transition-transform duration-300 cursor-pointer">
                                    <VoiceRecorder onTranscriptionComplete={handleVoiceTranscription} className="scale-125" />
                                </div>
                            </CardContent>
                        </Card>

                        <div className="space-y-4">
                            <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
                                <Textarea
                                    {...form.register("evolution_text")}
                                    className="min-h-[240px] border-0 focus-visible:ring-0 p-6 text-lg text-slate-600 leading-relaxed resize-none rounded-xl bg-transparent"
                                    placeholder="A transcrição aparecerá aqui..."
                                />
                            </div>
                            <Button
                                onClick={() => handleGenerateAI('audio')}
                                disabled={loadingAI}
                                className="w-full h-14 bg-indigo-900 hover:bg-slate-900 text-white rounded-xl shadow-xl shadow-indigo-200 font-bold text-base transition-all hover:-translate-y-1"
                            >
                                {loadingAI ? <Loader2 className="animate-spin mr-2" /> : <Brain className="mr-2" />}
                                Processar Evolução com AI
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                {/* --- CONTENT: STRUCTURED --- */}
                <TabsContent value="structured" className="focus-visible:ring-0 outline-none">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-[800px]">
                        {/* Sidebar (4 cols) */}
                        <div className="lg:col-span-4 h-full flex flex-col">
                            <ExerciseCommandCenter
                                exercises={exercisesList}
                                onSelect={handleSelectExercise}
                                onCreate={handleRequestCreate}
                            />
                        </div>

                        {/* Main Feed (8 cols) */}
                        <div className="lg:col-span-8 h-full flex flex-col bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                            <div className="p-4 border-b border-slate-100 bg-white flex justify-between items-center">
                                <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Linha do Tempo da Sessão</span>
                                <Badge variant="secondary" className="text-xs font-bold text-slate-500">{fields.length} itens</Badge>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                {fields.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-300">
                                        <Dumbbell className="w-16 h-16 mb-4 opacity-20" />
                                        <p className="text-sm font-medium">Sessão vazia</p>
                                        <p className="text-xs">Utilize o menu lateral para adicionar condutas.</p>
                                    </div>
                                ) : (
                                    fields.map((field, index) => {
                                        const exercise = exercisesList.find(e => e.id === field.exercise_id);
                                        let modalityType: any = 'Cinesioterapia';
                                        if (exercise?.category.includes('Recursos') || exercise?.name.includes('Laser')) modalityType = 'Fotobiomodulação';
                                        if (exercise?.is_pilates) modalityType = 'Pilates';

                                        return (
                                            <DynamicInterventionCard
                                                key={field.id}
                                                id={field.id}
                                                name={exercise?.name || "Exercício"}
                                                modality_type={modalityType}
                                                default_load_type={exercise?.default_load_type}
                                                onRemove={() => remove(index)}
                                                onUpdate={(data: any) => {
                                                    // Sync logic simplified for demo
                                                    if (data.sets) form.setValue(`exercises.${index}.sets`, Number(data.sets));
                                                    if (data.reps) form.setValue(`exercises.${index}.reps`, Number(data.reps));
                                                    if (data.load) form.setValue(`exercises.${index}.load_value`, data.load);
                                                }}
                                            />
                                        );
                                    })
                                )}
                            </div>

                            <div className="p-4 bg-white border-t border-slate-100">
                                <Button
                                    onClick={() => handleGenerateAI('structured')}
                                    disabled={loadingAI || fields.length === 0}
                                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-100 font-bold"
                                >
                                    {loadingAI ? <Loader2 className="animate-spin mr-2" /> : <Brain className="mr-2" />}
                                    Gerar Texto da Evolução
                                </Button>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* --- CONTENT: PREVIEW --- */}
                <TabsContent value="preview" className="focus-visible:ring-0 outline-none">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-4">
                            <Card className="border-0 shadow-lg ring-1 ring-slate-100 bg-white">
                                <CardHeader className="bg-emerald-50/50 border-b border-emerald-50 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700"><CheckCircle size={20} /></div>
                                        <div>
                                            <CardTitle className="text-emerald-900 text-lg">Evolução Final</CardTitle>
                                            <CardDescription>Revise o texto gerado antes de salvar.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Textarea
                                        {...form.register("evolution_text")}
                                        className="min-h-[400px] border-0 focus-visible:ring-0 p-8 text-lg leading-relaxed resize-none shadow-none text-slate-700 font-sans"
                                    />
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            {/* AI TUTOR WIDGETS */}
                            {aiSuggestions && (
                                <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
                                    {aiSuggestions.load_suggestions?.length > 0 && (
                                        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 shadow-sm">
                                            <h4 className="text-xs font-black uppercase text-orange-800 flex items-center gap-2 mb-3">
                                                <AlertTriangle size={14} /> Sugestões de Carga
                                            </h4>
                                            <div className="space-y-2">
                                                {aiSuggestions.load_suggestions.map((sug: any, i: number) => (
                                                    <div key={i} className="bg-white p-3 rounded-xl border border-orange-100 shadow-sm text-xs">
                                                        <div className="font-bold text-slate-800 mb-1">{sug.exercise}</div>
                                                        <p className="text-slate-500 leading-snug">{sug.reason}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <Button
                                onClick={form.handleSubmit(onSubmit)}
                                disabled={isPending}
                                className="w-full h-16 text-lg font-bold bg-green-600 hover:bg-green-700 text-white rounded-2xl shadow-xl shadow-green-200 transition-all hover:scale-[1.02]"
                            >
                                {isPending ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
                                Salvar Atendimento
                            </Button>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {/* MODAL (Invisible until triggered) */}
            <Dialog open={creationModalOpen} onOpenChange={setCreationModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nova Conduta</DialogTitle>
                        <DialogDescription>Classifique "{pendingExerciseName}" para o sistema.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label>Categoria</Label>
                        <Select value={pendingCategory} onValueChange={setPendingCategory}>
                            <SelectTrigger className="w-full mt-2"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Cinesioterapia">Cinesioterapia</SelectItem>
                                <SelectItem value="Eletroterapia">Eletroterapia</SelectItem>
                                <SelectItem value="Fotobiomodulação">Fotobiomodulação</SelectItem>
                                <SelectItem value="Terapia Manual">Terapia Manual</SelectItem>
                                <SelectItem value="Pilates">Pilates</SelectItem>
                                <SelectItem value="Recovery">Recovery</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreationModalOpen(false)}>Cancelar</Button>
                        <Button onClick={confirmCreateExercise} disabled={isCreatingExercise}>
                            {isCreatingExercise ? <Loader2 className="animate-spin" /> : "Salvar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default FisioterapiaEvolutionForm;
