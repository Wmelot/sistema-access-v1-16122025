import { getRoles, getAllPermissions } from './actions';
import { RolesList } from './roles-list';
import { RoleFormDialog } from './role-form-dialog';
import { Button } from '@/components/ui/button';
import { Table2 } from 'lucide-react';
import Link from 'next/link';
import { ManagementHeader } from '@/components/dashboard/management-header';

export default async function RolesSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const roles = await getRoles(slug) || [];
    const allPermissions = await getAllPermissions() || [];

    return (
        <div className="space-y-6">
            <ManagementHeader
                slug={slug}
                title="Perfis de Acesso"
                description="Gerencie quem pode fazer o que no sistema."
            >
                <div className="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" asChild className="w-full sm:w-auto">
                        <Link href={`/dashboard/${slug}/settings/permissions`}>
                            <Table2 className="mr-2 h-4 w-4" />
                            Ver Matriz
                        </Link>
                    </Button>
                    <div className="w-full sm:w-auto">
                        <RoleFormDialog allPermissions={allPermissions} />
                    </div>
                </div>
            </ManagementHeader>

            <RolesList roles={roles} allPermissions={allPermissions} />
        </div>
    );
}
