'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { migrateFeegowPatients } from "./feegow-actions"
import { Database, Loader2, CheckCircle, AlertTriangle } from "lucide-react"

export function FeegowMigrationDialog() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [token, setToken] = useState("")
    const [deepMode, setDeepMode] = useState(false)
    const [result, setResult] = useState<any>(null)

    // Try to load from env if available (simulated by passing specific flag or just handling in server)
    // Ideally we don't expose server env to client directly unless public.
    // We'll let the user paste it, or use a "Use Configured Token" button if we wanted.
    // For now, manual paste as requested + env check on server.

    async function handleStart() {
        setLoading(true)
        setResult(null)

        // Pass token. If empty, server checks process.env
        const res = await migrateFeegowPatients(token, deepMode)
        setResult(res)
        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-full gap-2" variant="outline">
                    <Database className="h-4 w-4" />
                    Migrar da Feegow
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Importar Pacientes (Feegow)</DialogTitle>
                    <DialogDescription>
                        Traga seus pacientes automaticamente para o Access.
                        Insira seu token de API abaixo.
                    </DialogDescription>
                </DialogHeader>

                {!result ? (
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="token" className="text-right">
                                Token
                            </Label>
                            <Input
                                id="token"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                placeholder="Cole seu x-access-token..."
                                className="col-span-3"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground ml-auto pl-10">
                            * Deixe em branco para usar a chave configurada no sistema (env).
                        </p>
                        <div className="flex items-center space-x-2 pl-10 pt-2">
                            <input
                                type="checkbox"
                                id="deepMode"
                                checked={deepMode}
                                onChange={(e) => setDeepMode(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor="deepMode" className="text-sm cursor-pointer">
                                Buscar CPF completo (Modo Lento 🐢)
                            </Label>
                        </div>
                    </div>
                ) : (
                    <div className="py-4 space-y-3">
                        {result.success ? (
                            <div className="flex items-center gap-2 text-green-600 font-bold bg-green-50 p-3 rounded">
                                <CheckCircle className="h-5 w-5" />
                                <span>Migração Concluída!</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-red-600 font-bold bg-red-50 p-3 rounded">
                                <AlertTriangle className="h-5 w-5" />
                                <span>Erro na Migração</span>
                            </div>
                        )}

                        <div className="text-sm space-y-1 border rounded p-3 bg-slate-50">
                            <div className="flex justify-between">
                                <span>Total Encontrado:</span>
                                <strong>{result.total}</strong>
                            </div>
                            <div className="flex justify-between text-green-700">
                                <span>Importados:</span>
                                <strong>{result.imported}</strong>
                            </div>
                            <div className="flex justify-between text-amber-700">
                                <span>Pularam (Já existe):</span>
                                <strong>{result.skipped}</strong>
                            </div>
                            {result.updated > 0 && (
                                <div className="flex justify-between text-blue-700">
                                    <span>Atualizados (CPF):</span>
                                    <strong>{result.updated}</strong>
                                </div>
                            )}
                        </div>

                        {result.errors.length > 0 && (
                            <div className="bg-red-50 p-2 rounded text-xs text-red-600 max-h-[100px] overflow-auto">
                                <strong>Erros:</strong>
                                <ul className="list-disc pl-4 mt-1">
                                    {result.errors.map((e: string, i: number) => (
                                        <li key={i}>{e}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter>
                    {!result && (
                        <Button type="submit" onClick={handleStart} disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Importando...
                                </>
                            ) : (
                                "Iniciar Migração"
                            )}
                        </Button>
                    )}
                    {result && <Button onClick={() => setOpen(false)}>Fechar</Button>}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
