"use client"

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
import { Edit, Plus } from "lucide-react"
import { createService, updateService } from "@/app/dashboard/[slug]/services/actions"
import { useState } from "react"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Globe, ShieldCheck } from "lucide-react"
import { CurrencyInput } from "@/components/ui/currency-input"

interface ServiceDialogProps {
    service?: {
        id: string
        name: string
        duration: number
        price: number
        color?: string
        show_online?: boolean
        type?: string
    }
}

export function ServicesDialog({ service }: ServiceDialogProps) {
    const [open, setOpen] = useState(false)
    const [price, setPrice] = useState(service?.price || 0)
    const [showOnline, setShowOnline] = useState(service?.show_online ?? true)
    const [serviceType, setServiceType] = useState(service?.type || 'standard')

    const [isSubmitting, setIsSubmitting] = useState(false)

    async function handleSubmit(formData: FormData) {
        if (isSubmitting) return
        setIsSubmitting(true)
        try {
            const action = service ? updateService.bind(null, service.id) : createService
            const result = await action(formData)

            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success(service ? "Serviço atualizado!" : "Serviço criado!")
                setOpen(false)
            }
        } catch (error) {
            toast.error("Ocorreu um erro inesperado. Tente novamente.")
            console.error(error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {service ? (
                    <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                    </Button>
                ) : (
                    <Button size="sm" className="gap-1">
                        <Plus className="h-3.5 w-3.5" />
                        Novo Serviço
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{service ? 'Editar Serviço' : 'Novo Serviço'}</DialogTitle>
                    <DialogDescription>
                        {service ? 'Atualize os dados do procedimento.' : 'Adicione um procedimento padrão da clínica.'}
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nome do Procedimento</Label>
                        <Input
                            id="name"
                            name="name"
                            placeholder="Ex: Fisioterapia Respiratória"
                            defaultValue={service?.name}
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Descrição para Agenda Online</Label>
                        <textarea
                            id="description"
                            name="description"
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Descreva o serviço para o paciente... (Tempo, indicações, etc)"
                            defaultValue={(service as any)?.description}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="duration">Duração (min)</Label>
                            <Input
                                id="duration"
                                name="duration"
                                type="number"
                                defaultValue={service?.duration || 50}
                                step="5"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="price">Preço (R$)</Label>
                            <CurrencyInput
                                id="price"
                                placeholder="0,00"
                                value={price}
                                onValueChange={(val) => setPrice(val || 0)}
                            />
                            <input type="hidden" name="price" value={price} />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="color">Cor de Identificação</Label>
                        <div className="flex items-center gap-3">
                            <Input
                                id="color"
                                name="color"
                                type="color"
                                defaultValue={service?.color || '#64748b'}
                                className="w-16 h-10 p-1 cursor-pointer"
                            />
                            <span className="text-sm text-muted-foreground">
                                Cor do card na agenda.
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t mt-2">
                        <div className="flex flex-col gap-2">
                            <Label className="flex items-center gap-2">
                                <Globe className="h-3.5 w-3.5 text-primary" />
                                Visibilidade Online
                            </Label>
                            <div className="flex items-center gap-3 mt-1">
                                <Switch
                                    id="show_online"
                                    checked={showOnline}
                                    onCheckedChange={setShowOnline}
                                />
                                <span className="text-xs text-muted-foreground">
                                    {showOnline ? 'Disponível Online' : 'Oculto na Web'}
                                </span>
                                <input type="hidden" name="show_online" value={showOnline ? 'true' : 'false'} />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label className="flex items-center gap-2">
                                <ShieldCheck className="h-3.5 w-3.5 text-orange-500" />
                                Regra Especial
                            </Label>
                            <Select value={serviceType} onValueChange={setServiceType} name="type">
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="standard" className="text-xs">Padrão</SelectItem>
                                    <SelectItem value="insole_adjustment" className="text-xs font-semibold text-orange-600">Ajuste de Palmilha</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Salvando...' : 'Salvar Serviço'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
