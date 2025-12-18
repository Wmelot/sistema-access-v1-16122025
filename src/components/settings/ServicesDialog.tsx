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
import { createService, updateService } from "@/app/dashboard/services/actions"
import { useState } from "react"
import { toast } from "sonner"

import { CurrencyInput } from "@/components/ui/currency-input"

interface ServiceDialogProps {
    service?: {
        id: string
        name: string
        duration: number
        price: number
        color?: string
    }
}

export function ServicesDialog({ service }: ServiceDialogProps) {
    const [open, setOpen] = useState(false)
    const [price, setPrice] = useState(service?.price || 0)

    async function handleSubmit(formData: FormData) {
        const action = service ? updateService.bind(null, service.id) : createService
        const result = await action(formData)

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success(service ? "Serviço atualizado!" : "Serviço criado!")
            setOpen(false)
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
                                Escolha uma cor para identificar este serviço na agenda.
                            </span>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit">Salvar Serviço</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
