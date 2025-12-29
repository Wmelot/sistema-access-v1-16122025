'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function ConsentPage() {
    const params = useParams()
    const token = params?.token as string

    const [loading, setLoading] = useState(true)
    const [signing, setSigning] = useState(false)
    const [data, setData] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        if (!token) return

        async function verifyToken() {
            setLoading(true)
            const supabase = createClient()

            // Call the secure RPC
            const { data: res, error: rpcError } = await supabase.rpc('get_consent_details', { token_input: token })

            if (rpcError) {
                console.error(rpcError)
                setError('Erro ao verificar link.')
            } else if (!res?.valid) {
                setError(res?.error || 'Link inválido ou expirado.')
            } else {
                setData(res)
            }
            setLoading(false)
        }

        verifyToken()
    }, [token])

    const handleSign = async () => {
        setSigning(true)
        const supabase = createClient()

        // Capture simple browser info (IP is captured by Postgres/Supabase RPC context usually, or passed via edge function. 
        // For simplicity in client RPC, we pass UA. IP is harder to get reliably client-side without a helper service/edge function).
        // *Correction*: We will try to fetch IP if possible, or let the server action handle it if we used one.
        // For Client-Side RPC, we can only pass UA.
        // In a real robust app, we'd use `headers()` in a Server Action.
        // Let's stick to RPC for now, passing UA.

        const { data: res, error: rpcError } = await supabase.rpc('sign_consent', {
            token_input: token,
            ip_input: 'client-ip-placeholder', // In a real deployment, use headers() on server side
            ua_input: navigator.userAgent
        })

        if (rpcError || !res?.success) {
            toast.error(res?.error || 'Erro ao assinar.')
        } else {
            setSuccess(true)
            toast.success('Consentimento registrado com sucesso!')
        }
        setSigning(false)
    }

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Verificando link...</div>
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Card className="w-full max-w-md border-red-200">
                    <CardHeader className="text-center">
                        <div className="mx-auto bg-red-100 p-3 rounded-full w-fit mb-4">
                            <AlertCircle className="h-8 w-8 text-red-600" />
                        </div>
                        <CardTitle className="text-red-700">Link Inválido</CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Card className="w-full max-w-md border-green-200 bg-green-50/50">
                    <CardHeader className="text-center">
                        <div className="mx-auto bg-green-100 p-3 rounded-full w-fit mb-4">
                            <CheckCircle2 className="h-10 w-10 text-green-600" />
                        </div>
                        <CardTitle className="text-green-800">Obrigado, {data?.patient_name}!</CardTitle>
                        <CardDescription className="text-green-700">
                            Seu consentimento foi registrado com sucesso.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="justify-center text-sm text-green-600 pb-8">
                        Você já pode fechar esta tela.
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
            {/* Header / Logo could go here */}

            <Card className="w-full max-w-lg shadow-lg">
                <CardHeader>
                    <CardTitle>Consentimento de Tratamento de Dados</CardTitle>
                    <CardDescription>
                        Olá, <strong>{data?.patient_name}</strong>. A Access Fisioterapia preza pela segurança dos seus dados.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-gray-600">
                    <div className="bg-blue-50 p-4 rounded-md border border-blue-100 text-blue-800 text-xs">
                        Para conformidade com a <strong>LGPD (Lei nº 13.709/2018)</strong>, precisamos da sua autorização formal para registrar sua evolução clínica e dados de saúde em nosso sistema.
                    </div>

                    <h3 className="font-semibold text-gray-900 border-b pb-2">Termos Resumidos:</h3>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>
                            <strong>O que coletamos:</strong> Histórico de saúde, exames, diagnósticos e fotos posturais (se aplicável).
                        </li>
                        <li>
                            <strong>Para que usamos:</strong> Exclusivamente para seu atendimento, planejamento fisioterapêutico e obrigações legais (prontuário).
                        </li>
                        <li>
                            <strong>Seus direitos:</strong> Seus dados são confidenciais e você pode solicitar cópia ou exclusão a qualquer momento.
                        </li>
                    </ul>

                    <p className="pt-2 text-xs text-gray-400">
                        Ao clicar abaixo, você concorda com nossa <a href="/privacy" target="_blank" className="underline hover:text-primary">Política de Privacidade</a> e assina digitalmente este termo.
                    </p>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 pt-6 border-t bg-gray-50/50">
                    <Button
                        size="lg"
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold text-lg py-6"
                        onClick={handleSign}
                        disabled={signing}
                    >
                        {signing ? 'Assinando...' : 'LI E ACEITO OS TERMOS'}
                    </Button>
                    <p className="text-[10px] text-center text-gray-400">
                        Assinatura Digital Auditada • {new Date().toLocaleDateString('pt-BR')}
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
