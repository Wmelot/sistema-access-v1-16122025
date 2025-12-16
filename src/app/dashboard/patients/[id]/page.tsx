import Link from "next/link"
import { ChevronLeft, FileText, Upload, Calendar as CalendarIcon, FileImage } from "lucide-react"

import { Button } from "@/components/ui/button"
import { NewEvaluationDialog } from "@/components/patients/NewEvaluationDialog"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

import { getPatient, getUnbilledAppointments, getInvoices } from "../actions"
import { getPaymentFees } from "@/app/dashboard/financial/actions"
import { notFound } from "next/navigation"
import { FinancialTab } from "./financial-tab"

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    // Fetch Data
    const [patient, unbilledAppointments, invoices, fees] = await Promise.all([
        getPatient(id),
        getUnbilledAppointments(id),
        getInvoices(id),
        getPaymentFees()
    ])

    if (!patient) return notFound()

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                    <Link href="/dashboard/patients">
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Voltar</span>
                    </Link>
                </Button>
                <h1 className="text-xl font-semibold tracking-tight">
                    {patient.name}
                </h1>
                <Badge variant="outline" className="ml-2">Ativo</Badge>
                <div className="ml-auto flex items-center gap-2">
                    <Button size="sm" variant="outline" asChild>
                        <Link href={`/dashboard/patients/${patient.id}/edit`}>Editar Dados</Link>
                    </Button>
                    <NewEvaluationDialog patientId={patient.id} patientName={patient.name} />
                </div>
            </div>

            <div className="flex flex-1 flex-col">
                <Tabs defaultValue="overview" className="w-full space-y-6">

                    <div className="w-full overflow-x-auto pb-2">
                        <TabsList className="w-full justify-start bg-transparent p-0 border-b rounded-none h-auto">
                            <TabsTrigger
                                value="overview"
                                className="px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none"
                            >
                                Visão Geral
                            </TabsTrigger>
                            <TabsTrigger
                                value="financial"
                                className="px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none"
                            >
                                Financeiro
                            </TabsTrigger>
                            <TabsTrigger
                                value="ehr"
                                className="px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none"
                            >
                                Prontuário
                            </TabsTrigger>
                            <TabsTrigger
                                value="attachments"
                                className="px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none"
                            >
                                Anexos
                            </TabsTrigger>
                            <TabsTrigger
                                value="history"
                                className="px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none"
                            >
                                Histórico
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="overview" className="space-y-6 mt-6">
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <Card className="md:col-span-2">
                                <CardHeader>
                                    <CardTitle>Dados do Paciente</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                                        <div>
                                            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Nome Completo</Label>
                                            <div className="font-medium text-base">{patient.name}</div>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground text-xs uppercase tracking-wider">CPF</Label>
                                            <div className="font-medium text-base">{patient.cpf || '-'}</div>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Email</Label>
                                            <div className="font-medium text-base truncate" title={patient.email || ''}>{patient.email || '-'}</div>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Telefone</Label>
                                            <div className="font-medium text-base">{patient.phone || '-'}</div>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Nascimento</Label>
                                            <div className="font-medium text-base">
                                                {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString('pt-BR') : '-'}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="space-y-6">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">Próxima Consulta</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-2">
                                            <CalendarIcon className="h-5 w-5 text-primary" />
                                            <span className="font-bold text-lg">Em breve</span>
                                        </div>
                                        <div className="mt-2 text-xs text-muted-foreground">
                                            Nenhum agendamento futuro
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">Situação Financeira</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {unbilledAppointments.length > 0 ? (
                                            <div>
                                                <div className="text-2xl font-bold text-orange-600">{unbilledAppointments.length} Pendentes</div>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Itens não faturados.
                                                </p>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="text-2xl font-bold text-green-600">Em dia</div>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Nenhuma pendência.
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="financial" className="space-y-4">
                        <FinancialTab
                            patientId={id}
                            unbilledAppointments={unbilledAppointments}
                            invoices={invoices}
                            fees={fees}
                        />
                    </TabsContent>

                    <TabsContent value="ehr" className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium">Evoluções Clínicas</h3>
                        </div>

                        {/* Timeline Placeholder */}
                        <div className="text-sm text-muted-foreground text-center py-8 bg-muted/20 rounded-lg border border-dashed">
                            Nenhuma evolução registrada ainda.
                        </div>
                    </TabsContent>

                    <TabsContent value="attachments" className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium">Arquivos e Exames</h3>
                            <Button size="sm" variant="outline" className="gap-2">
                                <Upload className="h-4 w-4" />
                                Upload
                            </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                            {/* Empty State for now */}
                            <div className="col-span-full text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                                Nenhum arquivo anexado.
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="history">
                        <Card>
                            <CardHeader>
                                <CardTitle>Histórico de Ações</CardTitle>
                                <CardDescription>Log de alterações no cadastro do paciente.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">Em breve.</p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
