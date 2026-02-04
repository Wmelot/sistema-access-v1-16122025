"use client";

import { useState } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Dumbbell, Activity, Stethoscope, Footprints, FileText, Sparkles } from "lucide-react";

// Imports from other forms
import { SmartAssessmentSidebar } from '@/features/pbe/components/sections/SmartAssessmentSidebar';
import { LumbarSpineForm } from '@/features/pbe/components/regions/spine-lumbar-form';
import { KneeForm } from '@/features/pbe/components/regions/knee-form';
import { ShoulderForm } from '@/features/pbe/components/regions/shoulder-form';
import { AnkleForm } from '@/features/pbe/components/regions/ankle-form';
import { HipForm } from '@/features/pbe/components/regions/hip-form';
import { CervicalSpineForm } from '@/features/pbe/components/regions/spine-cervical-form';
import { ElbowHandForm } from '@/features/pbe/components/regions/elbow-hand-form';
import { FunctionalAssessmentSection } from '@/features/pbe/components/sections/FunctionalAssessmentSection';
import { AdvancedPhysicalForm } from '@/features/pbe/components/AdvancedPhysicalForm';

// --- SCHEMA ---
// Combine SmartAssessmentSchema with a loose schema for physical/biomechanics for now
const ultimateAssessmentSchema = z.object({
    // Shared / Clinical / Concept Fields
    qp: z.string().optional(),
    hma: z.string().optional(),
    painDuration: z.string().optional(),
    eva: z.number().min(0).max(10).optional(),
    anamnesis: z.object({
        mainRegion: z.string().optional(),
    }).optional(),
    history: z.object({
        medications: z.string().optional(),
        treatments: z.record(z.string(), z.boolean()).optional(),
        activityLevel: z.string().optional(),
        habits: z.record(z.string(), z.boolean()).optional(),
    }).optional(),
    behavior: z.object({
        aggravating: z.string().optional(),
        easing: z.string().optional(),
    }).optional(),
    physicalExam: z.any().optional(),
    functional: z.object({
        efep: z.array(z.object({
            activity: z.string(),
            score: z.union([z.string(), z.number()])
        })).optional(),
        questionnaires: z.array(z.object({
            type: z.string(),
            score: z.union([z.string(), z.number()])
        })).optional()
    }).optional(),

    // Performance / Advanced Physical Fields (Nested)
    performance: z.any().optional(),

    // Biomechanics Fields (Nested)
    biomechanics: z.any().optional(),

    report: z.any().optional(),
});

type UltimateAssessmentValues = z.infer<typeof ultimateAssessmentSchema>;

export function UltimatePBEForm({
    patientId,
    initialData,
    onSave,
    readOnly,
    hideHeader = false,
    hideButtons = false
}: {
    patientId: string,
    initialData?: any,
    onSave: (data: any) => Promise<any> | void,
    readOnly?: boolean,
    hideHeader?: boolean,
    hideButtons?: boolean
}) {
    const form = useForm<UltimateAssessmentValues>({
        resolver: zodResolver(ultimateAssessmentSchema),
        defaultValues: initialData || {
            qp: '', hma: '', painDuration: '', eva: 0,
            anamnesis: { mainRegion: '' },
            behavior: { aggravating: '', easing: '' },
            history: { medications: '', treatments: {}, habits: {} },
            physicalExam: {},
            functional: { efep: [{ activity: "", score: "" }], questionnaires: [] },
            performance: {},
            biomechanics: {}
        },
        mode: "onChange"
    });

    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("clinical");

    const values = form.watch();
    const selectedRegion = values.anamnesis?.mainRegion;

    const updateField = (path: string, val: any) => {
        form.setValue(path as any, val, { shouldDirty: true, shouldTouch: true });
    };

    const handlePhysicalDataChange = (data: any) => {
        // Sync AdvancedPhysicalForm data into 'performance' field
        // We use a small delay or check to avoid infinite loops if the child triggers often
        // But since child uses debouncing (2s), this is safe-ish.
        // Actually, child calls strictly when data changes.
        // We just update the 'performance' node.

        // Check if data is different to avoid loop? 
        // JSON.stringify check is expensive but safe.
        // For now, trust the child.
        if (JSON.stringify(values.performance) !== JSON.stringify(data)) {
            updateField('performance', data);
        }
    };

    const onSubmit = async (data: UltimateAssessmentValues) => {
        setIsSaving(true);
        try {
            await onSave(data);
            toast.success("Avaliação Unificada salva!");
        } catch (e: any) {
            console.error(e);
            toast.error(e?.message || "Erro ao salvar avaliação.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 p-2">
            {!hideHeader && (
                <div className="flex items-center justify-between border-b pb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="h-5 w-5 text-indigo-500" />
                            <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-tight">Avaliação Ultimate PBE</h1>
                        </div>
                        <p className="text-slate-500 font-medium">Plataforma unificada de avaliação clínica, física e biomecânica.</p>
                    </div>
                </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-14 p-1 bg-slate-100 rounded-xl mb-6">
                    <TabsTrigger value="clinical" className="rounded-lg h-full text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all">
                        <Stethoscope className="mr-2 h-4 w-4" />
                        Clínica & Dor (PBE)
                    </TabsTrigger>
                    <TabsTrigger value="physical" className="rounded-lg h-full text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm transition-all">
                        <Activity className="mr-2 h-4 w-4" />
                        Performance & Física
                    </TabsTrigger>
                    <TabsTrigger value="biomechanics" className="rounded-lg h-full text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm transition-all">
                        <Footprints className="mr-2 h-4 w-4" />
                        Biomecânica (Palmilha)
                    </TabsTrigger>
                </TabsList>

                {/* --- TAB 1: CLÍNICA (CONCEPT PBE) --- */}
                <TabsContent value="clinical" className="space-y-6 focus-visible:ring-0">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-8 space-y-6">
                            <Form {...form}>
                                <form className="space-y-6">
                                    <Accordion type="multiple" defaultValue={["hma"]} className="w-full space-y-4">

                                        {/* ANAMNESE / HMA */}
                                        <AccordionItem value="hma" className="border rounded-xl bg-card px-2 shadow-sm bg-white">
                                            <AccordionTrigger className="px-4 hover:no-underline font-semibold text-lg text-slate-800">
                                                🗣️ História da Moléstia Atual
                                            </AccordionTrigger>
                                            <AccordionContent className="px-4 pb-6 space-y-6 pt-2">
                                                <div className="space-y-2">
                                                    <FormLabel className="uppercase text-xs font-bold text-slate-500">Região Principal</FormLabel>
                                                    <FormField control={form.control} name="anamnesis.mainRegion" render={({ field }) => (
                                                        <FormItem>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger className="bg-white border-slate-200 rounded-lg shadow-sm h-12">
                                                                        <SelectValue placeholder="Selecione a região..." />
                                                                    </SelectTrigger>
                                                                </FormControl>
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

                                                <div className="space-y-2">
                                                    <FormLabel className="uppercase text-xs font-bold text-slate-500">Queixa Principal (QP)</FormLabel>
                                                    <FormField control={form.control} name="qp" render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Input placeholder="Ex: Dor Lombar" className="font-medium text-lg h-12 border-slate-200" {...field} />
                                                            </FormControl>
                                                        </FormItem>
                                                    )} />
                                                </div>

                                                <div className="space-y-2">
                                                    <FormLabel className="uppercase text-xs font-bold text-slate-500">HMA (Detalhada)</FormLabel>
                                                    <FormField control={form.control} name="hma" render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Textarea className="min-h-[100px] text-base" placeholder="Evolução..." {...field} />
                                                            </FormControl>
                                                        </FormItem>
                                                    )} />
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>

                                        {/* HISTÓRIA PREGRESSA */}
                                        <AccordionItem value="history" className="border rounded-xl bg-card px-2 shadow-sm bg-white">
                                            <AccordionTrigger className="px-4 hover:no-underline font-semibold text-lg text-slate-800">
                                                📋 História Pregressa
                                            </AccordionTrigger>
                                            <AccordionContent className="px-4 pb-6 space-y-6 pt-2">
                                                {/* Medicamentos */}
                                                <div className="space-y-2">
                                                    <FormLabel className="text-xs font-bold text-slate-500 uppercase">Medicamentos</FormLabel>
                                                    <FormField control={form.control} name="history.medications" render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl><Input placeholder="Medicamentos..." {...field} /></FormControl>
                                                        </FormItem>
                                                    )} />
                                                </div>
                                                {/* Simplificado para Brevidade - Adicionar Checkboxes se necessário */}
                                            </AccordionContent>
                                        </AccordionItem>

                                        {/* COMPORTAMENTO */}
                                        <AccordionItem value="behavior" className="border rounded-xl bg-card px-2 shadow-sm bg-white">
                                            <AccordionTrigger className="px-4 hover:no-underline font-semibold text-lg text-slate-800">
                                                📊 Comportamento (Agravantes/Atenuantes)
                                            </AccordionTrigger>
                                            <AccordionContent className="px-4 pb-6 pt-2">
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <FormField control={form.control} name="behavior.aggravating" render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs font-bold text-slate-500">Agravantes</FormLabel>
                                                            <FormControl><Input placeholder="O que piora?" {...field} /></FormControl>
                                                        </FormItem>
                                                    )} />
                                                    <FormField control={form.control} name="behavior.easing" render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs font-bold text-slate-500">Atenuantes</FormLabel>
                                                            <FormControl><Input placeholder="O que melhora?" {...field} /></FormControl>
                                                        </FormItem>
                                                    )} />
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>

                                        {/* EXAME FÍSICO REGIONAL */}
                                        <AccordionItem value="physical" className="border rounded-xl bg-card px-2 shadow-sm bg-white">
                                            <AccordionTrigger className="px-4 hover:no-underline font-semibold text-lg text-slate-800">
                                                🦴 Exame Físico Específico
                                            </AccordionTrigger>
                                            <AccordionContent className="px-4 pb-6 pt-2">
                                                {selectedRegion === 'spine_lumbar' && <LumbarSpineForm data={values} updateField={updateField} readOnly={readOnly} />}
                                                {selectedRegion === 'knee' && <KneeForm data={values} updateField={updateField} readOnly={readOnly} />}
                                                {selectedRegion === 'shoulder' && <ShoulderForm data={values} updateField={updateField} readOnly={readOnly} />}
                                                {selectedRegion === 'ankle_foot' && <AnkleForm data={values} updateField={updateField} readOnly={readOnly} />}
                                                {selectedRegion === 'hip' && <HipForm data={values} updateField={updateField} readOnly={readOnly} />}
                                                {selectedRegion === 'spine_cervical' && <CervicalSpineForm data={values} updateField={updateField} readOnly={readOnly} />}
                                                {selectedRegion === 'elbow_hand' && <ElbowHandForm data={values} updateField={updateField} readOnly={readOnly} />}

                                                {!selectedRegion && (
                                                    <p className="text-sm text-slate-500 text-center py-8">Selecione uma região na aba "História da Moléstia Atual".</p>
                                                )}
                                            </AccordionContent>
                                        </AccordionItem>

                                        {/* FUNCIONAL */}
                                        <FunctionalAssessmentSection
                                            value={values.functional}
                                            onChange={(val) => updateField('functional', val)}
                                            readonly={readOnly}
                                        />

                                    </Accordion>
                                </form>
                            </Form>
                        </div>

                        {/* SIDEBAR DASHBOARD */}
                        {!hideButtons && (
                            <div className="lg:col-span-4">
                                <div className="sticky top-6">
                                    <SmartAssessmentSidebar
                                        data={values}
                                        onSave={form.handleSubmit(onSubmit)}
                                        isSaving={isSaving}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* --- TAB 2: PHYSICAL (ADVANCED) --- */}
                <TabsContent value="physical" className="focus-visible:ring-0">
                    <Card className="border-emerald-100 bg-emerald-50/10">
                        {/* We render the AdvancedPhysicalForm here. 
                             It handles its own state, but we sync it back to 'performance' field. 
                         */}
                        <AdvancedPhysicalForm
                            patientId={patientId}
                            initialData={values.performance} // Pass existing data if any
                            onDataChange={handlePhysicalDataChange}
                            readOnly={readOnly}
                            hideHeader={true}
                            hideButtons={true} // Hide buttons as we use the main save or sidebar
                        />
                    </Card>
                </TabsContent>

                {/* --- TAB 3: BIOMECHANICS (PLACEHOLDER) --- */}
                <TabsContent value="biomechanics" className="focus-visible:ring-0">
                    <Card className="p-12 text-center border-dashed border-2 border-slate-200 bg-slate-50">
                        <Footprints className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-700">Módulo Biomecânico</h3>
                        <p className="text-slate-500 text-sm mt-2">
                            A fusão com o formulário de palmilha (BiomechanicsInsoleForm) será feita na próxima etapa.<br />
                            Por enquanto, verifique o formulário original em "Palmilha Biomecânica".
                        </p>
                    </Card>
                </TabsContent>

            </Tabs>
        </div>
    );
}

export default UltimatePBEForm;
