"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChevronRight, ChevronLeft, Calendar as CalendarIcon, Clock, CheckCircle2, Footprints, Stethoscope, Activity, User2, Dumbbell, Baby, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import { format, parseISO, addDays, startOfDay, differenceInCalendarDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { getProfessionalsForService, createPublicAppointment, addToWaitlist } from "@/app/book/actions"
import * as VMasker from "vanilla-masker"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

// Smart Booking Types
interface SmartTimeSlot {
    time: string
    date: string
    available: boolean
    score: number
    reasons: string[]
}

interface SmartSuggestionResponse {
    date: string
    morning: SmartTimeSlot | null
    afternoon: SmartTimeSlot | null
    alternativeSlots: SmartTimeSlot[]
    error?: string
}

const getServiceIcon = (name: string) => {
    const n = name.toLowerCase()
    if (n.includes('pélvica') || n.includes('pelvica')) {
        if (n.includes('consulta')) return <Stethoscope className="h-6 w-6 text-pink-500 mb-2" />
        return <Baby className="h-6 w-6 text-pink-500 mb-2" />
    }
    if (n.includes('palmilha')) return <Footprints className="h-6 w-6 text-orange-500 mb-2" />
    if (n.includes('atendimento')) return <Dumbbell className="h-6 w-6 text-emerald-500 mb-2" />
    return <Stethoscope className="h-6 w-6 text-blue-500 mb-2" />
}

const getProfessionalColor = (name: string) => {
    const n = name.toLowerCase()
    if (n.includes('warley') || n.includes('fernando')) return "hover:border-emerald-500 hover:bg-emerald-50 group-hover:text-emerald-700"
    if (n.includes('ana') || n.includes('rebeca')) return "hover:border-pink-500 hover:bg-pink-50 group-hover:text-pink-700"
    if (n.includes('bernardo')) return "hover:border-blue-500 hover:bg-blue-50 group-hover:text-blue-700"
    return "hover:border-primary hover:bg-primary/5"
}

const getProfessionalBorder = (name: string) => {
    const n = name.toLowerCase()
    if (n.includes('warley') || n.includes('fernando')) return "border-emerald-200"
    if (n.includes('ana') || n.includes('rebeca')) return "border-pink-200"
    if (n.includes('bernardo')) return "border-blue-200"
    return "border-gray-200"
}

// Types
interface Service { id: string, name: string, duration: number, price: number, special_reminder?: string }
interface Location { id: string, name: string }
interface Professional {
    id: string,
    full_name: string,
    photo_url: string | null,
    bio: string | null,
    specialty: string | null,
    min_advance_booking_days?: number
}

interface BookingWizardProps {
    initialServices: Service[]
    initialLocations: Location[]
    organization?: {
        id: string
        name: string
        footer_message?: string
        address?: string
        maps_url?: string
    }
}

export function BookingWizard({ initialServices, initialLocations, organization }: BookingWizardProps) {
    const [step, setStep] = useState(1)

    // Selection State
    const [selectedService, setSelectedService] = useState<Service | null>(null)
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(initialLocations[0] || null)
    const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null)
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
    const [selectedTime, setSelectedTime] = useState<string | null>(null)

    // Form State
    const [patientForm, setPatientForm] = useState({
        name: '',
        phone: '',
        cpf: '',
        injuryRegion: '' // [MODIFIED] Single string for text input
    })
    const [successData, setSuccessData] = useState<any>(null)

    // Data State
    const [professionals, setProfessionals] = useState<Professional[]>([])
    const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestionResponse | null>(null)
    const [loading, setLoading] = useState(false)
    const [isWaitlistOpen, setIsWaitlistOpen] = useState(false)
    const [waitlistPref, setWaitlistPref] = useState('any')
    const [waitlistDays, setWaitlistDays] = useState<string[]>(['seg', 'ter', 'qua', 'qui', 'sex'])

    // Handlers
    const handleServiceSelect = (service: Service) => {
        setSelectedService(service)
        setStep(2)
    }

    const handleProfessionalSelect = (pro: Professional) => {
        setSelectedProfessional(pro)
        // Set initial valid date based on professional's lead time
        const minDays = pro.min_advance_booking_days || 0
        const initialDate = addDays(startOfDay(new Date()), minDays)
        setSelectedDate(initialDate)
        setStep(3)
    }

    const handleTimeSelect = (time: string) => {
        setSelectedTime(time)
        setStep(4)
    }

    const handleFormChange = (field: string, value: any) => {
        let val = value
        if (field === 'phone') val = VMasker.toPattern(val, '(99) 99999-9999')
        if (field === 'cpf') val = VMasker.toPattern(val, '999.999.999-99')

        setPatientForm(prev => ({ ...prev, [field]: val }))
    }

    const onConfirmBooking = async () => {
        if (!selectedService || !selectedProfessional || !selectedDate || !selectedTime) return
        if (!patientForm.name || patientForm.phone.length < 14) {
            toast.error("Por favor, preencha seu nome e telefone corretamente.")
            return
        }
        const sName = selectedService?.name.toLowerCase() || ''
        const isPelvica = sName.includes('pélvica') || sName.includes('pelvica')
        const isAtendimento = !sName.includes('consulta') && !sName.includes('avaliação')
        const requiresRegion = !isPelvica && !isAtendimento

        if (requiresRegion && !patientForm.injuryRegion.trim()) {
            toast.error("Por favor, descreva brevemente o local que sente dor.")
            return
        }

        let finalRegion = patientForm.injuryRegion
        if (!requiresRegion && !patientForm.injuryRegion.trim()) {
            finalRegion = isPelvica ? 'Pélvica' : 'Atendimento/Sessão'
        }

        setLoading(true)
        const dateStr = format(selectedDate, 'yyyy-MM-dd')

        try {
            const res = await createPublicAppointment({
                serviceId: selectedService.id,
                professionalId: selectedProfessional.id,
                date: dateStr,
                time: selectedTime,
                patientData: {
                    ...patientForm,
                    injuryRegion: finalRegion
                }
            })

            if (res.success) {
                setSuccessData({
                    date: dateStr,
                    time: selectedTime,
                    service: selectedService.name,
                    pro: selectedProfessional.full_name,
                    specialReminder: selectedService.special_reminder
                })
                setStep(5)
                toast.success("Agendamento realizado com sucesso!")
            } else {
                toast.error("Erro ao agendar. Tente novamente.")
            }
        } catch (err) {
            console.error(err)
            toast.error("Erro desconhecido ao processar agendamento.")
        } finally {
            setLoading(false)
        }
    }

    // Effect: Load Professionals when Step 2 is active
    useEffect(() => {
        if (step === 2 && selectedService) {
            setLoading(true)
            getProfessionalsForService(selectedService.id)
                .then(data => setProfessionals(data))
                .finally(() => setLoading(false))
        }
    }, [step, selectedService])

    // Effect: Load Smart Suggestions when Date/Pro changes
    useEffect(() => {
        if (step === 3 && selectedProfessional && selectedDate && selectedService) {
            setLoading(true)
            const dateStr = format(selectedDate, 'yyyy-MM-dd')

            fetch('/api/schedule/smart-suggestions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    professionalId: selectedProfessional.id,
                    serviceId: selectedService.id,
                    date: dateStr
                })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setSmartSuggestions(data.data)
                    } else {
                        setSmartSuggestions(null)
                    }
                })
                .catch(err => {
                    console.error("Smart API Error:", err)
                    setSmartSuggestions(null)
                })
                .finally(() => setLoading(false))
        }
    }, [step, selectedDate, selectedProfessional, selectedService])

    return (
        <div className="space-y-6 pb-12 transition-all">
            {/* Steps Indicator */}
            {step < 5 && (
                <div className="flex items-center justify-between px-8 mb-8 relative max-w-sm mx-auto">
                    <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-100 -z-10" />
                    {[1, 2, 3, 4].map((s) => (
                        <div key={s} className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors bg-white border-2",
                            step >= s ? "border-primary text-primary" : "border-gray-200 text-gray-300",
                            step === s && "bg-primary text-white border-primary"
                        )}>
                            {s}
                        </div>
                    ))}
                </div>
            )}

            {/* Step 1: Service */}
            {step === 1 && (
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-center mb-4">O que você precisa agendar?</h2>

                    {initialServices.length === 0 ? (
                        <div className="text-center p-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed">
                            Nenhum serviço disponível no momento.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {initialServices.map(service => (
                                <button
                                    key={service.id}
                                    onClick={() => handleServiceSelect(service)}
                                    className="flex flex-col items-start justify-between p-6 rounded-2xl border bg-white shadow-sm hover:shadow-md hover:border-primary/50 hover:bg-primary/5 transition-all text-left group w-full"
                                >
                                    <div className="w-full">
                                        {getServiceIcon(service.name)}
                                        <div className="font-semibold text-lg text-gray-900 group-hover:text-primary transition-colors">{service.name}</div>
                                        <div className="text-sm text-gray-500 flex items-center mt-2">
                                            <Clock className="w-3.5 h-3.5 mr-1.5" />
                                            {service.duration} min
                                        </div>
                                        {service.special_reminder && (
                                            <div className="mt-3 p-2 bg-blue-50 text-blue-700 rounded text-xs italic font-medium">
                                                Lembrete: {service.special_reminder}
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Step 2: Professional */}
            {step === 2 && (
                <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="-ml-2">
                            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
                        </Button>
                        <h2 className="text-xl font-semibold">Escolha o Profissional</h2>
                    </div>

                    {loading ? (
                        <div className="text-center py-10 text-muted-foreground">Carregando especialistas...</div>
                    ) : professionals.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">Nenhum profissional disponível para este serviço.</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {professionals.map(pro => (
                                <button
                                    key={pro.id}
                                    onClick={() => handleProfessionalSelect(pro)}
                                    className={cn(
                                        "flex items-center p-4 rounded-xl border transition-all text-left group bg-white shadow-sm",
                                        getProfessionalColor(pro.full_name)
                                    )}
                                >
                                    <Avatar className={cn("h-14 w-14 mr-4 border-2", getProfessionalBorder(pro.full_name))}>
                                        <AvatarImage src={pro.photo_url || ''} />
                                        <AvatarFallback>{pro.full_name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-medium text-lg">{pro.full_name}</div>
                                        <div className="text-sm text-muted-foreground">{pro.specialty || selectedService?.name}</div>
                                    </div>
                                    <div className="ml-auto">
                                        <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-current transition-colors" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Step 3: Date & Time */}
            {step === 3 && (
                <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Button variant="ghost" size="sm" onClick={() => setStep(2)} className="-ml-2">
                            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
                        </Button>
                        <h2 className="text-xl font-semibold">Escolha a Data e Horário</h2>
                    </div>

                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Calendar */}
                        <div className="flex-1 flex justify-center bg-white p-4 rounded-xl border shadow-sm">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                locale={ptBR}
                                disabled={(date) => {
                                    const minDays = selectedProfessional?.min_advance_booking_days || 0
                                    const today = startOfDay(new Date())
                                    const diffDays = differenceInCalendarDays(startOfDay(date), today)
                                    return diffDays <= minDays
                                }}
                                className="rounded-md border-0"
                            />
                        </div>

                        {/* Slots */}
                        <div className="flex-1 flex flex-col min-h-[460px]">
                            <h3 className="font-medium mb-3 text-sm text-gray-500 uppercase tracking-wide">
                                Horários para {selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) : ''}
                            </h3>

                            {loading ? (
                                <div className="text-center py-10 text-muted-foreground">Otimizando sua agenda...</div>
                            ) : !smartSuggestions || (!smartSuggestions.morning && !smartSuggestions.afternoon && smartSuggestions.alternativeSlots.length === 0) ? (
                                <div className="text-center py-10 text-muted-foreground bg-gray-50 rounded-lg border border-dashed flex flex-col items-center gap-4">
                                    <p>{smartSuggestions?.error || 'Sem horários livres nesta data.'}</p>
                                    <Button variant="outline" onClick={() => setIsWaitlistOpen(true)} className="gap-2">
                                        <Clock className="w-4 h-4" />
                                        Entrar na Lista de Espera
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col h-full min-h-[400px]">
                                    <div className="space-y-6 flex-1 overflow-y-auto pr-2 max-h-[350px]">
                                        {/* Combined Ordered Slots Display */}
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                ...(smartSuggestions.morning ? [smartSuggestions.morning] : []),
                                                ...(smartSuggestions.afternoon ? [smartSuggestions.afternoon] : []),
                                                ...smartSuggestions.alternativeSlots
                                            ]
                                                .sort((a, b) => a.time.localeCompare(b.time))
                                                .map(slot => (
                                                    <button
                                                        key={slot.time}
                                                        onClick={() => handleTimeSelect(slot.time)}
                                                        className="py-3 px-1 text-sm font-medium border rounded-lg hover:border-primary hover:bg-primary/5 hover:text-primary transition-all bg-white shadow-sm"
                                                    >
                                                        {slot.time}
                                                    </button>
                                                ))}
                                        </div>
                                    </div>

                                    {/* Waitlist Call-to-Action */}
                                    <div className="mt-auto pt-6 border-t shrink-0 pb-2">
                                        <div className="flex items-center justify-between mb-2 px-1">
                                            <span className="text-sm text-gray-500 font-medium tracking-tight">Não encontrou um horário?</span>
                                        </div>
                                        <Button
                                            variant="outline"
                                            className="w-full text-indigo-600 border-indigo-200 hover:bg-indigo-50/50 h-12 px-4 whitespace-nowrap shadow-sm active:scale-[0.98] transition-all font-bold text-sm bg-indigo-50/10"
                                            onClick={() => setIsWaitlistOpen(true)}
                                        >
                                            <Clock className="w-4 h-4 mr-2 shrink-0" />
                                            <span>Entrar para Lista de Espera</span>
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Step 4: Identification */}
            {step === 4 && (
                <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Button variant="ghost" size="sm" onClick={() => setStep(3)} className="-ml-2">
                            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
                        </Button>
                        <h2 className="text-xl font-semibold">Seus Dados</h2>
                    </div>

                    <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 flex flex-col md:flex-row gap-6 items-start">
                        <div className="flex-1 space-y-4 w-full">
                            <div>
                                <Label>Nome Completo</Label>
                                <Input
                                    value={patientForm.name}
                                    onChange={e => handleFormChange('name', e.target.value)}
                                    placeholder="Seu nome"
                                    className="bg-white"
                                />
                            </div>
                            <div>
                                <Label>Telefone (WhatsApp)</Label>
                                <Input
                                    value={patientForm.phone}
                                    onChange={e => handleFormChange('phone', e.target.value)}
                                    placeholder="(00) 00000-0000"
                                    className="bg-white"
                                />
                            </div>

                            {(() => {
                                const sName = selectedService?.name.toLowerCase() || ''
                                const isPelvica = sName.includes('pélvica') || sName.includes('pelvica')
                                const isAtendimento = !sName.includes('consulta') && !sName.includes('avaliação')
                                if (isPelvica || isAtendimento) return null

                                return (
                                    <div className="space-y-3">
                                        <Label className="text-base">O que você está sentindo? (Breve resumo) <span className="text-red-500">*</span></Label>
                                        <Input
                                            value={patientForm.injuryRegion}
                                            onChange={e => handleFormChange('injuryRegion', e.target.value)}
                                            placeholder="Ex: coloque aqui o local que sente dor..."
                                            className="bg-white h-12"
                                        />
                                        <p className="text-[11px] text-muted-foreground italic">
                                            * Suas palavras ajudam o profissional a preparar seu atendimento.
                                        </p>
                                    </div>
                                )
                            })()}

                            <div>
                                <Label>CPF (Opcional)</Label>
                                <Input
                                    value={patientForm.cpf}
                                    onChange={e => handleFormChange('cpf', e.target.value)}
                                    placeholder="000.000.000-00"
                                    className="bg-white"
                                />
                            </div>
                        </div>

                        {/* Summary Card */}
                        <div className="bg-white p-5 rounded-lg border shadow-sm w-full md:w-64 shrink-0">
                            <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-4">Resumo</h3>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <span className="block text-gray-500 text-xs">Serviço</span>
                                    <span className="font-medium">{selectedService?.name}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500 text-xs">Profissional</span>
                                    <span className="font-medium text-primary font-bold">{selectedProfessional?.full_name}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500 text-xs">Data e Hora</span>
                                    <span className="font-bold text-gray-900 capitalize">
                                        {selectedDate && format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                                    </span>
                                    <div className="text-primary font-bold text-xl">{selectedTime}</div>
                                </div>
                            </div>
                            <Button className="w-full mt-6" onClick={onConfirmBooking} disabled={loading}>
                                {loading ? 'Agendando...' : 'Confirmar Agendamento'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 5: Success */}
            {step === 5 && successData && (
                <div className="text-center py-10 animate-in zoom-in-50 duration-500">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-green-700 mb-2">Agendamento Realizado!</h2>
                    <p className="text-muted-foreground mb-8 text-lg">
                        Seu horário está reservado com sucesso.
                    </p>

                    <div className="max-w-md mx-auto bg-gray-50 p-6 rounded-xl border mb-8 text-left space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-xs text-gray-500 block">Profissional</span>
                                <span className="font-bold text-gray-900">{successData.pro}</span>
                            </div>
                            <div>
                                <span className="text-xs text-gray-500 block">Dia e Hora</span>
                                <span className="font-bold text-gray-900">{format(parseISO(successData.date), "dd/MM")} às {successData.time}</span>
                            </div>
                        </div>

                        {organization?.address && (
                            <div className="flex items-start gap-2 pt-2 border-t">
                                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                <div>
                                    <div className="text-xs text-gray-500">Localização</div>
                                    <div className="text-sm font-medium">{organization.address}</div>
                                    {organization.maps_url && (
                                        <a
                                            href={organization.maps_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary text-xs font-semibold hover:underline flex items-center mt-1"
                                        >
                                            Ver no Google Maps
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}

                        {successData.specialReminder && (
                            <div className="p-3 bg-amber-50 text-amber-800 rounded-lg border border-amber-200 text-sm">
                                <span className="font-bold block mb-1">ℹ️ Lembrete Especial:</span>
                                {successData.specialReminder}
                            </div>
                        )}
                    </div>

                    {organization?.footer_message && (
                        <p className="max-w-sm mx-auto text-sm text-gray-500 mb-8 italic">
                            "{organization.footer_message}"
                        </p>
                    )}

                    <div className="flex flex-col gap-3 max-w-xs mx-auto">
                        <Button className="w-full" asChild>
                            <a href={`https://wa.me/55${organization?.address?.includes('Access') ? '11999999999' : ''}`}> {/* Logic for Clinic WA needed */}
                                Dúvidas? Fale conosco
                            </a>
                        </Button>
                    </div>
                </div>
            )}

            {/* Waitlist Dialog */}
            <Dialog open={isWaitlistOpen} onOpenChange={setIsWaitlistOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Lista de Espera</DialogTitle>
                        <DialogDescription>
                            Se surgir uma vaga, entraremos em contato com você.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-3">
                            <Label className="text-sm font-semibold">Dias de Preferência</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: 'seg', label: 'Seg' },
                                    { id: 'ter', label: 'Ter' },
                                    { id: 'qua', label: 'Qua' },
                                    { id: 'qui', label: 'Qui' },
                                    { id: 'sex', label: 'Sex' },
                                    { id: 'sab', label: 'Sáb' },
                                ].map((day) => (
                                    <div key={day.id} className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                                        <Checkbox
                                            id={`day-${day.id}`}
                                            checked={waitlistDays.includes(day.id)}
                                            onCheckedChange={(checked) => {
                                                if (checked) setWaitlistDays([...waitlistDays, day.id])
                                                else setWaitlistDays(waitlistDays.filter(d => d !== day.id))
                                            }}
                                        />
                                        <label htmlFor={`day-${day.id}`} className="text-xs font-medium cursor-pointer">{day.label}</label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Melhor Período</Label>
                            <Select value={waitlistPref} onValueChange={setWaitlistPref}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="morning">Manhã</SelectItem>
                                    <SelectItem value="afternoon">Tarde</SelectItem>
                                    <SelectItem value="night">Noite</SelectItem>
                                    <SelectItem value="any">Qualquer Horário</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Nome</Label>
                            <Input
                                value={patientForm.name}
                                onChange={e => handleFormChange('name', e.target.value)}
                                placeholder="Seu nome"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>WhatsApp</Label>
                            <Input
                                value={patientForm.phone}
                                onChange={e => handleFormChange('phone', e.target.value)}
                                placeholder="(00) 00000-0000"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsWaitlistOpen(false)}>Cancelar</Button>
                        <Button onClick={async () => {
                            if (!patientForm.name || patientForm.phone.length < 14) {
                                toast.error("Preencha nome e telefone.")
                                return
                            }
                            setLoading(true)
                            try {
                                const result = await addToWaitlist({
                                    serviceId: selectedService!.id,
                                    professionalId: selectedProfessional!.id,
                                    date: format(selectedDate!, 'yyyy-MM-dd'),
                                    patientData: {
                                        name: patientForm.name,
                                        phone: patientForm.phone,
                                        cpf: patientForm.cpf
                                    },
                                    preference: waitlistPref,
                                    preferredDays: waitlistDays,
                                    organizationId: organization?.id
                                })
                                if (result.success) {
                                    toast.success("Adicionado à lista de espera!")
                                    setIsWaitlistOpen(false)
                                } else {
                                    toast.error(result.error || "Erro ao adicionar.")
                                }
                            } catch (e: any) {
                                toast.error(e.message || "Erro ao adicionar.")
                            } finally {
                                setLoading(false)
                            }
                        }}>Entrar na Lista</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
