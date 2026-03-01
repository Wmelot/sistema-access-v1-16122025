"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Fingerprint, Target, Activity, ShieldCheck, AlertCircle, Zap, Plus, Search, Trash2, Layers, MoveDiagonal, Droplets, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useFieldArray } from "react-hook-form";

const MUSCLE_OPTIONS = [
    // Cabeça e Pescoço (Referência Travell & Simons)
    { id: "sternocleidomastoid", label: "Esternocleidomastoideo (ECM)", region: "coluna_cervical" },
    { id: "scalenes", label: "Escalenos (Anterior/Médio/Posterior)", region: "coluna_cervical" },
    { id: "suboccipitals", label: "Suboccipitais", region: "coluna_cervical" },
    { id: "splenius_capitis", label: "Esplênio da Cabeça/Pescoço", region: "coluna_cervical" },
    { id: "masseter", label: "Masseter", region: "atm" },
    { id: "temporalis", label: "Temporal", region: "atm" },
    { id: "pterygoids", label: "Pterigóideos", region: "atm" },
    { id: "longus_colli", label: "Longo do Pescoço", region: "coluna_cervical" },

    // Ombro e Membro Superior
    { id: "trapezius_sup", label: "Trapézio Superior", region: "ombro" },
    { id: "trapezius_mid", label: "Trapézio Médio", region: "ombro" },
    { id: "trapezius_inf", label: "Trapézio Inferior", region: "ombro" },
    { id: "levator_scapulae", label: "Elevador da Escápula", region: "ombro" },
    { id: "supraspinatus", label: "Supraespinal", region: "ombro" },
    { id: "infraspinatus", label: "Infraespinal", region: "ombro" },
    { id: "teres_minor", label: "Redondo Menor", region: "ombro" },
    { id: "teres_major", label: "Redondo Maior", region: "ombro" },
    { id: "subscapularis", label: "Subescapular", region: "ombro" },
    { id: "rhomboids", label: "Romboides (Maior/Menor)", region: "ombro" },
    { id: "serratus_anterior", label: "Serrátil Anterior", region: "ombro" },
    { id: "pectoralis_major", label: "Peitoral Maior", region: "ombro" },
    { id: "pectoralis_minor", label: "Peitoral Menor", region: "ombro" },
    { id: "deltoid_ant", label: "Deltoide Anterior", region: "ombro" },
    { id: "deltoid_mid", label: "Deltoide Médio", region: "ombro" },
    { id: "deltoid_post", label: "Deltoide Posterior", region: "ombro" },
    { id: "latissimus_dorsi", label: "Grande Dorsal", region: "ombro" },
    { id: "biceps_brachii", label: "Bíceps Braquial", region: "cotovelo_mao" },
    { id: "triceps_brachii", label: "Tríceps Braquial", region: "cotovelo_mao" },
    { id: "brachialis", label: "Braquial", region: "cotovelo_mao" },
    { id: "brachioradialis", label: "Braquiorradial", region: "cotovelo_mao" },
    { id: "supinator", label: "Supinador", region: "cotovelo_mao" },
    { id: "pronator_teres", label: "Pronador Redondo", region: "cotovelo_mao" },
    { id: "extensor_carpi_radialis", label: "Extensores do Punho", region: "cotovelo_mao" },
    { id: "flexor_carpi_radialis", label: "Flexores do Punho", region: "cotovelo_mao" },

    // Tronco e Coluna
    { id: "quadratus_lumborum", label: "Quadrado Lombar", region: "coluna_lombar" },
    { id: "paraspinals_lumbar", label: "Paravertebrais (Eretores da Espinha)", region: "coluna_lombar" },
    { id: "multifidus", label: "Multífidos", region: "coluna_lombar" },
    { id: "psoas_major", label: "Psoas Maior", region: "coluna_lombar" },
    { id: "iliacus", label: "Ilíaco", region: "quadril" },
    { id: "rectus_abdominis", label: "Reto Abdominal", region: "coluna_lombar" },
    { id: "obliques", label: "Oblíquos (Interno/Externo)", region: "coluna_lombar" },

    // Quadril e Membro Inferior
    { id: "gluteus_max", label: "Glúteo Máximo", region: "quadril" },
    { id: "gluteus_med", label: "Glúteo Médio", region: "quadril" },
    { id: "gluteus_min", label: "Glúteo Mínimo", region: "quadril" },
    { id: "piriformis", label: "Piriforme", region: "quadril" },
    { id: "tensor_fasciae_latae", label: "Tensor da Fáscia Lata (TFL)", region: "quadril" },
    { id: "adductor_longus", label: "Adutores", region: "quadril" },
    { id: "rectus_femoris", label: "Reto Femoral", region: "joelho" },
    { id: "vastus_medialis", label: "Vasto Medial (VMO)", region: "joelho" },
    { id: "vastus_lateralis", label: "Vasto Lateral", region: "joelho" },
    { id: "hamstrings", label: "Isquiotibiais (Bíceps/Semi)", region: "joelho" },
    { id: "popliteus", label: "Poplíteo", region: "joelho" },
    { id: "gastrocnemius", label: "Gastrocnêmio", region: "tornozelo_pe" },
    { id: "soleus", label: "Sóleo", region: "tornozelo_pe" },
    { id: "tibialis_anterior", label: "Tibial Anterior", region: "tornozelo_pe" },
    { id: "tibialis_posterior", label: "Tibial Posterior", region: "tornozelo_pe" },
    { id: "peroneals", label: "Fibulares", region: "tornozelo_pe" },
    { id: "plantaris", label: "Plantar", region: "tornozelo_pe" },
];

const JOINT_OPTIONS = [
    { id: "cervical_joint", label: "Cervical (Facetas/Processos)", region: "coluna_cervical" },
    { id: "thoracic_joint", label: "Torácica (Facetas/Costelas)", region: "coluna_toracica" },
    { id: "lumbar_joint", label: "Lombar (Facetas/Processos)", region: "coluna_lombar" },
    { id: "si_joint", label: "Sacro-Ilíaca", region: "coluna_lombar" },
    { id: "pubic_symphysis", label: "Sínfise Púbica", region: "coluna_lombar" },
    { id: "shoulder_gh", label: "Ombro (Glenoumeral)", region: "ombro" },
    { id: "shoulder_ac", label: "Ombro (Acromioclavicular)", region: "ombro" },
    { id: "shoulder_sc", label: "Ombro (Esternoclavicular)", region: "ombro" },
    { id: "shoulder_st", label: "Ombro (Escápulo-Torácica)", region: "ombro" },
    { id: "elbow_hu", label: "Cotovelo (Umeroulnar)", region: "cotovelo_mao" },
    { id: "elbow_hr", label: "Cotovelo (Umerorradial)", region: "cotovelo_mao" },
    { id: "elbow_rup", label: "Cotovelo (Radioulnar Proximal)", region: "cotovelo_mao" },
    { id: "elbow_rui", label: "Cotovelo (Radioulnar Intermédia)", region: "cotetovelo_mao" },
    { id: "wrist_rc", label: "Punho (Radiocarpal)", region: "cotovelo_mao" },
    { id: "wrist_mc", label: "Mão (Mediocárpica)", region: "cotovelo_mao" },
    { id: "hand_cmc", label: "Mão (Carpometacarpais)", region: "cotovelo_mao" },
    { id: "hand_mcp", label: "Mão (Metacarpofalângicas)", region: "cotovelo_mao" },
    { id: "hip_coxo", label: "Quadril (Coxofemoral)", region: "quadril" },
    { id: "knee_tf", region: "joelho", label: "Joelho (Tibiofemoral)" },
    { id: "knee_pf", region: "joelho", label: "Joelho (Patelofemoral)" },
    { id: "knee_prox_tf", region: "joelho", label: "Joelho (Tibiofibular Proximal)" },
    { id: "ankle_tc", region: "tornozelo_pe", label: "Tornozelo (Talocrural)" },
    { id: "ankle_st", region: "tornozelo_pe", label: "Tornozelo (Subtalar)" },
    { id: "foot_mtp", region: "tornozelo_pe", label: "Pé (Metatarsofalângicas)" },
    { id: "atm_joint", label: "ATM", region: "atm" },
];

const VERTEBRAL_SEGMENTS = {
    C: [1, 2, 3, 4, 5, 6, 7],
    T: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    L: [1, 2, 3, 4, 5],
    S: [1]
};

const EDEMA_GRADES = [
    { id: "0", label: "Ausente", desc: "Sem cacifo" },
    { id: "1", label: "Grau I (+)", desc: "Depressão leve (2mm), desaparece rápido" },
    { id: "2", label: "Grau II (++)", desc: "Depressão moderada (4mm), desaparece em 10-15s" },
    { id: "3", label: "Grau III (+++)", desc: "Depressão profunda (6mm), dura mais de 1min" },
    { id: "4", label: "Grau IV (++++)", desc: "Depressão muito profunda (8mm), dura mais de 2min" },
];

interface PalpationAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string; iconColor: string; bg: string };
}

export function PalpationAccordion({ openSection, isSectionFilled, sectionStyle }: PalpationAccordionProps) {
    const { register, watch, setValue } = useFormContext();
    const findings = watch("palpation.findings") || [];
    const selectedRegions = watch("anamnesis.mainRegions") || [];
    const [searchTerm, setSearchTerm] = React.useState("");

    const addFinding = (muscle: typeof MUSCLE_OPTIONS[0]) => {
        if (findings.some((f: any) => f.muscleId === muscle.id)) return;
        const newFinding = {
            muscleId: muscle.id,
            label: muscle.label,
            side: "unilateral", // unilateral, left, right, bilateral
            sensitivity: "none", // none, mild, moderate, severe
            triggerPoint: "none", // none, active, latent
            obs: ""
        };
        setValue("palpation.findings", [...findings, newFinding]);
    };

    const removeFinding = (muscleId: string) => {
        setValue("palpation.findings", findings.filter((f: any) => f.muscleId !== muscleId));
    };

    const updateFinding = (muscleId: string, field: string, value: any) => {
        const updated = findings.map((f: any) =>
            f.muscleId === muscleId ? { ...f, [field]: value } : f
        );
        setValue("palpation.findings", updated);
    };

    const searchResults = React.useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();
        const available = MUSCLE_OPTIONS.filter(opt =>
            !findings.some((f: any) => f.muscleId === opt.id) &&
            opt.label.toLowerCase().includes(lowerSearch)
        );

        const suggestions = available.filter(opt => selectedRegions.includes(opt.region));
        const others = available.filter(opt => !selectedRegions.includes(opt.region));

        return { suggestions, others };
    }, [searchTerm, findings, selectedRegions]);

    const activeJointOptions = React.useMemo(() => {
        if (selectedRegions.length === 0) return JOINT_OPTIONS;

        return JOINT_OPTIONS.filter(j => {
            // Check direct match
            if (selectedRegions.includes(j.region)) return true;

            // Shoulder logic: Show cervical and thoracic
            if (selectedRegions.includes('ombro') && (j.region === 'coluna_cervical' || j.region === 'coluna_toracica')) return true;

            // Hip logic: Show lumbar (which includes sacroiliac/pubic)
            if (selectedRegions.includes('quadril') && j.region === 'coluna_lombar') return true;

            return false;
        });
    }, [selectedRegions]);

    const { control } = useFormContext();
    const { fields: edemaFields, append: appendEdema, remove: removeEdema } = useFieldArray({
        control,
        name: "palpation.edema_list"
    });

    return (
        <AccordionItem
            value="palpation"
            className={cn(
                "border rounded-[2rem] border-l-4 transition-all duration-300 shadow-sm overflow-hidden",
                openSection === 'palpation' ? 'bg-white ring-2 ring-rose-50' : 'bg-white/50',
                isSectionFilled('palpation') ? 'border-slate-200' : 'border-slate-100',
                sectionStyle.border
            )}
        >
            <AccordionTrigger className="px-8 py-6 hover:no-underline flex gap-2 items-center text-left group">
                <div className="flex items-center gap-4 flex-1">
                    <div className={cn("p-2 rounded-xl transition-colors", openSection === 'palpation' ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-rose-50 group-hover:text-rose-600")}>
                        <Fingerprint className="h-5 w-5 transition-colors group-hover:animate-bounce" />
                    </div>
                    <div>
                        <span className={cn("font-black text-lg tracking-tight", openSection === 'palpation' ? "text-slate-900" : "text-slate-600")}>Palpação e Trigger Points</span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Sensibilidade, nódulos e pontos gatilho</p>
                    </div>
                </div>
                {isSectionFilled('palpation') && (
                    <Badge variant="outline" className="bg-rose-100 text-rose-700 border-none text-[10px] h-6 px-3 rounded-full font-black">PREENCHIDO</Badge>
                )}
            </AccordionTrigger>
            <AccordionContent className="px-8 pb-10 pt-4 space-y-8 border-t border-slate-50">
                <Tabs defaultValue="muscular" className="w-full">
                    <TabsList className="grid grid-cols-3 h-14 bg-slate-100/50 p-1.5 rounded-2xl mb-8">
                        <TabsTrigger value="muscular" className="rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-rose-600 data-[state=active]:shadow-sm">
                            <Fingerprint className="h-3.5 w-3.5 mr-2" /> Muscular
                        </TabsTrigger>
                        <TabsTrigger value="articular" className="rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-rose-600 data-[state=active]:shadow-sm">
                            <Layers className="h-3.5 w-3.5 mr-2" /> Articular e Segmentar
                        </TabsTrigger>
                        <TabsTrigger value="edema" className="rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-rose-600 data-[state=active]:shadow-sm">
                            <Droplets className="h-3.5 w-3.5 mr-2" /> Edema (CACIFO)
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="muscular" className="space-y-8">

                        {/* Search / Add Section */}
                        <div className="relative max-w-md mx-auto">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <Search className="h-4 w-4" />
                            </div>
                            <Input
                                placeholder="Buscar músculo para avaliar..."
                                className="h-14 pl-12 pr-4 bg-slate-50 border-transparent rounded-2xl font-bold focus:bg-white focus:ring-rose-600 transition-all shadow-inner"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />

                            {searchTerm && (searchResults.suggestions.length > 0 || searchResults.others.length > 0) && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-[100] max-h-[300px] overflow-y-auto animate-in fade-in slide-in-from-top-2">
                                    {searchResults.suggestions.length > 0 && (
                                        <div className="px-3 py-2 text-[10px] font-black text-rose-500 uppercase tracking-widest border-b border-rose-50 mb-1">
                                            Sugestões para a região
                                        </div>
                                    )}
                                    {searchResults.suggestions.map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => {
                                                addFinding(opt);
                                                setSearchTerm("");
                                            }}
                                            className="w-full text-left p-3 hover:bg-rose-50 rounded-xl flex items-center justify-between group transition-colors"
                                        >
                                            <span className="text-xs font-black text-slate-600 uppercase tracking-tight group-hover:text-rose-700">{opt.label}</span>
                                            <Plus className="h-3 w-3 text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    ))}

                                    {searchResults.others.length > 0 && (
                                        <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mt-2 mb-1">
                                            Outros Músculos
                                        </div>
                                    )}
                                    {searchResults.others.map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => {
                                                addFinding(opt);
                                                setSearchTerm("");
                                            }}
                                            className="w-full text-left p-3 hover:bg-rose-50 rounded-xl flex items-center justify-between group transition-colors"
                                        >
                                            <span className="text-xs font-black text-slate-400 uppercase tracking-tight group-hover:text-rose-700">{opt.label}</span>
                                            <Plus className="h-3 w-3 text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {findings.length === 0 ? (
                            <div className="py-16 bg-slate-50 border-2 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center text-center px-6">
                                <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                                    <Target className="h-8 w-8 text-slate-200" />
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-loose">Nenhuma alteração palpatória registrada</p>
                                <p className="text-[10px] text-slate-300 mt-2 uppercase font-bold tracking-tighter">Use a busca acima para adicionar músculos com dor ou trigger points.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {findings.map((finding: any) => (
                                    <div key={finding.muscleId} className="group p-6 bg-white border border-slate-100 rounded-[2.5rem] hover:border-rose-200 shadow-sm transition-all relative">
                                        <button
                                            onClick={() => removeFinding(finding.muscleId)}
                                            className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>

                                        <div className="flex flex-col gap-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-rose-50 rounded-lg">
                                                    <Fingerprint className="h-4 w-4 text-rose-600" />
                                                </div>
                                                <h5 className="font-black text-slate-800 uppercase text-[11px] tracking-widest">{finding.label}</h5>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter ml-1">Lado</label>
                                                    <Select value={finding.side} onValueChange={(v) => updateFinding(finding.muscleId, 'side', v)}>
                                                        <SelectTrigger className="h-10 bg-slate-50 border-transparent rounded-xl text-[10px] font-black uppercase">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="z-[150]">
                                                            <SelectItem value="unilateral" className="text-[10px] font-black uppercase">Unilateral</SelectItem>
                                                            <SelectItem value="left" className="text-[10px] font-black uppercase">Esquerda</SelectItem>
                                                            <SelectItem value="right" className="text-[10px] font-black uppercase">Direita</SelectItem>
                                                            <SelectItem value="bilateral" className="text-[10px] font-black uppercase">Bilateral</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter ml-1">Sensibilidade</label>
                                                    <Select value={finding.sensitivity} onValueChange={(v) => updateFinding(finding.muscleId, 'sensitivity', v)}>
                                                        <SelectTrigger className="h-10 bg-slate-50 border-transparent rounded-xl text-[10px] font-black uppercase">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="z-[150]">
                                                            <SelectItem value="none" className="text-[10px] font-black uppercase text-emerald-600">Sem Dor</SelectItem>
                                                            <SelectItem value="mild" className="text-[10px] font-black uppercase text-amber-500">Leve</SelectItem>
                                                            <SelectItem value="moderate" className="text-[10px] font-black uppercase text-orange-500">Moderada</SelectItem>
                                                            <SelectItem value="severe" className="text-[10px] font-black uppercase text-rose-600">Severa</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <div className="p-4 bg-slate-50/50 rounded-2xl space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                        <Target className="h-3 w-3" />
                                                        Ponto Gatilho (Myofascial)
                                                    </span>
                                                    <Badge className={cn(
                                                        "text-[8px] font-black uppercase",
                                                        finding.triggerPoint === 'none' ? "bg-slate-200 text-slate-500" :
                                                            finding.triggerPoint === 'active' ? "bg-rose-500 text-white animate-pulse" : "bg-amber-500 text-white"
                                                    )}>
                                                        {finding.triggerPoint === 'none' ? "Ausente" : finding.triggerPoint === 'active' ? "Ativo" : "Latente"}
                                                    </Badge>
                                                </div>
                                                <div className="flex gap-2">
                                                    {['none', 'latent', 'active'].map((tp) => (
                                                        <button
                                                            key={tp}
                                                            type="button"
                                                            onClick={() => updateFinding(finding.muscleId, 'triggerPoint', tp)}
                                                            className={cn(
                                                                "flex-1 py-2 rounded-xl text-[9px] font-black uppercase transition-all",
                                                                finding.triggerPoint === tp ?
                                                                    (tp === 'none' ? "bg-slate-900 text-white shadow-md" :
                                                                        tp === 'latent' ? "bg-amber-500 text-white shadow-md" :
                                                                            "bg-rose-600 text-white shadow-md") :
                                                                    "bg-white border border-slate-100 text-slate-400"
                                                            )}
                                                        >
                                                            {tp === 'none' ? "Nenhum" : tp === 'latent' ? "Latente" : "Ativo"}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <Input
                                                placeholder="Nota adicional (Ex: Dor referida para face...)"
                                                value={finding.obs}
                                                onChange={(e) => updateFinding(finding.muscleId, 'obs', e.target.value)}
                                                className="h-10 bg-slate-50 border-transparent rounded-xl text-[10px] font-medium px-4 focus:bg-white focus:ring-rose-600"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="articular" className="space-y-10 animate-in fade-in duration-500">
                        <div className="bg-rose-50/50 p-6 rounded-[2rem] border border-rose-100 flex gap-4">
                            <MoveDiagonal className="h-5 w-5 text-rose-600 mt-0.5 shrink-0" />
                            <div>
                                <h6 className="text-[11px] font-black text-rose-900 uppercase tracking-widest mb-1">Palpação Articular e Mobilidade Segmentar</h6>
                                <p className="text-[10px] text-rose-800 leading-relaxed font-bold opacity-80 uppercase tracking-tighter">
                                    Avalie a mobilidade acessória (Joint Play) e sensibilidade das estruturas articulares.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                            {activeJointOptions.map(joint => {
                                const val = watch(`palpation.joints.${joint.id}`) || "normal";
                                return (
                                    <div key={joint.id} className="flex items-center justify-between p-4 bg-white border border-slate-50 rounded-2xl shadow-sm">
                                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{joint.label}</span>
                                        <div className="flex gap-1.5">
                                            {[
                                                { id: 'hypo', label: 'HIPO', color: 'bg-amber-100 text-amber-700' },
                                                { id: 'normal', label: 'NORMAL', color: 'bg-emerald-100 text-emerald-700' },
                                                { id: 'hyper', label: 'HIPER', color: 'bg-rose-100 text-rose-700' }
                                            ].map(opt => (
                                                <button
                                                    key={opt.id}
                                                    type="button"
                                                    onClick={() => setValue(`palpation.joints.${joint.id}`, opt.id)}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-lg text-[9px] font-black transition-all",
                                                        val === opt.id ? opt.color : "bg-slate-50 text-slate-300 hover:bg-slate-100"
                                                    )}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="space-y-6 pt-6 border-t border-slate-100">
                            <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sensibilidade por Segmento Vertebral (Pressão Postero-Anterior)</h6>
                            <div className="grid grid-cols-1 gap-6">
                                {Object.entries(VERTEBRAL_SEGMENTS).map(([level, nums]) => (
                                    <div key={level} className="space-y-3">
                                        <span className="text-[9px] font-black text-slate-800 ml-1">{level === 'C' ? 'CERVICAL' : level === 'T' ? 'TORÁCICA' : level === 'L' ? 'LOMBAR' : 'SACRAL'}</span>
                                        <div className="flex flex-wrap gap-2">
                                            {nums.map(n => {
                                                const segmentId = `${level}${n}`;
                                                const isSelected = (watch('palpation.segments') || []).includes(segmentId);
                                                return (
                                                    <button
                                                        key={segmentId}
                                                        type="button"
                                                        onClick={() => {
                                                            const current = watch('palpation.segments') || [];
                                                            const next = isSelected
                                                                ? current.filter((s: string) => s !== segmentId)
                                                                : [...current, segmentId];
                                                            setValue('palpation.segments', next);
                                                        }}
                                                        className={cn(
                                                            "h-10 w-10 rounded-xl text-[10px] font-black transition-all border",
                                                            isSelected
                                                                ? "bg-rose-600 border-rose-600 text-white shadow-lg"
                                                                : "bg-white border-slate-100 text-slate-400 hover:border-rose-200"
                                                        )}
                                                    >
                                                        {segmentId}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="edema" className="space-y-8 animate-in fade-in duration-500">
                        <div className="max-w-4xl mx-auto space-y-10">
                            <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100 flex gap-4">
                                <Droplets className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                                <div>
                                    <h6 className="text-[11px] font-black text-blue-900 uppercase tracking-widest mb-1">Avaliação de Edema e Sinal de CACIFO</h6>
                                    <p className="text-[10px] text-blue-800 leading-relaxed font-bold opacity-80 uppercase tracking-tighter">
                                        Pressione firmemente sobre a área edemaciada para verificar a presença de fóvea (Escala de Godet).
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {edemaFields.map((field, index) => (
                                    <div key={field.id} className="p-8 bg-white border border-slate-100 rounded-[3rem] shadow-sm hover:border-blue-200 transition-all relative group">
                                        <button
                                            type="button"
                                            onClick={() => removeEdema(index)}
                                            className="absolute top-6 right-6 p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>

                                        <div className="grid grid-cols-1 gap-8">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Localização do Edema</label>
                                                <Input
                                                    {...register(`palpation.edema_list.${index}.location`)}
                                                    placeholder="Ex: Maléolo Lateral D, Dorso do Pé..."
                                                    className="h-12 bg-slate-50 border-transparent rounded-2xl text-xs font-bold px-5 focus:bg-white focus:ring-blue-600 shadow-inner"
                                                />
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Grau do CACIFO</label>
                                                <div className="grid grid-cols-5 gap-3">
                                                    <TooltipProvider>
                                                        {EDEMA_GRADES.map((grade) => {
                                                            const isSelected = watch(`palpation.edema_list.${index}.grade`) === grade.id;
                                                            return (
                                                                <Tooltip key={grade.id}>
                                                                    <TooltipTrigger asChild>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setValue(`palpation.edema_list.${index}.grade`, grade.id)}
                                                                            className={cn(
                                                                                "h-14 rounded-2xl border text-[11px] font-black transition-all flex items-center justify-center uppercase tracking-tighter",
                                                                                isSelected
                                                                                    ? "bg-blue-600 border-blue-600 text-white shadow-lg scale-105"
                                                                                    : "bg-white border-slate-100 text-slate-400 hover:border-blue-200"
                                                                            )}
                                                                        >
                                                                            {grade.id === "0" ? "0" : `+${grade.id}`}
                                                                        </button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent className="bg-slate-900 border-none rounded-xl p-4 text-white shadow-2xl max-w-xs">
                                                                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">{grade.label}</p>
                                                                        <p className="text-[10px] font-bold opacity-80 leading-relaxed uppercase tracking-tighter">{grade.desc}</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            );
                                                        })}
                                                    </TooltipProvider>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => appendEdema({ location: "", grade: "0" })}
                                    className="w-full h-16 border-2 border-dashed border-blue-200 bg-blue-50/20 text-blue-600 rounded-[2.5rem] font-black text-xs space-x-2 hover:bg-blue-50 hover:border-blue-300 transition-all uppercase tracking-widest"
                                >
                                    <Plus className="h-4 w-4" />
                                    <span>Adicionar Local de Edema</span>
                                </Button>

                                {edemaFields.length === 0 && (
                                    <div className="py-20 bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center text-center px-6">
                                        <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                                            <Droplets className="h-8 w-8 text-slate-200" />
                                        </div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-loose">Nenhum edema registrado</p>
                                        <p className="text-[10px] text-slate-300 mt-2 uppercase font-bold tracking-tighter">Clique no botão acima para iniciar a avaliação do sinal de cacifo.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </AccordionContent>
        </AccordionItem >
    );
}

