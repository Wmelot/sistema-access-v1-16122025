import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { GlycemicScoreCalculator } from "./GlycemicScoreCalculator";
import { InteractiveDermatomeMap } from "@/features/forms/pbe-5/components/neurological/InteractiveDermatomeMap";
import { EcnEvaluation } from "./EcnEvaluation";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Footprints,
    Stethoscope,
    HeartPulse,
    Zap,
    Scan,
    ShieldCheck,
    AlertTriangle,
    CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { checkITBStatus } from "@/utils/clinical-references";

interface InsensitiveFootAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string; iconColor: string };
}

const MONOFILAMENT_POINTS = [
    { id: "hallux", label: "Hálux (Polpa)" },
    { id: "meta1", label: "1ª Cabeça Meta" },
    { id: "meta3", label: "3ª Cabeça Meta" },
    { id: "meta5", label: "5ª Cabeça Meta" },
];

const IWGDF_LEVELS = [
    {
        value: "0",
        color: "bg-emerald-50 border-emerald-200 text-emerald-900",
        badge: "Baixo Risco",
        badgeColor: "bg-emerald-100 text-emerald-700",
        desc: "Sensibilidade e circulação preservadas. Rastreio anual.",
        followUp: "12 meses"
    },
    {
        value: "1",
        color: "bg-amber-50 border-amber-200 text-amber-900",
        badge: "Risco Moderado",
        badgeColor: "bg-amber-100 text-amber-700",
        desc: "Perda de sensibilidade protetora OU isquemia periférica. Rastreio semestral.",
        followUp: "6 meses"
    },
    {
        value: "2",
        color: "bg-orange-50 border-orange-200 text-orange-900",
        badge: "Risco Elevado",
        badgeColor: "bg-orange-100 text-orange-700",
        desc: "Perda de sensibilidade + Deformidade ou Isquemia. Rastreio trimestral.",
        followUp: "3 meses"
    },
    {
        value: "3",
        color: "bg-red-50 border-red-200 text-red-900",
        badge: "Risco Muito Elevado",
        badgeColor: "bg-red-100 text-red-700",
        desc: "Histórico de úlcera, amputação ou Charcot ativo. Rastreio 1–2 meses.",
        followUp: "1–2 meses"
    },
];

export function InsensitiveFootAccordion({ openSection, isSectionFilled, sectionStyle }: InsensitiveFootAccordionProps) {
    const form = useFormContext();
    const { register, watch, setValue, control } = form;

    const glucoseControl = watch("hma.glucoseControl") ?? 5;
    const vasc = useWatch({ control, name: "vascular" });
    const neuropathic = useWatch({ control, name: "neuropathic" });
    const inspection = useWatch({ control, name: "inspection" });
    const iwgdfLevel = watch("classification.iwgdfLevel") || "0";
    const hmaHistory = watch("hma.history") || "";

    const itbResults = React.useMemo(() => {
        const brachialMax = Math.max(
            Number(vasc?.brachial_left || 0),
            Number(vasc?.brachial_right || 0)
        );
        if (brachialMax === 0) return { left: null, right: null };
        const ankleLeft = Math.max(Number(vasc?.pedis_left || 0), Number(vasc?.tibial_left || 0));
        const ankleRight = Math.max(Number(vasc?.pedis_right || 0), Number(vasc?.tibial_right || 0));
        return {
            left: ankleLeft > 0 ? Number((ankleLeft / brachialMax).toFixed(2)) : null,
            right: ankleRight > 0 ? Number((ankleRight / brachialMax).toFixed(2)) : null,
        };
    }, [vasc]);

    const totalPreserved = React.useCallback((side: "left" | "right") => {
        const sideData = neuropathic?.[side] || {};
        return MONOFILAMENT_POINTS.filter(p => sideData[p.id]).length;
    }, [neuropathic]);

    React.useEffect(() => {
        const hasAmputation =
            Boolean(inspection?.left?.amputaes) ||
            Boolean(inspection?.right?.amputaes) ||
            hmaHistory.toLowerCase().includes("amputa");

        const hasUlcer =
            Boolean(inspection?.left?.lceraferida) ||
            Boolean(inspection?.right?.lceraferida) ||
            hmaHistory.toLowerCase().includes("úlcera") ||
            hmaHistory.toLowerCase().includes("ulcera");

        const hasDeformity =
            Boolean(inspection?.left?.deformidades) ||
            Boolean(inspection?.right?.deformidades);

        const lops =
            (neuropathic?.ecn?.score >= 3) ||
            (totalPreserved("left") < 4) ||
            (totalPreserved("right") < 4);

        const pad =
            vasc?.pedisPulse === "Ausente" ||
            vasc?.tibialPulse === "Ausente" ||
            (itbResults.left !== null && (itbResults.left < 0.9 || itbResults.left > 1.3)) ||
            (itbResults.right !== null && (itbResults.right < 0.9 || itbResults.right > 1.3));

        let newLevel = "0";

        if (hasUlcer || hasAmputation) {
            newLevel = "3";
        } else if ((lops && pad) || (lops && hasDeformity) || (pad && hasDeformity)) {
            newLevel = "2";
        } else if (lops || pad) {
            newLevel = "1";
        }

        if (iwgdfLevel !== newLevel) {
            setValue("classification.iwgdfLevel", newLevel, { shouldDirty: true });
        }
    }, [inspection, neuropathic, vasc, itbResults, hmaHistory, iwgdfLevel, setValue, totalPreserved]);

    const activeIwgdf = IWGDF_LEVELS.find(l => l.value === String(iwgdfLevel)) || IWGDF_LEVELS[0];

    const getITBStatusView = (val: number | null) => {
        if (val === null) return null;
        const status = checkITBStatus(val);
        return (
            <div className={cn("text-[9px] font-black mt-2 px-2 py-1 rounded w-full flex justify-center items-center text-center uppercase tracking-tighter leading-tight", status.color)}>
                {status.label}
            </div>
        );
    };

    return (
        <AccordionItem
            value="insensitive_foot"
            data-value="insensitive_foot"
            className={cn(
                "border rounded-xl border-l-4 transition-all duration-300 shadow-sm col-span-1 md:col-span-2",
                openSection === 'insensitive_foot' ? 'bg-white ring-2 ring-teal-50' : 'bg-slate-50',
                sectionStyle.border
            )}
        >
            <AccordionTrigger className="px-5 py-4 font-bold text-slate-700 hover:no-underline flex gap-2 items-center text-left group">
                <div className="flex items-center gap-3 flex-1 text-base font-black uppercase tracking-tight">
                    <Footprints className={cn("h-6 w-6 transition-colors group-hover:animate-bounce", sectionStyle.iconColor)} />
                    <span className="text-teal-700">Avaliação do Pé Insensível (IWGDF)</span>
                </div>
                <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 text-[10px] h-6 font-black uppercase tracking-widest px-3 mr-4">
                    PÉ DIABÉTICO ATIVO
                </Badge>
            </AccordionTrigger>
            <AccordionContent className="p-0 border-t border-teal-100">
                <Tabs defaultValue="metabolic" className="w-full flex justify-center flex-col pt-6">
                    <div className="px-6 flex justify-center">
                        <TabsList className="flex w-full md:w-auto min-w-[300px] bg-teal-50/50 p-1.5 rounded-full mb-2 border border-teal-100/50 shadow-inner">
                            <TabsTrigger value="metabolic" className="flex-1 rounded-full data-[state=active]:bg-teal-600 data-[state=active]:text-white font-black text-[10px] tracking-widest uppercase py-2.5 transition-all data-[state=active]:shadow-lg text-teal-700/60">
                                <Stethoscope className="w-3.5 h-3.5 mr-2" /> Metabólico
                            </TabsTrigger>
                            <TabsTrigger value="inspection" className="flex-1 rounded-full data-[state=active]:bg-teal-600 data-[state=active]:text-white font-black text-[10px] tracking-widest uppercase py-2.5 transition-all data-[state=active]:shadow-lg text-teal-700/60">
                                <Scan className="w-3.5 h-3.5 mr-2" /> Inspeção
                            </TabsTrigger>
                            <TabsTrigger value="vascular" className="flex-1 rounded-full data-[state=active]:bg-teal-600 data-[state=active]:text-white font-black text-[10px] tracking-widest uppercase py-2.5 transition-all data-[state=active]:shadow-lg text-teal-700/60">
                                <HeartPulse className="w-3.5 h-3.5 mr-2" /> Vascular
                            </TabsTrigger>
                            <TabsTrigger value="neuropathic" className="flex-1 rounded-full data-[state=active]:bg-teal-600 data-[state=active]:text-white font-black text-[10px] tracking-widest uppercase py-2.5 transition-all data-[state=active]:shadow-lg text-teal-700/60">
                                <Zap className="w-3.5 h-3.5 mr-2" /> Neuropático
                            </TabsTrigger>
                            <TabsTrigger value="classification" className="flex-1 rounded-full data-[state=active]:bg-teal-600 data-[state=active]:text-white font-black text-[10px] tracking-widest uppercase py-2.5 transition-all data-[state=active]:shadow-lg text-teal-700/60">
                                <ShieldCheck className="w-3.5 h-3.5 mr-2" /> Risco
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* METABOLIC TAB */}
                    <TabsContent value="metabolic" className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="md:col-span-2">
                                <GlycemicScoreCalculator />
                            </div>
                            <div className="md:col-span-2 space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Avaliação Nutricional / Dieta</Label>
                                    <Textarea {...register("hma.diet")} placeholder="Descreva a frequência e aderência à dieta prescrita..." className="min-h-[100px] text-sm" />
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* INSPECTION TAB */}
                    <TabsContent value="inspection" className="p-6 space-y-8 animate-in fade-in zoom-in-95 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-2">Pé Esquerdo</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {["Calosidades", "Micoses", "Temp. Alterada", "Deformidades", "Amputações", "Fissuras", "Edema", "Hiperemia", "Úlcera/Ferida"].map(item => {
                                        const rName = `inspection.left.${item.toLowerCase().replace(/[^a-z]/g, '')}`;
                                        return (
                                            <label key={item} className={cn(
                                                "flex items-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-all",
                                                watch(rName) ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                            )}>
                                                <Checkbox
                                                    checked={!!watch(rName)}
                                                    onCheckedChange={(checked) => setValue(rName, !!checked)}
                                                    className="rounded-lg h-4 w-4"
                                                />
                                                <span className="truncate">{item}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">Pé Direito</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {["Calosidades", "Micoses", "Temp. Alterada", "Deformidades", "Amputações", "Fissuras", "Edema", "Hiperemia", "Úlcera/Ferida"].map(item => {
                                        const rName = `inspection.right.${item.toLowerCase().replace(/[^a-z]/g, '')}`;
                                        return (
                                            <label key={item} className={cn(
                                                "flex items-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-all",
                                                watch(rName) ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                            )}>
                                                <Checkbox
                                                    checked={!!watch(rName)}
                                                    onCheckedChange={(checked) => setValue(rName, !!checked)}
                                                    className="rounded-lg h-4 w-4"
                                                />
                                                <span className="truncate">{item}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50/50 p-5 rounded-2xl border border-dashed border-slate-200 space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Higiene e Corte das Unhas</Label>
                            <select
                                {...register('inspection.nails')}
                                className="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                            >
                                <option value="">Selecionar avaliação...</option>
                                <option value="adequado">Adequado (Corte reto, sem encravar)</option>
                                <option value="regular">Regular (Corte curto demais ou irregular)</option>
                                <option value="critico">Crítico (Encravada / Onicomicose severa)</option>
                            </select>
                        </div>
                    </TabsContent>

                    {/* VASCULAR TAB */}
                    <TabsContent value="vascular" className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="md:col-span-2 grid grid-cols-2 gap-4">
                                {[
                                    { label: "Braquial Esquerdo", field: "brachial_left" },
                                    { label: "Braquial Direito", field: "brachial_right" },
                                    { label: "Tibial Post. (E)", field: "tibial_left" },
                                    { label: "Tibial Post. (D)", field: "tibial_right" },
                                    { label: "Pediosa (E)", field: "pedis_left" },
                                    { label: "Pediosa (D)", field: "pedis_right" },
                                ].map(({ label, field }) => (
                                    <div key={field} className="space-y-1">
                                        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label} (mmHg)</Label>
                                        <Input type="number" {...register(`vascular.${field}`)} className="h-10 text-lg font-black text-center" />
                                    </div>
                                ))}
                            </div>
                            <div className="bg-slate-50 p-6 rounded-2xl border flex flex-col items-center justify-center gap-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Índice Tornozelo-Braço (ITB)</Label>
                                <div className="flex gap-6">
                                    <div className="text-center space-y-1 flex-1 flex flex-col items-center">
                                        <div className="text-[9px] font-black text-blue-600 uppercase">Esquerdo</div>
                                        <div className={cn("text-2xl font-black p-2 rounded-xl border w-24 text-center", itbResults.left ? "bg-white" : "bg-slate-100 text-slate-400")}>
                                            {itbResults.left || "--"}
                                        </div>
                                        {getITBStatusView(itbResults.left)}
                                    </div>
                                    <div className="text-center space-y-1 flex-1 flex flex-col items-center">
                                        <div className="text-[9px] font-black text-emerald-600 uppercase">Direito</div>
                                        <div className={cn("text-2xl font-black p-2 rounded-xl border w-24 text-center", itbResults.right ? "bg-white" : "bg-slate-100 text-slate-400")}>
                                            {itbResults.right || "--"}
                                        </div>
                                        {getITBStatusView(itbResults.right)}
                                    </div>
                                </div>
                            </div>

                            {/* PULSOS */}
                            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Pulso Pedioso</Label>
                                    <div className="flex gap-2">
                                        {["Normal", "Ausente"].map(opt => (
                                            <button
                                                key={opt}
                                                type="button"
                                                onClick={() => setValue("vascular.pedisPulse", opt)}
                                                className={cn(
                                                    "flex-1 py-3 rounded-2xl border text-xs font-black uppercase tracking-widest transition-all",
                                                    (watch("vascular.pedisPulse") || "Normal") === opt
                                                        ? opt === "Normal" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"
                                                        : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                                                )}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Pulso Tibial Posterior</Label>
                                    <div className="flex gap-2">
                                        {["Normal", "Ausente"].map(opt => (
                                            <button
                                                key={opt}
                                                type="button"
                                                onClick={() => setValue("vascular.tibialPulse", opt)}
                                                className={cn(
                                                    "flex-1 py-3 rounded-2xl border text-xs font-black uppercase tracking-widest transition-all",
                                                    (watch("vascular.tibialPulse") || "Normal") === opt
                                                        ? opt === "Normal" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"
                                                        : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                                                )}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* NEUROPATHIC TAB */}
                    <TabsContent value="neuropathic" className="p-6 space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                            {/* Monofilamento */}
                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <Label className="text-sm font-black uppercase tracking-widest text-slate-800 flex justify-between border-b pb-2">
                                        Sensibilidade Protetora
                                        <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                            MONOFILAMENTO 10g
                                        </span>
                                    </Label>
                                </div>
                                {(["left", "right"] as const).map(side => {
                                    const preserved = totalPreserved(side);
                                    return (
                                        <div key={side} className="space-y-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                                            <div className="flex justify-between items-center mb-2">
                                                <Label className="text-xs font-black uppercase tracking-widest text-slate-600">
                                                    Pé {side === "left" ? "Esquerdo" : "Direito"}
                                                </Label>
                                                <span className={cn(
                                                    "text-[9px] font-black px-2 py-0.5 rounded-md uppercase border",
                                                    preserved === 4 ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"
                                                )}>
                                                    {preserved}/4 preservados
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                {MONOFILAMENT_POINTS.map(point => {
                                                    const path = `neuropathic.${side}.${point.id}`;
                                                    return (
                                                        <div key={point.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white hover:border-blue-200 transition-colors">
                                                            <Checkbox
                                                                id={`${side}-${point.id}`}
                                                                checked={!!watch(path)}
                                                                onCheckedChange={(checked) => setValue(path, !!checked)}
                                                            />
                                                            <label htmlFor={`${side}-${point.id}`} className="text-[10px] font-black uppercase tracking-tight text-slate-600 cursor-pointer">
                                                                {point.label}
                                                            </label>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}

                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex gap-3 text-amber-900 text-[10px] items-start mt-4">
                                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                    <p className="font-medium leading-relaxed">A perda de sensibilidade protetora no monofilamento em <strong>qualquer ponto</strong> configura risco aumentado para úlceras (IWGDF ≥ 1).</p>
                                </div>
                            </div>

                            {/* Mapa Dermatômico */}
                            <div className="space-y-4">
                                <Label className="text-sm font-black uppercase tracking-widest text-slate-800 flex justify-between border-b pb-2 mb-4">
                                    Mapa de Dermátomos
                                    <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full">
                                        OPCIONAL
                                    </span>
                                </Label>
                                <div className="scale-95 origin-top">
                                    <InteractiveDermatomeMap
                                        selected={watch('neuropathic.dermatomes') || []}
                                        onSelectionChange={(ids) => setValue('neuropathic.dermatomes', ids)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100">
                            <EcnEvaluation
                                initialValues={watch('neuropathic.ecn')}
                                onScoreChange={(score: number, details: any) => setValue('neuropathic.ecn', { score, ...details })}
                            />
                        </div>
                    </TabsContent>

                    {/* CLASSIFICATION TAB */}
                    <TabsContent value="classification" className="p-6 space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {IWGDF_LEVELS.map(lvl => (
                                <button
                                    key={lvl.value}
                                    type="button"
                                    onClick={() => setValue("classification.iwgdfLevel", lvl.value)}
                                    className={cn(
                                        "p-4 rounded-2xl border-2 transition-all text-left space-y-2",
                                        iwgdfLevel === lvl.value
                                            ? `${lvl.color} shadow-lg scale-[1.02] border-current`
                                            : "bg-white border-slate-100 hover:border-slate-300"
                                    )}
                                >
                                    <div className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full inline-block", iwgdfLevel === lvl.value ? lvl.badgeColor : "bg-slate-100 text-slate-400")}>
                                        Nível {lvl.value}
                                    </div>
                                    <div className="text-xs font-black leading-tight text-slate-900">{lvl.badge}</div>
                                    <div className="text-[9px] opacity-70 leading-relaxed">{lvl.desc}</div>
                                </button>
                            ))}
                        </div>
                        <div className={cn("p-6 rounded-3xl border-2 flex flex-col md:flex-row justify-between items-center gap-6", activeIwgdf.color)}>
                            <div className="flex-1 space-y-1">
                                <h3 className="text-xl font-black">{activeIwgdf.badge}</h3>
                                <p className="text-sm opacity-80">{activeIwgdf.desc}</p>
                            </div>
                            <div className="bg-white/40 p-4 rounded-2xl text-center min-w-[140px] border border-white/20">
                                <div className="text-[9px] font-black uppercase opacity-60">Retorno em</div>
                                <div className="text-2xl font-black">{activeIwgdf.followUp}</div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </AccordionContent>
        </AccordionItem>
    );
}
