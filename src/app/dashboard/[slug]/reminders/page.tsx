import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell } from "lucide-react"

export default function RemindersPage() {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Lembretes</h1>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    <CardTitle>Central de Lembretes</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        Esta funcionalidade está sendo preparada para você.
                        Em breve, você poderá configurar lembretes automáticos para seus pacientes aqui.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
