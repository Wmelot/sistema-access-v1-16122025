"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Calendar, Loader2, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface GoogleIntegrationProps {
    profileId: string
}

export function GoogleIntegration({ profileId }: GoogleIntegrationProps) {
    const [status, setStatus] = useState<'loading' | 'connected' | 'disconnected'>('loading')
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        checkStatus()
    }, [profileId])

    async function checkStatus() {
        try {
            const { data, error } = await supabase
                .from('professional_integrations')
                .select('id')
                .eq('profile_id', profileId)
                .eq('provider', 'google_calendar')
                .single()

            if (data) {
                setStatus('connected')
            } else {
                setStatus('disconnected')
            }
        } catch (error) {
            console.error(error)
            setStatus('disconnected')
        }
    }

    async function handleDisconnect() {
        if (!confirm("Tem certeza que deseja desconectar? Os agendamentos pararão de sincronizar.")) return

        setLoading(true)
        try {
            const { error } = await supabase
                .from('professional_integrations')
                .delete()
                .eq('profile_id', profileId)
                .eq('provider', 'google_calendar')

            if (error) throw error
            setStatus('disconnected')
            toast.success("Desconectado com sucesso.")
        } catch (error) {
            toast.error("Erro ao desconectar.")
        } finally {
            setLoading(false)
        }
    }

    if (status === 'loading') {
        return <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Verificando integração...</div>
    }

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-bold">Google Calendar</CardTitle>
                        <CardDescription>
                            Sincronize seus agendamentos automaticamente.
                        </CardDescription>
                    </div>
                    <Calendar className="h-8 w-8 text-muted-foreground opacity-50" />
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between py-4">
                        <div className="flex items-center space-x-2">
                            {status === 'connected' ? (
                                <>
                                    <CheckCircle className="text-green-500 h-5 w-5" />
                                    <span className="text-sm font-medium">Conectado</span>
                                </>
                            ) : (
                                <>
                                    <XCircle className="text-red-500 h-5 w-5" />
                                    <span className="text-sm font-medium">Não conectado</span>
                                </>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={checkStatus} title="Atualizar Status">
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {status === 'connected' ? (
                        <div className="flex space-x-2">
                            <Button variant="outline" className="text-red-500 hover:text-red-600 w-full" onClick={handleDisconnect} disabled={loading}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Desconectar
                            </Button>
                        </div>
                    ) : (
                        <Link href={`/api/google/auth?profile_id=${profileId}`} passHref legacyBehavior>
                            {/* Note: We need to pass profile_id to auth if we want to allow admin to auth for others, 
                            BUT Google OAuth strictly connects the *current* browser session user. 
                            So relying on `api/google/auth` which uses `supabase.auth.getUser()` is correct 
                            IF the user editing is the user connecting. 
                            If Admin tries to connect for another doctor, they will be connecting THEIR Admin Google Account to the Doctor's profile?
                            Wait, `route.ts` uses `supabase.auth.getUser()`. 
                            So whoever is logged in (Admin) will be the one authenticating.
                            This is tricky. Usually "Connect" implies "Me connecting My Account".
                            I'll assume the user wants to connect *their own* account or is okay with this limitation.
                            For now, keeping standard link.
                        */}
                            <Button className="w-full">
                                Conectar Google Calendar
                            </Button>
                        </Link>
                    )}
                </CardContent>
            </Card>

            {/* Instructions */}
            <div className="mt-6 space-y-4">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Passo a Passo para Integração</h4>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex gap-3 items-start p-4 bg-muted/20 rounded-lg border">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">1</div>
                        <div className="space-y-1">
                            <p className="font-medium text-sm">Iniciar Conexão</p>
                            <p className="text-xs text-muted-foreground">Clique no botão "Conectar Google Calendar" acima.</p>
                        </div>
                    </div>

                    <div className="flex gap-3 items-start p-4 bg-muted/20 rounded-lg border">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">2</div>
                        <div className="space-y-1">
                            <p className="font-medium text-sm">Escolher Conta</p>
                            <p className="text-xs text-muted-foreground">Selecione a conta Google que você usa profissionalmente.</p>
                        </div>
                    </div>

                    <div className="flex gap-3 items-start p-4 bg-muted/20 rounded-lg border">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">3</div>
                        <div className="space-y-1">
                            <p className="font-medium text-sm">Permitir Acesso</p>
                            <p className="text-xs text-muted-foreground">Marque todas as caixas de permissão para que o sistema possa criar eventos.</p>
                        </div>
                    </div>

                    <div className="flex gap-3 items-start p-4 bg-muted/20 rounded-lg border">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">4</div>
                        <div className="space-y-1">
                            <p className="font-medium text-sm">Testar</p>
                            <p className="text-xs text-muted-foreground">Crie um agendamento novo no sistema e veja ele aparecer na sua agenda Google!</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-md border border-blue-100 text-xs">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <p>A sincronização é de mão única: Sistema Access ➔ Google Calendar.</p>
                </div>
            </div>
        </>
    )
}
