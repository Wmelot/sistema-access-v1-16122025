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
import {
    Plus,
    Check,
    Shield,
    User,
    Loader2,
    Info,
    LayoutGrid,
    Settings2,
    ChevronRight,
    Home,
    Calendar as CalendarIcon,
    Users,
    DollarSign,
    Briefcase,
    MapPin,
    Stethoscope,
    ClipboardList,
    FileText,
    Tag,
    ShoppingBag,
    Megaphone,
    MessageCircle,
    Microscope
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/hooks/use-sidebar"
import { Switch } from "@/components/ui/switch"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { usePermissionsContext } from "@/components/providers/permissions-provider"

interface RoleFormDialogProps {
    role?: any // If present, edit mode
    allPermissions: any[]
    trigger?: React.ReactNode
}

export function RoleFormDialog({ role, allPermissions, trigger }: RoleFormDialogProps) {
    const { isCollapsed } = useSidebar()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState(role?.name || "")
    const [description, setDescription] = useState(role?.description || "")

    // Calculate dynamic sidebar width
    const sidebarWidth = isCollapsed ? 60 : 250

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

    const { hasPermission: contextHasPermission, setPreviewPermissions, refreshPermissions } = usePermissionsContext()

    // Real-time Preview logic
    useEffect(() => {
        if (open) {
            const previewCodes = allPermissions
                .filter(p => selectedPermissions.includes(p.id))
                .map(p => p.code)
            setPreviewPermissions(previewCodes)
        } else {
            setPreviewPermissions(null)
        }
    }, [selectedPermissions, open, allPermissions, setPreviewPermissions])

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

            // [SYNC] Refresh actual permissions from server after save
            await refreshPermissions()

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

    // Permission Item Component with Tooltip and Switch
    const PermissionItem = ({ perm }: { perm: any }) => (
        <TooltipProvider delayDuration={100}>
            <div className={cn(
                "flex items-center justify-between p-3 rounded-lg border transition-all duration-200",
                selectedPermissions.includes(perm.id)
                    ? "bg-primary/5 border-primary/20 shadow-sm"
                    : "bg-white border-slate-200 hover:border-slate-300"
            )}>
                <div className="flex-1 mr-4">
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <Label
                            htmlFor={perm.id}
                            className="text-sm font-semibold text-slate-700 cursor-pointer"
                        >
                            {perm.description || perm.code}
                        </Label>
                        {perm.explanation && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info className="h-3.5 w-3.5 text-slate-400 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-[250px]">
                                    <p>{perm.explanation}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono block">
                        {perm.code}
                    </span>
                </div>
                <Switch
                    id={perm.id}
                    checked={selectedPermissions.includes(perm.id)}
                    onCheckedChange={() => togglePermission(perm.id)}
                    className="data-[state=checked]:bg-primary"
                />
            </div>
        </TooltipProvider>
    )

    // Unified Interface Grouping Logic
    const interfaceGroups = allPermissions.reduce((acc: any, p: any) => {
        if (p.code.startsWith('sidebar.') || p.code.startsWith('user_menu.')) {
            const key = p.code.split('.')[1]
            if (!acc[key]) acc[key] = { key, label: '', icon: LayoutGrid, sidebar: null, header: null }

            if (p.code.startsWith('sidebar.')) acc[key].sidebar = p
            if (p.code.startsWith('user_menu.')) acc[key].header = p

            // Map Icons based on key
            const iconMap: Record<string, any> = {
                home: Home,
                schedule: CalendarIcon,
                patients: Users,
                financial: DollarSign,
                professionals: Briefcase,
                locations: MapPin,
                services: Stethoscope,
                forms: ClipboardList,
                questionnaires: FileText,
                prices: Tag,
                products: ShoppingBag,
                marketing: Megaphone,
                whatsapp: MessageCircle,
                auditor: Microscope,
                users: Users,
                roles: Shield,
                management: Settings2
            }
            if (iconMap[key]) acc[key].icon = iconMap[key]

            // Normalize label: Remove prefixes like "Sidebar: " or "Menu Usuário: "
            if (!acc[key].label) {
                acc[key].label = p.description.replace(/Sidebar: |Menu Usuário: |Atalho |Exibir: /g, '')
            }
        }
        return acc
    }, {})

    const interfaceModules = Object.values(interfaceGroups).sort((a: any, b: any) => a.label.localeCompare(b.label))

    const managementPerms = allPermissions.filter(p =>
        p.module === 'Gestão (Módulos)' ||
        (!p.code.startsWith('sidebar.') && !p.code.startsWith('user_menu.'))
    )

    // Group management perms by prefix or manual title
    const groupedManagement = managementPerms.reduce((acc: any, curr: any) => {
        let title = 'Geral'
        if (curr.module && curr.module !== 'Gestão (Módulos)') {
            title = curr.module
        } else if (curr.description?.includes(':')) {
            title = curr.description.split(':')[0]
        }

        if (!acc[title]) acc[title] = []
        acc[title].push(curr)
        return acc
    }, {})

    return (
        <Dialog open={open} onOpenChange={setOpen} modal={false}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Novo Perfil
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent
                overlayClassName={cn(
                    "transition-all duration-300 ease-in-out",
                    isCollapsed ? "left-[60px]" : "left-[250px]"
                )}
                className={cn(
                    "flex flex-col p-0 transition-all duration-300 ease-in-out z-[150] rounded-xl overflow-hidden shadow-2xl border bg-slate-50",
                    "sm:max-w-[1100px] w-[calc(98vw-var(--sidebar-w)-2rem)] sm:left-[calc(50%+var(--sidebar-w)/2)] !translate-x-[-50%] top-[74px] !translate-y-0 h-[calc(100vh-90px)]"
                )}
                style={{ "--sidebar-w": `${sidebarWidth}px` } as any}
                onPointerDownOutside={(e) => {
                    const target = e.target as HTMLElement;
                    if (target?.closest('[data-sidebar="true"]') || target?.closest('.sidebar-toggle-btn') || target?.closest('aside')) {
                        e.preventDefault();
                    }
                }}
            >
                <div className="p-6 bg-white border-b flex-none flex items-center justify-between">
                    <div>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-800">
                            <Shield className="h-5 w-5 text-primary" />
                            {role ? "Configurar Perfil de Acesso" : "Novo Perfil de Acesso"}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500">
                            Configure permissões detalhadas e membros do perfil.
                        </DialogDescription>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                            className="bg-white"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="px-6"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar Alterações
                        </Button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex overflow-hidden">
                        <div className="w-64 bg-slate-50 border-r p-4 flex flex-col gap-1 overflow-y-auto">
                            <TabsList className="bg-transparent flex flex-col h-auto w-full p-0 gap-1 space-y-0">
                                <TabsTrigger
                                    value="general"
                                    className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary border border-transparent data-[state=active]:border-slate-200"
                                >
                                    <Settings2 className="h-4 w-4" /> Info & Equipe
                                </TabsTrigger>
                                <TabsTrigger
                                    value="interface"
                                    className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary border border-transparent data-[state=active]:border-slate-200"
                                >
                                    <LayoutGrid className="h-4 w-4" /> Interface e Menus
                                </TabsTrigger>
                                <TabsTrigger
                                    value="management"
                                    className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary border border-transparent data-[state=active]:border-slate-200"
                                >
                                    <Shield className="h-4 w-4" /> Gestão (Módulos)
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 bg-white overflow-y-auto p-8">
                            <TabsContent value="general" className="m-0 space-y-8 animate-in fade-in-50 duration-300">
                                <section>
                                    <h3 className="text-lg font-bold text-slate-800 mb-4">Informações Básicas</h3>
                                    <div className="grid gap-6">
                                        <div className="grid gap-2">
                                            <Label htmlFor="name" className="text-slate-600">Nome do Perfil</Label>
                                            <Input
                                                id="name"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="Ex: Auditor Clínico"
                                                className="max-w-md h-11"
                                                required
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="description" className="text-slate-600">Descrição Técnica</Label>
                                            <Textarea
                                                id="description"
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder="Explique quem deve usar este perfil e por que..."
                                                className="max-w-2xl min-h-[100px]"
                                            />
                                        </div>
                                    </div>
                                </section>

                                {role && (
                                    <section>
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-bold text-slate-800">Equipe Vinculada</h3>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={loadMembersData}
                                                disabled={membersLoading}
                                            >
                                                {membersLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atualizar Lista"}
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {profiles.map((profile: any) => (
                                                <div
                                                    key={profile.id}
                                                    onClick={() => toggleMember(profile.id)}
                                                    className={cn(
                                                        "flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-all",
                                                        selectedMembers.includes(profile.id)
                                                            ? "bg-primary/5 border-primary/20 ring-1 ring-primary/10"
                                                            : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold",
                                                        selectedMembers.includes(profile.id) ? "bg-primary text-white" : "bg-slate-100 text-slate-500"
                                                    )}>
                                                        {profile.full_name?.substring(0, 1).toUpperCase()}
                                                    </div>
                                                    <div className="flex-1 overflow-hidden">
                                                        <p className="text-xs font-bold truncate">{profile.full_name}</p>
                                                        <p className="text-[10px] text-slate-400 truncate">{profile.email}</p>
                                                    </div>
                                                    <Checkbox
                                                        id={`member-${profile.id}`}
                                                        checked={selectedMembers.includes(profile.id)}
                                                        onCheckedChange={() => toggleMember(profile.id)}
                                                        className="h-4 w-4 rounded-full"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </TabsContent>

                            <TabsContent value="interface" className="m-0 space-y-6 animate-in fade-in-50 duration-300">
                                <div className="max-w-5xl">
                                    <div className="mb-8">
                                        <h3 className="text-lg font-bold text-slate-800 mb-1">Canais de Navegação e Atalhos</h3>
                                        <p className="text-sm text-slate-500">
                                            Defina onde cada funcionalidade deve aparecer para este perfil.
                                        </p>
                                    </div>

                                    <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
                                        <div className="grid grid-cols-12 bg-slate-50/80 border-b px-6 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">
                                            <div className="col-span-6">Módulo / Funcionalidade</div>
                                            <div className="col-span-3 text-center">Menu Lateral</div>
                                            <div className="col-span-3 text-center">Menu Superior</div>
                                        </div>

                                        <div className="divide-y divide-slate-100">
                                            {interfaceModules.map((mod: any) => (
                                                <div key={mod.key} className="grid grid-cols-12 items-center px-6 py-4 hover:bg-slate-50/50 transition-colors">
                                                    <div className="col-span-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                                                <mod.icon className="h-4 w-4" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-700">{mod.label}</p>
                                                                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tight">{mod.key}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="col-span-3 flex justify-center">
                                                        {mod.sidebar ? (
                                                            <TooltipProvider delayDuration={0}>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <div className="flex flex-col items-center gap-1">
                                                                            <Switch
                                                                                checked={selectedPermissions.includes(mod.sidebar.id)}
                                                                                onCheckedChange={() => togglePermission(mod.sidebar.id)}
                                                                            />
                                                                        </div>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent side="top">Exibir no Menu Lateral</TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        ) : <span className="text-[10px] text-slate-300 font-bold uppercase">N/A</span>}
                                                    </div>

                                                    <div className="col-span-3 flex justify-center">
                                                        {mod.header ? (
                                                            <TooltipProvider delayDuration={0}>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <div className="flex flex-col items-center gap-1">
                                                                            <Switch
                                                                                checked={selectedPermissions.includes(mod.header.id)}
                                                                                onCheckedChange={() => togglePermission(mod.header.id)}
                                                                            />
                                                                        </div>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent side="top">Exibir no Menu Superior (Atalho)</TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        ) : <span className="text-[10px] text-slate-300 font-bold uppercase">N/A</span>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="management" className="m-0 space-y-12 animate-in fade-in-50 duration-300">
                                <div className="max-w-5xl">
                                    <h3 className="text-lg font-bold text-slate-800 mb-2">Gestão de Módulos e Regras</h3>
                                    <p className="text-sm text-slate-500 mb-8">
                                        Defina as regras de negócio e o que cada colaborador pode gerenciar dentro dos módulos do sistema.
                                    </p>

                                    <div className="space-y-10">
                                        {Object.entries(groupedManagement).map(([title, perms]: [string, any]) => (
                                            <div key={title} className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100">
                                                <h4 className="text-sm font-bold text-primary flex items-center gap-2 mb-6 ml-1 uppercase tracking-wider">
                                                    <ChevronRight className="h-4 w-4 text-slate-400" />
                                                    {title}
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {perms.map((perm: any) => (
                                                        <PermissionItem key={perm.id} perm={perm} />
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    )
}

