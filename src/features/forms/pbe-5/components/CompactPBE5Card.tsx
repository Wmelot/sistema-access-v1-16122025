import React, { useMemo } from "react";
import { CheckCircle2, Activity, MapPin, BarChart3, Scissors } from "lucide-react";
import { cn } from "@/lib/utils";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { Save, Loader2, Eye, Zap, Bot } from "lucide-react";
import { AxiomCopilot } from "@/components/copilot/AxiomCopilot";
import { Button } from "@/components/ui/button";

interface CompactPBE5CardProps {
    form: any;
    isSaving?: boolean;
    onSave?: (data: any) => void;
    onReport?: () => void;
    onImport?: () => void;
    onCopilotStatusChange?: (listening: boolean) => void;
}

export function CompactPBE5Card({
    form,
    isSaving,
    onSave,
    onReport,
    onImport,
    onCopilotStatusChange
}: CompactPBE5CardProps) {
    // 1. OLHEIROS (Watchers)
    const anamnesis = form.watch("anamnesis") || {};
    const clinical = form.watch("clinical") || {};
    const functionality = form.watch("functionality") || {};

    const currentEva = Number(anamnesis.eva) || 0;
    const evaColor = currentEva >= 8 ? "border-red-500 text-red-500 bg-red-500/10" :
        currentEva >= 4 ? "border-orange-500 text-orange-500 bg-orange-500/10" :
            "border-green-500 text-green-500 bg-green-500/10";

    const mainRegions = anamnesis.mainRegions || [];

    const efepItems = functionality.efep || [];
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

    const radarData = useMemo(() => {
        return [
            { subject: "Dor", A: 100 - (currentEva * 10) },
            { subject: "Func.", A: isNaN(Number(nivelFuncional)) ? 0 : Number(nivelFuncional) * 10 },
            { subject: "Mob.", A: 70 },
            { subject: "Força", A: 80 },
            { subject: "Vig.", A: 90 },
            { subject: "Post.", A: 60 }
        ];
    }, [currentEva, nivelFuncional]);

    return (
        <div className="p-5 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group border border-slate-800">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-500">
                <BarChart3 className="w-20 h-20" />
            </div>
            <h1 className="text-xl font-black uppercase tracking-tighter leading-none mb-1 text-indigo-400">PBE 5.0</h1>
            <p className="text-[10px] text-slate-400 font-mono">CLINICAL ENGINE v5.0</p>

            {/* Radar Background Subtle */}
            <div className="absolute -right-16 -bottom-16 opacity-20 pointer-events-none" style={{ width: '200px', height: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid stroke="#fff" />
                        <PolarAngleAxis dataKey="subject" tick={false} />
                        <Radar dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.5} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-y-4 gap-x-2 relative z-10">
                {/* Row 1: EVA, Nivel, Regions count */}
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
                    <p className="text-[8px] font-bold text-slate-400 uppercase mb-1 drop-shadow-md">Funcional</p>
                    <p className={cn("text-lg font-black leading-9 drop-shadow-md", Number(nivelFuncional) >= 8 ? "text-green-400" : "text-yellow-400")}>
                        {nivelFuncional}
                    </p>
                </div>

                <div className="text-center border-l border-slate-800">
                    <p className="text-[8px] font-bold text-slate-400 uppercase mb-1 drop-shadow-md">Regiões</p>
                    <div className="flex items-center justify-center gap-1 text-lg font-black text-indigo-400 leading-9 drop-shadow-md">
                        <MapPin className="w-3.5 h-3.5" />
                        {mainRegions.length}
                    </div>
                </div>
            </div>

            {/* QUICK ACTIONS INTEGRATED (FOTO 3) */}
            <div className="mt-6 pt-4 border-t border-slate-800 grid grid-cols-2 gap-2 relative z-10">
                <div className="col-span-2">
                    <AxiomCopilot
                        specialty="Fisioterapeuta Sênior PBE"
                        formSchemaName="PBE 5.0"
                        onStatusChange={onCopilotStatusChange}
                        compact
                    />
                </div>

                <Button
                    onClick={onSave}
                    disabled={isSaving}
                    variant="outline"
                    className="h-10 rounded-xl bg-slate-800 border-slate-700 text-white hover:bg-slate-700 hover:text-white font-bold text-[10px] uppercase tracking-widest flex items-center gap-2"
                >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-blue-400" />}
                    Salvar
                </Button>

                <Button
                    onClick={onReport}
                    variant="outline"
                    className="h-10 rounded-xl bg-slate-800 border-slate-700 text-white hover:bg-slate-700 hover:text-white font-bold text-[10px] uppercase tracking-widest flex items-center gap-2"
                >
                    <Eye className="w-3.5 h-3.5 text-indigo-400" />
                    Laudo
                </Button>

                <Button
                    onClick={onImport}
                    variant="outline"
                    className="h-10 rounded-xl bg-slate-800 border-slate-700 text-white hover:bg-slate-700 hover:text-white font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 col-span-2"
                >
                    <Zap className="w-3.5 h-3.5 text-emerald-400" />
                    Sincronizar
                </Button>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-center gap-2 relative z-10">
            </div>
        </div>
    );
}
