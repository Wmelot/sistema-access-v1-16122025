'use client';

import { useState, useEffect } from 'react';
import { listAllUsers, deleteUser } from './actions';
import { Button } from '@/components/ui/button';
import { Trash2, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ManageUserDialog } from './manage-user-dialog';

export function UsersList() {
    const [users, setUsers] = useState<any[]>([]);
    const [availableRoles, setAvailableRoles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<any>(null);

    const loadUsers = async () => {
        setLoading(true);
        const res = await listAllUsers();
        if (res.success && res.users) {
            setUsers(res.users);
            setAvailableRoles(res.availableRoles || []);
        } else {
            toast.error('Erro ao listar usuários.');
        }
        setLoading(false);
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleDelete = async (userId: string) => {
        if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

        const res = await deleteUser(userId);
        if (res.success) {
            toast.success('Usuário excluído.');
            loadUsers();
        } else {
            toast.error(res.error || 'Erro ao excluir.');
        }
    };

    return (
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Perfil</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead>Último Login</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">Carregando...</TableCell>
                        </TableRow>
                    ) : users.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Nenhum usuário encontrado.</TableCell>
                        </TableRow>
                    ) : (
                        users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{user.email}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {user.user_metadata?.full_name || user.profile?.full_name || 'Sem nome'}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="font-normal">
                                        {user.roleName}
                                    </Badge>
                                </TableCell>
                                <TableCell>{format(new Date(user.created_at), 'dd/MM/yyyy')}</TableCell>
                                <TableCell>
                                    {user.last_sign_in_at ? format(new Date(user.last_sign_in_at), 'dd/MM/yyyy HH:mm') : '-'}
                                </TableCell>
                                <TableCell className="text-right gap-2 flex justify-end">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 gap-2"
                                        onClick={() => setSelectedUser(user)}
                                    >
                                        <Settings2 className="h-4 w-4" />
                                        Gerenciar
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" title="Excluir" onClick={() => handleDelete(user.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            <ManageUserDialog
                open={!!selectedUser}
                onOpenChange={(open) => !open && setSelectedUser(null)}
                user={selectedUser}
                availableRoles={availableRoles}
                onUserUpdated={() => {
                    setSelectedUser(null);
                    loadUsers();
                }}
            />
        </div>
    );
}
