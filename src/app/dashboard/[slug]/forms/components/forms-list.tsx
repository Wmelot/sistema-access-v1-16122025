'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Plus, Pencil, FileText, Settings, Activity, Dumbbell, Brain, Zap } from 'lucide-react'
import Link from 'next/link'
import { ViewModeToggle } from "@/components/ui/view-mode-toggle"
import { useViewMode } from "@/hooks/use-view-mode"
import { ManagementHeader } from "@/components/dashboard/management-header"
import { FormCardActions } from './form-card-actions'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { useGlobalLoader } from '@/components/providers/global-loader-provider'

interface FormsListProps {
    customForms: any[]
    user: any
    slug?: string
    professionals?: any[]
}

export function FormsList({ customForms, user, slug, professionals = [] }: FormsListProps) {
    const { viewMode, setViewMode, isLoaded } = useViewMode('forms-view-mode', 'grid')
    const { showLoading } = useGlobalLoader()

    if (!isLoaded) {
        return <div className="animate-pulse">Carregando...</div>
    }

    // A clínica tem acesso à Palmilha se tiver qualquer template de palmilha liberado
    const hasPalmilha = customForms.some((f: any) => f.title?.toLowerCase().includes('palmilha'));
    const hasPalmilhaV3 = customForms.some((f: any) => f.title?.toLowerCase().includes('palmilha biomecânica v3'));
    const hasPalmilha5 = hasPalmilha; // Always show the Beta/Migration button for Palmilha 5 if Palmilha is allowed
    const hasWomensHealth = customForms.some((f: any) => f.title?.toLowerCase().includes('saúde da mulher'));
    const hasPbe = customForms.some((f: any) => f.title?.toLowerCase().includes('avaliação clínica inteligente') || f.title?.toLowerCase().includes('pbe (inteligente)'));
    const hasPbe5 = hasPbe; // Always show PBE 5 if PBE is allowed
    const hasUltimate = customForms.some((f: any) => f.title?.toLowerCase().includes('ultimate pbe') || f.title?.toLowerCase().includes('fusão'));
    const hasWizard = customForms.some((f: any) => f.title?.toLowerCase().includes('tree wizard'));
    const hasPhysical = customForms.some((f: any) => f.title?.toLowerCase().includes('física avançada'));
    const hasDiabetic = customForms.some((f: any) => {
        const t = f.title?.toLowerCase() || '';
        return t.includes('pé insensível') || t.includes('pé diabético');
    });
    const hasEvolution = customForms.some((f: any) => f.title?.toLowerCase().includes('evolução clínica & ia'));

    return (
        <div className="space-y-6">
            <ManagementHeader
                slug={slug!}
                title="Formulários Personalizados"
                description="Crie seus próprios formulários e avaliações usando o editor Drag-and-Drop."
            >
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
            </ManagementHeader>

            {viewMode === 'grid' ? (
                <Tabs defaultValue="forms" className="w-full">
                    <TabsList className="mb-6 h-auto p-1 bg-slate-100 flex flex-wrap lg:flex-nowrap">
                        <TabsTrigger value="forms" className="py-2.5 px-6 font-bold text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl">
                            📁 Formulários
                        </TabsTrigger>
                        <TabsTrigger value="questionnaires" className="py-2.5 px-6 font-bold text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl">
                            📋 Questionários
                        </TabsTrigger>
                        <TabsTrigger value="protocols" className="py-2.5 px-6 font-bold text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl">
                            📚 Protocolos
                        </TabsTrigger>
                    </TabsList>

                    {/* FOLDER: FORMULÁRIOS */}
                    <TabsContent value="forms" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 focus-visible:outline-none">

                        {/* SANDBOX CARDS (HARDCODED FORMS) */}

                        {/* PBE 5.0 (BETA) */}
                        {hasPbe5 && (
                            <Card className="hover:border-blue-500/50 transition-colors flex flex-col justify-between relative group border-2 border-slate-900 bg-slate-900 overflow-hidden shadow-2xl">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 blur-3xl -z-10 rounded-full mix-blend-screen opacity-50"></div>
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-cyan-500/20 to-sky-500/20 blur-3xl -z-10 rounded-full mix-blend-screen opacity-50"></div>

                                <div>
                                    <CardHeader className="pb-2 relative z-10">
                                        <CardTitle className="text-xl font-bold flex items-center gap-2 text-white">
                                            <div className="bg-white/10 p-2 rounded-xl border border-white/10 backdrop-blur-md">
                                                <Activity className="h-5 w-5 text-blue-400" />
                                            </div>
                                            PBE 5.0 (V5)
                                        </CardTitle>
                                        <CardDescription className="text-slate-400 leading-relaxed pt-2">
                                            Nova geração de avaliação clínica baseada em evidências. Arquitetura modular, performance extrema e raciocínio clínico assistido.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="relative z-10 pt-2">
                                        <div className="flex gap-2">
                                            <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 border-none text-white uppercase text-[10px] tracking-widest font-black shadow-lg shadow-blue-500/20">
                                                BETA MODULAR
                                            </Badge>
                                            <Badge className="bg-slate-800 text-slate-400 uppercase text-[10px] tracking-widest font-black border-slate-700">Refatoração V5</Badge>
                                        </div>
                                    </CardContent>
                                </div>
                                <div className="p-6 pt-4 relative z-10">
                                    <Link href={`/dashboard/${slug}/test-form/pbe-5`} className="w-full" onClick={() => showLoading()}>
                                        <Button className="w-full bg-white hover:bg-slate-100 text-slate-900 font-black h-12 shadow-xl shadow-black/20 transition-all hover:scale-[1.02] active:scale-95 text-xs tracking-wide">
                                            <Zap className="mr-2 h-4 w-4 text-blue-600 fill-blue-600" />
                                            INICIAR TESTES PBE V5
                                        </Button>
                                    </Link>
                                </div>
                            </Card>
                        )}

                        {/* Palmilha 5.0 (Novo/Beta/Refatoração em andamento) */}
                        {hasPalmilha5 && (
                            <Card className="hover:border-zinc-500/50 transition-colors flex flex-col justify-between relative group border-2 border-zinc-900 bg-zinc-900 overflow-hidden shadow-2xl">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-3xl -z-10 rounded-full mix-blend-screen opacity-50"></div>
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-blue-500/20 to-emerald-500/20 blur-3xl -z-10 rounded-full mix-blend-screen opacity-50"></div>

                                <div>
                                    <CardHeader className="pb-2 relative z-10">
                                        <CardTitle className="text-xl font-bold flex items-center gap-2 text-white">
                                            <div className="bg-white/10 p-2 rounded-xl border border-white/10 backdrop-blur-md">
                                                <FileText className="h-5 w-5 text-indigo-400" />
                                            </div>
                                            Palmilha 5.0
                                        </CardTitle>
                                        <CardDescription className="text-zinc-400 leading-relaxed pt-2">
                                            Nova versão sendo construída juntos, usando arquitetura modular extrema sem afetar o modelo original.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="relative z-10 pt-2">
                                        <div className="flex gap-2">
                                            <Badge className="bg-gradient-to-r from-indigo-500 to-purple-600 border-none text-white uppercase text-[10px] tracking-widest font-black shadow-lg shadow-indigo-500/20">
                                                EM CONSTRUÇÃO (BETA)
                                            </Badge>
                                            <Badge className="bg-zinc-800 text-zinc-400 uppercase text-[10px] tracking-widest font-black border-zinc-700">Refatoração</Badge>
                                        </div>
                                    </CardContent>
                                </div>
                                <div className="p-6 pt-4 relative z-10">
                                    <Link href={`/dashboard/${slug}/test-form/palmilha-5`} className="w-full" onClick={() => showLoading()}>
                                        <Button className="w-full bg-white hover:bg-zinc-100 text-zinc-900 font-black h-12 shadow-xl shadow-black/20 transition-all hover:scale-[1.02] active:scale-95 text-xs tracking-wide">
                                            <Pencil className="mr-2 h-4 w-4" />
                                            ACOMPANHAR A CONSTRUÇÃO DO V5
                                        </Button>
                                    </Link>
                                </div>
                            </Card>
                        )}

                        {/* 1. Palmilha Access (Já existente) */}
                        {hasPalmilha && (
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
                                    <Link href={`/dashboard/${slug}/test-form`} className="w-full" onClick={() => showLoading()}>
                                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white group-hover:shadow-md transition-all font-bold">
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Abrir Formulário
                                        </Button>
                                    </Link>
                                </div>
                            </Card>
                        )}

                        {/* 1.1 Palmilha Biomecânica V3 (NEW) */}
                        {hasPalmilhaV3 && (
                            <Card className="hover:border-violet-500/50 transition-colors flex flex-col justify-between relative group border-dashed border-2 bg-violet-50/10">
                                <div>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg font-medium flex items-center gap-2 text-violet-700">
                                            <FileText className="h-5 w-5" />
                                            Palmilha Biomecânica V3
                                        </CardTitle>
                                        <CardDescription>
                                            Nova versão com design premium e relatórios integrados.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex gap-2 mb-2">
                                            <Badge className="bg-violet-100 text-violet-800 hover:bg-violet-200 uppercase text-[10px] tracking-widest font-black">NOVO</Badge>
                                        </div>
                                    </CardContent>
                                </div>
                                <div className="p-6 pt-0">
                                    <Link href={`/dashboard/${slug}/test-form/palmilha-v3`} className="w-full" onClick={() => showLoading()}>
                                        <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white group-hover:shadow-md transition-all font-bold">
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Abrir V3
                                        </Button>
                                    </Link>
                                </div>
                            </Card>
                        )}

                        {/* 2. Saúde da Mulher */}
                        {hasWomensHealth && (
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
                                    <Link href={`/dashboard/${slug}/test-form/womens-health`} className="w-full" onClick={() => showLoading()}>
                                        <Button className="w-full bg-pink-600 hover:bg-pink-700 text-white group-hover:shadow-md transition-all font-bold">
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Abrir Formulário
                                        </Button>
                                    </Link>
                                </div>
                            </Card>
                        )}

                        {/* 3. Avaliação Clínica Inteligente (PBE) */}
                        {hasPbe && (
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
                                    <Link href={`/dashboard/${slug}/test-form/pbe`} className="w-full" onClick={() => showLoading()}>
                                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white group-hover:shadow-md transition-all font-bold">
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Abrir Formulário
                                        </Button>
                                    </Link>
                                </div>
                            </Card>
                        )}

                        {/* 3.5 Ultimate PBE (FUSÃO) */}
                        {hasUltimate && (
                            <Card className="hover:border-violet-500/50 transition-colors flex flex-col justify-between relative group border-dashed border-2 bg-violet-50/10 col-span-1 md:col-span-2 lg:col-span-1 border-violet-200">
                                <div>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg font-black flex items-center gap-2 text-violet-700">
                                            <Brain className="h-5 w-5 fill-violet-200" />
                                            Ultimate PBE (Fusão)
                                        </CardTitle>
                                        <CardDescription className="text-violet-600/70 font-medium">
                                            A unificação definitiva: Clínica + Física + Biomecânica em uma única tela.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex gap-2 mb-2">
                                            <Badge className="bg-violet-600 text-white hover:bg-violet-700 uppercase text-[10px] tracking-widest font-black shadow-sm">BETA</Badge>
                                        </div>
                                    </CardContent>
                                </div>
                                <div className="p-6 pt-0">
                                    <Link href={`/dashboard/${slug}/test-form/ultimate-pbe`} className="w-full" onClick={() => showLoading()}>
                                        <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white group-hover:shadow-md transition-all font-bold shadow-violet-200">
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Abrir Ultimate
                                        </Button>
                                    </Link>
                                </div>
                            </Card>
                        )}

                        {/* 3.6 PBE 3.0 Tree Wizard (IA) */}
                        {hasWizard && (
                            <Card className="hover:border-indigo-500/50 transition-colors flex flex-col justify-between relative group border-2 bg-indigo-50/10 border-indigo-200 shadow-lg shadow-indigo-100/50">
                                <div className="absolute -top-3 -right-3">
                                    <Badge className="bg-indigo-600 text-white border-2 border-white px-3 py-1 text-[10px] font-black tracking-widest animate-bounce">TOP</Badge>
                                </div>
                                <div>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg font-black flex items-center gap-2 text-indigo-700">
                                            <Brain className="h-5 w-5" />
                                            PBE 3.0: Tree Wizard (IA)
                                        </CardTitle>
                                        <CardDescription className="text-indigo-600/80 font-bold">
                                            Avaliação orientada por Árvore de Decisão e Raciocínio Clínico IA.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex gap-2 mb-2">
                                            <Badge className="bg-indigo-100 text-indigo-700 border-none uppercase text-[9px] font-black tracking-tighter">✨ Especialista IA</Badge>
                                        </div>
                                    </CardContent>
                                </div>
                                <div className="p-6 pt-0">
                                    <Link href={`/dashboard/${slug}/test-form/smart-wizard`} className="w-full" onClick={() => showLoading()}>
                                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white group-hover:shadow-lg transition-all font-black tracking-tight">
                                            <Brain className="mr-2 h-4 w-4" />
                                            INICIAR WIZARD
                                        </Button>
                                    </Link>
                                </div>
                            </Card>
                        )}

                        {/* 4. Avaliação Física Avançada (Restored) */}
                        {hasPhysical && (
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
                                    <Link href={`/dashboard/${slug}/test-form/physical`} className="w-full" onClick={() => showLoading()}>
                                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white group-hover:shadow-md transition-all font-bold">
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Abrir Formulário
                                        </Button>
                                    </Link>
                                </div>
                            </Card>
                        )}

                        {/* 5. Palmilha Pé Insensível */}
                        {hasDiabetic && (
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
                                    <Link href={`/dashboard/${slug}/test-form/diabetic-foot`} className="w-full" onClick={() => showLoading()}>
                                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white group-hover:shadow-md transition-all font-bold">
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Abrir Formulário
                                        </Button>
                                    </Link>
                                </div>
                            </Card>
                        )}

                        {/* 6. Evolução Clínica Inteligente (NEW) */}
                        {hasEvolution && (
                            <Card className="hover:border-indigo-500/50 transition-colors flex flex-col justify-between relative group border-dashed border-2 bg-indigo-50/10">
                                <div>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg font-medium flex items-center gap-2 text-indigo-700">
                                            <Brain className="h-5 w-5" />
                                            Evolução Clínica & IA
                                        </CardTitle>
                                        <CardDescription>
                                            Evolução assistida por voz com Tutor de Carga e raciocínio clínico.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex gap-2 mb-2">
                                            <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200 uppercase text-[10px] tracking-widest font-black">NOVO</Badge>
                                        </div>
                                    </CardContent>
                                </div>
                                <div className="p-6 pt-0">
                                    <Link href={`/dashboard/${slug}/test-form/clinical-evolution`} className="w-full" onClick={() => showLoading()}>
                                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white group-hover:shadow-md transition-all font-bold">
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Abrir Formulário
                                        </Button>
                                    </Link>
                                </div>
                            </Card>
                        )}

                        {customForms
                            // Filter out duplicates ONLY if they are Locked System Forms that we replaced with Hardcoded Cards
                            // This ensures User's Custom Copies (is_locked=false) are still visible!
                            .filter((t: any) => {
                                const lowerTitle = t.title?.toLowerCase() || '';

                                // Hide backup, feegow forms and unwanted evolutions from UI
                                if (lowerTitle.includes('feegow')) return false;
                                if (lowerTitle.trim() === 'evolução') return false;
                                if (lowerTitle.includes('backup')) return false;
                                // Hide questionnaires and protocols from this tab (they have their own tabs)
                                if (t.type === 'questionnaire' || t.type === 'protocol') return false;
                                if (lowerTitle.includes('acompanhamento de palmilhas')) return false;
                                if (lowerTitle.includes('manutenção de palmilhas')) return false;

                                if (t.is_locked) {
                                    if (lowerTitle.includes('palmilha biomecânica') && !lowerTitle.includes('v3')) return false;
                                    if (lowerTitle.includes('palmilha biomecânica v3')) return false;
                                    if (lowerTitle.includes('saúde da mulher')) return false;
                                    if (lowerTitle.includes('avaliação clínica inteligente') || lowerTitle.includes('pbe (inteligente)')) return false;
                                    if (lowerTitle.includes('física avançada')) return false;
                                    if (lowerTitle.includes('ultimate pbe')) return false;
                                    if (lowerTitle.includes('tree wizard')) return false;
                                    if (lowerTitle.includes('pé insensível') || lowerTitle.includes('pé diabético')) return false;
                                    if (lowerTitle.includes('evolução clínica & ia')) return false;
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
                                                    accessConfig={template.access_config}
                                                    professionals={professionals}
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
                                        <Link
                                            href={template.is_locked ? `/dashboard/${slug}/questionnaires/preview/${template.id}` : `/dashboard/${slug}/forms/builder/${template.id}`}
                                            className={`w-full ${!template.is_locked && !template.canEdit ? 'pointer-events-none' : ''}`}
                                            onClick={() => showLoading()}
                                        >
                                            <Button
                                                variant={template.is_locked ? "secondary" : "outline"}
                                                className="w-full group-hover:bg-primary group-hover:text-white transition-colors"
                                                disabled={!template.is_locked && !template.canEdit}
                                            >
                                                {template.is_locked ? (
                                                    <>
                                                        <FileText className="mr-2 h-3 w-3" />
                                                        Visualizar
                                                    </>
                                                ) : (
                                                    <>
                                                        <Pencil className="mr-2 h-3 w-3" />
                                                        {template.canEdit ? 'Editar Layout' : 'Apenas Visualizar'}
                                                    </>
                                                )}
                                            </Button>
                                        </Link>
                                    </div>
                                </Card>
                            ))}
                    </TabsContent>

                    {/* FOLDER: QUESTIONÁRIOS */}
                    <TabsContent value="questionnaires" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 focus-visible:outline-none">
                        {customForms
                            .filter((t: any) => {
                                const lowerTitle = t.title?.toLowerCase() || '';
                                return t.type === 'questionnaire' || lowerTitle.includes('acompanhamento de palmilhas') || lowerTitle.includes('manutenção de palmilhas');
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
                                                    accessConfig={template.access_config}
                                                    professionals={professionals}
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
                                        <Link
                                            href={template.is_locked ? `/dashboard/${slug}/questionnaires/preview/${template.id}` : `/dashboard/${slug}/forms/builder/${template.id}`}
                                            className={`w-full ${!template.is_locked && !template.canEdit ? 'pointer-events-none' : ''}`}
                                            onClick={() => showLoading()}
                                        >
                                            <Button
                                                variant={template.is_locked ? "secondary" : "outline"}
                                                className="w-full group-hover:bg-primary group-hover:text-white transition-colors"
                                                disabled={!template.is_locked && !template.canEdit}
                                            >
                                                {template.is_locked ? (
                                                    <>
                                                        <FileText className="mr-2 h-3 w-3" />
                                                        Visualizar
                                                    </>
                                                ) : (
                                                    <>
                                                        <Pencil className="mr-2 h-3 w-3" />
                                                        {template.canEdit ? 'Editar Layout' : 'Apenas Visualizar'}
                                                    </>
                                                )}
                                            </Button>
                                        </Link>
                                    </div>
                                </Card>
                            ))}
                    </TabsContent>

                    {/* FOLDER: PROTOCOLOS */}
                    <TabsContent value="protocols" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 focus-visible:outline-none">
                        {customForms
                            .filter((t: any) => t.type === 'protocol' || t.title?.toLowerCase().includes('protocolo'))
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
                                                    accessConfig={template.access_config}
                                                    professionals={professionals}
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
                                        <Link
                                            href={template.is_locked ? `/dashboard/${slug}/questionnaires/preview/${template.id}` : `/dashboard/${slug}/forms/builder/${template.id}`}
                                            className={`w-full ${!template.is_locked && !template.canEdit ? 'pointer-events-none' : ''}`}
                                            onClick={() => showLoading()}
                                        >
                                            <Button
                                                variant={template.is_locked ? "secondary" : "outline"}
                                                className="w-full group-hover:bg-primary group-hover:text-white transition-colors"
                                                disabled={!template.is_locked && !template.canEdit}
                                            >
                                                {template.is_locked ? (
                                                    <>
                                                        <FileText className="mr-2 h-3 w-3" />
                                                        Visualizar
                                                    </>
                                                ) : (
                                                    <>
                                                        <Pencil className="mr-2 h-3 w-3" />
                                                        {template.canEdit ? 'Editar Layout' : 'Apenas Visualizar'}
                                                    </>
                                                )}
                                            </Button>
                                        </Link>
                                    </div>
                                </Card>
                            ))}
                    </TabsContent>
                </Tabs>
            ) : (
                <div className="space-y-3">
                    {/* HARDCODED SYSTEM FORMS IN LIST VIEW */}
                    {[
                        { id: 'palmilha-5', title: 'Palmilha 5.0 (BETA)', desc: 'Nova versão sendo construída juntos.', href: `/dashboard/${slug}/test-form/palmilha-5`, type: 'system', color: 'indigo', show: hasPalmilha5 },
                        { id: 'pbe-5', title: 'Avaliação PBE 5.0 (BETA)', desc: 'Nova geração modular de avaliação clínica.', href: `/dashboard/${slug}/test-form/pbe-5`, type: 'system', color: 'blue', show: hasPbe5 },
                        { id: 'palmilha', title: 'Palmilha Biomecânica', desc: 'Avaliação para confecção de palmilhas.', href: `/dashboard/${slug}/test-form`, type: 'system', color: 'indigo', show: hasPalmilha },
                        { id: 'palmilha-v3', title: 'Palmilha Biomecânica V3', desc: 'Nova versão com design premium e relatórios.', href: `/dashboard/${slug}/test-form/palmilha-v3`, type: 'system', color: 'violet', show: hasPalmilhaV3 },
                        { id: 'womens-health', title: 'Saúde da Mulher & Pélvica', desc: 'Avaliação completa de Saúde da Mulher.', href: `/dashboard/${slug}/test-form/womens-health`, type: 'system', color: 'pink', show: hasWomensHealth },
                        { id: 'smart-wizard', title: 'PBE 3.0: Tree Wizard (IA)', desc: 'Avaliação orientada por Árvore de Decisão e IA.', href: `/dashboard/${slug}/test-form/smart-wizard`, type: 'system', color: 'indigo', show: hasWizard },
                        { id: 'pbe', title: 'Avaliação PBE (Inteligente)', desc: 'Formulário inteligente com triagem de Red Flags.', href: `/dashboard/${slug}/test-form/pbe`, type: 'system', color: 'blue', show: hasPbe },
                        { id: 'ultimate-pbe', title: 'Ultimate PBE (Fusão)', desc: 'Clínica + Física + Biomecânica em uma tela.', href: `/dashboard/${slug}/test-form/ultimate-pbe`, type: 'system', color: 'violet', show: hasUltimate },
                        { id: 'physical', title: 'Avaliação Física Avançada', desc: 'Versão completa com 8 etapas e cálculos.', href: `/dashboard/${slug}/test-form/physical`, type: 'system', color: 'emerald', show: hasPhysical },
                        { id: 'diabetic-foot', title: 'Palmilha Pé Insensível', desc: 'Avaliação para pés diabéticos.', href: `/dashboard/${slug}/test-form/diabetic-foot`, type: 'system', color: 'emerald', show: hasDiabetic },
                        { id: 'clinical-evolution', title: 'Evolução Clínica & IA', desc: 'Evolução assistida por voz e tutor de carga.', href: `/dashboard/${slug}/test-form/clinical-evolution`, type: 'system', color: 'indigo', show: hasEvolution }
                    ].filter(f => f.show).map((form) => (
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
                                const lowerTitle = t.title?.toLowerCase() || '';
                                if (lowerTitle.includes('palmilha biomecânica') && !lowerTitle.includes('v3')) return false;
                                if (lowerTitle.includes('palmilha biomecânica v3')) return false;
                                if (lowerTitle.includes('saúde da mulher')) return false;
                                if (lowerTitle.includes('avaliação clínica inteligente') || lowerTitle.includes('pbe (inteligente)')) return false;
                                if (lowerTitle.includes('física avançada')) return false;
                                if (lowerTitle.includes('ultimate pbe')) return false;
                                if (lowerTitle.includes('tree wizard')) return false;
                                if (lowerTitle.includes('pé insensível') || lowerTitle.includes('pé diabético')) return false;
                                if (lowerTitle.includes('evolução clínica & ia')) return false;
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
                                            professionals={professionals}
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
