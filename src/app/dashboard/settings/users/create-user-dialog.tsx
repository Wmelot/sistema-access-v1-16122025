'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { createUser } from './actions';

export function CreateUserDialog({ onUserCreated }: { onUserCreated: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const res = await createUser(formData);

        if (res.success) {
            toast.success('Usuário criado com sucesso!');
            setIsOpen(false);
            onUserCreated();
            (e.target as HTMLFormElement).reset();
        } else {
            toast.error(res.error || 'Erro ao criar usuário.');
        }
        setLoading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" /> Novo Usuário
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Criar Novo Usuário</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Nome Completo (Opcional)</Label>
                        <Input name="displayName" placeholder="Ex: João Silva" />
                    </div>

                    <div className="space-y-2">
                        <Label>Email *</Label>
                        <Input name="email" type="email" required placeholder="email@exemplo.com" />
                    </div>

                    <div className="space-y-2">
                        <Label>Senha *</Label>
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
                        <p className="text-[10px] text-muted-foreground">Mínimo 6 caracteres.</p>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Criando...' : 'Criar Usuário'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
