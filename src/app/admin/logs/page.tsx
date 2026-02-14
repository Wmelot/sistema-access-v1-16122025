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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Activity, ShieldCheck, Building2, User } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function AdminLogsPage(props: {
    searchParams: Promise<{ start?: string; end?: string }>
}) {
    const searchParams = await props.searchParams
    const logs = await getLogs(undefined, searchParams.start, searchParams.end, true)

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black tracking-tight text-zinc-900 flex items-center gap-3">
                    <Activity className="text-zinc-600" />
                    Logs do Sistema (Master)
                </h1>
                <p className="text-zinc-500 font-medium">Auditoria global de todas as clínicas e ações administrativas.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-white border-zinc-200 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Total de Eventos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-zinc-900">{logs?.length || 0}</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-white border-zinc-200 shadow-sm overflow-hidden">
                <CardHeader className="border-b border-zinc-50 bg-zinc-50/50">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-zinc-500" />
                        Histórico Global de Auditoria
                    </CardTitle>
                    <CardDescription className="text-xs">Exibindo os últimos 200 registros de todas as organizações.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50 border-zinc-100">
                                <TableHead className="w-[180px] text-[10px] font-black uppercase text-zinc-400">Data/Hora</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-zinc-400">Clínica</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-zinc-400">Usuário</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-zinc-400">Ação / Recurso</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-zinc-400">Detalhes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs?.map((log: any) => (
                                <TableRow key={log.id} className="hover:bg-zinc-50/30 transition-colors border-zinc-100">
                                    <TableCell className="font-mono text-[11px] text-zinc-500">
                                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-3 w-3 text-zinc-400" />
                                            <span className="text-xs font-bold text-zinc-700">{log.organization?.name || 'Sistema central'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-medium text-zinc-900">{log.users?.full_name || 'IA / Sistema'}</span>
                                            <span className="text-[10px] text-zinc-400 font-mono tracking-tighter truncate max-w-[120px]">{log.users?.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1.5">
                                            <Badge variant="outline" className={cn(
                                                "w-fit text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 border-none",
                                                log.action?.includes('DELETE') ? 'bg-red-50 text-red-600' :
                                                    log.action?.includes('CREATE') ? 'bg-emerald-50 text-emerald-600' :
                                                        log.action?.includes('UPDATE') ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'
                                            )}>
                                                {log.action}
                                            </Badge>
                                            <div className="flex items-center gap-1">
                                                <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">Recurso:</span>
                                                <span className="text-[10px] font-bold text-zinc-500 uppercase">{log.resource || 'Generic'}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-[11px] text-zinc-500 max-w-[300px] truncate font-mono" title={JSON.stringify(log.details, null, 2)}>
                                        {JSON.stringify(log.details)}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(!logs || logs.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12">
                                        <div className="flex flex-col items-center gap-2 opacity-20">
                                            <Activity size={40} />
                                            <p className="text-sm font-bold uppercase tracking-widest">Nenhum evento registrado</p>
                                        </div>
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

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ')
}
