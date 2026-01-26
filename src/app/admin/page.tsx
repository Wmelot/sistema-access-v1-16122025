import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Building2, DollarSign, Users } from "lucide-react";

import { GrowthChart } from "./components/growth-chart"

import { getAdminStats } from "./actions"

export default async function AdminPage() {
    const stats = await getAdminStats()

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
                <Card className="col-span-4 shadow-sm border-zinc-200">
                    <CardHeader>
                        <CardTitle className="text-lg">Crescimento (MRR)</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <GrowthChart />
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
