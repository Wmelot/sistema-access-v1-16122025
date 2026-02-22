import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Activity, AlertTriangle, Brain, Save, Target, Thermometer } from "lucide-react";
import { cn } from "@/lib/utils";

interface SmartAssessmentSidebarProps {
    data: any; // Using any for flexibility as per existing form, but preferably SmartAssessmentValues
    onSave: () => void;
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

export function SmartAssessmentSidebar({ data, onSave, isSaving }: SmartAssessmentSidebarProps) {
    // 1. EVA Logic
    const eva = data.eva || 0;
    const evaColor = eva >= 7 ? "text-red-600" : eva >= 4 ? "text-yellow-600" : "text-green-600";
    const evaBg = eva >= 7 ? "bg-red-100" : eva >= 4 ? "bg-yellow-100" : "bg-green-100";
    const evaLabel = eva >= 7 ? "Dor Intensa" : eva >= 4 ? "Dor Moderada" : "Dor Leve";

    // 2. Irritability (Calculated from Positive Special Tests)
    const specialTests = data.physicalExam?.specialTests || {};
    const totalTests = Object.keys(specialTests).length;
    const positiveTests = Object.values(specialTests).filter(Boolean).length;
    const irritability = totalTests > 0 ? Math.round((positiveTests / totalTests) * 100) : 0;

    // 3. Region
    const regionKey = data.anamnesis?.mainRegion;
    const regionName = regionKey ? REGION_LABELS[regionKey] : "Não Selecionada";

    return (
        <div className="space-y-4 sticky top-6">

            {/* MAIN ACTIONS */}
            <Card className="border-none shadow-md bg-white overflow-hidden">
                <div className="p-1 bg-gradient-to-r from-blue-600 to-purple-600"></div>
                <CardContent className="pt-4 pb-4 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Região Alvo</span>
                        {regionKey ? (
                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
                                {regionName}
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="text-slate-400 border-dashed">Pendente</Badge>
                        )}
                    </div>

                    <Button
                        onClick={onSave}
                        disabled={isSaving}
                        className="w-full font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-lg"
                    >
                        {isSaving ? "Salvando..." : <><Save className="w-4 h-4 mr-2" /> Salvar Checkpoint</>}
                    </Button>

                    <Button variant="outline" className="w-full text-purple-700 border-purple-200 hover:bg-purple-50">
                        <Brain className="w-4 h-4 mr-2" /> Gerar Hipótese (IA)
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

            {/* IRRITABILIDADE TECIDUAL */}
            <Card className="border-none shadow-md bg-white">
                <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
                        <Thermometer className="w-4 h-4" /> Irritabilidade
                    </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                            <span className="text-slate-700">Testes Positivos</span>
                            <span className={cn("font-bold", irritability > 50 ? "text-red-600" : "text-slate-600")}>
                                {irritability}%
                            </span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className={cn("h-full rounded-full transition-all duration-500", irritability > 50 ? "bg-red-500" : "bg-blue-500")}
                                style={{ width: `${irritability}%` }}
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 text-right">
                            {positiveTests} de {totalTests} testes realizados
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* DATA SUMMARY */}
            <Card className="border-none shadow-md bg-white">
                <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3 text-slate-600">
                        <div className="p-2 bg-slate-100 rounded-lg">
                            <Target className="w-4 h-4 text-slate-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase text-slate-400">Funcionalidade</p>
                            <p className="text-sm font-bold">{data.functional?.functionScore || 0}% (EFEP)</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}
