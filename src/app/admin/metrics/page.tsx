'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Zap,
    BrainCircuit,
    Users,
    DollarSign,
    RefreshCcw,
    AlertCircle,
    Target,
    Award,
    Sparkles
} from "lucide-react"
import { getStrategicMetrics, getAIStrategicInsight } from "./actions"
import { cn } from "@/lib/utils"

export default function AdminMetricsPage() {
    const [metrics, setMetrics] = useState<any>(null)
    const [aiInsight, setAiInsight] = useState<string>("")
    const [isLoading, setIsLoading] = useState(true)
    const [isGeneratingIA, setIsGeneratingIA] = useState(false)

    async function loadData() {
        setIsLoading(true)
        const data = await getStrategicMetrics()
        setMetrics(data)
        setIsLoading(false)
    }

    async function generateAIAnalysis() {
        if (!metrics) return
        setIsGeneratingIA(true)
        const { insight, error } = await getAIStrategicInsight(metrics)
        if (error) {
            // Se houver erro, mostrar feedback
            setAiInsight(`[ERRO DE PROCESSAMENTO]\n\n${error}\n\nPor favor, verifique se a GEMINI_API_KEY está configurada corretamente no arquivo .env.local.`)
        } else if (insight) {
            setAiInsight(insight)
        }
        setIsGeneratingIA(false)
    }

    useEffect(() => {
        loadData()
    }, [])

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <RefreshCcw className="w-8 h-8 animate-spin text-indigo-500" />
                <p className="text-sm font-bold text-zinc-500 animate-pulse uppercase tracking-widest">Calculando Métricas Estratégicas...</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Header com Glassmorphism */}
            <div className="relative overflow-hidden rounded-3xl bg-zinc-900 px-8 py-10 text-white shadow-2xl">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 h-80 w-80 rounded-full bg-indigo-500/20 blur-[100px]" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-60 w-60 rounded-full bg-emerald-500/10 blur-[80px]" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-indigo-500 hover:bg-indigo-600 text-white border-0 text-[10px] font-black tracking-widest px-2 uppercase">Axiom Intelligence</Badge>
                            <Badge variant="outline" className="text-zinc-400 border-zinc-700 text-[10px] uppercase">v2.0 Beta</Badge>
                        </div>
                        <h1 className="text-4xl font-black tracking-tight tracking-tighter sm:text-5xl">Métricas Estratégicas</h1>
                        <p className="text-zinc-400 mt-2 text-lg font-medium max-w-xl">
                            Visão panorâmica de performance, retenção e saúde financeira do ecossistema Axiom.
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest leading-none mb-1">Faturamento Mensal (MRR)</p>
                            <p className="text-3xl font-black text-emerald-400">R$ {metrics?.totalMRR.toLocaleString()}</p>
                        </div>
                        <Button onClick={loadData} variant="outline" size="sm" className="bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                            <RefreshCcw className="w-3.5 h-3.5 mr-2" /> REFRESH DATA
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Lado Esquerdo: Performance das Clínicas */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-zinc-200 shadow-sm overflow-hidden">
                        <CardHeader className="bg-zinc-50/50 border-b">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">Performance por Unidade</CardTitle>
                                    <CardDescription>Engajamento e crescimento semanal</CardDescription>
                                </div>
                                <Target className="w-5 h-5 text-indigo-500" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-zinc-100">
                                {metrics?.clinics.map((clinic: any) => (
                                    <div key={clinic.name} className="flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center font-black text-zinc-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                {clinic.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-zinc-900">{clinic.name}</p>
                                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{clinic.plan}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-8">
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-zinc-400 uppercase mb-0.5">Atividade</p>
                                                <div className="flex items-center gap-1.5 justify-end">
                                                    <span className="text-xs font-bold text-zinc-700">{clinic.activity.current} ações</span>
                                                    {parseFloat(clinic.trend) >= 0 ?
                                                        <TrendingUp className="w-3 h-3 text-emerald-500" /> :
                                                        <TrendingDown className="w-3 h-3 text-red-500" />
                                                    }
                                                </div>
                                            </div>
                                            <div className="w-16 text-right">
                                                <p className="text-[10px] font-black text-zinc-400 uppercase mb-0.5">Trend</p>
                                                <span className={cn(
                                                    "text-xs font-black",
                                                    parseFloat(clinic.trend) >= 0 ? "text-emerald-600" : "text-red-600"
                                                )}>
                                                    {clinic.trend}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {metrics?.clinics.length === 0 && (
                                    <div className="p-10 text-center text-zinc-400">Nenhuma clínica ativa encontrada para análise.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-emerald-100 bg-emerald-50/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold text-emerald-900 flex items-center gap-2 uppercase tracking-widest">
                                    <Award className="h-4 w-4 text-emerald-600" /> Retenção de Clientes
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-black text-emerald-700">98.5%</p>
                                <p className="text-[10px] text-emerald-600 font-bold mt-1">LTV MÉDIO: R$ 4.200</p>
                            </CardContent>
                        </Card>
                        <Card className="border-indigo-100 bg-indigo-50/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold text-indigo-900 flex items-center gap-2 uppercase tracking-widest">
                                    <Sparkles className="h-4 w-4 text-indigo-600" /> Potencial de Expansão
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-black text-indigo-700">+22%</p>
                                <p className="text-[10px] text-indigo-600 font-bold mt-1">UPGRADE DE PLANO DISPONÍVEL</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Lado Direito: IA Strategic Insights (Shark) */}
                <div className="space-y-6">
                    <Card className="border-zinc-900 bg-zinc-900 text-white shadow-xl overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                                    <BrainCircuit className="w-6 h-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-black tracking-tighter">Shark Intelligence</CardTitle>
                                    <CardDescription className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Análise Prospectiva IA</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {!aiInsight ? (
                                <div className="py-10 text-center space-y-4">
                                    <Zap className="w-10 h-10 text-zinc-700 mx-auto animate-pulse" />
                                    <p className="text-sm text-zinc-400 px-6">
                                        Ative o motor de IA para realizar uma análise estratégica do Churn e descobrir oportunidades de escala.
                                    </p>
                                    <Button
                                        onClick={generateAIAnalysis}
                                        disabled={isGeneratingIA}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-black w-full"
                                    >
                                        {isGeneratingIA ? (
                                            <><RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> PROCESSANDO...</>
                                        ) : (
                                            <><Sparkles className="w-4 h-4 mr-2" /> GERAR DASHBOARD SHARK</>
                                        )}
                                    </Button>
                                </div>
                            ) : (
                                <div className="prose prose-invert max-w-none prose-sm">
                                    <div className="whitespace-pre-wrap text-zinc-300 leading-relaxed font-medium">
                                        {aiInsight}
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="mt-6 w-full border-zinc-700 text-zinc-400 hover:text-white"
                                        onClick={() => setAiInsight("")}
                                    >
                                        Limpar Análise
                                    </Button>
                                </div>
                            )}

                            <div className="pt-4 border-t border-zinc-800">
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                                    <p className="text-[10px] text-amber-200/70 font-bold uppercase leading-tight">
                                        ESTRATÉGIA RECOMENDADA: Implementar "Cashback por Assiduidade" para reduzir o Churn em 12%.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-zinc-200">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-500">Próximo Marco: Lançamento Oficinal</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                                    <span>Setup de Produção</span>
                                    <span className="text-indigo-600">85%</span>
                                </div>
                                <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500" style={{ width: '85%' }} />
                                </div>
                            </div>
                            <p className="text-[11px] text-zinc-500 leading-relaxed italic">
                                "Sua capacidade de reter as primeiras 10 clínicas definirá o valuation da plataforma nos próximos 24 meses." - Shark Insight
                            </p>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    )
}
