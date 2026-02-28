"use client";

import { useState, useCallback, useTransition } from "react";
import { Droplets, Clock, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getVoidingDiaryEntries, type VoidingEntry } from "../actions/voiding-diary";
import { cn } from "@/lib/utils";

interface VoidingDiaryCardProps {
    patientId: string;
    clinicId: string;
    initialEntries?: VoidingEntry[];
}

function groupByDay(entries: VoidingEntry[]) {
    const grouped: Record<string, VoidingEntry[]> = {};
    entries.forEach((e) => {
        const day = new Date(e.recorded_at).toLocaleDateString("pt-BR", {
            weekday: "long", day: "2-digit", month: "2-digit", year: "numeric",
        });
        if (!grouped[day]) grouped[day] = [];
        grouped[day].push(e);
    });
    return grouped;
}

export function VoidingDiaryCard({ patientId, clinicId, initialEntries = [] }: VoidingDiaryCardProps) {
    const [entries, setEntries] = useState<VoidingEntry[]>(initialEntries);
    const [loaded, setLoaded] = useState(true); // já temos dados do servidor
    const [expanded, setExpanded] = useState(false);
    const [isPending, startTransition] = useTransition();

    const refresh = useCallback(() => {
        startTransition(async () => {
            const data = await getVoidingDiaryEntries(patientId);
            setEntries(data);
        });
    }, [patientId]);

    // Sem dados
    if (entries.length === 0) return null;

    const grouped = groupByDay(entries);
    const days = Object.keys(grouped);
    const totalEntries = entries.length;
    const totalLeakage = entries.filter((e) => e.had_leakage).length;
    const totalUrgency = entries.filter((e) => e.had_urgency).length;
    const avgPerDay = (totalEntries / days.length).toFixed(1);

    return (
        <div className="border border-blue-100 rounded-3xl overflow-hidden shadow-sm bg-white mb-6">
            {/* HEADER */}
            <div
                className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-600 to-cyan-500 text-white cursor-pointer select-none"
                onClick={() => setExpanded((v) => !v)}
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center">
                        <Droplets className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-black uppercase text-sm tracking-widest">Diário Miccional</h3>
                        <p className="text-blue-100 text-xs font-bold uppercase">
                            {totalEntries} registro{totalEntries !== 1 ? "s" : ""} em {days.length} {days.length === 1 ? "dia" : "dias"}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button size="sm" variant="ghost"
                        className="text-white hover:bg-white/10 h-8 px-3 text-xs font-black uppercase"
                        onClick={(e) => { e.stopPropagation(); refresh(); }}>
                        <RefreshCw className={cn("h-3 w-3 mr-1", isPending && "animate-spin")} /> Atualizar
                    </Button>
                    {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
            </div>

            {/* RESUMO */}
            <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-100">
                {[
                    { label: "Total", value: totalEntries, color: "text-blue-700" },
                    { label: "Média/dia", value: avgPerDay, color: "text-slate-700" },
                    { label: "Urgências", value: totalUrgency, color: totalUrgency > 0 ? "text-amber-600" : "text-emerald-600" },
                    { label: "Perdas", value: totalLeakage, color: totalLeakage > 0 ? "text-red-600" : "text-emerald-600" },
                ].map(({ label, value, color }) => (
                    <div key={label} className="p-4 text-center">
                        <p className={`text-2xl font-black ${color}`}>{value}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{label}</p>
                    </div>
                ))}
            </div>

            {/* ALERTA CLÍNICO */}
            {(totalLeakage > 0 || totalUrgency > 0) && (
                <div className="px-6 py-3 bg-amber-50 border-b border-amber-100 flex items-center gap-3">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    <p className="text-xs font-bold text-amber-800 uppercase">
                        {totalLeakage > 0 && `${totalLeakage} episódio(s) de perda urinária.`}
                        {totalLeakage > 0 && totalUrgency > 0 && " · "}
                        {totalUrgency > 0 && `${totalUrgency} episódio(s) de urgência miccional.`}
                    </p>
                </div>
            )}

            {/* DETALHES */}
            {expanded && (
                <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
                    {days.map((day) => {
                        const dayEntries = grouped[day];
                        const dl = dayEntries.filter((e) => e.had_leakage).length;
                        const du = dayEntries.filter((e) => e.had_urgency).length;
                        return (
                            <div key={day} className="p-5 space-y-3">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                                        <span className="text-xs font-black text-slate-700 uppercase tracking-wide capitalize">{day}</span>
                                    </div>
                                    <div className="flex gap-1.5 flex-wrap">
                                        <Badge className="bg-blue-50 text-blue-700 text-[9px] font-black border-0">{dayEntries.length}× ao banheiro</Badge>
                                        {du > 0 && <Badge className="bg-amber-50 text-amber-700 text-[9px] font-black border-0">⚡ {du} urgência{du > 1 ? "s" : ""}</Badge>}
                                        {dl > 0 && <Badge className="bg-red-50 text-red-700 text-[9px] font-black border-0">💧 {dl} perda{dl > 1 ? "s" : ""}</Badge>}
                                    </div>
                                </div>
                                <div className="space-y-1.5 pl-5">
                                    {dayEntries.map((entry) => (
                                        <div key={entry.id} className="flex items-center gap-3 bg-slate-50/70 rounded-xl px-3 py-2">
                                            <span className="font-black text-slate-500 text-xs w-12 shrink-0 tabular-nums">
                                                {new Date(entry.recorded_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                            </span>
                                            <span className="font-bold text-slate-700 text-xs flex-1">
                                                {{ little: "Pouco", medium: "Normal", much: "Bastante" }[entry.volume_class] ?? "—"}
                                            </span>
                                            <div className="flex gap-1 items-center">
                                                {entry.had_urgency && <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-black">U</span>}
                                                {entry.had_leakage && <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-black">P</span>}
                                                {entry.changed_pad && <span className="text-[9px] bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded-full font-black">A</span>}
                                                {!entry.had_urgency && !entry.had_leakage && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="px-6 py-3 bg-slate-50 text-center">
                <button onClick={() => setExpanded((v) => !v)}
                    className="text-xs font-black text-blue-600 uppercase tracking-widest hover:text-blue-800 transition-colors">
                    {expanded ? "▲ Ocultar detalhes" : "▼ Ver todos os registros"}
                </button>
            </div>
        </div>
    );
}
