import { getAllPermissions, getRoles } from "./actions"
import { RolesList } from "./roles-list"
import { RoleFormDialog } from "./role-form-dialog"
import { hasPermission } from "@/lib/rbac"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function RolesPage() {
    const canManage = await hasPermission('roles.manage')

    // DEBUG: Diagnose why user is redirected
    const supabase = await createClient() // Create client to fetch debug info
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('*, role_id(name)').eq('id', user?.id).single()
    const { data: rolePerms } = await supabase.from('role_permissions').select('permissions(code)').eq('role_id', profile?.role_id?.id || profile?.role_id)
    const codes = rolePerms?.map((p: any) => p.permissions?.code) || []

    /* 
    if (!canManage) {
        // Fallback or redirect
        redirect('/dashboard') // Or show "Unauthorized" component
    }
    */

    if (!canManage) {
        redirect('/dashboard')
    }

    const roles = await getRoles()
    const permissions = await getAllPermissions()

    return (
        <div className="container mx-auto py-10 max-w-5xl">


            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Perfis de Acesso</h1>
                    <p className="text-muted-foreground">
                        Gerencie os níveis de acesso e o que cada função pode realizar no sistema.
                    </p>
                </div>
                {canManage && <RoleFormDialog allPermissions={permissions} />}
            </div>

            <RolesList roles={roles || []} allPermissions={permissions || []} />
        </div>
    )
}
