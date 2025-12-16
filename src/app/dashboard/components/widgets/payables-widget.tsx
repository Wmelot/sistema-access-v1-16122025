
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardMetrics } from "../../actions"

export function PayablesWidget({ data }: { data: NonNullable<DashboardMetrics['financials']> }) {
    if (!data) return null

    return (
        <Card className="h-full border-red-100">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-600">Contas a Pagar (Próx. 5)</CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2">
                    {data.payables.map((p: any, i: number) => (
                        <li key={i} className="flex justify-between text-sm">
                            <span className="truncate max-w-[120px]" title={p.description}>{p.description}</span>
                            <span className="font-medium text-red-600">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.amount)}
                            </span>
                        </li>
                    ))}
                    {!data.payables.length && <li className="text-sm text-muted-foreground">Nenhuma conta pendente.</li>}
                </ul>
            </CardContent>
        </Card>
    )
}
