export const dynamic = 'force-dynamic'

import { InsolesTab } from "../components/InsolesTab"

import { getInsoleFollowUps } from "../actions/insoles"
import { getPatient, getUnbilledAppointments, getInvoices, getProducts } from "../actions"
import { getAssessments } from "../actions/assessments"
import { getPatientRecords } from "../actions/records"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { logAction } from "@/lib/logger"
import { BackButton } from "@/components/ui/back-button"
import { AttendanceSyncer } from "@/components/attendance/AttendanceSyncer"

import { ChevronLeft, FileText, Upload, Calendar as CalendarIcon, FileImage, LayoutDashboard, DollarSign, ClipboardList, Activity, Paperclip, History, CalendarDays, Footprints } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { notFound } from "next/navigation"
import { EmptyState } from "@/components/ui/empty-state"
import { ConsentFormDialog } from "@/components/patients/ConsentFormDialog"
import { NewEvaluationDialog } from "@/components/patients/NewEvaluationDialog"
import { GenerateConsentButton } from "@/components/patients/generate-consent-button"
import { StartAttendanceButton } from "@/components/patients/StartAttendanceButton"
import { DataExportButton } from "@/components/patients/data-export-button"
import { PatientStatusToggle } from "@/components/patients/patient-status-toggle"
import { FinancialTab } from "./financial-tab"
import { AssessmentTab } from "../components/AssessmentTab"
import { PatientReportsTab } from "../components/PatientReportsTab"
import { QuestionnairesTab } from "../components/QuestionnairesTab"

// Stub for missing function to allow build
const getPaymentFees = async () => []

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

    // [NEW] Persist Attendance Banner Logic
    const supabase = await createClient()
    const todayStart = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    // [NEW] Robust Admin Fetch (Bypasses RLS entirely)
    const adminSupabase = await createAdminClient()
    const { data: adminAppt, error: adminError } = await adminSupabase
        .from('appointments')
        .select('*')
        .eq('patient_id', id)
        .in('status', ['checked_in', 'in_progress', 'attended', 'confirmed'])
        .order('start_time', { ascending: false })
        .limit(1)

    // DEBUG: Dump ALL recent appointments to see what is going on
    const { data: allRecentDebug } = await adminSupabase
        .from('appointments')
        .select('id, status, start_time, service_id, location_id')
        .eq('patient_id', id)
        .order('start_time', { ascending: false })
        .limit(5)

    if (adminError) {
        console.error("Error fetching active appointment via Admin:", adminError)
    }

    const activeAppt = adminAppt?.[0]

    console.log("DEBUG: All Recent Appointments for Patient", id);
    console.table(allRecentDebug);
    console.log("DEBUG: Active Appt Found:", activeAppt);
    console.log("DEBUG: Admin Result for Patient", id, ":", activeAppt);

    // Priority: URL Param > Active DB Appointment
    const bannerAppointmentId = appointmentId || activeAppt?.id
    const showBanner = !!bannerAppointmentId
    const bannerStatus = activeAppt?.status === 'attended' ? 'Em Atendimento' : 'Aguardando Início'

    // [LGPD] Log Access
    await logAction('VIEW_PATIENT', { patientId: id, name: patient.name }, 'patients', id)

    // Fetch Other Data (Non-Critical or Independent)
    let unbilledAppointments: any[] = [];
    let invoices: any[] = [];
    let fees: any[] = [];
    let assessments: any[] = [];
    let evolutionRecords: any[] = [];
    let assessmentRecords: any[] = [];
    let allAppointments: any[] = []; // [NEW]
    let insoleFollowUps: any[] = []; // [NEW]

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
            getPatientRecords(id, 'assessment'),
            // [NEW] Fetch All Appointments Logic
            supabase.from('appointments')
                .select('*, profiles:professional_id(full_name)')
                .eq('patient_id', id)
                .order('start_time', { ascending: false })
                .limit(20), // Limit to last 20
            getInsoleFollowUps(id)
        ]);

        unbilledAppointments = results[0] || [];
        invoices = results[1] || [];
        fees = results[2] || [];
        assessments = results[3] || [];
        evolutionRecords = results[4] || [];
        assessmentRecords = results[5] || [];
        allAppointments = results[6].data || [];
        insoleFollowUps = results[7] || [];

    } catch (error) {
        console.error("Error fetching patient details:", error);
    }

    // [FIX] Classification Logic
    // Segregate records strictly for display:
    // 1. Evolutions Tab: Only "Evolução" forms.
    // 2. Assessments Tab: Everything else (Physical Assessment, Insoles, etc) excluding Questionnaires (handled in their own tab).

    const trueEvolutions = evolutionRecords.filter((r: any) =>
        (r.form_templates?.title === 'Evolução' || r.form_templates?.type === 'evolution') && r.form_templates?.type !== 'physical_assessment'
    );

    // Records that might be in evolutionRecords (due to save type) but are actually assessments
    const misclassifiedAssessments = evolutionRecords.filter((r: any) =>
        (r.form_templates?.title !== 'Evolução' && r.form_templates?.type !== 'evolution') || r.form_templates?.type === 'physical_assessment'
    );

    // Combine standard assessments with misclassified ones
    // Filter out questionnaires if they appear here (usually they are separate, but safety check)
    const combinedAssessments = [...assessmentRecords, ...misclassifiedAssessments]
        .filter((r: any) => r.form_templates?.type !== 'questionnaire')
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Prepare all records for Reports Tab context
    const allClinicalRecords = [...trueEvolutions, ...combinedAssessments].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());


    return (
        <div className="flex flex-col gap-4">
            {/* The rest of the component... */}
            {/* ... (Skipping unchanged banner/header parts for brevity if I could, but replace_file needs contiguous block? No, I will just edit the Tabs part downwards or variable definition up top? 
               Wait, I need to define the variables `trueEvolutions` etc BEFORE the return.
               And then use them in the Tabs.
               
               I will split this modification. 
               Chunk 1: Variable Definition (Line 112)
               Chunk 2: Tabs Content Use (Line 387, 446, 494)
            */}

            {/* [NEW] Attendance Start Banner (Persistent) */}
            {showBanner && (
                <div className={`border-l-4 p-4 rounded-r shadow-sm mb-2 flex items-center justify-between animate-in fade-in slide-in-from-top-2 ${bannerStatus === 'Em Atendimento'
                    ? 'bg-yellow-50 border-yellow-500' // Yellow context for 'Atendido'
                    : 'bg-blue-50 border-blue-500' // Blue context for 'Aguardando'
                    }`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${bannerStatus === 'Em Atendimento' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-600'
                            }`}>
                            <Activity className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className={`font-bold ${bannerStatus === 'Em Atendimento' ? 'text-yellow-900' : 'text-blue-900'
                                }`}>
                                {bannerStatus === 'Em Atendimento' ? 'Atendimento em Andamento' : 'Paciente Aguardando'}
                            </h3>
                            <p className={`text-sm ${bannerStatus === 'Em Atendimento' ? 'text-yellow-700' : 'text-blue-700'
                                }`}>
                                {bannerStatus === 'Em Atendimento'
                                    ? 'Este paciente está marcado como "Atendido". Clique para continuar.'
                                    : 'Paciente marcou presença. Inicie o atendimento agora.'}
                            </p>
                        </div>
                    </div>
                    <Button
                        size="lg"
                        className={`shadow-md gap-2 text-white ${bannerStatus === 'Em Atendimento' ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                        asChild
                    >
                        <Link href={`/dashboard/attendance/${bannerAppointmentId}?mode=${mode || 'evolution'}`}>
                            {bannerStatus === 'Em Atendimento' ? 'Retomar Atendimento' : 'Iniciar Atendimento'}
                            <ChevronLeft className="h-4 w-4 rotate-180" />
                        </Link>
                    </Button>

                    {/* Sync Global State */}
                    {bannerStatus === 'Em Atendimento' && (
                        <AttendanceSyncer
                            appointmentId={bannerAppointmentId}
                            startTime={activeAppt.start_time}
                            patientName={patient.name}
                            patientId={patient.id}
                        />
                    )}
                </div>
            )}

            <div className="flex items-center gap-4">
                <BackButton />
                <h1 className="text-xl font-semibold tracking-tight">
                    {patient.name}
                </h1>
                <Badge variant={patient.status === 'inactive' ? 'secondary' : 'outline'} className={`ml-2 ${patient.status === 'inactive' ? 'bg-gray-100 text-gray-500' : 'bg-green-50 text-green-700 border-green-200'}`}>
                    {patient.status === 'inactive' ? 'Arquivado' : 'Ativo'}
                </Badge>
                <div className="ml-auto flex items-center gap-2">
                    <PatientStatusToggle patientId={patient.id} currentStatus={patient.status || 'active'} />
                    <Button size="sm" variant="outline" asChild>
                        <Link href={`/dashboard/patients/${patient.id}/edit`}>Editar Dados</Link>
                    </Button>
                    <DataExportButton patientId={patient.id} patientName={patient.name} />
                    <GenerateConsentButton patientId={patient.id} hasConsented={patient.health_data_consent} />
                    <ConsentFormDialog patientId={patient.id} patientName={patient.name}>
                        <Button size="sm" variant="outline" className="gap-2">
                            <FileText className="h-4 w-4" />
                            TCLE
                        </Button>
                    </ConsentFormDialog>

                    {/* [UPDATED] Hidden if Banner is active to avoid duplication */}
                    {!showBanner && (
                        <StartAttendanceButton
                            patientId={patient.id}
                            activeAppointmentId={bannerAppointmentId}
                        />
                    )}
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
                            <TabsTrigger value="agenda" className="gap-2">
                                <CalendarDays className="h-4 w-4" />
                                Agenda
                            </TabsTrigger>
                            <TabsTrigger value="insoles" className="gap-2">
                                <Footprints className="h-4 w-4" />
                                Palmilhas
                            </TabsTrigger>
                            <TabsTrigger value="evolutions" className="gap-2">
                                <FileText className="h-4 w-4" />
                                Evoluções
                            </TabsTrigger>
                            <TabsTrigger value="assessments" className="gap-2">
                                <Activity className="h-4 w-4" />
                                Avaliações Físicas
                            </TabsTrigger>
                            <TabsTrigger value="questionnaires" className="gap-2">
                                <ClipboardList className="h-4 w-4" />
                                Questionários
                            </TabsTrigger>
                            <TabsTrigger value="reports" className="gap-2">
                                <FileText className="h-4 w-4" />
                                Relatórios
                            </TabsTrigger>
                            <TabsTrigger value="financial" className="gap-2">
                                <DollarSign className="h-4 w-4" />
                                Financeiro
                            </TabsTrigger>
                            <TabsTrigger value="attachments" className="gap-2">
                                <Paperclip className="h-4 w-4" />
                                Anexos
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

                    {/* [NEW] Agenda Tab */}
                    <TabsContent value="agenda" className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium">Histórico de Agendamentos</h3>
                            <Button size="sm" asChild>
                                <Link href="/dashboard/schedule">Ver Agenda Completa</Link>
                            </Button>
                        </div>
                        {allAppointments.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {allAppointments.map((appt) => (
                                    <Card key={appt.id} className="hover:bg-slate-50">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-semibold">
                                                        {format(new Date(appt.start_time), "d 'de' MMMM", { locale: ptBR })}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {format(new Date(appt.start_time), "HH:mm")} - {format(new Date(appt.end_time), "HH:mm")}
                                                    </p>
                                                </div>
                                                <Badge variant={appt.status === 'completed' || appt.status === 'attended' ? 'default' : 'secondary'}>
                                                    {appt.status}
                                                </Badge>
                                            </div>
                                            <div className="mt-3 text-sm text-muted-foreground">
                                                Prof. {appt.profiles?.full_name || 'Desconhecido'}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                icon={CalendarIcon}
                                title="Nenhum agendamento"
                                description="Este paciente ainda não possui histórico de agendamentos no sistema."
                                action={
                                    <Button size="sm" variant="outline" asChild>
                                        <Link href="/dashboard/schedule">Agendar Agora</Link>
                                    </Button>
                                }
                            />
                        )}
                    </TabsContent>

                    {/* [NEW] Insoles Tab */}
                    <TabsContent value="insoles" className="space-y-4">
                        <InsolesTab patientId={id} followUps={insoleFollowUps} assessments={assessments} />
                    </TabsContent>

                    <TabsContent value="financial" className="space-y-4">
                        <FinancialTab
                            patientId={id}
                            unbilledAppointments={unbilledAppointments}
                            invoices={invoices}
                            fees={fees}
                        />
                    </TabsContent>

                    {/* ... (inside the TabsContent) */}
                    <TabsContent value="questionnaires" className="h-[600px]">
                        <QuestionnairesTab patientId={id} patientName={patient.name} assessments={assessments} />
                    </TabsContent>

                    {/* Modern Assessments (Physical) */}
                    <TabsContent value="assessments" className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium">Avaliações Físicas e Laudos</h3>
                            <NewEvaluationDialog patientId={patient.id} patientName={patient.name} type="assessment">
                                <Button size="sm">Nova Avaliação</Button>
                            </NewEvaluationDialog>
                        </div>

                        {assessmentRecords && assessmentRecords.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {assessmentRecords.map((record: any) => {
                                    const createdAt = new Date(record.created_at)
                                    const now = new Date()
                                    const diffInHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
                                    const isEditable = record.status !== 'finalized' && diffInHours < 24

                                    return (
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
                                                    {format(createdAt, "d 'de' MMMM, yyyy", { locale: ptBR })}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-sm text-muted-foreground mb-4">
                                                    Profissional: <span className="font-medium text-foreground">{record.professionals?.full_name || 'Desconhecido'}</span>
                                                </div>
                                                <Button size="sm" variant={isEditable ? "outline" : "secondary"} className="w-full" asChild>
                                                    <Link href={`/dashboard/patients/${id}/records/${record.id}`}>
                                                        {isEditable ? 'Continuar Preenchimento' : 'Visualizar'}
                                                    </Link>
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </div>
                        ) : (
                            <EmptyState
                                icon={Activity}
                                title="Nenhuma avaliação física"
                                description="Crie a primeira avaliação física (Bioimpedância, Força, etc) agora."
                                action={
                                    <NewEvaluationDialog patientId={patient.id} patientName={patient.name} type="assessment">
                                        <Button size="sm">Criar Avaliação</Button>
                                    </NewEvaluationDialog>
                                }
                            />
                        )}
                    </TabsContent>

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
                            <EmptyState
                                icon={FileText}
                                title="Nenhuma evolução"
                                description="Registre a evolução diária do paciente aqui."
                                action={
                                    <NewEvaluationDialog patientId={patient.id} patientName={patient.name} type="evolution">
                                        <Button size="sm">Nova Evolução</Button>
                                    </NewEvaluationDialog>
                                }
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="reports" className="space-y-4">
                        <PatientReportsTab
                            patientId={patient.id}
                            patientName={patient.name}
                            professionalName="Fisioterapeuta"
                            records={[...evolutionRecords, ...assessmentRecords]}
                        />
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
                            {/* Empty State */}
                            <div className="col-span-full">
                                <EmptyState
                                    icon={Paperclip}
                                    title="Nenhum arquivo"
                                    description="Faça upload de exames e documentos."
                                />
                            </div>
                        </div>
                    </TabsContent>

                </Tabs>
            </div>
        </div>
    )
}
