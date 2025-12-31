'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Switch } from "@/components/ui/switch";
import { updateFormSettings } from '../actions';
import { toast } from 'sonner';
import { Check, Shield, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FormSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    templateId: string;
    initialActive: boolean;
    initialAllowedRoles: string[];
    professionals: any[];
}

export function FormSettingsDialog({
    open,
    onOpenChange,
    templateId,
    initialActive,
    initialAllowedRoles,
    professionals
}: FormSettingsDialogProps) {
    const [loading, setLoading] = useState(false);
    const [isActive, setIsActive] = useState(initialActive);
    const [allowedRoles, setAllowedRoles] = useState<string[]>(initialAllowedRoles || []);

    const handleSave = async () => {
        setLoading(true);
        const res = await updateFormSettings(templateId, {
            is_active: isActive,
            allowed_roles: allowedRoles
        });
        setLoading(false);

        if (res.success) {
            toast.success("Configurações salvas com sucesso!");
            onOpenChange(false);
        } else {
            toast.error(res.error || "Erro ao salvar configurações.");
        }
    };

    const toggleRole = (userId: string) => {
        setAllowedRoles(prev => {
            const current = prev || [];
            if (current.includes(userId)) {
                return current.filter(id => id !== userId);
            } else {
                return [...current, userId];
            }
        });
    };

    const isAllSelected = (allowedRoles || []).length === 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Configurações de Visibilidade</DialogTitle>
                    <DialogDescription>
                        Controle quem pode ver e usar este formulário.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Status Toggle */}
                    <div className="flex items-center justify-between space-x-2 border p-4 rounded-lg bg-muted/20">
                        <div className="space-y-0.5">
                            <Label className="text-base font-medium">Status do Formulário</Label>
                            <p className="text-sm text-muted-foreground">
                                Se desativado, o formulário não aparecerá para novas evoluções.
                            </p>
                        </div>
                        <Switch
                            checked={isActive}
                            onCheckedChange={setIsActive}
                        />
                    </div>

                    {/* Permissions Section */}
                    <div className="space-y-3">
                        <Label className="text-base font-medium flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Acesso por Profissional
                        </Label>
                        <p className="text-sm text-muted-foreground -mt-2 mb-2">
                            Selecione quem pode visualizar este formulário. Deixe vazio para permitir todos.
                        </p>

                        <div className="border rounded-md">
                            <div
                                className={`flex items-center justify-between p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${isAllSelected ? 'bg-primary/5' : ''}`}
                                onClick={() => setAllowedRoles([])}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center border ${isAllSelected ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-input'}`}>
                                        <Users className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">Todos os Profissionais</p>
                                        <p className="text-xs text-muted-foreground">Acesso público</p>
                                    </div>
                                </div>
                                {isAllSelected && <Check className="h-4 w-4 text-primary" />}
                            </div>

                            <ScrollArea className="h-[240px]">
                                {professionals.map(pro => {
                                    const isSelected = (allowedRoles || []).includes(pro.id);
                                    return (
                                        <div
                                            key={pro.id}
                                            className={`flex items-center justify-between p-3 border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}
                                            onClick={() => toggleRole(pro.id)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`h-8 w-8 rounded-full flex items-center justify-center border ${isSelected ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-input'}`}>
                                                    {pro.photo_url ? (
                                                        <img src={pro.photo_url} alt="" className="h-full w-full rounded-full object-cover" />
                                                    ) : (
                                                        <span className="text-xs font-bold">{pro.full_name?.charAt(0) || 'P'}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{pro.full_name}</p>
                                                    <p className="text-xs text-muted-foreground">{pro.specialty || 'Profissional'}</p>
                                                </div>
                                            </div>
                                            {isSelected && <Check className="h-4 w-4 text-primary" />}
                                        </div>
                                    );
                                })}
                            </ScrollArea>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
