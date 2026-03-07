"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChevronRight, ChevronLeft, Calendar as CalendarIcon, Clock, CheckCircle2, Footprints, Stethoscope, Activity, User2, Dumbbell, Baby, MapPin, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { format, parseISO, addDays, startOfDay, differenceInCalendarDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { getProfessionalsForService, createPublicAppointment, addToWaitlist } from "@/app/book/actions"
import * as VMasker from "vanilla-masker"
import { toast } from "sonner"
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import { useGlobalLoader } from "@/components/providers/global-loader-provider"
import dynamic from "next/dynamic"

const QuantumLoader = dynamic(() => import('@/components/ui/quantum-loader').then(mod => ({ default: mod.QuantumLoader })), {
    ssr: false,
    loading: () => <div className="w-8 h-8" />
});

const MySwal = withReactContent(Swal)
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
        if (n.includes('consulta')) return <Stethoscope className="h-6 w-6 text-pink-500" />
        return <Baby className="h-6 w-6 text-pink-500" />
    }
    if (n.includes('palmilha')) return <Footprints className="h-6 w-6 text-orange-500" />
    if (n.includes('atendimento')) return <Dumbbell className="h-6 w-6 text-emerald-500" />
    return <Stethoscope className="h-6 w-6 text-blue-500" />
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
interface Service {
    id: string,
    name: string,
    duration: number,
    price: number,
    special_reminder?: string,
    description?: string
}

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
    const { showDiscrete, hideLoading } = useGlobalLoader()

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
        injuryRegion: ''
    })
    const [successData, setSuccessData] = useState<any>(null)

    // Data State
    const [professionals, setProfessionals] = useState<Professional[]>([])
    const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestionResponse | null>(null)
    const [loading, setLoading] = useState(false)
    const [isWaitlistOpen, setIsWaitlistOpen] = useState(false)
    const [waitlistPref, setWaitlistPref] = useState('any')
    const [waitlistDays, setWaitlistDays] = useState<string[]>(['seg', 'ter', 'qua', 'qui', 'sex'])

    // Info State
    const [infoService, setInfoService] = useState<Service | null>(null)
    const [infoPro, setInfoPro] = useState<Professional | null>(null)

    // Handlers
    const handleServiceSelect = (service: Service) => {
        setSelectedService(service)
        setStep(2)
    }

    const handleProfessionalSelect = (pro: Professional) => {
        setSelectedProfessional(pro)
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
                await MySwal.fire({
                    title: 'Horário Indisponível',
                    text: res.error || "Infelizmente este horário não está mais disponível. Por favor, escolha uma nova data ou horário para o seu agendamento.",
                    icon: 'warning',
                    confirmButtonText: 'Escolher novo horário',
                    confirmButtonColor: '#6366f1'
                })
                setStep(3) // Go back to date/time selection
            }
        } catch (err) {
            console.error(err)
            MySwal.fire({
                title: 'Ops!',
                text: "Ocorreu um erro inesperado ao processar seu agendamento. Por favor, tente novamente em instantes.",
                icon: 'error',
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#6366f1'
            })
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
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h2 className="text-xl font-bold text-center text-slate-800">O que você precisa agendar?</h2>

                    {initialServices.length === 0 ? (
                        <div className="text-center p-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed">
                            Nenhum serviço disponível no momento.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {initialServices.map(service => (
                                <div key={service.id} className="relative group">
                                    <button
                                        onClick={() => handleServiceSelect(service)}
                                        className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 bg-white shadow-sm hover:shadow-md hover:border-primary/50 hover:bg-primary/5 transition-all text-center w-full min-h-[140px] group"
                                    >
                                        <div className="mb-2 transform group-hover:scale-110 transition-transform duration-300">
                                            {getServiceIcon(service.name)}
                                        </div>
                                        <div className="font-bold text-base text-slate-800 group-hover:text-primary transition-colors leading-tight">
                                            {service.name}
                                        </div>
                                    </button>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-3 right-3 h-8 w-8 rounded-full bg-slate-100/50 hover:bg-slate-200 text-slate-500 shadow-sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setInfoService(service);
                                        }}
                                    >
                                        <Info className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Step 2: Professional */}
            {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-2 mb-4">
                        <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="-ml-2 text-slate-500">
                            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
                        </Button>
                        <h2 className="text-xl font-bold text-slate-800">Escolha o Profissional</h2>
                    </div>

                    {loading ? (
                        <div className="text-center py-10 text-muted-foreground flex flex-col items-center gap-4">
                            <QuantumLoader size="40" speed="1.2" color="#6366f1" />
                            <span className="font-medium">Carregando especialistas...</span>
                        </div>
                    ) : professionals.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground bg-gray-50 rounded-xl border border-dashed">
                            Nenhum profissional disponível para este serviço no momento.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {professionals.map(pro => (
                                <div key={pro.id} className="relative group">
                                    <button
                                        onClick={() => handleProfessionalSelect(pro)}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-8 rounded-2xl border-2 transition-all text-center group bg-white shadow-sm hover:shadow-md w-full",
                                            getProfessionalColor(pro.full_name)
                                        )}
                                    >
                                        <Avatar className={cn("h-24 w-24 mb-4 border-4 shadow-sm transform group-hover:scale-105 transition-transform duration-300", getProfessionalBorder(pro.full_name))}>
                                            <AvatarImage src={pro.photo_url || ''} />
                                            <AvatarFallback className="text-2xl">{pro.full_name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="mt-2 min-h-[40px]">
                                            <div className="font-bold text-xl text-slate-800 leading-tight">{pro.full_name}</div>
                                        </div>
                                    </button>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-3 right-3 h-8 w-8 rounded-full bg-slate-100/50 hover:bg-slate-200 text-slate-500 shadow-sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setInfoPro(pro);
                                        }}
                                    >
                                        <Info className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Step 3: Date & Time */}
            {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-2 mb-4">
                        <Button variant="ghost" size="sm" onClick={() => setStep(2)} className="-ml-2 text-slate-500">
                            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
                        </Button>
                        <h2 className="text-xl font-bold text-slate-800">Escolha a Data e Horário</h2>
                    </div>

                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Calendar */}
                        <div className="flex-1 flex justify-center bg-white p-6 rounded-2xl border shadow-sm">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                locale={ptBR}
                                disabled={(date) => {
                                    const minDays = selectedProfessional?.min_advance_booking_days || 0
                                    const today = startOfDay(new Date())
                                    const diffDays = differenceInCalendarDays(startOfDay(date), today)
                                    return diffDays <= minDays || date.getDay() === 0 // Disable Sundays
                                }}
                                className="rounded-md border-0"
                            />
                        </div>

                        {/* Slots */}
                        <div className="flex-1 flex flex-col min-h-[460px]">
                            <h3 className="font-bold mb-4 text-xs text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5" />
                                Horários para {selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) : ''}
                            </h3>

                            {loading ? (
                                <div className="text-center py-20 text-muted-foreground flex flex-col items-center gap-4">
                                    <QuantumLoader size="45" speed="1.2" color="#6366f1" />
                                    <span className="font-medium italic">Otimizando sua agenda...</span>
                                </div>
                            ) : !smartSuggestions || (!smartSuggestions.morning && !smartSuggestions.afternoon && smartSuggestions.alternativeSlots.length === 0) ? (
                                <div className="text-center py-10 px-6 text-muted-foreground bg-slate-50 rounded-2xl border border-dashed flex flex-col items-center gap-4">
                                    <CalendarIcon className="w-10 h-10 text-slate-300" />
                                    <p className="font-medium text-slate-600">{smartSuggestions?.error || 'Infelizmente não temos horários livres nesta data.'}</p>
                                    <Button variant="outline" onClick={() => setIsWaitlistOpen(true)} className="gap-2 border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50">
                                        <Clock className="w-4 h-4" />
                                        Entrar na Lista de Espera
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col h-full">
                                    <div className="space-y-6 flex-1 overflow-y-auto pr-2 max-h-[350px]">
                                        <div className="grid grid-cols-3 gap-3">
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
                                                        className="py-4 px-2 text-sm font-bold border-2 rounded-xl border-slate-100 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all bg-white shadow-sm flex flex-col items-center gap-1"
                                                    >
                                                        <span className="text-slate-900">{slot.time}</span>
                                                        <span className="text-[10px] text-slate-400 font-medium">Disponível</span>
                                                    </button>
                                                ))}
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-6 border-t border-slate-100 shrink-0 pb-2 text-center">
                                        <p className="text-sm text-slate-500 font-medium mb-3">Não encontrou um horário ideal?</p>
                                        <Button
                                            variant="outline"
                                            className="w-full text-indigo-700 border-indigo-200 hover:bg-indigo-50 h-14 px-4 shadow-sm font-bold text-base transition-all rounded-xl"
                                            onClick={() => setIsWaitlistOpen(true)}
                                        >
                                            <Clock className="w-5 h-5 mr-3 shrink-0" />
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
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-2 mb-4">
                        <Button variant="ghost" size="sm" onClick={() => setStep(3)} className="-ml-2 text-slate-500">
                            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
                        </Button>
                        <h2 className="text-xl font-bold text-slate-800">Seus Dados de Contato</h2>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8 items-start">
                        <div className="flex-1 space-y-6 w-full">
                            <div className="bg-white p-8 rounded-2xl border-2 border-slate-100 shadow-sm space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-slate-700">Nome Completo</Label>
                                    <Input
                                        value={patientForm.name}
                                        onChange={e => handleFormChange('name', e.target.value)}
                                        placeholder="Digite seu nome"
                                        className="h-12 text-base rounded-xl border-slate-200 focus:border-primary"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-slate-700">Telefone (WhatsApp)</Label>
                                    <Input
                                        value={patientForm.phone}
                                        onChange={e => handleFormChange('phone', e.target.value)}
                                        placeholder="(00) 00000-0000"
                                        className="h-12 text-base rounded-xl border-slate-200 focus:border-primary"
                                    />
                                </div>

                                {(() => {
                                    const sName = selectedService?.name.toLowerCase() || ''
                                    const isPelvica = sName.includes('pélvica') || sName.includes('pelvica')
                                    const isAtendimento = !sName.includes('consulta') && !sName.includes('avaliação')
                                    if (isPelvica || isAtendimento) return null

                                    return (
                                        <div className="space-y-2">
                                            <Label className="text-sm font-bold text-slate-700 flex items-center justify-between">
                                                <span>O que você está sentindo?</span>
                                                <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full uppercase tracking-tighter">Obrigatório</span>
                                            </Label>
                                            <Input
                                                value={patientForm.injuryRegion}
                                                onChange={e => handleFormChange('injuryRegion', e.target.value)}
                                                placeholder="Ex: Dor na lombar, torção no tornozelo..."
                                                className="h-14 text-base rounded-xl border-slate-200 focus:border-primary"
                                            />
                                            <p className="text-[11px] text-slate-400 font-medium italic">
                                                * Forneça um breve resumo para que o profissional se prepare.
                                            </p>
                                        </div>
                                    )
                                })()}

                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-slate-700">CPF (Opcional)</Label>
                                    <Input
                                        value={patientForm.cpf}
                                        onChange={e => handleFormChange('cpf', e.target.value)}
                                        placeholder="000.000.000-00"
                                        className="h-12 text-base rounded-xl border-slate-200 focus:border-primary"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Summary Sticky Card */}
                        <div className="w-full lg:w-80 shrink-0 sticky top-4">
                            <Card className="border-2 border-slate-100 shadow-md rounded-2xl overflow-hidden">
                                <div className="bg-slate-50 p-4 border-b border-slate-100">
                                    <h3 className="font-bold text-xs uppercase text-slate-500 tracking-widest">Resumo do Agendamento</h3>
                                </div>
                                <CardContent className="p-6 space-y-6">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-primary/5 rounded-lg">
                                            {selectedService && getServiceIcon(selectedService.name)}
                                        </div>
                                        <div>
                                            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Serviço</span>
                                            <span className="font-bold text-slate-800 leading-tight">{selectedService?.name}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Avatar className="h-10 w-10 border border-slate-200 shadow-sm">
                                            <AvatarImage src={selectedProfessional?.photo_url || ''} />
                                            <AvatarFallback>{selectedProfessional?.full_name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Profissional</span>
                                            <span className="font-bold text-slate-800">{selectedProfessional?.full_name}</span>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-slate-100 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <CalendarIcon className="w-5 h-5 text-primary" />
                                            <div>
                                                <span className="font-bold text-slate-800 capitalize block text-sm">
                                                    {selectedDate && format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Clock className="w-5 h-5 text-primary" />
                                            <div className="text-primary font-bold text-2xl">{selectedTime}</div>
                                        </div>
                                    </div>
                                    <Button
                                        className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20 rounded-xl"
                                        onClick={() => {
                                            showDiscrete('confirm-booking');
                                            onConfirmBooking();
                                        }}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <div className="flex items-center gap-3">
                                                <QuantumLoader size="20" speed="1.5" color="white" />
                                                <span>Agendando...</span>
                                            </div>
                                        ) : 'Confirmar e Agendar'}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 5: Success */}
            {step === 5 && successData && (
                <div className="text-center py-10 animate-in zoom-in-50 duration-500">
                    <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-800 mb-2">Sucesso!</h2>
                    <p className="text-slate-500 mb-10 text-xl font-medium">
                        Seu agendamento foi confirmado.
                    </p>

                    <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border-2 border-slate-100 shadow-lg mb-10 text-left space-y-6">
                        <div className="grid grid-cols-2 gap-6 pb-6 border-b border-slate-50">
                            <div>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">Profissional</span>
                                <span className="font-bold text-lg text-slate-800">{successData.pro}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">Dia e Hora</span>
                                <span className="font-bold text-lg text-slate-800">{format(parseISO(successData.date), "dd/MM")} às {successData.time}</span>
                            </div>
                        </div>

                        {organization?.address && (
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-red-50 rounded-2xl">
                                    <MapPin className="w-6 h-6 text-red-500 shrink-0" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Local do Atendimento</div>
                                    <div className="text-base font-bold text-slate-700 leading-tight">{organization.address}</div>
                                    {organization.maps_url && (
                                        <a
                                            href={organization.maps_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary text-xs font-bold hover:underline flex items-center gap-1 mt-2 bg-primary/5 w-fit px-3 py-1 rounded-full"
                                        >
                                            Ver no Google Maps <ChevronRight className="w-3 h-3" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}

                        {successData.specialReminder && (
                            <div className="p-4 bg-amber-50 text-amber-900 rounded-2xl border-2 border-amber-100/50 text-sm">
                                <span className="font-bold flex items-center gap-2 mb-2 text-amber-700">
                                    <Info className="w-4 h-4" />
                                    Orientação Importante:
                                </span>
                                <p className="leading-relaxed font-semibold italic text-slate-600">"{successData.specialReminder}"</p>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-4 max-w-xs mx-auto">
                        <Button className="w-full h-14 font-bold rounded-2xl" asChild>
                            <a href={`https://wa.me/55${organization?.name?.includes('Access') ? '11910010839' : ''}`}>
                                Dúvidas? Fale no WhatsApp
                            </a>
                        </Button>
                        <Button variant="ghost" className="text-slate-400 font-bold" onClick={() => window.location.reload()}>
                            Fazer outro agendamento
                        </Button>
                    </div>
                </div>
            )}

            {/* Waitlist Dialog */}
            <Dialog open={isWaitlistOpen} onOpenChange={setIsWaitlistOpen}>
                <DialogContent className="rounded-3xl border-2 sm:max-w-[450px]">
                    <DialogHeader>
                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
                            <Clock className="w-6 h-6" />
                        </div>
                        <DialogTitle className="text-2xl font-bold text-slate-800">Lista de Espera</DialogTitle>
                        <DialogDescription className="text-base text-slate-500 font-medium">
                            Se surgir uma desistência para {selectedDate && format(selectedDate, "dd/MM")}, você será o primeiro a saber!
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-6">
                        <div className="space-y-3">
                            <Label className="text-sm font-bold text-slate-700 uppercase tracking-widest">Dias com Interesse</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: 'seg', label: 'Segunda' },
                                    { id: 'ter', label: 'Terça' },
                                    { id: 'qua', label: 'Quarta' },
                                    { id: 'qui', label: 'Quinta' },
                                    { id: 'sex', label: 'Sexta' },
                                    { id: 'sab', label: 'Sábado' },
                                ].map((day) => (
                                    <div key={day.id} className={cn(
                                        "flex items-center space-x-2 p-2 rounded-xl border-2 transition-all",
                                        waitlistDays.includes(day.id) ? "border-indigo-200 bg-indigo-50" : "bg-slate-50 border-slate-50"
                                    )}>
                                        <Checkbox
                                            id={`day-${day.id}`}
                                            checked={waitlistDays.includes(day.id)}
                                            onCheckedChange={(checked) => {
                                                if (checked) setWaitlistDays([...waitlistDays, day.id])
                                                else setWaitlistDays(waitlistDays.filter(d => d !== day.id))
                                            }}
                                            className="border-slate-300"
                                        />
                                        <label htmlFor={`day-${day.id}`} className="text-xs font-bold text-slate-600 cursor-pointer">{day.label}</label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-sm font-bold text-slate-700 uppercase tracking-widest">Melhor Período</Label>
                            <Select value={waitlistPref} onValueChange={setWaitlistPref}>
                                <SelectTrigger className="h-12 rounded-xl border-2 border-slate-100 bg-slate-50 font-bold">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="morning">Manhã</SelectItem>
                                    <SelectItem value="afternoon">Tarde</SelectItem>
                                    <SelectItem value="night">Noite</SelectItem>
                                    <SelectItem value="any">Qualquer Horário</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-1 gap-4 pt-4 border-t border-slate-50">
                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-slate-700">Seu Nome</Label>
                                <Input
                                    value={patientForm.name}
                                    onChange={e => handleFormChange('name', e.target.value)}
                                    placeholder="Ex: João Silva"
                                    className="h-12 rounded-xl border-slate-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-slate-700">WhatsApp</Label>
                                <Input
                                    value={patientForm.phone}
                                    onChange={e => handleFormChange('phone', e.target.value)}
                                    placeholder="(00) 00000-0000"
                                    className="h-12 rounded-xl border-slate-200"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" className="font-bold text-slate-400" onClick={() => setIsWaitlistOpen(false)}>Cancelar</Button>
                        <Button className="h-12 px-8 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200" onClick={async () => {
                            if (!patientForm.name || patientForm.phone.length < 14) {
                                toast.error("Preencha nome e telefone WhatsApp.")
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
                        }}>Confirmar Entrada na Lista</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Service Info Dialog */}
            <Dialog open={!!infoService} onOpenChange={(open) => !open && setInfoService(null)}>
                <DialogContent className="sm:max-w-[450px] rounded-3xl border-2">
                    <DialogHeader>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-primary/10 rounded-2xl">
                                {infoService && getServiceIcon(infoService.name)}
                            </div>
                            <DialogTitle className="text-2xl font-bold text-slate-800 leading-tight">
                                {infoService?.name}
                            </DialogTitle>
                        </div>
                        <div className="text-slate-600 font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            {infoService?.description || "Este serviço é prestado com excelência por nossos profissionais qualificados."}
                        </div>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex items-center gap-3 text-sm font-bold text-slate-700 border-2 border-slate-50 p-4 rounded-2xl">
                            <Clock className="w-5 h-5 text-primary" />
                            <span>Tempo de Sessão: <span className="text-primary">{infoService?.duration} minutos</span></span>
                        </div>
                        {infoService?.special_reminder && (
                            <div className="p-4 bg-blue-50 text-blue-800 rounded-2xl border-2 border-blue-100/50 text-sm font-medium">
                                <span className="font-bold block mb-1 uppercase tracking-widest text-[10px] text-blue-400">Instruções para o dia:</span>
                                {infoService.special_reminder}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button className="w-full h-14 rounded-2xl font-bold shadow-lg shadow-primary/20" onClick={() => {
                            if (infoService) handleServiceSelect(infoService);
                            setInfoService(null);
                        }}>
                            Escolher este serviço
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Professional Info Dialog */}
            <Dialog open={!!infoPro} onOpenChange={(open) => !open && setInfoPro(null)}>
                <DialogContent className="sm:max-w-[450px] rounded-3xl border-2">
                    <DialogHeader>
                        <div className="flex flex-col items-center text-center mb-4">
                            <Avatar className={cn("h-32 w-32 mb-4 border-4 shadow-md", infoPro ? getProfessionalBorder(infoPro.full_name) : "")}>
                                <AvatarImage src={infoPro?.photo_url || ''} />
                                <AvatarFallback className="text-3xl">{infoPro?.full_name[0]}</AvatarFallback>
                            </Avatar>
                            <DialogTitle className="text-3xl font-bold text-slate-800">
                                {infoPro?.full_name}
                            </DialogTitle>
                            <div className="text-primary font-bold uppercase tracking-widest text-xs mt-1">
                                {infoPro?.specialty || "Especialista"}
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="space-y-6 py-2">
                        <div className="text-slate-600 font-medium leading-relaxed bg-slate-50 p-6 rounded-3xl border border-slate-100 max-h-[250px] overflow-y-auto">
                            {infoPro?.bio || "Profissional dedicado ao cuidado integral do paciente, com vasta experiência em fisioterapia e reabilitação."}
                        </div>

                        <div className="flex items-center gap-3 text-sm font-bold text-slate-500 justify-center">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            Profissional Verificado pela Clínica
                        </div>
                    </div>
                    <DialogFooter>
                        <Button className="w-full h-14 rounded-2xl font-bold shadow-lg shadow-primary/20" onClick={() => {
                            if (infoPro) handleProfessionalSelect(infoPro);
                            setInfoPro(null);
                        }}>
                            Agendar com {infoPro?.full_name.split(' ')[0]}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
