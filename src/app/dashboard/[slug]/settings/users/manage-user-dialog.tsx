'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { updateUserPassword, updateUserProfile, assignUserRole } from './actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Lock, Shield } from 'lucide-react';

interface ManageUserDialogProps {
    user: any;
    availableRoles: any[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUserUpdated: () => void;
}

export function ManageUserDialog({ user, availableRoles, open, onOpenChange, onUserUpdated }: ManageUserDialogProps) {
    const [loading, setLoading] = useState(false);

    // Form States
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [selectedRole, setSelectedRole] = useState('');

    // Initialize states when dialog opens/user changes
    useEffect(() => {
        if (open && user) {
            setNewName(user.user_metadata?.full_name || user.profile?.full_name || '');
            setNewEmail(user.email || '');
            setSelectedRole(user.profile?.role_id || 'none');
            setNewPassword('');
        }
    }, [open, user]);

    const handleUpdateProfile = async () => {
        if (!newEmail) return;

        // Check if anything changed
        const currentName = user.user_metadata?.full_name || user.profile?.full_name || '';
        if (newEmail === user.email && newName === currentName) return;

        setLoading(true);
        const res = await updateUserProfile(user.id, {
            email: newEmail !== user.email ? newEmail : undefined,
            fullName: newName
        });

        if (res.success) {
            toast.success('Dados atualizados!');
            onUserUpdated();
        } else {
            toast.error(res.error || 'Erro ao atualizar dados');
        }
        setLoading(false);
    };

    const handleUpdatePassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            toast.error('A senha deve ter pelo menos 6 caracteres');
            return;
        }
        setLoading(true);
        const res = await updateUserPassword(user.id, newPassword);
        if (res.success) {
            toast.success('Senha atualizada!');
            setNewPassword('');
        } else {
            toast.error(res.error || 'Erro ao atualizar senha');
        }
        setLoading(false);
    };

    const handleUpdateRole = async () => {
        if (!selectedRole) return;
        setLoading(true);
        const res = await assignUserRole(user.id, selectedRole);
        if (res.success) {
            toast.success('Perfil de acesso atualizado!');
            onUserUpdated();
        } else {
            toast.error(res.error || 'Erro ao atualizar perfil');
        }
        setLoading(false);
    };

    if (!user) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Gerenciar Usuário</DialogTitle>
                    <DialogDescription>
                        {user.email}
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="profile" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="profile">
                            <User className="h-4 w-4 mr-2" />
                            Dados
                        </TabsTrigger>
                        <TabsTrigger value="security">
                            <Lock className="h-4 w-4 mr-2" />
                            Senha
                        </TabsTrigger>
                        <TabsTrigger value="access">
                            <Shield className="h-4 w-4 mr-2" />
                            Acesso
                        </TabsTrigger>
                    </TabsList>

                    {/* TAB: PROFILE (Name & Email) */}
                    <TabsContent value="profile" className="space-y-4 py-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome Completo</Label>
                                <Input
                                    id="name"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Ex: Carlos Silva"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                />
                            </div>
                        </div>
                        <Button onClick={handleUpdateProfile} disabled={loading} className="w-full">
                            {loading ? 'Salvando...' : 'Atualizar Dados'}
                        </Button>
                    </TabsContent>

                    {/* TAB: SECURITY (Password) */}
                    <TabsContent value="security" className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Nova Senha</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="******"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Mínimo de 6 caracteres.</p>
                        </div>
                        <Button onClick={handleUpdatePassword} disabled={loading} className="w-full">
                            {loading ? 'Salvando...' : 'Redefinir Senha'}
                        </Button>
                    </TabsContent>

                    {/* TAB: ACCESS (Roles) */}
                    <TabsContent value="access" className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Perfil de Acesso</Label>
                            <Select value={selectedRole} onValueChange={setSelectedRole}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um perfil" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Sem Perfil</SelectItem>
                                    {availableRoles.map(role => (
                                        <SelectItem key={role.id} value={role.id}>
                                            {role.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Define as permissões que este usuário terá no sistema.
                            </p>
                        </div>
                        <Button onClick={handleUpdateRole} disabled={loading} className="w-full">
                            {loading ? 'Salvando...' : 'Atualizar Permissões'}
                        </Button>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
