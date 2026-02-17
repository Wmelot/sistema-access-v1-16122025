import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Building2, DollarSign, Users } from "lucide-react";
import { GrowthChart } from "./components/growth-chart"
import { getAdminStats } from "./actions"
import { getLogs } from "@/lib/logger"
import { Badge } from "@/components/ui/badge";
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
                    <CardHeader>
                        <CardTitle className="text-lg">Atividades Recentes do Sistema</CardTitle>
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
                                                    {log.organization?.name || (log.organization_id === '00000000-0000-0000-0000-000000000001' || !log.organization_id ? 'Axiom Central' : getTableLabel(log.table_name || log.resource))}
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
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Saúde das Integrações</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <IntegrationStatus label="Z-API (WhatsApp)" status="online" latency="45ms" />
                            <IntegrationStatus label="Asaas (Financeiro)" status="online" latency="120ms" />
                            <IntegrationStatus label="Google Calendar" status="online" latency="89ms" />
                            <IntegrationStatus label="Meta (Marketing)" status="warning" latency="--" />

                            <div className="mt-6 pt-4 border-t border-zinc-100">
                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-3">Últimas Clínicas</p>
                                {stats.recentClinics.map((clinic) => (
                                    <div key={clinic.id} className="flex items-center justify-between mb-3 last:mb-0">
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-xs truncate text-zinc-800">{clinic.name}</p>
                                            <p className="text-[9px] text-zinc-500 uppercase tracking-tighter">Plano {clinic.plan}</p>
                                        </div>
                                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 capitalize">
                                            {clinic.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function IntegrationStatus({ label, status, latency }: { label: string, status: 'online' | 'warning' | 'error', latency: string }) {
    return (
        <div className="flex items-center justify-between group">
            <div className="flex items-center gap-2.5">
                <div className={cn(
                    "h-2 w-2 rounded-full",
                    status === 'online' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" :
                        status === 'warning' ? "bg-amber-500 animate-pulse" : "bg-red-500"
                )} />
                <span className="text-xs font-semibold text-zinc-700">{label}</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-400 group-hover:text-zinc-600 transition-colors">{latency}</span>
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
    // Patientes
    'VIEW_PATIENT': { label: 'Visualizou Prontuário', color: 'bg-sky-50 text-sky-700' },
    'PATIENT_CREATE': { label: 'Novo Paciente', color: 'bg-emerald-50 text-emerald-700' },
    'PATIENT_QUICK_CREATE': { label: 'Cadastro Rápido', color: 'bg-emerald-50 text-emerald-700' },
    'CREATE_PATIENT': { label: 'Novo Paciente', color: 'bg-emerald-50 text-emerald-700' },
    'UPDATE_PATIENT': { label: 'Editou Paciente', color: 'bg-amber-50 text-amber-700' },
    'UPDATE_PATIENT_RECORD': { label: 'Atualizou Prontuário', color: 'bg-blue-50 text-blue-700' },
    'DELETE_PATIENT': { label: 'Excluiu Paciente', color: 'bg-red-50 text-red-700', icon: 'error' },

    // Agendamentos
    'CREATE_APPOINTMENT': { label: 'Novo Agendamento', color: 'bg-emerald-50 text-emerald-700' },
    'UPDATE_APPOINTMENT': { label: 'Atualizou Agendamento', color: 'bg-blue-50 text-blue-700' },
    'Agendamento Cancelado': { label: 'Agendamento Cancelado', color: 'bg-zinc-100 text-zinc-600' },
    'CREATE_IMMEDIATE_ATTENDANCE': { label: 'Atendimento Imediato', color: 'bg-amber-50 text-amber-700' },

    // Sistema / Admin
    'CREATE_SERVICE': { label: 'Criou Serviço', color: 'bg-zinc-50 text-zinc-700' },
    'CREATE_BLOCK': { label: 'Bloqueio de Agenda', color: 'bg-slate-100 text-slate-600' },
    'UPDATE_RECORD': { label: 'Editou Registro', color: 'bg-blue-50 text-blue-700' },
    'INSERT': { label: 'Novo Registro', color: 'bg-emerald-50 text-emerald-700' },
    'UPDATE': { label: 'Alteração', color: 'bg-blue-50 text-blue-700' },
    'DELETE': { label: 'Remoção', color: 'bg-red-50 text-red-700', icon: 'error' },

    // Comunicação
    'SEND_WHATSAPP': { label: 'Envio WhatsApp', color: 'bg-emerald-50 text-emerald-700' },
    'SEND_NOTIFICATION': { label: 'Notificação Enviada', color: 'bg-indigo-50 text-indigo-700' },
}

function getActionDisplay(action: string) {
    if (action.includes('CANCEL')) return { label: 'Cancelamento', color: 'bg-red-50 text-red-700', icon: 'error' }
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
