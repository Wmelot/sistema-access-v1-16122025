'use client'

import { useState, useMemo } from 'react'
import { Clock } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { AssessmentList } from './assessments/AssessmentList'
import { ASSESSMENTS, AssessmentType } from './assessments/definitions'
import { ViewRecordDialog } from "@/components/records/ViewRecordDialog"
import { VoidingDiaryCard } from './VoidingDiaryCard'
import type { VoidingEntry } from '../actions/voiding-diary'

interface QuestionnairesTabProps {
    patientId: string
    patientName?: string
    clinicId?: string
    assessments: any[]
    voidingDiaryEntries?: VoidingEntry[]
    onViewRecord?: (record: any) => void
    showInsoles?: boolean
    slug?: string
}

export function QuestionnairesTab({ patientId, patientName, clinicId, assessments, voidingDiaryEntries, onViewRecord, showInsoles = false, slug }: QuestionnairesTabProps) {
    const [selectedRecord, setSelectedRecord] = useState<any>(null)

    const handleView = (record: any) => {
        if (onViewRecord) {
            onViewRecord(record)
        } else {
            setSelectedRecord(record)
        }
    }

    const validAssessments = useMemo(() => {
        return (assessments || []).filter(a => {
            // 1. Check if it's an Insole Prescription (Special case)
            const isInsolePrescription = a.type === 'insoles_prescription';

            // 2. Identify generic questionnaires (PROMs)
            // It's a PROM if it matches a known ID in the global PROMs definition
            const isKnownPROM = !!ASSESSMENTS[a.type as AssessmentType];

            // [NEW] As per user request: "Questionários sempre devem aparecer na aba questionários, 
            // independente da forma que foram preenchidos". 
            // We show all known PROMs and insole prescriptions regardless of type prefix.
            return isKnownPROM || isInsolePrescription;
        });
    }, [assessments]);

    return (
        <div className="flex h-full flex-col">
            <div className="mb-6 pb-4 border-b shrink-0 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold">Histórico de Questionários</h2>
                    <p className="text-muted-foreground">Avaliações e escalas aplicadas anteriormente</p>
                </div>
            </div>

            {/* DIÁRIO MICCIONAL — dados pré-carregados do servidor */}
            {(voidingDiaryEntries ?? []).length > 0 && (
                <VoidingDiaryCard
                    patientId={patientId}
                    clinicId={clinicId ?? ''}
                    initialEntries={voidingDiaryEntries ?? []}
                />
            )}

            <ScrollArea className="flex-1">
                {validAssessments.length > 0 ? (
                    <AssessmentList
                        assessments={validAssessments}
                        onView={handleView}
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

            {!onViewRecord && (
                <ViewRecordDialog
                    open={!!selectedRecord}
                    onOpenChange={(open) => !open && setSelectedRecord(null)}
                    record={selectedRecord}
                    patient={{ id: patientId, name: patientName }}
                    templates={[]}
                />
            )}
        </div>
    )
}

