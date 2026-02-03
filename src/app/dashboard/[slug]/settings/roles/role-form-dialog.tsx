"use client"

import { useState, useEffect } from "react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createRole, updateRole, getRoleMembers, getAllProfiles, updateRoleMembers } from "./actions"
import { toast } from "sonner"
import { Plus, Check, Shield, User, Loader2 } from "lucide-react"

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

    // Permissions logic
    const initialPerms = role?.permissions?.map((p: any) => p.permission_id) || []
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>(initialPerms)

    // Members Logic
    const [activeTab, setActiveTab] = useState("general")
    const [profiles, setProfiles] = useState<any[]>([])
    const [selectedMembers, setSelectedMembers] = useState<string[]>([])
    const [membersLoading, setMembersLoading] = useState(false)

    useEffect(() => {
        if (open && role && activeTab === "members") {
            loadMembersData()
        }
    }, [open, role, activeTab])

    const loadMembersData = async () => {
        setMembersLoading(true)
        try {
            const [allProfs, currentMembers] = await Promise.all([
                getAllProfiles(),
                getRoleMembers(role.id)
            ])
            setProfiles(allProfs)
            setSelectedMembers(currentMembers.map((m: any) => m.id))
        } catch (error) {
            toast.error("Erro ao carregar membros")
        } finally {
            setMembersLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // 1. Update/Create Role + Permissions within same transaction-ish logic
            const formData = new FormData()
            formData.set('name', name)
            formData.set('description', description)
            formData.set('permissions', selectedPermissions.join(','))

            const action = role ? updateRole.bind(null, role.id) : createRole
            const result = await action(formData)

            if (result?.error) {
                toast.error(result.error)
                return
            }

            // 2. Update Members if in edit mode (Create mode doesn't support members yet in this UI flow)
            if (role) {
                const membersResult = await updateRoleMembers(role.id, selectedMembers)
                if (membersResult.error) {
                    toast.error("Role salvo, mas erro ao atualizar membros: " + membersResult.error)
                } else {
                    toast.success("Perfil e membros atualizados!")
                }
            } else {
                toast.success("Perfil criado com sucesso!")
            }

            setOpen(false)
            if (!role) {
                setName("")
                setDescription("")
                setSelectedPermissions([])
            }
        } catch (err) {
            toast.error("Erro inesperado")
        } finally {
            setLoading(false)
        }
    }

    const togglePermission = (id: string) => {
        if (selectedPermissions.includes(id)) {
            setSelectedPermissions(prev => prev.filter(p => p !== id))
        } else {
            setSelectedPermissions(prev => [...prev, id])
        }
    }

    const toggleMember = (id: string) => {
        if (selectedMembers.includes(id)) {
            setSelectedMembers(prev => prev.filter(p => p !== id))
        } else {
            setSelectedMembers(prev => [...prev, id])
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
                        Gerencie permissões e membros deste perfil.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="general">Detalhes & Permissões</TabsTrigger>
                        <TabsTrigger value="members" disabled={!role}>Membros da Equipe</TabsTrigger>
                    </TabsList>

                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">

                        <TabsContent value="general" className="flex-1 flex flex-col overflow-hidden mt-0">
                            <div className="grid gap-4 flex-none mb-4">
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

                            <div className="flex-1 overflow-hidden border rounded-md p-2 flex flex-col">
                                <Label className="mb-2 block px-2">Permissões de Acesso</Label>
                                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted px-2">
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
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="members" className="flex-1 overflow-hidden mt-0">
                            <div className="h-full border rounded-md p-4 overflow-y-auto flex flex-col">
                                {membersLoading ? (
                                    <div className="flex justify-center items-center h-full">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : (
                                    <>
                                        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4 text-sm text-amber-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
                                            <p>
                                                A gestão de vincular usuários a este perfil é feita na aba <strong>Usuários</strong>.
                                                Aqui você visualiza apenas quem já possui este acesso.
                                            </p>
                                            <Button variant="outline" size="sm" className="whitespace-nowrap bg-white" onClick={() => {
                                                setOpen(false)
                                                // Using window location here as we are client side and want a hard redirect to the tab
                                                const slug = window.location.pathname.split('/')[2]
                                                window.location.href = `/dashboard/${slug}/settings?tab=users`
                                            }}>
                                                Gerenciar Usuários
                                            </Button>
                                        </div>

                                        <div className="space-y-2">
                                            {profiles.filter(p => selectedMembers.includes(p.id)).length === 0 ? (
                                                <p className="text-center text-muted-foreground py-8">Nenhum usuário com este perfil.</p>
                                            ) : (
                                                profiles
                                                    .filter(p => selectedMembers.includes(p.id))
                                                    .map(profile => (
                                                        <div key={profile.id} className="flex items-center justify-between p-3 border rounded-md bg-muted/20">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                                    <User className="h-4 w-4 text-primary" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium">{profile.full_name || profile.email}</p>
                                                                    <p className="text-xs text-muted-foreground">{profile.email}</p>
                                                                </div>
                                                            </div>
                                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1">
                                                                <Check className="h-3 w-3" /> Membro
                                                            </span>
                                                        </div>
                                                    ))
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </TabsContent>

                        <DialogFooter className="flex-none pt-4">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? "Salvando..." : "Salvar Alterações"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}

