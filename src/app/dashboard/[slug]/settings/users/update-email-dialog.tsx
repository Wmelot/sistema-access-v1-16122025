'use client';

import { useState } from 'react';
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
import { toast } from 'sonner';
import { updateUserEmail } from './actions';

interface UpdateEmailDialogProps {
    user: any | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UpdateEmailDialog({ user, open, onOpenChange }: UpdateEmailDialogProps) {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;

        const res = await updateUserEmail(user.id, email);

        if (res.success) {
            toast.success('Email atualizado com sucesso!');
            onOpenChange(false);
            window.location.reload(); // Reload to refresh list
        } else {
            toast.error(res.error || 'Erro ao atualizar email.');
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Alterar Email de Acesso</DialogTitle>
                </DialogHeader>
                <div className="text-sm text-muted-foreground mb-2">
                    Alterando email para: <span className="font-semibold text-primary">{user?.email}</span>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Novo Email *</Label>
                        <Input
                            name="email"
                            type="email"
                            required
                            defaultValue={user?.email || ''}
                            placeholder="novo@email.com"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Salvando...' : 'Salvar Novo Email'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
