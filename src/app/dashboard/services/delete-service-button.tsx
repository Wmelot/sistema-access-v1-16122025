"use client"

import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { useState } from "react"
import { SecurityConfirmationDialog } from "@/components/ui/security-confirmation-dialog"
import { deleteService } from "@/app/dashboard/services/actions"
import { toast } from "sonner"

export function DeleteServiceButton({ serviceId }: { serviceId: string }) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    async function handleConfirm(password: string) {
        setIsLoading(true)
        try {
            const result = await deleteService(serviceId, password)
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success("Serviço excluído com sucesso.")
                setOpen(false)
            }
        } catch (error) {
            toast.error("Erro inesperado.")
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                className="text-red-500 hover:text-red-700 h-8 w-8"
                onClick={() => setOpen(true)}
            >
                <Trash2 className="h-4 w-4" />
            </Button>

            <SecurityConfirmationDialog
                open={open}
                onOpenChange={setOpen}
                title="Excluir Serviço"
                description={
                    <div className="flex flex-col gap-2">
                        <p>Tem certeza que deseja excluir este serviço?</p>
                        <p className="text-xs text-muted-foreground bg-amber-50 p-2 rounded border border-amber-200 text-amber-800">
                            Atenção: Essa ação requer senha de administrador para garantir segurança.
                        </p>
                    </div>
                }
                onConfirm={handleConfirm}
                confirmText="Excluir Permanentemente"
                variant="destructive"
                isLoading={isLoading}
            />
        </>
    )
}
