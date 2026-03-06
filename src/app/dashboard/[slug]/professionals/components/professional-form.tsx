"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
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
import { useRouter, useSearchParams, useParams } from "next/navigation"

import VMasker from "vanilla-masker"
import { Badge } from "@/components/ui/badge"
import { X, User, Upload, Crop as CropIcon, RotateCw as RotateIcon, ShieldAlert, Clock, MessageSquare, Settings, MapPin, Briefcase, Percent, Share2, Shield, Lock, CheckCircle2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { GoogleIntegration } from "./google-integration"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Cropper from "react-easy-crop"
import getCroppedImg from "@/lib/utils/cropImage"
import { Slider } from "@/components/ui/slider"
import { SecuritySettings } from "@/components/security/SecuritySettings"
import { AdminPasswordCard } from "./admin-password-card"
import { cn } from "@/lib/utils"

/**
 * Standardized Tab Panel Wrapper to ensure CONSISTENT WIDTH across all tabs.
 * This fixes the layout shift issues.
 */
function TabPanel({ value, children }: { value: string, children: React.ReactNode }) {
    return (
        <TabsContent value={value} forceMount={true} className="data-[state=inactive]:hidden w-full flex-1 min-w-0">
            <div className="w-full space-y-6">
                {children}
            </div>
        </TabsContent>
    )
}

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
    const { slug } = useParams()
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || "personal")

    // Controlled state for Color Picker preview
    const [color, setColor] = useState(professional?.color || "#3b82f6")
    const [hasAgenda, setHasAgenda] = useState(professional?.has_agenda !== false) // Default true
    const [slotInterval, setSlotInterval] = useState(String(professional?.slot_interval || 30))
    const [allowOverbooking, setAllowOverbooking] = useState(professional?.allow_overbooking || false)
    const [onlineBookingEnabled, setOnlineBookingEnabled] = useState(professional?.online_booking_enabled !== false)
    const [minAdvanceDays, setMinAdvanceDays] = useState(String(professional?.min_advance_booking_days || 0))

    // [NEW] Scheduling Settings State
    const [bufferEnabled, setBufferEnabled] = useState(professional?.buffer_enabled || false)
    const [bufferTime, setBufferTime] = useState(String(professional?.buffer_time || 0))
    const [receiveDailyAgenda, setReceiveDailyAgenda] = useState(professional?.receive_daily_agenda_whatsapp || false)
    const [whatsappRemindersEnabled, setWhatsappRemindersEnabled] = useState(professional?.whatsapp_reminders_enabled !== false)

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

    // --- FORM STATE (Robust Persistence) ---
    const [formData, setFormData] = useState({
        full_name: professional?.full_name || "",
        cpf: professional?.cpf || "",
        email: professional?.email || "",
        password: "",
        bio: professional?.bio || "",
        council_number: professional?.council_number || "",
        role_id: professional?.role_id || (roles.find(r => r.name === 'Profissional')?.id),
        phone: professional?.phone || ""
    })

    const [selectedServices, setSelectedServices] = useState<string[]>(professional?.services || [])

    // Browser Security Check for FaceID
    useEffect(() => {
        if (activeTab === 'security') {
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const isHttps = window.location.protocol === 'https:';

            if (!isLocalhost && !isHttps) {
                toast("Atenção: Biometria não disponível", {
                    description: "O FaceID/TouchID requer HTTPS ou acesso via 'localhost'. Se você está acessando via IP (192.168...), a biometria falhará.",
                    icon: <ShieldAlert className="h-5 w-5 text-yellow-500" />,
                    duration: 8000,
                });
            }
        }
    }, [activeTab]);

    // [NEW] Sync internal states when professional prop changes
    useEffect(() => {
        if (professional) {
            setColor(professional.color || "#3b82f6")
            setHasAgenda(professional.has_agenda !== false)
            setSlotInterval(String(professional.slot_interval || 30))
            setAllowOverbooking(professional.allow_overbooking || false)
            setOnlineBookingEnabled(professional.online_booking_enabled !== false)
            setMinAdvanceDays(String(professional.min_advance_booking_days || 0))
            setBufferEnabled(professional.buffer_enabled || false)
            setBufferTime(String(professional.buffer_time || 0))
            setReceiveDailyAgenda(professional.receive_daily_agenda_whatsapp || false)
            setWhatsappRemindersEnabled(professional.whatsapp_reminders_enabled !== false)
            setSpecialties(professional.specialty ? professional.specialty.split(',') : [])
            setAddressData({
                zip: professional.address_zip || "",
                street: professional.address_street || "",
                neighborhood: professional.address_neighborhood || "",
                city: professional.address_city || "",
                state: professional.address_state || "",
                complement: professional.address_complement || ""
            })
            setFormData({
                full_name: professional.full_name || "",
                cpf: professional.cpf || "",
                email: professional.email || "",
                password: "",
                bio: professional.bio || "",
                council_number: professional.council_number || "",
                role_id: professional.role_id || "",
                phone: professional.phone || ""
            })
            setBirthdate(professional.birthdate ? new Date(professional.birthdate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : "")
            setPhotoPreview(professional.photo_url || "")
            setSelectedServices(professional.services || [])
        }
    }, [professional])

    const handleFormChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleDisplayPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = VMasker.toPattern(e.target.value.replace(/\D/g, ""), "(99) 99999-9999")
        e.target.value = v // Update UI
        handleFormChange('phone', v) // Update State
    }

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

    const toggleService = (serviceId: string) => {
        setSelectedServices(prev =>
            prev.includes(serviceId)
                ? prev.filter(id => id !== serviceId)
                : [...prev, serviceId]
        )
    }

    async function handleSubmit(formDataParam: FormData) {
        setLoading(true)

        // Manual Injection of State Data to ensure persistence
        formDataParam.set('full_name', formData.full_name)
        formDataParam.set('cpf', formData.cpf)
        formDataParam.set('bio', formData.bio)
        formDataParam.set('phone', formData.phone)
        formDataParam.set('council_number', formData.council_number)

        if (!professional) {
            formDataParam.set('email', formData.email)
            formDataParam.set('password', formData.password)
            if (formData.role_id) formDataParam.set('role_id', formData.role_id)
        } else {
            if (formData.role_id && canManageRoles) formDataParam.set('role_id', formData.role_id)
        }

        formDataParam.set('specialty', specialties.join(','))

        const [day, month, year] = birthdate.split('/')
        if (day && month && year && year.length === 4) {
            formDataParam.set('birthdate', `${year}-${month}-${day}`)
        } else {
            formDataParam.delete('birthdate')
        }

        formDataParam.set('address_zip', addressData.zip);
        formDataParam.set('address_street', addressData.street);
        formDataParam.set('address_neighborhood', addressData.neighborhood);
        formDataParam.set('address_city', addressData.city);
        formDataParam.set('address_state', addressData.state);

        // Scheduling Settings
        formDataParam.set('slot_interval', slotInterval)
        formDataParam.set('allow_overbooking', String(allowOverbooking))
        formDataParam.set('online_booking_enabled', String(onlineBookingEnabled))
        formDataParam.set('min_advance_booking_days', minAdvanceDays)
        formDataParam.set('buffer_time', bufferTime)
        formDataParam.set('buffer_enabled', String(bufferEnabled))
        formDataParam.set('receive_daily_agenda_whatsapp', String(receiveDailyAgenda))
        formDataParam.set('whatsapp_reminders_enabled', String(whatsappRemindersEnabled))
        formDataParam.set('has_agenda', String(hasAgenda))

        // Manual Injection of Services
        formDataParam.delete('services') // Clear any previous values
        selectedServices.forEach(id => {
            formDataParam.append('services', id)
        })

        // Replace the file from input with the cropped one if it exists
        if (croppedFile) {
            formDataParam.delete('photo') // Remove original selection if any
            formDataParam.set('photo', croppedFile, 'profile-picture.jpg')
        }

        try {
            const action = professional
                ? updateProfessional.bind(null, professional.id)
                : createProfessional

            const result = await action(formDataParam)

            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success(professional ? "Perfil atualizado!" : "Profissional cadastrado!")
                router.push(`/dashboard/${slug}/professionals`)
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
        <form action={handleSubmit} className="space-y-8 max-w-5xl mx-auto w-full">
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

            <div className="flex items-center justify-between border-b pb-4 md:border-0 md:pb-0">
                <div className="space-y-1">
                    <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-800">
                        {isCurrentUser ? "Meu Perfil" : (readOnly ? "Perfil Profissional" : (professional ? "Editar Perfil" : "Novo Profissional"))}
                    </h2>
                    <p className="text-sm text-muted-foreground hidden md:block">
                        {isCurrentUser ? "Gerencie suas informações pessoais e segurança." : (readOnly ? "Visualizando dados cadastrais." : "Preencha os dados completos para o prontuário e acesso.")}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {!readOnly && professional && (
                        <div className="md:hidden">
                            <DeleteWithPassword
                                id={professional.id}
                                onDelete={deleteProfessional}
                                onSuccess={() => router.push('/dashboard/professionals')}
                                description="Tem certeza que deseja remover este membro da equipe? O acesso será revogado imediatamente."
                                trigger={
                                    <Button type="button" variant="ghost" size="sm" className="text-destructive font-bold hover:bg-destructive/10 leading-none h-8">
                                        Excluir
                                    </Button>
                                }
                            />
                        </div>
                    )}

                    {!readOnly && (
                        <div className="hidden md:flex gap-2">
                            {professional && (
                                <DeleteWithPassword
                                    id={professional.id}
                                    onDelete={deleteProfessional}
                                    onSuccess={() => router.push('/dashboard/professionals')}
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
                            <Button id="save-professional-btn" type="submit" disabled={loading}>
                                {loading ? "Salvando..." : (professional ? "Salvar Alterações" : "Cadastrar Profissional")}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Fixed Footer */}
            {!readOnly && (
                <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 flex gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                    <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl font-bold border-slate-200 text-slate-600" onClick={() => router.back()}>
                        Cancelar
                    </Button>
                    <Button id="save-professional-btn-mobile" type="submit" disabled={loading} className="flex-[2] h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                        {loading ? "Salvando..." : (professional ? "Salvar" : "Cadastrar")}
                    </Button>
                </div>
            )}

            <fieldset disabled={readOnly} className="contents">
                <div className="md:hidden pt-2">
                    <Select value={activeTab} onValueChange={handleTabChange}>
                        <SelectTrigger className="w-full h-14 bg-slate-50 border-slate-200 rounded-2xl font-bold text-slate-700 shadow-sm focus:ring-primary/20">
                            <div className="flex items-center gap-2">
                                <Settings className="w-4 h-4 text-primary" />
                                <SelectValue placeholder="Selecione a seção..." />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-slate-200 shadow-xl">
                            <SelectItem value="personal">Dados Pessoais</SelectItem>
                            <SelectItem value="address">Endereço</SelectItem>
                            <SelectItem value="services">Serviços</SelectItem>
                            {professional?.id && <SelectItem value="availability">Horários</SelectItem>}
                            {professional?.id && <SelectItem value="commissions">Comissões</SelectItem>}
                            {professional?.id && <SelectItem value="scheduling">Agendamento</SelectItem>}
                            {professional?.id && <SelectItem value="integrations">Integrações</SelectItem>}
                            {professional?.id && <SelectItem value="security">Segurança</SelectItem>}
                            {!professional && <SelectItem value="access">Acesso</SelectItem>}
                        </SelectContent>
                    </Select>
                </div>

                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-4">
                    <TabsList id="professional-tabs" className="hidden md:inline-flex h-10 bg-slate-100/80 dark:bg-slate-900/50 backdrop-blur-md p-0.5 rounded-lg gap-0.5 border border-slate-200/50 dark:border-white/5 shadow-sm overflow-x-auto scrollbar-hide shrink-0">
                        <TabsTrigger
                            value="personal"
                            className="relative px-3 py-1.5 rounded-md gap-1.5 transition-all duration-300
                                     data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 
                                     data-[state=active]:text-primary data-[state=active]:shadow-md
                                     hover:text-primary group text-[10px] font-bold uppercase tracking-tight shrink-0"
                        >
                            <User className="h-3 w-3 opacity-70 group-data-[state=active]:opacity-100 transition-all" />
                            Dados Pessoais
                        </TabsTrigger>
                        <TabsTrigger
                            value="address"
                            className="relative px-3 py-1.5 rounded-md gap-1.5 transition-all duration-300
                                     data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 
                                     data-[state=active]:text-primary data-[state=active]:shadow-md
                                     hover:text-primary group text-[10px] font-bold uppercase tracking-tight shrink-0"
                        >
                            <MapPin className="h-3 w-3 opacity-70 group-data-[state=active]:opacity-100 transition-all" />
                            Endereço
                        </TabsTrigger>
                        <TabsTrigger
                            value="services"
                            className="relative px-3 py-1.5 rounded-md gap-1.5 transition-all duration-300
                                     data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 
                                     data-[state=active]:text-primary data-[state=active]:shadow-md
                                     hover:text-primary group text-[10px] font-bold uppercase tracking-tight shrink-0"
                        >
                            <Briefcase className="h-3 w-3 opacity-70 group-data-[state=active]:opacity-100 transition-all" />
                            Serviços
                        </TabsTrigger>
                        {professional?.id && (
                            <TabsTrigger
                                id="tab-availability"
                                value="availability"
                                className="relative px-3 py-1.5 rounded-md gap-1.5 transition-all duration-300
                                         data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 
                                         data-[state=active]:text-primary data-[state=active]:shadow-md
                                         hover:text-primary group text-[10px] font-bold uppercase tracking-tight shrink-0"
                            >
                                <Clock className="h-3 w-3 opacity-70 group-data-[state=active]:opacity-100 transition-all" />
                                Horários
                            </TabsTrigger>
                        )}
                        {professional?.id && (
                            <TabsTrigger
                                value="commissions"
                                className="relative px-3 py-1.5 rounded-md gap-1.5 transition-all duration-300
                                         data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 
                                         data-[state=active]:text-primary data-[state=active]:shadow-md
                                         hover:text-primary group text-[10px] font-bold uppercase tracking-tight shrink-0"
                            >
                                <Percent className="h-3 w-3 opacity-70 group-data-[state=active]:opacity-100 transition-all" />
                                Comissões
                            </TabsTrigger>
                        )}
                        {professional?.id && (
                            <TabsTrigger
                                value="scheduling"
                                className="relative px-3 py-1.5 rounded-md gap-1.5 transition-all duration-300
                                         data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 
                                         data-[state=active]:text-primary data-[state=active]:shadow-md
                                         hover:text-primary group text-[10px] font-bold uppercase tracking-tight shrink-0"
                            >
                                <Settings className="h-3 w-3 opacity-70 group-data-[state=active]:opacity-100 transition-all" />
                                Agendamento
                            </TabsTrigger>
                        )}
                        {professional?.id && (
                            <TabsTrigger
                                value="integrations"
                                className="relative px-3 py-1.5 rounded-md gap-1.5 transition-all duration-300
                                         data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 
                                         data-[state=active]:text-primary data-[state=active]:shadow-md
                                         hover:text-primary group text-[10px] font-bold uppercase tracking-tight shrink-0"
                            >
                                <Share2 className="h-3 w-3 opacity-70 group-data-[state=active]:opacity-100 transition-all" />
                                Integrações
                            </TabsTrigger>
                        )}
                        {professional?.id && (
                            <TabsTrigger
                                value="security"
                                className="relative px-3 py-1.5 rounded-md gap-1.5 transition-all duration-300
                                         data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 
                                         data-[state=active]:text-primary data-[state=active]:shadow-md
                                         hover:text-primary group text-[10px] font-bold uppercase tracking-tight shrink-0"
                            >
                                <Shield className="h-3 w-3 opacity-70 group-data-[state=active]:opacity-100 transition-all" />
                                Segurança
                            </TabsTrigger>
                        )}
                        {!professional && (
                            <TabsTrigger
                                value="access"
                                className="relative px-3 py-1.5 rounded-md gap-1.5 transition-all duration-300
                                         data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 
                                         data-[state=active]:text-primary data-[state=active]:shadow-md
                                         hover:text-primary group text-[10px] font-bold uppercase tracking-tight shrink-0"
                            >
                                <Lock className="h-3 w-3 opacity-70 group-data-[state=active]:opacity-100 transition-all" />
                                Acesso
                            </TabsTrigger>
                        )}
                    </TabsList>

                    {/* --- 1. DADOS PESSOAIS (Merged) --- */}
                    <TabPanel value="personal">
                        {/* IDENTIFICAÇÃO */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Identificação</CardTitle>
                                <CardDescription>Dados pessoais e profissionais básicos.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">

                                {/* PHOTO + BASIC INFO */}
                                <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6 border-b pb-6">
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
                                            name="photo_input"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handlePhotoSelect}
                                        />
                                    </div>
                                    <div className="flex-1 w-full grid gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="full_name">Nome Completo *</Label>
                                            <Input
                                                id="full_name"
                                                name="full_name"
                                                defaultValue={professional?.full_name}
                                                onChange={(e) => handleFormChange('full_name', e.target.value)}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="email">Email (Login) *</Label>
                                                <Input
                                                    id="email"
                                                    name="email"
                                                    type="email"
                                                    disabled={!!professional} // Email is immutable after creation usually
                                                    defaultValue={professional?.email} // Assuming email is in professional object or needs to be passed
                                                    onChange={(e) => handleFormChange('email', e.target.value)}
                                                    placeholder="email@exemplo.com"
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="phone">Celular/WhatsApp *</Label>
                                                <Input
                                                    id="phone"
                                                    name="phone"
                                                    placeholder="(00) 00000-0000"
                                                    value={formData.phone}
                                                    onChange={handleDisplayPhoneChange}
                                                    maxLength={15}
                                                />
                                            </div>
                                        </div>
                                    </div>
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
                                                const masked = VMasker.toPattern(e.target.value.replace(/\D/g, ""), "999.999.999-99")
                                                e.target.value = masked
                                                handleFormChange('cpf', masked)
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
                                            onChange={(e) => {
                                                const v = e.target.value
                                                const masked = VMasker.toPattern(v.replace(/\D/g, ""), "99/99/9999")
                                                e.target.value = masked
                                                setBirthdate(masked)
                                            }}
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

                            </CardContent>
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

                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                    <div className="col-span-4 grid gap-2">
                                        <Label htmlFor="council_type">Conselho</Label>
                                        <Select name="council_type" defaultValue={professional?.council_type || "CREFITO"}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="CREFITO">CREFITO</SelectItem>
                                                <SelectItem value="COREN">COREN</SelectItem>
                                                <SelectItem value="CRM">CRM</SelectItem>
                                                <SelectItem value="CFP">CFP</SelectItem>
                                                <SelectItem value="CRN">CRN</SelectItem>
                                                <SelectItem value="CRO">CRO</SelectItem>
                                                <SelectItem value="CRBM">CRBM</SelectItem>
                                                <SelectItem value="CRFa">CRFa</SelectItem>
                                                <SelectItem value="OUTRO">OUTRO</SelectItem>

                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="col-span-4 grid gap-2">
                                        <Label htmlFor="council_number">Número do Registro</Label>
                                        <Input
                                            id="council_number"
                                            name="council_number"
                                            value={formData.council_number}
                                            onChange={(e) => handleFormChange('council_number', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-4 grid gap-2">
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
                                    <Label htmlFor="bio">Bio / Resumo (Aparece no agendamento online)</Label>
                                    <Textarea
                                        id="bio"
                                        name="bio"
                                        placeholder="Fisioterapeuta especialista em..."
                                        value={formData.bio}
                                        onChange={(e) => handleFormChange('bio', e.target.value)}
                                    />
                                </div>
                                {canManageRoles && roles.length > 0 && (
                                    <div className="grid gap-2 pt-2">
                                        <Label htmlFor="role_id">Perfil de Acesso</Label>
                                        <Select
                                            name="role_id"
                                            value={formData.role_id || ""}
                                            onValueChange={(val) => handleFormChange('role_id', val)}
                                        >
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
                            </CardContent>
                        </Card>
                    </TabPanel>

                    {/* --- 5. SERVIÇOS --- */}
                    <TabPanel value="services">
                        <div className="grid gap-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">Serviços Habilitados</h3>
                                    <p className="text-sm text-muted-foreground">Selecione quais atendimentos este profissional pode realizar.</p>
                                </div>
                                <Badge variant="secondary" className="w-fit h-7 px-3 font-bold bg-primary/10 text-primary border-primary/20">
                                    {selectedServices.length} {selectedServices.length === 1 ? 'Serviço Selecionado' : 'Serviços Selecionados'}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {services.map(service => {
                                    const isSelected = selectedServices.includes(service.id);
                                    return (
                                        <Card
                                            key={service.id}
                                            className={cn(
                                                "relative overflow-hidden cursor-pointer transition-all duration-300 border-2",
                                                isSelected
                                                    ? "border-primary bg-primary/5 shadow-md shadow-primary/10 scale-[1.02]"
                                                    : "border-slate-100 hover:border-slate-200 hover:bg-slate-50 shadow-sm"
                                            )}
                                            onClick={() => toggleService(service.id)}
                                        >
                                            <CardContent className="p-5">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div
                                                        className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner"
                                                        style={{ backgroundColor: `${service.color || '#6366f1'}20`, color: service.color || '#6366f1' }}
                                                    >
                                                        <Briefcase className="h-6 w-6" />
                                                    </div>
                                                    <div className={cn(
                                                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                                        isSelected ? "bg-primary border-primary" : "border-slate-200"
                                                    )}>
                                                        {isSelected && <CheckCircle2 className="h-4 w-4 text-white" />}
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <h4 className="font-bold text-slate-800 leading-tight">
                                                        {service.name}
                                                    </h4>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                        {service.type === 'smart' ? 'IA Avançado' : 'Padrão'}
                                                    </p>
                                                </div>

                                                <div className="mt-4 pt-4 border-t border-slate-100/50 flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        {service.duration} min
                                                    </div>
                                                    <div className="text-sm font-black text-slate-700">
                                                        R$ {service.price}
                                                    </div>
                                                </div>
                                            </CardContent>

                                            {/* Decorative Background Element */}
                                            {isSelected && (
                                                <div className="absolute -bottom-2 -right-2 opacity-5">
                                                    <Briefcase className="h-16 w-16 rotate-12" />
                                                </div>
                                            )}
                                        </Card>
                                    )
                                })}

                                {services.length === 0 && (
                                    <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/50">
                                        <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-4 opacity-50" />
                                        <h3 className="text-lg font-bold text-slate-700">Nenhum serviço disponível</h3>
                                        <p className="text-slate-500 max-w-xs mx-auto mb-6">
                                            Você precisa cadastrar serviços nas configurações antes de associá-los aos profissionais.
                                        </p>
                                        <Button
                                            variant="outline"
                                            onClick={() => router.push(`/dashboard/${slug}/services`)}
                                            className="rounded-xl border-slate-200 font-bold"
                                        >
                                            Ir para Gestão de Serviços
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabPanel>

                    {/* --- 3. ENDEREÇO (Address Only) --- */}
                    <TabPanel value="address">
                        <Card>
                            <CardHeader>
                                <CardTitle>Endereço Residencial</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">

                                {/* LINHA 1: CEP (Sozinho) */}
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                    <div className="md:col-span-3 grid gap-2">
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

                                {/* LINHA 2: Rua, Número, Complemento */}
                                <div className="grid grid-cols-12 gap-4">
                                    {/* Rua (8/12) */}
                                    <div className="col-span-8 grid gap-2">
                                        <Label htmlFor="address_street">Rua/Logradouro</Label>
                                        <Input
                                            id="address_street"
                                            name="address_street"
                                            value={addressData.street}
                                            onChange={(e) => setAddressData({ ...addressData, street: e.target.value })}
                                        />
                                    </div>

                                    {/* Número (2/12) */}
                                    <div className="col-span-2 grid gap-2">
                                        <Label htmlFor="address_number">Número</Label>
                                        <Input
                                            ref={addressNumberRef}
                                            id="address_number"
                                            name="address_number"
                                            defaultValue={professional?.address_number}
                                        />
                                    </div>

                                    {/* Complemento (2/12) */}
                                    <div className="col-span-2 grid gap-2">
                                        <Label htmlFor="address_complement">Complemento</Label>
                                        <Input
                                            id="address_complement"
                                            name="address_complement"
                                            value={addressData.complement}
                                            onChange={(e) => setAddressData({ ...addressData, complement: e.target.value })}
                                            placeholder="Apto, Bloco..."
                                        />
                                    </div>
                                </div>

                                {/* LINHA 3: Bairro, Cidade, UF */}
                                <div className="grid grid-cols-12 gap-4">
                                    {/* Bairro (6/12) */}
                                    <div className="col-span-6 grid gap-2">
                                        <Label htmlFor="address_neighborhood">Bairro</Label>
                                        <Input
                                            id="address_neighborhood"
                                            name="address_neighborhood"
                                            value={addressData.neighborhood}
                                            onChange={(e) => setAddressData({ ...addressData, neighborhood: e.target.value })}
                                        />
                                    </div>

                                    {/* Cidade (4/12) - Aumentei um pouco */}
                                    <div className="col-span-4 grid gap-2">
                                        <Label htmlFor="address_city">Cidade</Label>
                                        <Input
                                            id="address_city"
                                            name="address_city"
                                            value={addressData.city}
                                            onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                                        />
                                    </div>

                                    {/* UF (2/12) - Ajustei para 3 */}
                                    <div className="col-span-2 grid gap-2">
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
                    </TabPanel>

                    {/* --- 6. HORÁRIOS --- */}
                    {professional?.id && (
                        <TabPanel value="availability">
                            <ProfessionalAvailability professionalId={professional.id} />
                        </TabPanel>
                    )}

                    {/* --- 7. COMISSÕES --- */}
                    {professional?.id && (
                        <TabPanel value="commissions">
                            <CommissionSettings profileId={professional.id} slug={slug as string} />
                        </TabPanel>
                    )}

                    {/* --- 10. CONFIGURAÇÕES DE AGENDAMENTO --- */}
                    {professional?.id && (
                        <TabPanel value="scheduling">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-5 w-5 text-primary" />
                                        <CardTitle className="text-xl">Configurações de Agendamento</CardTitle>
                                    </div>
                                    <CardDescription>Gerencie intervalos e notificações personalizadas para sua agenda.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* 0. Grid Settings (Migrated from Availability for stability) */}
                                    <div className="grid md:grid-cols-2 gap-6 border-b pb-6">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between p-3 border rounded-lg bg-primary/5 border-primary/10">
                                                <div className="grid gap-1">
                                                    <Label className="font-semibold">Intervalo de Tempo</Label>
                                                    <span className="text-xs text-muted-foreground">Tamanho dos blocos na agenda visual</span>
                                                </div>
                                                <Select value={slotInterval} onValueChange={setSlotInterval}>
                                                    <SelectTrigger className="w-[120px] h-9">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="15">15 min</SelectItem>
                                                        <SelectItem value="30">30 min</SelectItem>
                                                        <SelectItem value="45">45 min</SelectItem>
                                                        <SelectItem value="60">60 min</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <input type="hidden" name="slot_interval" value={slotInterval} />
                                            </div>

                                            <div className="flex items-center justify-between p-3 border rounded-lg bg-background">
                                                <div className="grid gap-1">
                                                    <Label className="font-semibold">Agendamento Online</Label>
                                                    <span className="text-xs text-muted-foreground">Permitir que pacientes agendem pelo site</span>
                                                </div>
                                                <Switch
                                                    checked={onlineBookingEnabled}
                                                    onCheckedChange={setOnlineBookingEnabled}
                                                />
                                                <input type="hidden" name="online_booking_enabled" value={String(onlineBookingEnabled)} />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between p-3 border rounded-lg bg-background">
                                                <div className="grid gap-1">
                                                    <Label className="font-semibold">Antecedência Mínima (Dias)</Label>
                                                    <span className="text-xs text-muted-foreground">0 = Mesmo dia, 1 = Próximo dia...</span>
                                                </div>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max="30"
                                                    className="w-[80px] h-9 text-center font-bold"
                                                    value={minAdvanceDays}
                                                    onChange={(e) => setMinAdvanceDays(e.target.value)}
                                                />
                                                <input type="hidden" name="min_advance_booking_days" value={minAdvanceDays} />
                                            </div>

                                            <div className="flex items-center justify-between p-3 border rounded-lg bg-background">
                                                <div className="grid gap-1">
                                                    <Label className="font-semibold">Permitir Encaixes</Label>
                                                    <span className="text-xs text-muted-foreground">Aceitar conflitos de horário</span>
                                                </div>
                                                <Switch
                                                    checked={allowOverbooking}
                                                    onCheckedChange={setAllowOverbooking}
                                                />
                                                <input type="hidden" name="allow_overbooking" value={String(allowOverbooking)} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* 1. Buffer (Tempos de Respiro) */}
                                    <div className="flex items-start justify-between border-b pb-6">
                                        <div className="space-y-1 pr-4">
                                            <Label className="text-base font-semibold">Tempos de Respiro (Buffers)</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Adiciona automaticamente um intervalo entre pacientes para limpeza da sala ou preenchimento de prontuário.
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-3 min-w-[140px]">
                                            <Switch
                                                checked={bufferEnabled}
                                                onCheckedChange={setBufferEnabled}
                                            />
                                            <input type="hidden" name="buffer_enabled" value={String(bufferEnabled)} />

                                            {bufferEnabled && (
                                                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                                                    <Select value={bufferTime} onValueChange={setBufferTime}>
                                                        <SelectTrigger className="w-[140px] h-9 bg-primary/5 border-primary/20 text-primary">
                                                            <SelectValue placeholder="Escolha o tempo" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="5">5 minutos</SelectItem>
                                                            <SelectItem value="10">10 minutos</SelectItem>
                                                            <SelectItem value="15">15 minutos</SelectItem>
                                                            <SelectItem value="20">20 minutos</SelectItem>
                                                            <SelectItem value="30">30 minutos</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <input type="hidden" name="buffer_time" value={bufferTime} />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 2. Daily Agenda WhatsApp */}
                                    <div className="flex items-start justify-between border-b pb-6">
                                        <div className="space-y-1 pr-4">
                                            <Label className="text-base font-semibold">Resumo da Agenda por WhatsApp</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Receba automaticamente todos os dias às 20h a sua agenda completa do dia seguinte no seu WhatsApp.
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <Switch
                                                checked={receiveDailyAgenda}
                                                onCheckedChange={setReceiveDailyAgenda}
                                            />
                                            <input type="hidden" name="receive_daily_agenda_whatsapp" value={String(receiveDailyAgenda)} />
                                        </div>
                                    </div>

                                    {/* 3. WhatsApp Reminders (24h) */}
                                    <div className="flex items-start justify-between pb-2">
                                        <div className="space-y-1 pr-4">
                                            <Label className="text-base font-semibold">Lembretes Automáticos (24h)</Label>
                                            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                                <MessageSquare className="h-3.5 w-3.5 text-green-600" />
                                                Confirmar presença do paciente via WhatsApp 24h antes do horário marcado.
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <Switch
                                                checked={whatsappRemindersEnabled}
                                                onCheckedChange={setWhatsappRemindersEnabled}
                                            />
                                            <input type="hidden" name="whatsapp_reminders_enabled" value={String(whatsappRemindersEnabled)} />
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-muted/30 border-t p-4 flex gap-3">
                                    <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0" />
                                    <p className="text-xs text-muted-foreground">
                                        <strong>Nota:</strong> Estas configurações são individuais e aplicadas apenas para os seus agendamentos.
                                        Lembre-se de salvar as alterações no topo da página.
                                    </p>
                                </CardFooter>
                            </Card>
                        </TabPanel>
                    )}

                    {/* --- 8. INTEGRAÇÕES (Google) --- */}
                    {professional?.id && (
                        <TabPanel value="integrations">
                            <div className="w-full">
                                <h3 className="text-lg font-medium mb-4">Integrações Externas</h3>
                                <GoogleIntegration profileId={professional.id} />
                            </div>
                        </TabPanel>
                    )}

                    {/* --- 9. SECURITY (Update Password) --- */}
                    {professional?.id && (
                        <TabPanel value="security">
                            <div className="w-full space-y-8">
                                <Card className="border-destructive/20">
                                    <CardHeader>
                                        <CardTitle>Segurança da Conta</CardTitle>
                                        <CardDescription>Atualize sua senha de acesso.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="password_update">Nova Senha</Label>
                                            <PasswordInput
                                                id="password_update"
                                                name="password"
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

                                <AdminPasswordCard />

                                <div className="w-full">
                                    <SecuritySettings />
                                </div>
                            </div>
                        </TabPanel>
                    )}

                    {/* --- 4. ACESSO (Only for Create) --- */}
                    {!professional && (
                        <TabPanel value="access">
                            <Card className="border-primary/50 bg-primary/5">
                                <CardHeader>
                                    <CardTitle className="text-primary">Credenciais de Acesso</CardTitle>
                                    <CardDescription>Defina como este profissional fará login no sistema.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email (Login) *</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => handleFormChange('email', e.target.value)}
                                        />
                                    </div>

                                    {canManageRoles && roles.length > 0 && (
                                        <div className="grid gap-2">
                                            <Label htmlFor="role_id_new">Perfil de Acesso</Label>
                                            <Select
                                                name="role_id"
                                                value={formData.role_id || (roles.find(r => r.name === 'Profissional')?.id) || ""}
                                                onValueChange={(val) => handleFormChange('role_id', val)}
                                            >
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
                                        <Label htmlFor="password">Senha Inicial *</Label>
                                        <PasswordInput
                                            id="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={(e) => handleFormChange('password', e.target.value)}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabPanel>
                    )}
                </Tabs>
            </fieldset>
        </form>
    )
}
