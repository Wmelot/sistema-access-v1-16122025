'use client';

import { useState, useEffect } from 'react';
import { listAllUsers, deleteUser } from './actions';
import { Button } from '@/components/ui/button';
import { Trash2, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
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
            toast.error(res.error || 'Erro ao listar usuários.');
        }
        setLoading(false);
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleDelete = async (userId: string) => {
        const result = await MySwal.fire({
            title: 'Excluir Usuário?',
            text: "Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Sim, excluir',
            cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) return;

        const res = await deleteUser(userId);
        if (res.success) {
            toast.success('Usuário excluído.');
            loadUsers();
        } else {
            toast.error(res.error || 'Erro ao excluir.');
        }
    };

    return (
        <div className="space-y-4">
            {/* Desktop View */}
            <div className="hidden md:block border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="font-bold text-slate-700">Usuário</TableHead>
                            <TableHead className="font-bold text-slate-700">Perfil</TableHead>
                            <TableHead className="font-bold text-slate-700">Criado em</TableHead>
                            <TableHead className="font-bold text-slate-700">Último Login</TableHead>
                            <TableHead className="text-right font-bold text-slate-700">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-slate-400">Carregando...</TableCell>
                            </TableRow>
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-slate-400">Nenhum usuário encontrado.</TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id} className="hover:bg-slate-50 transition-colors">
                                    <TableCell className="py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900">{user.email}</span>
                                            <span className="text-xs text-slate-500">
                                                {user.user_metadata?.full_name || user.profile?.full_name || 'Sem nome'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="font-bold bg-slate-100 text-slate-600 border-slate-200 uppercase text-[10px]">
                                            {user.roleName}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-slate-600">{format(new Date(user.created_at), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell className="text-slate-500 text-xs">
                                        {user.last_sign_in_at ? format(new Date(user.last_sign_in_at), 'dd/MM/yyyy HH:mm') : '-'}
                                    </TableCell>
                                    <TableCell className="text-right py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-9 gap-2 border-slate-200 hover:bg-slate-50"
                                                onClick={() => setSelectedUser(user)}
                                            >
                                                <Settings2 className="h-4 w-4" />
                                                Gerenciar
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-9 w-9 text-rose-500 hover:bg-rose-50" title="Excluir" onClick={() => handleDelete(user.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-4">
                {loading ? (
                    <div className="p-10 text-center text-slate-400 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                        Carregando usuários...
                    </div>
                ) : users.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                        Nenhum usuário encontrado.
                    </div>
                ) : (
                    users.map((user) => (
                        <Card key={user.id} className="overflow-hidden border-slate-200 shadow-sm">
                            <div className="p-4 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-900 truncate">{user.email}</h4>
                                        <p className="text-xs text-slate-500 truncate mb-1">
                                            {user.user_metadata?.full_name || user.profile?.full_name || 'Sem nome'}
                                        </p>
                                        <Badge variant="secondary" className="font-bold bg-slate-100 text-slate-600 border-slate-200 uppercase text-[9px] h-5 tracking-wide">
                                            {user.roleName}
                                        </Badge>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Criado em</p>
                                        <p className="text-xs text-slate-600">{format(new Date(user.created_at), 'dd/MM/yyyy')}</p>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1 h-10 gap-2 border-slate-200 hover:bg-slate-50 text-xs font-bold"
                                        onClick={() => setSelectedUser(user)}
                                    >
                                        <Settings2 className="h-4 w-4" />
                                        GERENCIAR
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-10 w-10 text-rose-500 hover:bg-rose-50 shrink-0"
                                        onClick={() => handleDelete(user.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

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
