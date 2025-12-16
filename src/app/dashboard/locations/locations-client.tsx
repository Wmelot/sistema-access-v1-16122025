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
import { Switch } from "@/components/ui/switch"
import { DeleteWithPassword } from "@/components/ui/delete-with-password"

export function LocationsClient({ locations }: { locations: any[] }) {
    const [editingLocation, setEditingLocation] = useState<any>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)




    // Old handleDelete removed here. Using component directly.

    async function handleToggle(id: string, currentStatus: boolean) {
        const res = await toggleLocationStatus(id, currentStatus)
        if (res?.error) {
            toast.error("Erro ao atualizar status.")
        } else {
            toast.success(currentStatus ? "Local desativado." : "Local ativado.")
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Locais de Atendimento</h1>
                <LocationsDialog />
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Salas e Espaços</CardTitle>
                    <CardDescription>
                        Gerencie onde os atendimentos podem ocorrer e a capacidade de cada local.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Cor</TableHead>
                                <TableHead>Nome</TableHead>
                                <TableHead>Capacidade Máxima</TableHead>
                                <TableHead>Status</TableHead>
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
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={loc.active !== false} // Default true
                                                onCheckedChange={() => handleToggle(loc.id, loc.active !== false)}
                                            />
                                            <span className="text-sm text-muted-foreground">
                                                {loc.active !== false ? "Ativo" : "Inativo"}
                                            </span>
                                        </div>
                                    </TableCell>
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
