
'use client'

import { useActionState } from 'react'
import { resetPasswordInd } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

export default function ForgotPasswordPage() {
    const [state, formAction, isPending] = useActionState(resetPasswordInd, null)

    return (
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Recuperar Senha
                </h1>
                <p className="text-sm text-muted-foreground">
                    Digite seu email abaixo para receber um link de redefinição.
                </p>
            </div>

            <div className="grid gap-6">
                <form action={formAction}>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                placeholder="nome@exemplo.com"
                                type="email"
                                autoCapitalize="none"
                                autoComplete="email"
                                autoCorrect="off"
                                disabled={isPending}
                                required
                            />
                        </div>
                        <Button disabled={isPending}>
                            {isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Enviar Link
                        </Button>
                    </div>
                </form>

                {state?.error && (
                    <p className="text-center text-sm text-red-500">{state.error}</p>
                )}
                {state?.success && (
                    <p className="text-center text-sm text-green-500">{state.success}</p>
                )}

                <div className="text-center text-sm text-muted-foreground">
                    <Link
                        href="/login"
                        className="hover:text-primary underline underline-offset-4"
                    >
                        Voltar para o Login
                    </Link>
                </div>
            </div>
        </div>
    )
}
