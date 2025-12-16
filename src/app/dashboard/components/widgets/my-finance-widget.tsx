
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardMetrics } from "../../actions"

export function MyFinanceWidget({ data }: { data: DashboardMetrics['my_finance'] }) {
    // Check if data exists
    if (!data) return (
        <Card className="h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Minha Produção</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-sm text-muted-foreground">Sem dados disponíveis.</div>
            </CardContent>
        </Card>
    )

    return (
        <Card className="h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Minha Produção (Mês)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.total)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    Pendente: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.pending_commissions)}
                </p>
            </CardContent>
        </Card>
    )
}
