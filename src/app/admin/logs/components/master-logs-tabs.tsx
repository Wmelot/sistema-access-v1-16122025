"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ShieldCheck, Building2, Eye } from "lucide-react"

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ')
}

// === TRADUÇÃO ===

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
    'VIEW_PATIENT': { label: 'Visualizou Paciente', color: 'bg-sky-50 text-sky-700' },
    'PATIENT_CREATE': { label: 'Criou Paciente', color: 'bg-emerald-50 text-emerald-700' },
    'PATIENT_QUICK_CREATE': { label: 'Cadastro Rápido', color: 'bg-emerald-50 text-emerald-700' },
    'UPDATE_PATIENT': { label: 'Editou Paciente', color: 'bg-amber-50 text-amber-700' },
    'DELETE_PATIENT': { label: 'Excluiu Paciente', color: 'bg-red-50 text-red-700' },
    'PATIENT_MERGE': { label: 'Unificou Pacientes', color: 'bg-purple-50 text-purple-700' },
    'PATIENT_KINSHIP': { label: 'Marcou Parentesco', color: 'bg-indigo-50 text-indigo-700' },
    'FINALIZE_RECORD': { label: 'Finalizou Prontuário', color: 'bg-green-50 text-green-700' },
    'DELETE_RECORD': { label: 'Excluiu Prontuário', color: 'bg-red-50 text-red-700' },
    'INVOICE_CREATE': { label: 'Criou Fatura', color: 'bg-teal-50 text-teal-700' },
    'INSERT': { label: 'Registro Criado', color: 'bg-emerald-50 text-emerald-700' },
    'UPDATE': { label: 'Registro Alterado', color: 'bg-blue-50 text-blue-700' },
    'DELETE': { label: 'Registro Removido', color: 'bg-red-50 text-red-700' },
}

const TABLE_LABELS: Record<string, string> = {
    'patients': 'Pacientes', 'patient': 'Paciente', 'appointments': 'Agendamentos',
    'services': 'Serviços', 'invoices': 'Faturas', 'invoice': 'Fatura',
    'products': 'Produtos', 'profiles': 'Usuários', 'organizations': 'Organizações',
    'payment_method_fees': 'Taxas', 'patient_records': 'Prontuários',
    'patient_record': 'Prontuário', 'system': 'Sistema',
}

function getActionLabel(action: string) {
    return ACTION_LABELS[action] || { label: action, color: 'bg-slate-100 text-slate-600' }
}

function getTableLabel(t: string | null | undefined) {
    if (!t) return 'Sistema'
    return TABLE_LABELS[t.toLowerCase()] || t
}

function getHumanDetails(log: any): string {
    const d = typeof log.details === 'string' ? (() => { try { return JSON.parse(log.details) } catch { return {} } })() : (log.details || {})
    if (log.action === 'VIEW_PATIENT') return d.name ? `Acessou prontuário de "${d.name}"` : 'Acessou prontuário'
    if (log.action === 'PATIENT_CREATE' || log.action === 'PATIENT_QUICK_CREATE') return d.name ? `Cadastrou "${d.name}"` : 'Novo paciente'
    if (log.action === 'UPDATE_PATIENT') return d.name ? `Editou "${d.name}"` : 'Editou paciente'
    if (log.action === 'DELETE_PATIENT') return 'Excluiu ficha de paciente'
    if (log.action === 'PATIENT_MERGE') return 'Unificou fichas duplicadas'
    if (log.action === 'PATIENT_KINSHIP') return `Parentesco: ${d.degree || 'Familiar'}`
    if (log.action === 'FINALIZE_RECORD') return 'Finalizou prontuário'
    if (log.action === 'DELETE_RECORD') return 'Removeu prontuário'
    if (log.action === 'INVOICE_CREATE') return d.amount ? `Fatura de R$ ${Number(d.amount).toFixed(2)}` : 'Nova fatura'
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

// === COMPONENTE ===

interface MasterLogsTabsProps {
    auditLogs: any[]
    accessLogs: any[]
}

export function MasterLogsTabs({ auditLogs, accessLogs }: MasterLogsTabsProps) {
    const [activeTab, setActiveTab] = useState<'audit' | 'access'>('audit')

    return (
        <>
            {/* Tab Switcher */}
            <div className="flex gap-1 bg-zinc-100 rounded-lg p-1">
                <button
                    onClick={() => setActiveTab('audit')}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md text-xs font-bold uppercase tracking-wide transition-all",
                        activeTab === 'audit'
                            ? "bg-white text-zinc-900 shadow-sm"
                            : "text-zinc-400 hover:text-zinc-600"
                    )}
                >
                    <ShieldCheck className="h-4 w-4" />
                    Registros de Auditoria
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 ml-1">{auditLogs.length}</Badge>
                </button>
                <button
                    onClick={() => setActiveTab('access')}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md text-xs font-bold uppercase tracking-wide transition-all",
                        activeTab === 'access'
                            ? "bg-white text-zinc-900 shadow-sm"
                            : "text-zinc-400 hover:text-zinc-600"
                    )}
                >
                    <Eye className="h-4 w-4" />
                    Registros de Acesso
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 ml-1">{accessLogs.length}</Badge>
                </button>
            </div>

            {/* AUDIT LOGS */}
            {activeTab === 'audit' && (
                <Card className="bg-white border-zinc-200 shadow-sm overflow-hidden">
                    <CardHeader className="border-b border-zinc-50 bg-zinc-50/50">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-zinc-500" />
                            Histórico de Modificações
                        </CardTitle>
                        <CardDescription className="text-xs">Criação, edição e exclusão de dados em todas as organizações.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50 border-zinc-100">
                                    <TableHead className="w-[180px] text-[10px] font-black uppercase text-zinc-400">Data/Hora</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-zinc-400">Clínica</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-zinc-400">Usuário</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-zinc-400">Ação</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-zinc-400">Recurso</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-zinc-400 min-w-[250px]">Detalhes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {auditLogs.map((log: any) => {
                                    const { label, color } = getActionLabel(log.action)
                                    return (
                                        <TableRow key={log.id} className="hover:bg-zinc-50/30 transition-colors border-zinc-100">
                                            <TableCell className="font-mono text-[11px] text-zinc-500">
                                                {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-3 w-3 text-zinc-400" />
                                                    <span className="text-xs font-bold text-zinc-700">
                                                        {log.organization?.name || <span className="text-zinc-300 italic">Sem vínculo</span>}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-medium text-zinc-900">{log.users?.full_name || 'IA / Sistema'}</span>
                                                    <span className="text-[10px] text-zinc-400 font-mono tracking-tighter truncate max-w-[120px]">{log.users?.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={cn(
                                                    "w-fit text-[9px] font-black uppercase tracking-wide px-2 py-0.5 border-none whitespace-nowrap",
                                                    color
                                                )}>
                                                    {label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-[11px] font-bold text-zinc-600">
                                                    {getTableLabel(log.table_name || log.resource)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-[11px] text-zinc-500 max-w-[300px]">
                                                {getHumanDetails(log)}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                                {auditLogs.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12">
                                            <div className="flex flex-col items-center gap-2 opacity-40">
                                                <ShieldCheck size={40} className="text-emerald-400" />
                                                <p className="text-sm font-bold uppercase tracking-widest">Nenhuma modificação registrada</p>
                                                <p className="text-xs text-zinc-400">Dados íntegros — sem criação, edição ou exclusão.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* ACCESS LOGS */}
            {activeTab === 'access' && (
                <Card className="bg-white border-zinc-200 shadow-sm overflow-hidden">
                    <CardHeader className="border-b border-sky-50 bg-sky-50/50">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Eye className="h-4 w-4 text-sky-500" />
                            Histórico de Acessos
                        </CardTitle>
                        <CardDescription className="text-xs">Visualizações de prontuários e dados sensíveis em todas as organizações.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-sky-50/30 hover:bg-sky-50/30 border-zinc-100">
                                    <TableHead className="w-[180px] text-[10px] font-black uppercase text-zinc-400">Data/Hora</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-zinc-400">Clínica</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-zinc-400">Usuário</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-zinc-400">Tipo de Acesso</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-zinc-400">Recurso</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-zinc-400 text-right">IP</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {accessLogs.map((log: any) => (
                                    <TableRow key={log.id} className="hover:bg-sky-50/20 transition-colors border-zinc-100">
                                        <TableCell className="font-mono text-[11px] text-zinc-500">
                                            {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-3 w-3 text-zinc-400" />
                                                <span className="text-xs font-bold text-zinc-700">
                                                    {log.organization?.name || <span className="text-zinc-300 italic">Sem vínculo</span>}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-medium text-zinc-900">{log.users?.full_name || 'Sistema'}</span>
                                                <span className="text-[10px] text-zinc-400 font-mono tracking-tighter truncate max-w-[120px]">{log.users?.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-[9px] font-black bg-sky-50 text-sky-700 border-none whitespace-nowrap px-2 py-0.5">
                                                {log.action === 'VIEW_PATIENT' ? 'Visualizou Prontuário' : log.action}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-[11px] font-bold text-zinc-600">
                                                {getTableLabel(log.resource_type)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-[10px] text-zinc-400">
                                            {log.ip_address === '::1' || log.ip_address === '127.0.0.1' || log.ip_address === 'unknown'
                                                ? <span className="text-amber-500" title="Localhost">🖥️ Local</span>
                                                : log.ip_address || '—'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {accessLogs.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12">
                                            <div className="flex flex-col items-center gap-2 opacity-40">
                                                <Eye size={40} className="text-sky-300" />
                                                <p className="text-sm font-bold uppercase tracking-widest">Nenhum acesso registrado</p>
                                                <p className="text-xs text-zinc-400">Nenhum prontuário foi visualizado.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </>
    )
}
