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
import { Plus } from "lucide-react"
import { createLocation, updateLocation } from "@/app/dashboard/locations/actions"
import { useState, useEffect } from "react"
import { toast } from "sonner"

interface LocationsDialogProps {
    initialData?: {
        id: string
        name: string
        capacity: number
        color: string
        active: boolean
    }
    open?: boolean
    onOpenChange?: (open: boolean) => void
    trigger?: React.ReactNode
}

export function LocationsDialog({ initialData, open: controlledOpen, onOpenChange: setControlledOpen, trigger }: LocationsDialogProps) {
    const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
    const [selectedColor, setSelectedColor] = useState(initialData?.color || "#3b82f6")

    // Derived state for controlled/uncontrolled
    const isOpen = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen
    const setOpen = setControlledOpen || setUncontrolledOpen

    useEffect(() => {
        if (initialData) {
            setSelectedColor(initialData.color)
        } else {
            setSelectedColor("#3b82f6")
        }
    }, [initialData])

    async function handleSubmit(formData: FormData) {
        formData.set('color', selectedColor)

        let result
        if (initialData) {
            formData.append('id', initialData.id)
            result = await updateLocation(formData)
        } else {
            result = await createLocation(formData)
        }

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success(initialData ? "Local atualizado!" : "Local criado!")
            setOpen(false)
        }
    }

    // Removed unused colors array
    const isEditing = !!initialData

    return (
        <Dialog open={isOpen} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button size="sm" className="gap-1">
                        <Plus className="h-3.5 w-3.5" />
                        Novo Local
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Local" : "Novo Local"}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? "Edite as informações do local." : "Adicione um consultório ou espaço de treino."}
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nome do Local</Label>
                        <Input
                            id="name"
                            name="name"
                            defaultValue={initialData?.name}
                            placeholder="Ex: Consultório 04"
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="capacity">Capacidade (Pacientes simultâneos)</Label>
                        <Input
                            id="capacity"
                            name="capacity"
                            type="number"
                            min="1"
                            defaultValue={initialData?.capacity || 1}
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="color">Cor de Identificação</Label>
                        <div className="flex gap-2 items-center">
                            <Input
                                type="color"
                                id="color"
                                name="color"
                                value={selectedColor}
                                onChange={(e) => setSelectedColor(e.target.value)}
                                className="w-12 h-12 p-1 rounded-md cursor-pointer"
                            />
                            <Input
                                value={selectedColor}
                                onChange={(e) => setSelectedColor(e.target.value)}
                                className="w-32"
                                placeholder="#000000"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit">{isEditing ? "Salvar Alterações" : "Salvar Local"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
