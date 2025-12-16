"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit2, Trash2, Key } from "lucide-react"
import { RoleFormDialog } from "./role-form-dialog"
import { deleteRole } from "./actions"
import { toast } from "sonner"
import { DeleteWithPassword } from "@/components/ui/delete-with-password"

interface RolesListProps {
    roles: any[]
    allPermissions: any[]
}

export function RolesList({ roles, allPermissions }: RolesListProps) {



    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nome do Perfil</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="w-[100px] text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {roles.map((role) => (
                        <TableRow key={role.id}>
                            <TableCell className="font-medium flex items-center gap-2">
                                <Key className="h-4 w-4 text-muted-foreground" />
                                {role.name}
                                {role.is_system && <Badge variant="secondary" className="ml-2 text-[10px]">Sistema</Badge>}
                            </TableCell>
                            <TableCell className="text-muted-foreground">{role.description}</TableCell>
                            <TableCell className="text-right flex justify-end gap-2">
                                <RoleFormDialog
                                    role={role}
                                    allPermissions={allPermissions}
                                    trigger={
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                    }
                                />
                                {!role.is_system && (
                                    <DeleteWithPassword
                                        id={role.id}
                                        onDelete={deleteRole}
                                        description={`Tem certeza que deseja apagar o perfil "${role.name}"? Certifique-se de que não há usuários vinculados.`}
                                    />
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                    {roles.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center">
                                Nenhum perfil encontrado.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
