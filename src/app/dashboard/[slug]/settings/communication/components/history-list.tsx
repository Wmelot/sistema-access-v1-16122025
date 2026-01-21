"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CheckCheck, XCircle, Clock, Check } from "lucide-react"

interface MessageLog {
    id: string
    phone: string
    content: string
    status: string
    created_at: string
    template?: {
        title: string
    }
}

export function HistoryList({ logs }: { logs: MessageLog[] }) {
    if (!logs.length) {
        return (
            <div className="text-center p-8 border rounded-lg bg-muted/20">
                <p className="text-muted-foreground">Nenhum disparo realizado ainda.</p>
            </div>
        )
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'sent':
                return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Check className="w-3 h-3 mr-1" /> Enviado</Badge>
            case 'delivered':
            case 'read':
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCheck className="w-3 h-3 mr-1" /> Entregue</Badge>
            case 'failed':
                return <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" /> Falha</Badge>
            default:
                return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pendente</Badge>
        }
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Destinatário</TableHead>
                        <TableHead>Mensagem</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.map((log) => (
                        <TableRow key={log.id}>
                            <TableCell className="font-medium text-xs text-muted-foreground">
                                {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </TableCell>
                            <TableCell>{log.phone}</TableCell>
                            <TableCell className="max-w-[300px] truncate text-sm" title={log.content}>
                                {log.template?.title ? (
                                    <span className="font-semibold block text-xs mb-1">{log.template.title}</span>
                                ) : null}
                                <span className="text-muted-foreground">{log.content}</span>
                            </TableCell>
                            <TableCell>{getStatusBadge(log.status)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
