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
import { getPaymentFees, getCardBrands } from "@/app/dashboard/[slug]/financial/actions"
import { BackButton } from "@/components/ui/back-button"
import { AttendanceSyncer } from "@/features/attendance/components/AttendanceSyncer"
import { getPatientDocuments } from "@/actions/documents"
import { DocumentUploadDialog } from "../components/DocumentUploadDialog"
import { PatientDocumentsList } from "../components/PatientDocumentsList"

import { Search, FileText, Upload, Calendar as CalendarIcon, FileImage, LayoutDashboard, DollarSign, ClipboardList, Activity, Paperclip, History, CalendarDays, Footprints, Users, MapPin, Briefcase, Zap, CreditCard } from "lucide-react"
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
import { InstantEvolutionButton } from "@/features/patients/components/InstantEvolutionButton"
import { GenerateConsentButton } from "@/features/patients/components/generate-consent-button"
import { StartAttendanceButton } from "@/features/patients/components/StartAttendanceButton"
import { DataExportButton } from "@/features/patients/components/data-export-button"
import { PatientStatusToggle } from "@/features/patients/components/patient-status-toggle"
import { FinancialTab } from "./financial-tab"
import { AssessmentTab } from "../components/AssessmentTab"
import { PatientReportsTab } from "../components/PatientReportsTab"
import { QuestionnairesTab } from "../components/QuestionnairesTab"
import { EvolutionTab } from "../components/EvolutionTab"

import { cn } from "@/lib/utils"
import { formatPhoneDisplay, getPhoneFlag } from "@/utils/format-phone"
import { formatCPF } from "@/utils/format-cpf"
import { translateStatus } from "@/utils/status-mapper"
import { WhatsAppDialog } from "@/features/patients/components/WhatsAppDialog"

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
        { data: allAppointments },
        fees,
        cardBrands
    ] = await Promise.all([
        getUnbilledAppointments(id),
        getInvoices(id),
        getAssessments(id, slug).catch(() => []),
        getPatientRecords(id, 'evolution', slug),
        getPatientRecords(id, 'assessment', slug),
        getInsoleFollowUps(id, slug),
        getPatientDocuments(id),
        supabase.from('appointments').select('id, status, start_time').eq('patient_id', id).eq('status', 'in_progress').order('start_time', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('appointments').select('*, profiles:professional_id(full_name)').eq('patient_id', id).neq('status', 'cancelled').order('start_time', { ascending: false }).limit(20),
        getPaymentFees(),
        getCardBrands()
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
                                    <span className="opacity-50">CPF:</span> {formatCPF(patient.cpf)}
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
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                                        <Users className="h-5 w-5 text-primary" />
                                        Dados do Paciente
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-8">
                                    {/* Section 1: Basic Info */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                        <div>
                                            <Label className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest block mb-1">Nome Completo</Label>
                                            <div className="font-semibold text-base text-slate-900">{patient.name}</div>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest block mb-1">CPF</Label>
                                            <div className="font-semibold text-base text-slate-900">{formatCPF(patient.cpf)}</div>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest block mb-1">Nascimento</Label>
                                            <div className="font-semibold text-base text-slate-900">
                                                {patient.birthdate ? format(new Date(patient.birthdate), "dd/MM/yyyy", { locale: ptBR }) : '-'}
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest block mb-1">Telefone</Label>
                                            <div className="font-semibold text-base text-slate-900">
                                                {patient.phone ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="inline-flex items-center gap-1.5 leading-none">
                                                            <span className="scale-125 mb-0.5">{getPhoneFlag(patient.phone)}</span>
                                                            <span>{formatPhoneDisplay(patient.phone)}</span>
                                                        </span>
                                                        <WhatsAppDialog
                                                            patientId={patient.id}
                                                            patientName={patient.name}
                                                            phone={patient.phone}
                                                        />
                                                    </div>
                                                ) : '-'}
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest block mb-1">Email</Label>
                                            <div className="font-semibold text-base text-slate-900 truncate" title={patient.email || ''}>{patient.email || '-'}</div>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest block mb-1">Gênero</Label>
                                            <div className="font-semibold text-base text-slate-900">
                                                {patient.gender === 'female' ? 'Feminino' : patient.gender === 'male' ? 'Masculino' : patient.gender === 'other' ? 'Outro' : '-'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 2: Address & Work */}
                                    <div className="pt-6 border-t border-slate-100">
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                            <div className="md:col-span-8 space-y-4">
                                                <div className="flex items-center gap-2 text-slate-400 mb-2">
                                                    <MapPin className="h-4 w-4" />
                                                    <span className="text-xs font-bold uppercase tracking-widest">Endereço e Localização</span>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="sm:col-span-2">
                                                        <Label className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest block mb-0.5">Logradouro</Label>
                                                        <div className="font-medium text-slate-800">
                                                            {patient.address || '-'}
                                                            {patient.number ? `, ${patient.number}` : ''}
                                                            {patient.complement ? ` (${patient.complement})` : ''}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Label className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest block mb-0.5">Bairro</Label>
                                                        <div className="font-medium text-slate-800">{patient.neighborhood || '-'}</div>
                                                    </div>
                                                    <div>
                                                        <Label className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest block mb-0.5">Cidade / UF</Label>
                                                        <div className="font-medium text-slate-800">
                                                            {patient.city || '-'} {patient.state ? `/ ${patient.state}` : ''}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Label className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest block mb-0.5">CEP</Label>
                                                        <div className="font-medium text-slate-800">{patient.zip_code || '-'}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="md:col-span-4 space-y-4 md:border-l md:pl-6 border-slate-100">
                                                <div className="flex items-center gap-2 text-slate-400 mb-2">
                                                    <Briefcase className="h-4 w-4" />
                                                    <span className="text-xs font-bold uppercase tracking-widest">Profissional / Origem</span>
                                                </div>
                                                <div className="space-y-4">
                                                    <div>
                                                        <Label className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest block mb-0.5">Profissão</Label>
                                                        <div className="font-medium text-slate-800 italic">{patient.occupation || '-'}</div>
                                                    </div>
                                                    <div>
                                                        <Label className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest block mb-0.5">Como nos conheceu?</Label>
                                                        <Badge variant="secondary" className="capitalize">
                                                            {patient.marketing_source === 'instagram' ? 'Instagram' :
                                                                patient.marketing_source === 'google' ? 'Google' :
                                                                    patient.marketing_source === 'indication' ? 'Indicação' :
                                                                        patient.marketing_source || 'Não informado'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 3: Relationship & Financial (Optional) */}
                                    {(patient.related_patient_id || patient.invoice_cpf) && (
                                        <div className="pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {patient.related_patient_id && (
                                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50">
                                                    <div className="flex items-center gap-2 text-indigo-600 mb-3">
                                                        <Zap className="h-4 w-4" />
                                                        <span className="text-xs font-bold uppercase tracking-widest">Parentesco / Vínculo</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                                            {patient.related_patient?.name?.[0] || '?'}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-900">{patient.related_patient?.name}</div>
                                                            <div className="text-xs text-indigo-600 font-medium uppercase tracking-wider">{patient.relationship_degree || 'Parente'}</div>
                                                        </div>
                                                        <Button size="icon" variant="ghost" asChild className="ml-auto">
                                                            <Link href={`/dashboard/${slug}/patients/${patient.related_patient_id}`}>
                                                                <Search className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {patient.invoice_cpf && (
                                                <div className="bg-green-50/50 p-4 rounded-xl border border-green-200/50">
                                                    <div className="flex items-center gap-2 text-green-700 mb-3">
                                                        <CreditCard className="h-4 w-4" />
                                                        <span className="text-xs font-bold uppercase tracking-widest">Dados para Faturamento (NF)</span>
                                                    </div>
                                                    <div className="space-y-2 text-sm">
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">Nome:</span>
                                                            <span className="font-bold text-slate-900">{patient.invoice_name || '-'}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">CPF/CNPJ:</span>
                                                            <span className="font-bold text-slate-900 font-mono">{patient.invoice_cpf}</span>
                                                        </div>
                                                        <div className="text-[10px] text-green-700 font-medium uppercase mt-2">Endereço de Faturamento:</div>
                                                        <div className="text-xs text-slate-600 leading-tight">
                                                            {patient.invoice_address}, {patient.invoice_number}<br />
                                                            {patient.invoice_neighborhood} - {patient.invoice_city}/{patient.invoice_state}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
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

                    <TabsContent value="evolutions" className="mt-6">
                        <div className="space-y-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                                    <div>
                                        <CardTitle>Linha do Tempo de Evoluções</CardTitle>
                                        <CardDescription>Acompanhe o histórico de atendimentos e entregas</CardDescription>
                                    </div>
                                    <InstantEvolutionButton patientId={id} patientName={patient.name} />
                                </CardHeader>
                                <CardContent>
                                    <EvolutionTab
                                        patientId={id}
                                        records={evolutionRecords}
                                    />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Gerador de Laudos e Documentos</CardTitle>
                                    <CardDescription>Crie documentos técnicos baseados nas evoluções acima</CardDescription>
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
                        </div>
                    </TabsContent>

                    <TabsContent value="assessments" className="mt-6">
                        <Card>
                            <CardHeader className="pb-4">
                                <CardTitle>Avaliações Realizadas</CardTitle>
                                <CardDescription>Testes físicos, biomecânicos e escalas</CardDescription>
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
                                                {(() => {
                                                    const { label, color } = translateStatus(appt.status)
                                                    return (
                                                        <Badge variant="outline" className={cn("text-[10px] font-black uppercase tracking-widest px-3", color)}>
                                                            {label}
                                                        </Badge>
                                                    )
                                                })()}
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
                            fees={fees || []}
                            cardBrands={cardBrands || []}
                        />
                    </TabsContent>

                    <TabsContent value="reports" className="mt-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                <div>
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-primary" />
                                        Documentos e Anexos
                                    </CardTitle>
                                    <CardDescription className="text-xs">Gerencie exames, termos e arquivos em geral</CardDescription>
                                </div>
                                <DocumentUploadDialog patientId={id} />
                            </CardHeader>
                            <CardContent className="space-y-8">
                                <PatientDocumentsList documents={documents} />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="attachments" className="mt-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                <div>
                                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                                        <Paperclip className="h-4 w-4" /> Anexos e Arquivos
                                    </CardTitle>
                                    <CardDescription className="text-xs">Exames e arquivos carregados</CardDescription>
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
