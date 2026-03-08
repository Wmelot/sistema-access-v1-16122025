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
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Trash2, ShieldCheck, Fingerprint } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface DeleteWithPasswordProps {
    id: string
    onDelete: (id: string, password: string) => Promise<{ error?: string; success?: boolean }>
    trigger?: React.ReactNode
    description?: string
    onSuccess?: () => void
    title?: string
}

export function DeleteWithPassword({ id, onDelete, trigger, description = "Esta ação não pode ser desfeita.", onSuccess, title = "Confirmar Exclusão (Master)" }: DeleteWithPasswordProps) {
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
                if (onSuccess) onSuccess()
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
            <DialogContent className="sm:max-w-[425px] border-amber-500/20 shadow-2xl shadow-amber-500/5">
                <DialogHeader className="items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center border-4 border-amber-100 shadow-inner">
                        <ShieldCheck className="w-8 h-8 text-amber-600" />
                    </div>
                    <div className="space-y-2">
                        <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">
                            {title}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium">
                            {description}
                        </DialogDescription>
                    </div>
                </DialogHeader>
                <div className="grid gap-6 py-6">
                    <div className="grid gap-3">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-slate-400">Senha do Usuário Master</Label>
                            <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                                <Fingerprint className="w-3 h-3" />
                                <span className="text-[10px] font-bold">Biometria Ativa</span>
                            </div>
                        </div>
                        <PasswordInput
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Sua senha de segurança..."
                            autoFocus
                            autoComplete="current-password"
                            className="h-14 border-slate-200 focus:ring-amber-500/20 focus:border-amber-500 text-lg shadow-sm"
                        />
                        <p className="text-[10px] text-slate-400 font-medium italic">Seu navegador solicitará o FaceID/TouchID se estiver configurado no seu perfil do iCloud/Google.</p>
                    </div>
                </div>
                <DialogFooter className="sm:justify-center border-t border-slate-100 pt-6 mt-2">
                    <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading} className="font-bold text-slate-500 hover:text-slate-900">
                        Cancelar
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={loading}
                        className="h-12 px-8 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-red-500/20 hover:scale-105 active:scale-95 transition-all bg-red-600 hover:bg-red-700"
                    >
                        {loading ? 'Validando...' : 'Confirmar Exclusão'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog >
    )
}
