
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
import { updateTenantResponsible, forceSuperAdminClaim } from '../actions'
import { toast } from 'sonner'
import { maskEmail, maskName } from '@/lib/utils/masking'

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
    profiles: any[]
}

export function TenantResponsibleManager({ tenantId, maxPros, usedPros, usagePercent, owner, profiles }: TenantResponsibleManagerProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isListOpen, setIsListOpen] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    async function handleUpdate() {
        if (!email) {
            toast.error('E-mail é obrigatório')
            return
        }
        if (!password) {
            toast.error('Senha master é obrigatória para esta ação')
            return
        }

        setIsLoading(true)
        const result = await updateTenantResponsible(tenantId, email, password)
        setIsLoading(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Responsável atualizado com sucesso!')
            setPassword('')
            setIsDialogOpen(false)
        }
    }

    async function handleForceClaim() {
        if (!confirm('Deseja forçar a responsabilidade desta clínica para seu e-mail master (wmelot@gmail.com)?')) return

        setIsLoading(true)
        const result = await forceSuperAdminClaim(tenantId)
        setIsLoading(false)

        if (result.error) toast.error(result.error)
        else toast.success('Você agora é o responsável por esta clínica!')
    }

    return (
        <>
            <Card className="overflow-hidden border-zinc-200 shadow-md">
                <div className="h-1.5 w-full bg-zinc-100">
                    <div className={`h-full ${usagePercent >= 100 ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${usagePercent}%` }} />
                </div>
                <CardHeader>
                    <CardTitle className="text-sm font-bold flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            Staff & Licenças
                            <button
                                onClick={() => setIsListOpen(true)}
                                className="text-[10px] font-normal text-indigo-600 hover:text-indigo-800 underline decoration-dotted underline-offset-2"
                            >
                                (Ver lista)
                            </button>
                        </div>
                        <span className="text-xs font-normal text-muted-foreground" title="Usuários Ativos / Limite do Plano">
                            {usedPros} de {maxPros}
                        </span>
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

                    <div className="flex flex-col sm:flex-row gap-2 mt-4">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs"
                            onClick={() => setIsDialogOpen(true)}
                        >
                            Gerenciar Equipe / Responsável
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-[10px] text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50"
                            onClick={handleForceClaim}
                            disabled={isLoading}
                        >
                            Assumir Resp.
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Dialog to Set Admin */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Definir Responsável</DialogTitle>
                        <DialogDescription>
                            Insira o e-mail do usuário que assumirá o controle desta clínica.
                            Este usuário receberá permissões de 'Admin' e será vinculado a esta organização.
                            <b> Esta ação requer sua senha master.</b>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">E-mail do novo Responsável</Label>
                            <Input
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="ex: doutor@clinica.com"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Sua Senha Master (Confirmação)</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Digite sua senha administrativa"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleUpdate} disabled={isLoading || !email || !password}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirmar Mudança
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog to List Users */}
            <Dialog open={isListOpen} onOpenChange={setIsListOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Usuários da Clínica ({usedPros})</DialogTitle>
                        <DialogDescription>
                            Listagem de todos os profissionais vinculados a esta organização.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2">
                        {profiles && profiles.length > 0 ? (
                            profiles.map((profile) => (
                                <div key={profile.id} className="flex items-center justify-between p-3 rounded-lg border border-zinc-100 bg-zinc-50/50">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-zinc-900">{profile.full_name || 'Sem nome'}</span>
                                        <span className="text-xs text-zinc-500">{profile.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs capitalize">{profile.role || 'user'}</Badge>
                                        {/* You can add more status indicators here if available */}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-zinc-500 text-sm">
                                Nenhum usuário encontrado (além do sistema).
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsListOpen(false)}>Fechar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
