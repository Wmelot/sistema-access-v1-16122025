'use client';

import { UsersList } from './users-list';
import { CreateUserDialog } from './create-user-dialog';
import { Separator } from '@/components/ui/separator';

export default function UsersPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold tracking-tight">Gerenciamento de Usuários</h3>
                    <p className="text-sm text-muted-foreground">
                        Crie e gerencie os logins de acesso ao sistema.
                    </p>
                </div>
                <div className="w-full sm:w-auto">
                    <CreateUserDialog onUserCreated={() => { window.location.reload(); }} />
                </div>
            </div>
            <Separator className="bg-slate-100" />

            <UsersList />
        </div>
    );
}
