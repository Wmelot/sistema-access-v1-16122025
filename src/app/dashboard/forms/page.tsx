import { getFormTemplates, createFormTemplate } from './actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SubmitButton } from '@/components/submit-button'; // Assuming you have one or I'll make a simple one inline

export default async function FormsPage() {
    const templates = await getFormTemplates();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Modelos de Formulário</h1>
                    <p className="text-muted-foreground">
                        Crie e gerencie fichas de avaliação, anamneses e evoluções.
                    </p>
                </div>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Modelo
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form action={async (formData) => {
                            'use server';
                            const res = await createFormTemplate(formData);
                            if (res.success && res.id) {
                                redirect(`/dashboard/forms/builder/${res.id}`);
                            }
                        }}>
                            <DialogHeader>
                                <DialogTitle>Criar Novo Modelo</DialogTitle>
                                <DialogDescription>
                                    Dê um nome para começar a editar seu formulário.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="title">Título</Label>
                                    <Input id="title" name="title" placeholder="Ex: Avaliação Neurológica" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="description">Descrição (Opcional)</Label>
                                    <Input id="description" name="description" placeholder="Ex: Ficha padrão para pacientes..." />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Criar e Editar</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => (
                    <Card key={template.id} className="hover:border-primary/50 transition-colors">
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                            <CardTitle className="text-lg font-medium">
                                {template.title}
                            </CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <CardDescription className="line-clamp-2 min-h-[40px]">
                                {template.description || "Sem descrição."}
                            </CardDescription>
                            <div className="mt-4 flex gap-2">
                                <Link href={`/dashboard/forms/builder/${template.id}`} className="w-full">
                                    <Button variant="outline" className="w-full">
                                        <Pencil className="mr-2 h-3 w-3" />
                                        Editar
                                    </Button>
                                </Link>
                                {/* Delete button logic later */}
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {templates.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                        <p>Nenhum modelo criado ainda.</p>
                        <p className="text-sm">Clique em "Novo Modelo" para começar.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Inline helper for redirect inside server component action
import { redirect } from 'next/navigation';
