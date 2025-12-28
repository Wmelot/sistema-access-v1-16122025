"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Send, Loader2 } from "lucide-react"
import { createBillingCampaign } from "@/app/dashboard/marketing/actions"

interface BillingFormProps {
    patients: any[]
    defaultTemplate: string
}

export function BillingForm({ patients, defaultTemplate }: BillingFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        try {
            const selectedIds = formData.getAll('patient_ids') as string[]
            const customMessage = formData.get('custom_message') as string

            if (selectedIds.length === 0) {
                toast.error("Selecione pelo menos um paciente.")
                setLoading(false)
                return
            }

            const result = await createBillingCampaign(selectedIds, customMessage || undefined)

            if (result.success) {
                toast.success("Campanha de cobrança criada!")
                router.push(`/dashboard/marketing/${result.campaignId}`)
            } else {
                // HERE IS THE FORCE ERROR DISPLAY
                console.error("Billing Error:", result.error)
                toast.error(`Erro ao enviar: ${result.error}`)
            }
        } catch (error: any) {
            console.error("Critical Billing Error:", error)
            toast.error(`Erro crítico: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form action={handleSubmit}>
            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Pacientes</CardTitle>
                        <CardDescription>
                            Selecione os pacientes que receberão a cobrança
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
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
                                        {patient.details.map((detail: any, idx: number) => (
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
                            <p>• <code>{"{{nome}}"}</code> - Nome do paciente</p>
                            <p>• <code>{"{{detalhamento}}"}</code> - Lista de atendimentos</p>
                            <p>• <code>{"{{total_sessoes}}"}</code> - Número de sessões</p>
                            <p>• <code>{"{{total}}"}</code> - Valor total</p>
                            <p>• <code>{"{{pix_key}}"}</code> - Chave PIX</p>
                            <p>• <code>{"{{clinica}}"}</code> - Nome da clínica</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end mt-6">
                <Button type="submit" size="lg" className="gap-2" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {loading ? "Enviando..." : "Enviar Cobranças"}
                </Button>
            </div>
        </form>
    )
}
