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
                            {logs?.slice(0, 10).map((log: any) => {
                                const { label, color, icon } = getActionDisplay(log.action)
                                return (
                                    <div key={log.id} className="p-4 hover:bg-zinc-50/50 transition-colors flex items-start gap-4">
                                        <div className={cn("p-2 rounded-lg shrink-0", color.split(' ').slice(0, 1).join(' '), "text-current")}>
                                            {icon === 'error' ? <Activity size={16} className="text-red-500" /> : <Users size={16} className="text-zinc-500" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                                    {log.organization?.name || getTableLabel(log.table_name || log.resource)}
                                                </span>
                                                <span className="text-[10px] text-zinc-300 font-mono">
                                                    {format(new Date(log.created_at), "HH:mm")}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className={cn("inline-flex text-[9px] font-black uppercase px-1.5 py-0.5 rounded", color)}>{label}</span>
                                                <span className="text-xs font-bold text-zinc-700 truncate">{log.users?.full_name || 'Sistema'}</span>
                                            </div>
                                            <p className="text-xs text-zinc-500 truncate">{getHumanDetails(log)}</p>
                                        </div>
                                    </div>
                                )
                            })}
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
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">{clinic.name}</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-[10px] text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded leading-none">Plano {clinic.plan}</p>
                                            <p className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded leading-none font-bold">{clinic.professionalCount} Profissionais</p>
                                        </div>
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

// === TRADUÇÃO E HUMANIZAÇÃO ===

const ACTION_MAP: Record<string, { label: string; color: string; icon?: string }> = {
    'VIEW_PATIENT': { label: 'Visualizou', color: 'bg-sky-50 text-sky-700' },
    'PATIENT_CREATE': { label: 'Criou Paciente', color: 'bg-emerald-50 text-emerald-700' },
    'PATIENT_QUICK_CREATE': { label: 'Cadastro Rápido', color: 'bg-emerald-50 text-emerald-700' },
    'UPDATE_PATIENT': { label: 'Editou', color: 'bg-amber-50 text-amber-700' },
    'DELETE_PATIENT': { label: 'Excluiu', color: 'bg-red-50 text-red-700', icon: 'error' },
    'PATIENT_MERGE': { label: 'Unificou', color: 'bg-purple-50 text-purple-700' },
    'PATIENT_KINSHIP': { label: 'Parentesco', color: 'bg-indigo-50 text-indigo-700' },
    'FINALIZE_RECORD': { label: 'Finalizou', color: 'bg-green-50 text-green-700' },
    'DELETE_RECORD': { label: 'Excluiu Prontuário', color: 'bg-red-50 text-red-700', icon: 'error' },
    'INVOICE_CREATE': { label: 'Nova Fatura', color: 'bg-teal-50 text-teal-700' },
    'INSERT': { label: 'Criado', color: 'bg-emerald-50 text-emerald-700' },
    'UPDATE': { label: 'Alterado', color: 'bg-blue-50 text-blue-700' },
    'DELETE': { label: 'Removido', color: 'bg-red-50 text-red-700', icon: 'error' },
}

function getActionDisplay(action: string) {
    return ACTION_MAP[action] || { label: action, color: 'bg-slate-100 text-slate-600' }
}

const TABLE_MAP: Record<string, string> = {
    'patients': 'Pacientes', 'patient': 'Paciente', 'appointments': 'Agendamentos',
    'services': 'Serviços', 'invoices': 'Faturas', 'invoice': 'Fatura',
    'products': 'Produtos', 'profiles': 'Usuários', 'organizations': 'Organizações',
    'payment_method_fees': 'Taxas', 'system': 'Sistema',
}

function getTableLabel(t: string | null | undefined) {
    if (!t) return 'Sistema'
    return TABLE_MAP[t.toLowerCase()] || t
}

function getHumanDetails(log: any): string {
    const d = typeof log.details === 'string' ? (() => { try { return JSON.parse(log.details) } catch { return {} } })() : (log.details || {})
    if (log.action === 'VIEW_PATIENT') return d.name ? `Acessou prontuário de "${d.name}"` : 'Acessou prontuário'
    if (log.action === 'PATIENT_CREATE' || log.action === 'PATIENT_QUICK_CREATE') return d.name ? `Cadastrou "${d.name}"` : 'Novo paciente'
    if (log.action === 'UPDATE_PATIENT') return d.name ? `Editou "${d.name}"` : 'Editou paciente'
    if (log.action === 'PATIENT_MERGE') return 'Unificou fichas duplicadas'
    if (log.action === 'PATIENT_KINSHIP') return `Parentesco: ${d.degree || 'Familiar'}`
    if (log.action === 'INVOICE_CREATE') return d.amount ? `R$ ${Number(d.amount).toFixed(2)}` : 'Nova fatura'
    if (d?.message) return d.message
    if (log.action === 'UPDATE' && d?.changes) {
        const keys = Object.keys(d.changes)
        return keys.length <= 3 ? `Alterou: ${keys.join(', ')}` : `${keys.length} campos alterados`
    }
    if (log.action === 'INSERT') return 'Novo registro'
    if (log.action === 'UPDATE') return 'Registro modificado'
    if (log.action === 'DELETE') return 'Registro removido'
    return 'Ação registrada'
}
