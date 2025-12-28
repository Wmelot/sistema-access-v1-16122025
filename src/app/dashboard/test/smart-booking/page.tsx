'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SuggestionCard } from './components/SuggestionCard'
import { Calendar, Loader2, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { SmartSuggestion, TimeSlot } from '@/lib/smart-booking/types'
import { toast } from 'sonner'
import { getProfessionals, getServices } from './actions'

export default function SmartBookingTestPage() {
    const [selectedDate, setSelectedDate] = useState<string>(
        new Date().toISOString().split('T')[0]
    )
    const [professionalId, setProfessionalId] = useState<string>('')
    const [serviceId, setServiceId] = useState<string>('')
    const [suggestions, setSuggestions] = useState<SmartSuggestion | null>(null)
    const [loading, setLoading] = useState(false)
    const [showAlternatives, setShowAlternatives] = useState(false)

    // Data from database
    const [professionals, setProfessionals] = useState<any[]>([])
    const [services, setServices] = useState<any[]>([])
    const [loadingData, setLoadingData] = useState(true)

    // Fetch professionals and services on mount
    useEffect(() => {
        async function loadData() {
            setLoadingData(true)
            try {
                const [profsData, servicesData] = await Promise.all([
                    getProfessionals(),
                    getServices()
                ])
                setProfessionals(profsData)
                setServices(servicesData)
            } catch (error) {
                console.error('Error loading data:', error)
                toast.error('Erro ao carregar dados')
            } finally {
                setLoadingData(false)
            }
        }
        loadData()
    }, [])

    // Fetch suggestions when date/professional/service changes
    useEffect(() => {
        if (professionalId && serviceId && selectedDate) {
            fetchSuggestions()
        }
    }, [selectedDate, professionalId, serviceId])

    async function fetchSuggestions() {
        setLoading(true)
        try {
            const response = await fetch('/api/schedule/smart-suggestions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    professionalId,
                    serviceId,
                    date: selectedDate
                })
            })

            const data = await response.json()

            if (data.success) {
                setSuggestions(data.data)
            } else {
                toast.error(data.error || 'Erro ao buscar sugestões')
            }
        } catch (error) {
            console.error('Error fetching suggestions:', error)
            toast.error('Erro ao buscar sugestões')
        } finally {
            setLoading(false)
        }
    }

    function handleDateChange(days: number) {
        const newDate = new Date(selectedDate)
        newDate.setDate(newDate.getDate() + days)
        setSelectedDate(newDate.toISOString().split('T')[0])
    }

    function handleBookSlot(slot: TimeSlot) {
        toast.success(`Agendamento simulado para ${slot.time}`)
        console.log('Booking slot:', slot)
        // TODO: Implement actual booking logic
    }

    const formattedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

    return (
        <div className="container mx-auto py-8 max-w-4xl">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold">Agenda Inteligente</h1>
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-semibold">
                        TESTE
                    </span>
                </div>
                <p className="text-muted-foreground">
                    Sistema de sugestões inteligentes de horários
                </p>
            </div>

            {/* Alert */}
            <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    Esta é uma página de testes. Nenhum agendamento real será criado.
                </AlertDescription>
            </Alert>

            {/* Filters */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Configuração</CardTitle>
                    <CardDescription>Selecione o profissional e serviço</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {loadingData ? (
                        <div className="flex justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Profissional</label>
                                <Select value={professionalId} onValueChange={setProfessionalId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {professionals.map(prof => (
                                            <SelectItem key={prof.id} value={prof.id}>
                                                {prof.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Serviço</label>
                                <Select value={serviceId} onValueChange={setServiceId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {services.map(service => (
                                            <SelectItem key={service.id} value={service.id}>
                                                {service.name} ({service.duration}min)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Date Navigator */}
            <Card className="mb-6">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDateChange(-1)}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Data Selecionada</p>
                            <p className="font-semibold capitalize">{formattedDate}</p>
                        </div>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDateChange(1)}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Loading State */}
            {loading && (
                <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}

            {/* Suggestions */}
            {!loading && suggestions && (
                <div className="space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold mb-4">💡 Sugestões para você</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <SuggestionCard
                                slot={suggestions.morning}
                                period="morning"
                                onBook={handleBookSlot}
                            />
                            <SuggestionCard
                                slot={suggestions.afternoon}
                                period="afternoon"
                                onBook={handleBookSlot}
                            />
                        </div>
                    </div>

                    {/* Alternative Slots */}
                    {suggestions.alternativeSlots && suggestions.alternativeSlots.length > 0 && (
                        <div>
                            <Button
                                variant="outline"
                                onClick={() => setShowAlternatives(!showAlternatives)}
                                className="w-full mb-4"
                            >
                                {showAlternatives ? '▲' : '▼'} Ver mais {suggestions.alternativeSlots.length} horários
                            </Button>

                            {showAlternatives && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {suggestions.alternativeSlots.map((slot, idx) => (
                                        <Button
                                            key={idx}
                                            variant="outline"
                                            className="h-auto py-3 flex flex-col items-start"
                                            onClick={() => handleBookSlot(slot)}
                                        >
                                            <span className="font-semibold">{slot.time}</span>
                                            <span className="text-xs text-muted-foreground">
                                                Score: {slot.score}
                                            </span>
                                        </Button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* No Results */}
            {!loading && suggestions && !suggestions.morning && !suggestions.afternoon && (
                <Card>
                    <CardContent className="p-8 text-center">
                        <p className="text-muted-foreground">
                            Nenhum horário disponível para esta data.
                        </p>
                        <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => handleDateChange(1)}
                        >
                            Ver próximo dia
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
