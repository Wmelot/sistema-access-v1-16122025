export const dynamic = 'force-dynamic'

import { InsolesTab } from "../components/InsolesTab"
import { PatientTabsClient } from "../components/PatientTabsClient"

import { getInsoleFollowUps } from "@/app/dashboard/[slug]/patients/actions/insoles"
import { getPatient } from "@/actions/patients"
import { getUnbilledAppointments, getInvoices } from "@/actions/billing"
import { getAssessments } from "@/app/dashboard/[slug]/patients/actions/assessments"
import { getPatientRecords } from "@/app/dashboard/[slug]/patients/actions/records"
import { createClient } from "@/lib/supabase/server"
import { logAction, logAccess } from "@/lib/logger"
import { BackButton } from "@/components/ui/back-button"
import { AttendanceSyncer } from "@/features/attendance/components/AttendanceSyncer"
import { getPatientDocuments } from "@/actions/documents"
import { DocumentUploadDialog } from "../components/DocumentUploadDialog"
import { PatientDocumentsList } from "../components/PatientDocumentsList"

import { Search, FileText, Upload, Calendar as CalendarIcon, FileImage, LayoutDashboard, DollarSign, ClipboardList, Activity, Paperclip, History, CalendarDays, Footprints } from "lucide-react"
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

import { cn } from "@/lib/utils"
import { formatPhoneDisplay, getPhoneFlag } from "@/utils/format-phone"

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

    // 2. [FETCH DATA] Parallelized and logged
    console.time(`[PatientDetails] Fetching: ${id}`)
    const [
        unbilledAppointments,
        invoices,
        assessments,
        evolutionRecords,
        assessmentRecords,
        insoleFollowUps,
        documents,
        { data: activeAppt },
        { data: allAppointments }
    ] = await Promise.all([
        getUnbilledAppointments(id),
        getInvoices(id),
        getAssessments(id, slug).catch(() => []),
        getPatientRecords(id, 'evolution', slug),
        getPatientRecords(id, 'assessment', slug),
        getInsoleFollowUps(id, slug),
        getPatientDocuments(id),
        supabase.from('appointments').select('id, status, start_time').eq('patient_id', id).eq('status', 'in_progress').order('start_time', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('appointments').select('*, profiles:professional_id(full_name)').eq('patient_id', id).neq('status', 'cancelled').order('start_time', { ascending: false }).limit(20)
    ])
    console.timeEnd(`[PatientDetails] Fetching: ${id}`)

    const bannerAppointmentId = activeAppt?.id
    const showBanner = !!bannerAppointmentId

    // [LGPD] Log Access (read-only view, goes to access_logs table)
    logAccess('patients', id, 'VIEW_PATIENT')

    return (
        <div className="flex flex-col h-full bg-slate-50/50">
            {/* Active Attendance Banner */}
            {showBanner && (
                <div className="bg-green-600 text-white px-6 py-3 flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Activity className="h-5 w-5 animate-pulse" />
                            <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                        </div>
                        <div>
                            <p className="text-xs font-medium opacity-90 uppercase tracking-wider">Em Atendimento</p>
                            <p className="text-sm font-bold">Registro ativo para {patient.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button size="sm" variant="secondary" className="bg-white text-green-700 hover:bg-green-50 shadow-sm transition-all active:scale-95" asChild>
                            <Link href={`/dashboard/${slug}/attendance/${bannerAppointmentId}`}>
                                Continuar Atendimento
                            </Link>
                        </Button>
                    </div>
                </div>
            )}

            {showBanner && (
                <AttendanceSyncer
                    appointmentId={bannerAppointmentId!}
                    startTime={activeAppt?.start_time}
                    patientName={patient.name}
                    patientId={patient.id}
                    status={activeAppt?.status}
                />
            )}

            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between p-6 gap-4 border-b bg-white">
                <div className="flex items-center gap-4">
                    <BackButton />
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
                                {(() => {
                                    const latestMNSI = assessments.find(a => a.type === 'mnsi');
                                    if (!latestMNSI) return null;

                                    const score = latestMNSI.scores?.total;
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
                                            </CardContent>
                                        </Card>
                                    );
                                })()}

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-indigo-600">
                                            <Search className="h-4 w-4" /> Insight Clínico IA
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-xs text-muted-foreground leading-relaxed italic">
                                            "Com base no histórico recente, o paciente apresenta boa evolução muscular, porém recomenda-se atenção ao equilíbrio distal."
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="records" className="mt-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                                <div>
                                    <CardTitle>Histórico de Evoluções</CardTitle>
                                    <CardDescription>Acompanhe a trajetória clínica do paciente</CardDescription>
                                </div>
                                <InstantEvolutionButton patientId={id} patientName={patient.name} />
                            </CardHeader>
                            <CardContent>
                                <PatientReportsTab
                                    patientId={id}
                                    patientName={patient.name}
                                    records={evolutionRecords}
                                    slug={slug}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="assessments" className="mt-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                                <div>
                                    <CardTitle>Avaliações Realizadas</CardTitle>
                                    <CardDescription>Testes físicos, biomecânicos e escalas</CardDescription>
                                </div>
                                <NewEvaluationDialog patientId={id} patientName={patient.name} type="assessment" />
                            </CardHeader>
                            <CardContent>
                                <AssessmentTab
                                    patientId={id}
                                    assessments={assessmentRecords}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="insoles" className="mt-6">
                        <InsolesTab
                            patientId={id}
                            followUps={insoleFollowUps}
                            assessments={assessments}
                        />
                    </TabsContent>

                    <TabsContent value="questionnaires" className="mt-6">
                        <QuestionnairesTab
                            patientId={id}
                            patientName={patient.name}
                            assessments={assessments}
                            slug={slug}
                        />
                    </TabsContent>

                    <TabsContent value="agenda" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Histórico de Agendas</CardTitle>
                                <CardDescription>Consulte datas e status de consultas passadas</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {allAppointments && allAppointments.length > 0 ? (
                                    <div className="space-y-4">
                                        {allAppointments.map((appt: any) => (
                                            <div key={appt.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 italic transition-all hover:bg-white hover:shadow-sm">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2 bg-white rounded-lg shadow-sm">
                                                        <CalendarDays className="h-4 w-4 text-slate-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900">{format(new Date(appt.start_time), "dd 'de' MMMM", { locale: ptBR })}</p>
                                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">Profissional: {appt.profiles?.full_name || '---'}</p>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest px-3 bg-white">
                                                    {appt.status}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState
                                        icon={CalendarDays}
                                        title="Nenhum agendamento"
                                        description="Este paciente ainda não possui histórico de consultas no sistema."
                                    />
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="financial" className="mt-6">
                        <FinancialTab
                            patientId={id}
                            unbilledAppointments={unbilledAppointments}
                            invoices={invoices}
                            fees={[]}
                        />
                    </TabsContent>

                    <TabsContent value="documents" className="mt-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                <div>
                                    <CardTitle>Documentos e Anexos</CardTitle>
                                    <CardDescription>Gerencie exames, termos e arquivos em geral</CardDescription>
                                </div>
                                <DocumentUploadDialog patientId={id} />
                            </CardHeader>
                            <CardContent>
                                <PatientDocumentsList documents={documents} />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </PatientTabsClient>
            </div>
        </div>
    )
}
