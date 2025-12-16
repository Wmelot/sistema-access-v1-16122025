import { login, signup } from './actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Image from 'next/image'

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string; message?: string }>
}) {
    const params = await searchParams
    return (
        <div className="flex min-h-screen bg-white">
            {/* Left Side - Hero Image */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900">
                <Image
                    src="/login_background.png"
                    alt="Access Fisio Background"
                    fill
                    className="object-cover opacity-60 mix-blend-overlay"
                    priority
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-white z-10">
                    <div className="w-64 h-64 relative mb-8">
                        {/* Using the user provided logo, assuming it contrasts well or using a brightness filter */}
                        <Image
                            src="/logo_login_transparent.png"
                            alt="Access Logo"
                            fill
                            className="object-contain drop-shadow-lg"
                        />
                    </div>
                    <div className="text-center space-y-4 max-w-md">
                        <h1 className="text-4xl font-bold tracking-tight">Bem-vindo de volta!</h1>
                        <p className="text-lg text-gray-200">
                            Gerencie sua clínica com eficiência e segurança. O Sistema Access Fisio foi feito para você.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24 w-full lg:w-1/2">
                <div className="mx-auto w-full max-w-sm lg:w-96 space-y-8">
                    <div className="flex flex-col space-y-2 text-center lg:text-left">
                        {/* Mobile Logo shows here */}
                        <div className="lg:hidden mx-auto h-24 w-24 relative mb-4">
                            <Image src="/logo_login.png" alt="Access Logo" fill className="object-contain" />
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                            Acesse sua conta
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Digite suas credenciais abaixo
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
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    required
                                    className="bg-gray-50 h-11"
                                />
                            </div>
                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Senha</Label>
                                    {/* <a href="#" className="text-sm text-primary hover:underline">Esqueceu?</a> */}
                                </div>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="bg-gray-50 h-11"
                                />
                            </div>
                            <div className="flex flex-col gap-3 pt-2">
                                <Button type="submit" className="w-full h-11 text-base">
                                    Entrar
                                </Button>
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-white px-2 text-muted-foreground">
                                            Ou
                                        </span>
                                    </div>
                                </div>
                                <Button formAction={signup} variant="outline" className="w-full h-11">
                                    Criar nova conta
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
