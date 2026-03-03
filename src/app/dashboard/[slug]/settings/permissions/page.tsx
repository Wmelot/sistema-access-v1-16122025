import { createAdminClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Shield, LayoutGrid, Info, Key } from "lucide-react"
import { PermissionsMatrix } from "./permissions-matrix"
import { getActiveOrgId } from "@/lib/auth-actions-utils"

export default async function PermissionsMatrixPage({ params }: { params: { slug: string } }) {
    const { slug } = params
    const supabase = await createAdminClient()

    // 1. Resolve Org ID
    let orgId = null
    try {
        const resolved = await getActiveOrgId(slug)
        orgId = resolved.orgId
    } catch (e) {
        console.error("PermissionsMatrixPage: Org resolve error:", e)
    }

    if (!orgId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-white rounded-xl border border-dashed border-slate-200">
                <Shield className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-900">Configuração Pendente</h3>
                <p className="text-slate-500 text-center max-w-md mt-2">
                    Não foi possível identificar a organização "{slug}". Certifique-se de que você está acessando através do link correto da sua clínica.
                </p>
                <a
                    href={`/dashboard`}
                    className="mt-6 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold"
                >
                    Voltar para o Início
                </a>
            </div>
        )
    }

    // Fetch Data
    const { data: roles } = await supabase
        .from('roles')
        .select(`
            *,
            permissions:role_permissions(
                code:permissions(code)
            )
        `)
        .eq('organization_id', orgId)

    const { data: permissions } = await supabase
        .from('permissions')
        .select('*')
        .order('module', { ascending: true })

    // 3. Get role permissions ONLY for the roles of this organization
    const roleIds = roles?.map(r => r.id) || []
    const { data: allRolePerms } = await supabase
        .from('role_permissions')
        .select('role_id, permission_id')
        .in('role_id', roleIds)

    return (
        <div className="container mx-auto py-10 max-w-7xl">
            <div className="mb-8 flex items-center justify-between">
                <div className="space-y-1">
                    <Link href={`/dashboard/${slug}/settings?tab=roles`}>
                        <Button variant="ghost" size="sm" className="gap-2 -ml-2 text-slate-500">
                            <ArrowLeft className="h-4 w-4" />
                            Voltar para Perfis
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight mt-2">Matriz de Acessos</h1>
                    <p className="text-muted-foreground">
                        Visão consolidada de permissões por perfil.
                    </p>
                </div>
            </div>

            <PermissionsMatrix
                roles={roles || []}
                permissions={permissions || []}
                initialRolePerms={allRolePerms || []}
            />
        </div>
    )
}
