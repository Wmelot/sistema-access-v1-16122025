"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { signup } from './actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
                <Label htmlFor="full_name" className="font-semibold text-gray-700">Nome Completo</Label>
                <Input
                    id="full_name"
                    name="full_name"
                    type="text"
                    placeholder="Seu Nome"
                    required
                    className="bg-white/80 border-gray-300 h-11 focus:bg-white transition-all shadow-sm"
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="email" className="font-semibold text-gray-700">Email</Label>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    autoComplete="email"
                    required
                    className="bg-white/80 border-gray-300 h-11 focus:bg-white transition-all shadow-sm"
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="password" className="font-semibold text-gray-700">Senha</Label>
                <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="bg-white/80 border-gray-300 h-11 focus:bg-white transition-all shadow-sm"
                />
                <p className="text-xs text-muted-foreground">Mínimo 8 caracteres, maiúscula, minúscula, número e especial (@$!%*?&).</p>
            </div>

            <div className="flex flex-col gap-3 pt-4">
                <Button
                    type="submit"
                    className="w-full h-11 text-base font-semibold shadow-md transition-transform active:scale-95 bg-zinc-900 hover:bg-zinc-800"
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
            <div className="text-center text-sm">
                Já tem uma conta?{" "}
                <Link href="/login" className="font-semibold text-primary hover:underline">
                    Entrar
                </Link>
            </div>
        </form>
    )
}
