
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign } from "lucide-react"
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
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-900">Minha Produção (Mês)</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center space-y-6">
                {/* Total Faturado */}
                <div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex justify-between items-center mb-1">
                        <span>Faturado (Período)</span>
                        <DollarSign className="h-3.5 w-3.5 text-zinc-400" />
                    </div>
                    <div className="text-2xl font-bold text-zinc-900">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.total)}
                    </div>
                </div>

                {/* Separator */}
                <div className="border-t border-zinc-100" />

                {/* Recebido vs Pendente */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Recebido</div>
                        <div className="text-base font-bold text-emerald-600">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.received)}
                        </div>
                    </div>
                    <div>
                        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">A Receber</div>
                        <div className="text-base font-bold text-orange-500">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.pending)}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
