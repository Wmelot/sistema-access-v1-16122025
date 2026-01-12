
'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { History, Users, Edit2, Loader2, Check } from 'lucide-react'
import { updateTenantResponsible } from '../actions'
import { toast } from 'sonner' // Assuming sonner or useToast

interface TenantResponsibleManagerProps {
    tenantId: string
    maxPros: number
    usedPros: number
    usagePercent: number
    owner: {
        full_name: string | null
        email: string
        role: string
    } | null
}

export function TenantResponsibleManager({ tenantId, maxPros, usedPros, usagePercent, owner }: TenantResponsibleManagerProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    async function handleUpdate() {
        if (!email) return

        setIsLoading(true)
        const result = await updateTenantResponsible(tenantId, email)
        setIsLoading(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Responsável atualizado com sucesso!')
            setIsDialogOpen(false)
            // Optional: Router refresh handled by server action revalidatePath
        }
    }

    return (
        <>
            <Card className="overflow-hidden border-zinc-200 shadow-md">
                <div className="h-1.5 w-full bg-zinc-100">
                    <div className={`h-full ${usagePercent >= 100 ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${usagePercent}%` }} />
                </div>
                <CardHeader>
                    <CardTitle className="text-sm font-bold flex items-center justify-between">
                        Staff & Licenças
                        <span className="text-xs font-normal text-muted-foreground">{usedPros} de {maxPros}</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <div className="flex justify-between text-xs mb-2">
                            <span className={`font-medium ${usagePercent >= 100 ? 'text-red-600' : 'text-blue-600'}`}>
                                {usagePercent.toFixed(0)}% Utilizado
                            </span>
                        </div>
                        <Progress value={usagePercent} className="h-2" />
                    </div>

                    <Separator />

                    <div className="space-y-3 pt-2">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-zinc-100 flex items-center justify-center text-zinc-500">
                                <History className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-zinc-900">Histórico</p>
                                <p className="text-[10px] text-zinc-500">Último login há 2h</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 relative group">
                            <div className="w-8 h-8 rounded bg-indigo-50 flex items-center justify-center text-indigo-500">
                                <Users className="w-4 h-4" />
                            </div>
                            <div className="overflow-hidden flex-1">
                                <Label className="text-xs text-muted-foreground flex justify-between items-center">
                                    Responsável
                                    <button
                                        onClick={() => setIsDialogOpen(true)}
                                        className="text-indigo-600 hover:text-indigo-800 transition-colors p-1"
                                        title="Editar Responsável"
                                    >
                                        <Edit2 className="w-3 h-3" />
                                    </button>
                                </Label>
                                {owner ? (
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm text-zinc-900">{owner.full_name || 'Sem nome'}</span>
                                        <span className="text-xs text-zinc-500 truncate" title={owner.email}>{owner.email}</span>
                                        {owner.role && <Badge variant="outline" className="w-fit mt-1 text-[10px] h-4 px-1">{owner.role}</Badge>}
                                    </div>
                                ) : (
                                    <div className="text-sm text-zinc-400 italic">Não identificado</div>
                                )}
                            </div>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => setIsDialogOpen(true)}
                    >
                        Gerenciar Equipe / Responsável
                    </Button>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Definir Responsável</DialogTitle>
                        <DialogDescription>
                            Insira o e-mail do usuário que assumirá o controle desta clínica.
                            Este usuário receberá permissões de 'Admin' e será vinculado a esta organização.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">E-mail do Responsável</Label>
                            <Input
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="ex: doutor@clinica.com"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleUpdate} disabled={isLoading || !email}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar Alterações
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
