'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { FileText, CalendarDays, Footprints } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useParams } from "next/navigation"
import { cn } from "@/lib/utils"

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
                        const isInsole = record.content?._is_insole_prescription || record._type === 'assessment'
                        const title = record.content?.title || record.form_templates?.title || (isInsole ? 'Prescrição de Palmilha' : 'Evolução Clínica')
                        const badgeLabel = isInsole ? 'Prescrição' : 'Evolução'
                        const badgeColor = isInsole ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                        const borderLeftColor = isInsole ? 'border-l-blue-500' : 'border-l-indigo-500'
                        const Icon = isInsole ? Footprints : FileText

                        return (
                            <Card key={record.id} className={cn("hover:bg-slate-50 transition-colors border-l-4", borderLeftColor)}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                                            {title}
                                            {record.content?.propulsaoOrder && (
                                                <Badge variant="outline" className="text-[10px] font-mono bg-slate-50">#{record.content.propulsaoOrder}</Badge>
                                            )}
                                        </CardTitle>
                                        <Badge variant="outline" className={badgeColor}>
                                            {badgeLabel}
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
                                        {isInsole ? (
                                            <Link href={`/dashboard/${slug}/patients/${patientId}?tab=insoles`}>
                                                Visualizar Prescrição
                                            </Link>
                                        ) : (
                                            <Link href={`/dashboard/${slug}/patients/${patientId}/records/${record.id}`}>
                                                Visualizar Registro
                                            </Link>
                                        )}
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
