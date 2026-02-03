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

import { SmartAssessmentSidebar } from '@/features/pbe/components/sections/SmartAssessmentSidebar';
import { LumbarSpineForm } from '@/features/pbe/components/regions/spine-lumbar-form';
import { KneeForm } from '@/features/pbe/components/regions/knee-form';
import { ShoulderForm } from '@/features/pbe/components/regions/shoulder-form';
import { AnkleForm } from '@/features/pbe/components/regions/ankle-form';
import { HipForm } from '@/features/pbe/components/regions/hip-form';
import { CervicalSpineForm } from '@/features/pbe/components/regions/spine-cervical-form';
import { ElbowHandForm } from '@/features/pbe/components/regions/elbow-hand-form';
import { FunctionalAssessmentSection } from '@/features/pbe/components/sections/FunctionalAssessmentSection';

// --- SCHEMA (Mantido conforme lógica anterior) ---
const smartAssessmentSchema = z.object({
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
    neurological: z.object({ // Mantendo schema caso precise reativar
        reflexes: z.string().optional(),
        myotomes: z.record(z.string(), z.boolean()).optional(),
        neuralTension: z.string().optional(),
    }).optional(),
    redFlags: z.record(z.string(), z.boolean()).optional(),
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
    report: z.any().optional(),
});

type SmartAssessmentValues = z.infer<typeof smartAssessmentSchema>;

const REGION_LABELS: Record<string, string> = {
    spine_lumbar: "Coluna Lombar",
    spine_cervical: "Coluna Cervical",
    shoulder: "Ombro",
    knee: "Joelho",
    ankle_foot: "Tornozelo e Pé",
    hip: "Quadril",
    elbow_hand: "Cotovelo/Mão"
};

export function ConceptPBEForm({
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
    const form = useForm<SmartAssessmentValues>({
        resolver: zodResolver(smartAssessmentSchema),
        defaultValues: initialData || {
            qp: '', hma: '', painDuration: '', eva: 0,
            anamnesis: { mainRegion: '' },
            behavior: { aggravating: '', easing: '' },
            history: { medications: '', treatments: {}, habits: {} },
            redFlags: {},
            physicalExam: {},
            functional: { efep: [{ activity: "", score: "" }], questionnaires: [] },
        },
        mode: "onChange"
    });

    const [isSaving, setIsSaving] = useState(false);
    const values = form.watch();
    const selectedRegion = values.anamnesis?.mainRegion;

    const updateField = (path: string, val: any) => {
        form.setValue(path as any, val, { shouldDirty: true, shouldTouch: true });
    };

    const onSubmit = async (data: SmartAssessmentValues) => {
        setIsSaving(true);
        try {
            await onSave(data);
            toast.success("Avaliação salva com sucesso!");
        } catch (e) {
            console.error(e);
            toast.error("Erro ao salvar avaliação.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-2">

            {/* COLUNA ESQUERDA (8) - FORMULÁRIO */}
            <div className="lg:col-span-8 space-y-6">
                <Form {...form}>
                    <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
                        {!hideHeader && (
                            <div className="mb-6 border-b pb-4">
                                <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">Avaliação Clínica / PBE</h1>
                                <p className="text-slate-500 font-medium">Formulário inteligente para triagem e diagnóstico fisioterapêutico.</p>
                            </div>
                        )}

                        {/* CONFIGURAÇÃO: type="multiple" mas defaultValue só tem o primeiro item */}
                        <Accordion type="multiple" defaultValue={["hma"]} className="w-full space-y-4">

                            {/* === ITEM 1: HMA (ABERTO POR PADRÃO) === */}
                            <AccordionItem value="hma" className="border rounded-xl bg-card px-2 shadow-sm bg-white">
                                <AccordionTrigger className="px-4 hover:no-underline font-semibold text-lg text-slate-800">
                                    🗣️ História da Moléstia Atual (HMA)
                                </AccordionTrigger>
                                <AccordionContent className="px-4 pb-6 space-y-6 pt-2">
                                    {/* Seletor de Região */}
                                    <div className="space-y-2">
                                        <FormLabel className="uppercase text-xs font-bold text-slate-500">Região Principal da Queixa</FormLabel>
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
                                                    <Input
                                                        placeholder="Ex: Dor na lombar ao levantar"
                                                        className="font-medium text-lg h-12 border-slate-200 focus:border-blue-400 w-full rounded-lg shadow-sm bg-white"
                                                        {...field}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )} />
                                    </div>

                                    <div className="space-y-2">
                                        <FormLabel className="uppercase text-xs font-bold text-slate-500">História da Moléstia Atual (Detalhada)</FormLabel>
                                        <FormField control={form.control} name="hma" render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Textarea
                                                        className="min-h-[120px] text-base w-full shadow-sm p-4 leading-relaxed bg-white border-slate-200 focus:border-blue-400 rounded-lg"
                                                        placeholder="Descreva a evolução dos sintomas..."
                                                        {...field}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )} />
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            {/* === ITEM 2: HISTÓRIA PREGRESSA (NOVO - FECHADO POR PADRÃO) === */}
                            <AccordionItem value="history" className="border rounded-xl bg-card px-2 shadow-sm bg-white">
                                <AccordionTrigger className="px-4 hover:no-underline font-semibold text-lg text-slate-800">
                                    📋 História Pregressa & Estilo de Vida
                                </AccordionTrigger>
                                <AccordionContent className="px-4 pb-6 space-y-6 pt-2">

                                    {/* Tratamentos Prévios */}
                                    <div className="space-y-3">
                                        <FormLabel className="text-xs font-bold text-slate-500 uppercase">Tratamentos Já Realizados</FormLabel>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {[
                                                { id: 'physio', label: 'Fisioterapia' },
                                                { id: 'meds', label: 'Medicamentos' },
                                                { id: 'acupuncture', label: 'Acupuntura' },
                                                { id: 'infiltration', label: 'Infiltração' },
                                                { id: 'surgery', label: 'Cirurgia' },
                                                { id: 'rest', label: 'Repouso/Gelo' },
                                            ].map((item) => (
                                                <div key={item.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`t-${item.id}`}
                                                        checked={values.history?.treatments?.[item.id] as any}
                                                        onCheckedChange={(c) => updateField(`history.treatments.${item.id}`, c)}
                                                        className="border-slate-300 rounded"
                                                    />
                                                    <label htmlFor={`t-${item.id}`} className="text-sm cursor-pointer text-slate-700">{item.label}</label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Medicamentos */}
                                    <div className="space-y-2">
                                        <FormLabel className="text-xs font-bold text-slate-500 uppercase">Medicamentos em Uso Contínuo</FormLabel>
                                        <FormField control={form.control} name="history.medications" render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input placeholder="Liste os medicamentos..." className="bg-white border-slate-200 rounded-lg h-10" {...field} />
                                                </FormControl>
                                            </FormItem>
                                        )} />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4 border-slate-100">
                                        {/* Atividade Física */}
                                        <div className="space-y-3">
                                            <FormLabel className="text-xs font-bold text-slate-500 uppercase">Frequência Atividade Física</FormLabel>
                                            <FormField control={form.control} name="history.activityLevel" render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col gap-2">
                                                            <div className="flex items-center space-x-2"><RadioGroupItem value="sedentary" id="r1" /><label htmlFor="r1" className="text-sm">Sedentário</label></div>
                                                            <div className="flex items-center space-x-2"><RadioGroupItem value="1x" id="r2" /><label htmlFor="r2" className="text-sm">1-2x Semana</label></div>
                                                            <div className="flex items-center space-x-2"><RadioGroupItem value="3x" id="r3" /><label htmlFor="r3" className="text-sm">3-4x Semana</label></div>
                                                            <div className="flex items-center space-x-2"><RadioGroupItem value="5x" id="r4" /><label htmlFor="r4" className="text-sm">5x+ / Atleta</label></div>
                                                        </RadioGroup>
                                                    </FormControl>
                                                </FormItem>
                                            )} />
                                        </div>

                                        {/* Vícios / Hábitos */}
                                        <div className="space-y-3">
                                            <FormLabel className="text-xs font-bold text-slate-500 uppercase">Hábitos de Vida</FormLabel>
                                            <div className="flex flex-col gap-2">
                                                {[
                                                    { id: 'smoking', label: 'Tabagismo' },
                                                    { id: 'alcohol', label: 'Consumo de Álcool freq.' },
                                                    { id: 'bad_sleep', label: 'Sono de má qualidade' },
                                                    { id: 'stress', label: 'Estresse elevado' },
                                                ].map((habit) => (
                                                    <div key={habit.id} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`h-${habit.id}`}
                                                            checked={values.history?.habits?.[habit.id] as any}
                                                            onCheckedChange={(c) => updateField(`history.habits.${habit.id}`, c)}
                                                            className="border-slate-300 rounded"
                                                        />
                                                        <label htmlFor={`h-${habit.id}`} className="text-sm cursor-pointer text-slate-700">{habit.label}</label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            {/* === ITEM 3: COMPORTAMENTO (FECHADO) === */}
                            <AccordionItem value="behavior" className="border rounded-xl bg-card px-2 shadow-sm bg-white">
                                <AccordionTrigger className="px-4 hover:no-underline font-semibold text-lg text-slate-800">
                                    📊 Comportamento dos Sintomas (24h)
                                </AccordionTrigger>
                                <AccordionContent className="px-4 pb-6 pt-2">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <FormField control={form.control} name="behavior.aggravating" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold text-slate-500 uppercase">Aumenta a dor (Agravantes)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="O que piora?" className="bg-white border-slate-200 rounded-lg h-10" {...field} />
                                                </FormControl>
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="behavior.easing" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold text-slate-500 uppercase">Alivia a dor (Atenuantes)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="O que melhora?" className="bg-white border-slate-200 rounded-lg h-10" {...field} />
                                                </FormControl>
                                            </FormItem>
                                        )} />
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            {/* === ITEM 4: EXAME FÍSICO (FECHADO) === */}
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
                                        <p className="text-sm text-slate-500 text-center py-8">Selecione uma região na HMA para carregar o exame específico.</p>
                                    )}
                                </AccordionContent>
                            </AccordionItem>

                            {/* === ITEM 5: FUNCIONALIDADE E QUESTIONÁRIOS (NOVO) === */}
                            <FunctionalAssessmentSection
                                value={values.functional}
                                onChange={(val) => updateField('functional', val)}
                                readonly={readOnly}
                            />

                        </Accordion>
                    </form>
                </Form>
            </div>

            {/* COLUNA DIREITA (4) - DASHBOARD */}
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
    );
}
