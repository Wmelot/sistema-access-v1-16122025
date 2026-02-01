'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ASSESSMENTS, AssessmentType } from './definitions'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Eye, Calendar, Smartphone, Footprints, Calculator, CheckCircle2 } from 'lucide-react'
import { ScheduleFollowupDialog } from '../ScheduleFollowupDialog'
import { Badge } from '@/components/ui/badge'

interface AssessmentListProps {
    assessments: any[]
    onView?: (assessment: any) => void
    patientId?: string
    slug?: string
}

export function AssessmentList({ assessments, onView, patientId, slug }: AssessmentListProps) {
    const [followupDialog, setFollowupDialog] = useState<{
        open: boolean
        templateId: string
        templateTitle: string
        assessmentId: string
    } | null>(null)

    if (assessments.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                Nenhuma avaliação realizada ainda.
            </div>
        )
    }

    return (
        <>
            <div className="space-y-4">
                {assessments.map((assessment) => {
                    // -- [CUSTOM RENDERER] INSOLES PRESCRIPTION --
                    if (assessment.type === 'insoles_prescription') {
                        return <InsolePrescriptionCard key={assessment.id} assessment={assessment} onView={onView} />
                    }

                    let def = assessment.type && ASSESSMENTS[assessment.type as AssessmentType]

                    // [NEW] Smart Fallback: Try matching by Title if ID/Type lookup failed
                    if (!def && assessment.title) {
                        const found = Object.values(ASSESSMENTS).find(d => d.title === assessment.title || d.title.includes(assessment.title))
                        if (found) {
                            def = found
                        }
                    }

                    // 1. Title & Metadata
                    const title = assessment.title || def?.title || assessment.type
                    const dateStr = format(new Date(assessment.created_at), "d 'de' MMMM, yyyy", { locale: ptBR })

                    // 2. Risk/Color Logic
                    const scores = assessment.scores
                    let riskColor = scores?.riskColor;

                    if (!riskColor && def && assessment.data) {
                        try {
                            const calculated = def.calculateScore(assessment.data)
                            if (calculated && calculated.riskColor) {
                                riskColor = calculated.riskColor
                            }
                        } catch (e) { /* Ignore */ }
                    }

                    // 3. Styles based on Color
                    let cardStyles = "border-slate-200 bg-white"
                    let headerStyles = "bg-slate-50 border-b border-slate-100"
                    let badgeStyles = "bg-slate-100 text-slate-700"

                    if (riskColor === 'green') {
                        cardStyles = "border-green-200 bg-green-50/50"
                        headerStyles = "bg-green-100/50 border-b border-green-200"
                        badgeStyles = "bg-green-100 text-green-800 border-green-200"
                    } else if (riskColor === 'yellow') {
                        cardStyles = "border-yellow-200 bg-yellow-50/50"
                        headerStyles = "bg-yellow-100/50 border-b border-yellow-200"
                        badgeStyles = "bg-yellow-100 text-yellow-800 border-yellow-200"
                    } else if (riskColor === 'red') {
                        cardStyles = "border-red-200 bg-red-50/50"
                        headerStyles = "bg-red-100/50 border-b border-red-200"
                        badgeStyles = "bg-red-100 text-red-800 border-red-200"
                    }

                    return (
                        <Card key={assessment.id} className={`overflow-hidden transition-all hover:shadow-md ${cardStyles}`}>
                            <div className={`px-5 py-3 flex justify-between items-center ${headerStyles}`}>
                                <div>
                                    <h3 className="font-semibold text-slate-800 text-base leading-tight">{title}</h3>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {dateStr} • {assessment.author || assessment.profiles?.full_name || assessment.professionals?.name || 'Profissional'}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    {patientId && assessment.type && ASSESSMENTS[assessment.type as AssessmentType] && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 hover:bg-white/50"
                                            title="Reagendar"
                                            onClick={() => setFollowupDialog({
                                                open: true,
                                                templateId: assessment.template_id || assessment.type,
                                                templateTitle: title,
                                                assessmentId: assessment.id
                                            })}
                                        >
                                            <Calendar className="h-4 w-4 text-slate-600" />
                                        </Button>
                                    )}
                                    {onView && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 text-xs font-medium hover:bg-white/50"
                                            onClick={() => onView(assessment)}
                                        >
                                            <Eye className="h-3.5 w-3.5 mr-1.5" />
                                            Ver Respostas
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <CardContent className="p-5">
                                {scores ? (
                                    <div className="flex flex-col md:flex-row gap-6 items-start">
                                        {/* Main Result (Classification) */}
                                        <div className="flex-1">
                                            {scores.classification && (
                                                <div className="mb-2">
                                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Resultado Principal</span>
                                                    <div className={`text-xl md:text-2xl font-bold mt-1 ${riskColor === 'red' ? 'text-red-700' :
                                                        riskColor === 'yellow' ? 'text-yellow-700' :
                                                            riskColor === 'green' ? 'text-green-700' : 'text-slate-800'
                                                        }`}>
                                                        {scores.classification}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Source Metadata as tag */}
                                            {scores.source === 'remote_followup' && (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100 mt-1">
                                                    <Smartphone className="w-3 h-3" />
                                                    Respondido pelo Paciente
                                                </span>
                                            )}
                                        </div>

                                        {/* Metrics Grid */}
                                        <div className="flex flex-wrap gap-3 content-start md:max-w-xs justify-end">
                                            {Object.entries(scores).map(([key, value]) => {
                                                if (['riskColor', 'savedAt', 'classification', 'source', 'note'].includes(key)) return null

                                                const label = key === 'total' ? 'Score Total' :
                                                    key === 'percent' ? 'Percentual' :
                                                        key.replace(/([A-Z])/g, ' $1').trim()

                                                return (
                                                    <div key={key} className={`px-3 py-2 rounded-lg border ${badgeStyles}`}>
                                                        <span className="text-[10px] uppercase font-bold block mb-0 opacity-70">
                                                            {label}
                                                        </span>
                                                        <span className="text-sm font-bold">
                                                            {String(value)}
                                                        </span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center text-slate-500 italic text-sm">
                                        <span>Avaliação sem cálculo automático disponível.</span>
                                        <Button variant="link" size="sm" onClick={() => onView && onView(assessment)} className="ml-2 h-auto p-0">Ver conteúdo</Button>
                                    </div>
                                )}

                                {/* Notes / Obs */}
                                {scores?.note && (
                                    <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                                        <strong>Nota:</strong> {scores.note}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {followupDialog && patientId && (
                <ScheduleFollowupDialog
                    open={followupDialog.open}
                    onOpenChange={(open) => !open && setFollowupDialog(null)}
                    patientId={patientId}
                    templateId={followupDialog.templateId}
                    templateTitle={followupDialog.templateTitle}
                    originalAssessmentId={followupDialog.assessmentId}
                    slug={slug}
                />
            )}
        </>
    )
}

// --- CUSTOM CARD: INSOLE PRESCRIPTION ---
function InsolePrescriptionCard({ assessment, onView }: { assessment: any, onView?: any }) {
    const data = assessment.data || {}
    const gen = data.general || {}
    const left = data.leftFoot || {}
    const right = data.rightFoot || {}
    const total = data.totalPrice || assessment.scores?.total || 0
    const dateStr = format(new Date(assessment.created_at), "dd/MM/yyyy", { locale: ptBR })

    // Helper Styles
    const flexColor = (f: string = '') => {
        if (f.includes("Flexível")) return "bg-green-50 text-green-700 border-green-100"
        if (f.includes("Semirrígido")) return "bg-yellow-50 text-yellow-700 border-yellow-100"
        if (f.includes("Rígido")) return "bg-red-50 text-red-700 border-red-100"
        return "bg-slate-50 text-slate-500"
    }
    const shortText = (t: string = '') => t?.split('|')[0]?.trim() || '-'

    const FootColumn = ({ side, conf, colorClass }: { side: string, conf: any, colorClass: string }) => {
        const hasPads = conf.pads && Object.values(conf.pads).some(Boolean)
        const hasAbs = conf.absorcao && conf.absorcao !== "Sem absorção"

        return (
            <div className={`p-3 rounded-lg border ${side === 'Esquerdo' ? 'bg-teal-50/30 border-teal-100' : 'bg-rose-50/30 border-rose-100'}`}>
                <div className={`text-[10px] font-black uppercase mb-2 ${colorClass}`}>{side}</div>
                <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                        <span className="text-slate-500">Arco:</span>
                        <span className="font-bold">{conf.arco || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500">Flex:</span>
                        <span className={`px-1 rounded border text-[10px] ${flexColor(conf.flexibilidade)}`}>{conf.flexibilidade ? conf.flexibilidade.substring(0, 5) + '.' : '-'}</span>
                    </div>
                    {/* Corrections Grid */}
                    {(conf.retrope || conf.antepe) && (
                        <div className="grid grid-cols-2 gap-1 mt-1">
                            <div className="bg-white border rounded px-1 py-0.5 text-center">
                                <div className="text-[8px] uppercase text-slate-400">Retropé</div>
                                <div className="font-bold text-[10px]">{shortText(conf.retrope)}</div>
                            </div>
                            <div className="bg-white border rounded px-1 py-0.5 text-center">
                                <div className="text-[8px] uppercase text-slate-400">Antepé</div>
                                <div className="font-bold text-[10px]">{shortText(conf.antepe)}</div>
                            </div>
                        </div>
                    )}
                    {/* Extras */}
                    {(hasPads || hasAbs) && (
                        <div className="mt-1 pt-1 border-t border-dashed border-slate-200">
                            {hasAbs && <Badge variant="outline" className="text-[9px] h-4 px-1 mr-1 border-pink-200 text-pink-700 bg-pink-50">Abs</Badge>}
                            {hasPads && <Badge variant="outline" className="text-[9px] h-4 px-1 border-purple-200 text-purple-700 bg-purple-50">Pad</Badge>}
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <Card className="border-l-4 border-l-blue-600 bg-white hover:shadow-md transition-all">
            <div className="p-4">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <Footprints className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-base">Prescrição de Palmilha</h3>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <Calendar className="w-3 h-3" /> {dateStr}
                                <span>•</span>
                                <span>{gen.produto || 'Personalizada'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Valor Total</div>
                        <div className="text-xl font-black text-slate-800">
                            R$ {Number(total).toFixed(2)}
                        </div>
                    </div>
                </div>

                {/* Specs Row */}
                <div className="flex gap-2 mb-4">
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700">Tipo: {gen.tipoPalmilha || '-'}</Badge>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700">Tam: {gen.tamanho || '-'}</Badge>
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">{gen.cobertura || '-'}</Badge>
                </div>

                {/* Feet Details */}
                <div className="grid grid-cols-2 gap-3">
                    <FootColumn side="Esquerdo" conf={left} colorClass="text-teal-600" />
                    <FootColumn side="Direito" conf={right} colorClass="text-rose-600" />
                </div>

                {/* Footer Actions */}
                <div className="mt-4 pt-3 border-t flex justify-end">
                    {onView && (
                        <Button variant="ghost" size="sm" className="text-xs h-8" onClick={() => onView(assessment)}>
                            <Eye className="w-3 h-3 mr-2" />
                            Ver Detalhes Completos
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    )
}
