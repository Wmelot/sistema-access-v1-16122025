'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Activity } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { NewEvaluationDialog } from "@/features/patients/components/NewEvaluationDialog"
import { useParams } from "next/navigation"

interface AssessmentTabProps {
    patientId: string
    assessments: any[] // Prioritize flexibility for now
    assessmentRecords?: any[] // Support both prop names if needed
}

export function AssessmentTab({ patientId, assessments = [], assessmentRecords = [] }: AssessmentTabProps) {
    const params = useParams()
    const slug = params?.slug as string
    const records = assessmentRecords.length > 0 ? assessmentRecords : assessments

    return (
        <div className="space-y-4">
            {/* Redundant subheader and button removed - using the one from CardHeader in page.tsx */}

            {records && records.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {records.map((record: any) => {
                        const createdAt = new Date(record.created_at)
                        const now = new Date()
                        const diffInHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
                        const isEditable = record.status !== 'finalized' && diffInHours < 24

                        return (
                            <Card key={record.id} className="hover:bg-slate-50 transition-colors">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-base font-medium">
                                            Avaliação
                                        </CardTitle>
                                        <Badge variant={record.status === 'finalized' ? 'default' : 'secondary'}>
                                            {record.status === 'finalized' ? 'Finalizado' : 'Rascunho'}
                                        </Badge>
                                    </div>
                                    <CardDescription className="flex flex-col gap-0.5">
                                        {!(record.form_templates?.title?.toLowerCase().includes('evolu') || record.form_templates?.title?.toLowerCase().includes('avalia')) && (
                                            <span className="font-semibold text-slate-900">{record.form_templates?.title || 'Formulário Sem Título'}</span>
                                        )}
                                        <span>{format(createdAt, "d 'de' MMMM, yyyy", { locale: ptBR })}</span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm text-muted-foreground mb-4">
                                        Profissional: <span className="font-medium text-foreground">{record.professionals?.full_name || 'Desconhecido'}</span>
                                    </div>
                                    <Button size="sm" variant={isEditable ? "outline" : "secondary"} className="w-full" asChild>
                                        <Link href={`/dashboard/${slug}/patients/${patientId}/records/${record.id}`}>
                                            {isEditable ? 'Continuar Preenchimento' : 'Visualizar'}
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            ) : (
                <EmptyState
                    icon={Activity}
                    title="Nenhuma avaliação física"
                    description="Crie a primeira avaliação física (Bioimpedância, Força, etc) agora."
                    action={
                        <NewEvaluationDialog patientId={patientId} patientName="Paciente" type="assessment">
                            <Button size="sm">Criar Avaliação</Button>
                        </NewEvaluationDialog>
                    }
                />
            )}
        </div>
    )
}
