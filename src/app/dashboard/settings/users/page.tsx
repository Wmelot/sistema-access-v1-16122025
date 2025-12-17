'use client';

import { useState } from 'react';
import { UsersList } from './users-list';
import { CreateUserDialog } from './create-user-dialog';
import { ResetPasswordDialog } from './reset-password-dialog';
import { UpdateEmailDialog } from './update-email-dialog';
import { Separator } from '@/components/ui/separator';

export default function UsersPage() {
    const [passwordUser, setPasswordUser] = useState<any>(null);
    const [emailUser, setEmailUser] = useState<any>(null);

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

            <UsersList
                onEditPassword={(user) => setPasswordUser(user)}
                onEditEmail={(user) => setEmailUser(user)}
            />

            <ResetPasswordDialog
                user={passwordUser}
                open={!!passwordUser}
                onOpenChange={(open) => !open && setPasswordUser(null)}
            />

            <UpdateEmailDialog
                user={emailUser}
                open={!!emailUser}
                onOpenChange={(open) => !open && setEmailUser(null)}
            />
        </div>
    );
}
