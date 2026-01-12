"use client"

import { login } from './actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from 'next/link'
import { AlertCircle, Eye, EyeOff } from "lucide-react"
import { useState } from "react"

export function LoginForm({ error, message }: { error?: string, message?: string }) {
    const [showPassword, setShowPassword] = useState(false)
    return (
        <form className="space-y-4" action={login}>
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            {message && (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Atenção</AlertTitle>
                    <AlertDescription>{message}</AlertDescription>
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
                    onDoubleClick={(e) => e.currentTarget.select()} // [NEW] Select all on double click
                />
            </div>
            <div className="grid gap-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="font-semibold text-gray-700">Senha</Label>
                    <Link href="/forgot-password" className="text-sm text-primary hover:underline hover:text-primary/80 font-medium">
                        Esqueceu a senha?
                    </Link>
                </div>
                <div className="relative">
                    <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        required
                        className="bg-white/80 border-gray-300 h-11 focus:bg-white transition-all shadow-sm pr-10"
                        onDoubleClick={(e) => e.currentTarget.select()}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        tabIndex={-1}
                    >
                        {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                    </button>
                </div>
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
            <div className="text-center text-sm">
                Não tem uma conta?{" "}
                <Link href="/signup" className="font-semibold text-primary hover:underline">
                    Criar conta
                </Link>
            </div>
        </form>
    )
}
