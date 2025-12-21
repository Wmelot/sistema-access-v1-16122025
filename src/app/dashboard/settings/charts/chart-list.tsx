"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit2, Trash2, Loader2, PieChart } from "lucide-react"
import { useEffect, useState } from "react"
import { getCharts, deleteChart } from "./actions"
import { getMetrics } from "../metrics/actions"
import { ChartFormDialog } from "./chart-form-dialog"
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

export function ChartsList() {
    const [charts, setCharts] = useState<any[]>([])
    const [metrics, setMetrics] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingChart, setEditingChart] = useState<any>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const fetchData = async () => {
        setLoading(true)
        const [c, m] = await Promise.all([getCharts(), getMetrics()])
        setCharts(c || [])
        setMetrics(m || [])
        setLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleCreate = () => {
        setEditingChart(null)
        setIsDialogOpen(true)
    }

    const handleEdit = (chart: any) => {
        setEditingChart(chart)
        setIsDialogOpen(true)
    }

    const handleDelete = async () => {
        if (!deletingId) return
        const res = await deleteChart(deletingId)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success("Gráfico removido")
            fetchData()
        }
        setDeletingId(null)
    }

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
    }

    return (
        <div className="space-y-6 mt-12 pt-6 border-t">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Modelos de Gráfico</h3>
                    <p className="text-sm text-muted-foreground">
                        Crie modelos visuais (Radar, etc) agrupando as métricas definidas acima.
                    </p>
                </div>
                <Button variant="outline" onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Gráfico
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {charts.length === 0 ? (
                    <Card className="border-dashed col-span-full">
                        <CardHeader>
                            <CardTitle className="text-center">Nenhum gráfico definido</CardTitle>
                            <CardDescription className="text-center">
                                Agrupe suas métricas em um gráfico visual.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                ) : (
                    charts.map((chart) => (
                        <Card key={chart.id} className="hover:bg-muted/50 transition-colors border-l-4 border-l-primary/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <PieChart className="h-4 w-4 text-primary" />
                                    {chart.title}
                                </CardTitle>
                                <CardDescription>
                                    {chart.config?.axes?.length || 0} eixos
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(chart)}>
                                        <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeletingId(chart.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <ChartFormDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                chart={editingChart}
                metrics={metrics}
                onSave={fetchData}
            />

            <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita.
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
