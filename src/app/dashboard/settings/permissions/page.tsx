import { createClient } from "@/lib/supabase/server"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Shield, X, Lock } from "lucide-react"

export default async function PermissionsMatrixPage() {
    const supabase = await createClient()

    // Fetch Data
    const { data: roles } = await supabase
        .from('roles')
        .select('id, name, description')
        .neq('name', 'Master') // Hide Master as it has everything
        .order('name')

    const { data: permissions } = await supabase
        .from('permissions')
        .select('id, code, description, module')
        .order('module')
        .order('code')

    const { data: rolePerms } = await supabase
        .from('role_permissions')
        .select('role_id, permission_id')

    if (!roles || !permissions || !rolePerms) {
        return <div>Erro ao carregar permissões.</div>
    }

    // Helper to check permission
    const hasPerm = (roleId: string, permId: string) => {
        return rolePerms.some(rp => rp.role_id === roleId && rp.permission_id === permId)
    }

    // Group permissions by module
    const permissionsByModule = permissions.reduce((acc, perm) => {
        const mod = perm.module || 'Geral'
        if (!acc[mod]) acc[mod] = []
        acc[mod].push(perm)
        return acc
    }, {} as Record<string, typeof permissions>)

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Matriz de Permissões</h3>
                <p className="text-sm text-muted-foreground">
                    Visualização de o que cada cargo pode acessar no sistema.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Tabela de Acesso
                    </CardTitle>
                    <CardDescription>
                        Cargos "Master" têm acesso irrestrito e não são listados aqui por segurança.
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
                                                {/* <span className="text-xs font-normal text-muted-foreground">{role.description}</span> */}
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
                                        {perms.map((perm) => (
                                            <TableRow key={perm.id}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{perm.description}</span>
                                                        <code className="text-[10px] text-muted-foreground">{perm.code}</code>
                                                    </div>
                                                </TableCell>
                                                {roles.map(role => {
                                                    const active = hasPerm(role.id, perm.id)
                                                    return (
                                                        <TableCell key={`${role.id}-${perm.id}`} className="text-center">
                                                            {active ? (
                                                                <div className="flex justify-center">
                                                                    <div className="bg-green-100 text-green-700 p-1 rounded-full">
                                                                        <Check className="h-4 w-4" />
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex justify-center opacity-20">
                                                                    <div className="p-1">
                                                                        <X className="h-4 w-4" />
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
        </div>
    )
}
