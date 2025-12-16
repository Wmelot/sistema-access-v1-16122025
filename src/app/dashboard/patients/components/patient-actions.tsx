"use client"

import Link from "next/link"
import { MoreHorizontal, FileText, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DeleteWithPassword } from "@/components/ui/delete-with-password"
import { useState } from "react"
import { deletePatient } from "../actions"

interface PatientActionsProps {
    patientId: string
    patientName: string
}

export function PatientActions({ patientId, patientName }: PatientActionsProps) {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        aria-haspopup="true"
                        size="icon"
                        variant="ghost"
                    >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <Link href={`/dashboard/patients/${patientId}`} className="cursor-pointer">
                        <DropdownMenuItem className="cursor-pointer">
                            <FileText className="mr-2 h-4 w-4" />
                            Ver Prontuário
                        </DropdownMenuItem>
                    </Link>
                    <Link href={`/dashboard/patients/${patientId}/edit`} className="cursor-pointer">
                        <DropdownMenuItem className="cursor-pointer">
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                        </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50"
                        onSelect={(e) => {
                            e.preventDefault()
                            setIsDeleteDialogOpen(true)
                        }}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Deletar
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <DeleteWithPassword
                id={patientId}
                onDelete={deletePatient}
                description={`Tem certeza que deseja apagar o paciente "${patientName}"? Todo o histórico será perdido.`}
                trigger={<span className="hidden"></span>} // Hidden trigger, controlled by state
            />

            {/* 
               Note: DeleteWithPassword component usually controls its own open state via trigger.
               To control it externally or from a dropdown, we might need to adjust it or wrap it.
               The current `DeleteWithPassword` implementation uses `DialogTrigger`.
               If we set `open` prop on Dialog it works. But `DeleteWithPassword` likely keeps internal state.
               
               Let's just update `DeleteWithPassword` to accept `open` prop or Ref. 
               OR, simpler: Copy the DeleteDialog logic here to avoid modifying the shared component if it doesn't support controlled mode.
               
               Actually, checking `DeleteWithPassword` implementation... 
               It uses `[open, setOpen] = useState(false)`.
               It doesn't accept `open` prop override. 
               
               Workaround: Render the Dialog directly here.
            */}
            <DeletePatientDialog
                isOpen={isDeleteDialogOpen}
                setIsOpen={setIsDeleteDialogOpen}
                patientId={patientId}
                patientName={patientName}
            />
        </>
    )
}

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

function DeletePatientDialog({ isOpen, setIsOpen, patientId, patientName }: any) {
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)

    const handleDelete = async () => {
        if (!password) {
            toast.error("Digite a senha para confirmar")
            return
        }

        setLoading(true)
        try {
            const result = await deletePatient(patientId, password)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Paciente removido")
                setIsOpen(false)
            }
        } catch (error) {
            toast.error("Erro ao processar solicitação")
        } finally {
            setLoading(false)
            setPassword("")
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirmar Exclusão (Master)</DialogTitle>
                    <DialogDescription>
                        Tem certeza que deseja apagar o paciente "{patientName}"? Todo o histórico será perdido.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="password-patient">Senha do Usuário Master</Label>
                        <Input
                            id="password-patient"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Digite sua senha"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)} disabled={loading}>
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
