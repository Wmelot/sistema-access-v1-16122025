import { getLogs, getAccessLogs } from "@/lib/logger"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, ShieldCheck, Eye } from "lucide-react"
import { MasterLogsTabs } from "./components/master-logs-tabs"

export const dynamic = 'force-dynamic'

export default async function AdminLogsPage(props: {
    searchParams: Promise<{ start?: string; end?: string }>
}) {
    const searchParams = await props.searchParams
    const [auditLogs, accessLogs] = await Promise.all([
        getLogs(undefined, searchParams.start, searchParams.end, true),
        getAccessLogs(undefined, searchParams.start, searchParams.end, true),
    ])

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black tracking-tight text-zinc-900 flex items-center gap-3">
                    <Activity className="text-zinc-600" />
                    Logs do Sistema (Master)
                </h1>
                <p className="text-zinc-500 font-medium">Auditoria global de todas as clínicas e ações administrativas.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-white border-zinc-200 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                            <ShieldCheck className="h-3 w-3" /> Modificações
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-zinc-900">{auditLogs?.length || 0}</div>
                        <p className="text-[10px] text-zinc-400">Criação, edição e exclusão</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border-zinc-200 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Eye className="h-3 w-3" /> Acessos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-sky-600">{accessLogs?.length || 0}</div>
                        <p className="text-[10px] text-zinc-400">Visualizações de prontuários</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border-zinc-200 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Activity className="h-3 w-3" /> Total
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-zinc-900">{(auditLogs?.length || 0) + (accessLogs?.length || 0)}</div>
                        <p className="text-[10px] text-zinc-400">Todos os eventos combinados</p>
                    </CardContent>
                </Card>
            </div>

            <MasterLogsTabs
                auditLogs={auditLogs || []}
                accessLogs={accessLogs || []}
            />
        </div>
    )
}
