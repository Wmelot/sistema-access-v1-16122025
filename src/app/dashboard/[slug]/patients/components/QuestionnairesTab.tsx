'use client'
// Force HMR Update

import { Clock } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { AssessmentList } from './assessments/AssessmentList'
import { ASSESSMENTS } from './assessments/definitions'

interface QuestionnairesTabProps {
    patientId: string
    patientName?: string
    assessments: any[]
    onViewRecord?: (record: any) => void
    showInsoles?: boolean
    slug?: string
}

export function QuestionnairesTab({ patientId, assessments, onViewRecord, showInsoles = false, slug }: QuestionnairesTabProps) {
    return (
        <div className="flex h-full flex-col">
            <div className="mb-6 pb-4 border-b shrink-0 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold">Histórico de Questionários</h2>
                    <p className="text-muted-foreground">Avaliações e escalas aplicadas anteriormente</p>
                </div>
                {/* Opcional: Algum botão de ação se necessário no futuro */}
            </div>

            <ScrollArea className="flex-1">
                {assessments && assessments.filter(a => showInsoles || !a.type.startsWith('insoles')).length > 0 ? (
                    <AssessmentList
                        assessments={assessments.filter(a => showInsoles || !a.type.startsWith('insoles'))}
                        onView={onViewRecord}
                        patientId={patientId}
                        slug={slug}
                    />
                ) : (
                    <div className="text-center py-24 text-muted-foreground bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                        <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                            <Clock className="h-6 w-6 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-1">Nenhum histórico encontrado</h3>
                        <p className="max-w-xs mx-auto text-sm">
                            Este paciente ainda não possui respostas de questionários registradas.
                        </p>
                    </div>
                )}
            </ScrollArea>
        </div>
    )
}
