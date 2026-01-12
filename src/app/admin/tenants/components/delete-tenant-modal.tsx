'use client'

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, AlertTriangle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { deleteTenant } from "../actions"

interface DeleteTenantModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    orgId: string
    orgName: string
    onSuccess?: () => void
}

export function DeleteTenantModal({ open, onOpenChange, orgId, orgName, onSuccess }: DeleteTenantModalProps) {
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)

    const handleDelete = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const result = await deleteTenant(orgId, password)

            if (result.success) {
                toast.success("Clínica excluída com sucesso")
                onOpenChange(false)
                setPassword("") // Reset
                onSuccess?.()
            } else {
                toast.error(result.error || "Erro ao excluir")
            }
        } catch (error) {
            toast.error("Ocorreu um erro inesperado")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md border-red-200">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-red-600 mb-2">
                        <div className="p-2 bg-red-100 rounded-full">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <span className="font-semibold uppercase tracking-wider text-xs">Zona de Perigo</span>
                    </div>
                    <DialogTitle className="text-xl">Excluir {orgName}?</DialogTitle>
                    <DialogDescription className="pt-2">
                        Esta ação é <span className="font-bold text-red-600">irreversível</span>.
                        Todos os dados, incluindo pacientes, agendamentos e prontuários vinculados a esta organização serão apagados permanentemente.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleDelete} className="space-y-4 pt-4">
                    <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-100 space-y-3">
                        <Label htmlFor="passwordConfirm" className="text-zinc-700 font-semibold flex items-center gap-2">
                            <Lock className="h-3.5 w-3.5" />
                            Confirme sua senha Master
                        </Label>
                        <Input
                            id="passwordConfirm"
                            type="password"
                            placeholder="Digite sua senha para confirmar"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-white"
                            required
                        />
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="destructive"
                            disabled={!password || loading}
                            className="gap-2"
                        >
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            Confirmar Exclusão
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
