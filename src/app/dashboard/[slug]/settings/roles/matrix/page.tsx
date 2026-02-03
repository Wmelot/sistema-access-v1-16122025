import { getAllPermissions, getRoles } from "../actions"
import { Check, X } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function PermissionsMatrixPage() {
    const roles = await getRoles()
    const permissions = await getAllPermissions()

    // Group permissions by resource (prefix before dot)
    const groupedPermissions = permissions.reduce((acc: any, perm: any) => {
        const resource = perm.code.split('.')[0]
        if (!acc[resource]) acc[resource] = []
        acc[resource].push(perm)
        return acc
    }, {})

    return (
        <div className="container mx-auto py-10 max-w-6xl">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Matriz de Permissões</h1>
            <p className="text-muted-foreground mb-8">
                Visualização detalhada de todas as permissões por perfil de acesso.
            </p>

            <div className="space-y-8">
                {Object.entries(groupedPermissions).map(([resource, perms]: [string, any]) => (
                    <Card key={resource}>
                        <CardHeader className="pb-4">
                            <CardTitle className="capitalize">{resource}</CardTitle>
                            <CardDescription>Permissões relacionadas a {resource}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[300px]">Permissão</TableHead>
                                        <TableHead>Código</TableHead>
                                        {roles.map((role: any) => (
                                            <TableHead key={role.id} className="text-center w-[100px]">{role.name}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {perms.map((perm: any) => (
                                        <TableRow key={perm.id}>
                                            <TableCell className="font-medium">{perm.description}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground font-mono">{perm.code}</TableCell>
                                            {roles.map((role: any) => {
                                                const hasPerm = role.permissions.some((p: any) => p.code === perm.code)
                                                return (
                                                    <TableCell key={role.id} className="text-center">
                                                        {hasPerm ? (
                                                            <div className="flex justify-center">
                                                                <Check className="h-4 w-4 text-green-600" />
                                                            </div>
                                                        ) : (
                                                            <div className="flex justify-center">
                                                                <X className="h-4 w-4 text-slate-200" />
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                )
                                            })}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
