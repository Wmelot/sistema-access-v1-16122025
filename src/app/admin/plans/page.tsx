import { getPlans, updatePlan, createPlan, PlanConfig } from "./actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit2, Plus, Check, X } from "lucide-react"

import { PlanEditor } from "./plan-editor"

export const dynamic = 'force-dynamic'

export default async function AdminPlansPage() {
    const plans = await getPlans()

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Planos</h1>
                    <p className="text-muted-foreground">Defina o que cada plano pode acessar.</p>
                </div>
                <PlanEditor mode="create" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(plans as any[])?.map((plan: any) => (
                    <Card key={plan.id} className="flex flex-col">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xl font-bold">
                                {plan.name}
                            </CardTitle>
                            <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                                {plan.slug}
                            </Badge>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-4">
                            <div className="space-y-2 mt-4">
                                <FeatureItem label="Agenda Inteligente" active={!!plan.features.agenda_module} />
                                <FeatureItem label="Prontuário Eletrônico" active={!!plan.features.records_module} />
                                <FeatureItem label="Módulo Financeiro" active={!!plan.features.financial_module} />
                                <FeatureItem label="Marketing (CRM)" active={!!plan.features.marketing_module} />
                                <FeatureItem label="Inteligência Artificial (IA)" active={!!plan.features.ai_assistant} />
                                <FeatureItem label="Relatórios Avançados" active={!!plan.features.advanced_reports} />
                                <FeatureItem label="Integração WhatsApp" active={!!plan.features.whatsapp_integration} />
                                <FeatureItem label="Teleconsulta" active={!!plan.features.teleconsultation} />
                                <FeatureItem label="Mensageria ZAPI" active={!!plan.features.zapi_messaging} />
                                <FeatureItem label="Gestão de Protocolos" active={!!plan.features.protocol_management} />
                                <FeatureItem label="Gestão de Formulários" active={!!plan.features.form_management} />
                            </div>

                            <div className="pt-4 mt-auto">
                                <PlanEditor mode="edit" plan={plan} />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

function FeatureItem({ label, active }: { label: string, active: boolean }) {
    return (
        <div className="flex items-center text-sm">
            {active ? (
                <Check className="mr-2 h-4 w-4 text-green-500" />
            ) : (
                <X className="mr-2 h-4 w-4 text-gray-300" />
            )}
            <span className={active ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
        </div>
    )
}
