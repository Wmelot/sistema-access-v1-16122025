'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { createPlan, updatePlan, PlanConfig } from "./actions"
import { Edit2, Plus, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface PlanEditorProps {
    mode: 'create' | 'edit'
    plan?: PlanConfig
}

const DEFAULT_FEATURES = {
    agenda_module: true,
    records_module: true,
    financial_module: false,
    marketing_module: false,
    ai_assistant: false,
    advanced_reports: false,
    whatsapp_integration: false,
    teleconsultation: false,
    custom_forms: 1
}

export function PlanEditor({ mode, plan }: PlanEditorProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const [formData, setFormData] = useState({
        name: plan?.name || '',
        slug: plan?.slug || '',
        features: { ...(DEFAULT_FEATURES as any), ...(plan?.features || {}) },
        is_active: plan?.is_active ?? true
    })

    const handleFeatureChange = (key: string, value: boolean) => {
        setFormData(prev => ({
            ...prev,
            features: {
                ...prev.features,
                [key]: value
            }
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (mode === 'edit' && plan) {
                await updatePlan(plan.id, formData)
            } else {
                await createPlan(formData)
            }
            setOpen(false)
            router.refresh()
        } catch (error) {
            console.error(error)
            alert("Erro ao salvar plano")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {mode === 'create' ? (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Plano
                    </Button>
                ) : (
                    <Button variant="outline" className="w-full">
                        <Edit2 className="mr-2 h-4 w-4" />
                        Editar Limitadores
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{mode === 'create' ? 'Criar Novo Plano' : `Editar ${plan?.name}`}</DialogTitle>
                    <DialogDescription>
                        Configure quais módulos e recursos este plano terá acesso.
                        Qualquer alteração aqui será replicada para TODAS as clínicas neste plano.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Nome do Plano</Label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Ex: Plano Gold"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Slug (Identificador único)</Label>
                            <Input
                                value={formData.slug}
                                onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                                placeholder="Ex: gold-plan"
                                disabled={mode === 'edit'}
                                required
                            />
                        </div>
                    </div>

                    <div className="border rounded-lg p-4 space-y-4">
                        <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Módulos Principais</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <SwitchItem
                                label="Agenda Inteligente"
                                checked={!!formData.features.agenda_module}
                                onCheckedChange={c => handleFeatureChange('agenda_module', c)}
                            />
                            <SwitchItem
                                label="Prontuário Eletrônico"
                                checked={!!formData.features.records_module}
                                onCheckedChange={c => handleFeatureChange('records_module', c)}
                            />
                            <SwitchItem
                                label="Módulo Financeiro"
                                checked={!!formData.features.financial_module}
                                onCheckedChange={c => handleFeatureChange('financial_module', c)}
                            />
                            <SwitchItem
                                label="CRM & Marketing"
                                checked={!!formData.features.marketing_module}
                                onCheckedChange={c => handleFeatureChange('marketing_module', c)}
                            />
                        </div>
                    </div>

                    <div className="border rounded-lg p-4 space-y-4">
                        <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Recursos Avançados</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <SwitchItem
                                label="Assistente de IA"
                                checked={!!formData.features.ai_assistant}
                                onCheckedChange={c => handleFeatureChange('ai_assistant', c)}
                            />
                            <SwitchItem
                                label="Relatórios Avançados"
                                checked={!!formData.features.advanced_reports}
                                onCheckedChange={c => handleFeatureChange('advanced_reports', c)}
                            />
                            <SwitchItem
                                label="Integração WhatsApp"
                                checked={!!formData.features.whatsapp_integration}
                                onCheckedChange={c => handleFeatureChange('whatsapp_integration', c)}
                            />
                            <SwitchItem
                                label="Teleconsulta"
                                checked={!!formData.features.teleconsultation}
                                onCheckedChange={c => handleFeatureChange('teleconsultation', c)}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar Alterações
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function SwitchItem({ label, checked, onCheckedChange }: { label: string, checked: boolean, onCheckedChange: (c: boolean) => void }) {
    return (
        <div className="flex items-center justify-between space-x-2 border p-3 rounded-md">
            <Label className="flex-1 cursor-pointer" onClick={() => onCheckedChange(!checked)}>{label}</Label>
            <Switch checked={checked} onCheckedChange={onCheckedChange} />
        </div>
    )
}
