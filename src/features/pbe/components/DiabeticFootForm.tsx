// @ts-nocheck
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import { useParams } from "next/navigation";
import { Form, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
    Plus, Trash2, Send, Eye, Loader2, Mic, Search, Info,
    CheckCircle2, Flame, Footprints, ChevronDown, ChevronUp, Menu, AlertTriangle,
    Stethoscope, Target, Activity, Zap, Ruler, User, Bed, Scan, FileText, ClipboardList,
    ShieldCheckIcon, Thermometer, Droplets, Waves, Scissors, HeartPulse, Scale, AlertOctagon,
    Settings,
    BookOpen,
    HelpCircle,
    CalendarClock
} from "lucide-react";

import { AudioTextarea } from "./audio-textarea";
import { checkITBStatus, checkStatus } from "@/utils/clinical-references";
import { FunctionalAssessmentSection } from "./sections/FunctionalAssessmentSection";
import { RapidAssessmentModal } from "./RapidAssessmentModal";

const COLOR_LEFT_FOOT = "#0055ff";
const COLOR_RIGHT_FOOT = "#00aa00";

const SECTION_STYLES: Record<string, { border: string, iconColor: string }> = {
    hma: { border: "border-l-blue-600", iconColor: "text-blue-600" },
    vascular: { border: "border-l-red-500", iconColor: "text-red-500" },
    neuropathic: { border: "border-l-amber-500", iconColor: "text-amber-500" },
    inspection: { border: "border-l-orange-500", iconColor: "text-orange-500" },
    biomechanical: { border: "border-l-green-600", iconColor: "text-green-600" },
    footwear: { border: "border-l-sky-600", iconColor: "text-sky-600" },
    classification: { border: "border-l-violet-600", iconColor: "text-violet-600" },
    plan: { border: "border-l-teal-600", iconColor: "text-teal-600" }
};

const ReferenceStatus = ({ value, type }: { value: any, type: string }) => {
    const v = Number(value);
    const isEmpty = value === "" || value === undefined || value === null;
    if (isEmpty) return <div className="text-[10px] font-bold px-2 py-0.5 rounded border mt-1 w-full text-center uppercase bg-slate-100 text-slate-400 border-slate-200">Sem Dados</div>;

    const status = type === 'itb' ? checkITBStatus(v) : checkStatus(type as any, v);

    if (!status) return <div className="text-[10px] font-bold px-2 py-0.5 rounded border mt-1 w-full text-center uppercase bg-slate-100 text-slate-400 border-slate-200">N/A</div>;

    return <div className={cn("text-[10px] font-bold px-2 py-0.5 rounded border mt-1 w-full text-center uppercase transition-all duration-300", status.color)}>{status.label}</div>;
};

export default function DiabeticFootForm({ patientId, initialData, onSave, patient, hideHeader = false, hideButtons = false }: { patientId: string, initialData?: any, onSave?: (data: any) => void, patient?: any, hideHeader?: boolean, hideButtons?: boolean }) {
    const [isMounted, setIsMounted] = useState(false);
    const [openSection, setOpenSection] = useState("hma");
    const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const debouncedSave = useDebouncedCallback((data) => {
        if (onSave) onSave(data);
    }, 1500);

    const defaults = {
        hma: { qp: "", history: "", glucoseControl: 5, physicalActivity: "", drugsInUse: "", extraExams: "" },
        vascular: {
            brachial_left: "", brachial_right: "",
            pedis_left: "", pedis_right: "",
            tibial_left: "", tibial_right: ""
        },
        neuropathic: {
            left: { hallux: false, meta1: false, meta3: false, meta5: false },
            right: { hallux: false, meta1: false, meta3: false, meta5: false }
        },
        inspection: {
            left: { callosity: false, fissures: false, mycosis: false, edema: false, thermal: false, deformities: false, wound: false, amputations: false },
            right: { callosity: false, fissures: false, mycosis: false, edema: false, thermal: false, deformities: false, wound: false, amputations: false },
            nailCare: "good"
        },
        biomechanical: {
            flexibility: { left: "", right: "" },
            strength: { left: "", right: "" },
            rangeOfMotion: { left: "", right: "" }
        },
        footwear: { currentShoes: "", condition: "good" },
        classification: { iwgdfLevel: "0" },
        plan: { orientations: "", returnDays: 30 },
        functional: {
            efep: [{ activity: "", score: "" }],
            questionnaires: [],
            plan: { followUpDays: [], monitorPain: true, extraQuestionnaire: "none" }
        }
    };

    const form = useForm({
        mode: "onChange",
        defaultValues: useMemo(() => (initialData ? { ...defaults, ...initialData } : defaults), [initialData])
    });

    useEffect(() => {
        const subscription = form.watch((value) => debouncedSave(value));
        return () => subscription.unsubscribe();
    }, [form.watch, debouncedSave]);

    // ITB Calculation Logic
    const vasc = useWatch({ control: form.control, name: "vascular" });
    const itbResults = useMemo(() => {
        const brachialMax = Math.max(Number(vasc?.brachial_left || 0), Number(vasc?.brachial_right || 0));
        if (brachialMax === 0) return { left: null, right: null };

        const ankleLeftMax = Math.max(Number(vasc?.pedis_left || 0), Number(vasc?.tibial_left || 0));
        const ankleRightMax = Math.max(Number(vasc?.pedis_right || 0), Number(vasc?.tibial_right || 0));

        return {
            left: Number((ankleLeftMax / brachialMax).toFixed(2)),
            right: Number((ankleRightMax / brachialMax).toFixed(2))
        };
    }, [vasc]);

    const isSectionFilled = (section: string) => {
        const data = form.watch(section as any);
        if (!data) return false;
        if (section === 'hma') return !!(data.qp || data.history);
        if (section === 'vascular') return !!(data.brachial_left || data.pedis_left);
        if (section === 'neuropathic') return Object.values(data.left).some(v => v) || Object.values(data.right).some(v => v);
        return false;
    };

    if (!isMounted) return null;

    return (
        <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto pb-20">
            {!hideHeader && (
                <div className="w-full space-y-2">
                    <div className="bg-white p-3 border rounded-xl flex flex-col md:flex-row md:items-center justify-between shadow-sm gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-700"><Footprints className="w-5 h-5" /></div>
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tipo de Avaliação</span>
                                <h2 className="font-bold text-lg text-slate-800">Avaliação do Pé Insensível</h2>
                            </div>
                        </div>
                        <Badge variant="outline" className="h-9 justify-center gap-2 px-3 py-1 border-slate-200">
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                            <span className="text-xs font-medium text-slate-600">Salvamento Automático</span>
                        </Badge>
                    </div>
                </div>
            )}

            <Form {...form}>
                <Accordion type="single" collapsible value={openSection} onValueChange={setOpenSection} className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* 1. ANAMNESE */}
                    <AccordionItem value="hma" className={cn("border rounded-xl border-l-4 transition-all shadow-sm", openSection === 'hma' ? 'col-span-1 md:col-span-2 bg-white' : 'col-span-1 bg-card', SECTION_STYLES['hma'].border)}>
                        <AccordionTrigger className="px-4 font-bold text-slate-700 hover:no-underline flex gap-2 items-center text-left">
                            <div className="flex items-center gap-2 flex-1 text-base">
                                <Stethoscope className="h-5 w-5 text-blue-600" />
                                <span>Anamnese & Controle Metabólico</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-4 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <FormLabel>Queixa Principal (QP)</FormLabel>
                                        <Input {...form.register('hma.qp')} className="bg-white" placeholder="Motivo da consulta..." />
                                    </div>
                                    <div className="space-y-2">
                                        <FormLabel>História da Moléstia Atual (HMA)</FormLabel>
                                        <AudioTextarea
                                            value={form.watch('hma.history')}
                                            onChange={(e) => form.setValue('hma.history', e.target.value)}
                                            onTranscription={(text) => form.setValue('hma.history', text)}
                                            placeholder="Descreva o histórico clínico e sintomas..."
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                        <div className="flex justify-between mb-4">
                                            <FormLabel className="text-blue-900 font-bold">Controle da Glicose e Dieta</FormLabel>
                                            <span className="text-2xl font-black text-blue-600">{form.watch('hma.glucoseControl')}/10</span>
                                        </div>
                                        <Slider max={10} step={1} value={[form.watch('hma.glucoseControl')]} onValueChange={(v) => form.setValue('hma.glucoseControl', v[0])} />
                                        <p className="text-[10px] text-blue-400 font-bold mt-2 uppercase">0 = Descontrolado | 10 = Excelente controle</p>
                                    </div>
                                    <div className="space-y-2">
                                        <FormLabel>Medicamentos / Drogas em Uso</FormLabel>
                                        <Input {...form.register('hma.drugsInUse')} className="bg-white" />
                                    </div>
                                    <div className="space-y-2">
                                        <FormLabel>Exames Complementares</FormLabel>
                                        <Input {...form.register('hma.extraExams')} className="bg-white" />
                                    </div>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* 2. VASCULAR */}
                    <AccordionItem value="vascular" className={cn("border rounded-xl border-l-4 transition-all shadow-sm", openSection === 'vascular' ? 'col-span-1 md:col-span-2 bg-white' : 'col-span-1 bg-card', SECTION_STYLES['vascular'].border)}>
                        <AccordionTrigger className="px-4 font-bold text-slate-700 hover:no-underline flex gap-2 items-center text-left">
                            <div className="flex items-center gap-2 flex-1 text-base">
                                <HeartPulse className="h-5 w-5 text-red-500" />
                                <span>Avaliação Vascular (ITB)</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-4 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-1">Pressões Sistólicas (mmHg)</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <FormLabel className="text-[10px] font-bold uppercase text-slate-400">Braquial Esquerdo</FormLabel>
                                            <Input type="number" {...form.register('vascular.brachial_left')} />
                                        </div>
                                        <div className="space-y-2">
                                            <FormLabel className="text-[10px] font-bold uppercase text-slate-400">Braquial Direito</FormLabel>
                                            <Input type="number" {...form.register('vascular.brachial_right')} />
                                        </div>
                                        <div className="space-y-2">
                                            <FormLabel className="text-[10px] font-bold uppercase text-slate-400" style={{ color: COLOR_LEFT_FOOT }}>Tibial Post. (E)</FormLabel>
                                            <Input type="number" {...form.register('vascular.tibial_left')} />
                                        </div>
                                        <div className="space-y-2">
                                            <FormLabel className="text-[10px] font-bold uppercase text-slate-400" style={{ color: COLOR_RIGHT_FOOT }}>Tibial Post. (D)</FormLabel>
                                            <Input type="number" {...form.register('vascular.tibial_right')} />
                                        </div>
                                        <div className="space-y-2">
                                            <FormLabel className="text-[10px] font-bold uppercase text-slate-400" style={{ color: COLOR_LEFT_FOOT }}>Pediosa (E)</FormLabel>
                                            <Input type="number" {...form.register('vascular.pedis_left')} />
                                        </div>
                                        <div className="space-y-2">
                                            <FormLabel className="text-[10px] font-bold uppercase text-slate-400" style={{ color: COLOR_RIGHT_FOOT }}>Pediosa (D)</FormLabel>
                                            <Input type="number" {...form.register('vascular.pedis_right')} />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col justify-center items-center bg-slate-50 rounded-2xl p-6 border gap-4">
                                    <div className="text-center">
                                        <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">Resultado do Índice Tornozelo-Braço (ITB)</h3>
                                        <div className="flex gap-8">
                                            <div className="text-center">
                                                <span className="text-[10px] font-bold uppercase block mb-1" style={{ color: COLOR_LEFT_FOOT }}>Pé Esquerdo</span>
                                                <div className="text-3xl font-black text-slate-800">{itbResults.left || '--'}</div>
                                                <ReferenceStatus value={itbResults.left} type="itb" />
                                            </div>
                                            <div className="text-center">
                                                <span className="text-[10px] font-bold uppercase block mb-1" style={{ color: COLOR_RIGHT_FOOT }}>Pé Direito</span>
                                                <div className="text-3xl font-black text-slate-800">{itbResults.right || '--'}</div>
                                                <ReferenceStatus value={itbResults.right} type="itb" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-[9px] text-slate-400 bg-white p-2 rounded border max-w-xs text-center">
                                        ITB = Maior pressão no Tornozelo / Maior pressão Braquial. Normal: 0.9 a 1.3.
                                    </div>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* 3. NEUROPÁTICO (MONOFILAMENTO) */}
                    <AccordionItem value="neuropathic" className={cn("border rounded-xl border-l-4 transition-all shadow-sm", openSection === 'neuropathic' ? 'col-span-1 md:col-span-2 bg-white' : 'col-span-1 bg-card', SECTION_STYLES['neuropathic'].border)}>
                        <AccordionTrigger className="px-4 font-bold text-slate-700 hover:no-underline flex gap-2 items-center text-left">
                            <div className="flex items-center gap-2 flex-1 text-base">
                                <Zap className="h-5 w-5 text-amber-500" />
                                <span>Sensibilidade Protetora (Monofilamento 10g)</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-4 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                {['left', 'right'].map(side => (
                                    <div key={side} className="space-y-4">
                                        <h4 className="text-sm font-bold text-center uppercase tracking-widest" style={{ color: side === 'left' ? COLOR_LEFT_FOOT : COLOR_RIGHT_FOOT }}>
                                            Pé {side === 'left' ? 'Esquerdo' : 'Direito'}
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-6 rounded-3xl border border-dashed border-slate-200">
                                            {[
                                                { id: 'hallux', label: 'Hálux (Polpa)' },
                                                { id: 'meta1', label: '1ª Cabeça Meta' },
                                                { id: 'meta3', label: '3ª Cabeça Meta' },
                                                { id: 'meta5', label: '5ª Cabeça Meta' }
                                            ].map(point => (
                                                <div key={point.id} className="flex items-center space-x-3 bg-white p-3 rounded-xl border shadow-sm">
                                                    <Checkbox
                                                        id={`${side}-${point.id}`}
                                                        checked={form.watch(`neuropathic.${side}.${point.id}` as any)}
                                                        onCheckedChange={(v) => form.setValue(`neuropathic.${side}.${point.id}` as any, !!v)}
                                                    />
                                                    <label htmlFor={`${side}-${point.id}`} className="text-xs font-bold text-slate-600 cursor-pointer">{point.label}</label>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="text-[10px] text-center text-slate-400 font-medium">
                                            Marque se a sensibilidade ao monofilamento de 10g estiver PRESERVADA no ponto.
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* 4. INSPEÇÃO & DERMATOLÓGICO */}
                    <AccordionItem value="inspection" className={cn("border rounded-xl border-l-4 transition-all shadow-sm", openSection === 'inspection' ? 'col-span-1 md:col-span-2 bg-white' : 'col-span-1 bg-card', SECTION_STYLES['inspection'].border)}>
                        <AccordionTrigger className="px-4 font-bold text-slate-700 hover:no-underline flex gap-2 items-center text-left">
                            <div className="flex items-center gap-2 flex-1 text-base">
                                <Thermometer className="h-5 w-5 text-orange-500" />
                                <span>Inspeção, Pele e Temperatura</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-4 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {['left', 'right'].map(side => {
                                    const isThermal = form.watch(`inspection.${side}.thermal`);
                                    return (
                                        <div key={side} className="space-y-4">
                                            <div className="flex items-center justify-between border-b pb-2">
                                                <h4 className="text-xs font-black uppercase tracking-widest" style={{ color: side === 'left' ? COLOR_LEFT_FOOT : COLOR_RIGHT_FOOT }}>
                                                    Pé {side === 'left' ? 'Esquerdo' : 'Direito'}
                                                </h4>
                                                {isThermal && (
                                                    <Badge className="bg-orange-100 text-orange-800 border-orange-200 animate-pulse">
                                                        <Flame className="w-3 h-3 mr-1" /> ALERTA DE TEMPERATURA
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                {[
                                                    { id: 'callosity', label: 'Calosidades', icon: <Waves className="w-3 h-3" /> },
                                                    { id: 'fissures', label: 'Fissuras', icon: <Droplets className="w-3 h-3" /> },
                                                    { id: 'mycosis', label: 'Micoses', icon: <Activity className="w-3 h-3" /> },
                                                    { id: 'edema', label: 'Edema', icon: <Waves className="w-3 h-3" /> },
                                                    { id: 'thermal', label: 'Temp. Alterada', icon: <Thermometer className="w-3 h-3" /> },
                                                    { id: 'hyperemia', label: 'Hiperemia', icon: <Flame className="w-3 h-3" /> },
                                                    { id: 'deformities', label: 'Deformidades', icon: <AlertOctagon className="w-3 h-3" /> },
                                                    { id: 'wound', label: 'Úlcera / Ferida', icon: <AlertOctagon className="w-3 h-3" /> },
                                                    { id: 'amputations', label: 'Amputações', icon: <Scissors className="w-3 h-3" /> }
                                                ].map(check => (
                                                    <div key={check.id} className={cn("flex items-center gap-2 p-3 rounded-xl border transition-all", form.watch(`inspection.${side}.${check.id}` as any) ? "bg-orange-50 border-orange-200 shadow-sm" : "bg-white border-slate-100")}>
                                                        <Checkbox checked={form.watch(`inspection.${side}.${check.id}` as any)} onCheckedChange={(v) => form.setValue(`inspection.${side}.${check.id}` as any, !!v)} />
                                                        <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                                                            {check.icon} {check.label}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                            {isThermal && (
                                                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex gap-3 text-red-900 text-[10px] items-start">
                                                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                                                    <p><strong>ALERTA DE CHARCOT:</strong> Aumento de temperatura local é um sinal crítico para a fase aguda da Neuroartropatia de Charcot. Monitore com cautela.</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200">
                                <FormLabel className="text-xs font-black uppercase text-slate-400 mb-3 block">Higiene e Corte das Unhas</FormLabel>
                                <Select value={form.watch('inspection.nailCare')} onValueChange={(v) => form.setValue('inspection.nailCare', v)}>
                                    <SelectTrigger className="bg-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="good">Adequado (Corte reto, sem encravar)</SelectItem>
                                        <SelectItem value="regular">Regular (Corte curto demais ou irregular)</SelectItem>
                                        <SelectItem value="critical">Crítico (Encravada / Onicomicose severa)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* 5. BIOMECÂNICO (SIMPLIFICADO) */}
                    <AccordionItem value="biomechanical" className={cn("border rounded-xl border-l-4 transition-all shadow-sm", openSection === 'biomechanical' ? 'col-span-1 md:col-span-2 bg-white' : 'col-span-1 bg-card', SECTION_STYLES['biomechanical'].border)}>
                        <AccordionTrigger className="px-4 font-bold text-slate-700 hover:no-underline flex gap-2 items-center text-left">
                            <div className="flex items-center gap-2 flex-1 text-base">
                                <Activity className="h-5 w-5 text-green-600" />
                                <span>Medidas Biomecânicas (Marcha e Postura)</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-4 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-1">Amplitude & Mobilidade</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <FormLabel className="text-[10px] font-bold uppercase text-slate-400">Flexão Dorsal (E)</FormLabel>
                                            <Input placeholder="Graus..." {...form.register('biomechanical.flexibility.left')} />
                                        </div>
                                        <div className="space-y-2">
                                            <FormLabel className="text-[10px] font-bold uppercase text-slate-400">Flexão Dorsal (D)</FormLabel>
                                            <Input placeholder="Graus..." {...form.register('biomechanical.flexibility.right')} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <FormLabel className="text-[10px] font-bold uppercase text-slate-400">Avaliação da Marcha / Postura</FormLabel>
                                        <Textarea className="bg-white min-h-[100px]" placeholder="Observações sobre o padrão de caminhada, alinhamento pélvico e arcos..." {...form.register('biomechanical.gait')} />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-1">Força Muscular (MMII)</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <FormLabel className="text-[10px] font-bold uppercase text-slate-400">Extensores (Hálux/Dedos)</FormLabel>
                                            <Select value={form.watch('biomechanical.strength.toe')} onValueChange={(v) => form.setValue('biomechanical.strength.toe', v)}>
                                                <SelectTrigger className="bg-white text-xs"><SelectValue placeholder="Graw..." /></SelectTrigger>
                                                <SelectContent>{[0, 1, 2, 3, 4, 5].map(g => <SelectItem key={g} value={String(g)}>Grau {g}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <FormLabel className="text-[10px] font-bold uppercase text-slate-400">Tríceps Sural</FormLabel>
                                            <Select value={form.watch('biomechanical.strength.calf')} onValueChange={(v) => form.setValue('biomechanical.strength.calf', v)}>
                                                <SelectTrigger className="bg-white text-xs"><SelectValue placeholder="Grau..." /></SelectTrigger>
                                                <SelectContent>{[0, 1, 2, 3, 4, 5].map(g => <SelectItem key={g} value={String(g)}>Grau {g}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* 6. CALÇADOS */}
                    <AccordionItem value="footwear" className={cn("border rounded-xl border-l-4 transition-all shadow-sm", openSection === 'footwear' ? 'col-span-1 md:col-span-2 bg-white' : 'col-span-1 bg-card', SECTION_STYLES['footwear'].border)}>
                        <AccordionTrigger className="px-4 font-bold text-slate-700 hover:no-underline flex gap-2 items-center text-left">
                            <div className="flex items-center gap-2 flex-1 text-base">
                                <Scan className="h-5 w-5 text-sky-600" />
                                <span>Inspeção de Calçados</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <FormLabel>Calçado Predominante (Uso diário)</FormLabel>
                                        <Input {...form.register('footwear.currentShoes')} placeholder="Ex: Tênis esportivo, Sapato social..." className="bg-white" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            'Solado Plano / Rígido', 'Rocker Sole', 'Contraforte firme', 'Sem costura interna',
                                            'Palmilha removível', 'Material respirável', 'Fechamento regulável', 'Bico Largo'
                                        ].map(feature => (
                                            <div key={feature} className="flex items-center gap-2">
                                                <Checkbox onCheckedChange={(checked) => {
                                                    const current = form.getValues("footwear.features") || [];
                                                    form.setValue("footwear.features", checked ? [...current, feature] : current.filter((i: string) => i !== feature));
                                                }} />
                                                <label className="text-[11px] text-slate-600 font-medium">{feature}</label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-sky-50 p-4 rounded-xl border border-sky-100 flex flex-col justify-center gap-3">
                                    <h4 className="text-xs font-black text-sky-900/40 uppercase tracking-widest text-center">Estado do Calçado</h4>
                                    <div className="flex justify-center gap-4">
                                        {['good', 'worn', 'critical'].map(state => (
                                            <button
                                                key={state}
                                                type="button"
                                                onClick={() => form.setValue('footwear.condition', state)}
                                                className={cn(
                                                    "px-4 py-2 rounded-full text-xs font-bold border transition-all",
                                                    form.watch('footwear.condition') === state
                                                        ? "bg-sky-600 text-white border-sky-600 scale-105 shadow-md"
                                                        : "bg-white text-sky-600 border-sky-200 hover:bg-sky-50"
                                                )}
                                            >
                                                {state === 'good' ? 'Adequado' : state === 'worn' ? 'Desgastado' : 'Substituir Imat.'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* 7. CLASSIFICAÇÃO IWGDF */}
                    <AccordionItem value="classification" className={cn("border rounded-xl border-l-4 transition-all shadow-sm", openSection === 'classification' ? 'col-span-1 md:col-span-2 bg-white' : 'col-span-1 bg-card', SECTION_STYLES['classification'].border)}>
                        <AccordionTrigger className="px-4 font-bold text-slate-700 hover:no-underline flex gap-2 items-center text-left">
                            <div className="flex items-center gap-2 flex-1 text-base">
                                <ShieldCheckIcon className="h-5 w-5 text-violet-600" />
                                <span>Classificação do Risco (IWGDF)</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-4 space-y-6">
                            <div className="bg-violet-50 p-6 rounded-2xl border border-violet-100">
                                <FormLabel className="text-violet-900 font-black uppercase text-xs mb-4 block text-center">Nível de Risco para Ulceração</FormLabel>
                                <Select value={String(form.watch('classification.iwgdfLevel'))} onValueChange={(v) => form.setValue('classification.iwgdfLevel', v)}>
                                    <SelectTrigger className="bg-white h-14 border-violet-200 text-violet-900 font-bold text-base rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="max-w-[500px]">
                                        <SelectItem value="0" className="py-3">
                                            <div className="flex flex-col">
                                                <span className="font-bold underline">0 - Baixo Risco</span>
                                                <span className="text-[10px] opacity-70">Sensibilidade e circulação preservadas. Rastreio anual.</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="1" className="py-3">
                                            <div className="flex flex-col">
                                                <span className="font-bold underline text-amber-600">1 - Risco Moderado</span>
                                                <span className="text-[10px] opacity-70">Perda de sensibilidade protetora OU isquemia periférica. Rastreio semestral.</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="2" className="py-3">
                                            <div className="flex flex-col">
                                                <span className="font-bold underline text-orange-600">2 - Risco Elevado</span>
                                                <span className="text-[10px] opacity-70">Perda de sensibilidade + Deformidade / Isquemia. Rastreio trimestral.</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="3" className="py-3">
                                            <div className="flex flex-col">
                                                <span className="font-bold underline text-red-600">3 - Muito Elevado / Crítico</span>
                                                <span className="text-[10px] opacity-70">Histórico de úlcera, amputação ou Charcot ativo. Rastreio 1-2 meses.</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* 7. FUNCIONALIDADE & QUESTIONÁRIOS */}
                    <AccordionItem value="functional" className={cn("border rounded-xl border-l-4 transition-all shadow-sm", openSection === 'functional' ? 'col-span-1 md:col-span-2 bg-white' : 'col-span-1 bg-card', "border-l-blue-600")}>
                        <AccordionTrigger className="px-4 font-bold text-slate-700 hover:no-underline flex gap-2 items-center text-left">
                            <div className="flex items-center gap-2 flex-1 text-base">
                                <Activity className="h-5 w-5 text-blue-600" />
                                <span>Avaliação Funcional & Questionários</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-4">
                            <FunctionalAssessmentSection
                                value={form.watch('functional')}
                                onChange={(val) => form.setValue('functional', val)}
                                onOpenAssessment={(type) => {
                                    form.setValue('functional.plan.extraQuestionnaire', type);
                                    setIsAssessmentModalOpen(true);
                                }}
                            />
                        </AccordionContent>
                    </AccordionItem>

                    {/* 8. PLANO E CONDUTA */}
                    <AccordionItem value="plan" className={cn("border rounded-xl border-l-4 transition-all shadow-sm", openSection === 'plan' ? 'col-span-1 md:col-span-2 bg-white' : 'col-span-1 bg-card', SECTION_STYLES['plan'].border)}>
                        <AccordionTrigger className="px-4 font-bold text-slate-700 hover:no-underline flex gap-2 items-center text-left">
                            <div className="flex items-center gap-2 flex-1 text-base">
                                <ClipboardList className="h-5 w-5 text-teal-600" />
                                <span>Planejamento, Orientações e Conduta</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-4 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <FormLabel>Orientações Preventivas</FormLabel>
                                        <Textarea className="bg-white min-h-[150px]" {...form.register('plan.orientations')} placeholder="Ex: Hidratação com cremes a base de uréia, auto-exame diário com espelho, não andar descalço..." />
                                    </div>
                                    <div className="space-y-2">
                                        <FormLabel>Prescrição de Palmilha Pé Insensível</FormLabel>
                                        <Textarea className="bg-white" {...form.register('plan.insolePrescription')} placeholder="Elementos recomendados (Ex: Barra metatarsal, acomodação de úlcera...)" />
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="bg-teal-50 p-6 rounded-2xl border border-teal-100 space-y-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-white rounded-lg"><Activity className="w-5 h-5 text-teal-600" /></div>
                                            <div>
                                                <h4 className="text-sm font-bold text-teal-900">Programar Retorno</h4>
                                                <p className="text-[10px] text-teal-600 font-medium uppercase tracking-tighter">Frequência sugerida pelo IWGDF</p>
                                            </div>
                                        </div>
                                        <Slider
                                            max={365}
                                            step={30}
                                            value={[form.watch('plan.returnDays') as number]}
                                            onValueChange={(v) => form.setValue('plan.returnDays', v[0])}
                                        />
                                        <div className="flex justify-between items-center bg-white px-4 py-3 rounded-xl border border-teal-100 shadow-sm">
                                            <span className="text-xs font-bold text-slate-400">Próxima Avaliação em:</span>
                                            <span className="text-xl font-black text-teal-600">{form.watch('plan.returnDays')} Dias</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {!hideButtons && (
                                            <Button type="submit" className="w-full bg-slate-900 h-12 rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all gap-2">
                                                <ShieldCheckIcon className="w-5 h-5" />
                                                Finalizar e Gerar Documentação
                                            </Button>
                                        )}
                                        <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest mt-1">
                                            A conformidade com o IWGDF reduz em 50% o risco de amputações.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                </Accordion>
            </Form>
            <RapidAssessmentModal
                isOpen={isAssessmentModalOpen}
                onClose={() => setIsAssessmentModalOpen(false)}
                assessmentType={form.watch('functional.plan.extraQuestionnaire')}
                onSave={async (data) => {
                    const type = form.watch('functional.plan.extraQuestionnaire');
                    const current = form.watch('functional.questionnaires') || [];

                    let score = 0;
                    if (data && typeof data === 'object') {
                        score = Object.values(data).reduce((acc: number, v: any) => acc + (Number(v) || 0), 0);
                    }

                    const newEntry = { type, data, score, savedAt: new Date().toISOString() };
                    const updatedQuestionnaires = [...current, newEntry];

                    form.setValue('functional.questionnaires', updatedQuestionnaires);
                    form.setValue('functional.plan.extraQuestionnaire', 'none');
                    toast.success("Avaliação funcional adicionada!");
                }}
            />
        </div>
    );
}
