'use client';

import { UsersList } from './users-list';
import { CreateUserDialog } from './create-user-dialog';
import { Separator } from '@/components/ui/separator';

export default function UsersPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Gerenciamento de Usuários</h3>
                    <p className="text-sm text-muted-foreground">
                        Crie e gerencie os logins de acesso ao sistema.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <CreateUserDialog onUserCreated={() => { window.location.reload(); }} />
                </div>
            </div>
            <Separator />

            <UsersList />
        </div>
    );
}
