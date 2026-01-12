"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PhysicalAssessmentSchema, PhysicalAssessmentFormValues } from "../schemas/physical-assessment-schema";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useTransition, useState, useMemo } from "react";
import { toast } from "sonner";
import { Loader2, Save, Activity, Ruler, Heart, Dumbbell, Zap, Eye, UploadCloud } from "lucide-react";
import { submitPhysicalAssessment } from "../actions/submit-physical-assessment";
import { AssessmentSidePanel } from "./sections/AssessmentSidePanel";

interface PhysicalAssessmentFormProps {
    patientId: string;
    initialData?: Partial<PhysicalAssessmentFormValues>;
}

export default function PhysicalAssessmentForm({ patientId, initialData }: PhysicalAssessmentFormProps) {
    const [isPending, startTransition] = useTransition();

    // Initial Values
    const form = useForm<PhysicalAssessmentFormValues>({
        resolver: zodResolver(PhysicalAssessmentSchema) as any,
        defaultValues: initialData || {
            anamnesis: { mainComplaint: "", hma: "", trainingLevel: "beginner", goal: "hypertrophy" },
            antro: { gender: "male", age: 0, weight: 0, height: 0, thigh: 0, suprailiac: 0, abdominal: 0 },
            cardio: { method: "rockport", timeMin: 0, heartRate: 0, distance: 0, vo2Max: 0 },
            strength: { upperBody: {}, lowerBody: {} },
            mobility: { wells: 0, legRaiseRight: 0, legRaiseLeft: 0, shoulderReachRight: 0, shoulderReachLeft: 0 },
            perimetry: {},
            vitals: { restingHeartRate: 0, bloodPressureSys: 0, bloodPressureDia: 0 },
            posture: { observations: [], alterations: {} }
        }
    });

    const { watch, control, handleSubmit, setValue } = form;
    const values = watch();


    // Submit
    const onSubmit = (data: PhysicalAssessmentFormValues) => {
        startTransition(async () => {
            const result = await submitPhysicalAssessment(data, patientId);
            if (result.success) toast.success("Avaliação salva com sucesso!");
            else toast.error(result.message);
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-20">

                {/* 1. TOP NAVIGATION */}
                <Tabs defaultValue="new" className="w-full">
                    <div className="flex justify-between items-center mb-6">
                        <TabsList className="grid w-[400px] grid-cols-2">
                            <TabsTrigger value="new">Nova Avaliação</TabsTrigger>
                            <TabsTrigger value="history">Histórico & Evolução</TabsTrigger>
                        </TabsList>
                        <Button type="submit" disabled={isPending} className="bg-green-600 hover:bg-green-700 text-white font-bold">
                            {isPending ? <Loader2 className="mr-2 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Salvar Avaliação
                        </Button>
                    </div>

                    <TabsContent value="new" className="mt-0">
                        {/* MAIN LAYOUT GRID (8/4 Columns) */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                            {/* --- LEFT COLUMN: FORM (ACCORDION) --- */}
                            <div className="lg:col-span-8 space-y-4">
                                <Accordion type="multiple" defaultValue={["anamnese", "antro", "cardio", "strength", "mobility", "posture"]} className="w-full space-y-4">

                                    {/* [Item 1] Anamnese & Sinais Vitais */}
                                    <AccordionItem value="anamnese" className="border rounded-lg bg-white shadow-sm px-4">
                                        <AccordionTrigger className="hover:no-underline"><span className="flex items-center gap-2 font-bold text-slate-700"><Activity className="w-4 h-4 text-blue-500" /> Anamnese & Sinais Vitais</span></AccordionTrigger>
                                        <AccordionContent className="pt-2 space-y-4">
                                            <FormField control={control} name="anamnesis.mainComplaint" render={({ field }) => (
                                                <FormItem><FormLabel>Queixa Principal</FormLabel><FormControl><Textarea {...field} placeholder="Descreva a queixa..." /></FormControl></FormItem>
                                            )} />
                                            <FormField control={control} name="anamnesis.hma" render={({ field }) => (
                                                <FormItem><FormLabel>HMA</FormLabel><FormControl><Textarea {...field} placeholder="História da Moléstia Atual..." /></FormControl></FormItem>
                                            )} />
                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField control={control} name="anamnesis.trainingLevel" render={({ field }) => (
                                                    <FormItem><FormLabel>Nível de Treino</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                            <SelectContent><SelectItem value="beginner">Iniciante</SelectItem><SelectItem value="intermediate">Intermediário</SelectItem><SelectItem value="advanced">Avançado</SelectItem></SelectContent></Select>
                                                    </FormItem>
                                                )} />
                                                <FormField control={control} name="anamnesis.goal" render={({ field }) => (
                                                    <FormItem><FormLabel>Objetivo Principal</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                            <SelectContent><SelectItem value="hypertrophy">Hipertrofia</SelectItem><SelectItem value="weight_loss">Emagrecimento</SelectItem><SelectItem value="rehab">Reabilitação</SelectItem><SelectItem value="performance">Performance</SelectItem></SelectContent></Select>
                                                    </FormItem>
                                                )} />
                                            </div>
                                            <div className="pt-2 border-t">
                                                <Label className="text-xs font-bold text-muted-foreground uppercase mb-3 block">Sinais Vitais</Label>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <FormField control={control} name="vitals.restingHeartRate" render={({ field }) => (
                                                        <FormItem><FormLabel>FC Repouso (bpm)</FormLabel><FormControl><Input {...field} type="number" /></FormControl></FormItem>
                                                    )} />
                                                    <FormField control={control} name="vitals.bloodPressureSys" render={({ field }) => (
                                                        <FormItem><FormLabel>PA Sistólica</FormLabel><FormControl><Input {...field} type="number" /></FormControl></FormItem>
                                                    )} />
                                                    <FormField control={control} name="vitals.bloodPressureDia" render={({ field }) => (
                                                        <FormItem><FormLabel>PA Diastólica</FormLabel><FormControl><Input {...field} type="number" /></FormControl></FormItem>
                                                    )} />
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>

                                    {/* [Item 2] Antropometria */}
                                    <AccordionItem value="antro" className="border rounded-lg bg-white shadow-sm px-4">
                                        <AccordionTrigger className="hover:no-underline"><span className="flex items-center gap-2 font-bold text-slate-700"><Ruler className="w-4 h-4 text-orange-500" /> Antropometria (Pineau)</span></AccordionTrigger>
                                        <AccordionContent className="pt-2 space-y-4">
                                            <div className="grid grid-cols-4 gap-4">
                                                <FormField control={control} name="antro.gender" render={({ field }) => (
                                                    <FormItem><FormLabel>Gênero</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                            <SelectContent><SelectItem value="male">Masculino</SelectItem><SelectItem value="female">Feminino</SelectItem></SelectContent></Select>
                                                    </FormItem>
                                                )} />
                                                <FormField control={control} name="antro.age" render={({ field }) => (
                                                    <FormItem><FormLabel>Idade</FormLabel><FormControl><Input {...field} type="number" /></FormControl></FormItem>
                                                )} />
                                                <FormField control={control} name="antro.weight" render={({ field }) => (
                                                    <FormItem><FormLabel>Peso (kg)</FormLabel><FormControl><Input {...field} type="number" /></FormControl></FormItem>
                                                )} />
                                                <FormField control={control} name="antro.height" render={({ field }) => (
                                                    <FormItem><FormLabel>Altura (cm)</FormLabel><FormControl><Input {...field} type="number" /></FormControl></FormItem>
                                                )} />
                                            </div>
                                            <div className="pt-2 border-t">
                                                <Label className="text-xs font-bold text-muted-foreground uppercase mb-3 block">Dobras Cutâneas - Ultrassom</Label>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <FormField control={control} name="antro.thigh" render={({ field }) => (
                                                        <FormItem><FormLabel>Coxa (mm)</FormLabel><FormControl><Input {...field} type="number" /></FormControl></FormItem>
                                                    )} />
                                                    <FormField control={control} name="antro.suprailiac" render={({ field }) => (
                                                        <FormItem><FormLabel>Suprailíaca (mm)</FormLabel><FormControl><Input {...field} type="number" /></FormControl></FormItem>
                                                    )} />
                                                    <FormField control={control} name="antro.abdominal" render={({ field }) => (
                                                        <FormItem><FormLabel>Abdomem (mm)</FormLabel><FormControl><Input {...field} type="number" /></FormControl></FormItem>
                                                    )} />
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>

                                    {/* [Item 3] Cardio */}
                                    <AccordionItem value="cardio" className="border rounded-lg bg-white shadow-sm px-4">
                                        <AccordionTrigger className="hover:no-underline"><span className="flex items-center gap-2 font-bold text-slate-700"><Heart className="w-4 h-4 text-red-500" /> Cardio (VO2 Max)</span></AccordionTrigger>
                                        <AccordionContent className="pt-2 space-y-4">
                                            <FormField control={control} name="cardio.method" render={({ field }) => (
                                                <FormItem><FormLabel>Protocolo</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                        <SelectContent><SelectItem value="rockport">Rockport (Caminhada)</SelectItem><SelectItem value="cooper">Cooper (Corrida)</SelectItem></SelectContent></Select>
                                                </FormItem>
                                            )} />
                                            {values.cardio?.method === 'rockport' ? (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <FormField control={control} name="cardio.timeMin" render={({ field }) => (
                                                        <FormItem><FormLabel>Tempo (min)</FormLabel><FormControl><Input {...field} type="number" /></FormControl></FormItem>
                                                    )} />
                                                    <FormField control={control} name="cardio.heartRate" render={({ field }) => (
                                                        <FormItem><FormLabel>FC Final (bpm)</FormLabel><FormControl><Input {...field} type="number" /></FormControl></FormItem>
                                                    )} />
                                                </div>
                                            ) : (
                                                <FormField control={control} name="cardio.distance" render={({ field }) => (
                                                    <FormItem><FormLabel>Distância (m)</FormLabel><FormControl><Input {...field} type="number" /></FormControl></FormItem>
                                                )} />
                                            )}
                                        </AccordionContent>
                                    </AccordionItem>

                                    {/* [Item 4] Força & Dinamometria */}
                                    <AccordionItem value="strength" className="border rounded-lg bg-white shadow-sm px-4">
                                        <AccordionTrigger className="hover:no-underline"><span className="flex items-center gap-2 font-bold text-slate-700"><Dumbbell className="w-4 h-4 text-purple-500" /> Força & Dinamometria</span></AccordionTrigger>
                                        <AccordionContent className="pt-2">
                                            <Tabs defaultValue="upper" className="w-full">
                                                <TabsList className="w-full grid grid-cols-2 mb-4">
                                                    <TabsTrigger value="upper">Membros Superiores</TabsTrigger>
                                                    <TabsTrigger value="lower">Membros Inferiores</TabsTrigger>
                                                </TabsList>
                                                <TabsContent value="upper" className="space-y-2">
                                                    {["Preensão Palmar", "Flexão Cotovelo", "Extensão Cotovelo", "Abdução Ombro"].map((ex) => (
                                                        <div key={ex} className="flex items-center gap-4">
                                                            <Label className="w-[150px] truncate" title={ex}>{ex}</Label>
                                                            <Input placeholder="Dir" className="h-8 text-xs" {...form.register(`strength.upperBody.${ex}.right` as any)} />
                                                            <Input placeholder="Esq" className="h-8 text-xs" {...form.register(`strength.upperBody.${ex}.left` as any)} />
                                                        </div>
                                                    ))}
                                                </TabsContent>
                                                <TabsContent value="lower" className="space-y-2">
                                                    {["Extensão Joelho", "Flexão Joelho", "Dorsiflexão", "Flexão Plantar"].map((ex) => (
                                                        <div key={ex} className="flex items-center gap-4">
                                                            <Label className="w-[150px] truncate" title={ex}>{ex}</Label>
                                                            <Input placeholder="Dir" className="h-8 text-xs" {...form.register(`strength.lowerBody.${ex}.right` as any)} />
                                                            <Input placeholder="Esq" className="h-8 text-xs" {...form.register(`strength.lowerBody.${ex}.left` as any)} />
                                                        </div>
                                                    ))}
                                                </TabsContent>
                                            </Tabs>
                                        </AccordionContent>
                                    </AccordionItem>

                                    {/* [Item 5] Mobilidade e Perimetria */}
                                    <AccordionItem value="mobility" className="border rounded-lg bg-white shadow-sm px-4">
                                        <AccordionTrigger className="hover:no-underline"><span className="flex items-center gap-2 font-bold text-slate-700"><Zap className="w-4 h-4 text-yellow-500" /> Mobilidade e Perimetria</span></AccordionTrigger>
                                        <AccordionContent className="pt-2 space-y-6">
                                            <div>
                                                <h4 className="font-semibold text-sm mb-3">Flexibilidade</h4>
                                                <div className="space-y-3">
                                                    <FormField control={control} name="mobility.wells" render={({ field }) => (
                                                        <FormItem className="flex items-center gap-4 space-y-0">
                                                            <FormLabel className="w-[150px]">Banco de Wells (cm)</FormLabel>
                                                            <FormControl><Input {...field} type="number" className="max-w-[120px]" /></FormControl>
                                                        </FormItem>
                                                    )} />
                                                    <div className="flex items-center gap-4">
                                                        <Label className="w-[150px]">Elevação Perna Reta</Label>
                                                        <Input placeholder="Dir" className="max-w-[80px]" {...form.register("mobility.legRaiseRight")} />
                                                        <Input placeholder="Esq" className="max-w-[80px]" {...form.register("mobility.legRaiseLeft")} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-sm mb-3">Perimetria (cm)</h4>
                                                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                                    {/* Simplified list per UI request */}
                                                    {["Braço Relaxado", "Braço Contraído", "Tórax", "Cintura", "Quadril", "Coxa", "Panturrilha"].map(part => (
                                                        <div key={part} className="flex items-center justify-between">
                                                            <Label className="text-xs">{part}</Label>
                                                            <Input className="h-7 w-16" {...form.register(`perimetry.${part}` as any)} />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>

                                    {/* [Item 6] Avaliação Postural */}
                                    <AccordionItem value="posture" className="border rounded-lg bg-white shadow-sm px-4">
                                        <AccordionTrigger className="hover:no-underline"><span className="flex items-center gap-2 font-bold text-slate-700"><Eye className="w-4 h-4 text-cyan-500" /> Avaliação Postural</span></AccordionTrigger>
                                        <AccordionContent className="pt-2 space-y-4">
                                            <div className="grid grid-cols-4 gap-2">
                                                {['anterior', 'posterior', 'left', 'right'].map((view) => (
                                                    <div key={view} className="aspect-square bg-slate-100 rounded-md border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 cursor-pointer transition-colors">
                                                        <UploadCloud className="w-6 h-6 mb-1" />
                                                        <span className="text-[10px] uppercase font-bold">{view}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                {["Hiperlordose Cervical", "Hiperlordose Lombar", "Escoliose", "Genu Valgo", "Genu Varo", "Pé Plano", "Pé Cavo", "Protusão de Ombro"].map((alt) => (
                                                    <div key={alt} className="flex items-center space-x-2">
                                                        <Checkbox id={alt} onCheckedChange={(c) => setValue(`posture.alterations.${alt}` as any, !!c)} />
                                                        <label htmlFor={alt} className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{alt}</label>
                                                    </div>
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>

                                </Accordion>
                            </div>

                            {/* --- RIGHT COLUMN: DASHBOARD (STICKY 4 COLS) --- */}
                            <div className="lg:col-span-4 relative h-full">
                                <AssessmentSidePanel />
                            </div>

                        </div>
                    </TabsContent>

                    <TabsContent value="history">
                        <div className="p-12 text-center text-muted-foreground border rounded-lg border-dashed">
                            Histórico e Evolução em desenvolvimento.
                        </div>
                    </TabsContent>
                </Tabs>
            </form>
        </Form>
    );
}
