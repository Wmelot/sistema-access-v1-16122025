import { Button } from "@/components/ui/button"
import { CalendarCheck, CheckCircle2, AlertTriangle, Info, Lock, Loader2 } from "lucide-react"
import { useState } from "react"
import { generateUpcomingHolidays, toggleHolidayStatus } from "@/app/dashboard/settings/schedule/actions_holidays"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export function GenerateHolidaysButton() {
    const [loading, setLoading] = useState(false)
    const [showLog, setShowLog] = useState(false)
    const [generatedHolidays, setGeneratedHolidays] = useState<any[]>([])
    const [togglingId, setTogglingId] = useState<string | null>(null)

    const handleGenerate = async () => {
        setLoading(true)
        try {
            const res = await generateUpcomingHolidays()
            if (res.success) {
                toast.success("Feriados (Ano Atual e Próximo) atualizados com sucesso!")
                if (res.holidays) {
                    setGeneratedHolidays(res.holidays)
                    setShowLog(true)
                }
            }
        } catch (err) {
            console.error(err)
            toast.error("Erro ao gerar feriados.")
        } finally {
            setLoading(false)
        }
    }

    const handleToggle = async (holiday: any) => {
        if (togglingId) return
        setTogglingId(holiday.id)
        const newStatus = !holiday.is_mandatory

        try {
            const res = await toggleHolidayStatus(holiday.id, newStatus)
            if (res.success) {
                // Update local state
                setGeneratedHolidays(prev => prev.map(h =>
                    h.id === holiday.id ? { ...h, is_mandatory: newStatus } : h
                ))
                toast.success(newStatus ? "Feriado marcado como Obrigatório (Bloqueio Criado)" : "Feriado marcado como Facultativo (Bloqueio Removido)")
            }
        } catch (err) {
            console.error(err)
            toast.error("Erro ao atualizar status.")
        } finally {
            setTogglingId(null)
        }
    }

    return (
        <>
            <Button onClick={handleGenerate} disabled={loading} variant="outline" className="gap-2">
                <CalendarCheck className="h-4 w-4" />
                {loading ? "Processando..." : "Atualizar Feriados e Bloqueios"}
            </Button>

            <Dialog open={showLog} onOpenChange={setShowLog}>
                <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            Gestão de Feriados (Ano Atual + Próximo)
                        </DialogTitle>
                        <DialogDescription>
                            Lista de feriados verificados. Clique para alterar status.
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="flex-1 pr-4 mt-4">
                        <div className="space-y-4">
                            {generatedHolidays.sort((a, b) => a.date.localeCompare(b.date)).map((holiday, index) => (
                                <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-card text-card-foreground shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col items-center justify-center w-14 h-14 bg-muted rounded-md border text-center p-1">
                                            <span className="text-[10px] font-semibold text-muted-foreground uppercase leading-none mb-1">
                                                {format(new Date(holiday.date), 'MMM yyyy', { locale: ptBR })}
                                            </span>
                                            <span className="text-xl font-bold leading-none">
                                                {format(new Date(holiday.date), 'dd')}
                                            </span>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold">{holiday.name}</h4>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span className="capitalize">{holiday.type === 'city' ? 'Municipal (BH)' : holiday.type === 'national' ? 'Nacional' : 'Estadual'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant={holiday.is_mandatory ? "destructive" : "secondary"}
                                            className={`gap-1 cursor-pointer select-none transition-all ${togglingId === holiday.id ? 'opacity-50 pointer-events-none' : 'hover:scale-105 active:scale-95'} ${!holiday.is_mandatory ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' : ''}`}
                                            onClick={() => handleToggle(holiday)}
                                        >
                                            {togglingId === holiday.id ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : holiday.is_mandatory ? (
                                                <Lock className="h-3 w-3" />
                                            ) : (
                                                <Info className="h-3 w-3" />
                                            )}
                                            {holiday.is_mandatory ? "Bloqueio Obrigatório" : "Facultativo"}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>

                    <div className="flex justify-end gap-2 mt-4">
                        <Button onClick={() => setShowLog(false)}>Concluir</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
