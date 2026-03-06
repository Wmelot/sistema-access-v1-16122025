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
import { formatCPF } from '@/utils/format-cpf'

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

            // [NEW] Handle duplicate detection (Name, Phone, Address)
            if (result?.error && ['DUPLICATE_NAME', 'DUPLICATE_PHONE', 'DUPLICATE_ADDRESS'].includes(result?.code)) {
                const { default: Swal } = await import('sweetalert2')
                const patients = result.existingPatients || []

                let title = 'CADASTRO JÁ EXISTENTE'
                let subtitle = 'Identificamos pacientes com dados semelhantes. Selecione o cadastro correto para evitar duplicidade:'
                let iconHtml = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#4f46e5;"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'

                if (result.code === 'DUPLICATE_PHONE') {
                    title = 'TELEFONE EM USO'
                    subtitle = 'Este telefone já está vinculado a outro paciente. Deseja utilizar o cadastro existente ou criar um novo para uma linha compartilhada?'
                    iconHtml = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#4f46e5;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>'
                } else if (result.code === 'DUPLICATE_ADDRESS') {
                    title = 'MESMO ENDEREÇO DETECTADO'
                    subtitle = 'Encontramos pacientes morando neste endereço. Trata-se de um familiar ou parente?'
                    iconHtml = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#4f46e5;"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>'
                }

                const patientsHtml = patients.map((p: any) => `
                    <div 
                        class="patient-item-option" 
                        data-patient-id="${p.id}" 
                        style="text-align:left; padding:16px; margin-bottom:12px; background:#fff; border:2px solid #f1f5f9; border-radius:16px; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; gap:12px; position:relative;"
                    >
                        <div class="radio-circle" id="radio-${p.id}" style="width:20px; height:20px; border-radius:50%; border:2px solid #cbd5e1; flex-shrink:0; display:flex; align-items:center; justify-content:center;">
                            <div class="radio-inner" style="width:10px; height:10px; border-radius:50%; background:#4f46e5; display:none;"></div>
                        </div>
                        <div style="flex:1;">
                            <p style="margin:0; font-size:14px; color:#0f172a; font-weight:700; text-transform:uppercase;">${p.name || '---'}</p>
                            <div style="display:flex; gap:12px; margin-top:4px;">
                                <p style="margin:0; font-size:11px; color:#64748b;"><b>TEL:</b> ${p.phone ? formatPhoneDisplay(p.phone) : '-'}</p>
                                <p style="margin:0; font-size:11px; color:#64748b;"><b>CPF:</b> ${formatCPF(p.cpf)}</p>
                            </div>
                        </div>
                    </div>
                `).join('')

                let selectedDuplicateId: string | null = patients.length === 1 ? patients[0].id : null;

                const choice = await Swal.fire({
                    title: `<div style="display:flex; flex-direction:column; align-items:center; gap:16px;">
                        <div style="background:#f5f3ff; padding:12px; border-radius:12px;">${iconHtml}</div>
                        <span style="font-size:18px; font-weight:800; letter-spacing:-0.5px; text-transform:uppercase; color:#1e293b;">${title}</span>
                    </div>`,
                    html: `
                        <p style="margin-bottom:24px; color:#64748b; font-size:14px; text-align:center; line-height:1.6; font-weight:500;">
                            ${subtitle}
                        </p>
                        <div id="duplicate-patients-list" style="max-height:320px; overflow-y:auto; padding:8px 4px; margin-bottom:12px; scrollbar-width: thin; -webkit-overflow-scrolling: touch;">
                            ${patientsHtml}
                        </div>
                    `,
                    showCancelButton: true,
                    showDenyButton: true,
                    confirmButtonText: result.code === 'DUPLICATE_ADDRESS' ? 'Sim, Vincular como Parente' : 'Usar Cadastro Selecionado',
                    denyButtonText: 'Não, Criar Novo Registro',
                    cancelButtonText: 'Cancelar',
                    confirmButtonColor: '#4f46e5',
                    denyButtonColor: '#10b981',
                    cancelButtonColor: '#94a3b8',
                    customClass: {
                        container: 'swal-high-z-index',
                        popup: 'rounded-[1.5rem] border-none shadow-2xl'
                    },
                    didOpen: () => {
                        const items = document.querySelectorAll('.patient-item-option');
                        items.forEach(item => {
                            const htmlItem = item as HTMLElement;
                            // Pre-select if only one
                            if (htmlItem.getAttribute('data-patient-id') === selectedDuplicateId) {
                                htmlItem.style.borderColor = '#4f46e5';
                                htmlItem.style.background = '#f5f3ff';
                                (htmlItem.querySelector('.radio-inner') as HTMLElement).style.display = 'block';
                                (htmlItem.querySelector('.radio-circle') as HTMLElement).style.borderColor = '#4f46e5';
                            }

                            item.addEventListener('click', () => {
                                const id = htmlItem.getAttribute('data-patient-id');
                                selectedDuplicateId = id;
                                items.forEach(it => {
                                    const hit = it as HTMLElement;
                                    const isSel = hit.getAttribute('data-patient-id') === id;
                                    hit.style.borderColor = isSel ? '#4f46e5' : '#f1f5f9';
                                    hit.style.background = isSel ? '#f5f3ff' : '#fff';
                                    (hit.querySelector('.radio-inner') as HTMLElement).style.display = isSel ? 'block' : 'none';
                                    (hit.querySelector('.radio-circle') as HTMLElement).style.borderColor = isSel ? '#4f46e5' : '#cbd5e1';
                                });
                            });
                        });
                    },
                    preConfirm: () => {
                        if (!selectedDuplicateId) {
                            Swal.showValidationMessage('Selecione um paciente na lista acima.');
                            return false;
                        }
                        return selectedDuplicateId;
                    }
                })

                if (choice.isConfirmed) {
                    if (result.code === 'DUPLICATE_ADDRESS') {
                        // CASE: RELATIVE - Auto-Link and Force Create
                        form.set('related_patient_id', choice.value)
                        form.set('relationship_degree', 'Outro') // Default relationship
                        form.set('_force_create', 'true')
                    } else {
                        // CASE: USE EXISTING - Redirect
                        Swal.fire({
                            title: 'SINCRONIZANDO...',
                            html: '<div style="padding:20px; display:flex; justify-content:center;"><l-quantum size="45" speed="1.75" color="#4f46e5"></l-quantum></div>',
                            showConfirmButton: false,
                            allowOutsideClick: false
                        });
                        if (appointmentId) {
                            router.push(`/dashboard/${slug}/patients/${choice.value}?appointmentId=${appointmentId}&mode=${mode || 'evolution'}`)
                        } else {
                            router.push(`/dashboard/${slug}/patients/${choice.value}`)
                        }
                        return
                    }
                } else if (choice.isDenied) {
                    // Force create without link
                    form.set('_force_create', 'true')
                } else {
                    return // Cancelled
                }

                // Execute the actual creation (either forced with link or forced without link)
                const finalAction = initialData ? updatePatient.bind(null, initialData.id) : createPatient
                const forceResult = await finalAction(form, slug) as any

                if (forceResult?.error) {
                    toast.error("Erro ao salvar: " + forceResult.error)
                } else {
                    toast.success(result.code === 'DUPLICATE_ADDRESS' && choice.isConfirmed ? "Paciente vinculado e salvo!" : "Cadastro concluído com sucesso!")
                    if (forceResult?.patient?.id) {
                        router.push(`/dashboard/${slug}/patients/${forceResult.patient.id}`)
                    } else {
                        router.push(`/dashboard/${slug}/patients`)
                    }
                }
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
