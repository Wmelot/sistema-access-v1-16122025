import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Marketplace } from "./components/marketplace"

export default async function MarketplacePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Loja de Recursos</h1>
                <p className="text-muted-foreground">
                    Turbine sua clínica com recursos adicionais e automações inteligentes.
                </p>
            </div>

            <Card className="border-none shadow-none bg-transparent">
                <CardContent className="p-0">
                    <Marketplace slug={slug} />
                </CardContent>
            </Card>
        </div>
    )
}
