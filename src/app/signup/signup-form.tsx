"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { signup } from './actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function SignupForm({ error }: { error?: string }) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [localError, setLocalError] = useState<string | null>(error || null)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)
        setLocalError(null)

        const formData = new FormData(event.currentTarget)

        try {
            await signup(formData)
        } catch (e: any) {
            if (e.message === 'NEXT_REDIRECT') {
                return
            }
            console.error("Signup error:", e)
            setLocalError(e.message || "Erro desconhecido ao criar conta.")
            setIsLoading(false)
        }
    }

    return (
        <form className="space-y-4" onSubmit={handleSubmit}>
            {localError && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{localError}</AlertDescription>
                </Alert>
            )}

            <div className="grid gap-2">
                <Label htmlFor="full_name" className="font-semibold text-slate-300">Nome Completo</Label>
                <Input
                    id="full_name"
                    name="full_name"
                    type="text"
                    placeholder="Seu Nome"
                    required
                    className="bg-slate-950/50 border-slate-700 h-11 text-white placeholder:text-slate-500 focus:bg-slate-900 transition-all shadow-sm"
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="email" className="font-semibold text-slate-300">Email</Label>
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
                <Label htmlFor="password" className="font-semibold text-slate-300">Senha</Label>
                <PasswordInput
                    id="password"
                    name="password"
                    autoComplete="new-password"
                    required
                    className="bg-slate-950/50 border-slate-700 h-11 text-white placeholder:text-slate-500 focus:bg-slate-900 transition-all shadow-sm"
                />
                <p className="text-xs text-slate-500">Mínimo 8 caracteres, maiúscula, minúscula, número e especial (@$!%*?&).</p>
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
                            Criando...
                        </>
                    ) : (
                        "Criar Conta"
                    )}
                </Button>
            </div>
            <div className="text-center text-sm text-slate-400">
                Já tem uma conta?{" "}
                <Link href="/login" className="font-semibold text-emerald-500 hover:underline hover:text-emerald-400">
                    Entrar
                </Link>
            </div>
        </form>
    )
}
