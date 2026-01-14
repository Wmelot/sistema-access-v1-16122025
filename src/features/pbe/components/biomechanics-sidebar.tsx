"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Activity, TrendingDown, TrendingUp, Dumbbell, Footprints, Flame, ShoppingBag, Check, AlertTriangle, Ruler, Info, BatteryCharging } from "lucide-react";
import { cn } from "@/lib/utils";
import { getShoeRecommendation, InjuryType, InjuryStatus } from "@/utils/shoe-logic";
import { PieChart, Pie, Cell, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";

// ADICIONADO: Interface para as propriedades
interface BiomechanicsSidebarProps {
    form: any;
    shoeIndex?: number;
    shoeRec?: {
        text: string;
        details: string;
        color: string;
    };
    radarData?: any[];
}

export function BiomechanicsSidebar({ form, shoeIndex, shoeRec, radarData }: BiomechanicsSidebarProps) {

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
    const hasEva = Array.isArray(hma.eva) && hma.eva.length > 0;

    const efepPercentage = (() => {
        if (!efepItems?.length) return 0;
        let total = 0, count = 0;
        efepItems.forEach((i: any) => {
            const v = parseFloat(i.score);
            if (!isNaN(v)) { total += v; count++; }
        });
        return count === 0 ? 0 : Math.round((total / count) * 10);
    })();
    const hasEfep = efepItems && efepItems.length > 0;

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
    const classifyFPI = (s: number) => s >= 6 ? "Plano" : s <= -1 ? "Cavo" : "Neutro";

    // Prioriza o índice que vem do formulário (calculado via PDF)
    const displayMinimalIndex = shoeIndex !== undefined ? shoeIndex : 0;

    return (
        <div className="space-y-4">
            <h3 className="font-bold text-lg px-2 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" /> Monitoramento
            </h3>

            {/* 1. DOR (EVA) */}
            {/* 1. DOR (EVA) */}
            <Card className={cn("transition-colors duration-500 border",
                (!hasEva || currentEva === 0) ? "bg-white border-slate-200" :
                    currentEva <= 2 ? "bg-green-50 border-green-200" :
                        currentEva <= 7 ? "bg-yellow-50 border-yellow-200" :
                            "bg-red-50 border-red-200"
            )}>
                <CardHeader className="pb-2 p-4"><CardTitle className="text-xs uppercase text-slate-500 font-bold">Dor Atual (EVA)</CardTitle></CardHeader>
                <CardContent className="p-4 pt-0">
                    <div className="flex items-baseline gap-1">
                        <span className={cn("text-5xl font-black tracking-tighter transition-colors duration-300",
                            (!hasEva || currentEva === 0) ? "text-slate-300" :
                                currentEva <= 2 ? "text-green-600" :
                                    currentEva <= 7 ? "text-yellow-600" :
                                        "text-red-600"
                        )}>
                            {currentEva}
                        </span>
                        <span className="text-sm font-bold text-slate-400 opacity-60">/10</span>
                    </div>
                    <Progress
                        value={currentEva * 10}
                        className="h-2 mt-4 bg-white/50"
                        indicatorClassName={
                            (!hasEva || currentEva === 0) ? "bg-slate-200" :
                                currentEva <= 2 ? "bg-green-500" :
                                    currentEva <= 7 ? "bg-yellow-500" :
                                        "bg-red-500"
                        }
                    />
                </CardContent>
            </Card>

            {/* 1.5. FUNCIONALIDADE (MÉDIA) - ESTILO BATERIA (FIXED HEIGHT) */}
            <Card className={cn("overflow-hidden shadow-sm relative z-0 transition-colors duration-500 border",
                (!hasEfep || efepPercentage === 0) ? "bg-white border-slate-200" :
                    (efepPercentage / 10) < 3 ? "bg-red-50 border-red-200" :
                        (efepPercentage / 10) >= 9 ? "bg-green-50 border-green-200" :
                            "bg-yellow-50 border-yellow-200"
            )}>
                <CardHeader className="pb-0 p-4"><CardTitle className="text-xs uppercase text-slate-500 font-bold">Nível Funcional</CardTitle></CardHeader>
                <CardContent className="p-4 relative flex justify-center">

                    {/* Container com altura FIXA e largura definida para garantir renderização */}
                    <div style={{ width: '100%', height: '140px', position: 'relative' }}>
                        <ResponsiveContainer>
                            <PieChart margin={{ top: 0, left: 0, right: 0, bottom: 0 }}>
                                <Pie
                                    data={[
                                        { value: Number((efepPercentage / 10).toFixed(1)) || 0 }, // Valor
                                        { value: 10 - (Number((efepPercentage / 10).toFixed(1)) || 0) } // Resto
                                    ]}
                                    cx="50%"
                                    cy="85%"
                                    startAngle={180}
                                    endAngle={0}
                                    innerRadius={75}
                                    outerRadius={95} // Aumentado para melhor visibilidade
                                    cornerRadius={8}
                                    paddingAngle={0}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {/* Células Coloridas */}
                                    <Cell
                                        fill={
                                            (!hasEfep || efepPercentage === 0) ? "#e2e8f0" :
                                                (efepPercentage / 10) < 3 ? "#ef4444" :
                                                    (efepPercentage / 10) >= 9 ? "#22c55e" :
                                                        "#eab308"
                                        }
                                    />
                                    {/* Fundo Cinza Claro */}
                                    <Cell fill="#f1f5f9" />
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Overlay de Texto */}
                        <div className="absolute inset-x-0 bottom-4 flex flex-col items-center justify-end pointer-events-none">
                            <span className={cn("text-5xl font-black tracking-tighter tabular-nums transition-colors duration-300",
                                (!hasEfep || efepPercentage === 0) ? "text-slate-300" :
                                    (efepPercentage / 10) < 3 ? "text-red-500" :
                                        (efepPercentage / 10) >= 9 ? "text-green-500" :
                                            "text-yellow-500"
                            )}>
                                {efepPercentage ? (efepPercentage / 10).toFixed(1) : "0.0"}
                            </span>

                            <div className="flex items-center gap-1.5 mt-2 opacity-70">
                                <BatteryCharging className={cn("w-4 h-4",
                                    (!hasEfep || efepPercentage === 0) ? "text-slate-400" :
                                        (efepPercentage / 10) < 3 ? "text-red-400" :
                                            (efepPercentage / 10) >= 9 ? "text-green-400" : "text-yellow-500"
                                )} />
                                <span className="text-[10px] font-bold uppercase text-slate-400">Pontos</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 2. CARGA DE TREINO */}
            <Card className={cn("transition-all duration-300 border-2", trainingData.theme.cardBg, trainingData.theme.cardBorder)}>
                <CardHeader className="pb-2 p-4 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className={cn("text-xs uppercase font-bold", trainingData.theme.textColor)}>Carga de treino semanal</CardTitle>
                    <LoadIcon className={cn("w-5 h-5", trainingData.theme.textColor)} />
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">Estimativa Calórica</span>
                        <div className="flex items-center gap-1">
                            <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
                            <span className="text-4xl font-black tracking-tighter text-orange-600">
                                {Math.round(trainingData.totalMinutes * 7.5)} <span className="text-sm text-orange-400 font-bold">kcal</span>
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className={cn("text-sm font-bold opacity-80", trainingData.theme.textColor)}>
                            {trainingData.hours}h {trainingData.mins > 0 && <span>{trainingData.mins}min</span>} / semana
                        </div>
                        <Badge className={cn("border-0", trainingData.theme.barColor, "text-white")}>{trainingData.theme.label}</Badge>
                    </div>

                    <Progress value={Math.min(100, (trainingData.totalMinutes / 150) * 100)} className="h-2" indicatorClassName={trainingData.theme.barColor} />
                </CardContent>
            </Card>


            {/* 3. POSTURA (FPI) - ESTILO GAUGE LINEAR */}
            <Card className="bg-white border-slate-200">
                <CardHeader className="pb-2 p-4 flex flex-row items-center justify-between">
                    <CardTitle className="text-xs uppercase text-slate-500 font-bold">Postura (FPI-6)</CardTitle>
                    <Footprints className="w-4 h-4 text-slate-300" />
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-6">
                    {/* ESQUERDO */}
                    <FpiGauge side="Esquerdo" score={scoreEsq} />

                    {/* DIREITO */}
                    <FpiGauge side="Direito" score={scoreDir} />
                </CardContent>
            </Card>

            {/* 3.5 GRÁFICO DE RADAR (BIOMECÂNICA GLOBAL) */}
            {radarData && radarData.length > 0 && (
                <Card className="bg-white border-slate-200 overflow-hidden">
                    <CardHeader className="pb-2 p-4 flex flex-row items-center justify-between">
                        <CardTitle className="text-xs uppercase text-slate-500 font-bold">Perfil Biomecânico</CardTitle>
                        <Activity className="w-4 h-4 text-slate-300" />
                    </CardHeader>
                    <CardContent className="p-0 h-[220px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                                {/* Eixo Invisível para forçar escala 0-100 */}
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar
                                    name="Paciente"
                                    dataKey="A"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    fill="#3b82f6"
                                    fillOpacity={0.2}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                        <div className="absolute bottom-2 w-full text-center">
                            <span className="text-[10px] text-slate-400 font-medium">Pontuação Global (0-100)</span>
                        </div>
                    </CardContent>
                </Card>
            )}

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
            {
                pregressa.injuryStatus && pregressa.injuryStatus !== "none" && (
                    <ShoeRecommendationCard
                        injuryType={pregressa.injuryType || 'none'}
                        status={pregressa.injuryStatus}
                        currentShoeIndex={displayMinimalIndex}
                    />
                )
            }
        </div >
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

// Sub-componente para o Gauge do FPI (Postura)
function FpiGauge({ side, score }: { side: string, score: number }) {
    // Normaliza score de -12 a +12 para 0 a 100%
    // Range total = 24 pontos (-12 a +12)
    // Formula: ((score + 12) / 24) * 100
    // Limitamos entre 0 e 100 para não quebrar o layout
    const percent = Math.min(100, Math.max(0, ((score + 12) / 24) * 100));

    let status = "Neutro";
    let colorClass = "bg-green-500";
    let textClass = "text-green-600";

    if (score < 0) {
        status = "Cavo";
        colorClass = "bg-orange-500";
        textClass = "text-orange-600";
    } else if (score > 5) {
        status = "Plano";
        colorClass = "bg-red-500";
        textClass = "text-red-600";
    }

    return (
        <div className="space-y-1">
            <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold uppercase text-slate-400">{side}</span>
                <span className={cn("text-xs font-black uppercase", textClass)}>{score > 0 ? `+${score}` : score} <span className="text-[9px] opacity-70">({status})</span></span>
            </div>

            <div className="relative h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex items-center">
                {/* Zonas de Cor (Background do Track) */}
                {/* Cavo (-12 a -1) -> ~45% */}
                <div className="h-full w-[46%] bg-orange-100/50 absolute left-0 top-0 border-r border-white" />
                {/* Neutro (0 a +5) -> ~25% */}
                <div className="h-full w-[25%] bg-green-100/50 absolute left-[46%] top-0 border-r border-white" />
                {/* Plano (+6 a +12) -> ~29% */}
                <div className="h-full w-[29%] bg-red-100/50 absolute right-0 top-0" />

                {/* Marcador (Dot) */}
                <div
                    className={cn("absolute w-3 h-3 rounded-full border-2 border-white shadow-sm transition-all duration-500", colorClass)}
                    style={{ left: `calc(${percent}% - 6px)` }}
                />
            </div>

            {/* Legenda Minima */}
            <div className="flex justify-between text-[8px] text-slate-300 font-medium px-1">
                <span>Supinado</span>
                <span>Pronado</span>
            </div>
        </div>
    );
}