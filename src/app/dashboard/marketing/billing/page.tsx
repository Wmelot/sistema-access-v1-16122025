import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { getUnbilledPatients } from "../actions"
import { getClinicSettings } from "@/app/dashboard/settings/actions"
import { BillingForm } from "./billing-form"

export default async function BillingPage() {
    const patients = await getUnbilledPatients()
    const clinicSettings = await getClinicSettings()

    const totalAmount = patients.reduce((sum, p) => sum + p.total_amount, 0)
    const totalSessions = patients.reduce((sum, p) => sum + p.total_sessions, 0)

    const defaultTemplate = `Olá {{nome}},

Segue o resumo dos atendimentos realizados este mês:

{{detalhamento}}

📊 *Total de sessões:* {{total_sessoes}}
💰 *Valor total:* R$ {{total}}

💳 *PIX para pagamento:*
${clinicSettings?.pix_key || 'Não configurado'}

Qualquer dúvida, estou à disposição!

Atenciosamente,
${clinicSettings?.name || 'Clínica'}`

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/dashboard/marketing">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Cobrança Mensal</h1>
                    <p className="text-muted-foreground">
                        Envie lembretes de pagamento para pacientes com atendimentos não faturados
                    </p>
                </div>
            </div>

            {!clinicSettings?.pix_key && (
                <Card className="border-yellow-200 bg-yellow-50">
                    <CardHeader>
                        <CardTitle className="text-yellow-800">⚠️ Chave PIX não configurada</CardTitle>
                        <CardDescription className="text-yellow-700">
                            Configure sua chave PIX em{' '}
                            <Link href="/dashboard/settings" className="underline font-medium">
                                Configurações
                            </Link>
                            {' '}para incluí-la automaticamente nas mensagens.
                        </CardDescription>
                    </CardHeader>
                </Card>
            )}

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Pacientes com Débito</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{patients.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Total de Sessões</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalSessions}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">R$ {totalAmount.toFixed(2)}</div>
                    </CardContent>
                </Card>
            </div>

            {patients.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">
                            Nenhum paciente com atendimentos não faturados neste mês.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <BillingForm patients={patients} defaultTemplate={defaultTemplate} />
            )}
        </div>
    )
}

