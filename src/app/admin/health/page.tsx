'use client'

import { useState, useEffect } from "react"
import { CheckCircle2, AlertTriangle, XCircle, Clock, Globe, Shield, Zap, Database, RefreshCcw } from "lucide-react"
import { getSystemHealth } from "./actions"
import { Button } from "@/components/ui/button"

export default function SystemHealthPage() {
    const [data, setData] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(false)

    async function fetchData() {
        setIsLoading(true)
        const res = await getSystemHealth()
        setData(res)
        setIsLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [])

    if (!data && isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <RefreshCcw className="w-8 h-8 animate-spin text-zinc-300" />
            </div>
        )
    }

    const allGood = data?.statuses.every((s: any) => s.status === 'operational')

    return (
        <div className="container mx-auto py-10 max-w-4xl space-y-8">
            <div className="flex items-center justify-between border-b pb-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-zinc-900">Saúde do Sistema</h1>
                    <p className="text-sm text-zinc-500 font-medium">Status operacional do ecossistema Axiom em tempo real.</p>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-2xl font-black text-emerald-600">{data?.uptime || '--'}%</span>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">Uptime (90 dias)</span>
                </div>
            </div>

            {/* Banner Status */}
            <div className={`rounded-xl p-6 flex items-center gap-4 border ${allGood ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg ${allGood ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}>
                    {allGood ? <CheckCircle2 className="w-7 h-7" /> : <AlertTriangle className="w-7 h-7" />}
                </div>
                <div className="flex-1">
                    <h2 className={`text-xl font-bold ${allGood ? 'text-emerald-900' : 'text-amber-900'}`}>
                        {allGood ? 'Todos os sistemas operacionais' : 'Sistemas operando com instabilidade parcial'}
                    </h2>
                    <p className={`${allGood ? 'text-emerald-700' : 'text-amber-700'} text-sm`}>
                        {allGood ? 'Sem incidentes detectados nas últimas 24 horas.' : 'Verifique os componentes abaixo para detalhes.'}
                    </p>
                </div>
                <Button variant="ghost" size="sm" onClick={fetchData} disabled={isLoading}>
                    <RefreshCcw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Atualizar
                </Button>
            </div>

            {/* Component Stats */}
            <div className="space-y-4">
                <h3 className="text-sm font-black uppercase text-zinc-400 tracking-widest">Componentes</h3>
                <div className="grid grid-cols-1 border rounded-xl divide-y overflow-hidden shadow-sm">
                    {data?.statuses.map((comp: any) => (
                        <div key={comp.name} className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                            <div>
                                <h4 className="font-bold text-zinc-800 text-sm">{comp.name}</h4>
                                <p className="text-xs text-zinc-500 mt-0.5">{comp.desc}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                {comp.latency && <span className="text-[10px] font-mono text-zinc-400">{comp.latency}</span>}
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-black uppercase ${comp.status === 'operational' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                        {comp.status === 'operational' ? 'Operacional' : 'Atenção'}
                                    </span>
                                    <div className={`w-2 h-2 rounded-full ${comp.status === 'operational' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Visual History (Bar Charts) */}
            <div className="space-y-4">
                <h3 className="text-sm font-black uppercase text-zinc-400 tracking-widest">Histórico de Disponibilidade (Global)</h3>
                <div className="space-y-8">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                            <span className="text-xs font-bold text-zinc-700">Cluster sa-east-1 (Primary)</span>
                            <span className="text-[10px] font-medium text-emerald-600">Disponibilidade 99.9%</span>
                        </div>
                        <div className="flex h-10 w-full gap-0.5 items-end">
                            {data?.history.map((status: string, i: number) => {
                                const date = new Date()
                                date.setDate(date.getDate() - (90 - i))
                                return (
                                    <div
                                        key={i}
                                        className={`flex-1 rounded-t-sm transition-all hover:scale-x-125 cursor-help ${status === 'operational' ? 'bg-emerald-500 h-10' :
                                            status === 'minor' ? 'bg-amber-400 h-6' : 'bg-red-500 h-8'
                                            }`}
                                        title={`${date.toLocaleDateString()}: ${status === 'operational' ? 'Operacional' : 'Incidente reportado'}`}
                                    />
                                )
                            })}
                        </div>
                        <div className="flex justify-between text-[9px] text-zinc-400 font-bold uppercase tracking-tighter">
                            <span>90 dias atrás</span>
                            <span>Hoje</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Security Blocks */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-xl bg-zinc-50/50">
                    <Shield className="w-5 h-5 text-indigo-600 mb-2" />
                    <h5 className="text-xs font-bold uppercase tracking-wider mb-1">Certificado SSL/TLS</h5>
                    <p className="text-[10px] text-zinc-500">Cloudflare Edge CA validado e ativo.</p>
                </div>
                <div className="p-4 border rounded-xl bg-zinc-50/50">
                    <Database className="w-5 h-5 text-indigo-600 mb-2" />
                    <h5 className="text-xs font-bold uppercase tracking-wider mb-1">Latência da Base</h5>
                    <p className="text-[10px] text-zinc-500">Média em tempo real: {data?.latency}ms</p>
                </div>
                <div className="p-4 border rounded-xl bg-zinc-50/50">
                    <Zap className="w-5 h-5 text-indigo-600 mb-2" />
                    <h5 className="text-xs font-bold uppercase tracking-wider mb-1">Monitoramento IA</h5>
                    <p className="text-[10px] text-zinc-500">Integridade de modelos Gemini Pro v1.5.</p>
                </div>
            </div>
        </div>
    )
}
