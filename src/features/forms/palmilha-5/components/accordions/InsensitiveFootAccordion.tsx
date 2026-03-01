import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { GlycemicScoreCalculator } from "./GlycemicScoreCalculator";
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
    const iwgdfLevel = watch("classification.iwgdfLevel") || "0";

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

    const totalPreserved = (side: "left" | "right") => {
        const sideData = neuropathic?.[side] || {};
        return MONOFILAMENT_POINTS.filter(p => sideData[p.id]).length;
    };

    const activeIwgdf = IWGDF_LEVELS.find(l => l.value === String(iwgdfLevel)) || IWGDF_LEVELS[0];

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
                <Tabs defaultValue="metabolic" className="w-full">
                    <TabsList className="w-full justify-start h-12 bg-slate-50 border-b rounded-none p-0">
                        <TabsTrigger value="metabolic" className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-teal-500 rounded-none h-full px-6 text-[10px] font-black uppercase tracking-widest">
                            <Stethoscope className="w-4 h-4 mr-2" /> Metabólico
                        </TabsTrigger>
                        <TabsTrigger value="vascular" className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-teal-500 rounded-none h-full px-6 text-[10px] font-black uppercase tracking-widest">
                            <HeartPulse className="w-4 h-4 mr-2" /> Vascular
                        </TabsTrigger>
                        <TabsTrigger value="neuropathic" className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-teal-500 rounded-none h-full px-6 text-[10px] font-black uppercase tracking-widest">
                            <Zap className="w-4 h-4 mr-2" /> Neuropático
                        </TabsTrigger>
                        <TabsTrigger value="classification" className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-teal-500 rounded-none h-full px-6 text-[10px] font-black uppercase tracking-widest">
                            <ShieldCheck className="w-4 h-4 mr-2" /> Classificação
                        </TabsTrigger>
                    </TabsList>

                    {/* METABOLIC TAB */}
                    <TabsContent value="metabolic" className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="md:col-span-2">
                                <GlycemicScoreCalculator />
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Medicamentos para Diabetes</Label>
                                    <Input {...register("hma.drugsInUse")} placeholder="Metformina, Insulina, Gliclazida..." className="h-10 text-sm" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Atividade Física e Dieta</Label>
                                    <Textarea {...register("hma.physicalActivity")} placeholder="Descreva a rotina de exercícios e adesão à dieta..." className="min-h-[100px] text-sm" />
                                </div>
                            </div>
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
                                    <div className="text-center space-y-1">
                                        <div className="text-[9px] font-black text-blue-600 uppercase">Esquerdo</div>
                                        <div className={cn("text-2xl font-black p-2 rounded-xl border", itbResults.left ? "bg-white" : "bg-slate-100 text-slate-400")}>
                                            {itbResults.left || "--"}
                                        </div>
                                    </div>
                                    <div className="text-center space-y-1">
                                        <div className="text-[9px] font-black text-emerald-600 uppercase">Direito</div>
                                        <div className={cn("text-2xl font-black p-2 rounded-xl border", itbResults.right ? "bg-white" : "bg-slate-100 text-slate-400")}>
                                            {itbResults.right || "--"}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[8px] font-bold text-slate-400 text-center uppercase tracking-tighter">
                                    Normal: 0.9–1.3 | Isquemia: &lt;0.9
                                </p>
                            </div>
                        </div>
                    </TabsContent>

                    {/* NEUROPATHIC TAB */}
                    <TabsContent value="neuropathic" className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            {(["left", "right"] as const).map(side => {
                                const preserved = totalPreserved(side);
                                return (
                                    <div key={side} className="space-y-4">
                                        <div className="flex justify-between items-end border-b pb-2">
                                            <Label className="text-sm font-black uppercase tracking-widest text-slate-800">
                                                Pé {side === "left" ? "Esquerdo" : "Direito"}
                                            </Label>
                                            <span className={cn(
                                                "text-[10px] font-black px-2 py-0.5 rounded-full uppercase",
                                                preserved === 4 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                                            )}>
                                                {preserved}/4 preservados
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {MONOFILAMENT_POINTS.map(point => {
                                                const path = `neuropathic.${side}.${point.id}`;
                                                return (
                                                    <div key={point.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white">
                                                        <Checkbox
                                                            id={`${side}-${point.id}`}
                                                            checked={!!watch(path)}
                                                            onCheckedChange={(checked) => setValue(path, !!checked)}
                                                        />
                                                        <label htmlFor={`${side}-${point.id}`} className="text-xs font-bold text-slate-600 cursor-pointer">
                                                            {point.label}
                                                        </label>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex gap-3 text-amber-900 text-[10px] items-center">
                            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                            <p><strong>Atenção:</strong> A perda de sensibilidade protetora em qualquer ponto configura risco aumentado para úlcera (IWGDF ≥ 1).</p>
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
