"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Copy, Trash2, Loader2, Edit3, Settings, Power, Move } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { duplicateFormTemplate, deleteFormTemplate, updateFormTemplateTitle, updateFormSettings, updateFormCategory } from '../actions';
import { toast } from 'sonner';

import { ConfirmDeleteDialog } from '@/components/common/confirm-delete-dialog';
import { FormSettingsDialog } from './form-settings-dialog';

interface FormCardActionsProps {
    templateId: string;
    templateTitle?: string;
    isActive: boolean;
    allowedRoles: string[];
    professionals: any[];
    userId?: string | null;
    currentUserId?: string;
    isStandard?: boolean; // [NEW]
    category?: string | null; // [NEW]
}

const CATEGORIES_LIST = [
    "Coluna Vertebral",
    "Membro Superior",
    "Membro Inferior",
    "Saúde da Mulher & Pélvica",
    "Dor & Funcionalidade Global",
    "Pé Insensível (Neuropático)",
    "Outros"
];

export function FormCardActions({
    templateId,
    templateTitle,
    isActive,
    allowedRoles,
    professionals,
    userId,
    currentUserId,
    isStandard = false,
    category
}: FormCardActionsProps) {
    const [loading, setLoading] = useState(false);
    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isMoveOpen, setIsMoveOpen] = useState(false);
    const [newTitle, setNewTitle] = useState(templateTitle || '');
    const [selectedCategory, setSelectedCategory] = useState(category || 'Outros');

    const isOwner = !userId || (currentUserId === userId);

    // Standard forms are LOCKED for editing/renaming/deleting in the UI
    const isLocked = isStandard;

    const handleDuplicate = async () => {
        setLoading(true);
        const res = await duplicateFormTemplate(templateId);
        setLoading(false);

        if (res.success) {
            toast.success("Modelo duplicado com sucesso!");
        } else {
            toast.error(res.message);
        }
    };

    const handleDelete = async (password: string) => {
        if (isLocked) {
            toast.error("Modelos padrão não podem ser excluídos.");
            return;
        }
        if (!isOwner) {
            toast.error("Apenas o criador pode excluir.");
            return;
        }
        const res = await deleteFormTemplate(templateId, password);

        if (res.success) {
            toast.success("Modelo excluído com sucesso.");
        } else {
            toast.error(res.message);
            throw new Error(res.message);
        }
    };

    const handleRename = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLocked) return;
        setLoading(true);
        const res = await updateFormTemplateTitle(templateId, newTitle);
        setLoading(true); // Keep loading until refresh
        setIsRenameOpen(false);

        if (res.success) {
            toast.success("Modelo renomeado.");
        } else {
            toast.error(res.message);
            setLoading(false);
        }
    };

    const handleMove = async () => {
        setLoading(true);
        const res = await updateFormCategory(templateId, selectedCategory);
        setLoading(false);
        setIsMoveOpen(false);

        if (res.success) {
            toast.success("Modelo movido com sucesso.");
        } else {
            toast.error(res.message);
        }
    };

    const handleToggleActive = async () => {
        setLoading(true);
        const res = await updateFormSettings(templateId, {
            is_active: !isActive,
            allowed_roles: allowedRoles || []
        });
        setLoading(false);

        if (res.success) {
            toast.success(isActive ? "Formulário desativado." : "Formulário ativado.");
        } else {
            toast.error(res.message);
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>

                    {/* MOVE: Category selection */}
                    <DropdownMenuItem onClick={() => setIsMoveOpen(true)} className="cursor-pointer">
                        <Move className="mr-2 h-4 w-4" />
                        Mover / Categoria
                    </DropdownMenuItem>

                    {/* SETTINGS: Owner Only */}
                    {isOwner && (
                        <DropdownMenuItem onClick={() => setIsSettingsOpen(true)} className="cursor-pointer">
                            <Settings className="mr-2 h-4 w-4" />
                            Configurações
                        </DropdownMenuItem>
                    )}

                    {/* RENAME: Owner Only + Not Locked */}
                    {isOwner && !isLocked && (
                        <DropdownMenuItem onClick={() => setIsRenameOpen(true)} className="cursor-pointer">
                            <Edit3 className="mr-2 h-4 w-4" />
                            Renomear
                        </DropdownMenuItem>
                    )}

                    {/* TOGGLE ACTIVE: Owner Only */}
                    {isOwner && (
                        <DropdownMenuItem onClick={handleToggleActive} className="cursor-pointer">
                            <Power className={`mr-2 h-4 w-4 ${isActive ? 'text-green-600' : 'text-muted-foreground'}`} />
                            {isActive ? 'Desativar' : 'Ativar'}
                        </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    {/* DELETE: Owner Only + Not Locked */}
                    {isOwner && !isLocked && (
                        <DropdownMenuItem onClick={() => setIsDeleteOpen(true)} className="cursor-pointer text-red-600 focus:text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Move Dialog */}
            <Dialog open={isMoveOpen} onOpenChange={setIsMoveOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Mover Modelo</DialogTitle>
                        <DialogDescription>
                            Selecione a categoria para este questionário.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label className="mb-2 block">Categoria</Label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                            <SelectContent>
                                {CATEGORIES_LIST.map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsMoveOpen(false)}>Cancelar</Button>
                        <Button onClick={handleMove} disabled={loading}>
                            {loading ? 'Salvando...' : 'Confirmar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Settings Dialog */}
            <FormSettingsDialog
                open={isSettingsOpen}
                onOpenChange={setIsSettingsOpen}
                templateId={templateId}
                initialActive={isActive}
                initialAllowedRoles={allowedRoles}
                professionals={professionals}
            />

            <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
                <DialogContent>
                    <form onSubmit={handleRename}>
                        <DialogHeader>
                            <DialogTitle>Renomear Modelo</DialogTitle>
                            <DialogDescription>
                                Altere o nome de exibição deste formulário.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Novo Título</Label>
                                <Input
                                    id="name"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsRenameOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Salvando...' : 'Salvar'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDeleteDialog
                open={isDeleteOpen}
                onOpenChange={setIsDeleteOpen}
                title={`Excluir "${templateTitle || 'Modelo'}"?`}
                description="Digite sua senha para confirmar a exclusão deste formulário. Ele será movido para a lixeira."
                onConfirm={handleDelete}
            />
        </>
    );
}
