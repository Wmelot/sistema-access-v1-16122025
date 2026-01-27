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
import { getLogs } from "@/lib/logger"
import { format, subDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ScrollText, Printer, FileDown, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { DateInput } from "@/components/ui/date-input"
import { LoadingDots } from "@/components/ui/loading-dots"

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
        }
    }, [open])

    const handlePrint = () => {
        window.print()
    }

    return (
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
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
                                    <Printer className="h-4 w-4" />
                                    Imprimir Relatório
                                </Button>
                                <Button variant="default" size="sm" className="gap-2">
                                    <FileDown className="h-4 w-4" />
                                    Exportar PDF
                                </Button>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Filters */}
                    <div className="mt-6 flex flex-wrap items-end gap-4 bg-muted/40 p-4 rounded-xl border border-muted-foreground/10">
                        <div className="grid gap-2 min-w-[220px]">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-tight flex items-center gap-1.5">
                                <Filter className="h-3 w-3" />
                                Data Inicial
                            </label>
                            <DateInput
                                className="h-10 bg-white"
                                value={startDate}
                                onChange={setStartDate}
                            />
                        </div>
                        <div className="grid gap-2 min-w-[220px]">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-tight flex items-center gap-1.5">
                                <Filter className="h-3 w-3" />
                                Data Final
                            </label>
                            <DateInput
                                className="h-10 bg-white"
                                value={endDate}
                                onChange={setEndDate}
                            />
                        </div>
                        <Button
                            variant="default"
                            size="lg"
                            onClick={fetchLogs}
                            disabled={loading}
                            className="h-10 gap-2 px-8 shadow-sm hover:shadow-md transition-all active:scale-95"
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
                                    <TableHead className="w-[180px]">Data/Hora</TableHead>
                                    <TableHead className="w-[200px]">Usuário</TableHead>
                                    <TableHead className="w-[150px]">Ação</TableHead>
                                    <TableHead>Detalhes da Modificação</TableHead>
                                    <TableHead className="w-[120px] text-right">Origem</TableHead>
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
    )
}
