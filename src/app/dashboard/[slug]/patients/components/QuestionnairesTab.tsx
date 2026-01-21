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
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

const ASSESSMENT_GROUPS = [
    { title: "Coluna Cervical", items: ['ndi', 'tampa_kinesiophobia', 'mcgill_short', 'psfs'] },
    { title: "Coluna Lombar", items: ['roland_morris', 'oswestry', 'quebec', 'start_back', 'tampa_kinesiophobia', 'mcgill_short', 'psfs'] },
    { title: "Ombro", items: ['spadi', 'quickdash', 'tampa_kinesiophobia', 'mcgill_short', 'psfs'] },
    { title: "Cotovelo, Punho e Mão", items: ['prwe', 'quickdash', 'tampa_kinesiophobia', 'mcgill_short', 'psfs'] },
    { title: "Quadril", items: ['ihot33', 'hoos', 'womac', 'lefs', 'tampa_kinesiophobia', 'mcgill_short', 'psfs'] },
    { title: "Joelho", items: ['ikdc', 'lysholm', 'koos', 'womac', 'lefs', 'tampa_kinesiophobia', 'mcgill_short', 'psfs'] },
    { title: "Pé e Tornozelo", items: ['faos', 'faam', 'aofas', 'lefs', 'tampa_kinesiophobia', 'mcgill_short', 'psfs'] },
    { title: "Saúde Pélvica", items: ['iciq_sf', 'udi_6', 'fsfi', 'perfect_scale', 'mcgill_short', 'psfs'] },
    { title: "Palmilhas (PBE)", items: ['insoles_40d', 'insoles_1y', 'psfs'], requiresInsoles: true },
    { title: "Geral & Dor", items: ['tampa_kinesiophobia', 'mcgill_short', 'psfs'] },
]

interface QuestionnairesTabProps {
    patientId: string
    patientName?: string
    assessments: any[]
    onViewRecord?: (record: any) => void
    showInsoles?: boolean
    slug?: string
}

export function QuestionnairesTab({ patientId, assessments, onViewRecord, showInsoles = false, slug }: QuestionnairesTabProps) {
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
                    <p className="text-sm text-muted-foreground">Selecione por região</p>
                </div>

                <div className="mb-4">
                    <Button
                        variant={showHistory ? "secondary" : "ghost"}
                        className="w-full justify-start gap-2 font-semibold"
                        onClick={handleBackToHistory}
                    >
                        <Clock className="h-4 w-4" />
                        Histórico de Avaliações
                    </Button>
                </div>

                <ScrollArea className="flex-1 -mr-4 pr-4">
                    <Accordion type="single" collapsible className="w-full pr-2">
                        {ASSESSMENT_GROUPS.map((group, idx) => {
                            if (group.requiresInsoles && !showInsoles) return null

                            return (
                                <AccordionItem value={`item-${idx}`} key={idx} className="border-b-0 mb-1">
                                    <AccordionTrigger className="hover:no-underline hover:bg-muted/50 px-3 py-2 rounded-md text-sm font-semibold">
                                        {group.title}
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-1 pb-2">
                                        <div className="flex flex-col gap-1 pl-2 border-l ml-3">
                                            {group.items.map((assessmentId) => {
                                                const assessment = ASSESSMENTS[assessmentId as AssessmentType]
                                                if (!assessment) return null

                                                // Filter out insoles if not showing
                                                if (!showInsoles && assessmentId.startsWith('insoles')) return null

                                                const isSelected = selectedType === assessmentId
                                                return (
                                                    <Button
                                                        key={`${group.title}-${assessmentId}`}
                                                        variant={isSelected ? "default" : "ghost"}
                                                        size="sm"
                                                        className={cn(
                                                            "w-full justify-start h-auto py-2 whitespace-normal text-left font-normal",
                                                            isSelected ? "bg-slate-900 text-white" : "text-muted-foreground hover:text-foreground"
                                                        )}
                                                        onClick={() => handleSelectType(assessment.id)}
                                                    >
                                                        <span className="line-clamp-1">{assessment.title.split('(')[0].trim()}</span>
                                                        {isSelected && <ChevronRight className="h-3 w-3 ml-auto opacity-50" />}
                                                    </Button>
                                                )
                                            })}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            )
                        })}
                    </Accordion>
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
                                <AssessmentList
                                    assessments={assessments.filter(a => showInsoles || !a.type.startsWith('insoles'))}
                                    onView={onViewRecord}
                                    patientId={patientId}
                                    slug={slug}
                                />
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
