"use client"

import { useState, useEffect } from "react"
import { getOrganizationSettings } from "@/app/dashboard/[slug]/settings/organization/actions"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FormRenderer } from "@/components/forms/FormRenderer"
import { format } from "date-fns"
import { ASSESSMENTS } from "@/app/dashboard/[slug]/patients/components/assessments/definitions"
import { Badge } from "@/components/ui/badge"
import { BiomechanicsReportPrint } from "@/features/pbe/components/biomechanics-report-print"
import { BrainCircuit, Sparkles } from "lucide-react"

interface ViewRecordDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    record: any
    templates: any[]
    patient: any
}

export function ViewRecordDialog({ open, onOpenChange, record, templates = [], patient }: ViewRecordDialogProps) {
    const [orgName, setOrgName] = useState<string>("")
    const [orgAddress, setOrgAddress] = useState<string>("")
    const [professional, setProfessional] = useState<any>(null)

    useEffect(() => {
        if (open) {
            getOrganizationSettings().then(data => {
                if (data?.org?.name) setOrgName(data.org.name)
                if (data?.org?.address) setOrgAddress(data.org.address)
            })
        }
    }, [open])

    useEffect(() => {
        if (open && record?.professional_id) {
            const fetchProfessional = async () => {
                const { createClient } = await import("@/lib/supabase/client")
                const supabase = createClient()
                const { data } = await supabase.from('profiles').select('*').eq('id', record.professional_id).single()
                if (data) setProfessional(data)
            }
            fetchProfessional()
        }
    }, [open, record])

    if (!record) return null

    // --- NORMALIZATION ---
    // Handle both 'patient_records' (content) and 'patient_assessments' (data)
    const content = record.content || record.data || {}
    const scores = record.scores || record.content?._metadata?.scores || {}
    const templateId = record.template_id || record.type

    // 1. Try finding in database templates (FormBuilder)
    const dbTemplate = templates.find(t => t.id === templateId) || record.form_templates

    // 2. Try finding in static assessments (Clinical Scales)
    const clinicalAssessment = Object.values(ASSESSMENTS).find(a => a.id === templateId)

    const title = dbTemplate?.title || clinicalAssessment?.title || "Registro sem modelo"

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
                <DialogHeader className="px-6 py-4 border-b shrink-0">
                    <DialogTitle>
                        Histórico: {record.created_at ? format(new Date(record.created_at), "dd/MM/yyyy HH:mm") : "Data indisponível"}
                    </DialogTitle>
                    <DialogDescription>
                        {title}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 min-h-0 bg-slate-50/50 relative overflow-y-auto">
                    <div className="p-6 pb-20">
                        {clinicalAssessment ? (
                            // --- CUSTOM RENDERER FOR CLINICAL ASSESSMENTS ---
                            <div className="space-y-6 max-w-3xl mx-auto">
                                <div className="bg-white p-6 rounded-lg border shadow-sm">
                                    <h3 className="font-semibold text-lg mb-4 text-slate-800 border-b pb-2">Respostas do Questionário</h3>
                                    <div className="space-y-4">
                                        {clinicalAssessment.questions.map((q: any) => {
                                            const answer = content[q.id];
                                            // Find label if available
                                            let displayAnswer = answer;
                                            if (q.options) {
                                                const opt = q.options.find((o: any) => o.value === answer);
                                                if (opt) displayAnswer = `${opt.label} (${answer})`;
                                            }
                                            // Skip unanswered if desired, or show "-"
                                            if (answer === undefined || answer === null) return null;

                                            return (
                                                <div key={q.id} className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 py-2 border-b last:border-0 items-start">
                                                    <div className="text-sm text-slate-600 font-medium">{q.text}</div>
                                                    <Badge variant="secondary" className="text-sm font-bold shrink-0">
                                                        {String(displayAnswer)}
                                                    </Badge>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Show Scores if available */}
                                {Object.keys(scores).length > 0 && (
                                    <div className="bg-slate-100 p-4 rounded-lg border">
                                        <h4 className="font-medium mb-2">Resultados Calculados</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(scores).map(([k, v]) => {
                                                if (k === 'riskColor' || k === 'savedAt') return null;
                                                const label = k === 'total' ? 'Score Total' :
                                                    k === 'percent' ? 'Percentual' :
                                                        k === 'psychosocial' ? 'Psicossocial' :
                                                            k.replace(/([A-Z])/g, ' $1').trim();

                                                return (
                                                    <Badge key={k} variant="outline" className="bg-white capitalize text-[10px] font-bold">
                                                        {label}: {String(v)}
                                                    </Badge>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (dbTemplate?.title?.includes('Palmilha') || content?.shoeSize !== undefined) ? (
                            // --- BIOMECHANICS REPORT ---
                            <div className="bg-white min-h-screen">
                                <BiomechanicsReportPrint
                                    data={content}
                                    patient={patient}
                                    date={record.created_at}
                                    organizationName={orgName}
                                    organization={{ address: orgAddress }}
                                    professional={professional}
                                    professionalName={professional?.name || professional?.full_name || "Profissional"}
                                />
                            </div>
                        ) : dbTemplate ? (
                            // --- STANDARD FORM RENDERER ---
                            <FormRenderer
                                recordId={record.id}
                                template={dbTemplate}
                                initialContent={content}
                                status="finalized" // Read-Only Mode
                                patientId={patient.id}
                                templateId={dbTemplate.id}
                                hideHeader={true}
                            />
                        ) : (
                            content._record_type === 'Trilha Inteligente IA' ? (
                                <div className="space-y-6 max-w-2xl mx-auto">
                                    <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-2 opacity-10">
                                            <BrainCircuit className="w-12 h-12 text-indigo-600" />
                                        </div>
                                        <h3 className="text-sm font-black text-indigo-600 uppercase tracking-widest mb-4">Relato do Paciente</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Queixa Principal</label>
                                                <p className="text-slate-700 font-medium">{content.qp || "Não informada"}</p>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">História (HMA)</label>
                                                <p className="text-slate-600 leading-relaxed italic">"{content.hma || "Sem detalhes adicionais"}"</p>
                                            </div>
                                        </div>
                                    </div>

                                    {content.report && (
                                        <div className="bg-indigo-900 text-white p-6 rounded-2xl shadow-xl space-y-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Sparkles className="w-4 h-4 text-indigo-300" />
                                                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-200">Insight Clínico IA</h4>
                                            </div>

                                            <div className="space-y-4">
                                                <div>
                                                    <h5 className="text-indigo-200 text-[10px] font-bold uppercase mb-1">Impressão Diagnóstica</h5>
                                                    <p className="text-lg font-bold leading-tight">{content.report.diagnostic}</p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-indigo-800">
                                                    <div>
                                                        <h5 className="text-indigo-400 text-[10px] font-bold uppercase mb-1">Risco Detectado</h5>
                                                        <p className="text-xs font-semibold">{content.report.risk}</p>
                                                    </div>
                                                    <div>
                                                        <h5 className="text-indigo-400 text-[10px] font-bold uppercase mb-1">Proposta de Plano</h5>
                                                        <p className="text-xs font-semibold">{content.report.plan}</p>
                                                    </div>
                                                </div>
                                                <div className="pt-2">
                                                    <h5 className="text-indigo-400 text-[10px] font-bold uppercase mb-1">Conduta Sugerida</h5>
                                                    <p className="text-xs text-indigo-50/80 leading-relaxed">{content.report.conduct}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-2">
                                        {(content.regions || []).map((r: string) => (
                                            <Badge key={r} variant="outline" className="bg-white border-slate-200 text-slate-600 capitalize">
                                                {r.replace('_', ' ')}
                                            </Badge>
                                        ))}
                                        {Object.entries(content.flags || {}).filter(([_, v]) => v).map(([k]) => (
                                            <Badge key={k} variant="destructive" className="bg-red-50 text-red-600 border-red-100 hover:bg-red-100">
                                                Flag: {k}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 max-w-2xl mx-auto">
                                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                                        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Conteúdo do Registro</h3>
                                        <div className="space-y-4 text-slate-700 leading-relaxed whitespace-pre-wrap">
                                            {content.evolution_text ||
                                                content.observations ||
                                                (typeof content.plan === 'string' ? content.plan : null) ||
                                                content.voice_transcript || (
                                                    <div className="space-y-4">
                                                        {Object.entries(content)
                                                            .filter(([k, v]) => typeof v === 'string' && !k.startsWith('_'))
                                                            .map(([k, v]) => (
                                                                <div key={k}>
                                                                    <h4 className="text-xs font-bold uppercase text-slate-400 mb-1">{k}</h4>
                                                                    <p>{String(v)}</p>
                                                                </div>
                                                            ))}
                                                    </div>
                                                ) || (
                                                    <p className="text-muted-foreground italic text-center py-10">Este registro não possui dados textuais.</p>
                                                )}
                                        </div>
                                    </div>

                                    <div className="opacity-0 hover:opacity-10 transition-opacity">
                                        <p className="text-[10px] text-muted-foreground text-center">Modo técnico: {JSON.stringify(content).substring(0, 50)}...</p>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

