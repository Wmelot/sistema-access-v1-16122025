"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Archive, RefreshCcw, Loader2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { togglePatientStatus } from "@/app/dashboard/patients/actions"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface PatientStatusToggleProps {
    patientId: string
    currentStatus: 'active' | 'inactive' | string
}

export function PatientStatusToggle({ patientId, currentStatus }: PatientStatusToggleProps) {
    const [loading, setLoading] = useState(false)
    const isActive = currentStatus === 'active'

    const handleToggle = async () => {
        setLoading(true)
        try {
            const newStatus = isActive ? 'inactive' : 'active'
            const res = await togglePatientStatus(patientId, newStatus)

            if (res?.error) {
                toast.error(res.error)
            } else {
                toast.success(isActive ? "Paciente inativado com sucesso (Arquivado)." : "Paciente reativado com sucesso!")
            }
        } catch (e) {
            toast.error("Erro ao alterar status")
        } finally {
            setLoading(false)
        }
    }

    if (!isActive) {
        return (
            <Button
                variant="outline"
                size="sm"
                onClick={handleToggle}
                disabled={loading}
                className="gap-2 text-green-600 border-green-200 hover:bg-green-50"
            >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                Reativar Cadastro
            </Button>
        )
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                    <Archive className="h-4 w-4" />
                    Arquivar
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        Arquivar Paciente?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Ao arquivar, este paciente não aparecerá mais nas buscas principais e não receberá mensagens automáticas.
                        <strong>Seus dados clínicos (Prontuário) NÃO serão apagados</strong>, em conformidade com a Lei 13.787/2018.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleToggle} className="bg-red-600 hover:bg-red-700">
                        Confirmar Arquivamento
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
