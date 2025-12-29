'use client'

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Plus, Sparkles, Bold, Italic, Strikethrough, Code, Clock } from "lucide-react"
import { useState, useRef } from "react"
import { toast } from "sonner"
import { updateTemplate, createTemplate } from "../actions"

export function TemplateDialog({ template, children }: { template?: any, children?: React.ReactNode }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [content, setContent] = useState(template?.content || "")
    const [triggerType, setTriggerType] = useState(template?.trigger_type || "manual")
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const handleInsertVariable = (variable: string) => {
        const char = ` {{${variable}}} `
        insertAtCursor(char)
    }

    const handleFormat = (char: string) => {
        const input = textareaRef.current
        if (!input) {
            setContent((prev: string) => prev + char + char) // Fallback append if no ref
            return
        }

        const start = input.selectionStart
        const end = input.selectionEnd
        const text = input.value

        const before = text.substring(0, start)
        const selected = text.substring(start, end)
        const after = text.substring(end)

        const newText = before + char + selected + char + after
        setContent(newText)

        // Restore selection (optional, but nice UX to select the wrapped text)
        setTimeout(() => {
            input.focus()
            input.setSelectionRange(start + char.length, end + char.length)
        }, 0)
    }

    const insertAtCursor = (textToInsert: string) => {
        const input = textareaRef.current
        if (!input) {
            setContent((prev: string) => prev + textToInsert)
            return
        }

        const start = input.selectionStart
        const end = input.selectionEnd
        const text = input.value

        const before = text.substring(0, start)
        const after = text.substring(end)

        setContent(before + textToInsert + after)

        setTimeout(() => {
            input.focus()
            input.setSelectionRange(start + textToInsert.length, start + textToInsert.length)
        }, 0)
    }

    const handleSubmit = async (formData: FormData) => {
        setLoading(true)
        formData.set('content', content)
        formData.set('trigger_type', triggerType) // Ensure trigger type is updated

        let res;
        if (template?.id) {
            res = await updateTemplate(template.id, formData)
        } else {
            res = await createTemplate(formData)
        }

        setLoading(false)

        if (res.success) {
            toast.success(template ? "Modelo atualizado!" : "Modelo criado com sucesso!")
            setOpen(false)
            if (!template) setContent("") // Only clear if creating new
        } else {
            toast.error(res.error || "Erro ao salvar modelo")
        }
    }

    const showDelayInput = ['post_attendance', 'insole_delivery', 'insole_maintenance'].includes(triggerType)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Novo Modelo
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{template ? "Editar Modelo" : "Criar Modelo de Mensagem"}</DialogTitle>
                    <DialogDescription>
                        {template ? "Edite as configurações do modelo." : "Configure mensagens automáticas para WhatsApp."}
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="flex flex-col gap-4 py-4 flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Título do Modelo</Label>
                            <Input id="title" name="title" placeholder="Ex: Lembrete de Consulta" defaultValue={template?.title} required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="channel">Canal</Label>
                                <Select name="channel" defaultValue={template?.channel || "whatsapp"}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                        <SelectItem value="email">E-mail</SelectItem>
                                        <SelectItem value="sms">SMS</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="trigger_type">Tipo de Gatilho</Label>
                                <Select name="trigger_type" value={triggerType} onValueChange={setTriggerType} defaultValue={template?.trigger_type || "manual"}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="manual">Manual (Ao Clicar)</SelectItem>
                                        <SelectItem value="appointment_confirmation">Confirmação de Agendamento</SelectItem>
                                        <SelectItem value="appointment_reminder">Lembrete (24h antes)</SelectItem>
                                        <SelectItem value="birthday">Aniversário</SelectItem>
                                        <SelectItem value="post_attendance">Pós-Atendimento</SelectItem>
                                        <SelectItem value="insole_delivery">Entrega Palmilha</SelectItem>
                                        <SelectItem value="insole_maintenance">Manutenção Palmilha</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {showDelayInput && (
                            <div className="grid gap-4 bg-slate-50 p-3 rounded-md border border-slate-100 animate-in fade-in slide-in-from-top-1">
                                <div className="grid gap-2">
                                    <Label htmlFor="delay_days" className="flex items-center gap-2 text-primary">
                                        <Clock className="w-4 h-4" />
                                        Dias para envio após o gatilho
                                    </Label>
                                    <Input
                                        type="number"
                                        id="delay_days"
                                        name="delay_days"
                                        defaultValue={template?.delay_days || 0}
                                        min={0}
                                        className="bg-white"
                                        placeholder="0 = Envio no mesmo dia"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="questionnaire_type" className="flex items-center gap-2 text-primary">
                                        <Sparkles className="w-4 h-4" />
                                        Questionário Vinculado (Opcional)
                                    </Label>
                                    <Select name="questionnaire_type" defaultValue={template?.questionnaire_type || "none"}>
                                        <SelectTrigger className="bg-white">
                                            <SelectValue placeholder="Selecione um questionário..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Nenhum (Apenas Mensagem)</SelectItem>
                                            <SelectItem value="insoles_40d">Palmilhas: Acompanhamento (40 Dias)</SelectItem>
                                            <SelectItem value="insoles_1y">Palmilhas: Renovação (1 Ano)</SelectItem>
                                            <SelectItem value="spadi">Ombro (SPADI)</SelectItem>
                                            <SelectItem value="lefs">Membros Inferiores (LEFS)</SelectItem>
                                            <SelectItem value="dash">Membros Superiores (DASH)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        Se selecionado, o link <code>{"{{link_avaliacao}}"}</code> abrirá este formulário.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="grid gap-2">
                            <div className="flex justify-between items-end mb-1">
                                <Label htmlFor="content">Conteúdo da Mensagem</Label>
                            </div>

                            {/* Toolbar */}
                            <div className="flex flex-wrap gap-2 p-1 bg-muted/30 rounded-t-md border border-b-0 items-center">
                                {/* Formatting */}
                                <div className="flex gap-0.5 border-r pr-2 mr-2">
                                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleFormat('*')} title="Negrito">
                                        <Bold className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleFormat('_')} title="Itálico">
                                        <Italic className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleFormat('~')} title="Tachado">
                                        <Strikethrough className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleFormat('```')} title="Monoespaçado">
                                        <Code className="h-3.5 w-3.5" />
                                    </Button>
                                </div>

                                {/* Variables */}
                                <div className="flex gap-1 flex-wrap">
                                    <Button type="button" variant="outline" size="sm" onClick={() => handleInsertVariable('paciente')} className="h-6 text-[10px] px-2">
                                        Nome
                                    </Button>
                                    <Button type="button" variant="outline" size="sm" onClick={() => handleInsertVariable('data')} className="h-6 text-[10px] px-2">
                                        Data
                                    </Button>
                                    <Button type="button" variant="outline" size="sm" onClick={() => handleInsertVariable('horario')} className="h-6 text-[10px] px-2">
                                        Horário
                                    </Button>
                                    <Button type="button" variant="outline" size="sm" onClick={() => handleInsertVariable('medico')} className="h-6 text-[10px] px-2">
                                        Prof.
                                    </Button>
                                    <Button type="button" variant="outline" size="sm" onClick={() => handleInsertVariable('link_avaliacao')} className="h-6 text-[10px] px-2 border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary">
                                        Link Avaliação
                                    </Button>
                                    <Button type="button" variant="outline" size="sm" onClick={() => handleInsertVariable('confirmacao_link')} className="h-6 text-[10px] px-2 border-green-500/30 bg-green-500/5 hover:bg-green-500/10 text-green-700 dark:text-green-400">
                                        Link Confirmação
                                    </Button>
                                </div>
                            </div>

                            <Textarea
                                ref={textareaRef}
                                id="content"
                                name="content"
                                placeholder="Olá {{paciente}}, ..."
                                className="min-h-[150px] font-mono text-sm rounded-t-none border-t-0 focus-visible:ring-0 focus-visible:border-primary"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                required
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Use a barra de ferramentas para formatar.
                            </p>
                        </div>

                        {/* LIVE PREVIEW */}
                        <div className="pt-2">
                            <Label className="text-xs text-muted-foreground mb-2 block">Pré-visualização (Como o paciente verá)</Label>
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <div className="flex flex-col space-y-2">
                                    <div className="bg-[#DCF8C6] dark:bg-green-900 dark:text-green-50 text-slate-900 p-3 rounded-lg rounded-tr-none shadow-sm text-sm self-end max-w-[90%] font-sans whitespace-pre-wrap border border-green-200 dark:border-green-800">
                                        {content
                                            ? content
                                                .replace(/{{paciente}}/g, "João Silva")
                                                .replace(/{{data}}/g, "25/12/2025")
                                                .replace(/{{horario}}/g, "14:30")
                                                .replace(/{{medico}}/g, "Dra. Rayane")
                                                .replace(/{{link_avaliacao}}/g, "https://beta.accessfisio.com/avaliacao/xYz123...")
                                            : "Digite a mensagem para visualizar..."
                                        }
                                        <span className="text-[10px] text-slate-500 dark:text-green-200/70 block text-right mt-1 select-none">14:31 ✓✓</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="mt-auto pt-2 border-t">
                        <Button type="submit" disabled={loading}>
                            {loading ? "Salvando..." : "Salvar Modelo"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
