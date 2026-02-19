'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { createPlan, updatePlan, PlanConfig } from "./actions"
import { Edit2, Plus, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { PlanGranularAccessManager } from "./components/plan-granular-access-manager"

const MySwal = withReactContent(Swal);

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
    zapi_messaging: false,
    protocol_management: false,
    form_management: false,
    custom_forms: 1
}

export function PlanEditor({ mode, plan }: PlanEditorProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const [formData, setFormData] = useState({
        name: plan?.name || '',
        slug: plan?.slug || '',
        max_professionals: (plan as any)?.max_professionals || 1,
        max_patients: (plan as any)?.max_patients || 100,
        price_monthly: (plan as any)?.price_monthly || 0,
        price_yearly: (plan as any)?.price_yearly || 0,
        features: {
            ...(DEFAULT_FEATURES as any),
            ...((plan as any)?.features || {}),
            allowed_forms: Array.isArray((plan as any)?.features?.allowed_forms) ? (plan as any).features.allowed_forms : [],
            allowed_protocols: Array.isArray((plan as any)?.features?.allowed_protocols) ? (plan as any).features.allowed_protocols : [],
            allowed_messages: Array.isArray((plan as any)?.features?.allowed_messages) ? (plan as any).features.allowed_messages : []
        },
        is_active: plan?.is_active ?? true
    })

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/--+/g, "-")
            .trim();
    }

    const handleNameChange = (name: string) => {
        setFormData(prev => {
            const newSlug = mode === 'create' ? generateSlug(name) : prev.slug;
            return {
                ...prev,
                name,
                slug: newSlug
            }
        })
    }

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
            MySwal.fire({
                icon: 'error',
                title: 'Erro!',
                text: 'Não foi possível salvar o plano. Tente novamente.',
                confirmButtonColor: '#4f46e5'
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {mode === 'create' ? (
                    <Button className="w-full sm:w-auto">
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
            <DialogContent className="w-[calc(100vw-2rem)] md:max-w-[calc(100vw-350px)] h-[calc(100vh-4rem)] flex flex-col p-4 md:p-6 overflow-hidden">
                <DialogHeader className="shrink-0 mb-4">
                    <DialogTitle>{mode === 'create' ? 'Criar Novo Plano' : `Editar ${plan?.name}`}</DialogTitle>
                    <DialogDescription>
                        Configure quais módulos e recursos este plano terá acesso.
                        Qualquer alteração aqui será replicada para TODAS as clínicas neste plano.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex-1 p-1 space-y-6 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Nome do Plano</Label>
                            <Input
                                value={formData.name}
                                onChange={e => handleNameChange(e.target.value)}
                                placeholder="Ex: Plano Gold"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                Slug (ID do Plano)
                                <span className="text-[10px] text-zinc-400 font-normal">(Uso interno do sistema)</span>
                            </Label>
                            <Input
                                value={formData.slug}
                                onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                                placeholder="Ex: gold-plan"
                                disabled={mode === 'edit'}
                                required
                            />
                            <p className="text-[10px] text-zinc-500">Ex: gold, pro, enterprise. Não mude o link da clínica.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Limite de Profissionais</Label>
                            <Input
                                type="number"
                                value={formData.max_professionals}
                                onChange={e => setFormData(prev => ({ ...prev, max_professionals: parseInt(e.target.value) }))}
                            />
                            <p className="text-[10px] text-zinc-500">Dica: Use <strong>0</strong> para Ilimitado.</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Limite de Pacientes</Label>
                            <Input
                                type="number"
                                value={formData.max_patients}
                                onChange={e => setFormData(prev => ({ ...prev, max_patients: parseInt(e.target.value) }))}
                            />
                            <p className="text-[10px] text-zinc-500">Dica: Use <strong>0</strong> para Ilimitado.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Preço Mensal (R$)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.price_monthly}
                                onChange={e => setFormData(prev => ({ ...prev, price_monthly: parseFloat(e.target.value) }))}
                                placeholder="0.00"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Preço Anual (R$)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.price_yearly}
                                onChange={e => setFormData(prev => ({ ...prev, price_yearly: parseFloat(e.target.value) }))}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="border rounded-lg p-4 space-y-4 bg-zinc-50/50">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-xs text-zinc-500 uppercase tracking-wider">Módulos Principais</h3>
                            <Badge variant="outline" className="text-[10px]">Acesso Base</Badge>
                        </div>
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

                    <div className="border rounded-lg p-4 space-y-4 bg-zinc-50/50">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-xs text-zinc-500 uppercase tracking-wider">Recursos Avançados</h3>
                            <Badge variant="outline" className="text-[10px]">Add-ons</Badge>
                        </div>
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
                            <SwitchItem
                                label="Mensageria ZAPI"
                                checked={!!formData.features.zapi_messaging}
                                onCheckedChange={c => handleFeatureChange('zapi_messaging', c)}
                            />
                            <SwitchItem
                                label="Gestão de Protocolos"
                                checked={!!formData.features.protocol_management}
                                onCheckedChange={c => handleFeatureChange('protocol_management', c)}
                            />
                            <SwitchItem
                                label="Gestão de Formulários"
                                checked={!!formData.features.form_management}
                                onCheckedChange={c => handleFeatureChange('form_management', c)}
                            />
                        </div>
                    </div>

                    <div className="mt-8 border rounded-lg p-0 bg-zinc-50/50 overflow-hidden">
                        <PlanGranularAccessManager
                            allowedForms={formData.features.allowed_forms}
                            allowedProtocols={formData.features.allowed_protocols}
                            allowedMessages={formData.features.allowed_messages}
                            onChange={(type, newValues) => {
                                setFormData(prev => ({
                                    ...prev,
                                    features: {
                                        ...prev.features,
                                        [`allowed_${type === 'forms' ? 'forms' : type === 'protocols' ? 'protocols' : 'messages'}`]: newValues
                                    }
                                }))
                            }}
                        />
                    </div>

                    <div className="flex justify-end gap-2 sticky -bottom-2 bg-white pt-4 pb-4 border-t mt-6 -mx-2 px-2 z-10">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {mode === 'create' ? 'Criar Plano' : 'Salvar Alterações'}
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
