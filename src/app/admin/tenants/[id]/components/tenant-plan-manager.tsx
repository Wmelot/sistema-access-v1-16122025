'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreditCard, Loader2, RefreshCw } from "lucide-react"
import { updateTenantPlan } from "../actions"
import { toast } from "sonner"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

interface TenantPlanManagerProps {
    tenantId: string
    currentPlanId?: string
    availablePlans: any[]
}

export function TenantPlanManager({ tenantId, currentPlanId, availablePlans }: TenantPlanManagerProps) {
    const [selectedPlanId, setSelectedPlanId] = useState(currentPlanId || '')
    const [isLoading, setIsLoading] = useState(false)
    const [isEditing, setIsEditing] = useState(false)

    const handleUpdate = async () => {
        if (!selectedPlanId) return
        setIsLoading(true)
        try {
            const result = await updateTenantPlan(tenantId, selectedPlanId)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Plano atualizado com sucesso!")
                setIsEditing(false)
            }
        } catch (error) {
            toast.error("Erro ao atualizar plano")
        } finally {
            setIsLoading(false)
        }
    }

    const currentPlan = availablePlans.find(p => p.id === currentPlanId)

    return (
        <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b bg-zinc-50/50 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-sm font-bold text-zinc-700">
                    <CreditCard className="h-4 w-4" />
                    Assinatura & Plano
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setIsEditing(!isEditing)}>
                    {isEditing ? 'Cancelar' : 'Alterar Plano'}
                </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-600">Plano Atual</span>
                    <span className="text-sm font-bold text-indigo-600">{currentPlan?.name || 'Personalizado/Legado'}</span>
                </div>

                {isEditing ? (
                    <div className="space-y-3 pt-2">
                        <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                            <SelectTrigger className="w-full h-9">
                                <SelectValue placeholder="Selecione um plano" />
                            </SelectTrigger>
                            <SelectContent>
                                {availablePlans.map((plan) => (
                                    <SelectItem key={plan.id} value={plan.id}>
                                        {plan.name} ({plan.slug})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            className="w-full h-9 text-xs"
                            disabled={isLoading || selectedPlanId === currentPlanId}
                            onClick={handleUpdate}
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-3.5 w-3.5 mr-2" />}
                            Confirmar Mudança
                        </Button>
                        <p className="text-[10px] text-zinc-400 text-center italic">
                            Mudar o plano irá resetar os recursos para os padrões do novo plano.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-zinc-600">Valor Estimado</span>
                            <span className="text-sm font-bold text-zinc-900">R$ --</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-zinc-600">Próxima Cobrança</span>
                            <span className="text-sm font-medium text-zinc-900">--/--/----</span>
                        </div>
                    </>
                )}

                <Separator />

                <Button variant="secondary" size="sm" className="w-full text-xs" disabled>
                    Ver Faturas
                </Button>
            </CardContent>
        </Card>
    )
}
