'use client';

import { UsersList } from './users-list';
import { CreateUserDialog } from './create-user-dialog';
import { Separator } from '@/components/ui/separator';
import { useParams } from 'next/navigation';
import { ManagementHeader } from '@/components/dashboard/management-header';

export default function UsersPage() {
    const params = useParams();
    const slug = params?.slug as string;

    return (
        <div className="space-y-6">
            <ManagementHeader
                slug={slug}
                title="Gerenciamento de Usuários"
                description="Crie e gerencie os logins de acesso ao sistema."
            >
                <div className="w-full sm:w-auto">
                    <CreateUserDialog onUserCreated={() => { window.location.reload(); }} />
                </div>
            </ManagementHeader>
            <Separator className="bg-slate-100" />

            <UsersList slug={slug} />
        </div>
    );
}
