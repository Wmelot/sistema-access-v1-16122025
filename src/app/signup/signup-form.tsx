"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Building2, User, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

import { signup } from './actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TermsContent } from '@/components/terms-content'
import Link from 'next/link'

const MySwal = withReactContent(Swal)

export function SignupForm({ error }: { error?: string }) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    // Se houver erro vindo da URL (ex: redirecionamento do server action), mostra o alerta
    if (error) {
        MySwal.fire({
            icon: 'error',
            title: 'Erro ao criar conta',
            text: error,
            background: '#020617',
            color: '#fff',
            confirmButtonColor: '#059669',
            confirmButtonText: 'Entendi'
        }).then(() => {
            // Limpa o erro da URL para não mostrar novamente ao recarregar
            router.replace('/signup')
        })
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)

        const formData = new FormData(event.currentTarget)

        try {
            await signup(formData)
            // Sucesso é tratado com redirect no server action
        } catch (e: any) {
            if (e.message === 'NEXT_REDIRECT') {
                return
            }
            console.error("Signup error:", e)

            MySwal.fire({
                icon: 'error',
                title: 'Ops!',
                text: e.message || "Erro desconhecido ao criar conta.",
                background: '#020617',
                color: '#fff',
                confirmButtonColor: '#059669'
            })

            setIsLoading(false)
        }
    }

    return (
        <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Informações da Clínica */}
            <div className="space-y-3 pb-2 border-b border-slate-700/50">
                <div className="flex items-center gap-2 text-emerald-500">
                    <Building2 className="h-4 w-4" />
                    <span className="text-sm font-semibold">Informações da Clínica</span>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="clinic_name" className="font-semibold text-slate-300">
                        Nome da Clínica/Consultório
                    </Label>
                    <Input
                        id="clinic_name"
                        name="clinic_name"
                        type="text"
                        placeholder="Ex: Clínica Fisio Saúde"
                        required
                        className="bg-slate-950/50 border-slate-700 h-11 text-white placeholder:text-slate-500 focus:bg-slate-900 transition-all shadow-sm"
                    />
                    <p className="text-xs text-slate-500">
                        Este será o nome da sua organização no sistema
                    </p>
                </div>
            </div>

            {/* Informações Pessoais */}
            <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-emerald-500">
                    <User className="h-4 w-4" />
                    <span className="text-sm font-semibold">Seus Dados</span>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="full_name" className="font-semibold text-slate-300">
                        Nome Completo
                    </Label>
                    <Input
                        id="full_name"
                        name="full_name"
                        type="text"
                        placeholder="Seu nome completo"
                        required
                        className="bg-slate-950/50 border-slate-700 h-11 text-white placeholder:text-slate-500 focus:bg-slate-900 transition-all shadow-sm"
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="email" className="font-semibold text-slate-300">
                        Email
                    </Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="seu@email.com"
                        autoComplete="email"
                        required
                        className="bg-slate-950/50 border-slate-700 h-11 text-white placeholder:text-slate-500 focus:bg-slate-900 transition-all shadow-sm"
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="phone" className="font-semibold text-slate-300">
                        Telefone
                    </Label>
                    <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="(00) 00000-0000"
                        required
                        className="bg-slate-950/50 border-slate-700 h-11 text-white placeholder:text-slate-500 focus:bg-slate-900 transition-all shadow-sm"
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="password" className="font-semibold text-slate-300">
                        Senha
                    </Label>
                    <PasswordInput
                        id="password"
                        name="password"
                        autoComplete="new-password"
                        required
                        className="bg-slate-950/50 border-slate-700 h-11 text-white placeholder:text-slate-500 focus:bg-slate-900 transition-all shadow-sm"
                    />
                    <p className="text-xs text-slate-500">
                        Mínimo 8 caracteres, maiúscula, minúscula, número e especial (@$!%*?&).
                    </p>
                </div>
            </div>

            {/* Termos e Condições com Modal */}
            <div className="space-y-3 pt-2 border-t border-slate-700/50">
                <div className="flex items-start gap-3">
                    <input
                        type="checkbox"
                        id="terms"
                        name="terms"
                        required
                        className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-800 text-emerald-600 focus:ring-emerald-500"
                    />
                    <label htmlFor="terms" className="text-sm text-slate-300">
                        Li e aceito os{" "}
                        <Dialog>
                            <DialogTrigger asChild>
                                <button type="button" className="text-emerald-500 hover:underline font-semibold focus:outline-none">
                                    Termos e Condições de Uso
                                </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[85vh] bg-slate-950 border-slate-800 text-slate-200">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold text-white">Termos e Condições de Uso</DialogTitle>
                                </DialogHeader>
                                <ScrollArea className="h-full max-h-[60vh] pr-4 mt-2 border-t border-b border-slate-800 py-4">
                                    <TermsContent />
                                </ScrollArea>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button type="button" variant="secondary" className="bg-slate-800 text-white hover:bg-slate-700">
                                            Fechar e Continuar
                                        </Button>
                                    </DialogClose>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                        , incluindo a{" "}
                        <strong className="text-amber-400">
                            exclusão automática de dados após 60 dias
                        </strong>
                        {" "}caso não migre para um plano pago.
                    </label>
                </div>
                <div className="bg-amber-950/20 border border-amber-900/30 rounded-lg p-3">
                    <p className="text-xs text-amber-200/80">
                        ⚠️ <strong>IMPORTANTE:</strong> Dados em plano trial serão excluídos permanentemente
                        após 60 dias. Você receberá avisos por email antes da exclusão.
                    </p>
                </div>
            </div>

            {/* Informações sobre o plano */}
            <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-sm font-semibold text-emerald-400">Plano Gratuito</span>
                </div>
                <p className="text-xs text-slate-400">
                    Você começará com o plano <strong className="text-white">FREE</strong> para testar o sistema.
                    Depois você pode fazer upgrade para planos pagos com mais recursos.
                </p>
            </div>

            <div className="flex flex-col gap-3 pt-4">
                <Button
                    type="submit"
                    className="w-full h-11 text-base font-semibold shadow-emerald-900/20 shadow-lg transition-transform active:scale-95 bg-emerald-600 hover:bg-emerald-500 text-white"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Criando sua conta...
                        </>
                    ) : (
                        "Criar Conta Grátis"
                    )}
                </Button>
            </div>

            <div className="text-center text-sm text-slate-400">
                Já tem uma conta?{" "}
                <Link href="/login" className="font-semibold text-emerald-500 hover:underline hover:text-emerald-400">
                    Entrar
                </Link>
            </div>

            <p className="text-xs text-center text-slate-500 pt-2">
                Ao criar uma conta, você concorda com nossos Termos de Uso e Política de Privacidade
            </p>
        </form>
    )
}
