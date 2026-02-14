export const dynamic = 'force-dynamic'

import { InsolesTab } from "../components/InsolesTab"
import { PatientTabsClient } from "../components/PatientTabsClient"

import { getInsoleFollowUps } from "@/app/dashboard/[slug]/patients/actions/insoles"
import { getPatient } from "@/actions/patients"
import { getUnbilledAppointments, getInvoices } from "@/actions/billing"
import { getProducts } from "@/app/dashboard/[slug]/products/actions"
import { getAssessments } from "@/app/dashboard/[slug]/patients/actions/assessments"
import { getPatientRecords } from "@/app/dashboard/[slug]/patients/actions/records"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { logAction } from "@/lib/logger"
import { BackButton } from "@/components/ui/back-button"
import { AttendanceSyncer } from "@/features/attendance/components/AttendanceSyncer"
import { getPatientDocuments } from "@/actions/documents"
import { DocumentUploadDialog } from "../components/DocumentUploadDialog"
import { PatientDocumentsList } from "../components/PatientDocumentsList"

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
import { NewEvaluationDialog } from "@/features/patients/components/NewEvaluationDialog"
import { InstantEvolutionButton } from "@/features/patients/components/InstantEvolutionButton"
import { GenerateConsentButton } from "@/features/patients/components/generate-consent-button"
import { StartAttendanceButton } from "@/features/patients/components/StartAttendanceButton"
import { DataExportButton } from "@/features/patients/components/data-export-button"
import { PatientStatusToggle } from "@/features/patients/components/patient-status-toggle"
import { FinancialTab } from "./financial-tab"
import { AssessmentTab } from "../components/AssessmentTab"
import { PatientReportsTab } from "../components/PatientReportsTab"
import { QuestionnairesTab } from "../components/QuestionnairesTab"

import { MobileTabSelect } from "../components/MobileTabSelect"
import { cn } from "@/lib/utils"
import { formatPhoneDisplay, getPhoneFlag } from "@/utils/format-phone"

// Stub for missing function to allow build
const getPaymentFees = async () => []

export default async function PatientDetailPage({
    params,
    searchParams
}: {
    params: Promise<{ slug: string, id: string }>,
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { slug, id } = await params
    const resolvedSearchParams = await searchParams
    const activeTab = (resolvedSearchParams.tab as string) || 'overview'

    const supabase = await createClient()

    // 1. [SECURITY] Verify Patient belongs to User Org
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return notFound()

    const patient = await getPatient(id, slug)
    if (!patient) return notFound()

    // 2. [ACTIVE CONTEXT] Banner
    const { data: activeAppt } = await supabase
        .from('appointments')
        .select('id, status, start_time')
        .eq('patient_id', id)
        .in('status', ['in_progress', 'attended'])
        .order('start_time', { ascending: false })
        .limit(1)
        .maybeSingle()

    const bannerAppointmentId = activeAppt?.id
    const showBanner = !!bannerAppointmentId
    const bannerStatus = activeAppt?.status === 'in_progress' ? 'Em Atendimento' : 'Aguardando Início'

    // [LGPD] Log Access
    await logAction('VIEW_PATIENT', { patientId: id, name: patient.name }, 'patients', id)

    // Fetch Other Data (Non-Critical or Independent)
    let unbilledAppointments: any[] = [];
    let invoices: any[] = [];
    let fees: any[] = [];
    let assessments: any[] = [];
    let evolutionRecords: any[] = [];
    let assessmentRecords: any[] = [];
    let allAppointments: any[] = [];
    let insoleFollowUps: any[] = [];
    let documents: any[] = []; // [NEW]

    try {
        const results = await Promise.all([
            getUnbilledAppointments(id),
            getInvoices(id),
            getPaymentFees(),
            getAssessments(id, slug).catch((err: any) => {
                console.error("Failed to fetch assessments:", err);
                return [];
            }),
            getPatientRecords(id, 'evolution', slug),
            getPatientRecords(id, 'assessment', slug),
            // [NEW] Fetch All Appointments Logic
            supabase.from('appointments')
                .select('*, profiles:professional_id(full_name)')
                .eq('patient_id', id)
                .neq('status', 'cancelled') // [FIX] Hide cancelled appointments from the history tab to avoid confusion
                .order('start_time', { ascending: false })
                .limit(20), // Limit to last 20
            getInsoleFollowUps(id, slug),
            getPatientDocuments(id)
        ]);

        unbilledAppointments = results[0] || [];
        invoices = results[1] || [];
        fees = results[2] || [];
        assessments = results[3] || [];
        evolutionRecords = results[4] || [];
        assessmentRecords = results[5] || [];
        allAppointments = results[6].data || [];
        insoleFollowUps = results[7] || [];
        documents = results[8] || [];

    } catch (error) {
        console.error("Error fetching patient details:", error);
    }

    return (
        <div className="flex flex-col h-full bg-slate-50/50">
            {/* Active Attendance Banner */}
            {showBanner && (
                <div className={`${activeAppt?.status === 'attended' ? 'bg-blue-600' : 'bg-green-600'} text-white px-6 py-3 flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-4 duration-500`}>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Activity className="h-5 w-5 animate-pulse" />
                            <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${activeAppt?.status === 'attended' ? 'bg-blue-400' : 'bg-green-400'} opacity-75`}></span>
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${activeAppt?.status === 'attended' ? 'bg-blue-500' : 'bg-green-500'}`}></span>
                            </span>
                        </div>
                        <div>
                            <p className="text-xs font-medium opacity-90 uppercase tracking-wider">
                                {activeAppt?.status === 'attended' ? 'Atendimento Realizado' : 'Em Atendimento'}
                            </p>
                            <p className="text-sm font-bold">Registro ativo para {patient.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {activeAppt?.status === 'attended' ? (
                            <>
                                <Button size="sm" variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border-white/30 border shadow-sm transition-all active:scale-95" asChild>
                                    <Link href={`/dashboard/${slug}/attendance/${bannerAppointmentId}`}>
                                        Continuar Editando
                                    </Link>
                                </Button>
                                <Button size="sm" variant="secondary" className="bg-white text-blue-700 hover:bg-blue-50 shadow-sm transition-all active:scale-95 font-bold" asChild>
                                    <Link href={`/dashboard/${slug}/attendance/${bannerAppointmentId}?finish=true`}>
                                        Finalizar Atendimento
                                    </Link>
                                </Button>
                            </>
                        ) : (
                            <Button size="sm" variant="secondary" className="bg-white text-green-700 hover:bg-green-50 shadow-sm transition-all active:scale-95" asChild>
                                <Link href={`/dashboard/${slug}/attendance/${bannerAppointmentId}`}>
                                    Continuar Atendimento
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Sync Manager (Non-visual) */}
            <AttendanceSyncer />

            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between p-6 gap-4 border-b bg-white">
                <div className="flex items-center gap-4">
                    <BackButton className="hover:bg-slate-100 transition-colors" />
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{patient.name}</h1>
                            <Badge variant={patient.status === 'inactive' ? 'secondary' : 'default'} className={cn(
                                "text-[10px] uppercase font-bold tracking-widest px-2 py-0.5",
                                patient.status === 'inactive' ? "bg-slate-200 text-slate-600" : "bg-green-100 text-green-700 hover:bg-green-100 border-none"
                            )}>
                                {patient.status === 'inactive' ? 'Inativo' : 'Ativo'}
                            </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                            {patient.cpf && (
                                <span className="flex items-center gap-1.5">
                                    <span className="opacity-50">CPF:</span> {patient.cpf}
                                </span>
                            )}
                            {patient.birthdate && (
                                <span className="flex items-center gap-1.5 border-l pl-4 border-slate-200">
                                    <span className="opacity-50">IDADE:</span> {format(new Date(patient.birthdate), "d 'de' MMMM", { locale: ptBR })} ({new Date().getFullYear() - new Date(patient.birthdate).getFullYear()} anos)
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="w-full md:w-auto md:ml-auto flex flex-col md:flex-row items-stretch md:items-center gap-2">
                    <PatientStatusToggle patientId={patient.id} currentStatus={patient.status || 'active'} />
                    <Button size="sm" variant="outline" asChild className="w-full md:w-auto">
                        <Link href={`/dashboard/${slug}/patients/${patient.id}/edit`}>Editar Dados</Link>
                    </Button>
                    <div className="flex gap-2">
                        <DataExportButton patientId={patient.id} patientName={patient.name} />
                        <GenerateConsentButton patientId={patient.id} hasConsented={!!patient.health_data_consent} />
                    </div>

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
                <PatientTabsClient
                    activeTab={activeTab}
                    slug={slug}
                    patientId={patient.id}
                >
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
                                            <div className="font-medium text-base">
                                                {patient.phone ? (
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <span>{getPhoneFlag(patient.phone)}</span>
                                                        <span>{formatPhoneDisplay(patient.phone)}</span>
                                                    </span>
                                                ) : '-'}
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Nascimento</Label>
                                            <div className="font-medium text-base">
                                                {patient.birthdate ? new Date(patient.birthdate).toLocaleDateString('pt-BR') : '-'}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="space-y-6">
                                {/* [NEW] Screening Results Summary */}
                                {(() => {
                                    const latestMNSI = assessments.find(a => a.type === 'mnsi');
                                    if (!latestMNSI) return null;

                                    const score = latestMNSI.scores?.total;
                                    const classification = latestMNSI.scores?.classification;
                                    const riskColor = latestMNSI.scores?.riskColor;

                                    return (
                                        <Card className={`border-l-4 ${riskColor === 'red' ? 'border-red-500 bg-red-50/30' : 'border-green-500 bg-green-50/30'}`}>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                                    <Activity className={`h-4 w-4 ${riskColor === 'red' ? 'text-red-600' : 'text-green-600'}`} />
                                                    Michigan Score (MNSI)
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex items-baseline gap-2">
                                                    <span className={`text-3xl font-bold ${riskColor === 'red' ? 'text-red-700' : 'text-green-700'}`}>
                                                        {score}
                                                    </span>
                                                    <span className="text-sm text-muted-foreground font-medium">/ 15</span>
                                                </div>
                                                <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                    {classification}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground mt-1">
                                                    Avaliado em {new Date(latestMNSI.created_at).toLocaleDateString('pt-BR')}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    );
                                })()}

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
                                <Link href={`/dashboard/${slug}/schedule`}>Ver Agenda Completa</Link>
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
                                                <Badge variant={appt.status === 'completed' || appt.status === 'attended' || appt.status === 'confirmed' ? 'default' : 'secondary'} className={appt.status === 'attended' ? 'bg-green-600 hover:bg-green-700' : ''}>
                                                    {{
                                                        'attended': 'Atendido',
                                                        'completed': 'Concluído',
                                                        'confirmed': 'Confirmado',
                                                        'scheduled': 'Agendado',
                                                        'cancelled': 'Cancelado',
                                                        'checked_in': 'Em atendimento',
                                                        'pending': 'Pendente',
                                                        'no_show': 'Não compareceu'
                                                    }[appt.status as string] || appt.status}
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
                                        <Link href={`/dashboard/${slug}/schedule`}>Agendar Agora</Link>
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

                    <TabsContent value="questionnaires" className="h-[600px]">
                        <QuestionnairesTab patientId={id} patientName={patient.name} assessments={assessments} slug={slug} />
                    </TabsContent>

                    {/* Modern Assessments (Physical) */}
                    <TabsContent value="assessments" className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium">Avaliações Físicas e Laudos</h3>
                        </div>

                        {assessmentRecords && assessmentRecords.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {assessmentRecords.map((record: any) => {
                                    const createdAt = new Date(record.created_at)
                                    const now = new Date()
                                    const diffInHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
                                    const isFinalized = record.status === 'finalized'
                                    const isEditable = !isFinalized || (isFinalized && diffInHours < 24)

                                    const rawTitle = record.form_templates?.title || 'Formulário Sem Título'
                                    // Smart title detection from content when template title is generic
                                    let displayTitle = rawTitle
                                    if (record.content) {
                                        if (record.content.hma || record.content.postural || record.content.shoe) {
                                            displayTitle = 'Palmilha Biomecânica'
                                        } else if (record.content.antro || record.content.anthropometry) {
                                            displayTitle = 'Avaliação Física Avançada'
                                        } else if (record.content.anamnesis && record.content.physicalExam) {
                                            displayTitle = 'Avaliação PBE Inteligente'
                                        } else if (record.content.obstetric !== undefined) {
                                            displayTitle = 'Saúde da Mulher'
                                        }
                                    }

                                    return (
                                        <Card key={record.id} className="hover:bg-slate-50 transition-colors">
                                            <CardHeader className="pb-2">
                                                <div className="flex justify-between items-start">
                                                    <CardTitle className="text-base font-medium">
                                                        {displayTitle}
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
                                                <Button size="sm" variant={isEditable ? "secondary" : "outline"} className="w-full" asChild>
                                                    <Link href={`/dashboard/${slug}/patients/${id}/records/${record.id}${!isEditable ? '?readonly=true' : ''}`}>
                                                        {isEditable ? 'Abrir Avaliação' : 'Visualizar Avaliação'}
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
                                description="Esta área contém o histórico de avaliações físicas avançadas realizadas."
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="evolutions" className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium">Evoluções Clínicas</h3>
                        </div>

                        {evolutionRecords && evolutionRecords.length > 0 ? (
                            <div className="space-y-4">
                                {evolutionRecords.map((record: any) => {
                                    // LGPD Logic: 24h Edit Window
                                    const createdAt = new Date(record.created_at)
                                    const now = new Date()
                                    const diffInHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
                                    const isFinalized = record.status === 'finalized'
                                    const isEditable = !isFinalized || (isFinalized && diffInHours < 24)

                                    return (
                                        <Card key={record.id}>
                                            <CardHeader className="pb-2">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <CardTitle className="text-base">
                                                            {record.form_templates?.title || 'Evolução'}
                                                        </CardTitle>
                                                        <CardDescription>
                                                            {format(createdAt, "PPP 'às' HH:mm", { locale: ptBR })}
                                                        </CardDescription>
                                                    </div>
                                                    <Badge variant={isFinalized ? 'outline' : 'secondary'} className={isFinalized ? "bg-green-50 text-green-700 border-green-200" : ""}>
                                                        {isFinalized ? 'Assinado' : 'Rascunho'}
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-sm mb-3">
                                                    <span className="text-muted-foreground">Profissional: </span>
                                                    <span className="font-medium">{record.professionals?.full_name || 'Desconhecido'}</span>
                                                </div>
                                                <Button size="sm" variant={isEditable ? "secondary" : "outline"} className="w-full" asChild>
                                                    <Link href={`/dashboard/${slug}/patients/${id}/records/${record.id}${!isEditable ? '?readonly=true' : ''}`}>
                                                        {isEditable ? 'Abrir Evolução' : 'Visualizar Evolução'}
                                                    </Link>
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </div>
                        ) : (
                            <EmptyState
                                icon={FileText}
                                title="Nenhuma evolução"
                                description="Esta área contém o registro das evoluções diárias do paciente."
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="reports" className="space-y-4">
                        <PatientReportsTab
                            patientId={patient.id}
                            patientName={patient.name}
                            professionalName="Fisioterapeuta"
                            records={[...evolutionRecords, ...assessmentRecords]}
                            slug={slug}
                        />
                    </TabsContent>

                    <TabsContent value="attachments" className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium">Arquivos e Exames</h3>
                            <DocumentUploadDialog patientId={id}>
                                <Button size="sm" variant="outline" className="gap-2">
                                    <Upload className="h-4 w-4" />
                                    Novo Documento
                                </Button>
                            </DocumentUploadDialog>
                        </div>

                        <PatientDocumentsList documents={documents} />

                    </TabsContent>
                </PatientTabsClient>
            </div>
        </div>
    )
}
