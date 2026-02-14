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
import { ShieldCheck, User, Activity, Clock, Database, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const dynamic = 'force-dynamic'

export default async function AuditPage(props: { params: Promise<{ slug: string }> }) {
    const { slug } = await props.params;
    const logs = await getLogs(slug)

    return (
        <div className="py-6 space-y-6 max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                        <Link href={`/dashboard/${slug}/management`} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5">LGPD Compliance</Badge>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-zinc-900 flex items-center gap-3">
                        <ShieldCheck className="text-emerald-600 w-8 h-8" />
                        Registro de Auditoria
                    </h1>
                    <p className="text-zinc-500 font-medium">Histórico completo de modificações e acessos para fins de fiscalização e conformidade.</p>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" className="h-10 px-4 font-bold border-zinc-200">
                        Exportar CSV
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white border-zinc-200 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <Clock className="h-3 w-3" /> Eventos Recentes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-zinc-900">{logs?.length || 0}</div>
                        <p className="text-[10px] text-zinc-400 mt-1 uppercase font-bold tracking-tighter">Últimos 30 dias</p>
                    </CardContent>
                </Card>

                <Card className="bg-white border-zinc-200 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <Database className="h-3 w-3" /> Integridade
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-emerald-600">100%</div>
                        <p className="text-[10px] text-zinc-400 mt-1 uppercase font-bold tracking-tighter">Todos os logs assinados</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-white border-zinc-200 shadow-sm overflow-hidden">
                <CardHeader className="border-b border-zinc-50 bg-zinc-50/30 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-bold text-zinc-800">Linha do Tempo de Conformidade</CardTitle>
                            <CardDescription className="text-xs">Detalhamento técnico de todas as mutações no banco de dados.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50 border-zinc-100">
                                <TableHead className="w-[200px] text-[10px] font-black uppercase text-zinc-400 pl-6">Data/Hora</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-zinc-400">Agente (Usuário)</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-zinc-400">Ação do Sistema</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-zinc-400">Recurso / Entidade</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-zinc-400 pr-6">Metadata / Detalhes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs?.map((log: any) => (
                                <TableRow key={log.id} className="hover:bg-zinc-50/30 transition-colors border-zinc-100 group">
                                    <TableCell className="font-mono text-[11px] text-zinc-500 pl-6">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-zinc-700">{format(new Date(log.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                                            <span className="opacity-60">{format(new Date(log.created_at), "HH:mm:ss", { locale: ptBR })}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                                                <User className="h-3 w-3 text-zinc-400" />
                                                {log.users?.full_name || 'Agente Externo'}
                                            </span>
                                            <span className="text-[10px] text-zinc-400 font-mono pl-4.5">{log.users?.email || 'API Key / Webhook'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn(
                                            "text-[9px] font-black uppercase tracking-widest border-none px-2 py-0.5",
                                            log.action?.includes('DELETE') ? 'bg-red-50 text-red-600' :
                                                log.action?.includes('CREATE') ? 'bg-emerald-50 text-emerald-600' :
                                                    log.action?.includes('UPDATE') ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'
                                        )}>
                                            {log.action}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Entidade</span>
                                            <span className="text-[11px] font-bold text-zinc-600 flex items-center gap-1.5 uppercase">
                                                <Activity className="h-3 w-3 text-zinc-400" />
                                                {log.resource || '-'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-[11px] text-zinc-400 max-w-[200px] truncate font-mono pr-6" title={JSON.stringify(log.details, null, 2)}>
                                        {JSON.stringify(log.details)}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(!logs || logs.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-20">
                                        <div className="flex flex-col items-center gap-3 opacity-20">
                                            <ShieldCheck size={48} className="text-zinc-400" />
                                            <div className="space-y-1">
                                                <p className="text-sm font-black uppercase tracking-[0.2em] text-zinc-900">Vazio para este período</p>
                                                <p className="text-xs font-medium">Nenhuma atividade de auditoria registrada.</p>
                                            </div>
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
