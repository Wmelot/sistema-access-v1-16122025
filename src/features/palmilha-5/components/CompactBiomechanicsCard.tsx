import React, { useMemo } from "react";
import { CheckCircle2, TrendingDown, TrendingUp, Activity, Dumbbell, Flame, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { calculateMinimalistIndex } from "@/utils/clinical-references";

export function CompactBiomechanicsCard({ form }: { form: any }) {
    // 1. OLHEIROS (Watchers)
    const hma = form.watch("hma") || {};
    const sports = form.watch("sports") || [];
    const efepItems = form.watch("efep") || [];
    const fpiLeft = form.watch("postural.fpi_left") || {};
    const fpiRight = form.watch("postural.fpi_right") || {};
    const calcado = form.watch("calcado") || {};

    const currentEva = Number(Array.isArray(hma.eva) ? hma.eva[0] : hma.eva) || 0;
    const evaColor = currentEva >= 8 ? "border-red-500 text-red-500 bg-red-500/10" :
        currentEva >= 4 ? "border-orange-500 text-orange-500 bg-orange-500/10" :
            "border-green-500 text-green-500 bg-green-500/10";

    const efepPercentage = (() => {
        if (!efepItems?.length) return 0;
        let total = 0, count = 0;
        efepItems.forEach((i: any) => {
            const v = parseFloat(i.score);
            if (!isNaN(v)) { total += v; count++; }
        });
        return count === 0 ? 0 : Math.round((total / count) * 10);
    })();
    const nivelFuncional = (efepPercentage / 10).toFixed(1);

    const trainingData = (() => {
        const safeSports = Array.isArray(sports) ? sports : [];
        const totalMinutes = safeSports.reduce((acc: number, curr: any) => {
            return acc + (Number(curr.freq || 0) * Number(curr.duration || 0));
        }, 0);
        const hours = Math.floor(totalMinutes / 60);
        return { totalMinutes, hours };
    })();

    const calcFPI = (vals: any) => Object.values(vals).reduce((acc: number, curr: any) => acc + (Number(curr) || 0), 0);
    const scoreEsq = calcFPI(fpiLeft);
    const scoreDir = calcFPI(fpiRight);

    // Minimalist Index (calculated in real time)
    const shoeVals = form.watch("shoe") || {};
    const totalMin = calculateMinimalistIndex(shoeVals) || 0;

    // Is Critical
    const isCriticalPain = currentEva >= 7;

    const radarData = useMemo(() => {
        return [
            { subject: "Dor", A: 100 - (currentEva * 10) },
            { subject: "FPI", A: Math.max(0, 100 - (Math.abs(scoreEsq + scoreDir) * 5)) }, // rough proxy
            { subject: "Força", A: 80 },
            { subject: "Mobilid.", A: 70 },
            { subject: "Min.", A: totalMin > 0 ? totalMin : 60 },
            { subject: "Funcional", A: isNaN(Number(nivelFuncional)) ? 0 : Number(nivelFuncional) * 10 }
        ];
    }, [currentEva, scoreEsq, scoreDir, totalMin, nivelFuncional]);

    return (
        <div className="p-5 bg-slate-900 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-500">
                <Activity className="w-20 h-20" />
            </div>
            <h1 className="text-xl font-black uppercase tracking-tighter leading-none mb-1">Insole Engine</h1>
            <p className="text-[10px] text-slate-400 font-mono">BIOMECHANICAL LAB v5.0</p>

            {/* Radar Background Subtle */}
            <div className="absolute -right-16 -bottom-16 opacity-20 pointer-events-none" style={{ width: '200px', height: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid stroke="#fff" />
                        <PolarAngleAxis dataKey="subject" tick={false} />
                        <Radar dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-y-4 gap-x-2 relative z-10">
                {/* Row 1: EVA, Nivel, Min Index */}
                <div className="text-center">
                    <p className="text-[8px] font-bold text-slate-400 uppercase mb-1 drop-shadow-md">EVA (Dor)</p>
                    <div className={cn(
                        "w-9 h-9 mx-auto rounded-full flex items-center justify-center font-black text-sm border-2 transition-colors",
                        evaColor
                    )}>
                        {currentEva}
                    </div>
                </div>

                <div className="text-center border-l border-slate-800">
                    <p className="text-[8px] font-bold text-slate-400 uppercase mb-1 drop-shadow-md">Índice Min.</p>
                    <p className="text-lg font-black text-indigo-400 leading-9 drop-shadow-md">{totalMin}%</p>
                </div>

                <div className="text-center border-l border-slate-800">
                    <p className="text-[8px] font-bold text-slate-400 uppercase mb-1 drop-shadow-md">Funcional</p>
                    <p className={cn("text-lg font-black leading-9 drop-shadow-md", Number(nivelFuncional) >= 8 ? "text-green-400" : "text-yellow-400")}>
                        {nivelFuncional}
                    </p>
                </div>

                {/* Row 2: Treino, FPI */}
                <div className="text-center col-span-1 pt-2 border-t border-slate-800/50">
                    <p className="text-[8px] font-bold text-slate-400 uppercase mb-1 drop-shadow-md">Treino</p>
                    <div className="flex items-center justify-center gap-1 text-xs font-black text-orange-400">
                        <Flame className="w-3 h-3" />
                        {trainingData.hours}h
                    </div>
                </div>

                <div className="text-center col-span-2 pt-2 border-t border-l border-slate-800/50">
                    <p className="text-[8px] font-bold text-slate-400 uppercase mb-1 drop-shadow-md">Postura FPI-6</p>
                    <div className="flex items-center justify-center gap-2 text-xs font-black">
                        <span className="text-slate-300">E: <span className={scoreEsq > 5 ? "text-red-400" : scoreEsq < -5 ? "text-orange-400" : "text-green-400"}>{scoreEsq}</span></span>
                        <span className="text-slate-600">|</span>
                        <span className="text-slate-300">D: <span className={scoreDir > 5 ? "text-red-400" : scoreDir < -5 ? "text-orange-400" : "text-green-400"}>{scoreDir}</span></span>
                    </div>
                </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-center gap-2 relative z-10">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300">Status Otimizado</span>
            </div>
        </div>
    );
}
