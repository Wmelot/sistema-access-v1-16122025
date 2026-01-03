
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardMetrics } from "../../actions"

export function BirthdaysWidget({ data }: { data: DashboardMetrics['birthdays'] }) {
    // if (!data.today.length && !data.week.length) return null

    const formatDate = (dateString: string) => {
        if (!dateString) return ''
        const [year, month, day] = dateString.split('-')
        return `${day}/${month}`
    }

    return (
        <Card className="h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Aniversariantes 🎉</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {data.today.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-primary mb-2">Hoje!</p>
                            <ul className="space-y-1">
                                {data.today.map((p: any) => (
                                    <li key={p.id} className="text-sm flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            {p.color && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />}
                                            <span>{p.name}</span>
                                        </div>
                                        <span className="text-muted-foreground text-xs font-medium">{formatDate(p.date_of_birth)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {data.week.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-2">Próximos 7 dias</p>
                            <ul className="space-y-2">
                                {data.week.map((p: any) => (
                                    <li key={p.id} className="text-sm flex justify-between items-center text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            {p.color && <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />}
                                            <span className="line-clamp-1">{p.name}</span>
                                        </div>
                                        <span className="text-xs shrink-0">{formatDate(p.date_of_birth)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {(!data.today.length && !data.week.length) && (
                        <p className="text-sm text-muted-foreground">Nenhum aniversariante próximo.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
