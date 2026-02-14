import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Building2, DollarSign, Users } from "lucide-react";
import { GrowthChart } from "./components/growth-chart"
import { getAdminStats } from "./actions"
import { getLogs } from "@/lib/logger"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function AdminPage() {
    const stats = await getAdminStats()
    const logs = await getLogs(undefined, undefined, undefined, true)

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Dashboard Master</h1>
                <p className="text-zinc-500">Visão geral do ecossistema Axiom.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Total de Clínicas"
                    value={stats.clinicsCount.toString()}
                    icon={Building2}
                    desc="Clínicas cadastradas"
                />
                <MetricCard
                    title="Usuários Ativos"
                    value={stats.usersCount.toString()}
                    icon={Users}
                    desc="Total de profissionais"
                />
                <MetricCard
                    title="MRR (Receita)"
                    value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalMRR)}
                    icon={DollarSign}
                    desc="Receita recorrente estimada"
                />
                <MetricCard
                    title="Saúde do Sistema"
                    value="99.9%"
                    icon={Activity}
                    desc="Serviços operacionais"
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 shadow-sm border-zinc-200 overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Atividades Recentes do Sistema</CardTitle>
                        <Link href="/admin/logs">
                            <Button variant="ghost" size="sm" className="text-xs font-bold text-zinc-400 hover:text-zinc-600">VER TODOS <Activity className="ml-2 h-3 w-3" /></Button>
                        </Link>
                    </CardHeader>
                    <CardContent className="p-0 border-t border-zinc-100">
                        <div className="divide-y divide-zinc-100">
                            {logs?.slice(0, 10).map((log: any) => (
                                <div key={log.id} className="p-4 hover:bg-zinc-50/50 transition-colors flex items-start gap-4">
                                    <div className={cn(
                                        "p-2 rounded-lg shrink-0",
                                        log.action?.includes('ERROR') ? 'bg-red-50 text-red-600' : 'bg-zinc-100 text-zinc-500'
                                    )}>
                                        {log.action?.includes('ERROR') ? <Activity size={16} /> : <Users size={16} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                                {log.organization?.name || 'Sistema Central'}
                                            </span>
                                            <span className="text-[10px] text-zinc-300 font-mono">
                                                {format(new Date(log.created_at), "HH:mm")}
                                            </span>
                                        </div>
                                        <p className="text-sm font-bold text-zinc-800 truncate">{log.action}</p>
                                        <p className="text-xs text-zinc-500 truncate">{JSON.stringify(log.details)}</p>
                                    </div>
                                </div>
                            ))}
                            {(!logs || logs.length === 0) && (
                                <div className="p-10 text-center text-zinc-400">Nenhuma atividade recente.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3 shadow-sm border-zinc-200">
                    <CardHeader>
                        <CardTitle className="text-lg">Últimas Clínicas Cadastradas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.recentClinics.length === 0 && (
                                <p className="text-sm text-zinc-500 text-center py-4">Nenhuma clínica encontrada.</p>
                            )}
                            {stats.recentClinics.map((clinic) => (
                                <div key={clinic.id} className="flex items-center justify-between border-b border-zinc-100 pb-4 last:border-0">
                                    <div>
                                        <p className="font-medium text-sm">{clinic.name}</p>
                                        <p className="text-xs text-zinc-500">Plano {clinic.plan}</p>
                                    </div>
                                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${clinic.status === 'active'
                                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                                        : 'bg-yellow-50 text-yellow-800 ring-yellow-600/20'
                                        }`}>
                                        {clinic.status === 'active' ? 'Ativo' : 'Pendente'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}



function MetricCard({ title, value, icon: Icon, desc }: any) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">
                    {desc}
                </p>
            </CardContent>
        </Card>
    )
}
