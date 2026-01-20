"use client"

import { useState, useEffect } from 'react'
import { Building2, Users, Calendar, TrendingUp, Settings, Power, Crown, Shield } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { getAllOrganizations, updateOrganizationPlan, toggleOrganizationStatus, getOrganizationStats } from './actions'

interface Organization {
    id: string
    name: string
    slug: string
    plan: string
    status: string
    created_at: string
    owner: {
        full_name: string
        email: string
        phone: string
    }
    user_count: number
}

export default function MasterDashboard() {
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<Record<string, any>>({})

    useEffect(() => {
        loadOrganizations()
    }, [])

    async function loadOrganizations() {
        setLoading(true)
        const { organizations: orgs, error } = await getAllOrganizations()

        if (error) {
            toast.error('Erro ao carregar organizações')
            setLoading(false)
            return
        }

        setOrganizations(orgs)

        // Carregar stats de cada organização
        const statsPromises = orgs.map((org: Organization) =>
            getOrganizationStats(org.id).then(s => ({ [org.id]: s }))
        )
        const statsArray = await Promise.all(statsPromises)
        const statsObj = Object.assign({}, ...statsArray)
        setStats(statsObj)

        setLoading(false)
    }

    async function handlePlanChange(orgId: string, newPlan: string) {
        const { success, error } = await updateOrganizationPlan(orgId, newPlan)

        if (success) {
            toast.success('Plano atualizado com sucesso!')
            loadOrganizations()
        } else {
            toast.error(error || 'Erro ao atualizar plano')
        }
    }

    async function handleToggleStatus(orgId: string) {
        const { success, error } = await toggleOrganizationStatus(orgId)

        if (success) {
            toast.success('Status atualizado com sucesso!')
            loadOrganizations()
        } else {
            toast.error(error || 'Erro ao atualizar status')
        }
    }

    const totalOrgs = organizations.length
    const activeOrgs = organizations.filter(o => o.status === 'active').length
    const paidOrgs = organizations.filter(o => o.plan !== 'free').length
    const totalUsers = organizations.reduce((sum, org) => sum + org.user_count, 0)

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
                            <Crown className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Painel Master</h1>
                            <p className="text-slate-400">Controle total do sistema AXIOM</p>
                        </div>
                    </div>
                    <Badge variant="outline" className="border-amber-500 text-amber-500 px-4 py-2">
                        <Shield className="h-4 w-4 mr-2" />
                        Acesso Master
                    </Badge>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-slate-900/50 border-slate-700">
                        <CardHeader className="pb-3">
                            <CardDescription className="text-slate-400">Total de Organizações</CardDescription>
                            <CardTitle className="text-3xl text-white">{totalOrgs}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 text-sm text-emerald-500">
                                <Building2 className="h-4 w-4" />
                                <span>{activeOrgs} ativas</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-900/50 border-slate-700">
                        <CardHeader className="pb-3">
                            <CardDescription className="text-slate-400">Organizações Pagas</CardDescription>
                            <CardTitle className="text-3xl text-white">{paidOrgs}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 text-sm text-blue-500">
                                <TrendingUp className="h-4 w-4" />
                                <span>{((paidOrgs / totalOrgs) * 100).toFixed(0)}% conversão</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-900/50 border-slate-700">
                        <CardHeader className="pb-3">
                            <CardDescription className="text-slate-400">Total de Usuários</CardDescription>
                            <CardTitle className="text-3xl text-white">{totalUsers}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 text-sm text-purple-500">
                                <Users className="h-4 w-4" />
                                <span>{(totalUsers / totalOrgs).toFixed(1)} por org</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-900/50 border-slate-700">
                        <CardHeader className="pb-3">
                            <CardDescription className="text-slate-400">MRR Estimado</CardDescription>
                            <CardTitle className="text-3xl text-white">R$ {paidOrgs * 299}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 text-sm text-amber-500">
                                <TrendingUp className="h-4 w-4" />
                                <span>Receita mensal</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Organizations List */}
                <Card className="bg-slate-900/50 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white">Todas as Organizações</CardTitle>
                        <CardDescription className="text-slate-400">
                            Gerencie planos, status e configurações
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8 text-slate-400">Carregando...</div>
                        ) : (
                            <div className="space-y-4">
                                {organizations.map((org) => (
                                    <div
                                        key={org.id}
                                        className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg hover:border-slate-600 transition-all"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <Building2 className="h-5 w-5 text-slate-400" />
                                                    <h3 className="text-lg font-semibold text-white">{org.name}</h3>
                                                    <Badge
                                                        variant={org.status === 'active' ? 'default' : 'secondary'}
                                                        className={org.status === 'active' ? 'bg-emerald-600' : 'bg-slate-600'}
                                                    >
                                                        {org.status === 'active' ? 'Ativa' : 'Inativa'}
                                                    </Badge>
                                                    <Badge variant="outline" className="border-blue-500 text-blue-500">
                                                        {org.plan.toUpperCase()}
                                                    </Badge>
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-slate-500">Owner:</span>
                                                        <p className="text-white">{org.owner?.full_name || 'N/A'}</p>
                                                        <p className="text-slate-400 text-xs">{org.owner?.email}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-500">Usuários:</span>
                                                        <p className="text-white">{org.user_count}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-500">Pacientes:</span>
                                                        <p className="text-white">{stats[org.id]?.patients || 0}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-500">Agendamentos:</span>
                                                        <p className="text-white">{stats[org.id]?.appointments || 0}</p>
                                                    </div>
                                                </div>

                                                <div className="text-xs text-slate-500">
                                                    Criado em: {new Date(org.created_at).toLocaleDateString('pt-BR')}
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <Select
                                                    value={org.plan}
                                                    onValueChange={(value) => handlePlanChange(org.id, value)}
                                                >
                                                    <SelectTrigger className="w-[140px] bg-slate-700 border-slate-600 text-white">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="free">Free</SelectItem>
                                                        <SelectItem value="starter">Starter</SelectItem>
                                                        <SelectItem value="professional">Professional</SelectItem>
                                                        <SelectItem value="enterprise">Enterprise</SelectItem>
                                                    </SelectContent>
                                                </Select>

                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleToggleStatus(org.id)}
                                                    className="border-slate-600 hover:bg-slate-700"
                                                >
                                                    <Power className="h-4 w-4 mr-2" />
                                                    {org.status === 'active' ? 'Desativar' : 'Ativar'}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
