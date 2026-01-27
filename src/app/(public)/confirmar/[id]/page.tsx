'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, Calendar, Clock, MapPin, User, ArrowRight, Loader2, CalendarRange } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { confirmAppointmentPublic } from '@/actions/appointments'
import { cn } from '@/lib/utils'

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
        if (appointment?.organizations?.slug) {
            router.push(`/book/${appointment.organizations.slug}?reschedule=${id}`)
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
                            Tudo certo! <span className="font-bold text-gray-900">{appointment.profiles?.full_name}</span> aguarda você.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="bg-zinc-50 rounded-xl p-6 space-y-4 border border-zinc-100">
                            <div className="flex items-center gap-3 text-zinc-700">
                                <Calendar className="h-5 w-5 text-primary" />
                                <span className="text-base font-bold text-gray-900">{new Date(appointment.start_time).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div className="flex items-center gap-3 text-zinc-700">
                                <Clock className="h-5 w-5 text-primary" />
                                <span className="text-base font-bold text-gray-900">{new Date(appointment.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="flex items-start gap-3 text-zinc-700 pt-2 border-t">
                                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-800 leading-tight">
                                        {appointment.organizations?.address || appointment.locations?.name || 'Clínica Access'}
                                    </span>
                                    {appointment.organizations?.maps_url && (
                                        <a
                                            href={appointment.organizations.maps_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary text-xs font-bold hover:underline mt-1 flex items-center gap-1"
                                        >
                                            Ver no Google Maps
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        {appointment.services?.special_reminder && (
                            <div className="p-4 bg-amber-50 rounded-lg border border-amber-100 text-sm text-amber-900">
                                <span className="font-bold block mb-1">ℹ️ Lembrete Especial:</span>
                                {appointment.services.special_reminder}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3 px-6 pb-8">
                        {appointment.organizations?.footer_message && (
                            <p className="text-sm text-center text-zinc-500 italic mb-2">
                                "{appointment.organizations.footer_message}"
                            </p>
                        )}
                        <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1.5">
                            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-green-600"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                            Dúvidas ou imprevistos? Entre em contato pelo WhatsApp.
                        </p>
                        <Button className="w-full mt-2" variant="outline" onClick={() => window.close()}>
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
                        Olá {appointment.patients?.name?.split(' ')[0]}, desejamos confirmar sua presença.
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
                                <p className="text-zinc-900 font-bold text-xl">
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
                                <p className="text-zinc-900 font-bold text-xl">{appointment.profiles?.full_name}</p>
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
