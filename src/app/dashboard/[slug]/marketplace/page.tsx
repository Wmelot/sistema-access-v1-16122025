import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Marketplace } from "./components/marketplace"
import { ManagementHeader } from "@/components/dashboard/management-header"

export default async function MarketplacePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params

    return (
        <div className="space-y-6">
            <ManagementHeader
                slug={slug}
                title="Loja de Recursos"
                description="Turbine sua clínica com recursos adicionais e automações inteligentes."
            />

            <Card className="border-none shadow-none bg-transparent">
                <CardContent className="p-0">
                    <Marketplace slug={slug} />
                </CardContent>
            </Card>
        </div>
    )
}
