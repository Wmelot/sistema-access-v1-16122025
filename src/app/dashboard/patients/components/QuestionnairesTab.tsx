'use client'
// Force HMR Update

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Clock, ChevronRight, FileText, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { AssessmentList } from './assessments/AssessmentList'
import { AssessmentForm } from './assessments/AssessmentForm'
import { ASSESSMENTS, AssessmentType } from './assessments/definitions'
import { cn } from "@/lib/utils"

interface QuestionnairesTabProps {
    patientId: string
    patientName?: string
    assessments: any[]
    onViewRecord?: (record: any) => void
}

export function QuestionnairesTab({ patientId, assessments, onViewRecord }: QuestionnairesTabProps) {
    const router = useRouter()
    const [selectedType, setSelectedType] = useState<AssessmentType | null>(null)
    const [showHistory, setShowHistory] = useState(true)

    const handleSelectType = (type: AssessmentType) => {
        setSelectedType(type)
        setShowHistory(false)
    }

    const handleBackToHistory = () => {
        setSelectedType(null)
        setShowHistory(true)
    }

    return (
        <div className="flex h-full gap-6">
            {/* Sidebar with Questionnaire Types */}
            <div className="w-[300px] flex flex-col border-r pr-6 shrink-0 h-full overflow-hidden">
                <div className="mb-4 shrink-0">
                    <h3 className="font-semibold text-lg mb-1">Questionários</h3>
                    <p className="text-sm text-muted-foreground">Selecione para preencher</p>
                </div>

                <ScrollArea className="flex-1 -mr-4 pr-4">
                    <div className="space-y-1 pb-4">
                        <Button
                            variant={showHistory ? "secondary" : "ghost"}
                            className="w-full justify-start gap-2 mb-4 font-semibold"
                            onClick={handleBackToHistory}
                        >
                            <Clock className="h-4 w-4" />
                            Histórico de Avaliações
                        </Button>

                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-4 px-2">
                            Disponíveis
                        </div>

                        {availableAssessments.map((assessment) => (
                            <Button
                                key={assessment.id}
                                variant={selectedType === assessment.id ? "default" : "ghost"}
                                className={cn(
                                    "w-full justify-start gap-2 h-auto py-3 whitespace-normal text-left items-start",
                                    selectedType === assessment.id ? "bg-slate-900 text-white hover:bg-slate-800" : "hover:bg-slate-100"
                                )}
                                onClick={() => handleSelectType(assessment.id)}
                            >
                                <FileText className={cn("h-4 w-4 mt-0.5 shrink-0", selectedType === assessment.id ? "text-slate-300" : "text-slate-500")} />
                                <div className="flex-1">
                                    <div className="font-medium leading-none mb-1">{assessment.title}</div>
                                    <div className={cn("text-xs line-clamp-2", selectedType === assessment.id ? "text-slate-400" : "text-slate-500")}>
                                        {assessment.description}
                                    </div>
                                </div>
                                {selectedType === assessment.id && <ChevronRight className="h-4 w-4 mt-0.5 shrink-0 ml-auto opacity-50" />}
                            </Button>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {showHistory ? (
                    <div className="h-full flex flex-col">
                        <div className="mb-6 pb-4 border-b shrink-0">
                            <h2 className="text-xl font-bold">Histórico</h2>
                            <p className="text-muted-foreground">Avaliações realizadas anteriormente</p>
                        </div>

                        <ScrollArea className="flex-1">
                            {assessments && assessments.filter(a => showInsoles || !a.type.startsWith('insoles')).length > 0 ? (
                                <AssessmentList assessments={assessments.filter(a => showInsoles || !a.type.startsWith('insoles'))} onView={onViewRecord} patientId={patientId} />
                            ) : (
                                <div className="text-center py-20 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                                    <p className="mb-2">Nenhuma avaliação encontrada.</p>
                                    <p className="text-sm">Selecione um questionário ao lado para iniciar.</p>
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                ) : selectedType ? (
                    <div className="h-full flex flex-col">
                        <div className="mb-4 pb-2 shrink-0 flex items-center justify-between">
                            <Button variant="ghost" size="sm" onClick={handleBackToHistory} className="gap-2 text-muted-foreground hover:text-foreground pl-0 hover:bg-transparent">
                                <ArrowLeft className="h-4 w-4" />
                                Voltar para o Histórico
                            </Button>
                        </div>

                        <ScrollArea className="flex-1 pr-6">
                            <div className="pb-20">
                                <AssessmentForm
                                    patientId={patientId}
                                    type={selectedType}
                                    onSuccess={() => {
                                        // router.refresh()
                                        // Force hard reload to verify data persistence without crashing SC transition
                                        // window.location.reload() 
                                        handleBackToHistory()
                                        toast.success("Avaliação salva! Atualize a página se não aparecer na lista.")
                                    }}
                                />
                            </div>
                        </ScrollArea>
                    </div>
                ) : null}
            </div>
        </div>
    )
}
