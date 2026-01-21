
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ReconciliationUploader } from "./uploader"

export default function ReconciliationPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Conciliação Bancária</h2>
                <p className="text-muted-foreground">Importe seu extrato e confira os lançamentos.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Importar Extrato</CardTitle>
                    <CardDescription>Suporta arquivos OFX e CSV.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ReconciliationUploader />
                </CardContent>
            </Card>

            {/* TODO: Add List of Loaded Transactions if needed here, or inside Uploader component flow */}
        </div>
    )
}
