import Link from "next/link"
import { MoreHorizontal, Plus, User, Calendar, Clock, Zap } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import { getPatients } from "@/actions/patients"
import { AlphabetFilter } from "./components/alphabet-filter"
import { SearchInput } from "./components/search-input"
import { PatientActions } from "./components/patient-actions"
import { SortableHeader } from "./components/sortable-header"
import { isMasterSupportMode } from "@/lib/auth/support-mode"
import { maskName, maskCPF, maskPhone } from "@/utils/mask-sensitive"
import { NavigatingLink } from "./components/navigating-link-wrapper"

export default async function PatientsPage(props: {
    params: Promise<{ slug: string }>
    searchParams: Promise<{ letter?: string; query?: string; page?: string; sort?: string; order?: 'asc' | 'desc' }>
}) {
    const params = await props.params
    const slug = params.slug
    const searchParams = await props.searchParams
    const page = Number(searchParams.page) || 1
    const { letter, query, sort, order } = searchParams

    const { data: patients, count } = await getPatients({
        letter,
        query,
        page,
        limit: 50,
        sort,
        order: order === 'desc' ? 'desc' : 'asc',
        slug
    })

    const totalPages = Math.ceil((count || 0) / 50)
    const isSupport = await isMasterSupportMode()

    if (isSupport) {
        // Dynamic import logger to avoid circular deps if any
        const { logAccess } = await import("@/lib/logger")
        // Log that Master viewed this list
        await logAccess('clinic_view', 'patients_list', 'view_masked')
    }

    const dashboardPrefix = `/dashboard/${slug}`

    return (
        <div className="flex flex-col gap-4">
            {/* ... Header ... */}
            {isSupport && (
                <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-4 mb-4 rounded shadow-sm flex items-start" role="alert">
                    <div className="mr-2">
                        <svg className="h-5 w-5 text-amber-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>
                        <p className="font-bold">Modo Suporte Ativo</p>
                        <p className="text-sm cursor-default">
                            Você está visualizando dados de outra clínica. As informações sensíveis foram mascaradas por segurança e ética (LGPD).
                        </p>
                    </div>
                </div>
            )}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-lg font-semibold md:text-2xl">
                    Pacientes
                    {isSupport && <span className="ml-3 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">Modo Suporte: Mascarado</span>}
                </h1>
                <Link href={`${dashboardPrefix}/patients/new`} className="w-full md:w-auto">
                    <Button size="sm" className="h-10 md:h-8 gap-1 w-full md:w-auto">
                        <Plus className="h-3.5 w-3.5" />
                        <span className="not-sr-only whitespace-nowrap">
                            Novo Paciente
                        </span>
                    </Button>
                </Link>
            </div>

            <AlphabetFilter />

            <Card>
                <CardHeader>
                    {/* ... */}
                    <CardTitle>Listagem</CardTitle>
                    <CardDescription>
                        Gerencie os pacientes da clínica.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 flex items-center gap-2">
                        <SearchInput />
                    </div>
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>
                                        <SortableHeader label="Nome" column="name" />
                                    </TableHead>
                                    <TableHead>
                                        <SortableHeader label="CPF" column="cpf" />
                                    </TableHead>
                                    <TableHead className="hidden md:table-cell">
                                        <SortableHeader label="Telefone" column="phone" />
                                    </TableHead>
                                    <TableHead className="hidden md:table-cell">
                                        <SortableHeader label="Cadastro" column="created_at" />
                                    </TableHead>
                                    <TableHead>
                                        <span className="sr-only">Ações</span>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {patients?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                            Nenhum paciente encontrado.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    patients?.map((patient: any) => (
                                        <TableRow key={patient.id}>
                                            <TableCell className="font-medium">
                                                <NavigatingLink href={`${dashboardPrefix}/patients/${patient.id}`} className="hover:underline text-indigo-600 font-bold">
                                                    {isSupport ? maskName(patient.name) : patient.name}
                                                </NavigatingLink>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground font-mono text-xs">
                                                {isSupport ? maskCPF(patient.cpf || '') : (patient.cpf || 'N/A')}
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell text-muted-foreground text-xs">
                                                {isSupport ? maskPhone(patient.phone || '') : (patient.phone || '-')}
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                {/* Placeholder for last appointment */}
                                                -
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <NavigatingLink href={`${dashboardPrefix}/schedule?openDialog=true&patientId=${patient.id}&patientName=${encodeURIComponent(isSupport ? maskName(patient.name) : patient.name)}`}>
                                                        <Button size="icon" variant="ghost" title="Novo Agendamento">
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                    </NavigatingLink>
                                                    <PatientActions patientId={patient.id} patientName={isSupport ? maskName(patient.name) : patient.name} />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) || (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                            Erro ao carregar pacientes.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden grid grid-cols-1 gap-4">
                        {(!patients || patients.length === 0) ? (
                            <div className="text-center py-10 text-muted-foreground bg-slate-50 rounded-lg">
                                Nenhum paciente encontrado.
                            </div>
                        ) : (
                            patients?.map((patient: any) => (
                                <div key={patient.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-3 right-2 z-10">
                                        <PatientActions patientId={patient.id} patientName={patient.name} orientation="vertical" />
                                    </div>
                                    <NavigatingLink href={`${dashboardPrefix}/patients/${patient.id}`} className="block">
                                        <div className="flex items-start gap-4 pr-10">
                                            <div className="bg-primary/10 p-3 rounded-full shrink-0">
                                                <User className="h-6 w-6 text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-slate-900 leading-tight">{patient.name}</h3>
                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                    <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                                        {patient.gender === 'female' ? 'Feminino' : patient.gender === 'male' ? 'Masculino' : 'Paciente'}
                                                    </span>
                                                    {patient.phone && (
                                                        <span className="text-xs text-muted-foreground">{patient.phone}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </NavigatingLink>

                                    <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-500 flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-slate-400" /> Próxima Consulta
                                            </span>
                                            <span className="font-medium text-slate-900">--</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-500 flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-slate-400" /> Último Atendimento
                                            </span>
                                            <span className="font-medium text-slate-900">--</span>
                                        </div>
                                    </div>

                                    <div className="mt-5">
                                        <NavigatingLink href={`${dashboardPrefix}/patients/${patient.id}`} className="block w-full">
                                            <Button className="w-full gap-2 font-semibold shadow-sm" size="lg">
                                                <Zap className="h-4 w-4 fill-current" />
                                                Evoluir Paciente
                                            </Button>
                                        </NavigatingLink>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                        Mostrando <strong>{patients?.length || 0}</strong> de <strong>{count}</strong> resultados
                    </div>
                    <div className="flex gap-2">
                        <Link href={{ query: { ...searchParams, page: page > 1 ? page - 1 : 1 } }}>
                            <Button variant="outline" size="sm" disabled={page <= 1}>
                                Anterior
                            </Button>
                        </Link>
                        <Link href={{ query: { ...searchParams, page: page < totalPages ? page + 1 : totalPages } }}>
                            <Button variant="outline" size="sm" disabled={page >= totalPages}>
                                Próximo
                            </Button>
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
