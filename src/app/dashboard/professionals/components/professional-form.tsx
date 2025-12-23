"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { createProfessional, updateProfessional, deleteProfessional } from "../actions"
import { DeleteWithPassword } from "@/components/ui/delete-with-password"
import { Switch } from "@/components/ui/switch"
import { ProfessionalAvailability } from "./professional-availability"
import { CommissionSettings } from "../[id]/commission-settings"
import { useRouter, useSearchParams } from "next/navigation"

import VMasker from "vanilla-masker"
import { Badge } from "@/components/ui/badge"
import { X, User, Upload, Crop as CropIcon, RotateCw as RotateIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { GoogleIntegration } from "./google-integration"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Cropper from "react-easy-crop"
import getCroppedImg from "@/lib/utils/cropImage"
import { Slider } from "@/components/ui/slider"
import { SecuritySettings } from "@/components/security/SecuritySettings"

interface ProfessionalFormProps {
    professional?: any
    services: any[]
    roles?: any[]
    canManageRoles?: boolean
    readOnly?: boolean
    isCurrentUser?: boolean
}

export function ProfessionalForm({ professional, services, roles = [], canManageRoles = false, readOnly = false, isCurrentUser = false }: ProfessionalFormProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || "personal")

    // Controlled state for Color Picker preview
    const [color, setColor] = useState(professional?.color || "#3b82f6")
    const [hasAgenda, setHasAgenda] = useState(professional?.has_agenda !== false) // Default true

    const [specialties, setSpecialties] = useState<string[]>(professional?.specialty ? professional.specialty.split(',') : [])
    const [specialtyInput, setSpecialtyInput] = useState("")

    // Address State
    const [addressData, setAddressData] = useState({
        zip: professional?.address_zip || "",
        street: professional?.address_street || "",
        neighborhood: professional?.address_neighborhood || "",
        city: professional?.address_city || "",
        state: professional?.address_state || "",
        complement: professional?.address_complement || ""
    })

    const addressNumberRef = useRef<HTMLInputElement>(null)
    const [birthdate, setBirthdate] = useState(professional?.birthdate ? new Date(professional.birthdate).toLocaleDateString('pt-BR') : "")
    const [photoPreview, setPhotoPreview] = useState(professional?.photo_url || "")

    // --- CROPPER STATE ---
    const [cropDialogOpen, setCropDialogOpen] = useState(false)
    const [imageSrc, setImageSrc] = useState<string | null>(null)
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [rotation, setRotation] = useState(0)
    const [aspectRatio, setAspectRatio] = useState<number | undefined>(1) // New state
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
    const [croppedFile, setCroppedFile] = useState<Blob | null>(null) // The final file to upload
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, "")
        const masked = VMasker.toPattern(raw, "99999-999")
        setAddressData(prev => ({ ...prev, zip: masked }))

        if (raw.length === 8) {
            try {
                const response = await fetch(`https://viacep.com.br/ws/${raw}/json/`)
                const data = await response.json()
                if (!data.erro) {
                    setAddressData(prev => ({
                        ...prev,
                        street: data.logradouro,
                        neighborhood: data.bairro,
                        city: data.localidade,
                        state: data.uf,
                        zip: masked
                    }))
                    toast.success("Endereço encontrado!")
                    setTimeout(() => addressNumberRef.current?.focus(), 100)
                } else {
                    toast.error("CEP não encontrado.")
                }
            } catch (error) {
                toast.error("Erro ao buscar CEP.")
            }
        }
    }

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, "")
        const masked = VMasker.toPattern(raw, "99/99/9999")
        setBirthdate(masked)
    }

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0]
            const reader = new FileReader()
            reader.addEventListener('load', () => {
                setImageSrc(reader.result?.toString() || null)
                setCropDialogOpen(true)
                setZoom(1)
                setRotation(0)
                setAspectRatio(1) // Default to square for profiles
            })
            reader.readAsDataURL(file)
            e.target.value = '' // Reset input so same file can be selected again
        }
    }

    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    const handleCropConfirm = async () => {
        try {
            if (imageSrc && croppedAreaPixels) {
                const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation)
                if (croppedBlob) {
                    const objectUrl = URL.createObjectURL(croppedBlob)
                    setPhotoPreview(objectUrl)
                    setCroppedFile(croppedBlob)
                    setCropDialogOpen(false)
                }
            }
        } catch (e) {
            console.error(e)
            toast.error("Erro ao recortar imagem")
        }
    }

    const addSpecialty = () => {
        if (specialtyInput && !specialties.includes(specialtyInput)) {
            setSpecialties([...specialties, specialtyInput])
            setSpecialtyInput("")
        }
    }

    const removeSpecialty = (spec: string) => {
        setSpecialties(specialties.filter(s => s !== spec))
    }

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        formData.set('specialty', specialties.join(','))

        const [day, month, year] = birthdate.split('/')
        if (day && month && year && year.length === 4) {
            formData.set('birthdate', `${year}-${month}-${day}`)
        } else {
            formData.delete('birthdate')
        }

        formData.set('address_zip', addressData.zip);
        formData.set('address_street', addressData.street);
        formData.set('address_neighborhood', addressData.neighborhood);
        formData.set('address_city', addressData.city);
        formData.set('address_state', addressData.state);

        // Replace the file from input with the cropped one if it exists
        if (croppedFile) {
            formData.delete('photo') // Remove original selection if any
            formData.set('photo', croppedFile, 'profile-picture.jpg')
        }

        try {
            const action = professional
                ? updateProfessional.bind(null, professional.id)
                : createProfessional

            const result = await action(formData)

            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success(professional ? "Perfil atualizado!" : "Profissional cadastrado!")
                router.push("/dashboard/professionals")
            }
        } catch (error) {
            toast.error("Erro inesperado.")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const formTopRef = useRef<HTMLDivElement>(null)

    const handleTabChange = (value: string) => {
        setActiveTab(value)
        setTimeout(() => {
            formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
    }

    return (
        <form action={handleSubmit} className="space-y-8 max-w-5xl mx-auto">
            <div ref={formTopRef} className="scroll-mt-24" />

            {/* --- CROP DIALOG --- */}
            <Dialog open={cropDialogOpen} onOpenChange={setCropDialogOpen}>
                <DialogContent className="max-w-xl sm:max-w-[700px]">
                    <DialogHeader>
                        <DialogTitle>Ajustar Foto</DialogTitle>
                        <DialogDescription>
                            Arraste para posicionar. Escolha o formato e use o zoom.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Editor Area */}
                    <div className="relative w-full aspect-video bg-zinc-900 rounded-lg overflow-hidden ring-1 ring-border">
                        {imageSrc && (
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                rotation={rotation}
                                aspect={aspectRatio}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                                onRotationChange={setRotation}
                                showGrid={true}
                            />
                        )}
                    </div>

                    {/* Aspect Ratio Controls */}
                    <div className="flex justify-center gap-2 pb-2">
                        <Button
                            type="button"
                            variant={aspectRatio === 1 ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => setAspectRatio(1)}
                        >
                            Quadrado (1:1)
                        </Button>
                        <Button
                            type="button"
                            variant={aspectRatio === 4 / 3 ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => setAspectRatio(4 / 3)}
                        >
                            4:3
                        </Button>
                        <Button
                            type="button"
                            variant={aspectRatio === 16 / 9 ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => setAspectRatio(16 / 9)}
                        >
                            16:9
                        </Button>
                        <Button
                            type="button"
                            variant={aspectRatio === undefined ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => setAspectRatio(undefined)}
                        >
                            Livre
                        </Button>
                    </div>

                    {/* Controls */}
                    <div className="space-y-4 pt-4">
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium w-12">Zoom</span>
                            <Slider
                                value={[zoom]}
                                min={1}
                                max={3}
                                step={0.1}
                                onValueChange={(v) => setZoom(v[0])}
                                className="flex-1"
                            />
                        </div>

                        <div className="flex items-center justify-center gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setRotation((current) => current - 90)}
                                className="gap-2"
                            >
                                <span className="-scale-x-100"><RotateIcon size={16} /></span>
                                Girar -90°
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setRotation((current) => current + 90)}
                                className="gap-2"
                            >
                                <RotateIcon size={16} />
                                Girar +90°
                            </Button>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" type="button" onClick={() => setCropDialogOpen(false)}>
                            Descartar edições
                        </Button>
                        <Button type="button" onClick={handleCropConfirm}>
                            Salvar edições
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">
                        {readOnly ? "Meu Perfil (Visualização)" : (professional ? "Editar Profissional" : "Novo Profissional")}
                    </h2>
                    <p className="text-muted-foreground">
                        {readOnly ? "Você está visualizando seus dados cadastrais." : "Preencha os dados completos para o prontuário e acesso."}
                    </p>
                </div>
                {!readOnly && (
                    <div className="flex gap-2">
                        {professional && (
                            <DeleteWithPassword
                                id={professional.id}
                                onDelete={deleteProfessional}
                                description="Tem certeza que deseja remover este membro da equipe? O acesso será revogado imediatamente."
                                trigger={
                                    <Button type="button" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                                        <X className="mr-2 h-4 w-4" />
                                        Excluir
                                    </Button>
                                }
                            />
                        )}
                        <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Salvando..." : (professional ? "Salvar Alterações" : "Cadastrar Profissional")}
                        </Button>
                    </div>
                )}
            </div>

            <fieldset disabled={readOnly} className="contents">
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-4">
                    <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 bg-muted p-1 md:w-auto md:bg-transparent md:p-0">
                        <TabsTrigger value="personal" className="flex-1 md:flex-none data-[state=active]:bg-background data-[state=active]:shadow-sm md:data-[state=active]:bg-muted md:data-[state=active]:text-foreground">Dados Pessoais</TabsTrigger>
                        <TabsTrigger value="professional" className="flex-1 md:flex-none data-[state=active]:bg-background data-[state=active]:shadow-sm md:data-[state=active]:bg-muted md:data-[state=active]:text-foreground">Profissional</TabsTrigger>
                        <TabsTrigger value="services" className="flex-1 md:flex-none data-[state=active]:bg-background data-[state=active]:shadow-sm md:data-[state=active]:bg-muted md:data-[state=active]:text-foreground">Serviços</TabsTrigger>
                        <TabsTrigger value="address" className="flex-1 md:flex-none data-[state=active]:bg-background data-[state=active]:shadow-sm md:data-[state=active]:bg-muted md:data-[state=active]:text-foreground">Endereço/Contato</TabsTrigger>
                        {professional?.id && <TabsTrigger value="availability" className="flex-1 md:flex-none data-[state=active]:bg-background data-[state=active]:shadow-sm md:data-[state=active]:bg-muted md:data-[state=active]:text-foreground">Horários</TabsTrigger>}
                        {professional?.id && <TabsTrigger value="commissions" className="flex-1 md:flex-none data-[state=active]:bg-background data-[state=active]:shadow-sm md:data-[state=active]:bg-muted md:data-[state=active]:text-foreground">Comissões</TabsTrigger>}
                        {professional?.id && <TabsTrigger value="integrations" className="flex-1 md:flex-none data-[state=active]:bg-background data-[state=active]:shadow-sm md:data-[state=active]:bg-muted md:data-[state=active]:text-foreground">Integrações</TabsTrigger>}
                        {(isCurrentUser || canManageRoles) && professional?.id && (
                            <TabsTrigger value="security" className="flex-1 md:flex-none data-[state=active]:bg-background data-[state=active]:shadow-sm md:data-[state=active]:bg-muted md:data-[state=active]:text-foreground">Segurança</TabsTrigger>
                        )}
                        {!professional && <TabsTrigger value="access" className="flex-1 md:flex-none data-[state=active]:bg-background data-[state=active]:shadow-sm md:data-[state=active]:bg-muted md:data-[state=active]:text-foreground">Acesso</TabsTrigger>}
                    </TabsList>

                    {/* --- 1. DADOS PESSOAIS --- */}
                    <TabsContent value="personal" forceMount={true} className="data-[state=inactive]:hidden">
                        <Card>
                            <CardHeader>
                                <CardTitle>Identificação</CardTitle>
                                <CardDescription>Dados básicos obrigatórios.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">

                                {/* PHOTO UPLOAD */}
                                <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
                                    <div className="relative group">
                                        <Avatar className="h-32 w-32 border-2 border-border cursor-pointer hover:opacity-90 transition-opacity">
                                            <AvatarImage src={photoPreview} className="object-cover" />
                                            <AvatarFallback className="bg-muted text-5xl text-muted-foreground">
                                                <User />
                                            </AvatarFallback>
                                        </Avatar>
                                        <label htmlFor="photo-upload" className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer shadow-md hover:bg-primary/90 transition-colors">
                                            <Upload className="h-5 w-5" />
                                        </label>
                                        <Input
                                            id="photo-upload"
                                            ref={fileInputRef}
                                            type="file"
                                            name="photo_input" // Changed name to avoid direct bind, we handle manual set
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handlePhotoSelect}
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1 text-center sm:text-left">
                                        <h3 className="font-medium">Foto de Perfil</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Clique no ícone para carregar uma nova foto.
                                            Você poderá ajustar o corte antes de salvar.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="full_name">Nome Completo *</Label>
                                    <Input id="full_name" name="full_name" defaultValue={professional?.full_name} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="cpf">CPF *</Label>
                                        <Input
                                            id="cpf"
                                            name="cpf"
                                            placeholder="000.000.000-00"
                                            defaultValue={professional?.cpf}
                                            onChange={(e) => {
                                                e.target.value = VMasker.toPattern(e.target.value.replace(/\D/g, ""), "999.999.999-99")
                                            }}
                                            maxLength={14}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="birthdate">Data de Nascimento</Label>
                                        <Input
                                            id="birthdate"
                                            name="birthdate_display"
                                            placeholder="dd/mm/aaaa"
                                            value={birthdate}
                                            onChange={handleDateChange}
                                            maxLength={10}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="gender">Sexo</Label>
                                        <Select name="gender" defaultValue={professional?.gender || "Masculino"}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Masculino">Masculino</SelectItem>
                                                <SelectItem value="Feminino">Feminino</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="bio">Bio / Resumo (Aparece no agendamento online)</Label>
                                    <Textarea id="bio" name="bio" placeholder="Fisioterapeuta especialista em..." defaultValue={professional?.bio} />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* --- 2. PROFISSIONAL --- */}
                    <TabsContent value="professional" forceMount={true} className="data-[state=inactive]:hidden">
                        <Card>
                            <CardHeader>
                                <CardTitle>Dados Técnicos</CardTitle>
                                <CardDescription>Registro no conselho e aparência na agenda.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between border p-3 rounded-lg bg-slate-50">
                                    <Label htmlFor="has_agenda_switch" className="grid gap-0.5 cursor-pointer">
                                        <span className="font-medium">Exibir na Agenda</span>
                                        <span className="text-xs text-muted-foreground">Permite que este profissional receba agendamentos.</span>
                                    </Label>
                                    <Switch
                                        id="has_agenda_switch"
                                        checked={hasAgenda}
                                        onCheckedChange={setHasAgenda}
                                    />
                                    <input type="hidden" name="has_agenda" value={String(hasAgenda)} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="council_type">Conselho</Label>
                                        <Select name="council_type" defaultValue={professional?.council_type || "CREFITO"}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="CREFITO">CREFITO</SelectItem>
                                                <SelectItem value="CRM">CRM</SelectItem>
                                                <SelectItem value="OUTRO">OUTRO</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="council_number">Número do Registro</Label>
                                        <Input id="council_number" name="council_number" defaultValue={professional?.council_number} />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="specialty">Especialidades</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="specialty_input"
                                            value={specialtyInput}
                                            onChange={(e) => setSpecialtyInput(e.target.value)}
                                            placeholder="Ex: Fisioterapia Esportiva"
                                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                                        />
                                        <Button type="button" onClick={addSpecialty} variant="secondary">Adicionar</Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {specialties.map(spec => (
                                            <Badge key={spec} variant="secondary" className="gap-1 pl-2 pr-1 py-1">
                                                {spec}
                                                <button type="button" onClick={() => removeSpecialty(spec)} className="text-muted-foreground hover:text-foreground">
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                        <input type="hidden" name="specialty" value={specialties.join(',')} />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="color">Cor na Agenda</Label>
                                    <div className="flex gap-2 items-center">
                                        <Input
                                            type="color"
                                            id="color"
                                            name="color"
                                            value={color}
                                            onChange={(e) => setColor(e.target.value)}
                                            className="w-12 h-12 p-1 rounded-md cursor-pointer"
                                        />
                                        <Input value={color} onChange={(e) => setColor(e.target.value)} className="w-32" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {canManageRoles && roles.length > 0 && (
                            <Card className="mt-4">
                                <CardHeader>
                                    <CardTitle>Permissão de Acesso</CardTitle>
                                    <CardDescription>Defina o nível de acesso deste usuário no sistema.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-2">
                                        <Label htmlFor="role_id">Perfil de Acesso</Label>
                                        <Select name="role_id" defaultValue={professional?.role_id}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione um perfil..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {roles.map(role => (
                                                    <SelectItem key={role.id} value={role.id}>
                                                        {role.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* --- 5. SERVIÇOS --- */}
                    <TabsContent value="services" forceMount={true} className="data-[state=inactive]:hidden">
                        <Card>
                            <CardHeader>
                                <CardTitle>Serviços Realizados</CardTitle>
                                <CardDescription>Selecione quais serviços este profissional está habilitado a atender.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {services.map(service => (
                                        <div key={service.id} className="flex items-start space-x-2 border p-3 rounded-md hover:bg-muted/50 transition-colors">
                                            <Checkbox
                                                id={`service_${service.id}`}
                                                name="services"
                                                value={service.id}
                                                defaultChecked={professional?.services?.includes(service.id)}
                                            />
                                            <div className="grid gap-1.5 leading-none">
                                                <Label
                                                    htmlFor={`service_${service.id}`}
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                >
                                                    {service.name}
                                                </Label>
                                                <p className="text-xs text-muted-foreground">
                                                    {service.duration} min • R$ {service.price}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {services.length === 0 && <p className="text-muted-foreground col-span-full">Nenhum serviço cadastrado no sistema.</p>}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* --- 3. ENDEREÇO --- */}
                    <TabsContent value="address" forceMount={true} className="data-[state=inactive]:hidden">
                        <Card>
                            <CardHeader>
                                <CardTitle>Contato & Endereço</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="phone">Celular/WhatsApp</Label>
                                        <Input
                                            id="phone"
                                            name="phone"
                                            placeholder="(00) 00000-0000"
                                            defaultValue={professional?.phone}
                                            onChange={(e) => {
                                                e.target.value = VMasker.toPattern(e.target.value.replace(/\D/g, ""), "(99) 99999-9999")
                                            }}
                                            maxLength={15}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="address_zip">CEP</Label>
                                        <Input
                                            id="address_zip"
                                            name="address_zip"
                                            value={addressData.zip}
                                            onChange={handleCepChange}
                                            placeholder="00000-000"
                                            maxLength={9}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="address_street">Rua/Logradouro</Label>
                                    <Input
                                        id="address_street"
                                        name="address_street"
                                        value={addressData.street}
                                        onChange={(e) => setAddressData({ ...addressData, street: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="address_number">Número</Label>
                                        <Input ref={addressNumberRef} id="address_number" name="address_number" defaultValue={professional?.address_number} />
                                    </div>
                                    <div className="grid gap-2 col-span-2">
                                        <Label htmlFor="address_neighborhood">Bairro</Label>
                                        <Input
                                            id="address_neighborhood"
                                            name="address_neighborhood"
                                            value={addressData.neighborhood}
                                            onChange={(e) => setAddressData({ ...addressData, neighborhood: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="address_city">Cidade</Label>
                                        <Input
                                            id="address_city"
                                            name="address_city"
                                            value={addressData.city}
                                            onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="address_state">UF</Label>
                                        <Input
                                            id="address_state"
                                            name="address_state"
                                            maxLength={2}
                                            value={addressData.state}
                                            onChange={(e) => setAddressData({ ...addressData, state: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* --- 6. HORÁRIOS --- */}
                    {professional?.id && (
                        <TabsContent value="availability" forceMount={true} className="data-[state=inactive]:hidden">
                            <ProfessionalAvailability professionalId={professional.id} />
                        </TabsContent>
                    )}

                    {/* --- 7. COMISSÕES --- */}
                    {professional?.id && (
                        <TabsContent value="commissions" forceMount={true} className="data-[state=inactive]:hidden">
                            <CommissionSettings profileId={professional.id} />
                        </TabsContent>
                    )}

                    {/* --- 8. INTEGRAÇÕES (Google) --- */}
                    {professional?.id && (
                        <TabsContent value="integrations" forceMount={true} className="data-[state=inactive]:hidden">
                            <div className="max-w-2xl mx-auto">
                                <h3 className="text-lg font-medium mb-4">Integrações Externas</h3>
                                <GoogleIntegration profileId={professional.id} />
                            </div>
                        </TabsContent>
                    )}

                    {/* --- 9. SECURITY (Update Password) --- */}
                    {(isCurrentUser || canManageRoles) && professional?.id && (
                        <TabsContent value="security" forceMount={true} className="data-[state=inactive]:hidden">
                            <div className="space-y-8">
                                <Card className="max-w-xl mx-auto border-destructive/20">
                                    <CardHeader>
                                        <CardTitle>Segurança da Conta</CardTitle>
                                        <CardDescription>Atualize sua senha de acesso.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="password_update">Nova Senha</Label>
                                            <Input
                                                id="password_update"
                                                name="password"
                                                type="password"
                                                placeholder="Deixe em branco para manter a atual"
                                                minLength={6}
                                            />
                                            <p className="text-xs text-muted-foreground">Mínimo 6 caracteres.</p>
                                        </div>
                                        <div className="bg-muted/50 p-3 rounded-md text-sm text-muted-foreground">
                                            <p>Para alterar seu email de login ({professional.email}), entre em contato com o administrador do sistema.</p>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex flex-col gap-2 border-t bg-muted/10 p-4">
                                        <Button type="submit" className="w-full sm:w-auto self-end" disabled={loading}>
                                            {loading ? "Salvando..." : "Atualizar Senha"}
                                        </Button>
                                        <p className="text-xs text-center sm:text-right text-muted-foreground w-full">
                                            Ao clicar, sua nova senha será salva e já valerá para o próximo login.
                                        </p>
                                    </CardFooter>
                                </Card>

                                {isCurrentUser && (
                                    <div className="max-w-3xl mx-auto">
                                        <SecuritySettings />
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    )}

                    {/* --- 4. ACESSO (Only for Create) --- */}
                    {!professional && (
                        <TabsContent value="access" forceMount={true} className="data-[state=inactive]:hidden">
                            <Card className="border-primary/50 bg-primary/5">
                                <CardHeader>
                                    <CardTitle className="text-primary">Credenciais de Acesso</CardTitle>
                                    <CardDescription>Defina como este profissional fará login no sistema.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email (Login) *</Label>
                                        <Input id="email" name="email" type="email" />
                                    </div>

                                    {canManageRoles && roles.length > 0 && (
                                        <div className="grid gap-2">
                                            <Label htmlFor="role_id_new">Perfil de Acesso</Label>
                                            <Select name="role_id" defaultValue={roles.find(r => r.name === 'Profissional')?.id}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione um perfil..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {roles.map(role => (
                                                        <SelectItem key={role.id} value={role.id}>
                                                            {role.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    <div className="grid gap-2">
                                        <Label htmlFor="password">Senha Provisória *</Label>
                                        <Input id="password" name="password" type="password" minLength={6} />
                                        <p className="text-xs text-muted-foreground">Mínimo 6 caracteres.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )}
                </Tabs>
            </fieldset>
        </form>
    )
}
