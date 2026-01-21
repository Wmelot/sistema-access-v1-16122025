"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { saveMetric } from "./actions"
import { Loader2, Plus, Trash2 } from "lucide-react"

interface MetricFormDialogProps {
    metric?: any
    formTemplates: any[]
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: () => void
}

export function MetricFormDialog({ metric, formTemplates, open, onOpenChange, onSave }: MetricFormDialogProps) {
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [sources, setSources] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (metric) {
            setTitle(metric.title)
            setDescription(metric.description || "")
            setSources(metric.calculation_rule?.sources || [])
        } else {
            setTitle("")
            setDescription("")
            setSources([])
        }
    }, [metric, open])

    const handleAddSource = () => {
        setSources([...sources, { formId: "", fieldId: "", weight: 1 }])
    }

    const handleRemoveSource = (index: number) => {
        const newSources = [...sources]
        newSources.splice(index, 1)
        setSources(newSources)
    }

    const handleSourceChange = (index: number, key: string, value: any) => {
        const newSources = [...sources]
        newSources[index] = { ...newSources[index], [key]: value }
        setSources(newSources)
    }

    const handleSave = async () => {
        if (!title.trim()) {
            toast.error("O título é obrigatório")
            return
        }

        if (sources.length === 0) {
            toast.error("Adicione pelo menos uma fonte de dados")
            return
        }

        // Validate sources
        for (const source of sources) {
            if (!source.formId || !source.fieldId) {
                toast.error("Preencha todos os campos das fontes de dados")
                return
            }
        }

        setLoading(true)
        const payload = {
            id: metric?.id,
            title,
            description,
            calculation_rule: {
                type: 'average', // For now, we only support average
                sources
            }
        }

        const result = await saveMetric(payload)
        setLoading(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success("Métrica salva com sucesso!")
            onOpenChange(false)
            onSave()
        }
    }

    // Helper to get fields for a selected form
    const getFieldsForForm = (formId: string) => {
        const form = formTemplates.find(f => f.id === formId)
        if (!form) return []
        // Filter only numeric fields (number, slider, radio_group with numeric values could be supported later)
        // For now, let's allow number and slider
        return (form.fields || []).filter((f: any) => ['number', 'slider'].includes(f.type))
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{metric ? "Editar Métrica" : "Nova Métrica"}</DialogTitle>
                    <DialogDescription>
                        Defina como este índice será calculado a partir dos formulários.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Título do Índice</Label>
                            <Input
                                id="title"
                                placeholder="Ex: Mobilidade Física"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="desc">Descrição (Opccional)</Label>
                            <Input
                                id="desc"
                                placeholder="Breve explicação..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Fontes de Dados (Campos para Média)</Label>
                            <Button variant="outline" size="sm" onClick={handleAddSource}>
                                <Plus className="w-4 h-4 mr-2" /> Adicionar Campo
                            </Button>
                        </div>

                        <div className="space-y-2 border rounded-md p-2 bg-muted/20 min-h-[100px]">
                            {sources.length === 0 && (
                                <p className="text-sm text-center text-muted-foreground py-8">
                                    Nenhuma fonte adicionada.
                                </p>
                            )}
                            {sources.map((source, index) => (
                                <div key={index} className="flex gap-2 items-end bg-background p-2 rounded-md border shadow-sm">
                                    <div className="flex-1 space-y-1">
                                        <Label className="text-xs">Formulário</Label>
                                        <Select
                                            value={source.formId}
                                            onValueChange={(val) => handleSourceChange(index, 'formId', val)}
                                        >
                                            <SelectTrigger className="h-8">
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {formTemplates.map(form => (
                                                    <SelectItem key={form.id} value={form.id}>
                                                        {form.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex-1 space-y-1">
                                        <Label className="text-xs">Campo (Numérico)</Label>
                                        <Select
                                            value={source.fieldId}
                                            onValueChange={(val) => handleSourceChange(index, 'fieldId', val)}
                                            disabled={!source.formId}
                                        >
                                            <SelectTrigger className="h-8">
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {getFieldsForForm(source.formId).map((field: any) => (
                                                    <SelectItem key={field.id} value={field.id}>
                                                        {field.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                        onClick={() => handleRemoveSource(index)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            * O sistema calculará a média simples dos valores preenchidos nestes campos.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Salvar Métrica
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
