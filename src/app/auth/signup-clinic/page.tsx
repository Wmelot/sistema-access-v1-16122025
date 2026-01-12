'use client'

import { useState, useEffect, useTransition } from 'react'
import { registerClinic, checkSlugAvailability } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import slugify from 'slugify'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function SignUpClinicPage() {
    const [clinicName, setClinicName] = useState('')
    const [slug, setSlug] = useState('')
    const [isCheckingSlug, setIsCheckingSlug] = useState(false)
    const [isSlugAvailable, setIsSlugAvailable] = useState<boolean | null>(null)
    const [isPending, startTransition] = useTransition()
    const router = useRouter()
    const supabase = createClient()

    // Auto-generate slug and check availability
    useEffect(() => {
        const generateSlug = async () => {
            if (!clinicName) {
                setSlug('')
                setIsSlugAvailable(null)
                return
            }

            const newSlug = slugify(clinicName, { lower: true, strict: true })
            setSlug(newSlug)
            setIsCheckingSlug(true)

            try {
                const available = await checkSlugAvailability(newSlug)
                setIsSlugAvailable(available)
            } catch (err) {
                console.error(err)
            } finally {
                setIsCheckingSlug(false)
            }
        }

        const timer = setTimeout(generateSlug, 500)
        return () => clearTimeout(timer)
    }, [clinicName])

    async function handleSubmit(formData: FormData) {
        const email = formData.get('email') as string
        const password = formData.get('password') as string

        startTransition(async () => {
            const result = await registerClinic(null, formData)

            if (result.error) {
                toast.error(result.error)
            } else if (result.success) {
                toast.success('Conta criada com sucesso! Entrando...')

                // Auto-login logic
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                })

                if (error) {
                    toast.error('Conta criada, mas erro ao fazer login automático. Por favor, entre manualmente.')
                    router.push('/login?registered=true')
                } else {
                    router.push('/dashboard')
                    router.refresh()
                }
            }
        })
    }

    return (
        <div className="flex min-h-screen bg-white">
            {/* Left Side - Anatomy Image (Premium Visual) */}
            <div className="hidden lg:block w-1/2 relative bg-zinc-900">
                <Image
                    src="/login-bg-final.jpg"
                    alt="Anatomia e Tecnologia"
                    fill
                    className="object-cover opacity-80"
                    priority
                    quality={100}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/80 to-transparent flex flex-col justify-end p-12 text-white">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 bg-white/20 backdrop-blur rounded flex items-center justify-center font-bold">A</div>
                        <span className="text-xl font-bold tracking-wide">Axiom</span>
                    </div>
                    <h1 className="text-4xl font-bold mb-4 leading-tight">
                        Transforme sua <br />
                        <span className="text-indigo-200">Prática Clínica</span>
                    </h1>
                    <p className="text-indigo-100/80 text-lg max-w-md">
                        Junte-se à plataforma mais avançada para fisioterapeutas no Brasil.
                    </p>
                    <div className="mt-8 space-y-3">
                        <div className="flex items-center gap-3 text-sm font-medium text-indigo-100">
                            <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                            <span>14 dias de teste grátis</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm font-medium text-indigo-100">
                            <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                            <span>Configuração expressa</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-zinc-900">Crie sua conta</h2>
                        <p className="text-zinc-500 mt-2">Profissionalismo desde o primeiro acesso.</p>
                    </div>

                    <form action={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="professionalName">Seu Nome Completo</Label>
                            <Input id="professionalName" name="professionalName" placeholder="Dr. João Silva" required className="bg-zinc-50/50" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="clinicName">Nome da Clínica</Label>
                            <Input
                                id="clinicName"
                                name="clinicName"
                                placeholder="Clínica Vida Saudável"
                                value={clinicName}
                                onChange={(e) => setClinicName(e.target.value)}
                                required
                                className="bg-zinc-50/50"
                            />
                        </div>

                        {/* Slug Display / Feedback */}
                        <div className="bg-zinc-50 p-3 rounded-md text-sm flex items-center justify-between border border-zinc-200/60">
                            <div className="flex items-center gap-2 text-zinc-600 overflow-hidden">
                                <span className="font-mono text-xs opacity-50">access.axiom.com.br/</span>
                                <span className="font-bold text-indigo-700 truncate">{slug || 'sua-clinica'}</span>
                                <input type="hidden" name="slug" value={slug} />
                            </div>
                            <div>
                                {isCheckingSlug ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                                ) : isSlugAvailable === true ? (
                                    <span className="text-emerald-600 text-xs font-bold flex items-center gap-1">
                                        <CheckCircle2 className="h-3 w-3" /> Livre
                                    </span>
                                ) : isSlugAvailable === false && slug ? (
                                    <span className="text-red-500 text-xs font-bold flex items-center gap-1">
                                        <XCircle className="h-3 w-3" /> Em uso
                                    </span>
                                ) : null}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">E-mail Profissional</Label>
                            <Input id="email" name="email" type="email" placeholder="joao@clinica.com" required className="bg-zinc-50/50" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Senha</Label>
                            <Input id="password" name="password" type="password" placeholder="******" minLength={6} required className="bg-zinc-50/50" />
                        </div>

                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 h-11 text-base shadow-lg shadow-indigo-200" type="submit" disabled={isPending}>
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Criando ambiente...
                                </>
                            ) : (
                                'Começar Teste Grátis'
                            )}
                        </Button>

                        <p className="text-center text-sm text-zinc-500">
                            Já tem uma conta?{' '}
                            <Link href="/login" className="text-indigo-600 hover:text-indigo-800 font-semibold transition-colors">
                                Fazer login
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    )
}
