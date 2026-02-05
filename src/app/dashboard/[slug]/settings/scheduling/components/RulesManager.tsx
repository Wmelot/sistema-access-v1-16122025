'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Trash2, Plus, AlertCircle, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { SchedulingRule, createSchedulingRule, deleteSchedulingRule, toggleRuleStatus } from "../actions"
import { cn } from "@/lib/utils"
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

interface RulesManagerProps {
    rules: SchedulingRule[]
    professionals: { id: string, full_name: string }[]
    locations: { id: string, name: string }[]
}

export function RulesManager({ rules, professionals, locations }: RulesManagerProps) {
    const [loading, setLoading] = useState(false)
    const [openForm, setOpenForm] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        const res = await createSchedulingRule(formData)
        if (res.success) {
            toast.success("Regra criada com sucesso!")
            setOpenForm(false)
        } else {
            toast.error(res.error || "Erro ao criar regra")
        }
        setLoading(false)
    }

    async function handleDelete(id: string) {
        const result = await MySwal.fire({
            title: 'Excluir Regra?',
            text: "Tem certeza que deseja excluir esta regra de alocação?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Sim, excluir',
            cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) return
        await deleteSchedulingRule(id)
        toast.success("Regra excluída")
    }

    async function handleToggle(id: string, current: boolean) {
        await toggleRuleStatus(id, !current)
        toast.success("Status atualizado")
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Regras de Alocação de Sala</CardTitle>
                    <CardDescription>Defina onde cada atendimento deve ser realizado automaticamente.</CardDescription>
                </div>
                <Button onClick={() => setOpenForm(!openForm)} variant={openForm ? "secondary" : "default"}>
                    {openForm ? "Cancelar" : <><Plus className="w-4 h-4 mr-2" /> Nova Regra</>}
                </Button>
            </CardHeader>
            <CardContent>
                {openForm && (
                    <form action={handleSubmit} className="mb-8 p-4 border rounded-lg bg-gray-50 space-y-4 animate-in slide-in-from-top-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Nome da Regra</Label>
                                <Input name="name" placeholder="Ex: Fisioterapia Pélvica -> Sala 1" required />
                            </div>
                            <div className="space-y-2">
                                <Label>Prioridade (Maior vence)</Label>
                                <Input name="priority" type="number" defaultValue="0" min="0" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white rounded border">
                            <div className="space-y-2">
                                <Label className="text-xs uppercase text-gray-500 font-bold">SE Profissional for:</Label>
                                <Select name="professional_id" defaultValue="all">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Qualquer Profissional" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Qualquer Profissional</SelectItem>
                                        {professionals.map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs uppercase text-gray-500 font-bold">E Serviço contiver:</Label>
                                <Input name="service_keyword" placeholder="Ex: Pélvica, Consulta (Opcional)" />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs uppercase text-emerald-600 font-bold">ENTÃO ALOCAR EM:</Label>
                                <Select name="location_id" required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione a Sala..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {locations.map(l => (
                                            <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={loading}>
                                {loading ? "Salvando..." : "Salvar Regra"}
                            </Button>
                        </div>
                    </form>
                )}

                {/* Desktop view */}
                <div className="hidden md:block rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Status</TableHead>
                                <TableHead>Prioridade</TableHead>
                                <TableHead>Regra (SE...)</TableHead>
                                <TableHead>Destino (ENTÃO...)</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rules.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                        Nenhuma regra definida. O sistema usará a lógica padrão de ocupação.
                                    </TableCell>
                                </TableRow>
                            ) : rules.map((rule) => (
                                <TableRow key={rule.id} className={!rule.is_active ? "opacity-50" : ""}>
                                    <TableCell>
                                        <Switch
                                            checked={rule.is_active}
                                            onCheckedChange={() => handleToggle(rule.id, rule.is_active)}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium text-center">{rule.priority}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-sm">
                                            <span className="font-semibold">{rule.name}</span>
                                            <span className="text-gray-500 text-xs">
                                                {rule.profiles ? `Prof: ${rule.profiles.full_name}` : 'Qualquer Prof.'}
                                                {rule.service_keyword ? ` + Contém "${rule.service_keyword}"` : ''}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center text-emerald-600 font-medium">
                                            <ArrowRight className="w-4 h-4 mr-2" />
                                            {rule.locations?.name || 'Local Desconhecido'}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(rule.id)}>
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile view */}
                <div className="md:hidden space-y-4">
                    {rules.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 border rounded-lg border-dashed">
                            Nenhuma regra definida.
                        </div>
                    ) : rules.map((rule) => (
                        <div key={rule.id} className={cn(
                            "p-4 rounded-xl border bg-slate-50/50 space-y-4 relative",
                            !rule.is_active && "opacity-60"
                        )}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={rule.is_active}
                                        onCheckedChange={() => handleToggle(rule.id, rule.is_active)}
                                    />
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        {rule.is_active ? 'Ativa' : 'Inativa'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border text-xs font-bold">
                                    <span className="text-slate-400">Prio:</span>
                                    <span>{rule.priority}</span>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="font-bold text-slate-800">{rule.name}</div>
                                <div className="text-xs text-slate-500 leading-relaxed">
                                    <span className="font-semibold text-slate-400">SE:</span> {rule.profiles ? rule.profiles.full_name : 'Qualquer Prof.'}
                                    {rule.service_keyword && ` + "${rule.service_keyword}"`}
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                <div className="flex items-center text-emerald-600 font-bold text-sm">
                                    <ArrowRight className="w-4 h-4 mr-1.5" />
                                    {rule.locations?.name || 'Local?'}
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => handleDelete(rule.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
