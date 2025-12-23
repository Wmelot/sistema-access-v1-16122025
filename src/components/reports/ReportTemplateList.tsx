'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, FileText, MoreHorizontal, Copy, Trash2, Edit } from "lucide-react"
import Link from "next/link"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { SecurityConfirmationDialog } from "@/components/ui/security-confirmation-dialog"
import { duplicateReportTemplate, deleteReportTemplate } from "@/app/dashboard/settings/reports/actions"
import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface ReportTemplateListProps {
    templates: any[]
}

export function ReportTemplateList({ templates }: ReportTemplateListProps) {
    const [securityDialog, setSecurityDialog] = useState<{
        open: boolean
        action: 'duplicate' | 'delete' | null
        templateId: string | null
    }>({
        open: false,
        action: null,
        templateId: null
    })
    const router = useRouter()

    const handleAction = async (password: string) => {
        if (!securityDialog.templateId || !securityDialog.action) return

        try {
            if (securityDialog.action === 'duplicate') {
                const res = await duplicateReportTemplate(securityDialog.templateId, password)
                if (res.success) {
                    toast.success("Modelo duplicado com sucesso!")
                } else {
                    toast.error(res.message || "Erro ao duplicar modelo.")
                    return // Keep dialog open if wrong password? Or close and re-open? Usually we want to stop if error is password related.
                    // But SecurityDialog usually handles the 'error' toast if we throw or return failure?
                    // The SecurityDialog expects a promise. If it resolves, it closes. If it rejects, it shows errors?
                    // Let's assume SecurityDialog closes on success.
                }
            } else if (securityDialog.action === 'delete') {
                const res = await deleteReportTemplate(securityDialog.templateId, password)
                if (res?.success) {
                    toast.success("Modelo excluído com sucesso!")
                    router.refresh()
                } else {
                    toast.error((res as any)?.error || (res as any)?.message || "Erro ao excluír modelo.")
                }
            }
        } catch (error) {
            toast.error("Erro inesperado.")
            console.error(error)
        } finally {
            setSecurityDialog({ open: false, action: null, templateId: null })
        }
    }

    return (
        <div className="space-y-6">
            <SecurityConfirmationDialog
                open={securityDialog.open}
                onOpenChange={(open) => !open && setSecurityDialog(prev => ({ ...prev, open: false }))}
                onConfirm={handleAction}
                title={securityDialog.action === 'delete' ? "Excluir Modelo" : "Duplicar Modelo"}
                description={securityDialog.action === 'delete'
                    ? "Esta ação não pode ser desfeita. Digite sua senha para confirmar."
                    : "Digite sua senha para confirmar a duplicação deste modelo."
                }
            />
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Modelos de Relatório</h3>
                    <p className="text-sm text-muted-foreground">
                        Crie e gerencie modelos de documentos (Atestados, Encaminhamentos, Fichas).
                    </p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/settings/reports/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Modelo
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates.length === 0 ? (
                    <Card className="border-dashed col-span-full">
                        <CardHeader>
                            <CardTitle className="text-center">Nenhum modelo criado</CardTitle>
                            <CardDescription className="text-center">Clique em "Novo Modelo" para começar.</CardDescription>
                        </CardHeader>
                    </Card>
                ) : (
                    templates.map((template: any) => (
                        <Card key={template.id} className="hover:bg-muted/50 transition-colors">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-primary" />
                                    {template.title}
                                </CardTitle>
                                <CardDescription className="text-xs uppercase font-medium">
                                    {template.type === 'standard' && 'Relatório Dinâmico'}
                                    {template.type === 'certificate' && 'Atestado / Declaração'}
                                    {template.type === 'gym_auth' && 'Autorização Academia'}
                                    {template.type === 'counter' && 'Contador de Sessões'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-end gap-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem asChild>
                                                <Link href={`/dashboard/settings/reports/${template.id}`} className="flex items-center cursor-pointer">
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Editar
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => setSecurityDialog({ open: true, action: 'duplicate', templateId: template.id })}
                                                className="cursor-pointer"
                                            >
                                                <Copy className="mr-2 h-4 w-4" />
                                                Duplicar
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() => setSecurityDialog({ open: true, action: 'delete', templateId: template.id })}
                                                className="text-red-500 focus:text-red-500 cursor-pointer"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Excluir
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
