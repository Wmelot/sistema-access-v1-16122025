'use client'

import React, { useState } from 'react'
import { format, addDays, isPast, isFuture } from 'date-fns'
import { useParams } from 'next/navigation'
import { ptBR } from 'date-fns/locale'
import { Calendar as CalendarIcon, CheckCircle2, AlertCircle, Clock, XCircle, Plus, Footprints, Zap } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

import { registerInsoleDelivery, cancelFollowUp } from '@/app/dashboard/[slug]/patients/actions/insoles'
import { EmptyState } from '@/components/ui/empty-state'



interface AssessmentFollowUp {
    id: string
    type: 'insoles_40d' | 'insoles_1y'
    scheduled_date: string
    status: 'pending' | 'sent' | 'completed' | 'cancelled' | 'alert'
    delivery_date: string
    response_data?: any
}

interface InsolesTabProps {
    patientId: string
    followUps: AssessmentFollowUp[]
    assessments?: any[]
}

export function InsolesTab({ patientId, followUps, assessments = [] }: InsolesTabProps) {
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const params = useParams()
    const slug = params?.slug as string



    const handleRegister = async () => {
        // ... (rest of function) ...

        if (!date) return

        setIsSubmitting(true)
        try {
            const res = await registerInsoleDelivery(patientId, date, slug)
            if (res.success) {
                toast.success('Entrega registrada com sucesso!')
                setIsDialogOpen(false)
            } else {
                toast.error(res.message)
            }
        } catch (error) {
            toast.error('Erro ao registrar entrega.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCancel = async (id: string) => {
        try {
            const res = await cancelFollowUp(id, patientId, slug)
            if (res.success) {
                toast.success('Agendamento cancelado.')
            } else {
                toast.error('Erro ao cancelar.')
            }
        } catch (error) {
            toast.error('Erro na operação.')
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">Agendado</Badge>
            case 'sent': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Enviado</Badge>
            case 'completed': return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Respondido</Badge>
            case 'alert': return <Badge variant="destructive">Alerta / Atenção</Badge>
            case 'cancelled': return <Badge variant="outline" className="text-muted-foreground">Cancelado</Badge>
            default: return <Badge variant="outline">{status}</Badge>
        }
    }

    const getTitle = (type: string, isBackup?: boolean) => {
        if (isBackup) return 'Entrega de Palmilha (Backup)'
        return type === 'insoles_40d' ? 'Acompanhamento de 40 Dias' : 'Manutenção de 1 Ano'
    }

    // Group items by delivery date roughly (heuristic) or just list them sorted
    // For simplicity, just listing them.

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Histórico de Palmilhas</h3>
                    <p className="text-sm text-muted-foreground">Gerencie entregas e acompanhamentos automáticos.</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Registrar Entrega
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Registrar Nova Palmilha</DialogTitle>
                            <DialogDescription>
                                Informe a data de entrega. O sistema agendará automaticamente os feedbacks de 40 dias e 1 ano.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <label className="text-sm font-medium mb-2 block">Data da Entrega</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? format(date, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={setDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                            <Button onClick={handleRegister} disabled={!date || isSubmitting}>
                                {isSubmitting ? 'Registrando...' : 'Confirmar Entrega'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {followUps.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                    {followUps.map((item) => (
                        <Card key={item.id} className={cn(
                            "transition-all",
                            item.status === 'alert' ? "border-red-500 bg-red-50" : "hover:bg-slate-50"
                        )}>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <Footprints className="h-5 w-5 text-primary" />
                                        <div>
                                            <CardTitle className="text-base">{getTitle(item.type, item.response_data?.is_backup)}</CardTitle>
                                            <CardDescription>
                                                Entrega: {format(new Date(item.delivery_date), "dd/MM/yyyy")}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    {getStatusBadge(item.status)}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <span>
                                            Programado para: <strong>{format(new Date(item.scheduled_date), "dd 'de' MMMM, yyyy", { locale: ptBR })}</strong>
                                        </span>
                                    </div>

                                    {item.status === 'completed' && item.response_data && (
                                        <div className="bg-white p-3 rounded border text-sm mt-2">
                                            {item.response_data.is_backup ? (
                                                <div className="space-y-1">
                                                    <p className="font-bold text-slate-700 italic">Registro de Histórico (Backup)</p>
                                                    <p className="text-slate-600">{item.response_data.observation}</p>
                                                    {item.response_data.original_service && (
                                                        <Badge variant="outline" className="text-[10px] mt-2">
                                                            Serviço: {item.response_data.original_service}
                                                        </Badge>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <p className="font-semibold text-slate-900 border-b pb-1 flex-1">Resultados da Avaliação</p>
                                                    </div>

                                                    {/* Decision Tree / Clinical Alerts */}
                                                    {item.type === 'insoles_40d' && (
                                                        <div className={cn(
                                                            "p-3 rounded-lg border flex flex-col gap-2",
                                                            item.response_data.calculateScore?.alert ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100"
                                                        )}>
                                                            <div className="flex items-center gap-2">
                                                                {item.response_data.calculateScore?.alert ? (
                                                                    <AlertCircle className="h-4 w-4 text-red-600" />
                                                                ) : (
                                                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                                )}
                                                                <span className={cn(
                                                                    "font-bold uppercase text-[10px] tracking-widest",
                                                                    item.response_data.calculateScore?.alert ? "text-red-700" : "text-green-700"
                                                                )}>
                                                                    Decisão Clínica
                                                                </span>
                                                            </div>
                                                            <p className="text-xs">
                                                                {item.response_data.calculateScore?.alert
                                                                    ? "Paciente relata desconforto ou falta de ajuste. Recomenda-se AGENDAR REVISÃO PRESENCIAL para ajustes finos."
                                                                    : "Adaptação dentro da normalidade. Manter acompanhamento regular."}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {item.type === 'insoles_1y' && (
                                                        <div className={cn(
                                                            "p-3 rounded-lg border flex flex-col gap-2",
                                                            item.response_data.calculateScore?.alert ? "bg-indigo-50 border-indigo-100" : "bg-green-50 border-green-100"
                                                        )}>
                                                            <div className="flex items-center gap-2">
                                                                {item.response_data.calculateScore?.alert ? (
                                                                    <Zap className="h-4 w-4 text-indigo-600" />
                                                                ) : (
                                                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                                )}
                                                                <span className={cn(
                                                                    "font-bold uppercase text-[10px] tracking-widest",
                                                                    item.response_data.calculateScore?.alert ? "text-indigo-700" : "text-green-700"
                                                                )}>
                                                                    Insight de Manutenção
                                                                </span>
                                                            </div>
                                                            <p className="text-xs">
                                                                {item.response_data.calculateScore?.alert
                                                                    ? "Palmilha com sinais de desgaste ou paciente interessado em renovação. OPORTUNIDADE DE UPSELL / RENOVAÇÃO."
                                                                    : "Palmilha em bom estado. Manter acompanhamento."}
                                                            </p>
                                                        </div>
                                                    )}

                                                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                                                        <div className="bg-slate-50 p-2 rounded">
                                                            <span className="text-slate-500 block mb-0.5">Nota Média</span>
                                                            <span className="font-bold text-slate-800">{item.response_data.calculateScore?.average || item.response_data.calculateScore?.score}</span>
                                                        </div>
                                                        <div className="bg-slate-50 p-2 rounded">
                                                            <span className="text-slate-500 block mb-0.5">Status</span>
                                                            <span className={cn(
                                                                "font-bold",
                                                                item.response_data.calculateScore?.riskColor === 'red' ? 'text-red-600' :
                                                                    item.response_data.calculateScore?.riskColor === 'blue' ? 'text-indigo-600' : 'text-green-600'
                                                            )}>
                                                                {item.response_data.calculateScore?.classification}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {item.status === 'pending' && (
                                        <div className="flex justify-end mt-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8"
                                                onClick={() => handleCancel(item.id)}
                                            >
                                                Cancelar Envio
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon={Footprints}
                    title="Nenhuma palmilha registrada"
                    description="Registre a data de entrega da palmilha para ativar o monitoramento automático."
                    action={
                        <Button onClick={() => setIsDialogOpen(true)} variant="outline">
                            Registrar Primeira Entrega
                        </Button>
                    }
                />
            )}


        </div>
    )
}

