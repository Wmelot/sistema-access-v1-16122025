'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Save, ArrowLeft, Plus, Trash2, FileText, CheckSquare, GripVertical } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"

import { saveReportTemplate } from "@/app/dashboard/settings/reports/actions"

interface ReportTemplateEditorProps {
    template?: any
    formTemplates: any[]
}

const REPORT_TYPES = [
    { value: 'standard', label: 'Relatório Padrão (Campos Dinâmicos)' },
    { value: 'certificate', label: 'Atestado / Declaração' },
    { value: 'gym_auth', label: 'Autorização Academia' },
    { value: 'counter', label: 'Contador de Sessões / Encaminhamento' },
]

export function ReportTemplateEditor({ template, formTemplates }: ReportTemplateEditorProps) {
    const router = useRouter()
    const [isSaving, setIsSaving] = useState(false)
    const [title, setTitle] = useState(template?.title || '')
    const [type, setType] = useState(template?.type || 'standard')

    // Config State
    const [config, setConfig] = useState(template?.config || {
        selectedFields: [], // For standard
        content: '', // For certificate/gym
        showLogo: true,
        showSignature: true
    })

    // Helper to update config
    const updateConfig = (key: string, value: any) => {
        setConfig((prev: any) => ({ ...prev, [key]: value }))
    }

    // Handle Form Submit
    const handleSubmit = async () => {
        if (!title.trim()) {
            toast.error("O título é obrigatório")
            return
        }

        setIsSaving(true)
        const formData = new FormData()
        if (template?.id) formData.append('id', template.id)
        formData.append('title', title)
        formData.append('type', type)
        formData.append('config', JSON.stringify(config))

        const res = await saveReportTemplate(formData)

        if (res?.error) {
            toast.error(res.error)
            setIsSaving(false)
        } else {
            toast.success("Modelo salvo com sucesso!")
            setIsSaving(false)
            router.push('/dashboard/settings?tab=reports')
            router.refresh()
        }
    }

    // --- RENDERERS FOR CONFIG TYPES ---

    // 1. STANDARD: Select Fields from Form Templates
    const renderStandardConfig = () => {
        return (
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Formulários Disponíveis</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[400px] overflow-y-auto space-y-2">
                            {formTemplates.map(ft => (
                                <div key={ft.id} className="border rounded-md p-3">
                                    <div className="font-medium mb-2 flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        {ft.title}
                                    </div>
                                    <div className="pl-4 space-y-1">
                                        {(ft.fields || []).map((field: any) => {
                                            const isSelected = (config.selectedFields || []).some((sf: any) => sf.originalId === field.id)
                                            return (
                                                <div
                                                    key={field.id}
                                                    className={`text-sm flex items-center gap-2 cursor-pointer hover:bg-muted p-1 rounded ${isSelected ? 'opacity-50 pointer-events-none' : ''}`}
                                                    onClick={() => !isSelected && updateConfig('selectedFields', [...(config.selectedFields || []), { originalId: field.id, label: field.label, type: field.type, formId: ft.id, formTitle: ft.title }])}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                    {field.label}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Campos Selecionados (Arraste para ordenar)</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[400px] overflow-y-auto space-y-2">
                            {(config.selectedFields || []).length === 0 && (
                                <p className="text-sm text-muted-foreground italic text-center py-10">
                                    Nenhum campo selecionado. Clique nos itens à esquerda para adicionar.
                                </p>
                            )}
                            {(config.selectedFields || []).map((field: any, index: number) => (
                                <div key={index} className="flex items-center gap-2 border p-2 rounded-md bg-white shadow-sm group">
                                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                    <div className="flex-1">
                                        <div className="font-medium text-sm">{field.label}</div>
                                        <div className="text-xs text-muted-foreground">{field.formTitle}</div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => {
                                            const newFields = [...config.selectedFields]
                                            newFields.splice(index, 1)
                                            updateConfig('selectedFields', newFields)
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    // 2. CERTIFICATE: Rich Text (Simplified)
    const renderCertificateConfig = () => {
        const insertVariable = (variable: string) => {
            const textarea = document.getElementById('cert-content') as HTMLTextAreaElement
            if (textarea) {
                const start = textarea.selectionStart
                const end = textarea.selectionEnd
                const text = textarea.value
                const newText = text.substring(0, start) + variable + text.substring(end)
                updateConfig('content', newText)
                // Focus logic could go here
            }
        }

        return (
            <div className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className="cursor-pointer hover:bg-muted" onClick={() => insertVariable('{paciente_nome}')}>
                        {'{paciente_nome}'}
                    </Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-muted" onClick={() => insertVariable('{paciente_cpf}')}>
                        {'{paciente_cpf}'}
                    </Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-muted" onClick={() => insertVariable('{data_atual}')}>
                        {'{data_atual}'}
                    </Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-muted" onClick={() => insertVariable('{hora_inicio}')}>
                        {'{hora_inicio}'}
                    </Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-muted" onClick={() => insertVariable('{hora_fim}')}>
                        {'{hora_fim}'}
                    </Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-muted" onClick={() => insertVariable('{cid}')}>
                        {'{cid}'}
                    </Badge>
                </div>
                <Textarea
                    id="cert-content"
                    value={config.content || ''}
                    onChange={(e) => updateConfig('content', e.target.value)}
                    placeholder="Digite o texto do atestado aqui..."
                    className="min-h-[300px] font-mono text-base"
                />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">{template ? 'Editar Modelo' : 'Novo Modelo de Relatório'}</h1>
                        <p className="text-sm text-muted-foreground">Configure como o documento será gerado.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.back()}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={isSaving}>
                        <Save className="mr-2 h-4 w-4" />
                        {isSaving ? 'Salvando...' : 'Salvar Modelo'}
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-[300px_1fr]">
                {/* Sidebar Config */}
                <Card>
                    <CardHeader>
                        <CardTitle>Configurações Gerais</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Título do Modelo</Label>
                            <Input
                                placeholder="Ex: Relatório de Evolução"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Tipo de Documento</Label>
                            <Select value={type} onValueChange={(v) => setType(v as any)} disabled={!!template}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {REPORT_TYPES.map(t => (
                                        <SelectItem key={t.value} value={t.value}>
                                            {t.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                O tipo define o layout e os recursos disponíveis.
                            </p>
                        </div>

                        <div className="space-y-4 pt-4 border-t">
                            <div className="flex items-center justify-between">
                                <Label>Exibir Logo da Clínica</Label>
                                <Switch
                                    checked={config.showLogo}
                                    onCheckedChange={(c) => updateConfig('showLogo', c)}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label>Exibir Assinatura</Label>
                                <Switch
                                    checked={config.showSignature}
                                    onCheckedChange={(c) => updateConfig('showSignature', c)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Main Content Area */}
                <Card className="flex-1">
                    <CardHeader>
                        <CardTitle>Conteúdo do Documento</CardTitle>
                        <CardDescription>
                            {type === 'standard' ? 'Personalize quais campos aparecerão no relatório.' : 'Edite o texto e layout do documento.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {type === 'standard' && renderStandardConfig()}
                        {(type === 'certificate' || type === 'gym_auth' || type === 'counter') && renderCertificateConfig()}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
