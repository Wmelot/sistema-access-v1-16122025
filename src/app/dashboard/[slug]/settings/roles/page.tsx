import { getRoles, getAllPermissions } from './actions';
import { RolesList } from './roles-list';
import { RoleFormDialog } from './role-form-dialog';
import { Button } from '@/components/ui/button';
import { Table2 } from 'lucide-react';
import Link from 'next/link';

export default async function RolesSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const roles = await getRoles(slug) || [];
    const allPermissions = await getAllPermissions() || [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Perfis de Acesso</h2>
                    <p className="text-muted-foreground text-sm">Gerencie quem pode fazer o que no sistema.</p>
                </div>
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
            </div>

            <RolesList roles={roles} allPermissions={allPermissions} />
        </div>
    );
}
