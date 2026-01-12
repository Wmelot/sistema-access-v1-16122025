"use client";

import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Activity, Footprints, Ruler } from "lucide-react";
import { BiomechanicsFormValues } from "../../schemas/biomechanics-schema";
import { useMemo } from "react";

import { calculateMinimalistScore } from "@/utils/minimalist-index";

export function BiomechanicsSidePanel() {
    const { watch, formState: { isSubmitting } } = useFormContext<BiomechanicsFormValues>();
    const values = watch();

    // --- CALCULATIONS ---

    // 1. Pain (EVA)
    const eva = values.clinical?.painLevel || 0;
    const evaColor = eva <= 3 ? "text-green-500" : eva <= 7 ? "text-yellow-500" : "text-red-500";
    const evaBg = eva <= 3 ? "bg-green-100" : eva <= 7 ? "bg-yellow-100" : "bg-red-100";

    // 2. FPI-6 Score
    const calculateFPI = (side: 'left' | 'right') => {
        const fpi = side === 'left' ? values.statictests?.fpiLeft : values.statictests?.fpiRight;
        if (!fpi) return 0;
        return (fpi.talarHead || 0) + (fpi.curves || 0) + (fpi.calcanealInversion || 0) + (fpi.talarNavicular || 0) + (fpi.medialArch || 0) + (fpi.abdAdd || 0);
    };
    const fpiLeft = calculateFPI('left');
    const fpiRight = calculateFPI('right');

    const getFpiLabel = (score: number) => {
        if (score >= 10) return "Pronado (+)";
        if (score >= 6) return "Pronado";
        if (score >= 0) return "Neutro";
        if (score >= -5) return "Supinado";
        return "Supinado (+)";
    }

    // 3. Minimalist Index
    // Use the utility to calculate fresh score based on current values
    const minimalistIndex = calculateMinimalistScore(values.currentShoe);

    return (
        <div className="space-y-4 sticky top-6">

            {/* 1. PAIN SUMMARY */}
            <Card className="border-none shadow-md bg-white">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold uppercase text-slate-500 flex items-center gap-2">
                        <Activity className="w-4 h-4" /> Resumo da Dor (EVA)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400">Intensidade Atual</span>
                        <div className={`px-4 py-1 rounded-full font-black text-xl ${evaColor} ${evaBg}`}>
                            {eva}/10
                        </div>
                    </div>
                    <Progress value={eva * 10} className={`h-2 mt-3 ${eva > 7 ? 'bg-red-200' : 'bg-slate-100'}`} />
                </CardContent>
            </Card>

            {/* 2. FPI-6 SCORES */}
            <Card className="border-none shadow-md bg-white">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold uppercase text-slate-500 flex items-center gap-2">
                        <Footprints className="w-4 h-4" /> Score FPI-6
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-2 bg-slate-50 rounded-lg">
                            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Esquerdo</span>
                            <span className="text-lg font-black text-slate-700 block">{fpiLeft}</span>
                            <Badge variant="outline" className="text-[9px] mt-1">{getFpiLabel(fpiLeft)}</Badge>
                        </div>
                        <div className="text-center p-2 bg-slate-50 rounded-lg">
                            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Direito</span>
                            <span className="text-lg font-black text-slate-700 block">{fpiRight}</span>
                            <Badge variant="outline" className="text-[9px] mt-1">{getFpiLabel(fpiRight)}</Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 3. SHOE INDEX */}
            <Card className="border-none shadow-md bg-white">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold uppercase text-slate-500 flex items-center gap-2">
                        <Ruler className="w-4 h-4" /> Índice Minimalista
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-2">
                        <div className="text-3xl font-black text-blue-600 mb-1">{minimalistIndex}%</div>
                        <span className="text-xs text-slate-400 font-medium">Pontuação do Calçado Atual</span>
                    </div>
                    <Progress value={minimalistIndex} className="h-2 mt-2" />
                </CardContent>
            </Card>

            {/* SAVE BUTTON */}
            <Button type="submit" disabled={isSubmitting} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-12 shadow-lg shadow-green-200">
                {isSubmitting ? <Loader2 className="mr-2 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                SALVAR AVALIAÇÃO
            </Button>

        </div>
    );
}
