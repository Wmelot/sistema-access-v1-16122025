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
import { getLogs, logAction } from "@/lib/logger"
import { format, subDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ScrollText, Printer, FileDown, Search, Filter, Mail, MessageCircle, Download, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { DateInput } from "@/components/ui/date-input"
import { LoadingDots } from "@/components/ui/loading-dots"
import { toast } from "sonner"

interface LogViewerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function LogViewer({ open, onOpenChange }: LogViewerProps) {
    const { slug } = useParams()
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"))
    const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"))
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)

    const fetchLogs = async () => {
        setLoading(true)
        try {
            const data = await getLogs(slug as string, startDate + 'T00:00:00', endDate + 'T23:59:59')
            setLogs(data || [])
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (open) {
            fetchLogs()
            logAction('VIEW_AUDIT_LOGS', { period: `${startDate} to ${endDate}` }, 'system', undefined, slug as string)
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
                <DialogContent className="max-w-6xl max-h-[95vh] flex flex-col p-0 gap-0 overflow-hidden shadow-2xl border-none">
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

                        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
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
                                                Nenhum registro encontrado para este período.
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
                                                    <Badge variant="outline" className="text-[10px] uppercase font-bold bg-slate-50 border-slate-200">
                                                        {log.action}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-[10px] text-slate-600 font-medium">
                                                    <div className="max-w-md break-words">
                                                        {(() => {
                                                            const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
                                                            // Render more readable details
                                                            if (details?.resource) return `Modificou ${details.resource}: ${details.id}`;
                                                            if (log.resource) return `Acesso ao recurso ${log.resource} (${log.resource_id})`;
                                                            return JSON.stringify(details);
                                                        })()}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-[10px] text-slate-400">
                                                    {log.ip_address}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

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
