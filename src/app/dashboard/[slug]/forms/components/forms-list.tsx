'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Plus, Pencil, FileText, Settings, Activity, Brain, Zap, Dumbbell } from 'lucide-react'
import Link from 'next/link'
import { ViewModeToggle } from "@/components/ui/view-mode-toggle"
import { useViewMode } from "@/hooks/use-view-mode"
import { ManagementHeader } from "@/components/dashboard/management-header"
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
import { useGlobalLoader } from '@/components/providers/global-loader-provider'

interface FormsListProps {
    customForms: any[]
    user: any
    slug?: string
    professionals?: any[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Reusable template card (for user custom / non-locked forms)
// ─────────────────────────────────────────────────────────────────────────────
function TemplateCard({ template, slug, user, professionals, showLoading }: any) {
    return (
        <Card className="hover:border-primary/50 transition-colors flex flex-col justify-between relative group">
            <div>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-medium line-clamp-1" title={template.title}>
                        {template.title}
                    </CardTitle>
                    <div className="absolute top-2 right-2">
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
                        <Badge
                            variant={template.is_active ? "default" : "secondary"}
                            className={template.is_active ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                        >
                            {template.is_active ? "Ativo" : "Rascunho / Inativo"}
                        </Badge>
                        <Badge variant="outline" className="text-xs font-normal">Personalizado</Badge>
                    </div>
                    <CardDescription className="line-clamp-2 min-h-[40px]">
                        {template.description || "Sem descrição."}
                    </CardDescription>
                </CardContent>
            </div>
            <div className="p-6 pt-0">
                <Link
                    href={`/dashboard/${slug}/forms/builder/${template.id}`}
                    className="w-full"
                    onClick={() => showLoading()}
                >
                    <Button
                        variant="outline"
                        className="w-full group-hover:bg-primary group-hover:text-white transition-colors"
                        disabled={!template.canEdit}
                    >
                        <Pencil className="mr-2 h-3 w-3" />
                        {template.canEdit ? 'Editar Layout' : 'Apenas Visualizar'}
                    </Button>
                </Link>
            </div>
        </Card>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Known legacy system templates that may have is_locked=false in the DB
// but should never appear in the user's custom forms section
const LEGACY_SYSTEM_TITLES = [
    'pbe concept',
    'tree wizard',
    'ultimate pbe',
    'saúde da mulher',
    'física avançada',
    'avaliação física avançada',
    'palmilha biomecânica',
    'pé diabético (sistema)',
    'evolução clínica (sistema)',
    'pé insensível (sistema)',
    'palmilha 5.0 (sistema)',
    'pbe 5.0 (sistema)',
    'pbe-5',
    'pbe_5_system',
    'smart pbe',
    'smart wizard',
    'avaliação clínica inteligente',
]

// ─────────────────────────────────────────────────────────────────────────────
// Filter helpers
// ─────────────────────────────────────────────────────────────────────────────
function isCustomUserForm(t: any) {
    if (t.is_locked) return false
    if (t.type === 'questionnaire' || t.type === 'protocol') return false
    const lowerTitle = t.title?.toLowerCase() || ''
    if (lowerTitle.includes('feegow')) return false
    if (lowerTitle.trim() === 'evolução') return false
    if (lowerTitle.includes('backup')) return false
    if (lowerTitle.includes('acompanhamento de palmilhas')) return false
    if (lowerTitle.includes('manutenção de palmilhas')) return false
    // Block known legacy system names (may be is_locked=false in the DB)
    if (LEGACY_SYSTEM_TITLES.some(blocked => lowerTitle.includes(blocked))) return false
    return true
}


function isQuestionnaire(t: any) {
    const lowerTitle = t.title?.toLowerCase() || ''
    return t.type === 'questionnaire' ||
        lowerTitle.includes('acompanhamento de palmilhas') ||
        lowerTitle.includes('manutenção de palmilhas')
}

function isProtocol(t: any) {
    return t.type === 'protocol' || t.title?.toLowerCase().includes('protocolo')
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export function FormsList({ customForms, user, slug, professionals = [] }: FormsListProps) {
    const { viewMode, setViewMode, isLoaded } = useViewMode('forms-view-mode', 'grid')
    const { showLoading } = useGlobalLoader()

    if (!isLoaded) return <div className="animate-pulse">Carregando...</div>

    const customUserForms = customForms.filter(isCustomUserForm)
    const questionnaireForms = customForms.filter(isQuestionnaire)
    const protocolForms = customForms.filter(isProtocol)

    return (
        <div className="space-y-6">
            <ManagementHeader
                slug={slug!}
                title="Gestão de Formulários"
                description="Crie e gerencie seus próprios formulários e avaliações personalizados."
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
            </ManagementHeader >

            {viewMode === 'grid' ? (
                <div className="space-y-8">
                    {/* 📁 Custom user forms */}
                    {customUserForms.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-5">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">📁 Seus Formulários Personalizados</span>
                                <div className="flex-1 h-px bg-slate-100" />
                            </div>
                            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                                {customUserForms.map((template) => (
                                    <TemplateCard
                                        key={template.id}
                                        template={template}
                                        slug={slug}
                                        user={user}
                                        professionals={professionals}
                                        showLoading={showLoading}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {customUserForms.length === 0 && (
                        <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-2xl bg-slate-50/50">
                            <Settings className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                            <h3 className="text-base font-bold text-slate-600 mb-1">Nenhum formulário personalizado ainda</h3>
                            <p className="text-sm text-slate-400 max-w-sm mx-auto">
                                Clique em "Novo Formulário" para criar avaliações personalizadas para sua clínica.
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                /* ─── LIST VIEW ─── */
                <div className="space-y-3">
                    {customUserForms.length > 0 && (
                        <>
                            <Separator className="my-6" />
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">📁 Seus Formulários Personalizados</div>
                            {customUserForms.map((template: any) => (
                                <Card key={template.id} className="hover:border-primary/50 transition-colors">
                                    <div className="flex items-center gap-4 p-4">
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="font-semibold text-lg">{template.title}</h3>
                                                <div className="flex gap-2">
                                                    <Badge variant={template.is_active ? "default" : "secondary"} className={template.is_active ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}>
                                                        {template.is_active ? "Ativo" : "Inativo"}
                                                    </Badge>
                                                    <Badge variant="outline" className="text-xs font-normal">Personalizado</Badge>
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
                                            <Link href={`/dashboard/${slug}/forms/builder/${template.id}`}>
                                                <Button variant="outline" size="sm">Editar</Button>
                                            </Link>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </>
                    )}
                </div>
            )
            }
        </div >
    )
}
