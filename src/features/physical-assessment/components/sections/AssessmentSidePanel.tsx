"use client";

import { useFormContext } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { useState, useMemo } from "react";
import { Activity, Zap, Heart, Dumbbell } from "lucide-react";

export function AssessmentSidePanel() {
    const { watch } = useFormContext();
    const values = watch();
    const [manualStability, setManualStability] = useState(false);

    // --- CALCULATIONS ---
    const weight = Number(values.antro?.weight) || 0;
    const heightCm = Number(values.antro?.height) || 0;
    const heightM = heightCm / 100;
    const imc = heightM > 0 ? (weight / (heightM * heightM)).toFixed(1) : "0.0";

    // Mock Body Fat Logic (Display Purpose)
    const calculateBodyFat = () => {
        const thigh = Number(values.antro?.thigh) || 0;
        const supra = Number(values.antro?.suprailiac) || 0;
        const abd = Number(values.antro?.abdominal) || 0;
        if (!thigh && !supra && !abd) return 0;
        // Simple mock formula: sum of folds * 0.15 + constant
        return ((thigh + supra + abd) * 0.15 + 5).toFixed(1);
    }
    const bodyFat = calculateBodyFat();

    // VO2 Max Estimate
    const vo2Max = values.cardio?.vo2Max || (values.cardio?.method === 'rockport' && values.cardio?.timeMin ? (132 - (Number(values.cardio.timeMin) * 2)).toFixed(1) : 0);

    // Radar Data
    const radarData = useMemo(() => {
        // Mock scoring logic for demo
        const strengthScore = manualStability ? 80 : 40;
        const cardioScore = Number(vo2Max) > 40 ? 80 : (Number(vo2Max) > 0 ? 50 : 20);
        const mobilityScore = (Number(values.mobility?.wells) || 0) > 20 ? 80 : 40;
        const compScore = (Number(imc) > 18.5 && Number(imc) < 25) ? 90 : 60;

        return [
            { subject: 'Força', A: strengthScore, fullMark: 100 },
            { subject: 'Cardio', A: cardioScore, fullMark: 100 },
            { subject: 'Mobilidade', A: mobilityScore, fullMark: 100 },
            { subject: 'Comp. Corporal', A: compScore, fullMark: 100 },
        ];
    }, [values, manualStability, imc, vo2Max]);

    return (
        <Card className="bg-slate-900 text-white border-slate-800 shadow-xl overflow-hidden sticky top-6 h-fit">
            <CardHeader className="pb-4 border-b border-slate-800 bg-slate-950/50">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    Dashboard Clínico
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">

                {/* KPI Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 text-center hover:bg-slate-800 transition-colors">
                        <div className="text-[10px] uppercase text-slate-400 font-bold mb-1">IMC Atual</div>
                        <div className="text-2xl font-black text-emerald-400">{imc}</div>
                        <div className="text-[10px] text-slate-500">kg/m²</div>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 text-center hover:bg-slate-800 transition-colors">
                        <div className="text-[10px] uppercase text-slate-400 font-bold mb-1">% Gordura</div>
                        <div className="text-2xl font-black text-blue-400">{bodyFat}%</div>
                        <div className="text-[10px] text-slate-500">Estimado</div>
                    </div>
                    <div className="col-span-2 bg-slate-800/50 p-2 rounded-lg border border-slate-700 flex justify-between items-center px-4">
                        <span className="text-[10px] uppercase text-slate-400 font-bold">VO2 Max (Est.)</span>
                        <span className="text-lg font-bold text-orange-400">{Number(vo2Max).toFixed(1)} <span className="text-[10px] text-slate-500 font-normal">ml/kg/min</span></span>
                    </div>
                </div>

                {/* Radar Chart */}
                <div className="bg-slate-950/30 rounded-xl p-2 border border-slate-800/50">
                    <div className="h-[220px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                <PolarGrid stroke="#334155" strokeOpacity={0.5} />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar
                                    name="Paciente"
                                    dataKey="A"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    fill="#3b82f6"
                                    fillOpacity={0.4}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Controls */}
                <div className="space-y-3 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-slate-300">Estabilidade Manual (Core)</Label>
                        <Switch checked={manualStability} onCheckedChange={setManualStability} className="data-[state=checked]:bg-emerald-600" />
                    </div>
                    {manualStability && (
                        <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-1 bg-slate-800/50 p-2 rounded-lg">
                            <div className="space-y-1">
                                <span className="text-[10px] text-slate-500 font-bold uppercase pl-1">Esq.</span>
                                <Input className="bg-slate-900 border-slate-700 h-8 text-xs text-white focus-visible:ring-emerald-500" placeholder="0-10" />
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] text-slate-500 font-bold uppercase pl-1">Dir.</span>
                                <Input className="bg-slate-900 border-slate-700 h-8 text-xs text-white focus-visible:ring-emerald-500" placeholder="0-10" />
                            </div>
                        </div>
                    )}
                </div>

            </CardContent>
            <CardFooter className="bg-slate-950/80 text-[10px] text-slate-600 justify-center py-2 uppercase tracking-widest font-bold">
                Axiom Clinical AI
            </CardFooter>
        </Card>
    );
}
