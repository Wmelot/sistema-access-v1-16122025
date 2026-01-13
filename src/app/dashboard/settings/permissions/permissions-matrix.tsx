"use client"

import { useState } from "react"
import { Check, Shield, X, Loader2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { toggleRolePermission } from "../roles/actions"
import { useRouter } from "next/navigation"

interface PermissionsMatrixProps {
    roles: any[]
    permissions: any[]
    initialRolePerms: any[]
}

export function PermissionsMatrix({ roles, permissions, initialRolePerms }: PermissionsMatrixProps) {
    const router = useRouter()
    const [loading, setLoading] = useState<string | null>(null) // "roleId-permId"

    // Local state for optimistic updates could be complex, but for now we rely on server revalidation or local state override.
    // Let's use simple local state that mimics DB.
    const [rolePerms, setRolePerms] = useState<any[]>(initialRolePerms)

    const hasPerm = (roleId: string, permId: string) => {
        return rolePerms.some(rp => rp.role_id === roleId && rp.permission_id === permId)
    }

    const handleToggle = async (roleId: string, permId: string) => {
        if (loading) return // Prevent spamming
        const key = `${roleId}-${permId}`
        setLoading(key)

        const isGranted = hasPerm(roleId, permId)
        const newState = !isGranted

        // Optimistic Update
        setRolePerms(prev => {
            if (newState) {
                return [...prev, { role_id: roleId, permission_id: permId }]
            } else {
                return prev.filter(rp => !(rp.role_id === roleId && rp.permission_id === permId))
            }
        })

        try {
            const result = await toggleRolePermission(roleId, permId, newState)
            if (result.error) {
                toast.error(result.error)
                // Revert
                setRolePerms(prev => {
                    if (newState) { // Was trying to grant, so remove
                        return prev.filter(rp => !(rp.role_id === roleId && rp.permission_id === permId))
                    } else { // Was trying to revoke, so add back
                        return [...prev, { role_id: roleId, permission_id: permId }]
                    }
                })
            } else {
                // Success - toast might be annoying for every click, let's keep it silent or subtle
                // toast.success(newState ? "Permissão concedida" : "Permissão removida")
                router.refresh()
            }
        } catch (err) {
            toast.error("Erro de conexão")
            // Revert
            setRolePerms(prev => {
                if (newState) {
                    return prev.filter(rp => !(rp.role_id === roleId && rp.permission_id === permId))
                } else {
                    return [...prev, { role_id: roleId, permission_id: permId }]
                }
            })
        } finally {
            setLoading(null)
        }
    }

    // Group permissions by module
    const permissionsByModule = permissions.reduce((acc, perm) => {
        const mod = perm.module || 'Geral'
        if (!acc[mod]) acc[mod] = []
        acc[mod].push(perm)
        return acc
    }, {} as Record<string, typeof permissions>)

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Tabela de Acesso
                </CardTitle>
                <CardDescription>
                    Clique nos ícones para conceder ou remover permissões. Alterações são salvas automaticamente.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[300px]">Permissão / Ação</TableHead>
                                {roles.map(role => (
                                    <TableHead key={role.id} className="text-center bg-muted/30 min-w-[100px]">
                                        <div className="flex flex-col items-center">
                                            <span className="font-semibold text-foreground">{role.name}</span>
                                        </div>
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Object.entries(permissionsByModule).map(([moduleName, perms]) => (
                                <>
                                    <TableRow key={`module-${moduleName}`} className="bg-muted/50 hover:bg-muted/50">
                                        <TableCell colSpan={roles.length + 1} className="font-semibold py-2">
                                            {moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}
                                        </TableCell>
                                    </TableRow>
                                    {(perms as any[]).map((perm) => (
                                        <TableRow key={perm.id}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{perm.description}</span>
                                                    <code className="text-[10px] text-muted-foreground">{perm.code}</code>
                                                </div>
                                            </TableCell>
                                            {roles.map(role => {
                                                const active = hasPerm(role.id, perm.id)
                                                const isLoading = loading === `${role.id}-${perm.id}`

                                                return (
                                                    <TableCell
                                                        key={`${role.id}-${perm.id}`}
                                                        className="text-center cursor-pointer hover:bg-muted/50 transition-colors"
                                                        onClick={() => handleToggle(role.id, perm.id)}
                                                    >
                                                        {isLoading ? (
                                                            <div className="flex justify-center">
                                                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                            </div>
                                                        ) : active ? (
                                                            <div className="flex justify-center group">
                                                                <div className="bg-green-100 text-green-700 p-1 rounded-full group-hover:bg-red-100 group-hover:text-red-700 transition-colors">
                                                                    <Check className="h-4 w-4 group-hover:hidden" />
                                                                    <X className="h-4 w-4 hidden group-hover:block" />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex justify-center opacity-20 hover:opacity-100 group">
                                                                <div className="p-1 group-hover:bg-green-100 group-hover:text-green-700 rounded-full transition-all">
                                                                    <X className="h-4 w-4 group-hover:hidden" />
                                                                    <Check className="h-4 w-4 hidden group-hover:block" />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                )
                                            })}
                                        </TableRow>
                                    ))}
                                </>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
