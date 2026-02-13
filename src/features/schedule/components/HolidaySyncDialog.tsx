"use client"

import { Button } from "@/components/ui/button"
import { CalendarCheck, CheckCircle2, Lock, Loader2, Info, ArrowRight, RefreshCcw } from "lucide-react"
import { useState } from "react"
import { generateUpcomingHolidays, toggleHolidayStatus } from "@/app/dashboard/[slug]/settings/schedule/actions_holidays"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { parseBrazilDate, formatBrazilDate } from "@/lib/date-utils"
import { cn } from "@/lib/utils"

interface HolidaySyncDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function HolidaySyncDialog({ open, onOpenChange }: HolidaySyncDialogProps) {
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState<'initial' | 'list'>('initial')
    const [holidays, setHolidays] = useState<any[]>([])
    const [togglingId, setTogglingId] = useState<string | null>(null)

    const handleSync = async () => {
        setLoading(true)
        try {
            const res = await generateUpcomingHolidays()
            if (res.success && res.holidays) {
                setHolidays(res.holidays)
                setStep('list')
                toast.success("Feriados sincronizados!")
            }
        } catch (err) {
            console.error(err)
            toast.error("Erro ao sincronizar feriados.")
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
                setHolidays(prev => prev.map(h =>
                    h.id === holiday.id ? { ...h, is_mandatory: newStatus } : h
                ))
                toast.success(newStatus ? "Bloqueio criado" : "Bloqueio removido")
            }
        } catch (err) {
            toast.error("Erro ao atualizar status.")
        } finally {
            setTogglingId(null)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                        <CalendarCheck className="h-6 w-6 text-primary" />
                        Sincronizar Feriados
                    </DialogTitle>
                    <DialogDescription className="text-base">
                        Mantenha sua agenda organizada bloqueando feriados nacionais, estaduais e municipais.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 min-h-0 px-6 flex flex-col">
                    {step === 'initial' ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-6 text-center h-full">
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                                <CalendarCheck className="h-10 w-10 text-primary" />
                            </div>
                            <div className="space-y-2 max-w-sm">
                                <h3 className="text-lg font-bold">Verificar Calendário {new Date().getFullYear()}</h3>
                                <p className="text-sm text-muted-foreground">
                                    Vamos buscar feriados e emendas baseados no CEP da sua clínica. Você poderá escolher quais dias deseja bloquear.
                                </p>
                            </div>
                            <Button
                                onClick={handleSync}
                                disabled={loading}
                                size="lg"
                                className="w-full max-w-xs gap-2 font-bold shadow-lg shadow-primary/20"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Sincronizando...
                                    </>
                                ) : (
                                    <>
                                        Começar Sincronização
                                        <ArrowRight className="h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                    ) : (
                        <ScrollArea className="flex-1 pr-4">
                            <div className="space-y-3 py-4">
                                {holidays
                                    .sort((a, b) => a.date.localeCompare(b.date))
                                    .map((holiday) => (
                                        <div
                                            key={holiday.id}
                                            className={cn(
                                                "flex items-center justify-between p-4 border rounded-xl transition-all duration-200 group",
                                                holiday.is_mandatory ? "bg-red-50/50 border-red-100" : "bg-white hover:bg-slate-50 border-slate-200 shadow-sm"
                                            )}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "flex flex-col items-center justify-center w-14 h-14 rounded-lg border text-center p-1 shadow-inner",
                                                    holiday.is_mandatory ? "bg-red-100 border-red-200" : "bg-slate-50 border-slate-200"
                                                )}>
                                                    <span className="text-[10px] font-extrabold text-muted-foreground uppercase leading-none mb-1">
                                                        {formatBrazilDate(parseBrazilDate(holiday.date), 'MMM')}
                                                    </span>
                                                    <span className={cn(
                                                        "text-xl font-black leading-none",
                                                        holiday.is_mandatory ? "text-red-700" : "text-slate-700"
                                                    )}>
                                                        {formatBrazilDate(parseBrazilDate(holiday.date), 'dd')}
                                                    </span>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-800">{holiday.name}</h4>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-[10px] font-bold tracking-tight h-5 px-1.5 uppercase bg-white border-slate-200 text-slate-500">
                                                            {holiday.type === 'city' ? 'Municipal' :
                                                                holiday.type === 'state' ? 'Estadual' :
                                                                    holiday.type === 'bridge' ? 'Emenda / Ponte' : 'Nacional'}
                                                        </Badge>
                                                        {holiday.type === 'bridge' && (
                                                            <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                                                                Ponto Facultativo
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <Button
                                                variant={holiday.is_mandatory ? "destructive" : "outline"}
                                                size="sm"
                                                disabled={!!togglingId}
                                                className={cn(
                                                    "h-8 gap-2 font-bold text-xs transition-all",
                                                    !holiday.is_mandatory && "hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                                                )}
                                                onClick={() => handleToggle(holiday)}
                                            >
                                                {togglingId === holiday.id ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : holiday.is_mandatory ? (
                                                    <>
                                                        <Lock className="h-3.5 w-3.5" />
                                                        Bloqueado
                                                    </>
                                                ) : (
                                                    <>
                                                        <Info className="h-3.5 w-3.5" />
                                                        Bloquear
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>

                <DialogFooter className="p-6 pt-2 bg-slate-50/50 border-t mt-auto">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="font-semibold">
                        Fechar
                    </Button>
                    {step === 'list' && (
                        <Button
                            onClick={handleSync}
                            disabled={loading}
                            variant="secondary"
                            className="gap-2 font-bold"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                            Atualizar Lista
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

