"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dumbbell, Target, Activity, ShieldCheck, AlertCircle, Zap, Info, ChevronRight, Scale, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { FORCE_REFERENCES_BY_AGE } from "@/utils/strength-norms";

const JOINT_MUSCLE_GROUPS: Record<string, { label: string; id: string; unit?: string; normKey?: string; antagonistId?: string }[]> = {
    coluna_lombar: [
        { label: "Glúteo Máximo", id: "glute_max", normKey: "extensao_de_quadril" },
        { label: "Glúteo Médio", id: "glute_med", normKey: "abducao_de_quadril" },
        { label: "Transverso Abdom. (Palpatório)", id: "transverse_palp", unit: "Padrão" },
        { label: "Stabilizer (Biofeedback)", id: "stabilizer", unit: "mmHg" },
    ],
    coluna_cervical: [
        { label: "Flexores Profundos Cervicais", id: "deep_flexors", unit: "mmHg" },
        { label: "Trapézio Superior", id: "trapezius_sup", normKey: "abducao_de_ombro" },
        { label: "Trapézio Inferior", id: "trapezius_inf" },
        { label: "Serrátil Anterior", id: "serratus_ant" },
        { label: "Elevador da Escápula", id: "levator_scapulae" },
    ],
    ombro: [
        { label: "Flexores Ombro", id: "shoulder_flex", normKey: "flexao_de_ombro", antagonistId: "shoulder_ext" },
        { label: "Extensores Ombro", id: "shoulder_ext", normKey: "extensao_de_ombro" },
        { label: "Abdutores Ombro", id: "shoulder_abd", normKey: "abducao_de_ombro", antagonistId: "shoulder_add" },
        { label: "Rotadores Externos", id: "shoulder_ext_rot", normKey: "rotacao_lateral_ombro", antagonistId: "shoulder_int_rot" },
        { label: "Rotadores Internos", id: "shoulder_int_rot", normKey: "rotacao_medial_ombro" },
        { label: "Serrátil Anterior", id: "serratus_ant_sh" },
    ],
    joelho: [
        { label: "Extensores Joelho (Quadríceps)", id: "knee_ext", normKey: "extensao_de_joelho", antagonistId: "knee_flex" },
        { label: "Flexores Joelho (Isquios)", id: "knee_flex", normKey: "flexao_de_joelho" },
        { label: "Abdutores Quadril", id: "hip_abd_k", normKey: "abducao_de_quadril", antagonistId: "hip_add_k" },
        { label: "Adutores Quadril", id: "hip_add_k", normKey: "aducao_de_quadril" },
        { label: "Rotadores Externos Quadril", id: "hip_ext_rot_k" },
    ],
    quadril: [
        { label: "Flexores Quadril", id: "hip_flex", normKey: "flexao_de_quadril", antagonistId: "hip_ext" },
        { label: "Extensores Quadril", id: "hip_ext", normKey: "extensao_de_quadril" },
        { label: "Abdutores Quadril", id: "hip_abd", normKey: "abducao_de_quadril", antagonistId: "hip_add" },
        { label: "Adutores Quadril", id: "hip_add", normKey: "aducao_de_quadril" },
        { label: "Rotadores Externos", id: "hip_ext_rot", antagonistId: "hip_int_rot" },
        { label: "Rotadores Internos", id: "hip_int_rot" },
    ],
    tornozelo_pe: [
        { label: "Dorsiflexores", id: "dorsiflex", normKey: "dorsiflexao_de_tornozelo", antagonistId: "plantiflex" },
        { label: "Plantiflexores", id: "plantiflex" },
        { label: "Inversores", id: "inverters", antagonistId: "everters" },
        { label: "Eversores", id: "everters" },
        { label: "Flexor Longo Hálux", id: "hallux_flex" },
    ],
    cotovelo_mao: [
        { label: "Flexores Cotovelo", id: "elbow_flex", normKey: "flexao_de_cotovelo", antagonistId: "elbow_ext" },
        { label: "Extensores Cotovelo", id: "elbow_ext", normKey: "extensao_de_cotovelo" },
        { label: "Preensão Palmar (Grip)", id: "grip_strength", unit: "kgf" },
        { label: "Extensores Punho", id: "wrist_ext", normKey: "extensao_de_pulso" },
    ]
};

const calculateAge = (birthDate?: string) => {
    if (!birthDate) return 30; // Default
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
};

interface MuscleStrengthAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string; iconColor: string; bg: string };
    patient?: any;
}

export function MuscleStrengthAccordion({ openSection, isSectionFilled, sectionStyle, patient }: MuscleStrengthAccordionProps) {
    const { register, watch } = useFormContext();
    const selectedRegions = watch('anamnesis.mainRegions') || [];
    const patientWeight = parseFloat(watch('metrics.weight') || 70);
    const patientGender = patient?.gender === 'female' ? 'female' : 'male';
    const patientAge = calculateAge(patient?.birth_date);

    const getReferenceValue = (normKey?: string) => {
        if (!normKey) return null;
        const refEntry = (FORCE_REFERENCES_BY_AGE as any)[normKey];
        if (!refEntry) return null;

        const range = refEntry.ranges.find((r: any) => patientAge >= r.min && patientAge <= r.max)
            || refEntry.ranges[refEntry.ranges.length - 1]; // Fallback to last range

        const genderData = range.vals[patientGender];
        // The values in Bohannon table are often normalized by weight or in Newtons/kg.
        // Usually mean * weight for absolute value in kgf if it was N/kg or similar.
        // Assuming the 'mean' in references is a coefficient or absolute kgf based on typical Bohannon interpretation.
        return genderData.mean * patientWeight;
    };

    const calculateAsymmetry = (l: string, r: string) => {
        const left = parseFloat(l);
        const right = parseFloat(r);
        if (isNaN(left) || isNaN(right) || left === 0 || right === 0) return null;

        const diff = Math.abs(left - right);
        const max = Math.max(left, right);
        return Math.round((diff / max) * 100);
    };

    const calculateRatio = (agonist: string, antagonist: string) => {
        const ag = parseFloat(agonist);
        const ant = parseFloat(antagonist);
        if (isNaN(ag) || isNaN(ant) || ant === 0) return null;
        return Math.round((ag / ant) * 100);
    };

    return (
        <AccordionItem
            value="strength"
            className={cn(
                "border rounded-[2rem] border-l-4 transition-all duration-300 shadow-sm overflow-hidden",
                openSection === 'strength' ? 'bg-white ring-2 ring-orange-50' : 'bg-white/50',
                isSectionFilled('strength') ? 'border-slate-200' : 'border-slate-100',
                sectionStyle.border
            )}
        >
            <AccordionTrigger className="px-8 py-6 hover:no-underline flex gap-2 items-center text-left group">
                <div className="flex items-center gap-4 flex-1">
                    <div className={cn("p-2 rounded-xl transition-colors", openSection === 'strength' ? "bg-orange-600 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-600")}>
                        <Dumbbell className="h-5 w-5" />
                    </div>
                    <div>
                        <span className={cn("font-black text-lg tracking-tight", openSection === 'strength' ? "text-slate-900" : "text-slate-600")}>6. Dinamometria & Força Muscular</span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Avaliação HHD (Lafayette) e Estabilização</p>
                    </div>
                </div>
                {isSectionFilled('strength') && (
                    <Badge variant="outline" className="bg-orange-100 text-orange-700 border-none text-[10px] h-6 px-3 rounded-full font-black">PREENCHIDO</Badge>
                )}
            </AccordionTrigger>
            <AccordionContent className="px-8 pb-10 pt-4 space-y-10 border-t border-slate-50">

                {selectedRegions.length === 0 ? (
                    <div className="py-12 bg-slate-50 border-2 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center text-center px-6 max-w-2xl mx-auto">
                        <AlertCircle className="h-10 w-10 text-slate-300 mb-4" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-loose">Nenhuma região articular selecionada</p>
                        <p className="text-[10px] text-slate-300 mt-2 uppercase font-bold tracking-tighter">Selecione as áreas de queixa na Anamnese para carregar os grupos musculares alvo.</p>
                    </div>
                ) : (
                    <div className="space-y-12 max-w-5xl mx-auto pt-4">
                        <div className="bg-orange-50/50 p-6 rounded-[2rem] border border-orange-100 flex gap-4 shadow-inner">
                            <Info className="h-5 w-5 text-orange-600 mt-1 shrink-0" />
                            <div>
                                <h6 className="text-[11px] font-black text-orange-900 uppercase tracking-widest mb-1">Dinamometria HHD (Ref: Bohannon 1997)</h6>
                                <p className="text-[10px] text-orange-700 leading-relaxed font-bold opacity-80 uppercase tracking-tighter">
                                    Valores de referência calculados com base em Sexo ({patientGender === 'male' ? 'Masc' : 'Fem'}), Idade ({patientAge} anos) e Peso ({patientWeight}kg).
                                    Assimetrias acima de <span className="text-rose-600">15%</span> são clinicamente relevantes.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                            {selectedRegions.map((regionId: string) => {
                                const muscles = JOINT_MUSCLE_GROUPS[regionId] || [];
                                const regionLabel = regionId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

                                return (
                                    <div key={`strength-${regionId}`} className="space-y-6">
                                        <div className="flex items-center justify-between border-b border-orange-100 pb-3">
                                            <div className="flex items-center gap-2">
                                                <Target className="h-4 w-4 text-orange-600" />
                                                <h5 className="font-black text-slate-800 uppercase text-[11px] tracking-widest">{regionLabel}</h5>
                                            </div>
                                            <Badge variant="outline" className="text-[8px] font-black border-orange-100 text-orange-400">UNIDADE: KGF / MMHG</Badge>
                                        </div>

                                        <div className="space-y-4">
                                            {muscles.map((muscle) => {
                                                const valL = watch(`strength.${regionId}.${muscle.id}_l`);
                                                const valR = watch(`strength.${regionId}.${muscle.id}_r`);
                                                const asymmetry = calculateAsymmetry(valL, valR);
                                                const reference = getReferenceValue(muscle.normKey);

                                                // Antagonist analysis
                                                let ratio = null;
                                                if (muscle.antagonistId) {
                                                    const antL = watch(`strength.${regionId}.${muscle.antagonistId}_l`);
                                                    const antR = watch(`strength.${regionId}.${muscle.antagonistId}_r`);
                                                    ratio = calculateRatio(valR, antR); // Using Right side for ratio example
                                                }

                                                return (
                                                    <div key={muscle.id} className="group p-5 bg-white border border-slate-100 rounded-[2.5rem] hover:border-orange-200 shadow-sm transition-all relative overflow-hidden">
                                                        {/* Background Accent for Active Item */}
                                                        {(valL || valR) && <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50/30 rounded-full -mr-16 -mt-16 blur-3xl" />}

                                                        <div className="flex items-center justify-between mb-4 px-1 relative z-10">
                                                            <div className="flex flex-col">
                                                                <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight group-hover:text-orange-700 flex items-center gap-2">
                                                                    {muscle.label}
                                                                    {asymmetry !== null && asymmetry > 15 && (
                                                                        <Badge className="bg-rose-500 text-white border-none text-[8px] font-black h-4 px-1.5 rounded-full animate-pulse">
                                                                            ⚠️ {asymmetry}% ASSIMETRIA
                                                                        </Badge>
                                                                    )}
                                                                </span>
                                                                {reference && (
                                                                    <div className="flex items-center gap-2 mt-0.5">
                                                                        <span className="text-[9px] font-bold text-slate-400 uppercase">Referência: ~{reference.toFixed(1)} kgf</span>
                                                                        {(() => {
                                                                            const maxVal = Math.max(parseFloat(valL) || 0, parseFloat(valR) || 0);
                                                                            if (maxVal > 0) {
                                                                                const percOfRef = (maxVal / reference) * 100;
                                                                                if (percOfRef < 80) return <Badge variant="outline" className="text-[7px] h-3 border-rose-100 text-rose-500 font-black">DÉFICIT FORÇA</Badge>;
                                                                                return <Badge variant="outline" className="text-[7px] h-3 border-emerald-100 text-emerald-500 font-black">NORMAL</Badge>;
                                                                            }
                                                                            return null;
                                                                        })()}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-bold text-[8px] rounded-lg">{muscle.unit || 'kgf'}</Badge>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-6 relative z-10">
                                                            <div className="relative group/input">
                                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-1 h-4 bg-orange-200 rounded-full transition-all group-focus-within/input:h-6 group-focus-within/input:bg-orange-500" />
                                                                <Input
                                                                    {...register(`strength.${regionId}.${muscle.id}_l`)}
                                                                    placeholder="0.0"
                                                                    className="h-14 bg-slate-50/50 border-transparent rounded-[1.2rem] font-black text-center text-slate-800 focus:bg-white focus:ring-orange-600 transition-all shadow-inner pl-8"
                                                                />
                                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 group-focus-within/input:text-orange-600">ESQ</span>
                                                            </div>
                                                            <div className="relative group/input">
                                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-1 h-4 bg-orange-200 rounded-full transition-all group-focus-within/input:h-6 group-focus-within/input:bg-orange-500" />
                                                                <Input
                                                                    {...register(`strength.${regionId}.${muscle.id}_r`)}
                                                                    placeholder="0.0"
                                                                    className="h-14 bg-slate-50/50 border-transparent rounded-[1.2rem] font-black text-center text-slate-800 focus:bg-white focus:ring-orange-600 transition-all shadow-inner pl-8"
                                                                />
                                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 group-focus-within/input:text-orange-600">DIR</span>
                                                            </div>
                                                        </div>

                                                        {/* Agonist/Antagonist Ratio Analysis */}
                                                        {muscle.antagonistId && ratio !== null && (
                                                            <div className="mt-6 pt-4 border-t border-slate-50 space-y-3">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <Scale className="h-3 w-3 text-indigo-500" />
                                                                        <span className="text-[9px] font-black text-indigo-900 uppercase tracking-widest leading-none">Relação Agonista/Antagonista</span>
                                                                    </div>
                                                                    <span className={cn(
                                                                        "text-[10px] font-black",
                                                                        ratio < 60 ? "text-rose-500" : ratio < 80 ? "text-amber-500" : "text-emerald-500"
                                                                    )}>{ratio}%</span>
                                                                </div>
                                                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                                                                    <div
                                                                        className={cn(
                                                                            "h-full transition-all duration-1000",
                                                                            ratio < 60 ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]" : ratio < 80 ? "bg-amber-500" : "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                                                                        )}
                                                                        style={{ width: `${Math.min(ratio, 100)}%` }}
                                                                    />
                                                                </div>
                                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter text-right">
                                                                    Ideal: 60-80% do antagonista
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

            </AccordionContent>
        </AccordionItem >
    );
}
