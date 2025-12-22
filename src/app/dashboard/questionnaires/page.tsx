import { getFormTemplates, createFormTemplate } from '../forms/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, ClipboardList, Pencil } from 'lucide-react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { redirect } from 'next/navigation';
import { FormCardActions } from '../forms/components/form-card-actions';

export default async function QuestionnairesPage() {
    // Fetch all templates and filter for assessments
    const allTemplates = await getFormTemplates();
    const templates = allTemplates.filter((t: any) => t.type === 'assessment');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Questionários e Escalas</h1>
                    <p className="text-muted-foreground">
                        Gerencie os questionários padronizados e escalas de avaliação.
                    </p>
                </div>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Questionário
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form action={async (formData) => {
                            'use server';
                            // Force type to assessment
                            formData.set('type', 'assessment');
                            const res = await createFormTemplate(formData);
                            if (res.success && res.id) {
                                redirect(`/dashboard/forms/builder/${res.id}`);
                            }
                        }}>
                            <DialogHeader>
                                <DialogTitle>Criar Novo Questionário</DialogTitle>
                                <DialogDescription>
                                    Defina o título do novo questionário ou escala.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="title">Título</Label>
                                    <Input id="title" name="title" placeholder="Ex: Escala de Dor, Questionário Inicial..." required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="description">Descrição (Opcional)</Label>
                                    <Input id="description" name="description" placeholder="Breve descrição do questionário." />
                                </div>
                                {/* Type is hidden/forced to assessment */}
                                <input type="hidden" name="type" value="assessment" />
                            </div>
                            <DialogFooter>
                                <Button type="submit">Criar e Editar</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {templates.map((template: any) => (
                    <Card key={template.id} className="hover:border-primary/50 transition-colors flex flex-col justify-between">
                        <div>
                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                <CardTitle className="text-lg font-medium line-clamp-1" title={template.title}>
                                    {template.title}
                                </CardTitle>
                                <FormCardActions templateId={template.id} />
                            </CardHeader>
                            <CardContent>
                                <div className="mb-2">
                                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold max-w-fit bg-green-50 text-green-700 border-green-200">
                                        Avaliação
                                    </span>
                                </div>
                                <CardDescription className="line-clamp-2 min-h-[40px]">
                                    {template.description || "Sem descrição."}
                                </CardDescription>
                            </CardContent>
                        </div>
                        <div className="p-6 pt-0">
                            <Link href={`/dashboard/forms/builder/${template.id}`} className="w-full">
                                <Button variant="outline" className="w-full">
                                    <Pencil className="mr-2 h-3 w-3" />
                                    Editar Questionário
                                </Button>
                            </Link>
                        </div>
                    </Card>
                ))}

                {templates.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                        <p>Nenhum questionário cadastrado.</p>
                        <p className="text-sm">Clique em "Novo Questionário" para começar.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
