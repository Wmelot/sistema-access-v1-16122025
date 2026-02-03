'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, FileText, Settings, Activity, Dumbbell } from 'lucide-react'
import Link from 'next/link'
import { ViewModeToggle } from "@/components/ui/view-mode-toggle"
import { useViewMode } from "@/hooks/use-view-mode"
import { FormCardActions } from './form-card-actions'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { submitCreateForm } from './server-actions'

interface FormsListProps {
    customForms: any[]
    user: any
    slug?: string
}

export function FormsList({ customForms, user, slug }: FormsListProps) {
    const { viewMode, setViewMode, isLoaded } = useViewMode('forms-view-mode', 'grid')

    if (!isLoaded) {
        return <div className="animate-pulse">Carregando...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Formulários Personalizados</h1>
                    <p className="text-muted-foreground">
                        Crie seus próprios formulários e avaliações usando o editor Drag-and-Drop.
                    </p>
                </div>

                <div className="hidden md:flex items-center gap-3">
                    <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="bg-primary hover:bg-primary/90 text-white">
                                <Plus className="mr-2 h-4 w-4" />
                                Novo Formulário
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <form action={submitCreateForm}>
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

                                    {/* MASTER ADMIN ONLY: Visibility Selector */}
                                    {/* We check if user is in Master Organization to show this option */}
                                    {/* Ideally we would check organization_id but user object might be simple AuthUser */}
                                    {/* Let's show it, and backend ignores if not Master */}
                                    <div className="grid gap-2">
                                        <Label htmlFor="visibility">Visibilidade</Label>
                                        <select
                                            name="visibility"
                                            id="visibility"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            defaultValue="private"
                                        >
                                            <option value="private">Privado (Apenas minha clínica)</option>
                                            <option value="public">Público (Todas as clínicas)</option>
                                        </select>
                                        <p className="text-[0.8rem] text-muted-foreground">
                                            'Público' tornará este formulário visível para TODOS os tenants.
                                        </p>
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
            </div>

            {viewMode === 'grid' ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

                    {/* SANDBOX CARDS (HARDCODED FORMS) */}

                    {/* 1. Palmilha Access (Já existente) */}
                    <Card className="hover:border-indigo-500/50 transition-colors flex flex-col justify-between relative group border-dashed border-2 bg-indigo-50/10">
                        <div>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-medium flex items-center gap-2 text-indigo-700">
                                    <FileText className="h-5 w-5" />
                                    Palmilha Biomecânica
                                </CardTitle>
                                <CardDescription>
                                    Avaliação para confecção de palmilhas (Baropodometria e Exame Físico).
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-2 mb-2">
                                    <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200 uppercase text-[10px] tracking-widest font-black">Sistema</Badge>
                                </div>
                            </CardContent>
                        </div>
                        <div className="p-6 pt-0">
                            <Link href={`/dashboard/${slug}/test-form`} className="w-full">
                                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white group-hover:shadow-md transition-all font-bold">
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Abrir Formulário
                                </Button>
                            </Link>
                        </div>
                    </Card>

                    {/* 2. Saúde da Mulher */}
                    <Card className="hover:border-pink-500/50 transition-colors flex flex-col justify-between relative group border-dashed border-2 bg-pink-50/10">
                        <div>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-medium flex items-center gap-2 text-pink-700">
                                    <FileText className="h-5 w-5" />
                                    Saúde da Mulher & Pélvica
                                </CardTitle>
                                <CardDescription>
                                    Avaliação completa de Saúde da Mulher Uro-Ginecológica.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-2 mb-2">
                                    <Badge className="bg-pink-100 text-pink-800 hover:bg-pink-200 uppercase text-[10px] tracking-widest font-black">Sistema</Badge>
                                </div>
                            </CardContent>
                        </div>
                        <div className="p-6 pt-0">
                            <Link href={`/dashboard/${slug}/test-form/womens-health`} className="w-full">
                                <Button className="w-full bg-pink-600 hover:bg-pink-700 text-white group-hover:shadow-md transition-all font-bold">
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Abrir Formulário
                                </Button>
                            </Link>
                        </div>
                    </Card>

                    {/* 3. Avaliação Clínica Inteligente (PBE) */}
                    <Card className="hover:border-blue-500/50 transition-colors flex flex-col justify-between relative group border-dashed border-2 bg-blue-50/10">
                        <div>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-medium flex items-center gap-2 text-blue-700">
                                    <FileText className="h-5 w-5" />
                                    Avaliação PBE (Inteligente)
                                </CardTitle>
                                <CardDescription>
                                    Formulário inteligente com triagem de Red Flags e anamnese direcionada.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-2 mb-2">
                                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 uppercase text-[10px] tracking-widest font-black">Sistema</Badge>
                                </div>
                            </CardContent>
                        </div>
                        <div className="p-6 pt-0">
                            <Link href={`/dashboard/${slug}/test-form/pbe`} className="w-full">
                                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white group-hover:shadow-md transition-all font-bold">
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Abrir Formulário
                                </Button>
                            </Link>
                        </div>
                    </Card>

                    {/* 4. Avaliação Física Avançada (Restored) */}
                    <Card className="hover:border-emerald-500/50 transition-colors flex flex-col justify-between relative group border-dashed border-2 bg-emerald-50/10">
                        <div>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-medium flex items-center gap-2 text-emerald-700">
                                    <Activity className="h-5 w-5" />
                                    Avaliação Física Avançada
                                </CardTitle>
                                <CardDescription>
                                    Versão completa com 8 etapas, cálculos de risco, força, cardio e relatórios.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-2 mb-2">
                                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 uppercase text-[10px] tracking-widest font-black">Sistema</Badge>
                                </div>
                            </CardContent>
                        </div>
                        <div className="p-6 pt-0">
                            <Link href={`/dashboard/${slug}/test-form/physical`} className="w-full">
                                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white group-hover:shadow-md transition-all font-bold">
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Abrir Formulário
                                </Button>
                            </Link>
                        </div>
                    </Card>

                    {/* 5. Palmilha Pé Insensível */}
                    <Card className="hover:border-emerald-500/50 transition-colors flex flex-col justify-between relative group border-dashed border-2 bg-emerald-50/10">
                        <div>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-medium flex items-center gap-2 text-emerald-700">
                                    <FileText className="h-5 w-5" />
                                    Palmilha Pé Insensível
                                </CardTitle>
                                <CardDescription>
                                    Avaliação completa para pés diabéticos e prescrição de palmilhas especiais.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-2 mb-2">
                                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 uppercase text-[10px] tracking-widest font-black">Sistema</Badge>
                                </div>
                            </CardContent>
                        </div>
                        <div className="p-6 pt-0">
                            <Link href={`/dashboard/${slug}/test-form/diabetic-foot`} className="w-full">
                                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white group-hover:shadow-md transition-all font-bold">
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Abrir Formulário
                                </Button>
                            </Link>
                        </div>
                    </Card>

                    {customForms
                        // Filter out duplicates ONLY if they are Locked System Forms that we replaced with Hardcoded Cards
                        // This ensures User's Custom Copies (is_locked=false) are still visible!
                        .filter((t: any) => {
                            if (t.is_locked) {
                                if (t.title.includes('Palmilha biomecânica')) return false;
                                if (t.title.includes('Saúde da Mulher')) return false;
                                if (t.title.includes('Avaliação Clínica Inteligente')) return false;
                                if (t.title.includes('Avaliação Física Avançada')) return false;
                            }
                            return true;
                        })
                        .map((template: any) => (
                            <Card key={template.id} className="hover:border-primary/50 transition-colors flex flex-col justify-between relative group">
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
                                    <Link href={template.is_locked ? `/dashboard/${slug}/questionnaires/preview/${template.id}` : `/dashboard/${slug}/forms/builder/${template.id}`} className="w-full">
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
                        ))}
                </div>
            ) : (
                <div className="space-y-3">
                    {/* HARDCODED SYSTEM FORMS IN LIST VIEW */}
                    {[
                        { id: 'palmilha', title: 'Palmilha Biomecânica', desc: 'Avaliação para confecção de palmilhas.', href: `/dashboard/${slug}/test-form`, type: 'system', color: 'indigo' },
                        { id: 'womens-health', title: 'Saúde da Mulher & Pélvica', desc: 'Avaliação completa de Saúde da Mulher.', href: `/dashboard/${slug}/test-form/womens-health`, type: 'system', color: 'pink' },
                        { id: 'pbe', title: 'Avaliação PBE (Inteligente)', desc: 'Formulário inteligente com triagem de Red Flags.', href: `/dashboard/${slug}/test-form/pbe`, type: 'system', color: 'blue' },
                        { id: 'physical', title: 'Avaliação Física Avançada', desc: 'Versão completa com 8 etapas e cálculos.', href: `/dashboard/${slug}/test-form/physical`, type: 'system', color: 'emerald' },
                        { id: 'diabetic-foot', title: 'Palmilha Pé Insensível', desc: 'Avaliação para pés diabéticos.', href: `/dashboard/${slug}/test-form/diabetic-foot`, type: 'system', color: 'emerald' }
                    ].map((form) => (
                        <Card key={form.id} className={`hover:border-${form.color}-500/50 transition-colors border-l-4 border-l-${form.color}-600`}>
                            <div className="flex items-center gap-4 p-4">
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className={`font-bold text-lg text-${form.color}-700`}>{form.title}</h3>
                                            <Badge className={`bg-${form.color}-100 text-${form.color}-800 uppercase text-[10px] font-black`}>Sistema</Badge>
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-1">{form.desc}</p>
                                </div>
                                <Link href={form.href}>
                                    <Button className={`bg-${form.color}-600 hover:bg-${form.color}-700 text-white font-bold`}>
                                        Abrir Formulário
                                    </Button>
                                </Link>
                            </div>
                        </Card>
                    ))}

                    <Separator className="my-6" />
                    <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Seus Formulários Personalizados</div>

                    {customForms
                        .filter((t: any) => {
                            if (t.is_locked) {
                                if (t.title.includes('Palmilha biomecânica')) return false;
                                if (t.title.includes('Saúde da Mulher')) return false;
                                if (t.title.includes('Avaliação Clínica Inteligente')) return false;
                                if (t.title.includes('Avaliação Física Avançada')) return false;
                            }
                            return true;
                        })
                        .map((template: any) => (
                            <Card key={template.id} className="hover:border-primary/50 transition-colors">
                                <div className="flex items-center gap-4 p-4">
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-semibold text-lg">{template.title}</h3>
                                            <div className="flex gap-2">
                                                <Badge variant={template.is_active ? "default" : "secondary"} className={template.is_active ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}>
                                                    {template.is_active ? "Ativo" : "Inativo"}
                                                </Badge>
                                                <Badge variant={template.is_locked ? "secondary" : "outline"} className="text-xs font-normal">
                                                    {template.is_locked ? "Padronizado" : "Personalizado"}
                                                </Badge>
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-1">
                                            {template.description || "Sem descrição."}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <FormCardActions
                                            templateId={template.id}
                                            templateTitle={template.title}
                                            isActive={!!template.is_active}
                                            allowedRoles={template.allowed_roles || []}
                                            professionals={[]}
                                            userId={template.user_id}
                                            currentUserId={user?.id}
                                        />
                                        <Link href={template.is_locked ? `/dashboard/${slug}/questionnaires/preview/${template.id}` : `/dashboard/${slug}/forms/builder/${template.id}`}>
                                            <Button variant="outline" size="sm">
                                                {template.is_locked ? 'Visualizar' : 'Editar'}
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </Card>
                        ))}
                </div>
            )}

            {customForms.length === 0 && (
                <div className="col-span-full text-center py-20 text-muted-foreground border-2 border-dashed rounded-lg bg-slate-50">
                    <Settings className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <h3 className="text-lg font-medium text-slate-900 mb-1">Nenhum formulário personalizado</h3>
                    <p className="max-w-md mx-auto mb-6">Comece criando seu primeiro formulário personalizado para usar em suas avaliações.</p>
                </div>
            )}
        </div>
    )
}
