import Link from "next/link"
import { MoreHorizontal, Plus } from "lucide-react"

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

import { getPatients } from "./actions"
import { AlphabetFilter } from "./components/alphabet-filter"
import { SearchInput } from "./components/search-input"
import { PatientActions } from "./components/patient-actions"

export default async function PatientsPage({
    searchParams,
}: {
    searchParams: { letter?: string; query?: string }
}) {
    const patients = await getPatients(searchParams)

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-lg font-semibold md:text-2xl">Pacientes</h1>
                <Link href="/dashboard/patients/new">
                    <Button size="sm" className="h-8 gap-1">
                        <Plus className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
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
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>CPF</TableHead>
                                <TableHead className="hidden md:table-cell">
                                    Telefone
                                </TableHead>
                                <TableHead className="hidden md:table-cell">
                                    Última Consulta
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
                                            <Link href={`/dashboard/patients/${patient.id}`} className="hover:underline">
                                                {patient.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell>{patient.cpf || 'N/A'}</TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            {patient.phone || '-'}
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            {/* Placeholder for last appointment */}
                                            -
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Link href={`/dashboard/schedule?openDialog=true&patientId=${patient.id}&patientName=${encodeURIComponent(patient.name)}`}>
                                                    <Button size="icon" variant="ghost" title="Novo Agendamento">
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <PatientActions patientId={patient.id} patientName={patient.name} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter>
                    <div className="text-xs text-muted-foreground">
                        Mostrando <strong>{patients?.length || 0}</strong> resultados
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
