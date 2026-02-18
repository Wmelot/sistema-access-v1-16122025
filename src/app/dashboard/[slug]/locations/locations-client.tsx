"use client"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Trash2, Edit } from "lucide-react"
import { LocationsDialog } from "@/components/settings/LocationsDialog"
import { useState } from "react"
import { deleteLocation, toggleLocationStatus } from "./actions"
import { toast } from "sonner"
import { DeleteWithPassword } from "@/components/ui/delete-with-password"
import { ManagementHeader } from "@/components/dashboard/management-header"

export function LocationsClient({ locations, slug }: { locations: any[], slug: string }) {
    const [editingLocation, setEditingLocation] = useState<any>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const dashboardPrefix = `/dashboard/${slug}`

    return (
        <div className="flex flex-col gap-4">
            <ManagementHeader
                slug={slug}
                title="Locais de Atendimento"
                description="Gerencie onde os atendimentos podem ocorrer e a capacidade de cada local."
            >
                <LocationsDialog />
            </ManagementHeader>
            <Card className="border-none shadow-none bg-transparent sm:border sm:shadow-sm sm:bg-white">
                <CardHeader className="hidden sm:block">
                    <CardTitle>Salas e Espaços</CardTitle>
                    <CardDescription>
                        Gerencie onde os atendimentos podem ocorrer e a capacidade de cada local.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0 sm:p-6">
                    {/* Desktop View */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Cor</TableHead>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Capacidade Máxima</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {locations.map((loc) => (
                                    <TableRow key={loc.id} className={!loc.active ? "opacity-60 bg-muted/50" : ""}>
                                        <TableCell>
                                            <div className="h-4 w-4 rounded-full" style={{ backgroundColor: loc.color }} />
                                        </TableCell>
                                        <TableCell className="font-medium">{loc.name}</TableCell>
                                        <TableCell>{loc.capacity} paciente(s)</TableCell>
                                        <TableCell className="text-right flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    setEditingLocation(loc)
                                                    setIsDialogOpen(true)
                                                }}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>

                                            <DeleteWithPassword
                                                id={loc.id}
                                                onDelete={deleteLocation}
                                                description={`Tem certeza que deseja excluir o local "${loc.name}"?`}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {locations.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            Nenhum local cadastrado.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden space-y-4">
                        {locations.length === 0 && (
                            <div className="text-center py-10 text-slate-400 bg-white border-2 border-dashed rounded-xl">
                                Nenhum local cadastrado.
                            </div>
                        )}
                        {locations.map((loc) => (
                            <Card key={loc.id} className="overflow-hidden border-slate-200 shadow-sm">
                                <div className="p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-4 w-4 rounded-full shadow-sm border border-black/5" style={{ backgroundColor: loc.color }} />
                                            <h4 className="font-bold text-slate-900">{loc.name}</h4>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Capacidade</p>
                                            <p className="text-xs font-bold text-slate-600 mt-1">{loc.capacity} paciente(s)</p>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-9 gap-2 text-slate-600 hover:bg-slate-50 font-bold text-xs"
                                            onClick={() => {
                                                setEditingLocation(loc)
                                                setIsDialogOpen(true)
                                            }}
                                        >
                                            <Edit className="h-3.5 w-3.5" />
                                            EDITAR
                                        </Button>

                                        <DeleteWithPassword
                                            id={loc.id}
                                            onDelete={deleteLocation}
                                            description={`Tem certeza que deseja excluir o local "${loc.name}"?`}
                                        />
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Edit Dialog - Managed here to pass specific location data */}
            <LocationsDialog
                open={isDialogOpen}
                onOpenChange={(open) => {
                    setIsDialogOpen(open)
                    if (!open) setEditingLocation(null)
                }}
                initialData={editingLocation}
                trigger={<span className="hidden"></span>} // Hidden trigger since we control open state
            />
        </div>
    )
}
