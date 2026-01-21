'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Activity } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { NewEvaluationDialog } from "@/components/patients/NewEvaluationDialog"

interface AssessmentTabProps {
    patientId: string
    assessments: any[] // Prioritize flexibility for now
    assessmentRecords?: any[] // Support both prop names if needed
}

export function AssessmentTab({ patientId, assessments = [], assessmentRecords = [] }: AssessmentTabProps) {
    const records = assessmentRecords.length > 0 ? assessmentRecords : assessments

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Avaliações Físicas e Laudos</h3>
                <NewEvaluationDialog patientId={patientId} patientName="Paciente" type="assessment">
                    <Button size="sm">Nova Avaliação</Button>
                </NewEvaluationDialog>
            </div>

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
                                            {record.form_templates?.title || 'Formulário Sem Título'}
                                        </CardTitle>
                                        <Badge variant={record.status === 'finalized' ? 'default' : 'secondary'}>
                                            {record.status === 'finalized' ? 'Finalizado' : 'Rascunho'}
                                        </Badge>
                                    </div>
                                    <CardDescription>
                                        {format(createdAt, "d 'de' MMMM, yyyy", { locale: ptBR })}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm text-muted-foreground mb-4">
                                        Profissional: <span className="font-medium text-foreground">{record.professionals?.full_name || 'Desconhecido'}</span>
                                    </div>
                                    <Button size="sm" variant={isEditable ? "outline" : "secondary"} className="w-full" asChild>
                                        <Link href={`/dashboard/patients/${patientId}/records/${record.id}`}>
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
