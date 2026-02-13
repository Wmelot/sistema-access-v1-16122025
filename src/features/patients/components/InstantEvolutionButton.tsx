'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from "@/components/ui/button"
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { startNewAttendance } from '@/app/dashboard/[slug]/patients/actions/start-attendance'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

interface InstantEvolutionButtonProps {
    patientId: string
    patientName: string
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
    size?: "default" | "sm" | "lg" | "icon"
    className?: string
}

export function InstantEvolutionButton({
    patientId,
    patientName,
    variant = "default",
    size = "sm",
    className
}: InstantEvolutionButtonProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const params = useParams()
    const slug = params?.slug as string
    const supabase = createClient()

    const handleStartInstant = async () => {
        setLoading(true)
        try {
            // 1. Find the template ID dynamically by title
            const { data: template } = await supabase
                .from('form_templates')
                .select('id')
                .eq('title', 'Evolução Clínica & IA (NOVO)')
                .eq('is_active', true)
                .maybeSingle()

            if (!template) {
                // If not found, try a generic "Evolução"
                const { data: fallback } = await supabase
                    .from('form_templates')
                    .select('id')
                    .eq('type', 'evolution')
                    .eq('is_active', true)
                    .limit(1)
                    .maybeSingle()

                if (!fallback) {
                    toast.error('Modelo de evolução não encontrado.')
                    setLoading(false)
                    return
                }

                await executeStart(fallback.id)
            } else {
                await executeStart(template.id)
            }
        } catch (error) {
            console.error(error)
            toast.error('Erro ao iniciar evolução.')
            setLoading(false)
        }
    }

    const executeStart = async (templateId: string) => {
        const res = await startNewAttendance(patientId, slug, {
            templateId: templateId,
            recordType: 'evolution'
        }) as any

        if (!res.success) {
            setLoading(false)
            if (res.error === 'ALREADY_IN_ATTENDANCE' && res.appointmentId) {
                const confirm = await MySwal.fire({
                    title: 'Atendimento em andamento',
                    html: `Você já está atendendo <b>${res.patientName}</b>.<br/>Deseja encerrar o anterior e iniciar este?`,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Sim, iniciar este',
                    cancelButtonText: 'Manter anterior',
                    confirmButtonColor: '#ff9800',
                })

                if (confirm.isConfirmed) {
                    // Logic to force start could go here, but startNewAttendance doesn't support force yet.
                    // For now, redirect to the active one if they say no, or just show error.
                    toast.info('Finalize o atendimento anterior primeiro.')
                }
                return
            }
            toast.error(res.msg || 'Erro ao iniciar atendimento')
            return
        }

        toast.success('Atendimento iniciado!')
        router.push(`/dashboard/${slug}/attendance/${res.appointmentId}`)
    }

    return (
        <Button
            onClick={handleStartInstant}
            disabled={loading}
            variant={variant}
            size={size}
            className={className}
        >
            {loading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Abrindo...
                </>
            ) : (
                <>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Evolução
                </>
            )}
        </Button>
    )
}
