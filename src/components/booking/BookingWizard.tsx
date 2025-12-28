"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChevronRight, ChevronLeft, Calendar as CalendarIcon, Clock, CheckCircle2, Footprints, Stethoscope, Activity, User2, Dumbbell, Baby } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { getProfessionalsForService, getPublicAvailability, createPublicAppointment } from "@/app/book/actions"
import * as VMasker from "vanilla-masker"

const getServiceIcon = (name: string) => {
    const n = name.toLowerCase()
    // Pelvic specific
    if (n.includes('pélvica') || n.includes('pelvica')) {
        if (n.includes('consulta')) return <Stethoscope className="h-6 w-6 text-pink-500 mb-2" />
        return <Baby className="h-6 w-6 text-pink-500 mb-2" />
    }
    // Palmilhas
    if (n.includes('palmilha')) return <Footprints className="h-6 w-6 text-orange-500 mb-2" />
    // Standard Physio
    if (n.includes('atendimento')) return <Dumbbell className="h-6 w-6 text-emerald-500 mb-2" />
    // Default
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
interface Service { id: string, name: string, duration: number, price: number }
interface Location { id: string, name: string }
interface Professional { id: string, full_name: string, photo_url: string | null, bio: string | null, specialty: string | null }

interface BookingWizardProps {
    initialServices: Service[]
    initialLocations: Location[]
}

export function BookingWizard({ initialServices, initialLocations }: BookingWizardProps) {
    const [step, setStep] = useState(1)

    // Selection State
    const [selectedService, setSelectedService] = useState<Service | null>(null)
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(initialLocations[0] || null)
    const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null)
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
    const [selectedTime, setSelectedTime] = useState<string | null>(null)

    // Form State
    const [patientForm, setPatientForm] = useState({ name: '', phone: '', cpf: '' })
    const [successData, setSuccessData] = useState<any>(null)

    // Data State
    const [professionals, setProfessionals] = useState<Professional[]>([])
    const [availableSlots, setAvailableSlots] = useState<string[]>([])
    const [loading, setLoading] = useState(false)

    // Handlers
    const handleServiceSelect = (service: Service) => {
        setSelectedService(service)
        setStep(2)
    }

    const handleProfessionalSelect = (pro: Professional) => {
        setSelectedProfessional(pro)
        setStep(3)
    }

    const handleTimeSelect = (time: string) => {
        setSelectedTime(time)
        setStep(4) // Move to form
    }

    const handleFormChange = (field: string, value: string) => {
        let val = value
        if (field === 'phone') val = VMasker.toPattern(val, '(99) 99999-9999')
        if (field === 'cpf') val = VMasker.toPattern(val, '999.999.999-99')
        setPatientForm(prev => ({ ...prev, [field]: val }))
    }

    const onConfirmBooking = async () => {
        if (!selectedService || !selectedProfessional || !selectedDate || !selectedTime) return
        if (!patientForm.name || patientForm.phone.length < 14) {
            alert("Por favor, preencha seu nome e telefone corretamente.")
            return
        }

        setLoading(true)
        const dateStr = format(selectedDate, 'yyyy-MM-dd')

        try {
            const res = await createPublicAppointment({
                serviceId: selectedService.id,
                professionalId: selectedProfessional.id,
                date: dateStr,
                time: selectedTime,
                patientData: patientForm
            })

            if (res.success) {
                setSuccessData({
                    date: dateStr,
                    time: selectedTime,
                    service: selectedService.name,
                    pro: selectedProfessional.full_name
                })
                setStep(5)
            } else {
                alert("Erro ao agendar. Tente novamente.")
            }
        } catch (err) {
            console.error(err)
            alert("Erro desconhecido.")
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

    // Effect: Load Slots when Date/Pro changes
    useEffect(() => {
        if (step === 3 && selectedProfessional && selectedDate && selectedService) {
            setLoading(true)
            const dateStr = format(selectedDate, 'yyyy-MM-dd')
            getPublicAvailability(selectedProfessional.id, dateStr, selectedService.duration, selectedService.id)
                .then(slots => setAvailableSlots(slots))
                .finally(() => setLoading(false))
        }
    }, [step, selectedDate, selectedProfessional, selectedService])


    return (
        <div className="space-y-6">
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 opacity-100">
                            {initialServices.map(service => (
                                <button
                                    key={service.id}
                                    onClick={() => handleServiceSelect(service)}
                                    className="flex flex-col items-start justify-between p-6 rounded-2xl border bg-white shadow-sm hover:shadow-md hover:border-primary/50 hover:bg-primary/5 transition-all text-left group w-full opacity-100"
                                >
                                    <div className="w-full">
                                        {getServiceIcon(service.name)}
                                        <div className="font-semibold text-lg text-gray-900 group-hover:text-primary transition-colors">{service.name}</div>
                                        <div className="text-sm text-gray-500 flex items-center mt-2">
                                            <Clock className="w-3.5 h-3.5 mr-1.5" />
                                            {service.duration} min
                                        </div>
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
                                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))} // Disable past
                                className="rounded-md border-0"
                                classNames={{
                                    head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                                    cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                    day: cn(
                                        "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-primary/10 rounded-md transition-colors"
                                    ),
                                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                                    day_today: "bg-accent text-accent-foreground",
                                }}
                            />
                        </div>

                        {/* Slots */}
                        <div className="flex-1">
                            <h3 className="font-medium mb-3 text-sm text-gray-500 uppercase tracking-wide">
                                Horários para {selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) : ''}
                            </h3>

                            {loading ? (
                                <div className="text-center py-10 text-muted-foreground">Verificando agenda...</div>
                            ) : availableSlots.length === 0 ? (
                                <div className="text-center py-10 text-muted-foreground bg-gray-50 rounded-lg border border-dashed">
                                    Sem horários livres nesta data.
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-2">
                                    {availableSlots.map(time => (
                                        <button
                                            key={time}
                                            onClick={() => handleTimeSelect(time)}
                                            className="py-2 px-1 text-sm font-medium border rounded-md hover:border-primary hover:bg-primary/5 hover:text-primary transition-all bg-white"
                                        >
                                            {time}
                                        </button>
                                    ))}
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
                            <div>
                                <Label>CPF (Opcional, agiliza o atendimento)</Label>
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
                                    <span className="font-medium">{selectedProfessional?.full_name}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500 text-xs">Data e Hora</span>
                                    <span className="font-medium capitalize">
                                        {selectedDate && format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                                    </span>
                                    <div className="text-primary font-bold text-lg">{selectedTime}</div>
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
                    <p className="text-muted-foreground mb-8">
                        Seu horário está reservado com sucesso.
                    </p>

                    <div className="max-w-md mx-auto bg-gray-50 p-6 rounded-xl border mb-8 text-left">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-xs text-gray-500 block">Dia</span>
                                <span className="font-medium">{format(new Date(successData.date), "dd/MM/yyyy")}</span>
                            </div>
                            <div>
                                <span className="text-xs text-gray-500 block">Horário</span>
                                <span className="font-medium">{successData.time}</span>
                            </div>
                            <div className="col-span-2">
                                <span className="text-xs text-gray-500 block">Profissional</span>
                                <span className="font-medium">{successData.pro}</span>
                            </div>
                        </div>
                    </div>

                    <Button variant="outline" onClick={() => window.location.reload()}>
                        Agendar Outro
                    </Button>
                </div>
            )}
        </div>
    )
}
