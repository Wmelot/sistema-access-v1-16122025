import { createAdminClient } from "@/lib/supabase/admin"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { PermissionsMatrix } from "./permissions-matrix"

export default async function PermissionsMatrixPage() {
    const supabase = await createAdminClient()

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

    return (
        <div className="space-y-6 container mx-auto py-10 max-w-6xl">
            <div className="flex items-center gap-4">
                <Button variant="ghost" className="gap-2" asChild>
                    <Link href="/dashboard/settings?tab=roles">
                        <ArrowLeft className="h-4 w-4" />
                        Voltar
                    </Link>
                </Button>
                <div>
                    <h3 className="text-lg font-medium">Matriz de Permissões</h3>
                    <p className="text-sm text-muted-foreground">
                        Visualização e edição rápida de acesso por cargo.
                    </p>
                </div>
            </div>

            <PermissionsMatrix
                roles={roles}
                permissions={permissions}
                initialRolePerms={rolePerms}
            />
        </div>
    )
}

