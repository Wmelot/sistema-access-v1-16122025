'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Activity, Plus, Loader2 } from "lucide-react"
import { toast } from 'sonner'
import Link from 'next/link'
import { startNewAttendance } from '@/app/dashboard/[slug]/patients/actions/start-attendance'
import { cn } from "@/lib/utils"
import { useActiveAttendance } from "@/components/providers/active-attendance-provider"
import Swal from 'sweetalert2'

interface StartAttendanceButtonProps {
    patientId: string
    activeAppointmentId?: string
    className?: string
}

export function StartAttendanceButton({ patientId, activeAppointmentId, className }: StartAttendanceButtonProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const { slug } = useParams()

    const { activeAttendanceId } = useActiveAttendance()

    const handleCreate = async (templateId?: string, recordType: 'assessment' | 'evolution' = 'evolution') => {
        setLoading(true)
        const res = await startNewAttendance(patientId, slug as string, { templateId, recordType })

        if (res.error === 'ALREADY_IN_ATTENDANCE') {
            setLoading(false)
            const confirm = await Swal.fire({
                title: 'Atenção!',
                html: `Você já está atendendo <b>${res.patientName}</b>.<br/>Deseja encerrar o anterior e iniciar este?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sim, iniciar este',
                cancelButtonText: 'Voltar ao anterior',
                confirmButtonColor: '#ff9800',
            })

            if (confirm.isConfirmed) {
                setLoading(true)
                const { finishAttendance } = await import("@/actions/attendance")
                await finishAttendance(res.activeId!, { appointment_id: res.activeId!, content: {} }, slug as string)

                const retry = await startNewAttendance(patientId, slug as string, { templateId, recordType, force: true })
                if (retry.success) {
                    toast.success("Atendimento iniciado!")
                    router.push(`/dashboard/${slug}/attendance/${retry.appointmentId}?mode=${recordType}`)
                } else {
                    toast.error(retry.msg || "Erro ao iniciar.")
                }
            }
            setLoading(false)
            return
        }

        if (res.error === 'DUPLICATE_TODAY') {
            setLoading(false)
            const result = await Swal.fire({
                title: 'Agendamento Identificado',
                html: `<div class="text-sm text-slate-600 text-left">${res.msg}</div>`,
                icon: 'info',
                showCancelButton: true,
                showDenyButton: true,
                confirmButtonText: 'Usar Agendamento Existente',
                denyButtonText: 'Criar Novo Atendimento',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#3b82f6',
                denyButtonColor: '#10b981',
            })

            if (result.isConfirmed) {
                // Use Existing
                const { startAttendance } = await import("@/actions/attendance")
                const startRes = await startAttendance(res.appointmentId, slug as string)
                if (startRes.success) {
                    toast.success("Atendimento iniciado!")
                    router.push(`/dashboard/${slug}/attendance/${res.appointmentId}?mode=${recordType}`)
                } else {
                    toast.error("Erro ao iniciar agendamento existente.")
                }
            } else if (result.isDenied) {
                // Force Create New
                const retry = await startNewAttendance(patientId, slug as string, { templateId, recordType, force: true })
                if (retry.success) {
                    toast.success("Novo atendimento iniciado!")
                    router.push(`/dashboard/${slug}/attendance/${retry.appointmentId}?mode=${recordType}`)
                } else {
                    toast.error(retry.msg || "Erro ao criar novo atendimento.")
                }
            }
            return
        }

        if (res.success && res.appointmentId) {
            toast.success("Atendimento iniciado!")
            router.push(`/dashboard/${slug}/attendance/${res.appointmentId}?mode=${recordType}`)
        } else {
            toast.error(res.msg || "Erro ao iniciar atendimento")
            setLoading(false)
        }
    }

    const handleClick = async () => {
        const result = await Swal.fire({
            title: 'O que deseja iniciar?',
            text: "Escolha o tipo de atendimento para este paciente.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Novo Atendimento (Evolução)',
            cancelButtonText: 'Nova Consulta (Avaliação)',
            confirmButtonColor: '#000000',
            cancelButtonColor: '#4f46e5',
            reverseButtons: true
        })

        if (result.isConfirmed) {
            // "Novo Atendimento" -> Go straight to Evolution IA
            // We use a known system ID or try to find it in the client
            const { createClient } = await import('@/lib/supabase/client')
            const supabase = createClient()
            const { data: template } = await supabase
                .from('form_templates')
                .select('id')
                .ilike('title', '%IA%')
                .eq('is_active', true)
                .limit(1)
                .maybeSingle()

            // If not found, use system fallback
            const finalId = template?.id || 'e0000000-0000-0000-0000-000000000001'
            await handleCreate(finalId, 'evolution')
        } else if (result.dismiss === Swal.DismissReason.cancel) {
            // "Nova Consulta" -> Go to Selection Screen (no templateId)
            await handleCreate(undefined, 'assessment')
        }
    }

    const buttonClass = cn("gap-2", className)

    if (activeAppointmentId) {
        return (
            <Button size="sm" variant="default" className={cn("bg-green-600 hover:bg-green-700 text-white shadow-md", buttonClass)} asChild>
                <Link href={`/dashboard/${slug}/attendance/${activeAppointmentId}`}>
                    <Activity className="h-4 w-4" />
                    Retomar Atendimento
                </Link>
            </Button>
        )
    }

    return (
        <Button
            size="sm"
            onClick={handleClick}
            disabled={loading}
            className={cn("shadow-md h-10 px-4", buttonClass)}
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Novo
        </Button>
    )
}
