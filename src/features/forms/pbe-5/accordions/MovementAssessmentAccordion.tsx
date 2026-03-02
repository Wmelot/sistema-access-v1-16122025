"use client";

import React from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, ShieldCheck, AlertCircle, Zap, Plus, Search, Trash2, Info, ChevronRight, Scale, TrendingUp, CheckCircle2, FlaskConical, Target, Move } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { PhotoAnalyzer } from "../components/interactive/ImageCimetografo";
import { Camera, Video } from "lucide-react";
import { VideoFrameGrabberModal } from "@/components/ui/video-frame-grabber";

const MUSCLE_SUGGESTIONS = [
    "Glúteo Máximo", "Glúteo Médio", "Glúteo Mínimo",
    "Isquiotibiais", "Quadríceps", "Bíceps Femoral", "Semitendíneo", "Semimembranáceo",
    "Tensor da Fáscia Lata (TFL)", "Psoas", "Ilíaco", "Iliopsoas",
    "Piriforme", "Obturador Externo", "Obturador Interno", "Gêmeos", "Quadrado Femoral",
    "Adutor Longo", "Adutor Curto", "Adutor Magno", "Grácil", "Pectíneo",
    "Reto Abdominal", "Transverso do Abdome", "Oblíquo Interno", "Oblíquo Externo",
    "Eretores da Espinha", "Multífidos", "Quadrado Lombar",
    "Trapézio Superior", "Trapézio Médio", "Trapézio Inferior",
    "Grande Dorsal", "Levantador da Escápula", "Romboides",
    "Serrátil Anterior", "Peitoral Maior", "Peitoral Menor",
    "Deltoide Anterior", "Deltoide Médio", "Deltoide Posterior",
    "Supraespinhal", "Infraespinhal", "Redondo Menor", "Subescapular",
    "Bíceps Braquial", "Tríceps Braquial", "Braquial",
    "Gastrocnêmio", "Sóleo", "Tibial Anterior", "Tibial Posterior", "Fibulares",
    "Esternocleidomastoideo", "Escalenos", "Longo do Pescoço"
];

const JOINT_RESOURCES: Record<string, { label: string; lpp: string; cpp: string; movements: { label: string; id: string; normal: number }[] }> = {
    coluna_lombar: {
        label: "Coluna Lombar",
        lpp: "Meio caminho entre flexão e extensão",
        cpp: "Extensão máxima",
        movements: [
            { label: "Flexão", id: "flexion", normal: 60 },
            { label: "Extensão", id: "extension", normal: 35 },
            { label: "Inclinação Lateral (D)", id: "lat_inc_r", normal: 20 },
            { label: "Inclinação Lateral (E)", id: "lat_inc_l", normal: 20 },
            { label: "Rotação (D)", id: "rot_r", normal: 18 },
            { label: "Rotação (E)", id: "rot_l", normal: 18 },
        ]
    },
    coluna_cervical: {
        label: "Coluna Cervical",
        lpp: "Ligeira extensão",
        cpp: "Extensão máxima",
        movements: [
            { label: "Flexão", id: "flexion", normal: 45 },
            { label: "Extensão", id: "extension", normal: 70 },
            { label: "Inclinação Lateral (D)", id: "lat_flex_r", normal: 45 },
            { label: "Inclinação Lateral (E)", id: "lat_flex_l", normal: 45 },
            { label: "Rotação (D)", id: "rot_r", normal: 90 },
            { label: "Rotação (E)", id: "rot_l", normal: 90 },
        ]
    },
    ombro: {
        label: "Ombro",
        lpp: "55º Abdução, 30º Adução Horizontal",
        cpp: "Abdução Máxima e Rotação Externa",
        movements: [
            { label: "Flexão", id: "flexion", normal: 180 },
            { label: "Extensão", id: "extension", normal: 60 },
            { label: "Abdução", id: "abduction", normal: 180 },
            { label: "Rotação Medial", id: "int_rot", normal: 70 },
            { label: "Rotação Lateral", id: "ext_rot", normal: 90 },
        ]
    },
    joelho: {
        label: "Joelho",
        lpp: "25º Flexão",
        cpp: "Extensão Máxima e Rotação Externa da Tíbia",
        movements: [
            { label: "Flexão", id: "flexion", normal: 135 },
            { label: "Extensão", id: "extension", normal: 10 },
        ]
    },
    quadril: {
        label: "Quadril",
        lpp: "30º Flexão, 30º Abdução, ligeira Rot. Externa",
        cpp: "Extensão Máxima, Rotação Medial e Abdução",
        movements: [
            { label: "Flexão", id: "flexion", normal: 120 },
            { label: "Extensão", id: "extension", normal: 30 },
            { label: "Abdução", id: "abduction", normal: 45 },
            { label: "Adução", id: "adduction", normal: 30 },
            { label: "Rotação Medial", id: "int_rot", normal: 45 },
            { label: "Rotação Lateral", id: "ext_rot", normal: 45 },
        ]
    },
    tornozelo_pe: {
        label: "Tornozelo e Pé",
        lpp: "10º Flexão Plantar, ponto médio entre Inversão/Eversão",
        cpp: "Dorsiflexão Máxima",
        movements: [
            { label: "Dorsiflexão", id: "dorsi", normal: 20 },
            { label: "Plantiflexão", id: "planti", normal: 50 },
            { label: "Inversão", id: "inversion", normal: 35 },
            { label: "Eversão", id: "eversion", normal: 15 },
        ]
    },
    cotovelo_mao: {
        label: "Cotovelo, Punho e Mão",
        lpp: "70º Flexão, 10º Supinação (Cotovelo)",
        cpp: "Extensão Máxima (Cotovelo)",
        movements: [
            { label: "Flexão Cotovelo", id: "elbow_flex", normal: 150 },
            { label: "Extensão Cotovelo", id: "elbow_ext", normal: 10 },
            { label: "Pronação", id: "pronation", normal: 80 },
            { label: "Supinação", id: "supination", normal: 90 },
            { label: "Flexão Punho", id: "wrist_flex", normal: 80 },
            { label: "Extensão Punho", id: "wrist_ext", normal: 70 },
        ]
    }
};

const MAGEE_CAPSULAR_PATTERNS: Record<string, { check: (m: any) => boolean; desc: string; label: string }> = {
    ombro: {
        label: "Glenoumeral",
        check: (m) => {
            const re = parseFloat(m.ext_rot_val);
            const abd = parseFloat(m.abduction_val);
            const ri = parseFloat(m.int_rot_val);
            if (isNaN(re) || isNaN(abd) || isNaN(ri)) return false;
            if (re === 0 && abd === 0 && ri === 0) return false;

            // Magee: ER > ABD > IR (ER is most limited)
            // Normal: ER 90, ABD 180, IR 70
            // Proportion of loss: (1 - re/90) > (1 - abd/180) > (1 - ri/70)
            const erLoss = 1 - (re / 90);
            const abdLoss = 1 - (abd / 180);
            const riLoss = 1 - (ri / 70);

            // Trigger only if there's significant restriction (e.g. at least 15% loss)
            // and the specific order of restriction is maintained
            return erLoss > 0.15 && erLoss > abdLoss && abdLoss > riLoss;
        },
        desc: "Rotação Lateral > Abdução > Rotação Medial (RL é a mais limitada)"
    },
    cotovelo_mao: {
        label: "Umeroulnar / Radiocarpica",
        check: (m) => {
            // Check Umeroulnar: Flexion > Extension
            const flex = parseFloat(m.elbow_flex_val);
            const ext = parseFloat(m.elbow_ext_val);
            if (!isNaN(flex) && !isNaN(ext)) {
                const flexLoss = 1 - (flex / 150);
                const extLoss = 1 - (ext / 10); // Note: Ext is small, direct comparison is better
                if (flexLoss > 0.15 && flexLoss > extLoss) return true;
            }

            // Check Radiocarpica: Flexion and Extension equally limited
            const wFlex = parseFloat(m.wrist_flex_val);
            const wExt = parseFloat(m.wrist_ext_val);
            if (!isNaN(wFlex) && !isNaN(wExt)) {
                const wFlexLoss = 1 - (wFlex / 80);
                const wExtLoss = 1 - (wExt / 70);
                if (wFlexLoss > 0.15 && Math.abs(wFlexLoss - wExtLoss) < 0.1) return true;
            }

            return false;
        },
        desc: "Limitação de Flexão maior que Extensão ou Perda Simétrica em Punho"
    },
    quadril: {
        label: "Quadril",
        check: (m) => {
            const flex = parseFloat(m.flexion_val);
            const abd = parseFloat(m.abduction_val);
            const ri = parseFloat(m.int_rot_val);
            if (isNaN(flex) || isNaN(abd) || isNaN(ri)) return false;

            // Magee: Flexion > Abduction > Internal Rotation
            const flexLoss = 1 - (flex / 120);
            const abdLoss = 1 - (abd / 45);
            const riLoss = 1 - (ri / 45);

            return flexLoss > 0.2 && flexLoss > abdLoss && abdLoss > riLoss;
        },
        desc: "Flexão > Abdução > Rotação Medial"
    },
    joelho: {
        label: "Tíbio-Femural",
        check: (m) => {
            const flex = parseFloat(m.flexion_val);
            const ext = parseFloat(m.extension_val);
            if (isNaN(flex) || isNaN(ext)) return false;
            // Flexion more limited than extension
            const flexLoss = 1 - (flex / 135);
            const extLoss = 1 - (ext / 10);
            return flexLoss > 0.2 && flexLoss > extLoss;
        },
        desc: "Flexão mais limitada que Extensão"
    },
    tornozelo_pe: {
        label: "Talocrural",
        check: (m) => {
            const pf = parseFloat(m.planti_val);
            const df = parseFloat(m.dorsi_val);
            if (isNaN(pf) || isNaN(df)) return false;
            // Plantar flexion > Dorsiflexion
            const pfLoss = 1 - (pf / 50);
            const dfLoss = 1 - (df / 20);
            return pfLoss > 0.15 && pfLoss > dfLoss;
        },
        desc: "Flexão Plantar mais limitada que Dorsiflexão"
    },
    coluna_cervical: {
        label: "Cervical",
        check: (m) => {
            const rot = parseFloat(m.rot_r_val);
            const lat = parseFloat(m.lat_flex_r_val);
            const ext = parseFloat(m.extension_val);
            if (isNaN(rot) || isNaN(lat) || isNaN(ext)) return false;

            // Magee: Lateral Flexion and Rotation equally limited, then Extension
            const rotLoss = 1 - (rot / 90);
            const latLoss = 1 - (lat / 45);
            const extLoss = 1 - (ext / 70);

            return rotLoss > 0.15 && Math.abs(rotLoss - latLoss) < 0.1 && rotLoss > extLoss;
        },
        desc: "Rotação e Inclinação igualadas, seguidas por Extensão"
    },
    coluna_lombar: {
        label: "Lombar",
        check: (m) => {
            const rot = parseFloat(m.rot_r_val);
            const lat = parseFloat(m.lat_inc_r_val);
            const ext = parseFloat(m.extension_val);
            if (isNaN(rot) || isNaN(lat) || isNaN(ext)) return false;

            // If any movement is normal or near normal, it's likely NOT a capsular pattern
            if (rot >= 17 || lat >= 19 || ext >= 34) return false;

            // Magee: Lateral Flexion and Rotation equally limited, then Extension
            const rotLoss = 1 - (rot / 18);
            const latLoss = 1 - (lat / 20);
            const extLoss = 1 - (ext / 35);

            return rotLoss > 0.2 && Math.abs(rotLoss - latLoss) < 0.15 && rotLoss > extLoss;
        },
        desc: "Rotação e Inclinação Lateral limitadas igualmente, seguidas por Extensão."
    }
};

const SYMPTOM_RESPONSES = [
    { value: "melhora", label: "Melhora" },
    { value: "piora", label: "Piora" },
    { value: "sem_efeito", label: "Sem efeito" },
    { value: "produz_dor", label: "Produz dor" },
    { value: "abole_dor", label: "Abole dor" },
];

const PHENOMENON_OPTIONS = [
    { value: "none", label: "--" },
    { value: "centraliza", label: "Centraliza", color: "text-emerald-600" },
    { value: "periferiza", label: "Periferiza", color: "text-rose-600" },
];

const END_FEEL_OPTIONS = [
    { value: "aproximacao_tecido", label: "Aproximação de tecido" },
    { value: "alongamento_tecido", label: "Alongamento de tecido" },
    { value: "vazio", label: "Vazio" },
    { value: "capsular", label: "Capsular" },
    { value: "bloqueio_mola", label: "Bloqueio de mola (Joelho/ATM)" },
    { value: "osso_osso", label: "Osso-Osso" },
    { value: "espasmo_muscular", label: "Espasmo muscular" },
];

interface MovementAssessmentAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string; iconColor: string; bg: string };
}

export function MovementAssessmentAccordion({ openSection, isSectionFilled, sectionStyle }: MovementAssessmentAccordionProps) {
    const { register, watch, setValue, control } = useFormContext();
    const { fields: sahrmannFields, append: appendSahrmann, remove: removeSahrmann } = useFieldArray({
        control,
        name: "movement.sahrmann_pairs"
    });

    const activeMode = watch('movement.active_mode') || 'simplified';
    const selectedRegions = watch('anamnesis.mainRegions') || [];
    const gaitPhotos = watch('movement.gaitPhotos') || {}; // Keep watching form state
    const [analyzerView, setAnalyzerView] = React.useState<string | null>(null);
    const [grabberOpen, setGrabberOpen] = React.useState<boolean>(false); // Added grabberOpen state

    const handlePhotoUpload = (view: string, file: File | null) => {
        if (file) {
            const url = URL.createObjectURL(file);
            setValue(`movement.gaitPhotos.${view}`, url, { shouldDirty: true, shouldValidate: true });
        }
    };

    const removePhoto = (view: string) => {
        setValue(`movement.gaitPhotos.${view}`, null, { shouldDirty: true, shouldValidate: true });
    };

    const getStatusInfo = (val: string, normal: number) => {
        const num = parseFloat(val);
        if (isNaN(num)) return null;

        const perc = (num / normal) * 100;
        const deficit = 100 - perc;

        if (deficit <= 5) return { label: "Normal", color: "bg-emerald-500", text: "text-emerald-500" };
        if (deficit <= 25) return { label: "Abaixo", color: "bg-amber-500", text: "text-amber-500" };
        return { label: "Muito Abaixo", color: "bg-rose-500", text: "text-rose-500" };
    };

    const getCapsularPattern = (regionId: string, type: 'active' | 'passive') => {
        const data = watch(`movement.${type}.${regionId}`) || {};
        const pattern = MAGEE_CAPSULAR_PATTERNS[regionId];

        if (pattern && pattern.check(data)) {
            return pattern;
        }
        return null;
    };

    const renderROMTable = (type: 'active' | 'passive') => {
        if (selectedRegions.length === 0) {
            return (
                <div className="py-12 bg-slate-50 border-2 border-dashed border-slate-100 rounded-[2rem] flex flex-col items-center justify-center text-center px-6">
                    <AlertCircle className="h-10 w-10 text-slate-300 mb-4" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nenhuma região selecionada na Anamnese</p>
                    <p className="text-[10px] text-slate-300 mt-2 uppercase font-bold tracking-tighter">Selecione as articulações para avaliar a ADM {type === 'active' ? 'Ativa' : 'Passiva'}</p>
                </div>
            );
        }

        return (
            <TooltipProvider>
                <div className="space-y-10">
                    {selectedRegions.map((regionId: string) => {
                        const resource = JOINT_RESOURCES[regionId];
                        if (!resource) return null;

                        const capsularPattern = getCapsularPattern(regionId, type);

                        return (
                            <div key={regionId} className="space-y-4">
                                <div className="flex items-center justify-between ml-2">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]" />
                                        <h5 className="font-black text-slate-700 uppercase text-[11px] tracking-widest">{resource.label}</h5>

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button type="button" className="text-slate-300 hover:text-blue-500 transition-colors">
                                                    <Info className="h-3.5 w-3.5" />
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent className="bg-slate-900 border-none rounded-xl p-4 text-white space-y-2 max-w-xs shadow-2xl">
                                                <div className="space-y-1">
                                                    <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Posição de Repouso (LPP)</p>
                                                    <p className="text-[10px] font-medium leading-relaxed">{resource.lpp}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Congruência Máxima (CPP)</p>
                                                    <p className="text-[10px] font-medium leading-relaxed">{resource.cpp}</p>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>

                                        {capsularPattern && (
                                            <Badge className="bg-rose-500 text-white border-none text-[8px] font-black uppercase px-2 py-0.5 animate-pulse rounded-full flex gap-1 items-center">
                                                <Zap className="h-2.5 w-2.5" />
                                                Padrão Capsular: {capsularPattern.label} ⚠️
                                            </Badge>
                                        )}
                                    </div>
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Referência: Magee</span>
                                </div>

                                {capsularPattern && (
                                    <div className="mx-6 p-3 bg-rose-50 border border-rose-100 rounded-xl mb-2 animate-in fade-in slide-in-from-top-2">
                                        <p className="text-[9px] font-black text-rose-700 uppercase tracking-widest">
                                            Mecânica Sugestiva: {capsularPattern.desc}
                                        </p>
                                    </div>
                                )}

                                <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white/50 shadow-sm overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/80 border-b border-slate-100">
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/4">Movimento</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">ADM (º)</th>
                                                {type === 'passive' && <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">End-Feel</th>}
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Sintomas / Qualidade</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {resource.movements.map((move) => {
                                                const currentVal = watch(`movement.${type}.${regionId}.${move.id}_val`);
                                                const status = getStatusInfo(currentVal, move.normal);

                                                return (
                                                    <tr key={move.id} className="group hover:bg-white transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-black text-slate-600 uppercase tracking-tight">{move.label}</span>
                                                                <span className="text-[9px] font-bold text-slate-300 uppercase">Normal: 0-{move.normal}º</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col items-center gap-1.5">
                                                                <Input
                                                                    type="number"
                                                                    {...register(`movement.${type}.${regionId}.${move.id}_val`)}
                                                                    placeholder={`${move.normal}º`}
                                                                    className="h-10 w-24 bg-white border-slate-200 rounded-xl text-xs font-black text-center focus:ring-blue-600 shadow-sm"
                                                                />
                                                                {status && (
                                                                    <div className={cn("px-2 py-0.5 rounded-full text-[8px] font-black uppercase text-white shadow-sm", status.color)}>
                                                                        {status.label}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        {type === 'passive' && (
                                                            <td className="px-6 py-4">
                                                                <div className="flex justify-center">
                                                                    <Select onValueChange={(v) => setValue(`movement.${type}.${regionId}.${move.id}_endfeel`, v)} value={watch(`movement.${type}.${regionId}.${move.id}_endfeel`)}>
                                                                        <SelectTrigger className="h-10 w-44 bg-white/70 border-slate-200 rounded-xl text-[10px] font-black text-center uppercase">
                                                                            <SelectValue placeholder="Selecionar..." />
                                                                        </SelectTrigger>
                                                                        <SelectContent className="z-[150]">
                                                                            {END_FEEL_OPTIONS.map(opt => (
                                                                                <SelectItem key={opt.value} value={opt.value} className="text-[10px] font-bold uppercase">{opt.label}</SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            </td>
                                                        )}
                                                        <td className="px-6 py-4">
                                                            <Input
                                                                {...register(`movement.${type}.${regionId}.${move.id}_quality`)}
                                                                placeholder="Dor ao final, crepitação..."
                                                                className="h-10 w-full bg-white/50 border-slate-100 rounded-xl text-xs font-medium focus:ring-blue-600 px-4 shadow-inner"
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </TooltipProvider>
        );
    };

    return (
        <AccordionItem
            value="movement"
            className={cn(
                "border rounded-[2rem] border-l-4 transition-all duration-300 shadow-sm overflow-hidden",
                openSection === 'movement' ? 'bg-white ring-2 ring-blue-50' : 'bg-white/50',
                isSectionFilled('movement') ? 'border-slate-200' : 'border-slate-100',
                sectionStyle.border
            )}
        >
            <AccordionTrigger className="px-8 py-6 hover:no-underline flex gap-2 items-center text-left group">
                <div className="flex items-center gap-4 flex-1">
                    <Move className="h-5 w-5 transition-colors group-hover:animate-bounce" />
                    <div>
                        <span className={cn("font-black text-lg tracking-tight", openSection === 'movement' ? "text-slate-900" : "text-slate-600")}>Avaliação do Movimento (ADM)</span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Testes ativos, passivos e movimentos repetidos</p>
                    </div>
                </div>
                {isSectionFilled('movement') && (
                    <Badge variant="outline" className="bg-blue-100 text-blue-700 border-none text-[10px] h-6 px-3 rounded-full font-black">PREENCHIDO</Badge>
                )}
            </AccordionTrigger>
            <AccordionContent className="px-8 pb-10 pt-4 space-y-10 border-t border-slate-50">

                <Tabs defaultValue="active" className="w-full">
                    <div className="flex items-center justify-center mb-8">
                        <TabsList className="bg-slate-100/50 p-1.5 rounded-[1.2rem] h-auto border border-slate-100 shadow-inner">
                            <TabsTrigger value="active" className="rounded-xl px-8 py-2.5 font-black text-[10px] uppercase tracking-[0.15em] data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg active:scale-95 transition-all">Ativa</TabsTrigger>
                            <TabsTrigger value="passive" className="rounded-xl px-8 py-2.5 font-black text-[10px] uppercase tracking-[0.15em] data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg active:scale-95 transition-all">Passiva</TabsTrigger>
                            <TabsTrigger value="repeated" className="rounded-xl px-8 py-2.5 font-black text-[0.15em] uppercase tracking-[0.15em] data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg active:scale-95 transition-all">Repetidos</TabsTrigger>
                            <TabsTrigger value="sahrmann" className="rounded-xl px-8 py-2.5 font-black text-[0.15em] uppercase tracking-[0.15em] data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg active:scale-95 transition-all">Dominância</TabsTrigger>
                            <TabsTrigger value="gait" className="rounded-xl px-8 py-2.5 font-black text-[0.15em] uppercase tracking-[0.15em] data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg active:scale-95 transition-all">Marcha e Eversão</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="active" className="animate-in fade-in zoom-in-95 duration-500">
                        {renderROMTable('active')}
                    </TabsContent>

                    <TabsContent value="passive" className="animate-in fade-in zoom-in-95 duration-500">
                        {renderROMTable('passive')}
                    </TabsContent>

                    <TabsContent value="repeated" className="animate-in fade-in zoom-in-95 duration-500 space-y-10">
                        <div className="bg-blue-50/50 p-5 rounded-3xl border border-blue-100 flex gap-4">
                            <Info className="h-5 w-5 text-blue-600 mt-1 shrink-0" />
                            <div>
                                <h6 className="text-[11px] font-black text-blue-900 uppercase tracking-widest mb-1">Mecânica de Movimentos Repetidos</h6>
                                <p className="text-[10px] text-blue-700 leading-relaxed font-bold opacity-80 uppercase tracking-tighter">
                                    Avalie a resposta sintomática e o fenômeno de centralização/periferização após séries de repetições. (Ex: 10 repetições).
                                </p>
                            </div>
                        </div>

                        {selectedRegions.map((regionId: string) => {
                            const resource = JOINT_RESOURCES[regionId];
                            if (!resource) return null;

                            return (
                                <div key={`repeated-${regionId}`} className="space-y-4">
                                    <div className="flex items-center gap-3 ml-2">
                                        <div className="h-2 w-2 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]" />
                                        <h5 className="font-black text-slate-700 uppercase text-[11px] tracking-widest">{resource.label}</h5>
                                    </div>

                                    <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white/50 shadow-sm overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50/80 border-b border-slate-100">
                                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/4">Movimento</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Resposta Sintomática</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Fenômeno</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {resource.movements.map((move) => (
                                                    <tr key={`rep-${move.id}`} className="group hover:bg-white transition-colors">
                                                        <td className="px-6 py-4">
                                                            <span className="text-xs font-black text-slate-600 uppercase tracking-tight">{move.label}</span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex justify-center">
                                                                <Select onValueChange={(v) => setValue(`movement.repeated.${regionId}.${move.id}.response`, v)} value={watch(`movement.repeated.${regionId}.${move.id}.response`)}>
                                                                    <SelectTrigger className="h-10 w-44 bg-white border-slate-200 rounded-xl text-xs font-bold text-center">
                                                                        <SelectValue placeholder="Selecione..." />
                                                                    </SelectTrigger>
                                                                    <SelectContent className="z-[150]">
                                                                        {SYMPTOM_RESPONSES.map(opt => (
                                                                            <SelectItem key={opt.value} value={opt.value} className="text-xs font-bold uppercase">{opt.label}</SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex justify-center">
                                                                <Select onValueChange={(v) => setValue(`movement.repeated.${regionId}.${move.id}.phenomenon`, v)} value={watch(`movement.repeated.${regionId}.${move.id}.phenomenon`)}>
                                                                    <SelectTrigger className="h-10 w-40 bg-white border-slate-200 rounded-xl text-xs font-bold text-center">
                                                                        <SelectValue placeholder="--" />
                                                                    </SelectTrigger>
                                                                    <SelectContent className="z-[150]">
                                                                        {PHENOMENON_OPTIONS.map(opt => (
                                                                            <SelectItem key={opt.value} value={opt.value} className={cn("text-xs font-bold uppercase", opt.color)}>{opt.label}</SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })}
                    </TabsContent>

                    <TabsContent value="sahrmann" className="animate-in fade-in zoom-in-95 duration-500 space-y-12">
                        <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 flex gap-4">
                            <ShieldCheck className="h-5 w-5 text-indigo-600 mt-1 shrink-0" />
                            <div>
                                <h6 className="text-[11px] font-black text-indigo-900 uppercase tracking-widest mb-1">Teste de Dominância Muscular</h6>
                                <p className="text-[10px] text-indigo-700 leading-relaxed font-bold opacity-80 uppercase tracking-tighter">
                                    Identifique padrões de compensação e dominância muscular durante a execução do movimento.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {sahrmannFields.map((field, index) => (
                                <div key={field.id} className="p-8 bg-white border border-slate-100 rounded-[3rem] shadow-sm hover:border-indigo-200 transition-all flex flex-col md:flex-row gap-6 items-center group relative">
                                    <datalist id="muscles">
                                        {MUSCLE_SUGGESTIONS.map(m => (
                                            <option key={m} value={m} />
                                        ))}
                                    </datalist>

                                    <button
                                        type="button"
                                        onClick={() => removeSahrmann(index)}
                                        className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>

                                    <div className="flex-1 space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Músculo Dominante (Hiperativo)</label>
                                        <Input
                                            {...register(`movement.sahrmann_pairs.${index}.dominant`)}
                                            placeholder="Ex: Isquiotibiais"
                                            list="muscles"
                                            className="h-12 bg-indigo-50/30 border-transparent rounded-2xl text-xs font-bold px-5 focus:bg-white focus:ring-indigo-600"
                                        />
                                    </div>

                                    <div className="flex items-center justify-center pt-6">
                                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center border-4 border-white shadow-sm">
                                            <Zap className="h-4 w-4 text-indigo-600" />
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Músculo Inibido (Hipoativo)</label>
                                        <Input
                                            {...register(`movement.sahrmann_pairs.${index}.inhibited`)}
                                            placeholder="Ex: Glúteo Máximo"
                                            list="muscles"
                                            className="h-12 bg-slate-50 border-transparent rounded-2xl text-xs font-bold px-5 focus:bg-white focus:ring-indigo-600"
                                        />
                                    </div>

                                    <div className="flex-1 space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Observações do Teste</label>
                                        <Input
                                            {...register(`movement.sahrmann_pairs.${index}.obs`)}
                                            placeholder="Ex: Compensa com báscula posterior..."
                                            className="h-12 bg-slate-50 border-transparent rounded-2xl text-xs font-bold px-5 focus:bg-white focus:ring-indigo-600"
                                        />
                                    </div>
                                </div>
                            ))}

                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => appendSahrmann({ dominant: "", inhibited: "", obs: "" })}
                                className="h-16 border-2 border-dashed border-indigo-200 bg-indigo-50/20 text-indigo-600 rounded-[2.5rem] font-black text-xs space-x-2 hover:bg-indigo-50 hover:border-indigo-300 transition-all"
                            >
                                <Plus className="h-4 w-4" />
                                <span>ADICIONAR NOVA DOMINÂNCIA</span>
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="gait" className="animate-in fade-in zoom-in-95 duration-500 space-y-12">
                        <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100 flex gap-4">
                            <Camera className="h-5 w-5 text-emerald-600 mt-1 shrink-0" />
                            <div>
                                <h6 className="text-[11px] font-black text-emerald-900 uppercase tracking-widest mb-1">Biomecânica Dinâmica - Retropé</h6>
                                <p className="text-[10px] text-emerald-700 leading-relaxed font-bold opacity-80 uppercase tracking-tighter">
                                    Adicione quadros de vídeo ou fotos da marcha e corrida em vista posterior. O sistema calculará o grau exato de eversão/inversão.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {['midstance_left', 'midstance_right', 'running_heel_strike'].map((view) => {
                                const url = gaitPhotos[view];
                                const label = view === 'midstance_left' ? 'Apoio Médio (Pé E)' : view === 'midstance_right' ? 'Apoio Médio (Pé D)' : 'Corrida (Retropé)';

                                return (
                                    <div key={view} className="space-y-3">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block text-center italic">{label}</label>
                                        <div className={cn(
                                            "relative h-64 rounded-[2rem] border-2 border-dashed transition-all overflow-hidden flex flex-col items-center justify-center gap-2 group",
                                            url ? "border-emerald-600" : "border-slate-200 bg-slate-50 hover:bg-emerald-50/30 hover:border-emerald-300"
                                        )}>
                                            {url ? (
                                                <>
                                                    <img src={watch(`movement.gaitPhotosAnalyzed.${view}`) || url} alt={label} className="absolute inset-0 w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                                                        <Button size="icon" variant="secondary" className="rounded-full h-10 w-10 text-blue-600 hover:text-blue-700 bg-white" onClick={() => setAnalyzerView(view)}>
                                                            <Activity className="h-5 w-5" />
                                                        </Button>
                                                        <Button size="icon" variant="destructive" className="rounded-full h-10 w-10" onClick={() => removePhoto(view)}>
                                                            <Trash2 className="h-5 w-5" />
                                                        </Button>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="flex flex-col items-center justify-center gap-2 p-2 w-full h-full pointer-events-none">
                                                        <Camera className="h-8 w-8 text-emerald-300 group-hover:text-emerald-600 transition-all pointer-events-none" />
                                                        <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-tighter text-center leading-tight">
                                                            Clique p/ Enviar<br />(ou Finder)
                                                        </h6>
                                                    </div>
                                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                                        <button
                                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setGrabberOpen(true); }}
                                                            className="text-[10px] bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors px-2 py-1 rounded uppercase font-black tracking-widest flex items-center gap-1 shadow-sm"
                                                            title="Extrair Frame de Vídeo"
                                                        >
                                                            <Video className="w-3 h-3" />
                                                            Vídeo
                                                        </button>
                                                    </div>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                        title=""
                                                        onChange={(e) => handlePhotoUpload(view, e.target.files?.[0] || null)}
                                                    />
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </TabsContent>
                </Tabs>
            </AccordionContent>

            <Dialog open={!!analyzerView} onOpenChange={() => setAnalyzerView(null)}>
                <DialogContent className="max-w-5xl p-0 overflow-hidden bg-slate-50 border-none rounded-[2rem] gap-0">
                    <DialogHeader className="p-6 bg-white border-b border-slate-100 text-center">
                        <DialogTitle className="text-xl font-black text-slate-800 uppercase tracking-widest">
                            Análise de Eversão do Calcâneo
                        </DialogTitle>
                        <DialogDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                            Arraste os pontos para a linha central da panturrilha e linha central do calcâneo longo.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-8 pb-0">
                        {analyzerView && gaitPhotos[analyzerView] && (
                            <PhotoAnalyzer
                                src={gaitPhotos[analyzerView]}
                                savedPoints={watch(`movement.gaitPointsAnalyzed.${analyzerView}`)}
                                mode="hindfoot"
                                onFinalize={(base64, pts) => {
                                    setValue(`movement.gaitPhotosAnalyzed.${analyzerView}`, base64, { shouldDirty: true });
                                    setValue(`movement.gaitPointsAnalyzed.${analyzerView}`, pts, { shouldDirty: true });
                                    setAnalyzerView(null);
                                    toast.success("Análise de marcha processada!");
                                }}
                            />
                        )}
                    </div>

                    <DialogFooter className="mr-8 mb-6 mt-6 flex gap-4">
                        <Button
                            variant="default"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl uppercase font-black tracking-widest text-xs h-12 px-8"
                            onClick={() => (window as any).finalizeCimetografo?.()}
                        >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Concluir Análise
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <VideoFrameGrabberModal
                open={grabberOpen}
                onClose={() => setGrabberOpen(false)}
                slots={[
                    { id: 'midstance_left', label: 'Apoio Médio (Pé E)', value: gaitPhotos['midstance_left'] || null },
                    { id: 'midstance_right', label: 'Apoio Médio (Pé D)', value: gaitPhotos['midstance_right'] || null },
                    { id: 'running_heel_strike', label: 'Corrida (Retropé)', value: gaitPhotos['running_heel_strike'] || null },
                ]}
                onCaptureToSlot={(id, base64) => {
                    setValue(`movement.gaitPhotos.${id}`, base64, { shouldDirty: true, shouldValidate: true });
                }}
            />
        </AccordionItem>
    );
}
