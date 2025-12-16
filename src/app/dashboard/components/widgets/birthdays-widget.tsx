
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardMetrics } from "../../actions"

export function BirthdaysWidget({ data }: { data: DashboardMetrics['birthdays'] }) {
    // if (!data.today.length && !data.week.length) return null

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
                                    <li key={p.id} className="text-sm">{p.name}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {data.week.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-2">Próximos 7 dias</p>
                            <ul className="space-y-1">
                                {data.week.map((p: any) => (
                                    <li key={p.id} className="text-sm text-muted-foreground">{p.name}</li>
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
