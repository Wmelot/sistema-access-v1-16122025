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
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { saveChart } from "./actions"
import { Loader2, Plus, Trash2 } from "lucide-react"

interface ChartFormDialogProps {
    chart?: any
    metrics: any[]
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: () => void
}

export function ChartFormDialog({ chart, metrics, open, onOpenChange, onSave }: ChartFormDialogProps) {
    const [title, setTitle] = useState("")
    const [axes, setAxes] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (chart) {
            setTitle(chart.title)
            setAxes(chart.config?.axes || [])
        } else {
            setTitle("")
            setAxes([])
        }
    }, [chart, open])

    const handleAddAxis = () => {
        setAxes([...axes, { metric_id: "", label: "" }])
    }

    const handleRemoveAxis = (index: number) => {
        const newAxes = [...axes]
        newAxes.splice(index, 1)
        setAxes(newAxes)
    }

    const handleAxisChange = (index: number, key: string, value: any) => {
        const newAxes = [...axes]
        newAxes[index] = { ...newAxes[index], [key]: value }

        // Auto-fill label if selecting a metric and label is empty
        if (key === 'metric_id' && !newAxes[index].label) {
            const selectedMetric = metrics.find(m => m.id === value)
            if (selectedMetric) {
                newAxes[index].label = selectedMetric.title
            }
        }

        setAxes(newAxes)
    }

    const handleSave = async () => {
        if (!title.trim()) {
            toast.error("O título é obrigatório")
            return
        }

        if (axes.length < 3) {
            toast.error("Adicione pelo menos 3 eixos para um gráfico de radar")
            return
        }

        // Validate axes
        for (const axis of axes) {
            if (!axis.metric_id) {
                toast.error("Selecione uma métrica para todos os eixos")
                return
            }
        }

        setLoading(true)
        const payload = {
            id: chart?.id,
            title,
            type: 'radar',
            config: {
                axes
            }
        }

        const result = await saveChart(payload)
        setLoading(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success("Gráfico salvo com sucesso!")
            onOpenChange(false)
            onSave()
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{chart ? "Editar Gráfico" : "Novo Gráfico Radar"}</DialogTitle>
                    <DialogDescription>
                        Configure os eixos do seu gráfico selecionando as métricas criadas anteriormente.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="chart-title">Título do Gráfico</Label>
                        <Input
                            id="chart-title"
                            placeholder="Ex: Radar de Evolução Física"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Eixos do Radar (Mínimo 3)</Label>
                            <Button variant="outline" size="sm" onClick={handleAddAxis}>
                                <Plus className="w-4 h-4 mr-2" /> Adicionar Eixo
                            </Button>
                        </div>

                        <div className="space-y-2 border rounded-md p-2 bg-muted/20 min-h-[100px]">
                            {axes.length === 0 && (
                                <p className="text-sm text-center text-muted-foreground py-8">
                                    Nenhum eixo adicionado.
                                </p>
                            )}
                            {axes.map((axis, index) => (
                                <div key={index} className="flex gap-2 items-end bg-background p-2 rounded-md border shadow-sm">
                                    <div className="flex-1 space-y-1">
                                        <Label className="text-xs">Métrica Calculada</Label>
                                        <Select
                                            value={axis.metric_id}
                                            onValueChange={(val) => handleAxisChange(index, 'metric_id', val)}
                                        >
                                            <SelectTrigger className="h-8">
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {metrics.map(metric => (
                                                    <SelectItem key={metric.id} value={metric.id}>
                                                        {metric.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex-1 space-y-1">
                                        <Label className="text-xs">Rótulo no Gráfico</Label>
                                        <Input
                                            value={axis.label}
                                            onChange={(e) => handleAxisChange(index, 'label', e.target.value)}
                                            className="h-8"
                                            placeholder="Ex: Força"
                                        />
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                        onClick={() => handleRemoveAxis(index)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Salvar Gráfico
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
