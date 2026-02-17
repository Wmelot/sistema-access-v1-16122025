'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { FileText, CalendarDays } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useParams } from "next/navigation"

interface EvolutionTabProps {
    patientId: string
    records: any[]
}

export function EvolutionTab({ patientId, records = [] }: EvolutionTabProps) {
    const params = useParams()
    const slug = params?.slug as string

    return (
        <div className="space-y-6">
            {records && records.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {records.map((record: any) => {
                        const createdAt = new Date(record.created_at)
                        const title = record.content?.title || record.form_templates?.title || 'Evolução Clínica'

                        return (
                            <Card key={record.id} className="hover:bg-slate-50 transition-colors border-l-4 border-l-indigo-500">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-base font-bold text-slate-900">
                                            {title}
                                        </CardTitle>
                                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100">
                                            Evolução
                                        </Badge>
                                    </div>
                                    <CardDescription className="flex items-center gap-1.5">
                                        <CalendarDays className="h-3.5 w-3.5" />
                                        <span>{format(createdAt, "d 'de' MMMM, yyyy 'às' HH:mm", { locale: ptBR })}</span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm text-muted-foreground mb-4 line-clamp-2 italic">
                                        {record.content?.note || record.content?.texto || 'Ver detalhes...'}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground mb-4 uppercase tracking-wider font-semibold">
                                        Profissional: <span className="text-slate-900">{record.professionals?.full_name || '---'}</span>
                                    </div>
                                    <Button size="sm" variant="secondary" className="w-full" asChild>
                                        <Link href={`/dashboard/${slug}/patients/${patientId}/records/${record.id}`}>
                                            Visualizar Registro
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            ) : (
                <EmptyState
                    icon={FileText}
                    title="Nenhuma evolução registrada"
                    description="O histórico de evoluções e entregas aparecerá aqui."
                />
            )}
        </div>
    )
}
