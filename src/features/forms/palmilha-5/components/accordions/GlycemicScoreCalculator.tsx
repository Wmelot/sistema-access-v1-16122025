import React, { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Activity, Beaker, Clock, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface GlycemicScoreCalculatorProps {
    className?: string;
}

export function GlycemicScoreCalculator({ className }: GlycemicScoreCalculatorProps) {
    const { register, watch, setValue } = useFormContext();

    const hba1c = watch("hma.glycemic.hba1c");
    const fasting = watch("hma.glycemic.fasting");
    const postPrandial = watch("hma.glycemic.postPrandial");

    const patient = watch("patient");

    // Auto-detect age if possible
    const age = useMemo(() => {
        if (!patient?.birthDate) return null;
        const dob = new Date(patient.birthDate);
        if (isNaN(dob.getTime())) return null;
        const diff = Date.now() - dob.getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    }, [patient?.birthDate]);

    const isElderly = age !== null && age >= 65;

    const scores = useMemo(() => {
        let hba1cScore = null;
        let fastingScore = null;
        let postPrandialScore = null;

        const parseVal = (val: any) => {
            const num = parseFloat(String(val).replace(",", "."));
            return isNaN(num) ? null : num;
        };

        const vHba1c = parseVal(hba1c);
        const vFasting = parseVal(fasting);
        const vPost = parseVal(postPrandial);

        // HbA1c Scoring
        if (vHba1c !== null) {
            if (isElderly) {
                if (vHba1c <= 7.5) hba1cScore = 10;
                else if (vHba1c <= 8.0) hba1cScore = 8;
                else if (vHba1c <= 8.5) hba1cScore = 6;
                else if (vHba1c <= 9.5) hba1cScore = 4;
                else hba1cScore = 2;
            } else {
                if (vHba1c < 6.5) hba1cScore = 10;
                else if (vHba1c < 7.0) hba1cScore = 8;
                else if (vHba1c < 8.0) hba1cScore = 6;
                else if (vHba1c < 9.0) hba1cScore = 4;
                else hba1cScore = 2;
            }
        }

        // Fasting Scoring
        if (vFasting !== null) {
            if (vFasting < 100) fastingScore = 10;
            else if (vFasting <= 130) fastingScore = 8;
            else if (vFasting <= 160) fastingScore = 5;
            else fastingScore = 2;
        }

        // Post Prandial Scoring
        if (vPost !== null) {
            if (vPost < 140) postPrandialScore = 10;
            else if (vPost < 180) postPrandialScore = 8;
            else if (vPost <= 200) postPrandialScore = 4;
            else postPrandialScore = 2;
        }

        let totalWeight = 0;
        let weightedScore = 0;

        if (hba1cScore !== null) {
            totalWeight += 50;
            weightedScore += hba1cScore * 50;
        }

        let otherWeight = hba1cScore !== null ? 50 : 100;
        let activeOthers = (fastingScore !== null ? 1 : 0) + (postPrandialScore !== null ? 1 : 0);

        if (activeOthers > 0) {
            const weightPerOther = otherWeight / activeOthers;
            if (fastingScore !== null) {
                totalWeight += weightPerOther;
                weightedScore += fastingScore * weightPerOther;
            }
            if (postPrandialScore !== null) {
                totalWeight += weightPerOther;
                weightedScore += postPrandialScore * weightPerOther;
            }
        }

        if (totalWeight === 0) return null;

        const finalScore = weightedScore / totalWeight;

        return {
            hba1cScore,
            fastingScore,
            postPrandialScore,
            finalScore: finalScore.toFixed(1)
        };
    }, [hba1c, fasting, postPrandial, isElderly]);

    React.useEffect(() => {
        if (scores?.finalScore) {
            // Auto-update the main form score to preserve compatibility with the old slider
            setValue("hma.glucoseControl", scores.finalScore, { shouldDirty: true });
        }
    }, [scores?.finalScore, setValue]);

    const getClassification = (score: number) => {
        if (score >= 9) return { label: "Excelente", color: "text-emerald-500", bg: "bg-emerald-500", pillBg: "bg-emerald-100", border: "border-emerald-200" };
        if (score >= 7) return { label: "Bom", color: "text-green-500", bg: "bg-green-500", pillBg: "bg-green-100", border: "border-green-200" };
        if (score >= 5) return { label: "Regular", color: "text-yellow-500", bg: "bg-yellow-500", pillBg: "bg-yellow-100", border: "border-yellow-200" };
        if (score >= 3) return { label: "Ruim", color: "text-orange-500", bg: "bg-orange-500", pillBg: "bg-orange-100", border: "border-orange-200" };
        return { label: "Muito Ruim", color: "text-red-500", bg: "bg-red-500", pillBg: "bg-red-100", border: "border-red-200" };
    };

    const getPartialBadge = (score: number | null) => {
        if (score === null) return <span className="text-[10px] text-slate-300">-</span>;
        const cls = getClassification(score);
        return (
            <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-md uppercase", cls.color, cls.pillBg)}>
                {cls.label} ({score})
            </span>
        );
    }

    const finalCls = scores ? getClassification(parseFloat(scores.finalScore)) : null;

    return (
        <div className={cn("bg-white border text-sm rounded-2xl p-5 shadow-sm space-y-5 relative overflow-hidden", className)}>
            <div className="flex justify-between items-center border-b pb-4">
                <div>
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-500" />
                        Axiom Score Glicêmico
                    </Label>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-tight">Cálculo inteligente ponderado pela HbA1c (50%) e idades</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Inputs */}
                <div className="space-y-4 md:col-span-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* HbA1c */}
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 relative">
                            <Label className="text-[10px] uppercase font-black text-slate-500 flex justify-between items-center mb-2">
                                HbA1c (%)
                                {(scores && scores.hba1cScore !== null) && getPartialBadge(scores.hba1cScore)}
                            </Label>
                            <div className="relative">
                                <Beaker className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                <Input
                                    type="number"
                                    step="0.1"
                                    placeholder="Ex: 7.2"
                                    {...register("hma.glycemic.hba1c")}
                                    className="pl-9 h-10 font-black text-slate-700 bg-white border-slate-200"
                                />
                            </div>
                        </div>

                        {/* Fasting */}
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 relative">
                            <Label className="text-[10px] uppercase font-black text-slate-500 flex justify-between items-center mb-2">
                                Glicemia Jejum
                                {(scores && scores.fastingScore !== null) && getPartialBadge(scores.fastingScore)}
                            </Label>
                            <div className="relative">
                                <Activity className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                <Input
                                    type="number"
                                    placeholder="Ex: 110"
                                    {...register("hma.glycemic.fasting")}
                                    className="pl-9 h-10 font-black text-slate-700 bg-white border-slate-200"
                                />
                                <span className="absolute right-3 top-3 text-[10px] font-bold text-slate-300">mg/dL</span>
                            </div>
                        </div>

                        {/* Post Prandial */}
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 relative">
                            <Label className="text-[10px] uppercase font-black text-slate-500 flex justify-between items-center mb-2">
                                Pós-Prandial
                                {(scores && scores.postPrandialScore !== null) && getPartialBadge(scores.postPrandialScore)}
                            </Label>
                            <div className="relative">
                                <Clock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                <Input
                                    type="number"
                                    placeholder="Ex: 140"
                                    {...register("hma.glycemic.postPrandial")}
                                    className="pl-9 h-10 font-black text-slate-700 bg-white border-slate-200"
                                />
                                <span className="absolute right-3 top-3 text-[10px] font-bold text-slate-300">mg/dL</span>
                            </div>
                        </div>
                    </div>

                    {isElderly && (
                        <div className="text-[10px] text-blue-600 bg-blue-50 px-3 py-2 rounded-lg flex gap-2 items-center">
                            <Info className="w-3 h-3" />
                            Como o paciente é classificado como idoso, utilizamos uma meta de HbA1c mais permissiva para evitar riscos de hipoglicemia.
                        </div>
                    )}
                </div>

                {/* Main Gauge / Result */}
                <div className={cn("rounded-2xl border-2 flex flex-col justify-center items-center p-5 relative overflow-hidden", finalCls ? finalCls.pillBg + " " + finalCls.border : "bg-slate-50 border-slate-100")}>
                    {scores ? (
                        <>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 z-10">Nota Final Axiom</div>
                            <div className={cn("text-5xl font-black mb-2 z-10", finalCls?.color)}>
                                {scores.finalScore}
                            </div>
                            <Badge className={cn("text-xs font-black uppercase tracking-widest border-none px-3 py-1 shadow-sm z-10", finalCls?.color, "bg-white")}>
                                {finalCls?.label}
                            </Badge>

                            {/* Visual Progress bar indicator at bottom */}
                            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white">
                                <div
                                    className={cn("h-full transition-all duration-1000 ease-out", finalCls?.bg)}
                                    style={{ width: `${(parseFloat(scores.finalScore) / 10) * 100}%` }}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="text-center space-y-3 opacity-50">
                            <Activity className="w-8 h-8 text-slate-300 mx-auto" />
                            <div className="text-[10px] font-bold uppercase text-slate-400 px-4">Insira os exames para calcular o Axiom Score</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
