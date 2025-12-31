// ... imports
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Copy, Trash2, Loader2, Edit3, Settings } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { duplicateFormTemplate, deleteFormTemplate, updateFormTemplateTitle } from '../actions';
import { toast } from 'sonner';

import { ConfirmDeleteDialog } from '@/components/common/confirm-delete-dialog';
import { FormSettingsDialog } from './form-settings-dialog';

interface FormCardActionsProps {
    templateId: string;
    templateTitle?: string;
    isActive: boolean;
    allowedRoles: string[];
    professionals: any[];
}

export function FormCardActions({ templateId, templateTitle, isActive, allowedRoles, professionals }: FormCardActionsProps) {
    const [loading, setLoading] = useState(false);
    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [newTitle, setNewTitle] = useState(templateTitle || '');

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
        setLoading(true);
        const res = await updateFormTemplateTitle(templateId, newTitle);
        setLoading(false);
        setIsRenameOpen(false);

        if (res.success) {
            toast.success("Modelo renomeado.");
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
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                        <Link href={`/dashboard/forms/builder/${templateId}`} className="cursor-pointer flex items-center">
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsSettingsOpen(true)} className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Configurações
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsRenameOpen(true)} className="cursor-pointer">
                        <Edit3 className="mr-2 h-4 w-4" />
                        Renomear
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDuplicate} className="cursor-pointer">
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setIsDeleteOpen(true)} className="cursor-pointer text-red-600 focus:text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

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
