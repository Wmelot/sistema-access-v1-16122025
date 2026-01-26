'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    LayoutGrid,
    List,
    SortAsc,
    Trash2,
    Users,
    Package,
    Check,
    X,
    MoreHorizontal,
    Search
} from "lucide-react"
import { PlanEditor } from "../../plans/plan-editor"
import { deletePlan } from "../../plans/actions"
import { toast } from "sonner"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export function PlansManager({ initialPlans }: { initialPlans: any[] }) {
    const [plans, setPlans] = useState(initialPlans)
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [sortBy, setSortBy] = useState<'name' | 'price' | 'date'>('name')
    const [searchTerm, setSearchTerm] = useState('')

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Tem certeza que deseja apagar o plano "${name}"?`)) return

        const res = await deletePlan(id)
        if (res.success) {
            toast.success("Plano removido com sucesso!")
            setPlans(prev => prev.filter(p => p.id !== id))
        } else {
            toast.error(res.error || "Erro ao apagar plano")
        }
    }

    const filteredAndSortedPlans = [...plans]
        .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === 'name') return a.name.localeCompare(b.name)
            if (sortBy === 'price') return (a.price_monthly || 0) - (b.price_monthly || 0)
            if (sortBy === 'date') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            return 0
        })

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
                        <Input
                            placeholder="Buscar plano..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
                    <div className="flex items-center bg-zinc-100 p-1 rounded-lg border">
                        <Button
                            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                            size="sm"
                            className={`h-8 px-3 ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                            onClick={() => setViewMode('grid')}
                        >
                            <LayoutGrid className="w-4 h-4 mr-2" />
                            Grade
                        </Button>
                        <Button
                            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                            size="sm"
                            className={`h-8 px-3 ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                            onClick={() => setViewMode('list')}
                        >
                            <List className="w-4 h-4 mr-2" />
                            Lista
                        </Button>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-10">
                                <SortAsc className="w-4 h-4 mr-2" />
                                Ordenar
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSortBy('name')}>Por Nome (A-Z)</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortBy('price')}>Por Preço</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortBy('date')}>Por Data de Criação</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <PlanEditor mode="create" />
                </div>
            </div>

            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAndSortedPlans.map((plan: any) => (
                        <Card key={plan.id} className={`flex flex-col relative overflow-hidden transition-all hover:shadow-md ${!plan.is_active ? 'opacity-60 bg-zinc-50' : ''}`}>
                            {!plan.is_active && (
                                <div className="absolute top-0 right-0 bg-zinc-500 text-white text-[10px] px-2 py-0.5 font-bold">INATIVO</div>
                            )}
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                                        <CardDescription className="font-mono text-[10px] uppercase tracking-widest mt-1">{plan.slug}</CardDescription>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                className="text-red-600 focus:text-red-700 focus:bg-red-50"
                                                onClick={() => handleDelete(plan.id, plan.name)}
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Apagar Plano
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-4">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-bold">R$ {plan.price_monthly || 0}</span>
                                    <span className="text-zinc-500 text-xs">/mês</span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 py-2 border-y border-zinc-100">
                                    <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                                        <Users className="w-3.5 h-3.5" />
                                        <span>{plan.max_professionals} Profs.</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                                        <Package className="w-3.5 h-3.5" />
                                        <span>{plan.max_patients === 999999 ? 'Ilimitado' : `${plan.max_patients} Pac.`}</span>
                                    </div>
                                </div>

                                <div className="space-y-1.5 mt-2">
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter mb-2">Recursos Principais</p>
                                    <FeatureCheck label="Agenda" active={!!plan.features.agenda_module} />
                                    <FeatureCheck label="Financeiro" active={!!plan.features.financial_module} />
                                    <FeatureCheck label="IA Assistant" active={!!plan.features.ai_assistant} />
                                    <FeatureCheck label="WhatsApp" active={!!plan.features.whatsapp_integration} />
                                </div>
                            </CardContent>
                            <CardFooter className="pt-4 border-t bg-zinc-50/50 mt-auto">
                                <PlanEditor mode="edit" plan={plan} />
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Plano</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Preço</TableHead>
                                <TableHead>Limites</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAndSortedPlans.map((plan: any) => (
                                <TableRow key={plan.id}>
                                    <TableCell>
                                        <div className="font-medium">{plan.name}</div>
                                        <div className="text-xs text-zinc-500 font-mono">{plan.slug}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                                            {plan.is_active ? 'Ativo' : 'Rascunho'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>R$ {plan.price_monthly}/mês</TableCell>
                                    <TableCell className="text-xs text-zinc-500">
                                        {plan.max_professionals} Profs / {plan.max_patients} Pac.
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <PlanEditor mode="edit" plan={plan} />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleDelete(plan.id, plan.name)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            )}
        </div>
    )
}

function FeatureCheck({ label, active }: { label: string, active: boolean }) {
    return (
        <div className="flex items-center gap-2 text-xs">
            {active ? (
                <Check className="w-3 h-3 text-green-500" />
            ) : (
                <X className="w-3 h-3 text-zinc-300" />
            )}
            <span className={active ? 'text-zinc-700' : 'text-zinc-400'}>{label}</span>
        </div>
    );
}
