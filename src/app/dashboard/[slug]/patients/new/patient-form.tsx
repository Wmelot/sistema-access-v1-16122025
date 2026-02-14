"use client"

import { useRouter, useParams } from "next/navigation"
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
import { createPatient, updatePatient, searchCep } from "@/actions/patients"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { cpf } from 'cpf-cnpj-validator'
import VMasker from 'vanilla-masker'
import 'react-phone-number-input/style.css'
import PhoneInput, { Country } from 'react-phone-number-input'
import pt from 'react-phone-number-input/locale/pt'
import { getExampleNumber } from 'libphonenumber-js'
import examples from 'libphonenumber-js/examples.mobile.json'
import { formatPhoneDisplay } from '@/utils/format-phone'

interface PatientFormProps {
    existingPatients: { id: string, full_name: string }[]
    priceTables: any[]
    initialData?: any
    appointmentId?: string
    mode?: string
}

export default function PatientForm({ existingPatients, priceTables, initialData, appointmentId, mode }: PatientFormProps) {
    const router = useRouter()
    const params = useParams()
    const slug = params?.slug as string

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

    // LGPD Consent State
    const [healthConsent, setHealthConsent] = useState(initialData?.health_data_consent || false)

    // Main Form Data
    const [formData, setFormData] = useState({
        full_name: initialData?.name || "",
        cpf: initialData?.cpf || "",
        // Safe Date Parsing
        date_of_birth: (() => {
            if (!initialData?.birthdate && !initialData?.date_of_birth) return "";
            try {
                // Ensure we handle various date formats safe for inputs
                const dateVal = initialData.birthdate || initialData.date_of_birth;
                return new Date(dateVal).toISOString().split('T')[0];
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

        // Add LGPD Consent
        if (healthConsent) {
            form.append('health_data_consent', 'on')
        }

        try {
            const action = initialData ? updatePatient.bind(null, initialData.id) : createPatient
            console.log("Submitting form data...", Object.fromEntries(form.entries())) // Debug log

            const result = await action(form, slug) as any

            // [NEW] Handle duplicate name detection
            if (result?.error === 'PATIENT_NAME_EXISTS' && result?.code === 'DUPLICATE_NAME') {
                const { default: Swal } = await import('sweetalert2')
                const patients = result.existingPatients || []
                const patientsHtml = patients.map((p: any, idx: number) => `
                    <div 
                        class="patient-item-option" 
                        data-id="${p.id}" 
                        style="text-align:left; padding:12px 16px; margin-bottom:10px; background:#f8fafc; border:2px solid #e2e8f0; border-radius:12px; cursor:pointer; transition:all 0.2s;"
                        onclick="window.selectPatientOption('${p.id}', this)"
                    >
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <p style="margin:0; font-size:15px; color:#1e293b; font-weight:600;">${p.name || '---'}</p>
                            <div class="check-circle" style="width:18px; height:18px; border-radius:50%; border:2px solid #cbd5e1; display:flex; align-items:center; justify-content:center;">
                                <div class="inner-check" style="width:10px; height:10px; border-radius:50%; background:#3b82f6; display:none;"></div>
                            </div>
                        </div>
                        <div style="display:flex; gap:12px; margin-top:4px;">
                            <p style="margin:0; font-size:12px; color:#64748b;"><b>Tel:</b> ${p.phone ? formatPhoneDisplay(p.phone) : 'N/A'}</p>
                            <p style="margin:0; font-size:12px; color:#64748b;"><b>CPF:</b> ${p.cpf || 'N/A'}</p>
                        </div>
                    </div>
                `).join('')

                    // Define selection function on window to be accessible from Swal HTML
                    (window as any).selectedDuplicateId = null;
                (window as any).selectPatientOption = function (id: string, el: HTMLElement) {
                    document.querySelectorAll('.patient-item-option').forEach(item => item.classList.remove('selected'));
                    el.classList.add('selected');
                    (window as any).selectedDuplicateId = id;
                };

                const choice = await Swal.fire({
                    title: 'Paciente(s) já Cadastrado(s)',
                    html: `
                        <style>
                            .patient-item-option.selected { 
                                border-color: #3b82f6 !important; 
                                background: #eff6ff !important;
                                box-shadow: 0 0 0 1px #3b82f6 !important;
                            }
                            .patient-item-option.selected .check-circle { 
                                border-color: #3b82f6 !important; 
                                background: #3b82f6 !important;
                            }
                            .patient-item-option.selected .inner-check { display: block !important; }
                        </style>
                        <p style="margin-bottom:14px; color:#64748b; font-size:14px; text-align:left;">
                            Selecione o paciente que deseja utilizar para evitar duplicidade:
                        </p>
                        <div id="duplicate-patients-list" style="max-height:280px; overflow-y:auto; padding:4px; margin-bottom:10px;">
                            ${patientsHtml}
                        </div>
                        <p style="margin-top:14px; color:#475569; font-size:14px; font-weight:500;">Deseja usar o cadastro selecionado ou criar um novo?</p>
                    `,
                    icon: 'warning',
                    showCancelButton: true,
                    showDenyButton: true,
                    confirmButtonText: 'Usar selecionado',
                    denyButtonText: 'Criar novo',
                    cancelButtonText: 'Cancelar',
                    confirmButtonColor: '#3b82f6',
                    denyButtonColor: '#10b981',
                    didOpen: () => {
                        // Focus the list or add any event listeners if needed
                    },
                    preConfirm: () => {
                        const sid = (window as any).selectedDuplicateId;
                        if (!sid && patients.length > 0) {
                            Swal.showValidationMessage('Por favor, clique em um paciente na lista acima para selecioná-lo');
                            return false;
                        }
                        return sid;
                    }
                })

                if (choice.isConfirmed) {
                    const existingId = choice.value;
                    toast.success("Redirecionando para o paciente selecionado...")
                    if (appointmentId) {
                        router.push(`/dashboard/${slug}/patients/${existingId}?appointmentId=${appointmentId}&mode=${mode || 'evolution'}`)
                    } else {
                        router.push(`/dashboard/${slug}/patients/${existingId}`)
                    }
                    return
                } else if (choice.isDenied) {
                    // Force create: Add _force_create flag and resubmit
                    form.set('_force_create', 'true')
                    const forceResult = await (initialData ? updatePatient.bind(null, initialData.id) : createPatient)(form, slug)
                    if (forceResult?.error) {
                        toast.error("Erro ao salvar: " + forceResult.error)
                    } else {
                        toast.success("Paciente criado com sucesso!")
                        if ((forceResult as any)?.success && (forceResult as any)?.patient?.id) {
                            router.push(`/dashboard/${slug}/patients/${(forceResult as any).patient.id}`)
                        } else {
                            router.push(`/dashboard/${slug}/patients`)
                        }
                    }
                    return
                }
                // If cancelled, do nothing
                return
            }

            if (result?.error) {
                console.error("Server Action Error:", result.error)
                toast.error("Erro ao salvar: " + result.error)
            } else {
                console.log("Success:", result)
                toast.success(initialData ? "Paciente atualizado!" : "Paciente criado!")
                if (appointmentId && initialData?.id) {
                    router.push(`/dashboard/${slug}/patients/${initialData.id}?appointmentId=${appointmentId}&mode=${mode || 'evolution'}`)
                } else if (initialData?.id) {
                    router.push(`/dashboard/${slug}/patients/${initialData.id}`)
                } else {
                    // Start fresh or use the ID returned from server if available (for create)
                    // The server action now returns { success: true, patient: { id } }
                    // We can redirect to the new patient's profile
                    if ((result as any)?.success && (result as any)?.patient?.id) {
                        router.push(`/dashboard/${slug}/patients/${(result as any).patient.id}`)
                    } else {
                        router.push(`/dashboard/${slug}/patients`)
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
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                        <div className="md:col-span-4 space-y-2">
                            <Label htmlFor="full_name" className="text-xs font-bold text-muted-foreground uppercase">Nome Completo *</Label>
                            <Input
                                id="full_name"
                                name="full_name"
                                placeholder="Nome do Paciente"
                                value={formData.full_name}
                                onChange={handleChange}
                                className="h-9 w-full"
                                tabIndex={1}
                            />
                        </div>

                        <div className="md:col-span-1 space-y-2 flex flex-col">
                            <Label className="text-xs font-bold opacity-0">SPACER</Label>
                            <div className="flex items-center space-x-2 h-9 border rounded-md px-3 bg-muted/10">
                                <Checkbox
                                    id="isForeigner"
                                    checked={isForeigner}
                                    onCheckedChange={(c) => {
                                        const checked = !!c
                                        setIsForeigner(checked)
                                        if (checked) {
                                            setShowInvoiceParams(true)
                                        }
                                    }}
                                    tabIndex={2}
                                />
                                <Label htmlFor="isForeigner" className="text-[10px] font-bold uppercase cursor-pointer">S/CPF</Label>
                            </div>
                        </div>

                        <div className="md:col-span-4 space-y-2">
                            <Label htmlFor="cpf" className="text-xs font-bold text-muted-foreground uppercase">CPF</Label>
                            <Input
                                id="cpf"
                                name="cpf"
                                placeholder="000.000.000-00"
                                value={formData.cpf}
                                onChange={handleCpfChange}
                                className={`h-9 w-full ${cpfError ? "border-red-500" : ""}`}
                                tabIndex={3}
                            />
                        </div>

                        <div className="md:col-span-3 space-y-2">
                            <Label htmlFor="date_of_birth" className="text-xs font-bold text-muted-foreground uppercase">Nascimento</Label>
                            <DateInput
                                id="date_of_birth"
                                name="date_of_birth"
                                value={formData.date_of_birth}
                                onChange={(val) => setFormData(prev => ({ ...prev, date_of_birth: val }))}
                                className="h-9 w-full"
                                tabIndex={4}
                            />
                        </div>
                    </div>

                    {/* --- ROW 2: Celular | Email | Genero | Tabela --- */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                        <div className="md:col-span-3 space-y-2">
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
                                tabIndex={5}
                            />
                            <input type="hidden" name="phone" value={formPhone || ''} />
                        </div>
                        <div className="md:col-span-4 space-y-2">
                            <Label htmlFor="email" className="text-xs font-bold text-muted-foreground uppercase">Email</Label>
                            <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} className="h-9 w-full" tabIndex={6} />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="gender" className="text-xs font-bold text-muted-foreground uppercase">Gênero</Label>
                            <Select value={gender} onValueChange={setGender}>
                                <SelectTrigger className="h-9 w-full" tabIndex={7}><SelectValue placeholder="Selecione" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="female">Feminino</SelectItem>
                                    <SelectItem value="male">Masculino</SelectItem>
                                    <SelectItem value="other">Outro</SelectItem>
                                </SelectContent>
                            </Select>
                            <input type="hidden" name="gender" value={gender} />
                        </div>
                        <div className="md:col-span-3 space-y-2">
                            <Label htmlFor="price_table_id" className="text-xs font-bold text-muted-foreground uppercase">Tabela de Preço</Label>
                            <Select value={priceTableId} onValueChange={setPriceTableId}>
                                <SelectTrigger className="h-9 w-full" tabIndex={8}><SelectValue placeholder="Selecione" /></SelectTrigger>
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
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                        <div className="md:col-span-2 relative space-y-2">
                            <Label htmlFor="cep" className="text-xs font-bold text-muted-foreground uppercase">CEP</Label>
                            <Input id="cep" name="cep" value={formData.cep} onChange={handleCepChange} className="h-9 w-full" placeholder="00000-000" />
                            {loadingCep && <span className="absolute right-2 top-9 text-[10px] text-muted-foreground">...</span>}
                        </div>
                        <div className="md:col-span-6 space-y-2">
                            <Label htmlFor="address" className="text-xs font-bold text-muted-foreground uppercase">Logradouro</Label>
                            <Input id="address" name="address" value={formData.address} onChange={handleChange} className="h-9 w-full" />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="number" className="text-xs font-bold text-muted-foreground uppercase">Número</Label>
                            <Input id="number" name="number" value={formData.number} onChange={handleChange} className="h-9 w-full" />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="complement" className="text-xs font-bold text-muted-foreground uppercase">Comp.</Label>
                            <Input id="complement" name="complement" value={formData.complement} onChange={handleChange} className="h-9 w-full" />
                        </div>
                    </div>

                    {/* --- ROW 4: Extra Address Info --- */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                        <div className="md:col-span-5 space-y-2">
                            <Label htmlFor="neighborhood" className="text-xs font-bold text-muted-foreground uppercase">Bairro</Label>
                            <Input id="neighborhood" name="neighborhood" value={formData.neighborhood} onChange={handleChange} className="h-9 w-full" />
                        </div>
                        <div className="md:col-span-5 space-y-2">
                            <Label htmlFor="city" className="text-xs font-bold text-muted-foreground uppercase">Cidade</Label>
                            <Input id="city" name="city" value={formData.city} onChange={handleChange} className="h-9 w-full" />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="state" className="text-xs font-bold text-muted-foreground uppercase">UF</Label>
                            <Input id="state" name="state" value={formData.state} onChange={handleChange} className="h-9 w-full" maxLength={2} />
                        </div>
                    </div>

                    {/* --- ROW 5: Extra Info --- */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                        <div className="md:col-span-3 space-y-2">
                            <Label htmlFor="occupation" className="text-xs font-bold text-muted-foreground uppercase">Profissão</Label>
                            <Input id="occupation" name="occupation" value={formData.occupation} onChange={handleChange} className="h-9 w-full" />
                        </div>
                        <div className="md:col-span-3 space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground uppercase">Origem</Label>
                            <Select name="marketing_source" value={marketingSource} onValueChange={setMarketingSource}>
                                <SelectTrigger className="h-9 w-full"><SelectValue placeholder="Selecione" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="instagram">Instagram</SelectItem>
                                    <SelectItem value="google">Google</SelectItem>
                                    <SelectItem value="indication">Indicação</SelectItem>
                                    <SelectItem value="other">Outro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="md:col-span-3 space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground uppercase">Parente?</Label>
                            <Select name="related_patient_id" value={relatedPatientId} onValueChange={setRelatedPatientId}>
                                <SelectTrigger className="h-9 w-full"><SelectValue placeholder="Selecione" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Nenhum</SelectItem>
                                    {existingPatients.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="md:col-span-3 space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground uppercase">Grau</Label>
                            <Select name="relationship_degree" value={relationshipDegree} onValueChange={setRelationshipDegree}>
                                <SelectTrigger className="h-9 w-full"><SelectValue placeholder="Selecione" /></SelectTrigger>
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


                    {/* --- LGPD CONSENT --- */}
                    <div className="h-px bg-border my-2" />
                    <div className="rounded-md border p-4 bg-muted/20">
                        <div className="flex items-start gap-3">
                            <Checkbox
                                id="health_consent"
                                checked={healthConsent}
                                onCheckedChange={(c) => setHealthConsent(!!c)}
                            />
                            <div className="grid gap-1.5 leading-none">
                                <Label
                                    htmlFor="health_consent"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Consentimento de Tratamento de Dados (LGPD)
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Autorizo o tratamento de meus dados pessoais sensíveis (saúde) para fins de prontuário, agendamento e faturamento, conforme a <a href="/privacy" target="_blank" className="underline text-primary">Política de Privacidade</a>.
                                </p>
                            </div>
                        </div>
                    </div>

                </CardContent>
                <CardFooter className="flex justify-end gap-4 p-6 border-t bg-muted/10">
                    <Button
                        variant="outline"
                        type="button"
                        onClick={() => {
                            // Safe Navigation Logic
                            if (appointmentId && initialData?.id) {
                                router.push(`/dashboard/${slug}/patients/${initialData.id}?appointmentId=${appointmentId}&mode=${mode || 'evolution'}`)
                            } else if (initialData?.id) {
                                router.push(`/dashboard/${slug}/patients/${initialData.id}`)
                            } else {
                                router.push(`/dashboard/${slug}/patients`)
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
