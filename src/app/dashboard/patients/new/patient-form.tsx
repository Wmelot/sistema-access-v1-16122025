"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardFooter,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { DateInput } from "@/components/ui/date-input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { createPatient, updatePatient, searchCep } from "@/app/dashboard/patients/actions"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { cpf } from 'cpf-cnpj-validator'
import VMasker from 'vanilla-masker'
import 'react-phone-number-input/style.css'
import PhoneInput, { Country } from 'react-phone-number-input'
import pt from 'react-phone-number-input/locale/pt'
import { getExampleNumber } from 'libphonenumber-js'
import examples from 'libphonenumber-js/examples.mobile.json'

interface PatientFormProps {
    existingPatients: { id: string, full_name: string }[]
    priceTables: any[]
    initialData?: any
    appointmentId?: string
    mode?: string
}

export default function PatientForm({ existingPatients, priceTables, initialData, appointmentId, mode }: PatientFormProps) {
    const router = useRouter()

    const [cpfError, setCpfError] = useState("")
    const [loadingCep, setLoadingCep] = useState(false)
    const [isMounted, setIsMounted] = useState(false)

    // Initial State Population
    const [formPhone, setFormPhone] = useState<string | undefined>(() => {
        const raw = initialData?.phone
        if (!raw) return undefined
        // Fix for legacy data: if missing + but looks like BR number (10 or 11 digits), add +55
        // Or if it's just numbers, try to prepend +
        if (!raw.startsWith('+')) {
            const clean = raw.replace(/\D/g, "")
            if (clean.length === 10 || clean.length === 11) {
                return `+55${clean}`
            }
            return `+${clean}`
        }
        return raw
    })
    const [marketingSource, setMarketingSource] = useState(initialData?.marketing_source || "")
    const [relatedPatientId, setRelatedPatientId] = useState(initialData?.related_patient_id || "")
    const [relationshipDegree, setRelationshipDegree] = useState(initialData?.relationship_degree || "")
    const [gender, setGender] = useState(initialData?.gender || "")
    const [priceTableId, setPriceTableId] = useState(initialData?.price_table_id || "")

    // Default unchecked as per requirements
    const [isForeigner, setIsForeigner] = useState(false)
    const [country, setCountry] = useState<Country | undefined>("BR")

    // Invoice State
    const [showInvoiceParams, setShowInvoiceParams] = useState(!!initialData?.invoice_cpf)
    const [invoiceFormData, setInvoiceFormData] = useState({
        invoice_name: initialData?.invoice_name || "",
        invoice_cpf: initialData?.invoice_cpf || "",
        invoice_cep: initialData?.invoice_address_zip || "",
        invoice_address: initialData?.invoice_address || "",
        invoice_number: initialData?.invoice_number || "",
        invoice_complement: initialData?.invoice_complement || "", // Fixed prop name
        invoice_neighborhood: initialData?.invoice_neighborhood || "",
        invoice_city: initialData?.invoice_city || "",
        invoice_state: initialData?.invoice_state || ""
    })

    // Main Form Data
    const [formData, setFormData] = useState({
        full_name: initialData?.name || "",
        cpf: initialData?.cpf || "",
        // Safe Date Parsing
        date_of_birth: (() => {
            if (!initialData?.date_of_birth) return "";
            try {
                // Ensure we handle various date formats safe for inputs
                return new Date(initialData.date_of_birth).toISOString().split('T')[0];
            } catch (e) {
                console.error("SafeDateParsing Error:", e);
                return "";
            }
        })(),
        email: initialData?.email || "",
        cep: initialData?.cep || "",
        address: initialData?.address || "",
        number: initialData?.number || "",
        complement: initialData?.complement || "",
        neighborhood: initialData?.neighborhood || "",
        city: initialData?.city || "",
        state: initialData?.state || "",
        occupation: initialData?.occupation || ""
    })

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const fetchCep = async (cepRaw: string, isInvoice = false) => {
        if (cepRaw.length !== 8) return

        setLoadingCep(true)
        try {
            // Use Server Action instead of client-side fetch to avoid CORS/Network issues
            const result = await searchCep(cepRaw)

            if (result.data) {
                const data = result.data
                if (isInvoice) {
                    setInvoiceFormData(prev => ({
                        ...prev,
                        invoice_address: data.logradouro,
                        invoice_neighborhood: data.bairro,
                        invoice_city: data.localidade,
                        invoice_state: data.uf,
                        invoice_cep: VMasker.toPattern(cepRaw, "99999-999")
                    }))
                } else {
                    setFormData(prev => ({
                        ...prev,
                        address: data.logradouro,
                        neighborhood: data.bairro,
                        city: data.localidade,
                        state: data.uf,
                        cep: VMasker.toPattern(cepRaw, "99999-999")
                    }))
                    // Attempt to focus number field
                    setTimeout(() => document.getElementById('number')?.focus(), 100)
                }
                toast.success("Endereço encontrado!")
            } else {
                toast.error(result.error || "CEP não encontrado.")
            }
        } catch (error) {
            console.error(error)
            toast.error("Erro ao buscar CEP")
        } finally {
            setLoadingCep(false)
        }
    }

    // Auto-fetch address on mount
    useEffect(() => {
        if (isMounted && formData.cep && !formData.address) {
            const raw = formData.cep.replace(/\D/g, "")
            if (raw.length === 8) {
                fetchCep(raw)
            }
        }
    }, [isMounted]) // Run once on mount/check

    if (!isMounted) {
        return <div className="p-6">Carregando formulário...</div>
    }

    // Handlers
    const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, "")
        const masked = VMasker.toPattern(raw, "999.999.999-99")

        // Logic: If user types CPF, uncheck S/CPF. If empty, check S/CPF.
        if (raw.length > 0) {
            setIsForeigner(false)
        } else {
            setIsForeigner(true)
        }

        setFormData(prev => ({ ...prev, cpf: masked }))

        if (raw.length === 11) {
            setCpfError(cpf.isValid(raw) ? "" : "CPF Inválido")
        } else {
            setCpfError("")
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, "")
        const masked = VMasker.toPattern(raw, "99999-999")
        setFormData(prev => ({ ...prev, cep: masked }))
        if (raw.length === 8) await fetchCep(raw)
    }

    // Invoice Handlers
    const handleInvoiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInvoiceFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }
    const handleInvoiceCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, "")
        const masked = VMasker.toPattern(raw, "99999-999")
        setInvoiceFormData(prev => ({ ...prev, invoice_cep: masked }))
        if (raw.length === 8) await fetchCep(raw, true)
    }

    const copyAddressToInvoice = () => {
        setInvoiceFormData(prev => ({
            ...prev,
            invoice_cep: formData.cep,
            invoice_address: formData.address,
            invoice_number: formData.number,
            invoice_neighborhood: formData.neighborhood,
            invoice_city: formData.city,
            invoice_state: formData.state
        }))
        toast.success("Endereço copiado!")
    }

    async function handleSubmit(form: FormData) {
        const errors: string[] = []

        if (!formData.full_name) errors.push("Nome Completo")
        if (!formPhone) errors.push("Telefone")

        if (!isForeigner) {
            const rawCpf = formData.cpf.replace(/\D/g, "")
            if (rawCpf && !cpf.isValid(rawCpf)) {
                toast.error("CPF Inválido. Corrija antes de salvar.")
                return
            }
        }

        if (errors.length > 0) {
            toast.error(`Campos obrigatórios faltando: ${errors.join(', ')}`)
            return
        }

        if (isForeigner) {
            form.set('cpf', '')
        }

        // Add Invoice Data if Checkbox is checked
        if (showInvoiceParams) {
            form.append('invoice_name', invoiceFormData.invoice_name)
            form.append('invoice_cpf', invoiceFormData.invoice_cpf)
            form.append('invoice_address_zip', invoiceFormData.invoice_cep)
            form.append('invoice_address', invoiceFormData.invoice_address)
            form.append('invoice_number', invoiceFormData.invoice_number)
            form.append('invoice_neighborhood', invoiceFormData.invoice_neighborhood)
            form.append('invoice_city', invoiceFormData.invoice_city)
            form.append('invoice_state', invoiceFormData.invoice_state)
        }

        try {
            const action = initialData ? updatePatient.bind(null, initialData.id) : createPatient
            console.log("Submitting form data...", Object.fromEntries(form.entries())) // Debug log

            const result = await action(form)

            if (result?.error) {
                console.error("Server Action Error:", result.error)
                toast.error("Erro ao salvar: " + result.error)
            } else {
                console.log("Success:", result)
                toast.success(initialData ? "Paciente atualizado!" : "Paciente criado!")
                if (appointmentId && initialData?.id) {
                    router.push(`/dashboard/patients/${initialData.id}?appointmentId=${appointmentId}&mode=${mode || 'evolution'}`)
                } else if (initialData?.id) {
                    router.push(`/dashboard/patients/${initialData.id}`)
                } else {
                    // Start fresh or use the ID returned from server if available (for create)
                    // The server action now returns { success: true, patient: { id } }
                    // We can redirect to the new patient's profile
                    if (result?.patient?.id) {
                        router.push(`/dashboard/patients/${result.patient.id}`)
                    } else {
                        router.push('/dashboard/patients')
                    }
                }
            }
        } catch (error) {
            console.error("Client Submission Error:", error)
            toast.error("Erro inesperado ao enviar formulário.")
        }
    }

    return (
        <form action={handleSubmit}>
            <Card className="overflow-hidden">
                <CardContent className="p-6 grid gap-6">

                    {/* --- ROW 1: Nome | S/CPF | CPF | Nascimento --- */}
                    <div className="flex flex-col md:flex-row gap-3 items-end">
                        <div className="flex-1 min-w-[250px] space-y-2">
                            <Label htmlFor="full_name" className="text-xs font-bold text-muted-foreground uppercase">Nome Completo *</Label>
                            <Input
                                id="full_name"
                                name="full_name"
                                placeholder="Nome do Paciente"
                                value={formData.full_name}
                                onChange={handleChange}
                                className="h-9"
                            />
                        </div>

                        <div className="flex flex-col items-center flex-none w-[50px] space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground uppercase">S/CPF</Label>
                            <div className="h-9 flex items-center justify-center">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="isForeigner"
                                        checked={isForeigner}
                                        onCheckedChange={(c) => {
                                            const checked = !!c
                                            setIsForeigner(checked)
                                            if (checked) {
                                                setShowInvoiceParams(true)
                                                // Optional: Clear CPF here if desired
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 min-w-[160px] space-y-2">
                            <Label htmlFor="cpf" className="text-xs font-bold text-muted-foreground uppercase">CPF</Label>
                            <Input
                                id="cpf"
                                name="cpf"
                                placeholder="000.000.000-00"
                                value={formData.cpf}
                                onChange={handleCpfChange}
                                className={`h-9 ${cpfError ? "border-red-500" : ""}`}
                            />
                        </div>

                        <div className="w-[130px] flex-none space-y-2">
                            <Label htmlFor="date_of_birth" className="text-xs font-bold text-muted-foreground uppercase">Nascimento</Label>
                            <DateInput
                                id="date_of_birth"
                                name="date_of_birth"
                                value={formData.date_of_birth}
                                onChange={(val) => setFormData(prev => ({ ...prev, date_of_birth: val }))}
                                className="h-9"
                            />
                        </div>
                    </div>

                    {/* --- ROW 2: Celular | Email | Genero | Tabela --- */}
                    <div className="flex flex-col md:flex-row gap-3 items-end">
                        <div className="w-[190px] flex-none space-y-2">
                            <Label htmlFor="phone" className="text-xs font-bold text-muted-foreground uppercase">Celular *</Label>
                            <PhoneInput
                                id="phone"
                                defaultCountry="BR"
                                value={formPhone}
                                onChange={setFormPhone}
                                onCountryChange={setCountry}
                                placeholder={getExampleNumber(country || 'BR', examples)?.formatNational()}
                                labels={pt}
                                inputComponent={Input}
                                className="h-9 w-full"
                            />
                            <input type="hidden" name="phone" value={formPhone || ''} />
                        </div>
                        <div className="flex-1 min-w-[220px] space-y-2">
                            <Label htmlFor="email" className="text-xs font-bold text-muted-foreground uppercase">Email</Label>
                            <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} className="h-9" />
                        </div>
                        <div className="w-[120px] flex-none space-y-2">
                            <Label htmlFor="gender" className="text-xs font-bold text-muted-foreground uppercase">Gênero</Label>
                            <Select value={gender} onValueChange={setGender}>
                                <SelectTrigger className="h-9"><SelectValue placeholder="Selecione" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="female">Feminino</SelectItem>
                                    <SelectItem value="male">Masculino</SelectItem>
                                    <SelectItem value="other">Outro</SelectItem>
                                </SelectContent>
                            </Select>
                            <input type="hidden" name="gender" value={gender} />
                        </div>
                        <div className="flex-1 min-w-[180px] space-y-2">
                            <Label htmlFor="price_table_id" className="text-xs font-bold text-muted-foreground uppercase">Tabela de Preço</Label>
                            <Select value={priceTableId} onValueChange={setPriceTableId}>
                                <SelectTrigger className="h-9"><SelectValue placeholder="Padrão" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Padrão</SelectItem>
                                    {priceTables.map(t => (
                                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <input type="hidden" name="price_table_id" value={priceTableId} />
                        </div>
                    </div>

                    {/* --- ROW 3: Address --- */}
                    <div className="flex flex-col md:flex-row gap-3 items-end">
                        <div className="w-[120px] relative flex-none space-y-2">
                            <Label htmlFor="cep" className="text-xs font-bold text-muted-foreground uppercase">CEP</Label>
                            <Input id="cep" name="cep" value={formData.cep} onChange={handleCepChange} className="h-9" placeholder="00000-000" />
                            {loadingCep && <span className="absolute right-2 top-9 text-[10px] text-muted-foreground">...</span>}
                        </div>
                        <div className="flex-1 min-w-[250px] space-y-2">
                            <Label htmlFor="address" className="text-xs font-bold text-muted-foreground uppercase">Logradouro</Label>
                            <Input id="address" name="address" value={formData.address} onChange={handleChange} className="h-9" />
                        </div>
                        <div className="w-[80px] flex-none space-y-2">
                            <Label htmlFor="number" className="text-xs font-bold text-muted-foreground uppercase">Número</Label>
                            <Input id="number" name="number" value={formData.number} onChange={handleChange} className="h-9" />
                        </div>
                        <div className="w-[110px] flex-none space-y-2">
                            <Label htmlFor="complement" className="text-xs font-bold text-muted-foreground uppercase">Comp.</Label>
                            <Input id="complement" name="complement" value={formData.complement} onChange={handleChange} className="h-9" />
                        </div>
                    </div>

                    {/* --- ROW 4: Extra Address Info --- */}
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="neighborhood" className="text-xs font-bold text-muted-foreground uppercase">Bairro</Label>
                            <Input id="neighborhood" name="neighborhood" value={formData.neighborhood} onChange={handleChange} className="h-9" />
                        </div>
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="city" className="text-xs font-bold text-muted-foreground uppercase">Cidade</Label>
                            <Input id="city" name="city" value={formData.city} onChange={handleChange} className="h-9" />
                        </div>
                        <div className="w-[60px] flex-none space-y-2">
                            <Label htmlFor="state" className="text-xs font-bold text-muted-foreground uppercase">UF</Label>
                            <Input id="state" name="state" value={formData.state} onChange={handleChange} className="h-9" maxLength={2} />
                        </div>
                    </div>

                    {/* --- ROW 5: Extra Info --- */}
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="occupation" className="text-xs font-bold text-muted-foreground uppercase">Profissão</Label>
                            <Input id="occupation" name="occupation" value={formData.occupation} onChange={handleChange} className="h-9" />
                        </div>
                        <div className="flex-1 space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground uppercase">Origem</Label>
                            <Select name="marketing_source" value={marketingSource} onValueChange={setMarketingSource}>
                                <SelectTrigger className="h-9"><SelectValue placeholder="Selecione" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="instagram">Instagram</SelectItem>
                                    <SelectItem value="google">Google</SelectItem>
                                    <SelectItem value="indication">Indicação</SelectItem>
                                    <SelectItem value="other">Outro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1 space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground uppercase">Parente?</Label>
                            <Select name="related_patient_id" value={relatedPatientId} onValueChange={setRelatedPatientId}>
                                <SelectTrigger className="h-9"><SelectValue placeholder="Selecione" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Nenhum</SelectItem>
                                    {existingPatients.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1 space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground uppercase">Grau</Label>
                            <Select name="relationship_degree" value={relationshipDegree} onValueChange={setRelationshipDegree}>
                                <SelectTrigger className="h-9"><SelectValue placeholder="Selecione" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Pais">Pai/Mãe</SelectItem>
                                    <SelectItem value="Filhos">Filho(a)</SelectItem>
                                    <SelectItem value="Conjuge">Cônjuge</SelectItem>
                                    <SelectItem value="Outro">Outro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="h-px bg-border my-2" />

                    {/* --- INVOICE SECTION --- */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="invoice_params"
                                checked={showInvoiceParams}
                                onCheckedChange={(c) => setShowInvoiceParams(!!c)}
                            />
                            <Label htmlFor="invoice_params" className="cursor-pointer font-bold uppercase text-xs text-primary">
                                Nota Fiscal para outro CPF/CNPJ?
                            </Label>
                        </div>

                        {showInvoiceParams && (
                            <div className="p-4 bg-muted border rounded grid gap-4">
                                <Button type="button" variant="outline" size="sm" onClick={copyAddressToInvoice}>
                                    Copiar Endereço do Paciente
                                </Button>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase">Nome/Razão Social</Label>
                                        <Input name="invoice_name" value={invoiceFormData.invoice_name} onChange={handleInvoiceChange} className="h-9" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase">CPF/CNPJ</Label>
                                        <Input name="invoice_cpf" value={invoiceFormData.invoice_cpf} placeholder="000.000.000-00" onChange={(e) => {
                                            const raw = e.target.value.replace(/\D/g, "")
                                            const masked = raw.length > 11
                                                ? VMasker.toPattern(raw, "99.999.999/9999-99")
                                                : VMasker.toPattern(raw, "999.999.999-99")
                                            setInvoiceFormData({ ...invoiceFormData, invoice_cpf: masked })
                                        }} className="h-9" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase">CEP</Label>
                                        <Input name="invoice_cep" value={invoiceFormData.invoice_cep} onChange={handleInvoiceCepChange} className="h-9" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase">Endereço</Label>
                                        <Input name="invoice_address" value={invoiceFormData.invoice_address} onChange={handleInvoiceChange} className="h-9" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase">Número</Label>
                                        <Input name="invoice_number" value={invoiceFormData.invoice_number} onChange={handleInvoiceChange} className="h-9" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase">Bairro</Label>
                                        <Input name="invoice_neighborhood" value={invoiceFormData.invoice_neighborhood} onChange={handleInvoiceChange} className="h-9" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase">Cidade</Label>
                                        <Input name="invoice_city" value={invoiceFormData.invoice_city} onChange={handleInvoiceChange} className="h-9" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase">UF</Label>
                                        <Input name="invoice_state" value={invoiceFormData.invoice_state} onChange={handleInvoiceChange} maxLength={2} className="h-9" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                </CardContent>
                <CardFooter className="flex justify-end gap-4 p-6 border-t bg-muted/10">
                    <Button
                        variant="outline"
                        type="button"
                        onClick={() => {
                            // Safe Navigation Logic
                            if (appointmentId && initialData?.id) {
                                router.push(`/dashboard/patients/${initialData.id}?appointmentId=${appointmentId}&mode=${mode || 'evolution'}`)
                            } else if (initialData?.id) {
                                router.push(`/dashboard/patients/${initialData.id}`)
                            } else {
                                router.push('/dashboard/patients')
                            }
                        }}
                    >
                        Cancelar
                    </Button>
                    <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
                        {appointmentId ? `Salvar e Continuar` : `Salvar Cadastro`}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    )
}
