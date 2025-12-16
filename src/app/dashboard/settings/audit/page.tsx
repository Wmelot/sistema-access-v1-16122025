import { createClient } from "@/lib/supabase/server"
import { getLogs } from "@/lib/logger"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = 'force-dynamic'

export default async function AuditPage() {
    const logs = await getLogs()

    return (
        <div className="container py-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Trilha de Auditoria (LGPD)</h1>
                <p className="text-muted-foreground">Registro histórico de acessos e alterações no sistema.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Histórico de Eventos</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[180px]">Data/Hora</TableHead>
                                <TableHead>Usuário</TableHead>
                                <TableHead>Ação</TableHead>
                                <TableHead>Alvo (Entidade)</TableHead>
                                <TableHead>Detalhes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs?.map((log: any) => (
                                <TableRow key={log.id}>
                                    <TableCell className="font-mono text-xs">
                                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                                    </TableCell>
                                    <TableCell>{log.users?.email || 'Sistema'}</TableCell>
                                    <TableCell>
                                        <Badge variant={log.action.includes('DELETE') ? 'destructive' : 'outline'}>
                                            {log.action}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-xs uppercase">{log.entity || '-'}</span>
                                            <span className="text-[10px] text-muted-foreground font-mono">{log.entity_id?.slice(0, 8)}...</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground max-w-[300px] truncate" title={JSON.stringify(log.details, null, 2)}>
                                        {JSON.stringify(log.details)}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(!logs || logs.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        Nenhum registro encontrado.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
