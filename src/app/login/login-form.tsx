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
                <Label htmlFor="email" className="font-semibold text-slate-300">Email</Label>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    autoComplete="username"
                    required
                    className="bg-slate-950/50 border-slate-700 h-11 text-white placeholder:text-slate-500 focus:bg-slate-900 transition-all shadow-sm"
                    onDoubleClick={(e) => e.currentTarget.select()} // [NEW] Select all on double click
                />
            </div>
            <div className="grid gap-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="font-semibold text-slate-300">Senha</Label>
                    <Link href="/forgot-password" className="text-sm text-emerald-500 hover:underline hover:text-emerald-400 font-medium">
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
                        className="bg-slate-950/50 border-slate-700 h-11 text-white placeholder:text-slate-500 focus:bg-slate-900 transition-all shadow-sm pr-10"
                        onDoubleClick={(e) => e.currentTarget.select()}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
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
                <Checkbox id="remember" name="remember" className="border-slate-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600" />
                <Label htmlFor="remember" className="text-sm font-medium leading-none text-slate-400 cursor-pointer">
                    Lembrar de mim
                </Label>
            </div>

            <div className="flex flex-col gap-3 pt-4">
                <Button type="submit" className="w-full h-11 text-base font-semibold shadow-emerald-900/20 shadow-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all active:scale-95">
                    Entrar
                </Button>
            </div>
            <div className="text-center text-sm text-slate-400">
                Não tem uma conta?{" "}
                <Link href="/signup" className="font-semibold text-emerald-500 hover:underline hover:text-emerald-400">
                    Criar conta
                </Link>
            </div>
        </form>
    )
}
