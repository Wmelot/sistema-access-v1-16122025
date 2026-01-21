"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Calculator, Edit2, Trash2, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { getMetrics, getFormTemplates, deleteMetric } from "./actions"
import { MetricFormDialog } from "./metric-form-dialog"
import { toast } from "sonner"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function MetricsList() {
    const [metrics, setMetrics] = useState<any[]>([])
    const [formTemplates, setFormTemplates] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingMetric, setEditingMetric] = useState<any>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const fetchData = async () => {
        setLoading(true)
        const [m, f] = await Promise.all([getMetrics(), getFormTemplates()])
        setMetrics(m || [])
        setFormTemplates(f || [])
        setLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleCreate = () => {
        setEditingMetric(null)
        setIsDialogOpen(true)
    }

    const handleEdit = (metric: any) => {
        setEditingMetric(metric)
        setIsDialogOpen(true)
    }

    const handleDelete = async () => {
        if (!deletingId) return
        const res = await deleteMetric(deletingId)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success("Métrica removida")
            fetchData()
        }
        setDeletingId(null)
    }

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Métricas Calculadas</h3>
                    <p className="text-sm text-muted-foreground">
                        Defina fórmulas para calcular índices (ex: Dor, Função) a partir de respostas dos formulários.
                    </p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Métrica
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {metrics.length === 0 ? (
                    <Card className="border-dashed col-span-full">
                        <CardHeader>
                            <CardTitle className="text-center">Nenhuma métrica definida</CardTitle>
                            <CardDescription className="text-center">
                                Crie métricas para transformar respostas de formulários em valores numéricos (0-10) para gráficos.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                ) : (
                    metrics.map((metric) => (
                        <Card key={metric.id} className="hover:bg-muted/50 transition-colors">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Calculator className="h-4 w-4 text-primary" />
                                    {metric.title}
                                </CardTitle>
                                <CardDescription>
                                    {metric.calculation_rule?.sources?.length || 0} fontes de dados
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(metric)}>
                                        <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeletingId(metric.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <MetricFormDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                metric={editingMetric}
                formTemplates={formTemplates}
                onSave={fetchData}
            />

            <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso removerá a métrica e pode afetar gráficos que a utilizam.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
