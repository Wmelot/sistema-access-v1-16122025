'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Zap, Loader2, Activity, FileText, Brain } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { startQuickAttendance } from '@/actions/quick-attendance'
import { useActiveAttendance } from '@/components/providers/active-attendance-provider'
import Swal from 'sweetalert2'

interface QuickAttendanceButtonProps {
    isCollapsed?: boolean
    className?: string
}

// The 3 assessment forms to offer (Big Four minus Evolution which is handled separately)
const ASSESSMENT_FORMS = [
    { id: 'pbe_5_system', key: 'pbe', title: 'PBE 5.0', icon: '🩺', desc: 'Avaliação clínica por evidências' },
    { id: 'palmilha_5_system', key: 'palmilha', title: 'Palmilha 5.0', icon: '👟', desc: 'Biomecânica + prescrição' },
    { id: 'diabetic_foot_system', key: 'pe', title: 'Pé Insensível', icon: '🦶', desc: 'Protocolo IWGDF' },
]

export function QuickAttendanceButton({ isCollapsed, className }: QuickAttendanceButtonProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const { slug } = useParams<{ slug: string }>()
    const { activeAttendanceId } = useActiveAttendance()

    // If there's already an active attendance, show "Retomar" button instead
    if (activeAttendanceId) {
        return (
            <div className={cn("px-3 py-2", className)}>
                <Button
                    className={cn(
                        "w-full bg-green-600 hover:bg-green-700 text-white font-bold shadow-md transition-all hover:scale-[1.01]",
                        isCollapsed ? "px-0 justify-center" : "justify-start gap-2"
                    )}
                    onClick={() => router.push(`/dashboard/${slug}/attendance/${activeAttendanceId}`)}
                >
                    <Activity className="h-4 w-4 shrink-0" />
                    {!isCollapsed && <span className="text-sm">Retomar Atendimento</span>}
                </Button>
            </div>
        )
    }

    const handleQuickAttendance = async () => {
        // Step 1: Ask consultation or evolution
        const typeResult = await Swal.fire({
            title: '⚡ Atendimento Rápido',
            html: `
                <p class="text-slate-500 text-sm mb-1">Sem precisar criar paciente ou agendamento.</p>
                <p class="text-slate-400 text-xs">Você poderá vincular um paciente ao salvar.</p>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: '📋 Nova Consulta (Avaliação)',
            cancelButtonText: '🔄 Evolução / IA',
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#000000',
            reverseButtons: true,
        })

        // Dismissed = neither button clicked
        if (typeResult.isDismissed && typeResult.dismiss !== Swal.DismissReason.cancel) return

        let templateId: string | null = null
        let recordType: 'assessment' | 'evolution' = 'evolution'

        if (typeResult.isConfirmed) {
            // Assessment → ask which form
            recordType = 'assessment'
            const formResult = await Swal.fire({
                title: 'Qual formulário?',
                html: `
                    <div style="display:grid; gap:10px; margin-top:8px">
                        <button id="swal-pbe" class="swal-form-btn" style="display:flex;align-items:center;gap:10px;padding:12px 16px;border:2px solid #e2e8f0;border-radius:12px;cursor:pointer;background:white;transition:all 0.15s;font-size:14px;font-weight:600;">
                            <span style="font-size:20px">🩺</span>
                            <div style="text-align:left">
                                <div>PBE 5.0</div>
                                <div style="font-weight:400;color:#94a3b8;font-size:11px">Avaliação clínica por evidências</div>
                            </div>
                        </button>
                        <button id="swal-palmilha" class="swal-form-btn" style="display:flex;align-items:center;gap:10px;padding:12px 16px;border:2px solid #e2e8f0;border-radius:12px;cursor:pointer;background:white;transition:all 0.15s;font-size:14px;font-weight:600;">
                            <span style="font-size:20px">👟</span>
                            <div style="text-align:left">
                                <div>Palmilha 5.0</div>
                                <div style="font-weight:400;color:#94a3b8;font-size:11px">Biomecânica + prescrição</div>
                            </div>
                        </button>
                        <button id="swal-pe" class="swal-form-btn" style="display:flex;align-items:center;gap:10px;padding:12px 16px;border:2px solid #e2e8f0;border-radius:12px;cursor:pointer;background:white;transition:all 0.15s;font-size:14px;font-weight:600;">
                            <span style="font-size:20px">🦶</span>
                            <div style="text-align:left">
                                <div>Pé Insensível</div>
                                <div style="font-weight:400;color:#94a3b8;font-size:11px">Protocolo IWGDF</div>
                            </div>
                        </button>
                    </div>
                `,
                showConfirmButton: false,
                showCancelButton: true,
                cancelButtonText: '← Voltar',
                didOpen: () => {
                    const keys = ['pbe', 'palmilha', 'pe']
                    const templateMap: Record<string, string> = {
                        'pbe': 'pbe_5_system',
                        'palmilha': 'palmilha_5_system',
                        'pe': 'diabetic_foot_system',
                    }
                    keys.forEach(key => {
                        const btn = document.getElementById(`swal-${key}`)
                        btn?.addEventListener('mouseenter', () => {
                            btn.style.borderColor = '#4f46e5'
                            btn.style.background = '#f0f0ff'
                        })
                        btn?.addEventListener('mouseleave', () => {
                            btn.style.borderColor = '#e2e8f0'
                            btn.style.background = 'white'
                        })
                        btn?.addEventListener('click', () => {
                            Swal.close()
                                // Store selection in a way accessible outside
                                ; (window as any).__quickAttendanceTemplate = templateMap[key]
                        })
                    })
                }
            })

            if (formResult.isDismissed && formResult.dismiss !== Swal.DismissReason.cancel) return
            if (formResult.dismiss === Swal.DismissReason.cancel) {
                // Went back
                return handleQuickAttendance()
            }

            // Get template from the click handler
            const selectedKey = (window as any).__quickAttendanceTemplate as string | undefined
            if (!selectedKey) return
                ; (window as any).__quickAttendanceTemplate = undefined

            // Resolve to actual DB template ID
            const { createClient } = await import('@/lib/supabase/client')
            const supabase = createClient()

            let searchQuery = supabase.from('form_templates').select('id').eq('is_active', true)
            if (selectedKey === 'pbe_5_system') {
                searchQuery = searchQuery.ilike('title', '%PBE 5%')
            } else if (selectedKey === 'palmilha_5_system') {
                searchQuery = searchQuery.ilike('title', '%Palmilha 5%')
            } else if (selectedKey === 'diabetic_foot_system') {
                searchQuery = searchQuery.or('title.ilike.%Insensível%,title.ilike.%Diabético%,title.ilike.%diabetic_foot%')
            }

            const { data: tmpl } = await searchQuery.limit(1).maybeSingle()
            templateId = tmpl?.id || null

        } else if (typeResult.dismiss === Swal.DismissReason.cancel) {
            // Evolution — find the IA evolution template
            recordType = 'evolution'
            const { createClient } = await import('@/lib/supabase/client')
            const supabase = createClient()
            const { data: tmpl } = await supabase
                .from('form_templates')
                .select('id')
                .ilike('title', '%IA%')
                .eq('is_active', true)
                .limit(1)
                .maybeSingle()
            templateId = tmpl?.id || 'e0000000-0000-0000-0000-000000000001'
        }

        setLoading(true)

        try {
            const res = await startQuickAttendance(slug, recordType, templateId)

            if (res.error === 'ALREADY_IN_ATTENDANCE') {
                const confirm = await Swal.fire({
                    title: 'Atenção!',
                    html: `Você já está atendendo <b>${res.patientName}</b>.<br/>Deseja encerrar o anterior e iniciar este?`,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Sim, iniciar novo',
                    cancelButtonText: 'Voltar ao anterior',
                    confirmButtonColor: '#ff9800',
                })
                if (confirm.isConfirmed) {
                    // Finish previous and retry
                    const { finishAttendance } = await import('@/actions/attendance')
                    await finishAttendance(res.activeId!, { appointment_id: res.activeId!, content: {} }, slug)
                    const retry = await startQuickAttendance(slug, recordType, templateId)
                    if (retry.success && retry.appointmentId) {
                        router.push(`/dashboard/${slug}/attendance/${retry.appointmentId}?mode=${recordType}`)
                    } else {
                        toast.error(retry.msg || 'Erro ao iniciar.')
                    }
                }
                setLoading(false)
                return
            }

            if (res.success && res.appointmentId) {
                toast.success('⚡ Atendimento rápido iniciado!')
                router.push(`/dashboard/${slug}/attendance/${res.appointmentId}?mode=${recordType}`)
            } else {
                toast.error(res.msg || 'Erro ao iniciar atendimento rápido.')
                setLoading(false)
            }
        } catch (err: any) {
            toast.error('Erro inesperado: ' + err.message)
            setLoading(false)
        }
    }

    return (
        <div className={cn("px-3 py-2", className)}>
            <Button
                onClick={handleQuickAttendance}
                disabled={loading}
                className={cn(
                    "w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.01] active:scale-95",
                    isCollapsed ? "px-0 justify-center h-10 w-10 rounded-xl" : "justify-start gap-2 h-10"
                )}
                title={isCollapsed ? "⚡ Atendimento Rápido" : undefined}
            >
                {loading
                    ? <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                    : <Zap className="h-4 w-4 shrink-0 fill-white" />
                }
                {!isCollapsed && <span className="text-sm">Atendimento Rápido</span>}
            </Button>
        </div>
    )
}
