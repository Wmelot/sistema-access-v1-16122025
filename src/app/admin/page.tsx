import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Building2, DollarSign, Users } from "lucide-react";

import { GrowthChart } from "./components/growth-chart"

export default function AdminPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Dashboard Master</h1>
                <p className="text-zinc-500">Visão geral do ecossistema Axiom.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Total de Clínicas"
                    value="2"
                    icon={Building2}
                    desc="+1 esse mês"
                />
                <MetricCard
                    title="Usuários Ativos"
                    value="12"
                    icon={Users}
                    desc="+12% vs mês anterior"
                />
                <MetricCard
                    title="MRR (Receita)"
                    value="R$ 4.200"
                    icon={DollarSign}
                    desc="Plano Pro e Enterprise"
                />
                <MetricCard
                    title="Saúde do Sistema"
                    value="99.9%"
                    icon={Activity}
                    desc="Todos os serviços operacionais"
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
                            <div className="flex items-center justify-between border-b border-zinc-100 pb-4 last:border-0">
                                <div>
                                    <p className="font-medium text-sm">Access Fisioterapia</p>
                                    <p className="text-xs text-zinc-500">Plano Pro • 5 Usuários</p>
                                </div>
                                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">Ativo</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-zinc-100 pb-4 last:border-0">
                                <div>
                                    <p className="font-medium text-sm">Demo Clinic</p>
                                    <p className="text-xs text-zinc-500">Free • 1 Usuário</p>
                                </div>
                                <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">Teste</span>
                            </div>
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
