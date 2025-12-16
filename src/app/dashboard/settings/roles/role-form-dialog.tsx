"use client"

import { useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { createRole, updateRole } from "./actions"
import { toast } from "sonner"
import { Plus, Check, Shield } from "lucide-react"

interface RoleFormDialogProps {
    role?: any // If present, edit mode
    allPermissions: any[]
    trigger?: React.ReactNode
}

export function RoleFormDialog({ role, allPermissions, trigger }: RoleFormDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState(role?.name || "")
    const [description, setDescription] = useState(role?.description || "")

    // Existing permissions for this role?
    // role.permissions array of objects { permission_id, permissions: { code } }
    const initialPerms = role?.permissions?.map((p: any) => p.permission_id) || []
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>(initialPerms)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData()
        formData.set('name', name)
        formData.set('description', description)
        formData.set('permissions', selectedPermissions.join(','))

        const action = role ? updateRole.bind(null, role.id) : createRole
        const result = await action(formData)

        setLoading(false)

        if (result?.error) {
            toast.error(result.error)
            return
        }

        toast.success(role ? "Perfil atualizado!" : "Perfil criado com sucesso!")
        setOpen(false)
        if (!role) {
            // Reset form if create
            setName("")
            setDescription("")
            setSelectedPermissions([])
        }
    }

    const togglePermission = (id: string) => {
        if (selectedPermissions.includes(id)) {
            setSelectedPermissions(prev => prev.filter(p => p !== id))
        } else {
            setSelectedPermissions(prev => [...prev, id])
        }
    }

    // Group permissions by module
    const groupedPermissions = allPermissions.reduce((acc: any, curr: any) => {
        const module = curr.module || 'Outros'
        if (!acc[module]) acc[module] = []
        acc[module].push(curr)
        return acc
    }, {})

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Novo Perfil
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{role ? "Editar Perfil" : "Novo Perfil de Acesso"}</DialogTitle>
                    <DialogDescription>
                        Defina o nome do perfil e selecione as permissões que os usuários com este perfil terão.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-hidden flex flex-col">
                    <div className="grid gap-4 flex-none">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nome do Perfil</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ex: Financeiro"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Descrição</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Breve descrição das responsabilidades..."
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-hidden border rounded-md p-2">
                        <Label className="mb-2 block px-2">Permissões de Acesso</Label>
                        <div className="h-[300px] w-full px-2 overflow-y-auto scrollbar-thin scrollbar-thumb-muted">
                            <div className="space-y-6">
                                {Object.entries(groupedPermissions).map(([module, perms]: [string, any]) => (
                                    <div key={module}>
                                        <h4 className="font-semibold text-sm mb-2 text-primary">{module}</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {perms.map((perm: any) => (
                                                <div key={perm.id} className="flex items-start space-x-2 border p-2 rounded hover:bg-muted/50">
                                                    <Checkbox
                                                        id={perm.id}
                                                        checked={selectedPermissions.includes(perm.id)}
                                                        onCheckedChange={() => togglePermission(perm.id)}
                                                    />
                                                    <div className="grid gap-0.5 leading-none">
                                                        <Label
                                                            htmlFor={perm.id}
                                                            className="text-sm font-medium leading-none cursor-pointer"
                                                        >
                                                            {perm.description || perm.code}
                                                        </Label>
                                                        {/* <p className="text-xs text-muted-foreground">{perm.code}</p> */}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex-none pt-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Salvando..." : "Salvar Perfil"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
