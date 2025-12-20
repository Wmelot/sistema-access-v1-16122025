
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
        <Card className="h-full flex flex-col justify-between">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Minha Produção (Mês)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Total Faturado */}
                <div>
                    <div className="text-xs text-muted-foreground flex justify-between">
                        <span>Faturado (Período)</span>
                        <DollarSign className="h-3 w-3" />
                    </div>
                    <div className="text-xl font-bold">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.total)}
                    </div>
                </div>

                {/* Separator */}
                <div className="border-t border-dashed" />

                {/* Recebido vs Pendente */}
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <div className="text-[10px] text-muted-foreground uppercase font-semibold">Recebido</div>
                        <div className="text-sm font-bold text-green-600">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.received)}
                        </div>
                    </div>
                    <div>
                        <div className="text-[10px] text-muted-foreground uppercase font-semibold">A Receber</div>
                        <div className="text-sm font-bold text-amber-600">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.pending)}
                        </div>
                    </div>
                </div>
                {data.debug && (
                    <div className="mt-4 p-2 bg-slate-900 text-slate-50 text-[10px] rounded overflow-x-auto font-mono">
                        DEBUG:
                        {JSON.stringify(data.debug, null, 2)}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
