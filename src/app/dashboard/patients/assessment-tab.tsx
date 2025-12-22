'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AssessmentList } from './components/assessments/AssessmentList'
import { AssessmentForm } from './components/assessments/AssessmentForm'
import { ASSESSMENTS, AssessmentType } from './components/assessments/definitions'
import { useRouter } from 'next/navigation'

interface AssessmentTabProps {
    patientId: string
    assessments: any[]
    onViewRecord?: (record: any) => void
}

export function AssessmentTab({ patientId, assessments, onViewRecord }: AssessmentTabProps) {
    const [selectedType, setSelectedType] = useState<AssessmentType | ''>('')
    const [open, setOpen] = useState(false)
    const router = useRouter()

    const handleSuccess = () => {
        setOpen(false)
        setSelectedType('')
        router.refresh()
    }

    // Sort assessments alphabetically by title
    const sortedAssessments = Object.values(ASSESSMENTS).sort((a, b) =>
        a.title.localeCompare(b.title, 'pt-BR')
    )

    return (
        <div className="flex gap-6 h-full">
            {/* Left Sidebar - Questionnaire List */}
            <div className="w-64 flex-shrink-0 space-y-2">
                <h3 className="text-lg font-semibold mb-4">Questionários</h3>
                <div className="space-y-1">
                    {sortedAssessments.map((def) => (
                        <button
                            key={def.id}
                            onClick={() => setSelectedType(def.id)}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${selectedType === def.id
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted'
                                }`}
                        >
                            {def.title}
                        </button>
                    ))}
                </div>
            </div>

            {/* Right Content Area */}
            <div className="flex-1 space-y-6">
                {selectedType ? (
                    <div>
                        <div className="flex items-center justify-between border-b pb-4 mb-4">
                            <h3 className="text-lg font-medium">Nova Avaliação</h3>
                            <Button variant="ghost" onClick={() => setSelectedType('')}>
                                Cancelar
                            </Button>
                        </div>
                        <AssessmentForm
                            patientId={patientId}
                            type={selectedType as AssessmentType}
                            onSuccess={handleSuccess}
                        />
                    </div>
                ) : (
                    <div>
                        <h3 className="text-lg font-medium mb-4">Histórico de Avaliações</h3>
                        <AssessmentList assessments={assessments} onView={onViewRecord} patientId={patientId} />
                    </div>
                )}
            </div>
        </div>
    )
}
