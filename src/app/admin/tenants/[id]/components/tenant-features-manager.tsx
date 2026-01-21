'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button" // Assuming Button component exists
import { Building2, AlertTriangle, Loader2 } from "lucide-react"
import { updateTenantFeatures } from "../actions" // Import the server action
import { toast } from "sonner" // Assuming sonner is used for toasts

interface TenantFeaturesManagerProps {
    tenantId: string
    initialFeatures: Record<string, boolean | number>
    planName: string
}

const AVAILABLE_FEATURES = [
    { key: 'agenda_module', label: 'Agenda Inteligente' },
    { key: 'records_module', label: 'Prontuário Eletrônico' },
    { key: 'financial_module', label: 'Módulo Financeiro' },
    { key: 'marketing_module', label: 'CRM & Marketing' },
    { key: 'ai_assistant', label: 'Assistente de IA' },
    { key: 'advanced_reports', label: 'Relatórios Avançados' },
    { key: 'whatsapp_integration', label: 'Integração WhatsApp' },
    { key: 'teleconsultation', label: 'Teleconsulta' },
];

export function TenantFeaturesManager({ tenantId, initialFeatures, planName }: TenantFeaturesManagerProps) {
    const [features, setFeatures] = useState(initialFeatures || {})
    const [isEditing, setIsEditing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleToggle = (key: string, checked: boolean) => {
        setFeatures(prev => ({
            ...prev,
            [key]: checked
        }))
    }

    const handleSave = async () => {
        setIsLoading(true)
        try {
            const result = await updateTenantFeatures(tenantId, features)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Funcionalidades atualizadas com sucesso!")
                setIsEditing(false)
            }
        } catch (error) {
            toast.error("Erro ao salvar alterações")
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancel = () => {
        setFeatures(initialFeatures || {})
        setIsEditing(false)
    }

    return (
        <Card className="shadow-sm">
            <CardHeader className="border-b bg-zinc-50/50">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-zinc-500" />
                            Recursos Habilitados
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Baseado no plano <span className="font-medium text-zinc-900">{planName}</span>
                        </CardDescription>
                    </div>
                    {isEditing ? (
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isLoading}>
                                Cancelar
                            </Button>
                            <Button size="sm" onClick={handleSave} disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Salvar
                            </Button>
                        </div>
                    ) : (
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                            Editar Funcionalidades
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Iterate over AVAILABLE_FEATURES to allow enabling/disabling known features */}
                    {AVAILABLE_FEATURES.map((feature) => {
                        const isEnabled = !!features[feature.key];
                        const isOriginal = !!initialFeatures?.[feature.key];

                        if (!isEditing && !isEnabled) return null; // In view mode, only show enabled? Or show all disabled?
                        // User complained "sumiram listando todas". Typically "listing all" implies showing what is inactive too?
                        // "listando todas as funcionalidades do sistema para que eu possa escolher conceder mais algum benefício"
                        // So in EDIT mode show all. In VIEW mode... maybe show all with status?
                        // The user said "na tela da foto 2... listando todas...". The photo shows only "Recursos Habilitados".
                        // Use original card logic for VIEW mode? 

                        // Let's modify: Always show ALL available features, with status.

                        return (
                            <div key={feature.key} className={`
                                flex items-center justify-between p-3 rounded-lg border transition-all
                                ${isEnabled
                                    ? 'bg-white border-zinc-200 shadow-sm'
                                    : 'bg-zinc-50 border-transparent opacity-60'}
                            `}>
                                <span className="text-sm font-medium capitalize text-zinc-700">
                                    {feature.label}
                                </span>
                                {isEditing ? (
                                    <Switch
                                        checked={isEnabled}
                                        onCheckedChange={(c) => handleToggle(feature.key, c)}
                                    />
                                ) : (
                                    isEnabled ? (
                                        <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                                    ) : (
                                        <div className="h-2 w-2 rounded-full bg-zinc-300" />
                                    )
                                )}
                            </div>
                        )
                    })}

                    {/* Show unknown features if any exist in DB but not in our list */}
                    {Object.entries(features).map(([key, value]) => {
                        if (AVAILABLE_FEATURES.some(f => f.key === key)) return null;
                        if (!value && !isEditing) return null; // Skip false unknown traits in view

                        return (
                            <div key={key} className="flex items-center justify-between p-3 rounded-lg border bg-amber-50 border-amber-200">
                                <span className="text-sm font-medium capitalize text-amber-900">
                                    {key.replace(/_/g, ' ')} (Custom)
                                </span>
                                {isEditing ? (
                                    <Switch
                                        checked={!!value}
                                        onCheckedChange={(c) => handleToggle(key, c)}
                                    />
                                ) : (
                                    <Badge variant="outline" className="border-amber-300 text-amber-700">Extra</Badge>
                                )}
                            </div>
                        )
                    })}

                    {(!features || Object.keys(features).length === 0) && !isEditing && (
                        <div className="col-span-2 py-8 flex flex-col items-center justify-center text-zinc-400 bg-zinc-50 rounded-lg border border-dashed">
                            <AlertTriangle className="h-8 w-8 opacity-50 mb-2" />
                            <p className="text-sm">Nenhuma funcionalidade configurada explicitamente.</p>
                        </div>
                    )}
                </div>
            </CardContent>
            {isEditing && (
                <CardFooter className="bg-zinc-50/50 border-t py-3 text-xs text-zinc-500">
                    <p>Qualquer alteração aqui afeta imediatamente o acesso desta clínica.</p>
                </CardFooter>
            )}
        </Card>
    )
}
