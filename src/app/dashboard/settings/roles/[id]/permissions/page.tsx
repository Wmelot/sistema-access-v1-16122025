import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { PermissionsMatrix } from '@/components/permissions/PermissionsMatrix'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function RolePermissionsPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()

    // Get role details
    const { data: role, error } = await supabase
        .from('roles')
        .select('id, name, description')
        .eq('id', id)
        .single()

    if (error || !role) {
        notFound()
    }

    return (
        <div className="container mx-auto py-10 max-w-7xl">
            <div className="mb-6">
                <Link href="/dashboard/settings/roles">
                    <Button variant="ghost" size="sm" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Voltar para Perfis
                    </Button>
                </Link>
            </div>

            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">
                    Permissões: {role.name}
                </h1>
                {role.description && (
                    <p className="text-muted-foreground mt-2">
                        {role.description}
                    </p>
                )}
            </div>

            <PermissionsMatrix roleId={role.id} roleName={role.name} />
        </div>
    )
}
