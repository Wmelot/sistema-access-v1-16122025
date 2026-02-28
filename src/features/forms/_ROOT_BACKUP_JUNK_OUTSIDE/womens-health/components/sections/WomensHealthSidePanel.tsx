"use client";

import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Baby, AlertTriangle, CheckCircle, Activity, HeartPulse } from "lucide-react";
import { WomensHealthFormValues } from "../../schemas/womens-health-schema";

export function WomensHealthSidePanel() {
    const { watch, formState: { isSubmitting } } = useFormContext<WomensHealthFormValues>();
    const values = watch();

    // 1. Obstetric Status
    const gestations = values.obstetric?.gestations || 0;
    const births = values.obstetric?.births || 0;
    const abortions = values.obstetric?.abortions || 0;

    // 2. Red Flags check
    const redFlags = values.redFlags || {};
    // Check if any flag is explicitly true
    const hasRedFlags = Object.values(redFlags).some(val => val === true);

    // 3. PERFECT (Power)
    const power = values.perfect?.power || 0;
    const powerColor = power <= 2 ? "text-red-500" : power <= 3 ? "text-yellow-500" : "text-green-500";
    const powerBg = power <= 2 ? "bg-red-100" : power <= 3 ? "bg-yellow-100" : "bg-green-100";

    return (
        <div className="space-y-4 sticky top-6">

            {/* RED FLAG MONITOR (CRITICAL) */}
            <Card className={`border-none shadow-md ${hasRedFlags ? 'bg-red-50' : 'bg-white'}`}>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold uppercase text-slate-500 flex items-center gap-2">
                        {hasRedFlags ? <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse" /> : <ShieldCheck className="w-5 h-5 text-green-500" />}
                        Monitoramento
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {hasRedFlags ? (
                        <div className="bg-red-100 text-red-700 p-3 rounded-md border border-red-200 flex items-start gap-2">
                            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-bold text-xs uppercase mb-1">Atenção: Red Flags</h4>
                                <p className="text-[11px] leading-tight">Sinais de alerta identificados. Requer avaliação médica imediata ou cautela.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-green-50 text-green-700 p-3 rounded-md border border-green-100 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 shrink-0" />
                            <div>
                                <h4 className="font-bold text-xs uppercase">Sem Sinais de Alerta</h4>
                                <p className="text-[10px]">Nenhum red flag reportado até o momento.</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* OBSTETRIC STATUS */}
            <Card className="border-none shadow-md bg-white">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold uppercase text-slate-500 flex items-center gap-2">
                        <Baby className="w-4 h-4" /> Status Obstétrico
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 bg-slate-50 rounded">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase">Gestações</span>
                            <span className="block text-xl font-black text-rose-600">G{gestations}</span>
                        </div>
                        <div className="p-2 bg-slate-50 rounded">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase">Partos</span>
                            <span className="block text-xl font-black text-rose-600">P{births}</span>
                        </div>
                        <div className="p-2 bg-slate-50 rounded">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase">Abortos</span>
                            <span className="block text-xl font-black text-rose-600">A{abortions}</span>
                        </div>
                    </div>

                </CardContent>
            </Card>

            {/* PERFECT SCHEME */}
            <Card className="border-none shadow-md bg-white">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold uppercase text-slate-500 flex items-center gap-2">
                        <Activity className="w-4 h-4" /> Escala PERFECT
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400">Força Perineal</span>
                        <div className={`px-4 py-1 rounded-full font-black text-xl ${powerColor} ${powerBg}`}>
                            {power}/5
                        </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="text-center p-1 bg-slate-50 rounded border border-slate-100">
                            <span className="text-[9px] text-slate-400 font-bold uppercase">Endurance</span>
                            <span className="block text-sm font-bold text-slate-700">{values.perfect?.endurance || 0}s</span>
                        </div>
                        <div className="text-center p-1 bg-slate-50 rounded border border-slate-100">
                            <span className="text-[9px] text-slate-400 font-bold uppercase">Repetições</span>
                            <span className="block text-sm font-bold text-slate-700">{values.perfect?.repetitions || 0}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* SAVE BUTTON */}
            <Button type="submit" disabled={isSubmitting} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold h-12 shadow-lg shadow-rose-200">
                {isSubmitting ? <Loader2 className="mr-2 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                SALVAR AVALIAÇÃO
            </Button>

        </div>
    );
}

function ShieldCheck({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="m9 12 2 2 4-4" /></svg>
    )
}
