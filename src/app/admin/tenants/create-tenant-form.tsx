"use client";

import { useState, useEffect } from "react";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner"; // Assuming sonner is used based on file list (sonner.tsx) or we fallback to alert

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { createTenant } from "./actions";

interface CreateTenantFormProps {
    initialData?: any;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
}

export function CreateTenantForm({ initialData, open: controlledOpen, onOpenChange, trigger }: CreateTenantFormProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Derived state for controlled vs uncontrolled
    const isControlled = typeof controlledOpen !== 'undefined';
    const isOpen = isControlled ? controlledOpen : internalOpen;
    const setIsOpen = isControlled ? onOpenChange : setInternalOpen;

    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        plan: "free"
    });

    // Populate form on edit
    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                slug: initialData.slug || "", // slug might not be fetched or exist yet
                plan: initialData.plan || "free"
            });
        } else {
            setFormData({ name: "", slug: "", plan: "free" });
        }
    }, [initialData, isOpen]);

    // Auto-generate slug from name only if creating or slug is empty
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

        setFormData(prev => ({
            ...prev,
            name,
            slug: (prev.slug && initialData) ? prev.slug : slug // Don't overwrite slug on edit if it already exists, unless user clears it
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await createTenant({
                ...formData,
                id: initialData?.id // Pass ID for update
            });

            if (result.success) {
                toast.success(initialData ? "Clínica atualizada!" : "Clínica criada com sucesso!");
                setIsOpen?.(false);
                if (!initialData) setFormData({ name: "", slug: "", plan: "free" });
                window.location.reload();
            } else {
                toast.error(result.error || "Erro ao salvar clínica.");
            }
        } catch (error) {
            toast.error("Erro inesperado.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {trigger && (
                <DialogTrigger asChild>
                    {trigger}
                </DialogTrigger>
            )}
            {!trigger && !isControlled && (
                <DialogTrigger asChild>
                    <Button className="bg-zinc-900 text-white hover:bg-zinc-800 gap-2">
                        <Plus className="h-4 w-4" />
                        Nova Clínica
                    </Button>
                </DialogTrigger>
            )}

            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{initialData ? 'Editar Clínica' : 'Nova Clínica'}</DialogTitle>
                        <DialogDescription>
                            {initialData ? 'Atualize os dados da organização.' : 'Adicione uma nova organização ao ecossistema Axiom.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nome da Clínica</Label>
                            <Input
                                id="name"
                                placeholder="Ex: Access Fisioterapia"
                                value={formData.name}
                                onChange={handleNameChange}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="slug">Slug (URL)</Label>
                            <Input
                                id="slug"
                                placeholder="ex: access-fisioterapia"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="plan">Plano</Label>
                            <Select
                                value={formData.plan}
                                onValueChange={(value) => setFormData({ ...formData, plan: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um plano" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="free">Free (Grátis)</SelectItem>
                                    <SelectItem value="clinic">Clinic (Pro)</SelectItem>
                                    <SelectItem value="enterprise">Master (Enterprise)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsOpen?.(false)} disabled={isLoading}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading} className="bg-zinc-900">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {initialData ? 'Salvar Alterações' : 'Criar Clínica'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
