import Link from "next/link"
import { ChevronLeft, FileText, Upload, Calendar as CalendarIcon, FileImage, LayoutDashboard, DollarSign, ClipboardList, Activity, Paperclip, History } from "lucide-react"

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
import { getAssessments } from "../actions/assessments"
import { getPaymentFees } from "@/app/dashboard/financial/actions"
import { notFound } from "next/navigation"
import { FinancialTab } from "./financial-tab"
import { AssessmentTab } from "../assessment-tab"
import { getPatientRecords } from "../actions/records"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default async function PatientDetailPage({
    params,
    searchParams
}: {
    params: Promise<{ id: string }>,
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { id } = await params
    const resolvedSearchParams = await searchParams
    const appointmentId = resolvedSearchParams.appointmentId as string
    const mode = resolvedSearchParams.mode as string

    // Fetch Data
    // Fetch Patient First (Critical)
    const patient = await getPatient(id);
    if (!patient) return notFound();

    // Fetch Other Data (Non-Critical or Independent)
    let unbilledAppointments: any[] = [];
    let invoices: any[] = [];
    let fees: any[] = [];
    let assessments: any[] = [];
    let evolutionRecords: any[] = [];
    let assessmentRecords: any[] = [];

    try {
        const results = await Promise.all([
            getUnbilledAppointments(id),
            getInvoices(id),
            getPaymentFees(),
            getAssessments(id).catch(err => {
                console.error("Failed to fetch assessments:", err);
                return [];
            }),
            getPatientRecords(id, 'evolution'),
            getPatientRecords(id, 'assessment')
        ]);
        unbilledAppointments = results[0] || [];
        invoices = results[1] || [];
        fees = results[2] || [];
        assessments = results[3] || [];
        evolutionRecords = results[4] || [];
        assessmentRecords = results[5] || [];
    } catch (error) {
        console.error("Error fetching patient details:", error);
    }

    return (
        <div className="flex flex-col gap-4">
            {/* [NEW] Attendance Start Banner */}
            {appointmentId && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r shadow-sm mb-2 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-full">
                            <Activity className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-blue-900">Atendimento Iniciado</h3>
                            <p className="text-sm text-blue-700">
                                Verifique os dados cadastrais do paciente abaixo antes de prosseguir.
                            </p>
                        </div>
                    </div>
                    <Button
                        size="lg"
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-md gap-2"
                        asChild
                    >
                        <Link href={`/dashboard/attendance/${appointmentId}?mode=${mode || 'evolution'}`}>
                            Confirmar e Iniciar {mode === 'assessment' ? 'Avaliação' : 'Evolução'}
                            <ChevronLeft className="h-4 w-4 rotate-180" />
                        </Link>
                    </Button>
                </div>
            )}

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
                    <NewEvaluationDialog patientId={patient.id} patientName={patient.name} type="assessment" />
                    <NewEvaluationDialog patientId={patient.id} patientName={patient.name} type="evolution" />
                </div>
            </div>

            <div className="flex flex-1 flex-col">
                <Tabs defaultValue="overview" className="w-full space-y-6">

                    <div className="w-full overflow-x-auto pb-2">
                        <TabsList className="bg-muted p-1 rounded-md inline-flex">
                            <TabsTrigger value="overview" className="gap-2">
                                <LayoutDashboard className="h-4 w-4" />
                                Visão Geral
                            </TabsTrigger>
                            <TabsTrigger value="financial" className="gap-2">
                                <DollarSign className="h-4 w-4" />
                                Financeiro
                            </TabsTrigger>
                            <TabsTrigger value="assessments" className="gap-2">
                                <ClipboardList className="h-4 w-4" />
                                Questionários
                            </TabsTrigger>
                            <TabsTrigger value="ehr" className="gap-2">
                                <Activity className="h-4 w-4" />
                                Prontuário
                            </TabsTrigger>
                            {/* [NEW] Evolutions Tab */}
                            <TabsTrigger value="evolutions" className="gap-2">
                                <FileText className="h-4 w-4" />
                                Evoluções
                            </TabsTrigger>
                            <TabsTrigger value="attachments" className="gap-2">
                                <Paperclip className="h-4 w-4" />
                                Anexos
                            </TabsTrigger>
                            <TabsTrigger value="history" className="gap-2">
                                <History className="h-4 w-4" />
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

                    <TabsContent value="assessments" className="space-y-4">
                        {/* ONLY Clinical Scales here */}
                        <AssessmentTab patientId={id} assessments={assessments} />
                    </TabsContent>

                    <TabsContent value="ehr" className="space-y-4">
                        {/* Prontuário: Shows Custom Assessments (Palmilhas, etc) */}
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium">Prontuário e Avaliações</h3>
                            <NewEvaluationDialog patientId={patient.id} patientName={patient.name} type="assessment">
                                <Button size="sm">Nova Avaliação</Button>
                            </NewEvaluationDialog>
                        </div>

                        {assessmentRecords && assessmentRecords.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {assessmentRecords.map((record: any) => (
                                    <Card key={record.id} className="hover:bg-slate-50 transition-colors">
                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-base font-medium">
                                                    {record.form_templates?.title || 'Formulário Sem Título'}
                                                </CardTitle>
                                                <Badge variant={record.status === 'finalized' ? 'default' : 'secondary'}>
                                                    {record.status === 'finalized' ? 'Finalizado' : 'Rascunho'}
                                                </Badge>
                                            </div>
                                            <CardDescription>
                                                {format(new Date(record.created_at), "d 'de' MMMM, yyyy", { locale: ptBR })}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-sm text-muted-foreground mb-4">
                                                Profissional: <span className="font-medium text-foreground">{record.professionals?.full_name || 'Desconhecido'}</span>
                                            </div>
                                            <Button size="sm" variant="outline" className="w-full" asChild>
                                                <Link href={`/dashboard/patients/${id}/records/${record.id}`}>
                                                    {record.status === 'finalized' ? 'Visualizar' : 'Continuar Preenchimento'}
                                                </Link>
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground text-center py-8 bg-muted/20 rounded-lg border border-dashed">
                                Nenhuma avaliação registrada (Palmilhas, Baropodometria, etc).
                            </div>
                        )}
                    </TabsContent>

                    {/* [NEW] Evolutions Tab Content */}
                    <TabsContent value="evolutions" className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium">Evoluções Clínicas</h3>
                            <NewEvaluationDialog patientId={patient.id} patientName={patient.name} type="evolution">
                                <Button size="sm">Nova Evolução</Button>
                            </NewEvaluationDialog>
                        </div>

                        {evolutionRecords && evolutionRecords.length > 0 ? (
                            <div className="space-y-4">
                                {evolutionRecords.map((record: any) => (
                                    <Card key={record.id}>
                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-base">
                                                        {record.form_templates?.title || 'Evolução'}
                                                    </CardTitle>
                                                    <CardDescription>
                                                        {format(new Date(record.created_at), "PPP 'às' HH:mm", { locale: ptBR })}
                                                    </CardDescription>
                                                </div>
                                                <Badge variant={record.status === 'finalized' ? 'outline' : 'secondary'}>
                                                    {record.status === 'finalized' ? 'Assinado' : 'Rascunho'}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-sm mb-3">
                                                <span className="text-muted-foreground">Profissional: </span>
                                                <span className="font-medium">{record.professionals?.full_name || 'Desconhecido'}</span>
                                            </div>
                                            <Button size="sm" variant="secondary" asChild>
                                                <Link href={`/dashboard/patients/${id}/records/${record.id}`}>
                                                    Abrir Evolução
                                                </Link>
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground text-center py-8 bg-muted/20 rounded-lg border border-dashed">
                                Nenhuma evolução registrada ainda.
                            </div>
                        )}
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
