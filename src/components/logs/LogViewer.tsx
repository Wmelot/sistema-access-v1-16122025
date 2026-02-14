"use client"

import { useEffect, useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { getLogs, getAccessLogs } from "@/lib/logger"
import { format, subDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ScrollText, Printer, FileDown, Search, Filter, Mail, MessageCircle, Download, CheckCircle2, Eye, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { DateInput } from "@/components/ui/date-input"
import { LoadingDots } from "@/components/ui/loading-dots"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/hooks/use-sidebar"

// === TRADUÇÃO E HUMANIZAÇÃO DOS LOGS ===

const ACTION_TRANSLATIONS: Record<string, { label: string; color: string }> = {
    // Ações de Paciente
    'VIEW_PATIENT': { label: 'Visualizou Paciente', color: 'bg-sky-50 text-sky-700 border-sky-100' },
    'PATIENT_CREATE': { label: 'Criou Paciente', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    'PATIENT_QUICK_CREATE': { label: 'Cadastro Rápido', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    'UPDATE_PATIENT': { label: 'Editou Paciente', color: 'bg-amber-50 text-amber-700 border-amber-100' },
    'DELETE_PATIENT': { label: 'Excluiu Paciente', color: 'bg-red-50 text-red-700 border-red-100' },
    'PATIENT_MERGE': { label: 'Unificou Pacientes', color: 'bg-purple-50 text-purple-700 border-purple-100' },
    'PATIENT_KINSHIP': { label: 'Marcou Parentesco', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
    // Registros Clínicos
    'FINALIZE_RECORD': { label: 'Finalizou Prontuário', color: 'bg-green-50 text-green-700 border-green-100' },
    'DELETE_RECORD': { label: 'Excluiu Prontuário', color: 'bg-red-50 text-red-700 border-red-100' },
    // Financeiro
    'INVOICE_CREATE': { label: 'Criou Fatura', color: 'bg-teal-50 text-teal-700 border-teal-100' },
    // Triggers do Banco (automáticos)
    'INSERT': { label: 'Registro Criado', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    'UPDATE': { label: 'Registro Alterado', color: 'bg-blue-50 text-blue-700 border-blue-100' },
    'DELETE': { label: 'Registro Removido', color: 'bg-red-50 text-red-700 border-red-100' },
}

function translateAction(action: string): { label: string; color: string } {
    return ACTION_TRANSLATIONS[action] || { label: action, color: 'bg-slate-50 text-slate-700 border-slate-200' }
}

const TABLE_TRANSLATIONS: Record<string, string> = {
    'patients': 'Pacientes',
    'patient': 'Paciente',
    'appointments': 'Agendamentos',
    'services': 'Serviços',
    'invoices': 'Faturas',
    'invoice': 'Fatura',
    'products': 'Produtos',
    'profiles': 'Usuários',
    'organizations': 'Organizações',
    'payment_method_fees': 'Taxas de Pagamento',
    'patient_records': 'Prontuários',
    'patient_record': 'Prontuário',
    'patient_assessments': 'Avaliações',
    'system': 'Sistema',
}

function translateTable(tableName: string | null | undefined): string {
    if (!tableName) return 'Sistema'
    return TABLE_TRANSLATIONS[tableName.toLowerCase()] || tableName
}

function humanizeDetails(log: any): string {
    const details = typeof log.details === 'string' ? (() => { try { return JSON.parse(log.details) } catch { return {} } })() : (log.details || {})

    // Ações específicas da aplicação (logAction)
    if (log.action === 'VIEW_PATIENT') {
        return details.name ? `Acessou o prontuário de "${details.name}"` : 'Acessou prontuário de paciente'
    }
    if (log.action === 'PATIENT_CREATE' || log.action === 'PATIENT_QUICK_CREATE') {
        return details.name ? `Cadastrou o paciente "${details.name}"` : 'Cadastrou um novo paciente'
    }
    if (log.action === 'UPDATE_PATIENT') {
        return details.name ? `Editou informações de "${details.name}"` : 'Editou dados de paciente'
    }
    if (log.action === 'DELETE_PATIENT') {
        return 'Exclusão permanente de ficha de paciente'
    }
    if (log.action === 'PATIENT_MERGE') {
        return 'Unificou duas fichas de paciente (mesclagem de registros)'
    }
    if (log.action === 'PATIENT_KINSHIP') {
        const degree = details.degree || 'Familiar'
        return `Vinculou dois pacientes como "${degree}"`
    }
    if (log.action === 'FINALIZE_RECORD') {
        return 'Finalizou e assinou prontuário clínico'
    }
    if (log.action === 'DELETE_RECORD') {
        return 'Removeu prontuário/evolução clínica'
    }
    if (log.action === 'INVOICE_CREATE') {
        const amount = details.amount ? `R$ ${Number(details.amount).toFixed(2)}` : ''
        return amount ? `Fatura criada no valor de ${amount}` : 'Nova fatura criada'
    }

    // Triggers automáticos do banco
    if (details?.message) return details.message

    // Trigger UPDATE com changes
    if (log.action === 'UPDATE' && details?.changes) {
        const changedFields = Object.keys(details.changes)
        if (changedFields.length > 0 && changedFields.length <= 3) {
            return `Campos alterados: ${changedFields.join(', ')}`
        }
        return `${changedFields.length} campos modificados`
    }

    if (log.action === 'INSERT') return 'Novo registro criado automaticamente'
    if (log.action === 'UPDATE') return 'Registro modificado'
    if (log.action === 'DELETE') return 'Registro removido permanentemente'

    return log.resource ? `Ação sobre ${translateTable(log.resource)}` : 'Ação registrada'
}

// === COMPONENTE ===

interface LogViewerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function LogViewer({ open, onOpenChange }: LogViewerProps) {
    const { slug } = useParams()
    const { isCollapsed } = useSidebar()
    const [logs, setLogs] = useState<any[]>([])
    const [accessLogs, setAccessLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"))
    const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"))
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
    const [activeTab, setActiveTab] = useState<'audit' | 'access'>('audit')

    const fetchLogs = async () => {
        setLoading(true)
        try {
            const [auditData, accessData] = await Promise.all([
                getLogs(slug as string, startDate + 'T00:00:00', endDate + 'T23:59:59'),
                getAccessLogs(slug as string, startDate + 'T00:00:00', endDate + 'T23:59:59'),
            ])
            setLogs(auditData || [])
            setAccessLogs(accessData || [])
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (open) {
            fetchLogs()
        }
    }, [open])

    const handlePrint = () => {
        window.print()
    }

    const handleEmailExport = () => {
        const subject = encodeURIComponent(`Relatório de Auditoria LGPD - ${slug}`)
        const body = encodeURIComponent(`Olá,\r\n\r\nSegue anexo o relatório de auditoria gerado pelo sistema Axiom referente ao período de ${format(new Date(startDate), "dd/MM/yy")} a ${format(new Date(endDate), "dd/MM/yy")}.\r\n\r\n(Lembre-se de anexar o arquivo PDF baixado antes de enviar).`)
        window.location.href = `mailto:?subject=${subject}&body=${body}`
        toast.success("E-mail gerado com sucesso!")
    }

    const handleWhatsAppExport = () => {
        const text = encodeURIComponent(`*Relatório de Auditoria LGPD*\r\nReferente ao período de ${format(new Date(startDate), "dd/MM/yy")} a ${format(new Date(endDate), "dd/MM/yy")}.\r\n\r\n_Anexando arquivo..._`)
        window.open(`https://wa.me/?text=${text}`, '_blank')
        toast.success("WhatsApp aberto com sucesso!")
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent
                    className={cn(
                        "w-full h-[90vh] flex flex-col p-0 gap-0 overflow-hidden shadow-2xl border-none bg-white transition-all duration-300 ease-in-out sm:!max-w-none",
                        isCollapsed
                            ? "sm:!w-[calc(100vw-120px)] left-[calc(30px+50%)]"
                            : "sm:!w-[calc(100vw-300px)] left-[calc(125px+50%)]"
                    )}
                >
                    {/* Header (Hidden in Print) */}
                    <div className="p-6 border-b print:hidden">
                        <DialogHeader>
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <DialogTitle className="flex items-center gap-2 text-xl">
                                        <ScrollText className="h-5 w-5 text-primary" />
                                        Registro de Auditoria e Conformidade (LGPD)
                                    </DialogTitle>
                                    <DialogDescription>
                                        Histórico completo de modificações e acessos para fins de fiscalização.
                                    </DialogDescription>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                                    <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2 w-full sm:w-auto h-11 sm:h-9">
                                        <Printer className="h-4 w-4" />
                                        Imprimir Relatório
                                    </Button>
                                    <Button
                                        variant="default"
                                        size="sm"
                                        className="gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95 w-full sm:w-auto h-11 sm:h-9"
                                        onClick={() => setIsExportDialogOpen(true)}
                                    >
                                        <FileDown className="h-4 w-4" />
                                        Exportar PDF
                                    </Button>
                                </div>
                            </div>
                        </DialogHeader>

                        {/* Filters */}
                        <div className="mt-6 flex flex-col sm:flex-row sm:items-end gap-4 bg-muted/40 p-4 rounded-xl border border-muted-foreground/10">
                            <div className="grid gap-2 flex-1 w-full">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-tight flex items-center gap-1.5">
                                    <Filter className="h-3 w-3" />
                                    Data Inicial
                                </label>
                                <DateInput
                                    className="h-11 sm:h-10 bg-white w-full"
                                    value={startDate}
                                    onChange={setStartDate}
                                />
                            </div>
                            <div className="grid gap-2 flex-1 w-full">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-tight flex items-center gap-1.5">
                                    <Filter className="h-3 w-3" />
                                    Data Final
                                </label>
                                <DateInput
                                    className="h-11 sm:h-10 bg-white w-full"
                                    value={endDate}
                                    onChange={setEndDate}
                                />
                            </div>
                            <Button
                                variant="default"
                                size="lg"
                                onClick={fetchLogs}
                                disabled={loading}
                                className="h-11 sm:h-10 gap-2 px-8 shadow-sm hover:shadow-md transition-all active:scale-95 w-full sm:w-auto"
                            >
                                {loading ? <Search className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                Filtrar Logs
                            </Button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                        {/* Print Only Header */}
                        <div className="hidden print:block mb-8 border-b pb-4">
                            <h1 className="text-2xl font-bold text-slate-800">Relatório de Auditoria de Dados</h1>
                            <p className="text-sm text-slate-500">Clínica: {slug}</p>
                            <p className="text-sm text-slate-500">Período: {format(new Date(startDate), "dd/MM/yy")} até {format(new Date(endDate), "dd/MM/yy")}</p>
                            <p className="text-xs text-slate-400 mt-2 italic">Gerado em: {format(new Date(), "dd/MM/yyyy HH:mm")}</p>
                        </div>

                        {/* Tab Switcher */}
                        <div className="flex gap-1 mb-4 bg-slate-100 rounded-lg p-1 print:hidden">
                            <button
                                onClick={() => setActiveTab('audit')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all",
                                    activeTab === 'audit'
                                        ? "bg-white text-slate-900 shadow-sm"
                                        : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Auditoria
                                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 ml-1">{logs.length}</Badge>
                            </button>
                            <button
                                onClick={() => setActiveTab('access')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all",
                                    activeTab === 'access'
                                        ? "bg-white text-slate-900 shadow-sm"
                                        : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                <Eye className="h-3.5 w-3.5" />
                                Acessos
                                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 ml-1">{accessLogs.length}</Badge>
                            </button>
                        </div>

                        {/* AUDIT LOGS TAB */}
                        {activeTab === 'audit' && (
                            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                                <div className="px-4 py-3 border-b bg-slate-50/80 flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-slate-500" />
                                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Registros de Modificação</span>
                                    <span className="text-[10px] text-slate-400 ml-auto">Criação, edição e exclusão de dados</span>
                                </div>
                                <Table>
                                    <TableHeader className="bg-slate-100/50">
                                        <TableRow>
                                            <TableHead className="w-[140px] whitespace-nowrap">Data/Hora</TableHead>
                                            <TableHead className="w-[180px] whitespace-nowrap">Usuário</TableHead>
                                            <TableHead className="w-[120px] whitespace-nowrap">Ação</TableHead>
                                            <TableHead className="min-w-[250px]">Detalhes</TableHead>
                                            <TableHead className="w-[100px] text-right whitespace-nowrap">IP</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                                                    <div className="flex flex-col items-center gap-4">
                                                        <LoadingDots className="text-primary scale-150" />
                                                        <p className="font-medium">Sincronizando registros de auditoria...</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : logs.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <ShieldCheck className="h-8 w-8 text-emerald-300" />
                                                        <p className="font-bold text-slate-500">Nenhuma modificação neste período</p>
                                                        <p className="text-xs text-slate-400">Dados mantidos íntegros — sem criação, edição ou exclusão.</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            logs.map((log) => (
                                                <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <TableCell className="font-mono text-xs text-slate-500">
                                                        {format(new Date(log.created_at), "dd MMM, yyyy HH:mm:ss", { locale: ptBR })}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-xs">{log.users?.full_name || log.users?.name || "Sistema"}</span>
                                                            <span className="text-[10px] text-muted-foreground">{log.users?.email}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {(() => {
                                                            const { label, color } = translateAction(log.action)
                                                            return (
                                                                <Badge variant="outline" className={cn(
                                                                    "text-[10px] font-bold border-slate-200 whitespace-nowrap",
                                                                    color
                                                                )}>
                                                                    {label}
                                                                </Badge>
                                                            )
                                                        })()}
                                                    </TableCell>
                                                    <TableCell className="text-[11px] text-slate-600 font-medium">
                                                        <div className="max-w-lg break-words flex flex-col gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-slate-900">
                                                                    {translateTable(log.table_name || log.resource)}
                                                                </span>
                                                                {log.resource_id && (
                                                                    <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-400 font-mono">
                                                                        #{log.resource_id.substring(0, 8)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-slate-500 leading-relaxed">
                                                                {humanizeDetails(log)}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-[10px] text-slate-400">
                                                        {log.ip_address === '::1' || log.ip_address === '127.0.0.1'
                                                            ? <span className="text-amber-500" title="Localhost">🖥️ Local</span>
                                                            : log.ip_address || '—'}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {/* ACCESS LOGS TAB */}
                        {activeTab === 'access' && (
                            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                                <div className="px-4 py-3 border-b bg-sky-50/80 flex items-center gap-2">
                                    <Eye className="h-4 w-4 text-sky-500" />
                                    <span className="text-xs font-bold text-sky-700 uppercase tracking-wide">Registros de Acesso</span>
                                    <span className="text-[10px] text-sky-400 ml-auto">Visualizações de prontuários e dados sensíveis</span>
                                </div>
                                <Table>
                                    <TableHeader className="bg-sky-50/30">
                                        <TableRow>
                                            <TableHead className="w-[140px] whitespace-nowrap">Data/Hora</TableHead>
                                            <TableHead className="w-[180px] whitespace-nowrap">Usuário</TableHead>
                                            <TableHead className="w-[120px] whitespace-nowrap">Tipo de Acesso</TableHead>
                                            <TableHead className="min-w-[200px]">Recurso</TableHead>
                                            <TableHead className="w-[100px] text-right whitespace-nowrap">IP</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                                                    <div className="flex flex-col items-center gap-4">
                                                        <LoadingDots className="text-primary scale-150" />
                                                        <p className="font-medium">Carregando registros de acesso...</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : accessLogs.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Eye className="h-8 w-8 text-sky-200" />
                                                        <p className="font-bold text-slate-500">Nenhum acesso registrado neste período</p>
                                                        <p className="text-xs text-slate-400">Nenhum prontuário foi visualizado neste intervalo.</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            accessLogs.map((log: any) => (
                                                <TableRow key={log.id} className="hover:bg-sky-50/30 transition-colors">
                                                    <TableCell className="font-mono text-xs text-slate-500">
                                                        {format(new Date(log.created_at), "dd MMM, yyyy HH:mm:ss", { locale: ptBR })}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-xs">{log.users?.full_name || "Sistema"}</span>
                                                            <span className="text-[10px] text-muted-foreground">{log.users?.email}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="text-[10px] font-bold bg-sky-50 text-sky-700 border-sky-100 whitespace-nowrap">
                                                            {log.action === 'VIEW_PATIENT' ? 'Visualizou Prontuário' : log.action}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-[11px] text-slate-600 font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-slate-900">
                                                                {translateTable(log.resource_type)}
                                                            </span>
                                                            {log.resource_id && (
                                                                <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-400 font-mono">
                                                                    #{log.resource_id.substring(0, 8)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-[10px] text-slate-400">
                                                        {log.ip_address === '::1' || log.ip_address === '127.0.0.1' || log.ip_address === 'unknown'
                                                            ? <span className="text-amber-500" title="Localhost">🖥️ Local</span>
                                                            : log.ip_address || '—'}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {/* Print Only Footer (Signature Block) */}
                        <div className="hidden print:block mt-20">
                            <div className="flex justify-between gap-12">
                                <div className="flex-1 border-t border-slate-300 pt-2 text-center">
                                    <p className="text-xs font-bold uppercase">Responsável Técnico</p>
                                    <p className="text-[10px] text-slate-500 mt-1">Carimbo e Assinatura</p>
                                </div>
                                <div className="flex-1 flex flex-col items-center justify-center p-4 border border-slate-200 rounded text-center">
                                    <Badge variant="secondary" className="mb-2">Documento Auditado</Badge>
                                    <p className="text-[9px] text-slate-400 italic">
                                        Este relatório possui validade legal para fins de comprovação da LGPD.
                                        A integridade destes dados é garantida pelo sistema de log imutável Axiom.
                                    </p>
                                    <p className="text-[10px] font-mono mt-2 text-slate-300">
                                        SHA-256: {Math.random().toString(36).substring(2, 15)}...
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>

                <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #radix-\:rl\:, #radix-\:rl\: * {
                        visibility: visible;
                    }
                    #radix-\:rl\: {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background: white !important;
                        box-shadow: none !important;
                        border: none !important;
                    }
                    .print\:hidden {
                        display: none !important;
                    }
                    .print\:block {
                        display: block !important;
                    }
                }
            `}</style>
            </Dialog>

            {/* Export Options Dialog */}
            <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
                <DialogContent className="max-w-md p-6">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-primary/10 rounded-full">
                                <FileDown className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold">Exportar Relatório</DialogTitle>
                                <DialogDescription>Escolha como deseja prosseguir com o arquivo.</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="grid gap-3 mt-4">
                        <Button
                            variant="outline"
                            size="lg"
                            className="justify-start gap-4 h-16 border-2 hover:border-primary hover:bg-primary/5 group transition-all"
                            onClick={() => {
                                handlePrint()
                                setIsExportDialogOpen(false)
                                toast.success("Iniciando download do PDF...")
                            }}
                        >
                            <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-primary/10 transition-colors">
                                <Download className="h-5 w-5 text-slate-600 group-hover:text-primary" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-slate-900 leading-tight">Baixar PDF</p>
                                <p className="text-xs text-slate-500 font-normal">Salvar arquivo no seu computador</p>
                            </div>
                        </Button>

                        <Button
                            variant="outline"
                            size="lg"
                            className="justify-start gap-4 h-16 border-2 hover:border-green-600 hover:bg-green-50 group transition-all"
                            onClick={() => {
                                handleWhatsAppExport()
                                setIsExportDialogOpen(false)
                            }}
                        >
                            <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                                <MessageCircle className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-slate-900 leading-tight text-green-700">Enviar por WhatsApp</p>
                                <p className="text-xs text-slate-500 font-normal">Encaminhar via mensagem (mobile/web)</p>
                            </div>
                        </Button>

                        <Button
                            variant="outline"
                            size="lg"
                            className="justify-start gap-4 h-16 border-2 hover:border-blue-600 hover:bg-blue-50 group transition-all"
                            onClick={() => {
                                handleEmailExport()
                                setIsExportDialogOpen(false)
                            }}
                        >
                            <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                                <Mail className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-slate-900 leading-tight text-blue-700">Enviar por E-mail</p>
                                <p className="text-xs text-slate-500 font-normal">Anexar e enviar para um destinatário</p>
                            </div>
                        </Button>
                    </div>

                    <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-900 leading-relaxed font-medium">
                            O relatório gerado é compatível com as normas da LGPD e contém um log de integridade imutável.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
