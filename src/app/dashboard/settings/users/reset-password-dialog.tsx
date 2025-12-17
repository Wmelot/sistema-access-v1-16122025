'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { updateUserPassword } from './actions';

interface ResetPasswordDialogProps {
    user: any | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ResetPasswordDialog({ user, open, onOpenChange }: ResetPasswordDialogProps) {
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const password = formData.get('password') as string;

        const res = await updateUserPassword(user.id, password);

        if (res.success) {
            toast.success('Senha atualizada com sucesso!');
            onOpenChange(false);
            (e.target as HTMLFormElement).reset();
        } else {
            toast.error(res.error || 'Erro ao atualizar senha.');
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Redefinir Senha</DialogTitle>
                </DialogHeader>
                <div className="text-sm text-muted-foreground mb-2">
                    Alterando senha para: <span className="font-semibold text-primary">{user?.email}</span>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Nova Senha *</Label>
                        <div className="relative">
                            <Input
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                minLength={6}
                                placeholder="******"
                            />
                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="absolute right-0 top-0 h-full w-10 text-muted-foreground"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Salvando...' : 'Salvar Nova Senha'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
