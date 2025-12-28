import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Send } from "lucide-react"
import Link from "next/link"
import { getUnbilledPatients, createBillingCampaign } from "../actions"
import { redirect } from "next/navigation"
import { getClinicSettings } from "@/app/dashboard/settings/actions"

export default async function BillingPage() {
    const patients = await getUnbilledPatients()
    const clinicSettings = await getClinicSettings()

    async function handleSendBilling(formData: FormData) {
        'use server'

        const selectedIds = formData.getAll('patient_ids') as string[]
        const customMessage = formData.get('custom_message') as string

        if (selectedIds.length === 0) {
            return
        }

        const result = await createBillingCampaign(selectedIds, customMessage || undefined)

        if (result.success) {
            redirect(`/dashboard/marketing/${result.campaignId}`)
        }
    }

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
                <form action={handleSendBilling}>
                    <div className="grid gap-6 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Pacientes</CardTitle>
                                <CardDescription>
                                    Selecione os pacientes que receberão a cobrança
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {patients.map((patient) => (
                                    <div key={patient.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                                        <Checkbox
                                            id={`patient-${patient.id}`}
                                            name="patient_ids"
                                            value={patient.id}
                                            defaultChecked
                                        />
                                        <div className="flex-1 space-y-1">
                                            <label
                                                htmlFor={`patient-${patient.id}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                            >
                                                {patient.name}
                                            </label>
                                            <p className="text-sm text-muted-foreground">
                                                {patient.total_sessions} sessões • R$ {patient.total_amount.toFixed(2)}
                                            </p>
                                            <div className="text-xs text-muted-foreground space-y-0.5 mt-2">
                                                {patient.details.map((detail, idx) => (
                                                    <div key={idx}>
                                                        {detail.date} - {detail.service}: R$ {detail.price.toFixed(2)}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Mensagem</CardTitle>
                                <CardDescription>
                                    Personalize a mensagem que será enviada (opcional)
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Textarea
                                    name="custom_message"
                                    placeholder={defaultTemplate}
                                    className="min-h-[400px] font-mono text-sm"
                                    defaultValue={defaultTemplate}
                                />
                                <div className="text-xs text-muted-foreground space-y-1">
                                    <p><strong>Variáveis disponíveis:</strong></p>
                                    <p>• <code>{'{{nome}}'}</code> - Nome do paciente</p>
                                    <p>• <code>{'{{detalhamento}}'}</code> - Lista de atendimentos</p>
                                    <p>• <code>{'{{total_sessoes}}'}</code> - Número de sessões</p>
                                    <p>• <code>{'{{total}}'}</code> - Valor total</p>
                                    <p>• <code>{'{{pix_key}}'}</code> - Chave PIX</p>
                                    <p>• <code>{'{{clinica}}'}</code> - Nome da clínica</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex justify-end mt-6">
                        <Button type="submit" size="lg" className="gap-2">
                            <Send className="h-4 w-4" />
                            Enviar Cobranças
                        </Button>
                    </div>
                </form>
            )}
        </div>
    )
}
