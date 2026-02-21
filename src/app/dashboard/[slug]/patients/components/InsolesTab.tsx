'use client'

import React, { useState } from 'react'
import { format, addDays, isPast, isFuture } from 'date-fns'
import { useParams } from 'next/navigation'
import { ptBR } from 'date-fns/locale'
import { Calendar as CalendarIcon, CheckCircle2, AlertCircle, Clock, XCircle, Plus, Footprints, Zap, MessageCircle, Send, FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { registerInsoleDelivery, cancelFollowUp, triggerInsoleMaintenance } from '@/app/dashboard/[slug]/patients/actions/insoles'
import { updateAssessmentPropulsaoOrder } from '@/app/dashboard/[slug]/patients/actions/assessments'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
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
    const [isMaintenanceDialogOpen, setIsMaintenanceDialogOpen] = useState(false)
    const [maintenanceDate, setMaintenanceDate] = useState<Date | undefined>(new Date())
    const [maintenanceType, setMaintenanceType] = useState<'insoles_1y' | 'insoles_40d'>('insoles_1y')
    const [isSendingMaintenance, setIsSendingMaintenance] = useState(false)

    // New delivery state
    const [deliveryNote, setDeliveryNote] = useState('')
    const [registrationType, setRegistrationType] = useState<'delivery' | 'adjustment'>('delivery')
    const handleRegister = async () => {
        if (!date) return

        setIsSubmitting(true)
        try {
            const res = await registerInsoleDelivery(
                patientId,
                date,
                slug,
                deliveryNote,
                registrationType === 'adjustment'
            )
            if (res.success) {
                toast.success(registrationType === 'adjustment' ? 'Ajuste registrado!' : 'Entrega registrada!')
                setIsDialogOpen(false)
                setDeliveryNote('')
            } else {
                toast.error(res.message)
            }
        } catch (error) {
            toast.error('Erro na operação.')
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

    const handleTriggerMaintenance = async (sendNow: boolean = false) => {
        setIsSendingMaintenance(true)
        try {
            const targetDate = sendNow ? new Date(Date.now() - 1000 * 60) : (maintenanceDate || new Date())
            const res = await triggerInsoleMaintenance({
                patientId,
                scheduledDate: targetDate,
                type: maintenanceType,
                slug
            })

            if (res.success) {
                toast.success(sendNow ? 'Mensagem disparada com sucesso!' : 'Agendamento realizado!')
                setIsMaintenanceDialogOpen(false)
            } else {
                toast.error(res.message)
            }
        } catch (error) {
            toast.error('Erro na operação.')
        } finally {
            setIsSendingMaintenance(false)
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-medium">Histórico de Palmilhas</h3>
                    <p className="text-sm text-muted-foreground">Gerencie entregas e acompanhamentos automáticos.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Dialog open={isMaintenanceDialogOpen} onOpenChange={setIsMaintenanceDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="gap-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 w-full sm:w-auto justify-start sm:justify-center">
                                <MessageCircle className="h-4 w-4" />
                                Enviar Manutenção
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Enviar Mensagem de Manutenção</DialogTitle>
                                <DialogDescription>
                                    Envie o acompanhamento técnico de 1 ano ou 40 dias para este paciente.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Tipo de Mensagem</label>
                                    <Select value={maintenanceType} onValueChange={(v: any) => setMaintenanceType(v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="insoles_1y">Manutenção de 1 Ano</SelectItem>
                                            <SelectItem value="insoles_40d">Acompanhamento 40 Dias</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-2 block">Data de Envio</label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !maintenanceDate && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {maintenanceDate ? format(maintenanceDate, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={maintenanceDate}
                                                onSelect={setMaintenanceDate}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                            <DialogFooter className="flex flex-col sm:flex-row gap-2">
                                <Button
                                    variant="secondary"
                                    className="gap-2 sm:order-2"
                                    onClick={() => handleTriggerMaintenance(false)}
                                    disabled={isSendingMaintenance}
                                >
                                    <Clock className="h-4 w-4" />
                                    Agendar
                                </Button>
                                <Button
                                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 sm:order-1"
                                    onClick={() => handleTriggerMaintenance(true)}
                                    disabled={isSendingMaintenance}
                                >
                                    <Send className="h-4 w-4" />
                                    Enviar Agora
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 w-full sm:w-auto justify-start sm:justify-center">
                                <Plus className="h-4 w-4" />
                                Registrar Entrega
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Registrar {registrationType === 'adjustment' ? 'Ajuste' : 'Entrega'} de Palmilha</DialogTitle>
                                <DialogDescription>
                                    Informe os detalhes da {registrationType === 'adjustment' ? 'ação' : 'entrega'}. {registrationType === 'delivery' && "O sistema agendará automaticamente os feedbacks de 40 dias e 1 ano."}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase text-slate-500">Tipo de Registro</Label>
                                        <Select value={registrationType} onValueChange={(v: any) => setRegistrationType(v)}>
                                            <SelectTrigger className="h-10">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="delivery">Primeira Entrega</SelectItem>
                                                <SelectItem value="adjustment">Ajuste / Revisão</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase text-slate-500">Data</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal h-10",
                                                        !date && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {date ? format(date, "dd/MM/yyyy") : <span>Selecione</span>}
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
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase text-slate-500">Notas Clínicas (Evolução)</Label>
                                    <Textarea
                                        placeholder="Descreva detalhes da entrega ou ajuste para o prontuário..."
                                        value={deliveryNote}
                                        onChange={(e) => setDeliveryNote(e.target.value)}
                                        className="min-h-[100px]"
                                    />
                                    <p className="text-[10px] text-muted-foreground italic">* Este texto será salvo como uma nova evolução no prontuário.</p>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                                <Button onClick={handleRegister} disabled={!date || isSubmitting} className="bg-primary">
                                    {isSubmitting ? 'Salvando...' : 'Confirmar Registro'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="space-y-6">
                {/* Prescription History Section */}
                {assessments.filter(a => a.type === 'insoles_prescription').length > 0 && (
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                            <FileText className="h-4 w-4" /> Histórico de Prescrições
                        </h4>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {assessments
                                .filter(a => a.type === 'insoles_prescription')
                                .map((prescription) => (
                                    <Dialog key={prescription.id}>
                                        <DialogTrigger asChild>
                                            <Card className="bg-white hover:shadow-md transition-shadow border-slate-200 cursor-pointer hover:border-emerald-300">
                                                <CardHeader className="p-4 pb-2">
                                                    <div className="flex justify-between items-start">
                                                        <div className="p-2 bg-blue-50 rounded-lg">
                                                            <Footprints className="h-4 w-4 text-blue-600" />
                                                        </div>
                                                        {prescription.data?.propulsaoOrder && (
                                                            <Badge variant="outline" className="text-[10px] font-mono bg-blue-50 text-blue-700 border-blue-200">
                                                                #{prescription.data.propulsaoOrder}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="p-4 pt-0">
                                                    <div className="space-y-1">
                                                        <p className="font-bold text-slate-900 line-clamp-1">
                                                            {prescription.data?.produto || 'Palmilha'} - {prescription.data?.tipoPalmilha || prescription.data?.type || '3D'}
                                                        </p>
                                                        <p className="text-[11px] text-slate-500">
                                                            Criado em: {format(new Date(prescription.created_at), "dd/MM/yyyy")}
                                                        </p>
                                                    </div>
                                                    <div className="mt-4 flex flex-wrap gap-1.5">
                                                        <Badge variant="secondary" className="text-[9px] uppercase px-1.5 py-0 bg-slate-100">{prescription.data?.cobertura || 'EVA'}</Badge>
                                                        <Badge variant="secondary" className="text-[9px] uppercase px-1.5 py-0 bg-slate-100">Tam: {prescription.data?.tamanho || '-'}</Badge>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[700px] h-[85vh] overflow-y-auto p-0 border-emerald-200">
                                            <div className="p-6 pb-4 border-b sticky top-0 bg-white z-10 flex flex-col gap-2 shadow-sm">
                                                <DialogTitle className="text-xl flex items-center justify-between text-emerald-900">
                                                    <span className="flex items-center gap-2">
                                                        <Footprints className="w-5 h-5 text-emerald-600" />
                                                        Detalhes da Prescrição
                                                    </span>
                                                    {prescription.data?.propulsaoOrder && (
                                                        <Badge variant="outline" className="text-sm font-mono bg-blue-50 text-blue-700 border-blue-200">
                                                            OS: #{prescription.data.propulsaoOrder}
                                                        </Badge>
                                                    )}
                                                </DialogTitle>
                                                <DialogDescription className="text-xs">
                                                    Prescrito em: {format(new Date(prescription.created_at), "dd 'de' MMMM, yyyy 'às' HH:mm", { locale: ptBR })}
                                                </DialogDescription>
                                            </div>

                                            <div className="p-6 space-y-6">
                                                {/* Detalhes Basicos */}
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                    <div className="space-y-1">
                                                        <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Modelo</p>
                                                        <p className="font-semibold text-slate-900">{prescription.data?.produto || '-'}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Tipo</p>
                                                        <p className="font-semibold text-slate-900">{prescription.data?.tipoPalmilha || prescription.data?.type || '-'}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Tamanho</p>
                                                        <p className="font-semibold text-slate-900">{prescription.data?.tamanho || '-'}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Cobertura</p>
                                                        <p className="font-semibold text-slate-900">{prescription.data?.cobertura || '-'}</p>
                                                    </div>
                                                </div>

                                                {/* Pés */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="bg-white p-4 rounded-xl border border-teal-100 shadow-sm">
                                                        <h5 className="font-bold text-teal-700 mb-3 flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-teal-500" /> Pé Esquerdo
                                                        </h5>
                                                        <ul className="text-xs space-y-2">
                                                            <li className="flex justify-between border-b pb-1"><span className="text-slate-500">Arco:</span> <span className="font-medium">{prescription.data?.leftFoot?.arco || '-'}</span></li>
                                                            <li className="flex justify-between border-b pb-1"><span className="text-slate-500">Flexibilidade:</span> <span className="font-medium">{prescription.data?.leftFoot?.flexibilidade || '-'}</span></li>
                                                            {prescription.data?.leftFoot?.elevacao && prescription.data.leftFoot.elevacao !== '0' && (<li className="flex justify-between border-b pb-1"><span className="text-slate-500">Elevação:</span> <span className="font-bold text-teal-600">{prescription.data.leftFoot.elevacao}</span></li>)}
                                                            <li className="flex justify-between border-b pb-1"><span className="text-slate-500">Borda:</span> <span className="font-medium">{prescription.data?.leftFoot?.borda || '-'}</span></li>
                                                        </ul>
                                                    </div>
                                                    <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-sm">
                                                        <h5 className="font-bold text-rose-700 mb-3 flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-rose-500" /> Pé Direito
                                                        </h5>
                                                        <ul className="text-xs space-y-2">
                                                            <li className="flex justify-between border-b pb-1"><span className="text-slate-500">Arco:</span> <span className="font-medium">{prescription.data?.rightFoot?.arco || '-'}</span></li>
                                                            <li className="flex justify-between border-b pb-1"><span className="text-slate-500">Flexibilidade:</span> <span className="font-medium">{prescription.data?.rightFoot?.flexibilidade || '-'}</span></li>
                                                            {prescription.data?.rightFoot?.elevacao && prescription.data.rightFoot.elevacao !== '0' && (<li className="flex justify-between border-b pb-1"><span className="text-slate-500">Elevação:</span> <span className="font-bold text-rose-600">{prescription.data.rightFoot.elevacao}</span></li>)}
                                                            <li className="flex justify-between border-b pb-1"><span className="text-slate-500">Borda:</span> <span className="font-medium">{prescription.data?.rightFoot?.borda || '-'}</span></li>
                                                        </ul>
                                                    </div>
                                                </div>

                                                {/* Resumo */}
                                                {prescription.data?.reportText && (
                                                    <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 shadow-sm">
                                                        <h5 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                                                            <FileText className="w-4 h-4" /> Resumo Clínico / Observações
                                                        </h5>
                                                        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{prescription.data.reportText}</p>
                                                    </div>
                                                )}

                                                <hr className="my-2 border-slate-200" />

                                                {/* Vincular OS Propulsão */}
                                                <div className="bg-slate-50 p-4 rounded-xl border flex flex-col gap-3">
                                                    <Label className="text-[11px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                                                        Atribuir OS da Propulsão
                                                    </Label>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            id={`os-${prescription.id}`}
                                                            placeholder="Ex: 14853-18"
                                                            defaultValue={prescription.data?.propulsaoOrder || ''}
                                                            className="bg-white max-w-[200px]"
                                                        />
                                                        <Button onClick={async () => {
                                                            const val = (document.getElementById(`os-${prescription.id}`) as HTMLInputElement)?.value;
                                                            if (!val) return;

                                                            const res = await updateAssessmentPropulsaoOrder(prescription.id, val, patientId, slug);
                                                            if (res.success) toast.success("OS salva com sucesso!");
                                                            else toast.error("Erro ao salvar OS");
                                                        }} variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">Salvar OS</Button>
                                                    </div>
                                                    <p className="text-[10px] text-slate-500">Como a integração atual não retorna o número do pedido automaticamente, insira-o manualmente aqui para manter o registro.</p>
                                                </div>

                                                {/* Registro de Entrega */}
                                                <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200 shadow-inner mt-4">
                                                    <h5 className="font-black text-emerald-900 mb-2 uppercase tracking-tight flex items-center gap-2">
                                                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                                        Registro de Entrega & Automação
                                                    </h5>
                                                    <p className="text-xs text-emerald-800 mb-5 leading-relaxed">
                                                        Registre a entrega desta palmilha para gerar as evoluções clínicas automáticas e agendar os retornos de 40 dias e 1 ano para este paciente.
                                                    </p>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <Label className="text-[10px] font-bold uppercase text-emerald-700 mb-1.5 block">Data da Ação</Label>
                                                            <input
                                                                type="date"
                                                                onChange={(e) => setDate(new Date(e.target.value))}
                                                                className="h-10 px-3 bg-white border border-emerald-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 w-full"
                                                            />
                                                        </div>
                                                        <div className="flex items-end">
                                                            <Button onClick={() => {
                                                                setRegistrationType('delivery');
                                                                setDeliveryNote(`Entrega de palmilha modelo ${prescription.data?.produto || 'Slim'} (${prescription.data?.propulsaoOrder ? `OS #${prescription.data.propulsaoOrder}` : 'Pedido via Axiom'}) registrada.`);
                                                                handleRegister();
                                                            }} disabled={isSubmitting || !date} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 transition-all shadow-md active:scale-95">
                                                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                                                Registrar Entrega
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                ))}
                        </div>
                        <div className="border-t border-dashed my-6" />
                    </div>
                )}

                <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Monitoramento & Acompanhamento
                </h4>

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
                        title="Nenhuma entrega registrada"
                        description="Registre a data de entrega ou ajuste da palmilha para ativar o monitoramento automático."
                        action={
                            <Button onClick={() => setIsDialogOpen(true)} variant="outline">
                                Registrar Primeira Ação
                            </Button>
                        }
                    />
                )}
            </div>
        </div>
    )
}

