"use client";

import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SmartAssessmentSchema, SmartAssessmentValues } from "../schemas/smart-assessment-schema"; // Updated import
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTransition, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Loader2, Save, FileText, Activity, Microscope, ArrowLeft, ArrowRight, ShieldAlert, Sparkles, Bot, AlertTriangle, Target, CheckCircle } from "lucide-react";
import { submitPBE } from "../actions/submit-pbe";
import { generateSmartAssessmentReport } from "@/actions/anamnesis";
import { cn } from "@/lib/utils";

// Region Imports - Assumes these were copied to the new location
import { LumbarSpineForm } from "./regions/spine-lumbar-form";
import { KneeForm } from "./regions/knee-form";
import { ShoulderForm } from "./regions/shoulder-form";
import { AnkleForm } from "./regions/ankle-form";
import { HipForm } from "./regions/hip-form";
import { CervicalSpineForm } from "./regions/spine-cervical-form";
import { ElbowHandForm } from "./regions/elbow-hand-form";

interface PBEFormProps {
    patientId: string;
    initialData?: Partial<SmartAssessmentValues>;
}

export default function PBEForm({ patientId, initialData }: PBEFormProps) {
    const [isPending, startTransition] = useTransition();
    const [activeTab, setActiveTab] = useState("anamnese");

    // AI Report State
    const [report, setReport] = useState<any>(null)
    const [isReportGenerating, setIsReportGenerating] = useState(false)
    const [isReportOpen, setIsReportOpen] = useState(false)

    // Form Initialization
    const form = useForm<SmartAssessmentValues>({
        resolver: zodResolver(SmartAssessmentSchema) as any,
        defaultValues: initialData || {
            qp: '', hma: '', painDuration: '', eva: 0,
            efep: { items: [{ activity: '', score: 0 }, { activity: '', score: 0 }, { activity: '', score: 0 }] },
            history: { goals: [], activityFrequency: 'sedentary' },
            redFlags: {},
            anamnesis: { mainRegion: '' },
            physicalExam: { movementQuality: {}, rom: {}, strength: {}, specialTests: {} },
            neurological: { reflexes: {}, myotomes: {}, dermatomes: [], neuralTension: {} },
            functional: { flexibility: {}, strength: {} } // Initialize functional
        }
    });

    const { watch, setValue, control, handleSubmit } = form;
    const formData = watch(); // Watch all data for legacy compatibility

    // --- LEGACY ADAPTER ---
    // Creates a compatible interface for the Region Components that expect `data` and `updateField`
    const updateFieldLegacy = useCallback((path: string, val: any) => {
        setValue(path as any, val, { shouldDirty: true, shouldTouch: true });
    }, [setValue]);

    // --- ACTIONS ---
    function onSubmit(data: SmartAssessmentValues) {
        startTransition(async () => {
            // @ts-ignore - submitPBE expects PBESchema but we are sending SmartAssessmentValues. 
            // We need to update server action type or cast here. The server action saves JSONB so it's fine.
            const result = await submitPBE(data as any, patientId);
            if (result.success) {
                toast.success("Avaliação salva com sucesso!");
            } else {
                toast.error(result.message);
            }
        });
    }

    const handleGenerateReport = async () => {
        setIsReportGenerating(true)
        setIsReportOpen(true)
        try {
            const result = await generateSmartAssessmentReport(formData)
            if (result.success && result.report) {
                setReport(result.report)
                // Optional: Save report to data
            } else {
                toast.error("Erro ao gerar relatório IA.")
            }
        } catch (e) {
            console.error(e)
        } finally {
            setIsReportGenerating(false)
        }
    }

    // --- CALCULATIONS ---
    const calculateEfepScore = () => {
        const items = formData.efep?.items || [];
        if (items.length === 0) return 0;
        const sum = items.reduce((acc: number, item: any) => acc + (Number(item?.score) || 0), 0);
        return ((sum / items.length) * 10).toFixed(0);
    }

    const mainRegion = formData.anamnesis?.mainRegion;
    const hasRedFlags = Object.values(formData.redFlags || {}).some(Boolean);


    return (
        <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-5xl mx-auto pb-20">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6 pt-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Avaliação Clínica Inteligente</h2>
                        <p className="text-muted-foreground flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4" />
                            Prática Baseada em Evidência (PBE)
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={handleGenerateReport} variant="outline" className="gap-2 border-purple-200 hover:bg-purple-50 text-purple-700">
                                    <Sparkles className="w-4 h-4" /> Análise IA (PBE)
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2 text-purple-800">
                                        <Bot className="w-5 h-5" /> Raciocínio Clínico Inteligente
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="mt-4">
                                    {isReportGenerating ? (
                                        <div className="flex flex-col items-center py-12 gap-4">
                                            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                                            <p className="text-muted-foreground">Analisando evidências e hipóteses...</p>
                                        </div>
                                    ) : report ? (
                                        // Simple report view for now, copying structure from legacy if needed
                                        <div className="space-y-6 text-sm">
                                            {/* Report content */}
                                            <pre className="whitespace-pre-wrap bg-slate-50 p-4 rounded text-xs">{JSON.stringify(report, null, 2)}</pre>
                                        </div>
                                    ) : <p className="text-center text-muted-foreground">Nenhuma análise gerada.</p>}
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Button type="submit" disabled={isPending} className="bg-green-600 hover:bg-green-700 text-white min-w-[140px]">
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Salvar Agora
                        </Button>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-slate-100/80 mb-8 rounded-xl border border-slate-200">
                        <TabsTrigger value="anamnese" className="flex-col gap-1 py-3 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-lg transition-all">
                            <FileText className="w-5 h-5 mb-1" />
                            <span className="font-semibold">1. Anamnese & Triagem</span>
                        </TabsTrigger>
                        <TabsTrigger value="physical" className="flex-col gap-1 py-3 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-lg transition-all">
                            <Microscope className="w-5 h-5 mb-1" />
                            <span className="font-semibold">2. Exame Físico Específico</span>
                        </TabsTrigger>
                        <TabsTrigger value="functional" className="flex-col gap-1 py-3 data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm rounded-lg transition-all">
                            <Activity className="w-5 h-5 mb-1" />
                            <span className="font-semibold">3. Radar Funcional</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* --- 1. ANAMNESE --- */}
                    <TabsContent value="anamnese" className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                        <div className="grid lg:grid-cols-3 gap-6">
                            {/* Left Column */}
                            <div className="lg:col-span-2 space-y-6">
                                <Card>
                                    <CardHeader className="pb-3"><CardTitle>Queixa & História</CardTitle></CardHeader>
                                    <CardContent className="space-y-4">
                                        <FormField control={control} name="qp" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold text-muted-foreground uppercase">Queixa Principal (QP)</FormLabel>
                                                <FormControl><Input {...field} placeholder="Descreva a queixa principal..." className="font-medium text-lg h-12" /></FormControl>
                                            </FormItem>
                                        )} />
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <FormField control={control} name="painDuration" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-bold text-muted-foreground uppercase">Tempo de Evolução</FormLabel>
                                                    <FormControl><Input {...field} placeholder="Ex: 3 semanas..." /></FormControl>
                                                </FormItem>
                                            )} />
                                            <FormField control={control} name="anamnesis.onset" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-bold text-muted-foreground uppercase">Início dos Sintomas</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="traumatic">Traumático</SelectItem>
                                                            <SelectItem value="insidious">Insidioso (Gradual)</SelectItem>
                                                            <SelectItem value="post_op">Pós-Operatório</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )} />
                                        </div>
                                        <FormField control={control} name="hma" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold text-muted-foreground uppercase">HMA</FormLabel>
                                                <FormControl><Textarea {...field} placeholder="História da moléstia atual..." className="min-h-[120px]" /></FormControl>
                                            </FormItem>
                                        )} />
                                    </CardContent>
                                </Card>

                                <Card className="bg-blue-50/50 border-blue-100">
                                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                        <CardTitle className="text-base text-blue-900 flex items-center gap-2">
                                            <Target className="w-5 h-5 text-blue-600" /> Funcionalidade (EFEP / PSFS)
                                        </CardTitle>
                                        <Badge variant="outline" className="bg-white text-blue-700">Score: {calculateEfepScore()}%</Badge>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {[0, 1, 2].map((idx) => (
                                            <div key={idx} className="flex gap-3 items-center">
                                                <div className="bg-white font-bold text-slate-500 px-2 py-2 rounded border min-w-[2rem] text-center text-sm">{idx + 1}</div>
                                                <FormField control={control} name={`efep.items.${idx}.activity` as any} render={({ field }) => (
                                                    <Input {...field} placeholder="Atividade..." className="bg-white flex-1" />
                                                )} />
                                                <FormField control={control} name={`efep.items.${idx}.score` as any} render={({ field }) => (
                                                    <Select onValueChange={v => field.onChange(Number(v))} value={String(field.value || 0)}>
                                                        <SelectTrigger className="w-[80px] bg-white"><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            {Array.from({ length: 11 }, (_, i) => <SelectItem key={i} value={String(i)}>{i}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                )} />
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader className="pb-3"><CardTitle className="text-base">Histórico & Hábitos</CardTitle></CardHeader>
                                    <CardContent className="space-y-4">
                                        <FormField control={control} name="history.hp" render={({ field }) => (
                                            <FormItem><FormLabel className="text-xs font-bold text-muted-foreground uppercase">História Pregressa</FormLabel><FormControl><Textarea {...field} placeholder="Cirurgias..." className="h-20" /></FormControl></FormItem>
                                        )} />
                                        <FormField control={control} name="history.medication" render={({ field }) => (
                                            <FormItem><FormLabel className="text-xs font-bold text-muted-foreground uppercase">Medicações</FormLabel><FormControl><Input {...field} placeholder="Em uso..." /></FormControl></FormItem>
                                        )} />
                                        <Separator />
                                        <FormField control={control} name="history.activityFrequency" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold text-muted-foreground uppercase">Nível de Atividade</FormLabel>
                                                <FormControl>
                                                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="space-y-1">
                                                        <div className="flex items-center space-x-2"><RadioGroupItem value="sedentary" id="s" /><Label htmlFor="s" className="font-normal text-sm">Sedentário</Label></div>
                                                        <div className="flex items-center space-x-2"><RadioGroupItem value="1x" id="1x" /><Label htmlFor="1x" className="font-normal text-sm">1-2x Semana</Label></div>
                                                        <div className="flex items-center space-x-2"><RadioGroupItem value="3x" id="3x" /><Label htmlFor="3x" className="font-normal text-sm">3-4x Semana</Label></div>
                                                        <div className="flex items-center space-x-2"><RadioGroupItem value="5x" id="5x" /><Label htmlFor="5x" className="font-normal text-sm">Atleta / 5x+</Label></div>
                                                    </RadioGroup>
                                                </FormControl>
                                            </FormItem>
                                        )} />
                                        <Separator />
                                        <div>
                                            <Label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Objetivos</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {['Reduzir Dor', 'Performance', 'Mobilidade', 'Força'].map(g => (
                                                    <FormField key={g} control={control} name="history.goals" render={({ field }) => (
                                                        <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value?.includes(g)}
                                                                    onCheckedChange={(checked) => {
                                                                        const curr = field.value || [];
                                                                        return checked ? field.onChange([...curr, g]) : field.onChange(curr.filter((value) => value !== g))
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormLabel className="font-normal text-sm">{g}</FormLabel>
                                                        </FormItem>
                                                    )} />
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-slate-900 text-white border-none">
                                    <CardHeader className="pb-2"><CardTitle className="text-lg flex justify-between">Dor (EVA) <span className="text-2xl font-bold text-blue-400">{formData.eva}/10</span></CardTitle></CardHeader>
                                    <CardContent>
                                        <FormField control={control} name="eva" render={({ field }) => (
                                            <Slider
                                                value={[field.value || 0]}
                                                onValueChange={v => field.onChange(v[0])}
                                                max={10} step={1} className="py-4"
                                            />
                                        )} />
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* --- 2. PHYSICAL EXAM --- */}
                    <TabsContent value="physical" className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">

                        {/* Region Selector */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                            <div>
                                <CardTitle className="text-blue-900 flex items-center gap-2"><Microscope className="w-5 h-5" /> Exame Físico Específico</CardTitle>
                                <CardDescription>Selecione a região para abrir a ficha técnica.</CardDescription>
                            </div>
                            <div className="min-w-[200px]">
                                <FormField control={control} name="anamnesis.mainRegion" render={({ field }) => (
                                    <FormItem>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl><SelectTrigger className="bg-white border-blue-200 text-blue-900 font-medium"><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="spine_lumbar">Coluna Lombar</SelectItem>
                                                <SelectItem value="spine_cervical">Coluna Cervical</SelectItem>
                                                <SelectItem value="shoulder">Ombro</SelectItem>
                                                <SelectItem value="knee">Joelho</SelectItem>
                                                <SelectItem value="ankle_foot">Tornozelo e Pé</SelectItem>
                                                <SelectItem value="hip">Quadril</SelectItem>
                                                <SelectItem value="elbow_hand">Cotovelo/Punho/Mão</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )} />
                            </div>
                        </div>

                        {/* Rendering Region Components using Adapter */}
                        <div className="animate-in fade-in duration-500">
                            {mainRegion === 'spine_lumbar' && <LumbarSpineForm data={formData} updateField={updateFieldLegacy} />}
                            {mainRegion === 'knee' && <KneeForm data={formData} updateField={updateFieldLegacy} />}
                            {mainRegion === 'shoulder' && <ShoulderForm data={formData} updateField={updateFieldLegacy} />}
                            {mainRegion === 'ankle_foot' && <AnkleForm data={formData} updateField={updateFieldLegacy} />}
                            {mainRegion === 'hip' && <HipForm data={formData} updateField={updateFieldLegacy} />}
                            {mainRegion === 'spine_cervical' && <CervicalSpineForm data={formData} updateField={updateFieldLegacy} />}
                            {mainRegion === 'elbow_hand' && <ElbowHandForm data={formData} updateField={updateFieldLegacy} />}

                            {!mainRegion && (
                                <div className="text-center py-12 text-muted-foreground bg-white rounded-lg border border-dashed">
                                    <Bot className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>Selecione uma região acima para carregar o formulário específico.</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* --- 3. FUNCTIONAL --- */}
                    <TabsContent value="functional" className="space-y-6">
                        <Card>
                            <CardHeader><CardTitle>Dados para Gráfico (Radar)</CardTitle><CardDescription>Alimenta o gráfico de evolução.</CardDescription></CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-sm uppercase text-slate-500 border-b pb-1">Parâmetros Clínicos</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <Label className="text-xs">Dor (EVA x 10)</Label>
                                                <Input value={(formData.eva || 0) * 10} disabled className="bg-slate-100 font-bold" />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Função (EFEP %)</Label>
                                                <Input value={calculateEfepScore()} disabled className="bg-slate-100 font-bold" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-sm uppercase text-slate-500 border-b pb-1">Força & Estabilidade</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField control={control} name="functional.strength.bridgeTest" render={({ field }) => (
                                                <FormItem><FormLabel className="text-xs">Ponte (s)</FormLabel><FormControl><Input {...field} type="number" /></FormControl></FormItem>
                                            )} />
                                            <FormField control={control} name="functional.strength.plankTest" render={({ field }) => (
                                                <FormItem><FormLabel className="text-xs">Prancha (s)</FormLabel><FormControl><Input {...field} type="number" /></FormControl></FormItem>
                                            )} />
                                            <FormField control={control} name="functional.strength.dynamometry" render={({ field }) => (
                                                <FormItem><FormLabel className="text-xs">Dinamometria (kg)</FormLabel><FormControl><Input {...field} type="number" /></FormControl></FormItem>
                                            )} />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </form>
        </Form>
    );
}
