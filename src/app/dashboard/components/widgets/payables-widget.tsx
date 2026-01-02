import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardMetrics } from "../../actions"
import { format } from "date-fns"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export function PayablesWidget({ data }: { data: DashboardMetrics['financials'] }) {
    if (!data) return null

    return (
        <Link href="/dashboard/financial?tab=payables">
            <Card className="h-full flex flex-col cursor-pointer hover:bg-slate-50 transition-colors group">
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-sm font-medium text-red-600">
                        Contas a Pagar (Vencidas e próx. 5 dias)
                    </CardTitle>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-red-500 transition-colors" />
                </CardHeader>
                <CardContent className="flex-1 overflow-auto pt-2">
                    {data.payables.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                            Nenhuma conta pendente.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {data.payables.map((bill: any, i: number) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                    <div className="flex flex-col">
                                        <span className="font-medium truncate max-w-[150px]">{bill.description}</span>
                                        <span className="text-[10px] text-muted-foreground">
                                            Vence: {format(new Date(bill.due_date), 'dd/MM')}
                                        </span>
                                    </div>
                                    <span className="font-bold text-slate-700">
                                        R$ {Number(bill.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </Link>
    )
}
