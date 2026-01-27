'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, Calendar, Clock, MapPin, User, ArrowRight, Loader2, CalendarRange } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { confirmAppointmentPublic } from '@/actions/appointments'

export default function ConfirmationPage() {
    const { id } = useParams()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [appointment, setAppointment] = useState<any>(null)
    const [fetching, setFetching] = useState(true)

    useEffect(() => {
        async function fetchAppt() {
            try {
                const res = await fetch(`/api/public/appointment/${id}`)
                if (res.ok) {
                    const data = await res.json()
                    setAppointment(data)
                }
            } catch (err) {
                console.error(err)
            } finally {
                setFetching(false)
            }
        }
        fetchAppt()
    }, [id])

    const handleConfirm = async () => {
        setLoading(true)
        try {
            const result = await confirmAppointmentPublic(id as string)
            if (result.success) {
                setSuccess(true)
                toast.success("Consulta confirmada com sucesso!")
            } else {
                toast.error(result.error || "Erro ao confirmar consulta.")
            }
        } catch (err) {
            toast.error("Erro na conexão.")
        } finally {
            setLoading(false)
        }
    }

    const handleReschedule = () => {
        if (appointment?.organization?.slug) {
            router.push(`/book/${appointment.organization.slug}?reschedule=${id}`)
        } else {
            toast.error("Não foi possível redirecionar para o reagendamento.")
        }
    }

    if (fetching) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!appointment) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
                <Card className="max-w-md w-full text-center p-8">
                    <CardTitle className="text-red-500 mb-2 font-black">Ops!</CardTitle>
                    <p className="text-zinc-600 font-medium mb-4">Não encontramos os dados desta consulta.</p>
                    <div className="bg-zinc-100 p-3 rounded-lg text-[10px] font-mono text-zinc-400 break-all">
                        ID: {id?.toString().substring(0, 8)}...
                    </div>
                    <p className="text-xs text-zinc-400 mt-4 leading-relaxed">
                        Verifique se o link está completo ou se a consulta já foi concluída.
                    </p>
                </Card>
            </div>
        )
    }

    if (success || appointment.status === 'confirmed') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
                <Card className="max-w-md w-full shadow-2xl border-none overflow-hidden">
                    <div className="h-2 bg-green-500 w-full" />
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto bg-green-100 h-16 w-16 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="h-10 w-10 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Consulta Confirmada!</CardTitle>
                        <CardDescription>
                            Tudo certo! Dra. {appointment.professional?.full_name} aguarda você.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="bg-zinc-50 rounded-xl p-4 space-y-3 border border-zinc-100">
                            <div className="flex items-center gap-3 text-zinc-700">
                                <Calendar className="h-4 w-4 text-zinc-400" />
                                <span className="text-sm font-medium">{new Date(appointment.start_time).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div className="flex items-center gap-3 text-zinc-700">
                                <Clock className="h-4 w-4 text-zinc-400" />
                                <span className="text-sm font-medium">{new Date(appointment.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="flex items-center gap-3 text-zinc-700">
                                <MapPin className="h-4 w-4 text-zinc-400" />
                                <span className="text-sm font-medium">{appointment.location?.name || 'Clínica Access'}</span>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3 px-6 pb-8">
                        <p className="text-xs text-center text-muted-foreground mb-2">
                            Qualquer imprevisto, entre em contato pelo WhatsApp da clínica.
                        </p>
                        <Button className="w-full" variant="outline" onClick={() => window.close()}>
                            Fechar
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-100 p-4 font-sans">
            <Card className="max-w-lg w-full shadow-2xl border-none overflow-hidden">
                <CardHeader className="bg-primary text-primary-foreground p-8">
                    <CardTitle className="text-2xl font-bold">Confirmação de Consulta</CardTitle>
                    <CardDescription className="text-primary-foreground/80">
                        Olá {appointment.patient?.name?.split(' ')[0]}, desejamos confirmar sua presença.
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-8 space-y-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4 bg-zinc-50 p-4 rounded-2xl border border-zinc-100 transition-colors hover:bg-zinc-100">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <CalendarRange className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Data e Horário</p>
                                <p className="text-zinc-900 font-semibold text-lg">
                                    {new Date(appointment.start_time).toLocaleDateString('pt-BR')} às {new Date(appointment.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 bg-zinc-50 p-4 rounded-2xl border border-zinc-100 transition-colors hover:bg-zinc-100">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <User className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Profissional</p>
                                <p className="text-zinc-900 font-semibold text-lg">{appointment.professional?.full_name}</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex flex-col sm:flex-row gap-3">
                        <Button
                            className="flex-1 h-14 text-lg font-bold bg-green-600 hover:bg-green-700 shadow-lg shadow-green-100"
                            onClick={handleConfirm}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CheckCircle2 className="h-5 w-5 mr-2" />}
                            CONFIRMAR
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1 h-14 text-lg font-bold border-2 hover:bg-zinc-50"
                            onClick={handleReschedule}
                        >
                            REAGENDAR
                            <ArrowRight className="h-5 w-5 ml-2 text-zinc-400" />
                        </Button>
                    </div>
                </CardContent>

                <CardFooter className="bg-zinc-50 p-6 flex justify-center border-t border-zinc-100">
                    <p className="text-sm text-zinc-500 flex items-center gap-2">
                        Powered by <span className="font-bold text-primary italic">Axiom</span>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
