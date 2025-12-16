"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Plus, Trash2, Edit2, BadgePercent, Coins } from "lucide-react"
import { toast } from "sonner"
import { getCommissionRules, upsertCommissionRule, deleteCommissionRule } from "../actions"
import { getServices } from "../../services/actions"

interface CommissionSettingsProps {
    profileId: string
}

export function CommissionSettings({ profileId }: CommissionSettingsProps) {
    const [rules, setRules] = useState<any[]>([])
    const [services, setServices] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [saving, setSaving] = useState(false)

    // Form State
    const [selectedServices, setSelectedServices] = useState<string[]>([])
    const [ruleType, setRuleType] = useState<'percentage' | 'fixed'>('percentage')
    const [ruleValue, setRuleValue] = useState('')
    const [calcBasis, setCalcBasis] = useState<'gross' | 'net'>('gross')

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        const [r, s] = await Promise.all([
            getCommissionRules(profileId),
            getServices()
        ])
        setRules(r || [])
        setServices(s || [])
        setLoading(false)
    }

    const handleOpenNew = () => {
        setSelectedServices(['default']) // Default to general rule
        setRuleType('percentage')
        setRuleValue('')
        setCalcBasis('gross')
        setIsDialogOpen(true)
    }

    const handleEdit = (rule: any) => {
        setSelectedServices(rule.service_id ? [rule.service_id] : ['default'])
        setRuleType(rule.type)
        setRuleValue(rule.value)
        setCalcBasis(rule.calculation_basis || 'gross')
        setIsDialogOpen(true)
    }

    const toggleService = (id: string) => {
        setSelectedServices(prev =>
            prev.includes(id)
                ? prev.filter(x => x !== id)
                : [...prev, id]
        )
    }

    const handleSave = async () => {
        if (!ruleValue) {
            toast.error("Informe o valor.")
            return
        }
        if (selectedServices.length === 0) {
            toast.error("Selecione pelo menos um serviço ou a regra padrão.")
            return
        }

        setSaving(true)

        const promises = selectedServices.map(svcId => {
            return upsertCommissionRule(profileId, {
                service_id: svcId === 'default' ? null : svcId,
                type: ruleType,
                value: Number(ruleValue),
                calculation_basis: calcBasis
            })
        })

        const results = await Promise.all(promises)
        setSaving(false)

        const error = results.find(r => r?.error)
        if (error) {
            toast.error(error.error)
        } else {
            toast.success(`${selectedServices.length} regra(s) salva(s)!`)
            setIsDialogOpen(false)
            loadData()
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Remover regra?")) return
        await deleteCommissionRule(id)
        toast.success("Removido")
        loadData()
    }

    const defaultRule = rules.find(r => r.service_id === null)
    const specificRules = rules.filter(r => r.service_id !== null)

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Configuração de Comissões</h3>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={handleOpenNew}>
                            <Plus className="mr-2 h-4 w-4" /> Nova Regra
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Configurar Comissão</DialogTitle>
                            <DialogDescription>Defina quanto o profissional ganha.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">

                            <div className="space-y-3">
                                <Label>Aplicar em:</Label>
                                <div className="border rounded-md p-3 max-h-[200px] overflow-y-auto space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="svc-default"
                                            checked={selectedServices.includes('default')}
                                            onCheckedChange={() => toggleService('default')}
                                        />
                                        <label htmlFor="svc-default" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            ⭐ Padrão (Todos os serviços)
                                        </label>
                                    </div>
                                    {services.map(s => (
                                        <div key={s.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`svc-${s.id}`}
                                                checked={selectedServices.includes(s.id)}
                                                onCheckedChange={() => toggleService(s.id)}
                                            />
                                            <label htmlFor={`svc-${s.id}`} className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                {s.name}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground">Selecione múltiplos serviços para criar várias regras de uma vez.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Tipo</Label>
                                    <Select
                                        value={ruleType}
                                        onValueChange={(v: 'percentage' | 'fixed') => setRuleType(v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                                            <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Valor</Label>
                                    <Input
                                        type="number"
                                        placeholder={ruleType === 'percentage' ? 'Ex: 40' : 'Ex: 100.00'}
                                        value={ruleValue}
                                        onChange={(e) => setRuleValue(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Base de Cálculo</Label>
                                <Select
                                    value={calcBasis}
                                    onValueChange={(v: 'gross' | 'net') => setCalcBasis(v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="gross">Sobre Valor Bruto (Total)</SelectItem>
                                        <SelectItem value="net">Sobre Valor Líquido (Descontar Taxas)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    {calcBasis === 'net'
                                        ? "O sistema irá descontar a taxa do cartão/meio de pagamento antes de calcular."
                                        : "O cálculo será feito sobre o valor total do atendimento."}
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar Regras'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Regra Padrão</CardTitle>
                    <CardDescription>Aplicada quando não houver regra específica.</CardDescription>
                </CardHeader>
                <CardContent>
                    {defaultRule ? (
                        <div className="flex items-center justify-between p-2 border rounded-md bg-secondary/20">
                            <div className="flex items-center gap-2">
                                {defaultRule.type === 'percentage' ? <BadgePercent className="h-5 w-5 text-blue-500" /> : <Coins className="h-5 w-5 text-green-500" />}
                                <div className="flex flex-col">
                                    <span className="font-semibold text-lg">
                                        {defaultRule.type === 'percentage' ? `${defaultRule.value}%` : `R$ ${defaultRule.value}`}
                                    </span>
                                    <span className="text-muted-foreground text-xs">
                                        {defaultRule.calculation_basis === 'net' ? 'sobre Valor Líquido' : 'sobre Valor Bruto'}
                                    </span>
                                </div>
                                <span className="text-muted-foreground text-sm ml-2">sobre todos os serviços</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(defaultRule)}>
                                <Edit2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <div className="text-sm text-yellow-600 border border-yellow-200 bg-yellow-50 p-3 rounded-md">
                            ⚠️ Nenhuma regra padrão definida. O profissional não receberá comissão a menos que especificado por serviço.
                        </div>
                    )}
                </CardContent>
            </Card>

            {specificRules.length > 0 && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Regras Específicas</CardTitle>
                        <CardDescription>Exceções para serviços específicos.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Serviço</TableHead>
                                    <TableHead>Comissão</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {specificRules.map(rule => (
                                    <TableRow key={rule.id}>
                                        <TableCell className="font-medium">{rule.service?.name}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span>{rule.type === 'percentage' ? `${rule.value}%` : `R$ ${rule.value}`}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {rule.calculation_basis === 'net' ? '(Líquido)' : '(Bruto)'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(rule)}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(rule.id)}>
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
