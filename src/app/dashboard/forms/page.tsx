import { getFormTemplates, createFormTemplate } from './actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText, Pencil, Trash2, Activity } from 'lucide-react';
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
import { SubmitButton } from '@/components/submit-button'; // Assuming you have one or I'll make a simple one inline

import { FormCardActions } from './components/form-card-actions';

export default async function FormsPage() {
    const templates = await getFormTemplates();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Questionários e Modelos</h1>
                    <p className="text-muted-foreground">
                        Crie e gerencie seus questionários, fichas de avaliação e evoluções.
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
                            const res = await createFormTemplate(formData);
                            if (res.success && res.id) {
                                redirect(`/dashboard/forms/builder/${res.id}`);
                            }
                        }}>
                            <DialogHeader>
                                <DialogTitle>Criar Novo Questionário</DialogTitle>
                                <DialogDescription>
                                    Dê um nome para começar a editar seu modelo.
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
                                <div className="grid gap-2">
                                    <Label htmlFor="type">Tipo de Formulário</Label>
                                    <Select name="type" defaultValue="assessment">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="assessment">Avaliação (Padrão)</SelectItem>
                                            <SelectItem value="evolution">Evolução (Diário)</SelectItem>
                                        </SelectContent>
                                    </Select>
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
                {/* Hardcoded Physical Assessment Card */}
                <Card className="hover:border-primary/50 transition-colors flex flex-col justify-between border-blue-200 bg-blue-50/10">
                    <div>
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                            <CardTitle className="text-lg font-medium">
                                Avaliação Física Avançada
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-2">
                                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold max-w-fit bg-blue-100 text-blue-700 border-blue-200">
                                    Sistema
                                </span>
                            </div>
                            <CardDescription className="line-clamp-2 min-h-[40px]">
                                Avaliação completa com protocolos de Pineau, Rockport e Dinamometria (Z-Score).
                            </CardDescription>
                        </CardContent>
                    </div>
                    <div className="p-6 pt-0">
                        <Link href="/dashboard/assessment-test" className="w-full">
                            <Button variant="default" className="w-full bg-blue-600 hover:bg-blue-700">
                                <Activity className="mr-2 h-4 w-4" />
                                Iniciar Avaliação
                            </Button>
                        </Link>
                    </div>
                </Card>

                {templates.map((template) => (
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
                                    {template.type === 'evolution' ? (
                                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold max-w-fit bg-blue-50 text-blue-700 border-blue-200">
                                            Evolução
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold max-w-fit bg-green-50 text-green-700 border-green-200">
                                            Avaliação
                                        </span>
                                    )}
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
                                    Editar
                                </Button>
                            </Link>
                        </div>
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
