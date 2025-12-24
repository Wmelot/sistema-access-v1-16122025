"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Fingerprint, Plus, Trash2, Loader2, ShieldCheck, Laptop, Smartphone } from "lucide-react"
import { startRegistration } from "@simplewebauthn/browser"
import { getRegistrationOptions, verifyRegistration, deleteAuthenticator, getAuthenticators } from "@/app/dashboard/security/actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export function SecuritySettings({ authenticators: initialAuth }: { authenticators?: any[] }) {
    const [authenticators, setAuthenticators] = useState<any[]>(initialAuth || [])
    const [isLoadingAuth, setIsLoadingAuth] = useState(true)
    const [isRegistering, setIsRegistering] = useState(false)
    const [isDeleting, setIsDeleting] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        loadAuthenticators()
    }, [])

    const loadAuthenticators = async () => {
        setIsLoadingAuth(true)
        try {
            const data = await getAuthenticators()
            setAuthenticators(data || [])
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoadingAuth(false)
        }
    }

    const handleRegister = async () => {
        setIsRegistering(true)
        try {
            // 1. Get options
            const options = await getRegistrationOptions()
            if ((options as any).error) {
                toast.error("Erro ao iniciar registro.")
                return
            }

            // 2. Browser ceremony
            let attResp
            try {
                attResp = await startRegistration(options as any)
            } catch (error: any) {
                if (error.name === 'NotAllowedError') {
                    toast.error("Cancelado pelo usuário.")
                } else {
                    toast.error("Erro na leitura biométrica.")
                    console.error(error)
                }
                return
            }

            // 3. Verify
            const verification = await verifyRegistration(attResp)
            if (verification.success) {
                toast.success("Biometria adicionada com sucesso!")
                loadAuthenticators()
                router.refresh()
            } else {
                toast.error(verification.error || "Falha ao verificar biometria.")
            }

        } catch (error) {
            console.error(error)
            toast.error("Erro inesperado.")
        } finally {
            setIsRegistering(false)
        }
    }

    const handleDelete = async (id: string) => {
        setIsDeleting(id)
        try {
            const res = await deleteAuthenticator(id)
            if (res.success) {
                toast.success("Chave removida.")
                loadAuthenticators()
                router.refresh()
            } else {
                toast.error("Erro ao remover chave.")
            }
        } catch (err) {
            toast.error("Erro ao remover.")
        } finally {
            setIsDeleting(null)
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Fingerprint className="h-5 w-5 text-primary" />
                                Biometria e Chaves de Acesso
                            </CardTitle>
                            <CardDescription>
                                Gerencie FaceID, TouchID ou chaves de segurança para confirmar ações sensíveis sem senha.
                            </CardDescription>
                        </div>
                        <Button onClick={handleRegister} disabled={isRegistering}>
                            {isRegistering ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Plus className="mr-2 h-4 w-4" />
                            )}
                            Adicionar Nova Chave
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoadingAuth ? (
                        <div className="flex justify-center p-8 text-muted-foreground">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : authenticators.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                            <ShieldCheck className="h-10 w-10 mb-2 opacity-50" />
                            <p>Nenhuma biometria configurada.</p>
                            <p className="text-sm">Adicione uma chave para aumentar a segurança.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Dispositivo</TableHead>
                                    <TableHead>Criado em</TableHead>
                                    <TableHead>Último uso</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {authenticators.map((auth) => (
                                    <TableRow key={auth.id}>
                                        <TableCell className="font-medium flex items-center gap-2">
                                            {auth.transports?.includes('internal') ? (
                                                <Smartphone className="h-4 w-4 text-muted-foreground" />
                                            ) : (
                                                <Laptop className="h-4 w-4 text-muted-foreground" />
                                            )}
                                            {auth.device_name || "Dispositivo de Acesso"}
                                            {auth.credential_device_type === 'singleDevice' && (
                                                <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                                                    Dispositivo Único
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(auth.created_at), "d 'de' MMM, yyyy", { locale: ptBR })}
                                        </TableCell>
                                        <TableCell>
                                            {auth.last_used_at
                                                ? format(new Date(auth.last_used_at), "d 'de' MMM, HH:mm", { locale: ptBR })
                                                : "-"
                                            }
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(auth.id)}
                                                disabled={isDeleting === auth.id}
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                            >
                                                {isDeleting === auth.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
