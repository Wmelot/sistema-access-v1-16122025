"use client"

import { useState } from "react"
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
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

interface DeleteWithPasswordProps {
    id: string
    onDelete: (id: string, password: string) => Promise<{ error?: string; success?: boolean }>
    trigger?: React.ReactNode
    description?: string
}

export function DeleteWithPassword({ id, onDelete, trigger, description = "Esta ação não pode ser desfeita." }: DeleteWithPasswordProps) {
    const [open, setOpen] = useState(false)
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)

    const handleDelete = async () => {
        if (!password) {
            toast.error("Digite a senha para confirmar")
            return
        }

        setLoading(true)
        try {
            const result = await onDelete(id, password)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Removido com sucesso")
                setOpen(false)
            }
        } catch (error) {
            toast.error("Erro ao processar solicitação")
        } finally {
            setLoading(false)
            setPassword("")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Deletar</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirmar Exclusão (Master)</DialogTitle>
                    <DialogDescription>
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="password">Senha do Usuário Master</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Digite sua senha para confirmar"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                        {loading ? 'Verificando...' : 'Confirmar Exclusão'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
