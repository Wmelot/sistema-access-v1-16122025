"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { createProfessional, updateProfessional } from "../actions"
import { ProfessionalAvailability } from "./professional-availability"
import { CommissionSettings } from "../[id]/commission-settings"
import { useRouter } from "next/navigation"

import VMasker from "vanilla-masker"
import { Badge } from "@/components/ui/badge"
import { X, User, Upload } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ProfessionalFormProps {
    professional?: any
    services: any[]
}

export function ProfessionalForm({ professional, services }: ProfessionalFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState("personal")

    // Controlled state for Color Picker preview
    const [color, setColor] = useState(professional?.color || "#3b82f6")

    const [specialties, setSpecialties] = useState<string[]>(professional?.specialty ? professional.specialty.split(',') : [])
    const [specialtyInput, setSpecialtyInput] = useState("")

    // Controlled inputs for Address Auto-fill
    const [addressData, setAddressData] = useState({
        zip: professional?.address_zip || "",
        street: professional?.address_street || "",
        neighborhood: professional?.address_neighborhood || "",
        city: professional?.address_city || "",
        state: professional?.address_state || "",
        complement: professional?.address_complement || ""
    })

    // Ref to focus on Number input after CEP autofill
    const addressNumberRef = useRef<HTMLInputElement>(null)

    const [birthdate, setBirthdate] = useState(professional?.birthdate ? new Date(professional.birthdate).toLocaleDateString('pt-BR') : "")
    const [photoPreview, setPhotoPreview] = useState(professional?.photo_url || "")

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
                    // Focus on Number field
                    setTimeout(() => addressNumberRef.current?.focus(), 100)
                } else {
                    toast.error("CEP não encontrado.")
                }
            } catch (error) {
                toast.error("Erro ao buscar CEP.")
            }
        }
    }

    // ... later in the JSX ...

    {/* --- 4. ENDEREÇO --- */ }
    <TabsContent value="address">
        <Card>
            <CardHeader>
                <CardTitle>Endereço e Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="phone">Telefone / WhatsApp</Label>
                        <Input id="phone" name="phone" defaultValue={professional?.phone} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="address_zip">CEP</Label>
                        <Input
                            id="address_zip"
                            name="address_zip"
                            value={addressData.zip}
                            onChange={handleCepChange}
                            maxLength={9}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 grid gap-2">
                        <Label htmlFor="address_street">Rua / Logradouro</Label>
                        <Input
                            id="address_street"
                            name="address_street"
                            value={addressData.street}
                            onChange={e => setAddressData({ ...addressData, street: e.target.value })}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="address_number">Número</Label>
                        <Input
                            id="address_number"
                            name="address_number"
                            defaultValue={professional?.address_number}
                            ref={addressNumberRef}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="address_complement">Complemento</Label>
                        <Input
                            id="address_complement"
                            name="address_complement"
                            defaultValue={professional?.address_complement}
                            placeholder="Ex: Apto 101, Sala 5"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="address_neighborhood">Bairro</Label>
                        <Input
                            id="address_neighborhood"
                            name="address_neighborhood"
                            value={addressData.neighborhood}
                            onChange={e => setAddressData({ ...addressData, neighborhood: e.target.value })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="address_city">Cidade</Label>
                        <Input
                            id="address_city"
                            name="address_city"
                            value={addressData.city}
                            onChange={e => setAddressData({ ...addressData, city: e.target.value })}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="address_state">Estado (UF)</Label>
                        <Input
                            id="address_state"
                            name="address_state"
                            value={addressData.state}
                            onChange={e => setAddressData({ ...addressData, state: e.target.value })}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    </TabsContent>

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, "")
        const masked = VMasker.toPattern(raw, "99/99/9999")
        setBirthdate(masked)
    }

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const url = URL.createObjectURL(file)
            setPhotoPreview(url)
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
        // Append specialties as comma-separated string
        formData.set('specialty', specialties.join(','))
        // Append controlled address fields if not naturally caught (inputs have names, but controlled value)
        // Since we use defaultValue in render, we should switch to value={state} for address fields to reflect updates

        // Need to convert 'dd/mm/yyyy' to 'yyyy-mm-dd' for DB
        const [day, month, year] = birthdate.split('/')
        if (day && month && year && year.length === 4) {
            formData.set('birthdate', `${year}-${month}-${day}`)
        } else {
            formData.delete('birthdate') // Remove if invalid or empty
        }

        // Manually set address fields from state to ensure they are included,
        // as they are controlled inputs and might not be picked up by FormData if not interacted with.
        formData.set('address_zip', addressData.zip);
        formData.set('address_street', addressData.street);
        formData.set('address_neighborhood', addressData.neighborhood);
        formData.set('address_city', addressData.city);
        formData.set('address_state', addressData.state);

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
        // Small timeout to ensure DOM update, though usually not needed if simple state
        setTimeout(() => {
            formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
    }

    return (
        <form action={handleSubmit} className="space-y-8 max-w-5xl mx-auto">
            {/* Scroll Target */}
            <div ref={formTopRef} className="scroll-mt-24" />

            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">
                        {professional ? "Editar Profissional" : "Novo Profissional"}
                    </h2>
                    <p className="text-muted-foreground">Preencha os dados completos para o prontuário e acesso.</p>
                </div>
                <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? "Salvando..." : (professional ? "Salvar Alterações" : "Cadastrar Profissional")}
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-4">
                <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 bg-muted p-1 md:w-auto md:bg-transparent md:p-0">
                    <TabsTrigger value="personal" className="flex-1 md:flex-none data-[state=active]:bg-background data-[state=active]:shadow-sm md:data-[state=active]:bg-muted md:data-[state=active]:text-foreground">Dados Pessoais</TabsTrigger>
                    <TabsTrigger value="professional" className="flex-1 md:flex-none data-[state=active]:bg-background data-[state=active]:shadow-sm md:data-[state=active]:bg-muted md:data-[state=active]:text-foreground">Profissional</TabsTrigger>
                    <TabsTrigger value="services" className="flex-1 md:flex-none data-[state=active]:bg-background data-[state=active]:shadow-sm md:data-[state=active]:bg-muted md:data-[state=active]:text-foreground">Serviços</TabsTrigger>
                    <TabsTrigger value="address" className="flex-1 md:flex-none data-[state=active]:bg-background data-[state=active]:shadow-sm md:data-[state=active]:bg-muted md:data-[state=active]:text-foreground">Endereço/Contato</TabsTrigger>
                    {professional?.id && <TabsTrigger value="availability" className="flex-1 md:flex-none data-[state=active]:bg-background data-[state=active]:shadow-sm md:data-[state=active]:bg-muted md:data-[state=active]:text-foreground">Horários</TabsTrigger>}
                    {professional?.id && <TabsTrigger value="commissions" className="flex-1 md:flex-none data-[state=active]:bg-background data-[state=active]:shadow-sm md:data-[state=active]:bg-muted md:data-[state=active]:text-foreground">Comissões</TabsTrigger>}
                    {!professional && <TabsTrigger value="access" className="flex-1 md:flex-none data-[state=active]:bg-background data-[state=active]:shadow-sm md:data-[state=active]:bg-muted md:data-[state=active]:text-foreground">Acesso</TabsTrigger>}
                </TabsList>

                {/* --- 1. DADOS PESSOAIS --- */}
                <TabsContent value="personal" forceMount={true}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Identificação</CardTitle>
                            <CardDescription>Dados básicos obrigatórios.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">

                            {/* PHOTO UPLOAD */}
                            <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
                                <div className="relative group">
                                    <Avatar className="h-24 w-24 border-2 border-border cursor-pointer hover:opacity-90">
                                        <AvatarImage src={photoPreview} className="object-cover" />
                                        <AvatarFallback className="bg-muted text-4xl text-muted-foreground">
                                            <User />
                                        </AvatarFallback>
                                    </Avatar>
                                    <label htmlFor="photo-upload" className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 cursor-pointer shadow-sm hover:bg-primary/90">
                                        <Upload className="h-4 w-4" />
                                    </label>
                                    <Input
                                        id="photo-upload"
                                        type="file"
                                        name="photo"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handlePhotoChange}
                                    />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <h3 className="font-medium">Foto de Perfil</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Essa foto aparecerá na agenda e no cartão do profissional.
                                        Recomendamos formato quadrado (ex: 500x500px).
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
                                    <Input id="cpf" name="cpf" placeholder="000.000.000-00" defaultValue={professional?.cpf} />
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
                <TabsContent value="professional" forceMount={true}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Dados Técnicos</CardTitle>
                            <CardDescription>Registro no conselho e aparência na agenda.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
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
                                    {/* Hidden input to ensure FormData picks up the specialties array as a single string */}
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
                </TabsContent>

                {/* --- 5. SERVIÇOS --- */}
                <TabsContent value="services" forceMount={true}>
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
                <TabsContent value="address" forceMount={true}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Contato & Endereço</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="phone">Celular/WhatsApp</Label>
                                    <Input id="phone" name="phone" placeholder="(00) 00000-0000" defaultValue={professional?.phone} />
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
                                    <Input id="address_number" name="address_number" defaultValue={professional?.address_number} />
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
                    <TabsContent value="availability" forceMount={true}>
                        <ProfessionalAvailability professionalId={professional.id} />
                    </TabsContent>
                )}

                {/* --- 7. COMISSÕES --- */}
                {professional?.id && (
                    <TabsContent value="commissions" forceMount={true}>
                        <CommissionSettings profileId={professional.id} />
                    </TabsContent>
                )}

                {/* --- 4. ACESSO (Only for Create) --- */}
                {!professional && (
                    <TabsContent value="access" forceMount={true}>
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
        </form>
    )
}
