import { getAllPermissions, getRoles } from "./actions"
import { RolesList } from "./roles-list"
import { RoleFormDialog } from "./role-form-dialog"
import { hasPermission } from "@/lib/rbac"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { ArrowLeft, LayoutGrid } from "lucide-react"
import Link from "next/link"

export default async function RolesPage(props: { params: Promise<{ slug: string }> }) {
    const { slug } = await props.params

    const canManage = await hasPermission('roles.manage')

    // DEBUG: Diagnose why user is redirected
    const supabase = await createClient() // Create client to fetch debug info
    const { data: { user } } = await supabase.auth.getUser()
    // @ts-ignore
    const { data: profile } = await supabase.from('profiles').select('*, role_id(name)').eq('id', user?.id!).single()
    // @ts-ignore
    const { data: rolePerms } = await supabase.from('role_permissions').select('permissions(code)').eq('role_id', profile?.role_id?.id || profile?.role_id)
    const codes = rolePerms?.map((p: any) => p.permissions?.code) || []

    if (!canManage) {
        redirect(`/dashboard/${slug}`)
    }

    const roles = await getRoles(slug)
    const permissions = await getAllPermissions()

    return (
        <div className="container mx-auto py-10 max-w-5xl">
            <div className="mb-6">
                <Link href={`/dashboard/${slug}/settings`}>
                    <Button variant="ghost" size="sm" className="gap-2 px-0 sm:px-3 text-slate-500 hover:text-slate-900">
                        <ArrowLeft className="h-5 w-5 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Voltar para Configurações</span>
                    </Button>
                </Link>
            </div>

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Perfis de Acesso</h1>
                    <p className="text-muted-foreground">
                        Gerencie os níveis de acesso e o que cada função pode realizar no sistema.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href={`/dashboard/${slug}/settings/permissions`}>
                        <Button variant="outline" className="gap-2">
                            <LayoutGrid className="h-4 w-4" />
                            Ver Matriz
                        </Button>
                    </Link>
                    {canManage && <RoleFormDialog allPermissions={permissions} />}
                </div>
            </div>

            <RolesList roles={roles || []} allPermissions={permissions || []} />
        </div>
    )
}

