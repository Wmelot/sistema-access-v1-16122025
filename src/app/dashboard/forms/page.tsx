import { getFormTemplates, createFormTemplate } from './actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, ClipboardList, Pencil, Activity, HeartHandshake, FileText, Settings } from 'lucide-react';
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
import { redirect } from 'next/navigation';
import { FormCardActions } from './components/form-card-actions';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function CustomFormsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch all templates
    const allTemplates = await getFormTemplates();

    // Filter Custom Forms (Not Locked) OR Hardcoded Assessments (System Standard but editable content-wise in context)
    // User requested "Forms" gallery to show the hardcoded assessments too.
    const customForms = allTemplates.filter((t: any) => !t.is_locked || t.type === 'assessment');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Formulários Personalizados</h1>
                    <p className="text-muted-foreground">
                        Crie seus próprios formulários e avaliações usando o editor Drag-and-Drop.
                    </p>
                </div>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/90 text-white">
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Formulário
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
                                <DialogTitle>Criar Novo Formulário</DialogTitle>
                                <DialogDescription>
                                    Defina o título para começar a editar no construtor visual.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="title">Título do Formulário</Label>
                                    <Input id="title" name="title" placeholder="Ex: Avaliação de Ombro Personalizada" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="description">Descrição</Label>
                                    <Input id="description" name="description" placeholder="Uma breve descrição da finalidade deste formulário." />
                                </div>
                                <input type="hidden" name="type" value="custom" />
                            </div>
                            <DialogFooter>
                                <Button type="submit">Criar e Editar</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {customForms.map((template: any) => (
                    <CustomFormCard key={template.id} template={template} user={user} />
                ))}
                {customForms.length === 0 && <EmptyState />}
            </div>
        </div>
    );
}

function CustomFormCard({ template, user }: any) {
    return (
        <Card className="hover:border-primary/50 transition-colors flex flex-col justify-between relative group">
            <div>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-medium line-clamp-1" title={template.title}>
                        {template.title}
                    </CardTitle>
                    <div className="absolute top-2 right-2 opacity-100 transition-opacity">
                        <FormCardActions
                            templateId={template.id}
                            templateTitle={template.title}
                            isActive={!!template.is_active}
                            allowedRoles={template.allowed_roles || []}
                            professionals={[]}
                            userId={template.user_id}
                            currentUserId={user?.id}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="mb-2 flex gap-2">
                        <Badge variant={template.is_active ? "default" : "secondary"} className={template.is_active ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}>
                            {template.is_active ? "Ativo" : "Rascunho / Inativo"}
                        </Badge>
                        <Badge variant={template.is_locked ? "secondary" : "outline"} className="text-xs font-normal">
                            {template.is_locked ? "Padronizado" : "Personalizado"}
                        </Badge>
                    </div>
                    <CardDescription className="line-clamp-2 min-h-[40px]">
                        {template.description || "Sem descrição."}
                    </CardDescription>
                </CardContent>
            </div>
            <div className="p-6 pt-0">
                <Link href={`/dashboard/forms/builder/${template.id}${template.is_locked ? '?mode=view' : ''}`} className="w-full">
                    <Button variant={template.is_locked ? "secondary" : "outline"} className="w-full group-hover:bg-primary group-hover:text-white transition-colors">
                        {template.is_locked ? (
                            <>
                                <FileText className="mr-2 h-3 w-3" />
                                Visualizar
                            </>
                        ) : (
                            <>
                                <Pencil className="mr-2 h-3 w-3" />
                                Editar Layout
                            </>
                        )}
                    </Button>
                </Link>
            </div>
        </Card>
    )
}

function EmptyState() {
    return (
        <div className="col-span-full text-center py-20 text-muted-foreground border-2 border-dashed rounded-lg bg-slate-50">
            <Settings className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">Nenhum formulário personalizado</h3>
            <p className="max-w-md mx-auto mb-6">Comece criando seu primeiro formulário personalizado para usar em suas avaliações.</p>
            <Dialog>
                <DialogTrigger asChild>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Criar Primeiro Formulário
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    {/* Reusing logic via form action wrapper would be cleaner but for empty state just prompt user to click top button or duplicate logic */}
                    <p className="py-4">Clique no botão "Novo Formulário" no topo da página para começar.</p>
                </DialogContent>
            </Dialog>
        </div>
    )
}
