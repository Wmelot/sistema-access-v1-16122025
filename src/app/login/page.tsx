import { login } from './actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Image from 'next/image'
import Link from 'next/link'
import { Checkbox } from "@/components/ui/checkbox"

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string; message?: string }>
}) {
    const params = await searchParams
    return (
        <div className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-white py-12">
            {/* Background Image - Flipped horizontally */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/login-bg-final.jpg"
                    alt="Access Fisio Background"
                    fill
                    className="object-cover"
                    priority
                    quality={100}
                />
            </div>

            {/* Overlay Gradient (Optional, for better text readability if needed) */}
            {/* <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20 z-0 pointer-events-none" /> */}

            {/* Content Container - Aligned to Right via flex-end on desktop */}
            <div className="relative z-10 w-full px-4 lg:px-0 flex justify-center lg:justify-end">
                <div className="w-full max-w-sm lg:mr-32 space-y-8 bg-white/0 p-0 sm:p-8 rounded-xl backdrop-blur-none">
                    <div className="flex flex-col space-y-2 text-center lg:text-left">
                        {/* Logo removed as per user request (present in background) */}
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                            Acesse sua conta
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Digite suas credenciais para continuar
                        </p>
                    </div>

                    <div className="grid gap-6">
                        <form className="space-y-4" action={login}>
                            {params?.error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Erro</AlertTitle>
                                    <AlertDescription>{params.error}</AlertDescription>
                                </Alert>
                            )}
                            {params?.message && (
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Atenção</AlertTitle>
                                    <AlertDescription>{params.message}</AlertDescription>
                                </Alert>
                            )}
                            <div className="grid gap-2">
                                <Label htmlFor="email" className="font-semibold text-gray-700">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    autoComplete="username"
                                    required
                                    className="bg-white/80 border-gray-300 h-11 focus:bg-white transition-all shadow-sm"
                                />
                            </div>
                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="font-semibold text-gray-700">Senha</Label>
                                    <Link href="/forgot-password" className="text-sm text-primary hover:underline hover:text-primary/80 font-medium">
                                        Esqueceu a senha?
                                    </Link>
                                </div>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="bg-white/80 border-gray-300 h-11 focus:bg-white transition-all shadow-sm"
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox id="remember" name="remember" className="border-gray-400" />
                                <Label htmlFor="remember" className="text-sm font-medium leading-none text-gray-600 cursor-pointer">
                                    Lembrar de mim
                                </Label>
                            </div>

                            <div className="flex flex-col gap-3 pt-4">
                                <Button type="submit" className="w-full h-11 text-base font-semibold shadow-md transition-transform active:scale-95">
                                    Entrar
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
