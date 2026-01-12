"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Activity, TrendingDown, TrendingUp, Dumbbell, Footprints, Flame, ShoppingBag, Check, AlertTriangle, Ruler, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { getShoeRecommendation, InjuryType, InjuryStatus } from "@/utils/shoe-logic";

// ADICIONADO: Interface para as propriedades
interface BiomechanicsSidebarProps {
    form: any;
    shoeIndex?: number;
    shoeRec?: {
        text: string;
        details: string;
        color: string;
    };
}

export function BiomechanicsSidebar({ form, shoeIndex, shoeRec }: BiomechanicsSidebarProps) {

    // 1. OLHEIROS (Watchers)
    const hma = form.watch("hma") || {};
    const sports = form.watch("sports") || [];
    const pregressa = form.watch("pregressa") || {};
    const efepItems = form.watch("efep") || [];
    const fpiLeft = form.watch("postural.fpi_left") || {}; // Corrigido caminho
    const fpiRight = form.watch("postural.fpi_right") || {}; // Corrigido caminho
    const shoe = form.watch("shoe") || {};

    // --- CÁLCULOS ---

    const currentEva = Number(hma.eva?.[0]) || 0;

    const efepPercentage = (() => {
        if (!efepItems?.length) return 0;
        let total = 0, count = 0;
        efepItems.forEach((i: any) => {
            const v = parseFloat(i.score);
            if (!isNaN(v)) { total += v; count++; }
        });
        return count === 0 ? 0 : Math.round((total / count) * 10);
    })();

    const trainingData = (() => {
        const safeSports = Array.isArray(sports) ? sports : [];
        const totalMinutes = safeSports.reduce((acc: number, curr: any) => {
            return acc + (Number(curr.freq || 0) * Number(curr.duration || 0));
        }, 0);
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;

        let theme = { cardBorder: "border-slate-200", cardBg: "bg-white", barColor: "bg-slate-500", textColor: "text-slate-600", label: "Sedentário", icon: Dumbbell };
        if (totalMinutes >= 10 && totalMinutes < 150) theme = { cardBorder: "border-yellow-300", cardBg: "bg-yellow-50/50", barColor: "bg-yellow-500", textColor: "text-yellow-700", label: "Abaixo da Meta", icon: TrendingDown };
        else if (totalMinutes >= 150 && totalMinutes <= 300) theme = { cardBorder: "border-green-300", cardBg: "bg-green-50/50", barColor: "bg-green-500", textColor: "text-green-700", label: "Meta Atingida", icon: Activity };
        else if (totalMinutes > 300) theme = { cardBorder: "border-purple-300", cardBg: "bg-purple-50/50", barColor: "bg-purple-500", textColor: "text-purple-700", label: "Alta Performance", icon: Flame };

        return { totalMinutes, hours, mins, theme };
    })();

    const LoadIcon = trainingData.theme.icon;

    const calcFPI = (vals: any) => Object.values(vals).reduce((acc: number, curr: any) => acc + (Number(curr) || 0), 0);
    const scoreEsq = calcFPI(fpiLeft);
    const scoreDir = calcFPI(fpiRight);
    const classifyFPI = (s: number) => s >= 6 ? "Pronado" : s <= -1 ? "Supinado" : "Neutro";

    // Prioriza o índice que vem do formulário (calculado via PDF)
    const displayMinimalIndex = shoeIndex !== undefined ? shoeIndex : 0;

    return (
        <div className="space-y-4">
            <h3 className="font-bold text-lg px-2 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" /> Monitoramento
            </h3>

            {/* 1. CARGA DE TREINO */}
            <Card className={cn("transition-all duration-300 border-2", trainingData.theme.cardBg, trainingData.theme.cardBorder)}>
                <CardHeader className="pb-2 p-4 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className={cn("text-xs uppercase font-bold", trainingData.theme.textColor)}>Carga Semanal</CardTitle>
                    <LoadIcon className={cn("w-5 h-5", trainingData.theme.textColor)} />
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                    <div>
                        <div className={cn("text-3xl font-black flex items-baseline gap-1", trainingData.theme.textColor)}>
                            {trainingData.hours}h <span className="text-lg font-medium opacity-70">{trainingData.mins}min</span>
                        </div>
                        <Badge className={cn("mt-1 border-0", trainingData.theme.barColor, "text-white")}>{trainingData.theme.label}</Badge>
                    </div>
                    <Progress value={Math.min(100, (trainingData.totalMinutes / 150) * 100)} className="h-2" indicatorClassName={trainingData.theme.barColor} />
                </CardContent>
            </Card>

            {/* 2. DOR (EVA) */}
            <Card className={cn("transition-colors", currentEva >= 7 ? "bg-red-50 border-red-200" : "")}>
                <CardHeader className="pb-2 p-4"><CardTitle className="text-xs uppercase text-muted-foreground font-bold">Dor Atual (EVA)</CardTitle></CardHeader>
                <CardContent className="p-4 pt-0">
                    <div className="flex justify-between items-end">
                        <span className="text-3xl font-bold">{currentEva}<span className="text-sm text-muted-foreground font-normal">/10</span></span>
                    </div>
                    <Progress value={currentEva * 10} className="h-2 mt-2" indicatorClassName={currentEva >= 7 ? "bg-red-500" : "bg-blue-500"} />
                </CardContent>
            </Card>

            {/* 3. POSTURA (FPI) */}
            <Card>
                <CardHeader className="pb-2 p-4"><CardTitle className="text-xs uppercase text-muted-foreground font-bold">Postura (FPI-6)</CardTitle></CardHeader>
                <CardContent className="p-4 pt-0 grid grid-cols-2 gap-2 text-center divide-x">
                    <div><div className="text-xl font-bold">{scoreEsq}</div><div className="text-[10px] uppercase text-muted-foreground">{classifyFPI(scoreEsq)}</div></div>
                    <div><div className="text-xl font-bold">{scoreDir}</div><div className="text-[10px] uppercase text-muted-foreground">{classifyFPI(scoreDir)}</div></div>
                </CardContent>
            </Card>

            {/* 4. CALÇADO & RECOMENDAÇÃO (TRECHO CONSERTADO) */}
            <Card className="bg-slate-50 border-slate-200 overflow-hidden">
                <CardHeader className="pb-2 p-4 flex flex-row justify-between space-y-0">
                    <CardTitle className="text-xs uppercase text-muted-foreground font-bold">Análise de Calçado</CardTitle>
                    <Footprints className="w-4 h-4 text-slate-400" />
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-medium">Índice Minimalista</span>
                        <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-sm">
                            {displayMinimalIndex}%
                        </span>
                    </div>
                    <Progress value={displayMinimalIndex} className="h-1.5" indicatorClassName="bg-blue-600" />
                    
                    {shoeRec?.text && (
                        <div className={cn("mt-2 p-2 rounded text-[10px] border italic leading-tight flex items-start gap-2", shoeRec.color || "bg-blue-50 border-blue-100")}>
                            <Info className="w-3 h-3 shrink-0 mt-0.5" />
                            <div>
                                <span className="font-bold not-italic block mb-0.5 uppercase tracking-tighter">Indicação Clínica:</span>
                                {shoeRec.text}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 5. RECOMENDAÇÃO DETALHADA (Só se houver lesão no formulário) */}
            {pregressa.injuryStatus && pregressa.injuryStatus !== "none" && (
                <ShoeRecommendationCard
                    injuryType={pregressa.injuryType || 'none'}
                    status={pregressa.injuryStatus}
                    currentShoeIndex={displayMinimalIndex}
                />
            )}
        </div>
    );
}

// Sub-componente (mantido conforme original)
function ShoeRecommendationCard({ injuryType, status, currentShoeIndex }: { injuryType: string, status: string, currentShoeIndex: number }) {
    const rec = getShoeRecommendation ? getShoeRecommendation(
        (injuryType as InjuryType) || 'none',
        (status as InjuryStatus) || 'prevention',
        currentShoeIndex
    ) : null;

    if (!rec) return null;

    return (
        <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-2 p-4 flex flex-row items-center justify-between space-y-0 text-blue-700">
                <CardTitle className="text-xs uppercase font-bold flex items-center gap-2"><ShoppingBag className="w-4 h-4" /> Recomendação</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
                <h4 className="font-bold text-sm text-blue-900 leading-tight">{rec.title}</h4>
                <ul className="space-y-1">
                    {rec.characteristics.map((c, i) => (
                        <li key={i} className="text-[11px] text-slate-700 flex items-start gap-2">
                            <Check className="w-3 h-3 text-blue-500 mt-0.5 shrink-0" /> {c}
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}