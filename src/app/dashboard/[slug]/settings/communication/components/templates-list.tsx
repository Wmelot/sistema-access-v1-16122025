'use client'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2, Send, Loader2, Phone, Pencil } from "lucide-react"
import { deleteTemplate, sendTestMessage, toggleTemplateStatus } from "../actions"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { useState } from "react"
import { useRouter } from "next/navigation"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TemplateDialog } from "./add-template-dialog"

interface Template {
    id: string
    title: string
    content: string
    channel: string
    trigger_type: string
    is_active: boolean
}

export function TemplatesList({ templates, slug }: { templates: Template[], slug?: string }) {
    const router = useRouter()
    const [testOpen, setTestOpen] = useState(false)
    const [testLoading, setTestLoading] = useState(false)
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
    const [testPhone, setTestPhone] = useState("")

    // Delete State
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [templateToDelete, setTemplateToDelete] = useState<string | null>(null)

    const handleDeleteClick = (id: string) => {
        setTemplateToDelete(id)
        setDeleteOpen(true)
    }

    const confirmDelete = async () => {
        if (!templateToDelete) return

        const res = await deleteTemplate(templateToDelete, slug)
        if (res.success) {
            toast.success("Modelo excluído com sucesso")
            setDeleteOpen(false)
        } else {
            toast.error(res.error)
        }
    }

    const [optimisticStatuses, setOptimisticStatuses] = useState<Record<string, boolean>>({})

    const handleToggleStatus = async (id: string, newStatus: boolean) => {
        // 1. Optimistic Update
        setOptimisticStatuses(prev => ({ ...prev, [id]: newStatus }))

        // 2. Server Action
        const res = await toggleTemplateStatus(id, newStatus, slug)

        if (res.success) {
            toast.success(newStatus ? "Modelo ativado" : "Modelo desativado")
        } else {
            toast.error("Erro ao atualizar status")
            // Rollback on error
            setOptimisticStatuses(prev => ({ ...prev, [id]: !newStatus }))
        }
    }

    const openTestDialog = (template: Template) => {
        setSelectedTemplate(template)
        setTestPhone("")
        setTestOpen(true)
    }

    const handleSendTest = async () => {
        if (!selectedTemplate || !testPhone) return

        setTestLoading(true)
        const res = await sendTestMessage(selectedTemplate.id, testPhone, slug)
        setTestLoading(false)

        if (res.success) {
            toast.success("Mensagem de teste enviada!")
            setTestOpen(false)
        } else {
            if (res.code === 'NOT_CONFIGURED') {
                toast.error("WhatsApp Desconectado", {
                    description: "Conecte seu WhatsApp para enviar mensagens.",
                    action: {
                        label: "Conectar",
                        onClick: () => {
                            setTestOpen(false)
                            // Switch to whatsapp_config tab using URL search params or simple navigation if possible
                            // Since tabs are controlled by URL in parent, we push new URL
                            if (slug) router.push(`/dashboard/${slug}/settings/communication?tab=whatsapp_config`)
                            else router.push(`/dashboard/settings/communication?tab=whatsapp_config`)
                        }
                    },
                    duration: 8000
                })
            } else if (res.code === 'NOT_ACTIVE') {
                toast.error("Funcionalidade Inativa", {
                    description: "O envio automatizado pode ter custos adicionais.",
                    action: {
                        label: "Entendi",
                        onClick: () => { }
                    },
                    duration: 5000
                })
            } else {
                toast.error(res.error || "Falha no envio")
            }
        }
    }

    if (!templates.length) {
        return (
            <div className="text-center p-8 border rounded-lg bg-muted/20">
                <p className="text-muted-foreground">Nenhum modelo criado ainda.</p>
            </div>
        )
    }

    return (
        <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => {
                    const isActive = optimisticStatuses[template.id] ?? template.is_active
                    return (
                        <Card key={template.id} className={`flex flex-col transition-all duration-300 ${!isActive ? 'opacity-75 bg-muted/40' : ''}`}>
                            <CardHeader className="p-4 pb-2 space-y-0">
                                <div className="flex justify-between items-start gap-3">
                                    <div className="flex flex-col gap-1 min-w-0">
                                        <CardTitle className="text-lg font-bold tracking-tight text-slate-800 break-words line-clamp-2">
                                            {template.title}
                                        </CardTitle>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-bold uppercase bg-slate-50 text-slate-500 border-slate-200">
                                                {template.channel}
                                            </Badge>
                                            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-medium bg-blue-50 text-blue-700 border-blue-100">
                                                {template.trigger_type.replace(/_/g, ' ')}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 pt-0.5 pl-1">
                                        <Switch
                                            checked={isActive}
                                            onCheckedChange={(checked) => handleToggleStatus(template.id, checked)}
                                            className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-slate-200"
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 px-4 pb-4">
                                <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-md border border-slate-100 min-h-[80px] line-clamp-4 relative">
                                    <span className="opacity-90">{template.content}</span>
                                </div>
                                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                                    <span className="capitalize flex items-center gap-1.5 font-medium">
                                        <Phone className="w-3 h-3" />
                                        {template.channel}
                                    </span>
                                    <span className={`flex items-center gap-1 ${isActive ? 'text-green-600' : 'text-slate-400'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-slate-300'}`} />
                                        {isActive ? 'Ativo' : 'Inativo'}
                                    </span>
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-wrap items-center gap-2 p-4 pt-0">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!isActive}
                                    className="flex-1 min-w-[100px] text-blue-600 hover:text-blue-700 disabled:opacity-50"
                                    onClick={() => openTestDialog(template)}
                                >
                                    <Send className="h-4 w-4 mr-2" />
                                    <span className="sm:inline">Testar</span>
                                </Button>
                                <div className="flex gap-2 shrink-0">
                                    {/* Edit Button wrapped in Dialog */}
                                    <TemplateDialog template={template} slug={slug}>
                                        <Button variant="ghost" size="sm" className="h-9 px-2 hover:bg-blue-50 text-slate-500 hover:text-blue-600 border border-transparent hover:border-blue-100">
                                            <Pencil className="h-4 w-4 mr-1.5" />
                                            <span className="text-xs">Editar</span>
                                        </Button>
                                    </TemplateDialog>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-9 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100"
                                        onClick={() => handleDeleteClick(template.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                    )
                })}
            </div>

            {/* TEST SEND DIALOG */}
            <Dialog open={testOpen} onOpenChange={setTestOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Testar Disparo</DialogTitle>
                        <DialogDescription>
                            Envia uma mensagem real para o número abaixo usando o template: <strong>{selectedTemplate?.title}</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Número WhatsApp (DDD + Número)</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="phone"
                                    placeholder="21 99999-9999"
                                    className="pl-9"
                                    value={testPhone}
                                    onChange={(e) => setTestPhone(e.target.value)}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Dica: Substituiremos as variáveis por dados fictícios (João, Hoje, etc).
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setTestOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSendTest} disabled={testLoading || !testPhone.length}>
                            {testLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Enviar Agora
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DELETE CONFIRM ALERT */}
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Essa ação não pode ser desfeita. Isso excluirá permanentemente o modelo selecionado.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
