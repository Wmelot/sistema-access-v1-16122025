'use client'

import { useState, useEffect } from "react"
import { Activity, AlertCircle, CheckCircle2, RefreshCcw, Search, Trash2, Building2, Users, Calendar } from "lucide-react"
import { runGlobalDiagnostic, cleanupOrphanedData, cleanupClinicBrokenData } from "./actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"

export default function GlobalDiagnosticsPage() {
    const [report, setReport] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")

    async function handleRun() {
        setIsLoading(true)
        const res = await runGlobalDiagnostic()
        setIsLoading(false)
        if (res.error) toast.error(res.error)
        else setReport(res)
    }

    async function handleCleanup(type: 'patients' | 'appointments') {
        const confirmMsg = type === 'patients'
            ? "Isso removerá permanentemente todos os pacientes sem organização. Confirmar?"
            : "Isso removerá permanentemente agendamentos sem organização. Confirmar?"

        if (!confirm(confirmMsg)) return

        const res = await cleanupOrphanedData(type)
        if (res.success) {
            toast.success("Limpeza concluída!")
            handleRun()
        } else {
            toast.error(res.error)
        }
    }

    async function handleClinicCleanup(orgId: string, orgName: string) {
        if (!confirm(`Deseja limpar os agendamentos corrompidos da clínica ${orgName}?`)) return

        setIsLoading(true)
        const res = await cleanupClinicBrokenData(orgId)
        setIsLoading(false)

        if (res.success) {
            toast.success(`Limpeza concluída para ${orgName}!`)
            handleRun()
        } else {
            toast.error(res.error)
        }
    }

    useEffect(() => {
        handleRun()
    }, [])

    const filteredOrgs = report?.organizations?.filter((org: any) =>
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.slug.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6 container mx-auto py-8 max-w-6xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-3">
                        <Activity className="text-indigo-600" />
                        Diagnóstico Geral do Sistema
                    </h1>
                    <p className="text-zinc-500">Verificação de integridade e métricas em todas as clínicas.</p>
                </div>
                <Button onClick={handleRun} disabled={isLoading} variant="outline" className="gap-2">
                    <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Atualizar Auditoria
                </Button>
            </div>

            {report && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="border-red-100 bg-red-50/30">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold flex items-center justify-between">
                                Registros Órfãos (Sem Organização)
                                <AlertCircle className="w-4 h-4 text-red-500" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span>Pacientes Órfãos: <b>{report.globalIssues.orphanedPatients}</b></span>
                                {report.globalIssues.orphanedPatients > 0 && (
                                    <Button size="sm" variant="ghost" className="text-red-600 h-8 hover:bg-red-100" onClick={() => handleCleanup('patients')}>
                                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Limpar
                                    </Button>
                                )}
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span>Agendamentos Órfãos: <b>{report.globalIssues.orphanedAppointments}</b></span>
                                {report.globalIssues.orphanedAppointments > 0 && (
                                    <Button size="sm" variant="ghost" className="text-red-600 h-8 hover:bg-red-100" onClick={() => handleCleanup('appointments')}>
                                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Limpar
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-indigo-100 bg-indigo-50/30">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold flex items-center justify-between">
                                Resumo da Plataforma
                                <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-2 text-center py-2">
                                <div>
                                    <p className="text-2xl font-bold text-indigo-700">{report.organizations.length}</p>
                                    <p className="text-[10px] text-zinc-500 uppercase">Clínicas</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-zinc-700">
                                        {report.organizations.reduce((acc: number, o: any) => acc + o.metrics.professionals, 0)}
                                    </p>
                                    <p className="text-[10px] text-zinc-500 uppercase">Profissionais</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-zinc-700">
                                        {report.organizations.reduce((acc: number, o: any) => acc + o.metrics.patients, 0)}
                                    </p>
                                    <p className="text-[10px] text-zinc-500 uppercase">Pacientes</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between gap-4">
                        <CardTitle className="text-lg">Relatório por Clínica</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-400" />
                            <Input
                                placeholder="Filtrar por nome ou slug..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-zinc-100">
                        {filteredOrgs?.map((org: any) => (
                            <div key={org.orgId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50 transition-colors">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-zinc-900">{org.name}</h3>
                                        <Badge variant="outline" className="text-[10px] h-4 px-1">{org.status}</Badge>
                                    </div>
                                    <p className="text-xs text-zinc-500 font-mono">{org.slug}</p>

                                    <div className="flex items-center gap-4 mt-2">
                                        <span className="text-[10px] flex items-center gap-1 text-zinc-400">
                                            <Users className="w-3 h-3" /> {org.metrics.professionals} Pros
                                        </span>
                                        <span className="text-[10px] flex items-center gap-1 text-zinc-400">
                                            <Calendar className="w-3 h-3" /> {org.metrics.appointments} Agts
                                        </span>
                                        <span className="text-[10px] flex items-center gap-1 text-zinc-400">
                                            <Building2 className="w-3 h-3" /> {org.metrics.patients} Pacs
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                    {org.issues.length === 0 ? (
                                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> Integridade OK
                                        </Badge>
                                    ) : (
                                        <div className="flex flex-col gap-1 items-end">
                                            <div className="flex items-center gap-2">
                                                {org.issues.map((issue: any, idx: number) => (
                                                    <Badge key={idx} variant="destructive" className="bg-red-50 text-red-700 border-red-100 text-[10px]">
                                                        {issue.message}
                                                    </Badge>
                                                ))}
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-6 text-[10px] text-red-600 hover:bg-red-100 font-bold"
                                                    onClick={() => handleClinicCleanup(org.orgId, org.name)}
                                                    disabled={isLoading}
                                                >
                                                    <Trash2 className="w-3 h-3 mr-1" /> LIMPAR
                                                </Button>
                                            </div>
                                            <p className="text-[9px] text-zinc-400 italic mt-0.5">{org.issues[0].action}</p>
                                        </div>
                                    )}
                                    <Button variant="ghost" size="sm" className="text-[10px] h-7" onClick={() => window.location.href = `/admin/tenants/${org.orgId}`}>
                                        Gerenciar Clínica
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
