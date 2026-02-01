'use client'

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
import { useActiveAttendance } from "@/components/providers/active-attendance-provider"
import { useRouter, useParams } from "next/navigation"
import { finishActiveAttendance } from "@/components/attendance/actions"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

interface AttendanceConflictDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onContinue: () => void
}

export function AttendanceConflictDialog({ isOpen, onOpenChange, onContinue }: AttendanceConflictDialogProps) {
    const { activeAttendanceId, patientName, setActiveAttendanceId } = useActiveAttendance()
    const router = useRouter()
    const params = useParams()
    const slug = params?.slug as string

    const handleResume = () => {
        if (activeAttendanceId) {
            router.push(`/dashboard/${slug}/attendance/${activeAttendanceId}`)
            onOpenChange(false)
        }
    }

    const handleFinishAndStart = async () => {
        if (activeAttendanceId) {
            const res: any = await finishActiveAttendance(activeAttendanceId)
            if (!res?.error) {
                // We don't necessarily need to clear it here if the follow up onContinue will set it again,
                // but for safety:
                setActiveAttendanceId(null)
                toast.success("Atendimento anterior encerrado.")
                onOpenChange(false)
                // Execute the original action
                setTimeout(() => {
                    onContinue()
                }, 100)
            } else {
                toast.error("Erro ao encerrar atendimento anterior.")
            }
        }
    }

    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
            <AlertDialogContent className="bg-white border-2 border-amber-100 shadow-2xl">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-bold flex items-center gap-2 text-amber-900">
                        ⚠️ Atendimento em Andamento
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-base text-slate-600 pt-2">
                        Já existe um atendimento ativo para o paciente <strong className="text-slate-900">{patientName || "outro paciente"}</strong>.
                        O que você deseja fazer?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex flex-col gap-2 py-4">
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Ações recomendadas:</p>
                </div>
                <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
                    <AlertDialogCancel className="mt-0 sm:mt-0 font-medium">Cancelar</AlertDialogCancel>
                    <Button
                        onClick={handleResume}
                        variant="secondary"
                        className="bg-amber-100 text-amber-900 hover:bg-amber-200 border-none font-bold"
                    >
                        Retomar {patientName ? 'de ' + patientName.split(' ')[0] : 'Atual'}
                    </Button>
                    <AlertDialogAction
                        onClick={handleFinishAndStart}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold"
                    >
                        Finalizar e Iniciar Novo
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
