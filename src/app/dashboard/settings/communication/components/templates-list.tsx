'use client'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2, Send, Loader2, Phone, Pencil } from "lucide-react"
import { deleteTemplate, sendTestMessage } from "../actions"
import { toast } from "sonner"
import { useState } from "react"
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

export function TemplatesList({ templates }: { templates: Template[] }) {
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

        const res = await deleteTemplate(templateToDelete)
        if (res.success) {
            toast.success("Modelo excluído com sucesso")
            setDeleteOpen(false)
        } else {
            toast.error(res.error)
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
        const res = await sendTestMessage(selectedTemplate.id, testPhone)
        setTestLoading(false)

        if (res.success) {
            toast.success("Mensagem de teste enviada!")
            setTestOpen(false)
        } else {
            toast.error(res.error || "Falha no envio")
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
                {templates.map((template) => (
                    <Card key={template.id} className="flex flex-col">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-base font-medium truncate pr-2">
                                    {template.title}
                                </CardTitle>
                                <Badge variant="secondary" className="text-xs">
                                    {template.trigger_type === 'manual' ? 'Manual' : 'Automático'}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 pb-4">
                            <p className="text-sm text-muted-foreground line-clamp-3 font-mono bg-muted/30 p-2 rounded">
                                {template.content}
                            </p>
                            <div className="mt-2 text-xs text-muted-foreground capitalize flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                                {template.channel}
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between pt-0 gap-2 items-center">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 text-blue-600 hover:text-blue-700"
                                onClick={() => openTestDialog(template)}
                            >
                                <Send className="h-4 w-4 mr-2" />
                                Testar
                            </Button>
                            <div className="flex gap-1 shrink-0">
                                {/* Edit Button wrapped in Dialog */}
                                <TemplateDialog template={template}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-50 text-slate-500 hover:text-blue-600">
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </TemplateDialog>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => handleDeleteClick(template.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                ))}
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
