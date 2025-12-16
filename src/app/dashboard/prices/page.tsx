import { Suspense } from "react"
import Link from "next/link"
import { getPriceTables, deletePriceTable } from "./actions"
import { PriceTableDialog } from "./components/price-table-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Trash2 } from "lucide-react"
import { revalidatePath } from "next/cache"

import { PriceTableCard } from "./components/price-table-card"

export default async function PriceTablesPage() {
    const tables = await getPriceTables()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Tabelas de Preços</h1>
                    <p className="text-muted-foreground">
                        Gerencie preços diferenciados por convênio ou categoria de paciente.
                    </p>
                </div>
                <PriceTableDialog />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tables.length === 0 ? (
                    <Card className="col-span-full">
                        <CardHeader>
                            <CardTitle className="text-lg">Nenhuma tabela encontrada</CardTitle>
                            <CardDescription>
                                Crie sua primeira tabela de preços para começar a personalizar valores.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                ) : (
                    tables.map((table) => (
                        <PriceTableCard key={table.id} table={table} />
                    ))
                )}
            </div>
        </div>
    )
}
