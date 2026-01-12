import React from 'react';
import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Activity, AlertTriangle, Brain, Save, Target, Thermometer } from "lucide-react";
import { cn } from "@/lib/utils";

interface BiomechanicsSidebarProps {
    form: UseFormReturn<any>;
    onSave?: () => void;
    isSaving?: boolean;
}

const REGION_LABELS: Record<string, string> = {
    spine_lumbar: "Coluna Lombar",
    spine_cervical: "Coluna Cervical",
    shoulder: "Ombro",
    knee: "Joelho",
    ankle_foot: "Tornozelo e Pé",
    hip: "Quadril",
    elbow_hand: "Cotovelo/Punho/Mão"
};

export function BiomechanicsSidebar({ form, onSave, isSaving }: BiomechanicsSidebarProps) {
    const data = form.watch();

    // 1. EVA Logic (Calculated from HMA)
    // Slider returns array, so we handle both number and array
    const rawEva = data.hma?.eva;
    const eva = Array.isArray(rawEva) ? rawEva[0] : (rawEva || 0);

    const evaColor = eva >= 7 ? "text-red-600" : eva >= 4 ? "text-yellow-600" : "text-green-600";
    const evaBg = eva >= 7 ? "bg-red-100" : eva >= 4 ? "bg-yellow-100" : "bg-green-100";
    const evaLabel = eva >= 7 ? "Dor Intensa" : eva >= 4 ? "Dor Moderada" : "Dor Leve";

    // 2. Functional Score (Calculated from EFEP if available)
    // The user's EFEP structure is: { activity: "", score: number }[]
    const efep = data.efep || [];
    const efepAverage = efep.length > 0
        ? Math.round(efep.reduce((acc: number, item: any) => acc + (Number(item.score) || 0), 0) / efep.length)
        : 0;

    // 3. Region
    const regionKey = data.anamnesis?.mainRegion; // Assuming similar structure if exists
    const regionName = regionKey ? REGION_LABELS[regionKey] : "Geral / Palmilha";

    return (
        <div className="space-y-4 sticky top-6">

            {/* MAIN ACTIONS */}
            <Card className="border-none shadow-md bg-white overflow-hidden">
                <div className="p-1 bg-gradient-to-r from-blue-600 to-purple-600"></div>
                <CardContent className="pt-4 pb-4 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avaliação</span>
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
                            {regionName}
                        </Badge>
                    </div>

                    <Button
                        onClick={onSave}
                        disabled={isSaving}
                        className="w-full font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-lg"
                    >
                        {isSaving ? "Salvando..." : <><Save className="w-4 h-4 mr-2" /> Salvar</>}
                    </Button>

                    <Button variant="outline" className="w-full text-purple-700 border-purple-200 hover:bg-purple-50">
                        <Brain className="w-4 h-4 mr-2" /> Análise IA
                    </Button>
                </CardContent>
            </Card>

            {/* SEVERIDADE DA DOR */}
            <Card className="border-none shadow-md bg-white">
                <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
                        <Activity className="w-4 h-4" /> Severidade (EVA)
                    </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className={cn("text-3xl font-black", evaColor)}>{eva}/10</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">{evaLabel}</span>
                        </div>
                        <div className={cn("h-12 w-12 rounded-full flex items-center justify-center", evaBg)}>
                            <Activity className={cn("w-6 h-6", evaColor)} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* FUNCIONALIDADE / EFEP */}
            <Card className="border-none shadow-md bg-white">
                <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
                        <Target className="w-4 h-4" /> Score Funcional (EFEP)
                    </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                            <span className="text-slate-700">Média de Queixas</span>
                            <span className="font-bold text-slate-600">
                                {efepAverage}/10
                            </span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                style={{ width: `${efepAverage * 10}%` }}
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 text-right">
                            {efep.length} atividades cadastradas
                        </p>
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}
