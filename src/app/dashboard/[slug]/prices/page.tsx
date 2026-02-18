import { Suspense } from "react"
import Link from "next/link"
import { getPriceTables, deletePriceTable } from "./actions"
import { PriceTableDialog } from "./components/price-table-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Trash2 } from "lucide-react"
import { revalidatePath } from "next/cache"

import { PriceTableCard } from "./components/price-table-card"
import { ManagementHeader } from "@/components/dashboard/management-header"

interface PageProps {
    params: Promise<{ slug: string }>
}

export default async function PriceTablesPage({ params }: PageProps) {
    const { slug } = await params
    const tables = await getPriceTables(slug)

    return (
        <div className="space-y-6">
            <ManagementHeader
                slug={slug}
                title="Tabelas de Preços"
                description="Gerencie preços diferenciados por convênio ou categoria de paciente."
            >
                <PriceTableDialog />
            </ManagementHeader>

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
