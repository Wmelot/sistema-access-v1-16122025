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
import { Card } from "@/components/ui/card"
import { Edit2, Trash2, Key } from "lucide-react"
import { RoleFormDialog } from "./role-form-dialog"
import { deleteRole } from "./actions"
import { toast } from "sonner"
import { DeleteWithPassword } from "@/components/ui/delete-with-password"
import { useParams } from "next/navigation"

interface RolesListProps {
    roles: any[]
    allPermissions: any[]
}

export function RolesList({ roles, allPermissions }: RolesListProps) {
    const params = useParams()
    const slug = params.slug as string

    return (
        <div className="space-y-4">
            {/* Desktop View */}
            <div className="hidden md:block rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="font-bold text-slate-700">Nome do Perfil</TableHead>
                            <TableHead className="font-bold text-slate-700">Descrição</TableHead>
                            <TableHead className="w-[100px] text-right font-bold text-slate-700">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {roles.map((role) => (
                            <TableRow key={role.id} className="hover:bg-slate-50/50 transition-colors">
                                <TableCell className="font-medium py-4">
                                    <div className="flex items-center gap-2">
                                        <Key className="h-4 w-4 text-slate-400" />
                                        <span className="text-slate-900">{role.name}</span>
                                        {role.is_system && <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700 border-blue-100 font-medium">Sistema</Badge>}
                                    </div>
                                </TableCell>
                                <TableCell className="text-slate-500 text-sm">{role.description}</TableCell>
                                <TableCell className="text-right py-4">
                                    <div className="flex justify-end items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-9 gap-2 border-slate-200 hover:bg-slate-50 text-xs font-bold"
                                            onClick={() => window.location.href = `/dashboard/${slug}/settings/roles/${role.id}/permissions`}
                                        >
                                            <Key className="h-3.5 w-3.5 text-blue-600" />
                                            Permissões
                                        </Button>
                                        <RoleFormDialog
                                            role={role}
                                            allPermissions={allPermissions}
                                            trigger={
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-slate-900">
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
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {roles.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="h-32 text-center text-slate-400">
                                    Nenhum perfil encontrado.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-4">
                {roles.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                        Nenhum perfil encontrado.
                    </div>
                ) : (
                    roles.map((role) => (
                        <Card key={role.id} className="overflow-hidden border-slate-200 shadow-sm">
                            <div className="p-4 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-slate-900 truncate">{role.name}</h4>
                                            {role.is_system && <Badge className="text-[9px] bg-blue-50 text-blue-700 border-blue-100 font-medium h-5">Sistema</Badge>}
                                        </div>
                                        <p className="text-xs text-slate-500 leading-snug line-clamp-2">
                                            {role.description || "Sem descrição definida."}
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded-lg shrink-0">
                                        <Key className="h-4 w-4 text-slate-400" />
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 h-10 gap-2 border-slate-200 hover:bg-slate-50 text-xs font-bold"
                                        onClick={() => window.location.href = `/dashboard/${slug}/settings/roles/${role.id}/permissions`}
                                    >
                                        <Key className="h-3.5 w-3.5 text-blue-600" />
                                        PERMISSÕES
                                    </Button>

                                    <div className="flex items-center gap-1">
                                        <RoleFormDialog
                                            role={role}
                                            allPermissions={allPermissions}
                                            trigger={
                                                <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400">
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
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
