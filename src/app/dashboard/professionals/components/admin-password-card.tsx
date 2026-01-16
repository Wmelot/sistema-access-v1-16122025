"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

export function AdminPasswordCard() {
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)

    async function handleUpdateAdminPassword() {
        if (!password || password.length < 6) {
            toast.error("A senha deve ter no mínimo 6 caracteres")
            return
        }

        setLoading(true)
        try {
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()

            if (!session?.user) {
                toast.error("Usuário não autenticado")
                return
            }
            const user = session.user

            const { error } = await supabase
                .from('profiles')
                .update({ admin_password: password } as any)
                .eq('id', user.id)

            if (error) throw error

            toast.success("Senha administrativa atualizada com sucesso!")
            setPassword("")
        } catch (error: any) {
            console.error('Error updating admin password:', error)
            toast.error("Erro ao atualizar senha administrativa")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="border-orange-500/20">
            <CardHeader>
                <CardTitle>Senha Administrativa</CardTitle>
                <CardDescription>
                    Senha para ações sensíveis (excluir, arquivar). Funciona independente do método de login (FaceID/WebAuthn).
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="admin_password">Nova Senha Administrativa</Label>
                    <Input
                        id="admin_password"
                        type="password"
                        placeholder="Digite a nova senha administrativa"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={6}
                    />
                    <p className="text-xs text-muted-foreground">
                        Esta senha será usada para confirmar exclusões e outras ações sensíveis. Mínimo 6 caracteres.
                    </p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded-md text-sm">
                    <p className="font-semibold text-orange-700 dark:text-orange-400">💡 Dica:</p>
                    <p className="text-orange-600 dark:text-orange-300 mt-1">
                        Se você usa FaceID/WebAuthn para login, esta senha é essencial para ações administrativas como excluir serviços, produtos, etc.
                    </p>
                </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 border-t bg-muted/10 p-4">
                <Button
                    onClick={handleUpdateAdminPassword}
                    variant="outline"
                    className="w-full sm:w-auto self-end"
                    disabled={loading || !password}
                >
                    {loading ? "Salvando..." : "Atualizar Senha Administrativa"}
                </Button>
            </CardFooter>
        </Card>
    )
}
