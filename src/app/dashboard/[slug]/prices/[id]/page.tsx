import { Suspense } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { getPriceTable, getPriceTableItems } from "../actions"
import { PriceTableEditor } from "./price-table-editor"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

interface PageProps {
    params: Promise<{ id: string; slug: string }>
}

export default async function PriceTableDetailPage({ params }: PageProps) {
    const { id, slug } = await params

    const table = await getPriceTable(id, slug)
    if (!table) return notFound()

    const items = await getPriceTableItems(id)

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href={`/dashboard/${slug}/prices`}>
                    <Button variant="outline" size="icon">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{table.name}</h1>
                    <p className="text-muted-foreground">
                        Edite os preços específicos para esta tabela. Ex: Convênio, Particular, etc.
                    </p>
                </div>
            </div>

            <PriceTableEditor tableId={id} initialItems={items} />
        </div>
    )
}
