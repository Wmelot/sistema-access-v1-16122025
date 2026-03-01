'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Zap, Loader2, Activity } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { startQuickAttendance } from '@/actions/quick-attendance'
import { useActiveAttendance } from '@/components/providers/active-attendance-provider'
import Swal from 'sweetalert2'

interface QuickAttendanceButtonProps {
    isCollapsed?: boolean
    className?: string
}

type RecordType = 'assessment' | 'evolution'
type FormKey = 'pbe' | 'palmilha' | 'pe' | null

export function QuickAttendanceButton({ isCollapsed, className }: QuickAttendanceButtonProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const { slug } = useParams<{ slug: string }>()
    const { activeAttendanceId } = useActiveAttendance()

    // If there's already an active attendance, show "Retomar" button instead
    if (activeAttendanceId) {
        return (
            <div className={cn("px-3 py-1", className)}>
                <Button
                    variant="ghost"
                    className={cn(
                        "w-full bg-white text-emerald-600 font-bold hover:bg-emerald-50 hover:text-emerald-700 transition-all relative flex items-center shadow-sm",
                        isCollapsed ? "px-0 justify-center h-10 w-10 rounded-xl" : "justify-start gap-3 h-11 px-4 rounded-2xl text-left"
                    )}
                    onClick={() => router.push(`/dashboard/${slug}/attendance/${activeAttendanceId}`)}
                    title={isCollapsed ? "Retomar Atendimento" : undefined}
                >
                    <div className={cn(
                        "flex items-center justify-center rounded-lg h-6 w-6 shrink-0 bg-emerald-100 text-emerald-600 shadow-inner",
                        isCollapsed ? "bg-emerald-600 text-white rounded-xl h-8 w-8" : ""
                    )}>
                        <Activity className={cn(isCollapsed ? "h-5 w-5" : "h-3.5 w-3.5")} strokeWidth={isCollapsed ? 2 : 3} />
                    </div>
                    {!isCollapsed && <span className="text-[13px] tracking-tight">Retomar Atendimento</span>}
                </Button>
            </div>
        )
    }

    const resolveTemplateId = async (formKey: FormKey, recordType: RecordType): Promise<string | null> => {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()

        if (recordType === 'evolution') {
            const { data } = await supabase
                .from('form_templates')
                .select('id')
                .ilike('title', '%IA%')
                .eq('is_active', true)
                .limit(1)
                .maybeSingle()
            return data?.id || 'e0000000-0000-0000-0000-000000000001'
        }

        // assessment — resolve by form key
        let query = supabase.from('form_templates').select('id').eq('is_active', true)

        if (formKey === 'pbe') {
            query = query.ilike('title', '%PBE 5%')
        } else if (formKey === 'palmilha') {
            query = query.ilike('title', '%Palmilha 5%')
        } else if (formKey === 'pe') {
            query = query.or('title.ilike.%Insensível%,title.ilike.%IWGDF%')
        }

        const { data } = await query.limit(1).maybeSingle()
        return data?.id || null
    }

    const askFormType = (): Promise<RecordType | null> =>
        Swal.fire({
            title: 'Atendimento Rápido',
            html: `
                <p style="color:#64748b;font-size:13px;margin-bottom:4px">
                    Sem precisar criar paciente ou agendamento.
                </p>
                <p style="color:#94a3b8;font-size:11px">
                    Você poderá vincular um paciente ao salvar.
                </p>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Nova Consulta (Avaliação)',
            cancelButtonText: 'Evolução / IA',
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#0f172a',
            reverseButtons: true,
        }).then(r => {
            if (r.isConfirmed) return 'assessment' as RecordType
            if (r.dismiss === Swal.DismissReason.cancel) return 'evolution' as RecordType
            return null
        })

    const askWhichForm = (): Promise<FormKey> =>
        new Promise((resolve) => {
            Swal.fire({
                title: 'Qual formulário?',
                html: `
                    <div id="swal-forms" style="display:grid;gap:8px;margin-top:8px">
                        <button data-key="pbe"
                            style="display:flex;align-items:center;gap:12px;padding:12px 16px;border:2px solid #e2e8f0;border-radius:12px;cursor:pointer;background:white;width:100%;transition:border-color 0.15s">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                            <div style="text-align:left">
                                <div style="font-weight:700;font-size:14px;color:#1e293b">PBE 5.0</div>
                                <div style="font-size:11px;color:#94a3b8">Avaliação clínica por evidências</div>
                            </div>
                        </button>
                        <button data-key="palmilha"
                            style="display:flex;align-items:center;gap:12px;padding:12px 16px;border:2px solid #e2e8f0;border-radius:12px;cursor:pointer;background:white;width:100%;transition:border-color 0.15s">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
                            <div style="text-align:left">
                                <div style="font-weight:700;font-size:14px;color:#1e293b">Palmilha 5.0</div>
                                <div style="font-size:11px;color:#94a3b8">Biomecânica + prescrição</div>
                            </div>
                        </button>
                        <button data-key="pe"
                            style="display:flex;align-items:center;gap:12px;padding:12px 16px;border:2px solid #e2e8f0;border-radius:12px;cursor:pointer;background:white;width:100%;transition:border-color 0.15s">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0d9488" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                            <div style="text-align:left">
                                <div style="font-weight:700;font-size:14px;color:#1e293b">Pé Insensível</div>
                                <div style="font-size:11px;color:#94a3b8">Protocolo IWGDF</div>
                            </div>
                        </button>
                    </div>
                `,
                showConfirmButton: false,
                showCancelButton: true,
                cancelButtonText: '← Voltar',
                didOpen: () => {
                    const container = document.getElementById('swal-forms')
                    if (!container) return
                    container.querySelectorAll<HTMLButtonElement>('button[data-key]').forEach(btn => {
                        btn.addEventListener('mouseenter', () => {
                            btn.style.borderColor = '#4f46e5'
                            btn.style.backgroundColor = '#f5f3ff'
                        })
                        btn.addEventListener('mouseleave', () => {
                            btn.style.borderColor = '#e2e8f0'
                            btn.style.backgroundColor = 'white'
                        })
                        btn.addEventListener('click', () => {
                            const key = btn.getAttribute('data-key') as FormKey
                            resolve(key)
                            Swal.close()
                        })
                    })
                }
            }).then(r => {
                // Swal closed without clicking a form button
                if (r.dismiss === Swal.DismissReason.cancel) {
                    resolve(null) // null = went back
                }
                // Other dismiss (backdrop / escape) = also null, already handled above or will fall through
            })
        })

    const handleFinish = async (appointmentId: string, recordType: RecordType) => {
        toast.success('Atendimento rápido iniciado!')
        router.push(`/dashboard/${slug}/attendance/${appointmentId}?mode=${recordType}`)
    }

    const handleQuickAttendance = async () => {
        // Step 1: Consulta ou Evolução?
        const recordType = await askFormType()
        if (!recordType) return // dismissed

        let formKey: FormKey = null

        if (recordType === 'assessment') {
            // Step 2: Which assessment form?
            formKey = await askWhichForm()
            if (formKey === null) {
                // Went back — restart
                return handleQuickAttendance()
            }
        }

        setLoading(true)

        try {
            const templateId = await resolveTemplateId(formKey, recordType)
            const res = await startQuickAttendance(slug, recordType, templateId)

            if (res.error === 'ALREADY_IN_ATTENDANCE') {
                setLoading(false)
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
                    setLoading(true)
                    const { finishAttendance } = await import('@/actions/attendance')
                    await finishAttendance(res.activeId!, { appointment_id: res.activeId!, content: {} }, slug)
                    const retry = await startQuickAttendance(slug, recordType, templateId)
                    if (retry.success && retry.appointmentId) {
                        await handleFinish(retry.appointmentId, recordType)
                    } else {
                        toast.error(retry.msg || 'Erro ao iniciar.')
                        setLoading(false)
                    }
                }
                return
            }

            if (res.success && res.appointmentId) {
                await handleFinish(res.appointmentId, recordType)
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
        <div className={cn("px-3 py-1", className)}>
            <Button
                onClick={handleQuickAttendance}
                disabled={loading}
                variant="ghost"
                className={cn(
                    "w-full bg-white text-indigo-600 font-black hover:bg-indigo-50 hover:text-indigo-700 transition-all relative shadow-sm",
                    isCollapsed ? "px-0 justify-center h-10 w-10 rounded-xl" : "justify-start gap-3 h-11 px-4 rounded-2xl text-left"
                )}
                title={isCollapsed ? "Atendimento Rápido" : undefined}
            >
                <div className={cn(
                    "flex items-center justify-center rounded-lg h-6 w-6 shrink-0 bg-indigo-600 text-white shadow-sm",
                    isCollapsed ? "rounded-xl h-10 w-10 shadow-indigo-200" : ""
                )}>
                    {loading
                        ? <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                        : <Zap className={cn(isCollapsed ? "h-5 w-5" : "h-3.5 w-3.5")} strokeWidth={2.5} fill="white" />
                    }
                </div>
                {!isCollapsed && <span className="text-[13px] tracking-tight uppercase">Novo Atendimento</span>}
            </Button>
        </div>
    )
}
