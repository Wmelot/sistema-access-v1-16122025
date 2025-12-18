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
}

export function AssessmentTab({ patientId, assessments }: AssessmentTabProps) {
    const [selectedType, setSelectedType] = useState<AssessmentType | ''>('')
    const [open, setOpen] = useState(false)
    const router = useRouter()

    const handleSuccess = () => {
        setOpen(false)
        setSelectedType('')
        router.refresh()
    }

    return (
        <div className="space-y-6">
            {/* Header / Selection Mode */}
            {!selectedType ? (
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Questionários e Escalas</h3>
                    <div className="flex items-center gap-2">
                        <Select onValueChange={(val) => setSelectedType(val as AssessmentType)}>
                            <SelectTrigger className="w-[250px]">
                                <SelectValue placeholder="Novo Questionário..." />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.values(ASSESSMENTS).map((def) => (
                                    <SelectItem key={def.id} value={def.id}>
                                        {def.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-between border-b pb-4">
                    <h3 className="text-lg font-medium">Nova Avaliação</h3>
                    <Button variant="ghost" onClick={() => setSelectedType('')}>
                        Cancelar
                    </Button>
                </div>
            )}

            {/* Content Area */}
            {selectedType ? (
                <div className="mt-4">
                    <AssessmentForm
                        patientId={patientId}
                        type={selectedType as AssessmentType}
                        onSuccess={handleSuccess}
                    />
                </div>
            ) : (
                <AssessmentList assessments={assessments} />
            )}
        </div>
    )
}
