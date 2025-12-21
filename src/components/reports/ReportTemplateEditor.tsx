"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Save, Sparkles, Loader2, Printer } from "lucide-react"
import { RichTextEditor } from "./rich-text-editor"
import { VariablePicker } from "./variable-picker"
import { saveReportTemplate, generateReportAI } from "@/app/dashboard/settings/reports/actions"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

interface FormTemplate {
    id: string
    title: string
    type: string
    fields: any[]
}

interface ReportTemplate {
    id: string
    title: string
    type: string
    content?: any
    category?: string
    config?: any
}

interface ReportTemplateEditorProps {
    template?: ReportTemplate | null
    formTemplates: FormTemplate[]
    clinicSettings?: any // Add this
}

export function ReportTemplateEditor({ template, formTemplates, clinicSettings }: ReportTemplateEditorProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    // Basic Info
    const [title, setTitle] = useState(template?.title || "")
    const [category, setCategory] = useState(template?.category || "Laudos")

    // Config (JSON)
    const [showLogo, setShowLogo] = useState(template?.config?.showLogo ?? true)
    const [logoPosition, setLogoPosition] = useState(template?.config?.logoPosition || 'header') // 'header' | 'watermark' | 'both'
    const [showSignature, setShowSignature] = useState(template?.config?.showSignature ?? true)

    const handleTestPrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast.error("Popup bloqueado. Permita popups para visualizar a impressão.");
            return;
        }

        const logoUrl = clinicSettings?.document_logo_url || clinicSettings?.logo_url || '';
        const today = new Date().toLocaleDateString('pt-BR');

        // Mock data replacement
        let printContent = content
            .replace(/\[NOME COMPLETO DO PACIENTE\]/g, "Breno Neves Chagas Mendes")
            .replace(/\[CPF DO PACIENTE\]/g, "123.456.789-00")
            .replace(/\[DATA DE NASCIMENTO\]/g, "15/05/1990")
            .replace(/\[ENDEREÇO DO PACIENTE\]/g, "Rua Exemplo, 123, Centro")
            .replace(/\[DATA ATUAL\]/g, today);

        // Logo HTML generation based on position
        let logoHeaderHtml = '';
        let logoWatermarkCss = '';
        let logoFooterHtml = '';

        if (showLogo && logoUrl) {
            if (logoPosition === 'header' || logoPosition === 'both') {
                logoHeaderHtml = `<div style="text-align: center; margin-bottom: 2rem;"><img src="${logoUrl}" style="max-height: 80px; max-width: 200px;" /></div>`;
            }
            if (logoPosition === 'watermark' || logoPosition === 'both') {
                logoWatermarkCss = `
                    body::before {
                        content: "";
                        position: fixed;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        width: 70%;
                        height: 70%;
                        background-image: url('${logoUrl}');
                        background-repeat: no-repeat;
                        background-position: center;
                        background-size: contain;
                        opacity: 0.08;
                        z-index: -1;
                        pointer-events: none;
                    }
                `;
            }
            if (logoPosition === 'footer_small') {
                logoFooterHtml = `<div style="text-align: center; margin-top: 2rem; opacity: 0.7;"><img src="${logoUrl}" style="max-height: 40px;" /></div>`;
            }
        }

        const signatureHtml = showSignature ? `
            <div style="margin-top: 4rem; text-align: center;">
                <div style="border-top: 1px solid #000; display: inline-block; padding-top: 0.5rem; width: 300px;">
                    <p style="margin: 0; font-weight: bold;">Fisioterapeuta Responsável</p>
                    <p style="margin: 0; font-size: 0.9rem;">CREFITO: 123456-F</p>
                </div>
            </div>
        ` : '';

        const clinicFooter = `
            <div style="position: fixed; bottom: 0; left: 0; width: 100%; text-align: center; font-size: 0.75rem; color: #666; padding-bottom: 0.5rem; background: white;">
                ${clinicSettings?.name || 'Minha Clínica'} • ${clinicSettings?.phone || ''} • ${clinicSettings?.website || ''}
            </div>
        `;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Visualização de Impressão</title>
                    <style>
                        @page { margin: 2cm; }
                        body { font-family: 'Arial', sans-serif; line-height: 1.5; color: #000; margin: 0; padding: 0 0 50px 0; }
                        ${logoWatermarkCss}
                        .content { text-align: justify; }
                        p { margin-bottom: 1rem; }
                        table { border-collapse: collapse; width: 100%; margin-bottom: 1rem; }
                        td, th { border: 1px solid #ddd; padding: 8px; }
                        th { background-color: #fca5a5; } /* Slight red tint for headers just to show style */
                    </style>
                </head>
                <body>
                    ${logoHeaderHtml}
                    <div class="content">
                        ${printContent}
                    </div>
                    ${signatureHtml}
                    ${logoFooterHtml}
                    ${clinicFooter}
                </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.focus();

        // Wait for image to load before printing
        setTimeout(() => {
            printWindow.print();
        }, 500);
    }

    // Content
    const [content, setContent] = useState<string>(
        typeof template?.content === 'string' ? template.content :
            (template?.content ? JSON.stringify(template.content) : '')
    )

    // AI State
    const [isGenerating, setIsGenerating] = useState(false)
    const [aiInstruction, setAiInstruction] = useState("")

    // Handle AI Generation
    const handleGenerateAI = async () => {
        setIsGenerating(true)
        const context = `
            Instrução do Usuário: ${aiInstruction || "Gere um modelo padrão para esta categoria."}

            Título: ${title}
            Categoria: ${category}
            
            Variáveis do Sistema disponíveis:
            - Paciente: Nome, CPF, Idade, Endereço...
            - Profissional: Nome, Registro, Especialidade...
            - Agenda: Data, Horário, Procedimento...
            - Geral: Data Atual, Cidade...

            Variáveis de Formulários disponíveis: 
            ${formTemplates.map(f => f.title).join(', ')}
        `
        const result = await generateReportAI(context)
        setIsGenerating(false)

        if (result?.error) {
            toast.error(result.error)
        } else if (result?.text) {
            setContent(prev => prev + `<p>${result.text}</p>`)
            toast.success("Sugestão gerada!")
        }
    }

    const handleSave = async () => {
        if (!title.trim()) {
            toast.error("O título é obrigatório.")
            return
        }

        setLoading(true)
        const formData = new FormData()
        if (template?.id) formData.append('id', template.id)
        formData.append('title', title)
        formData.append('category', category)
        formData.append('content', content)
        formData.append('type', 'smart_report')

        // Save config as JSON
        const config = {
            showLogo,
            logoPosition,
            showSignature
        }
        formData.append('config', JSON.stringify(config))

        const result = await saveReportTemplate(formData)

        setLoading(false)
        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success("Modelo salvo com sucesso.")
            router.push('/dashboard/settings/reports')
        }
    }

    const handleInsertVariable = (variable: string) => {
        navigator.clipboard.writeText(variable)
        toast.info("Variável copiada! Cole (Ctrl+V) onde desejar no texto.")
    }

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">
                            {template?.id ? "Editar Modelo Inteligente" : "Novo Modelo Inteligente"}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Crie laudos dinâmicos usando IA e variáveis.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleTestPrint}>
                        <Printer className="w-4 h-4 mr-2" />
                        Testar Impressão
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Salvar Modelo
                    </Button>
                </div>
            </div>

            {/* Main Layout */}
            <div className="flex flex-1 gap-6 overflow-hidden">
                {/* Left: Editor & Config */}
                <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                    <Card className="shrink-0 p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Title & Category */}
                            <div className="space-y-2">
                                <Label htmlFor="title">Título do Documento</Label>
                                <Input
                                    id="title"
                                    placeholder="Ex: Laudo de Evolução..."
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category">Categoria</Label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Laudos">Laudos</SelectItem>
                                        <SelectItem value="Atestados">Atestados e Declarações</SelectItem>
                                        <SelectItem value="Encaminhamentos">Encaminhamentos</SelectItem>
                                        <SelectItem value="Outros">Outros</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Toggles */}
                        <div className="flex items-center gap-8 pt-2">
                            <div className="flex items-center space-x-2">
                                <Switch id="showLogo" checked={showLogo} onCheckedChange={setShowLogo} />
                                <Label htmlFor="showLogo">Exibir Logo da Clínica</Label>
                            </div>

                            {/* Logo Position Selector - Only visible if showLogo is true */}
                            {showLogo && (
                                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4">
                                    <Label className="text-xs text-muted-foreground mr-1">Estilo:</Label>
                                    <Select value={logoPosition} onValueChange={setLogoPosition}>
                                        <SelectTrigger className="h-8 w-[140px] text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="header">Cabeçalho</SelectItem>
                                            <SelectItem value="watermark">Marca D'água</SelectItem>
                                            <SelectItem value="both">Ambos</SelectItem>
                                            <SelectItem value="footer_small">Rodapé Pequeno</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="flex items-center space-x-2">
                                <Switch id="showSignature" checked={showSignature} onCheckedChange={setShowSignature} />
                                <Label htmlFor="showSignature">Exibir Assinatura Profissional</Label>
                            </div>
                        </div>
                    </Card>

                    <div className="flex-1 min-h-0 flex flex-col">
                        <RichTextEditor
                            content={content}
                            onChange={setContent}
                        />
                    </div>
                </div>

                {/* Right: Sidebar */}
                <div className="w-80 shrink-0 flex flex-col gap-4">
                    <Card className="bg-primary/5 border-primary/20 shrink-0">
                        <CardContent className="p-4 flex flex-col items-center text-center space-y-2">
                            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                            <h3 className="font-semibold text-primary">Gerar com IA</h3>
                            <p className="text-xs text-muted-foreground">
                                A IA preenche o laudo automaticamente com base nos dados.
                            </p>
                            <div className="space-y-2 w-full text-left">
                                <Label htmlFor="ai-instruction" className="text-xs text-muted-foreground">
                                    Instrução para a IA (Opcional)
                                </Label>
                                <textarea
                                    id="ai-instruction"
                                    className="w-full text-xs p-2 rounded-md border resize-none focus:outline-none focus:ring-1 focus:ring-primary min-h-[80px]"
                                    placeholder="Ex: Crie um atestado de comparecimento..."
                                    value={aiInstruction}
                                    onChange={(e) => setAiInstruction(e.target.value)}
                                />
                            </div>

                            <Button
                                size="sm"
                                className="w-full bg-gradient-to-r from-primary to-purple-600 border-0"
                                onClick={handleGenerateAI}
                                disabled={isGenerating}
                            >
                                {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                {isGenerating ? 'Criando...' : 'Gerar'}
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="flex-1 min-h-0">
                        <VariablePicker
                            formTemplates={formTemplates}
                            onInsert={handleInsertVariable}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
