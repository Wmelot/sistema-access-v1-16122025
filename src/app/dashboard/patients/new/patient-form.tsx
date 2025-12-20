"use client"

import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
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
import { createPatient, updatePatient } from "@/app/dashboard/patients/actions"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { cpf } from 'cpf-cnpj-validator'
import VMasker from 'vanilla-masker'
import 'react-phone-number-input/style.css'
import PhoneInput, { Country } from 'react-phone-number-input'
import pt from 'react-phone-number-input/locale/pt'
import { getExampleNumber } from 'libphonenumber-js'
import examples from 'libphonenumber-js/examples.mobile.json'
import { Copy } from "lucide-react"

interface PatientFormProps {
    existingPatients: { id: string, full_name: string }[]
    priceTables: any[]
    initialData?: any
}

export default function PatientForm({ existingPatients, priceTables, initialData }: PatientFormProps) {
    const router = useRouter()
    const [isMounted, setIsMounted] = useState(false)
    const [cpfError, setCpfError] = useState("")
    const [loadingCep, setLoadingCep] = useState(false)

    // Initial State Population
    const [formPhone, setFormPhone] = useState<string | undefined>(initialData?.phone || undefined)
    const [marketingSource, setMarketingSource] = useState(initialData?.marketing_source || "")
    const [relatedPatientId, setRelatedPatientId] = useState(initialData?.related_patient_id || "")
    const [relationshipDegree, setRelationshipDegree] = useState(initialData?.relationship_degree || "")
    const [gender, setGender] = useState(initialData?.gender || "")
    const [priceTableId, setPriceTableId] = useState(initialData?.price_table_id || "")
    const [isForeigner, setIsForeigner] = useState(!initialData?.cpf && !!initialData) // if editing and no CPF, assume foreigner
    const [country, setCountry] = useState<Country | undefined>("BR")

    // Address Parsing (Simple heuristic)
    // "Rua X, 123, Compl Y - Bairro, Cidade - UF, CEP"
    // Since it's unreliable to parse back, we might just put the whole thing in address for now or leave it.
    // Let's try to put it in address line if present.
    const initialAddress = initialData?.address || ""
    // If we wanted to be fancy we could try specific split, but for now:

    // Invoice State
    const [showInvoiceParams, setShowInvoiceParams] = useState(!!initialData?.invoice_cpf)
    const [invoiceFormData, setInvoiceFormData] = useState({
        invoice_name: initialData?.invoice_name || "",
        invoice_cpf: initialData?.invoice_cpf || "",
        invoice_cep: initialData?.invoice_address_zip || "",
        invoice_address: initialData?.invoice_address || "",
        invoice_number: initialData?.invoice_number || "",
        invoice_complement: "", // Not persisted?
        invoice_neighborhood: initialData?.invoice_neighborhood || "",
        invoice_city: initialData?.invoice_city || "",
        invoice_state: initialData?.invoice_state || ""
    })

    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Form states for controlled inputs (masks)
    const [formData, setFormData] = useState({
        full_name: initialData?.name || "",
        cpf: initialData?.cpf || "",
        date_of_birth: initialData?.date_of_birth ? new Date(initialData.date_of_birth).toISOString().split('T')[0] : "",
        email: initialData?.email || "",
        cep: "", // Can't easily extract
        address: initialAddress, // Put full address here for reference
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        occupation: initialData?.occupation || ""
    })

    if (!isMounted) {
        return <div className="p-6">Carregando formulário...</div>
    }

    const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, "")
        const masked = VMasker.toPattern(raw, "999.999.999-99")
        setFormData(prev => ({ ...prev, cpf: masked }))

        if (raw.length === 11) {
            if (!cpf.isValid(raw)) {
                setCpfError("CPF Inválido")
            } else {
                setCpfError("")
            }
        } else {
            setCpfError("")
        }
    }

    const handleInvoiceCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, "")
        const masked = VMasker.toPattern(raw, "999.999.999-99")
        setInvoiceFormData(prev => ({ ...prev, invoice_cpf: masked }))
    }

    const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, "")
        const masked = VMasker.toPattern(raw, "99999-999")
        setFormData(prev => ({ ...prev, cep: masked }))

        if (raw.length === 8) {
            setLoadingCep(true)
            try {
                const response = await fetch(`https://viacep.com.br/ws/${raw}/json/`)
                const data = await response.json()
                if (!data.erro) {
                    setFormData(prev => ({
                        ...prev,
                        address: data.logradouro,
                        neighborhood: data.bairro,
                        city: data.localidade,
                        state: data.uf,
                        cep: masked
                    }))
                    toast.success("Endereço encontrado!")
                    document.getElementById('number')?.focus()
                } else {
                    toast.error("CEP não encontrado.")
                }
            } catch (error) {
                toast.error("Erro ao buscar CEP.")
            } finally {
                setLoadingCep(false)
            }
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleInvoiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInvoiceFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleInvoiceCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, "")
        const masked = VMasker.toPattern(raw, "99999-999")
        setInvoiceFormData(prev => ({ ...prev, invoice_cep: masked }))
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
        toast.success("Endereço copiado para Nota Fiscal!")
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

        // Append Invoice Data if enabled
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

        // Determine Action
        const action = initialData ? updatePatient.bind(null, initialData.id) : createPatient

        const result = await action(form)
        if (result?.error) {
            toast.error("Erro ao salvar: " + result.error)
        } else {
            toast.success(initialData ? "Paciente atualizado!" : "Paciente criado!")
        }
    }

    return (
        <form action={handleSubmit}>
            <Card className="overflow-hidden">
                <CardContent className="p-6 grid gap-6">

                    {/* --- ROW 1: Nome | S/CPF | CPF | Nascimento --- */}
                    <div className="flex flex-col md:flex-row gap-3 items-end">
                        {/* Nome - Grows */}
                        <div className="w-full md:w-auto space-y-2" style={{ flex: 1, minWidth: '250px' }}>
                            <Label htmlFor="full_name" className="text-xs font-bold text-muted-foreground uppercase block">Nome Completo *</Label>
                            <Input
                                id="full_name"
                                name="full_name"
                                placeholder="Nome do Paciente"
                                value={formData.full_name}
                                onChange={handleChange}
                                className="h-9"
                            />
                        </div>

                        {/* S/CPF Checkbox - Correctly Aligned */}
                        <div className="flex flex-col items-center flex-none space-y-2" style={{ width: '50px' }}>
                            <Label htmlFor="foreigner" className="text-xs font-bold text-muted-foreground uppercase text-center w-full block">S/CPF</Label>
                            <div className="h-9 flex items-center justify-center w-full border rounded-md border-transparent">
                                <input
                                    type="checkbox"
                                    id="foreigner"
                                    checked={isForeigner}
                                    onChange={(e) => {
                                        setIsForeigner(e.target.checked)
                                        if (e.target.checked) {
                                            setFormData(prev => ({ ...prev, cpf: "" }))
                                            setCpfError("")
                                        }
                                    }}
                                    className="h-4 w-4 rounded border-gray-300 cursor-pointer accent-primary"
                                />
                            </div>
                        </div>

                        {/* CPF - Fixed via Inline Style */}
                        <div className="w-full space-y-2 flex-none" style={{ width: '150px' }}>
                            <Label htmlFor="cpf" className="text-xs font-bold text-muted-foreground uppercase block">CPF</Label>
                            <Input
                                id="cpf"
                                name="cpf"
                                placeholder="000.000.000-00"
                                value={formData.cpf}
                                onChange={handleCpfChange}
                                disabled={isForeigner}
                                className={`h-9 ${cpfError ? "border-red-500" : ""}`}
                            />
                        </div>

                        {/* Nascimento - Fixed via Inline Style */}
                        <div className="w-full space-y-2 flex-none" style={{ width: '130px' }}>
                            <Label htmlFor="date_of_birth" className="text-xs font-bold text-muted-foreground uppercase block">Nascimento</Label>
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
                        {/* Celular */}
                        <div className="w-full space-y-2 flex-none" style={{ width: '190px' }}>
                            <Label htmlFor="phone" className="text-xs font-bold text-muted-foreground uppercase block">Celular *</Label>
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

                        {/* Email - Grows */}
                        <div className="w-full md:w-auto space-y-2" style={{ flex: 1, minWidth: '220px' }}>
                            <Label htmlFor="email" className="text-xs font-bold text-muted-foreground uppercase block">Email</Label>
                            <Input id="email" name="email" type="email" placeholder="email@exemplo.com" className="h-9" />
                        </div>

                        {/* Gênero */}
                        <div className="w-full space-y-2 flex-none" style={{ width: '120px' }}>
                            <Label htmlFor="gender" className="text-xs font-bold text-muted-foreground uppercase block">Gênero</Label>
                            <Select value={gender} onValueChange={setGender}>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="female">Feminino</SelectItem>
                                    <SelectItem value="male">Masculino</SelectItem>
                                    <SelectItem value="other">Outro</SelectItem>
                                </SelectContent>
                            </Select>
                            <input type="hidden" name="gender" value={gender} />
                        </div>

                        {/* Tabela de Preços */}
                        <div className="md:w-auto space-y-2" style={{ flex: 1, minWidth: '180px' }}>
                            <Label htmlFor="price_table_id" className="text-xs font-bold text-muted-foreground uppercase block">Tabela de Preço</Label>
                            <Select value={priceTableId} onValueChange={setPriceTableId}>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Padrão" />
                                </SelectTrigger>
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

                    {/* --- ROW 3: CEP | Logradouro | Numero | Complemento --- */}
                    <div className="flex flex-col md:flex-row gap-3 items-end">
                        {/* CEP */}
                        <div className="w-full space-y-2 relative flex-none" style={{ width: '120px' }}>
                            <Label htmlFor="cep" className="text-xs font-bold text-muted-foreground uppercase block">CEP</Label>
                            <Input
                                id="cep"
                                name="cep"
                                placeholder="00000-000"
                                value={formData.cep}
                                onChange={handleCepChange}
                                className="h-9"
                            />
                            {loadingCep && <span className="absolute right-2 top-9 text-[10px] text-muted-foreground">...</span>}
                        </div>
                        {/* Logradouro - Grows */}
                        <div className="w-full md:w-auto space-y-2" style={{ flex: 1, minWidth: '250px' }}>
                            <Label htmlFor="address" className="text-xs font-bold text-muted-foreground uppercase block">Logradouro</Label>
                            <Input
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Rua, Avenida..."
                                className="h-9"
                            />
                        </div>
                        {/* Número */}
                        <div className="w-full space-y-2 flex-none" style={{ width: '80px' }}>
                            <Label htmlFor="number" className="text-xs font-bold text-muted-foreground uppercase block">Número</Label>
                            <Input
                                id="number"
                                name="number"
                                value={formData.number}
                                onChange={handleChange}
                                placeholder="123"
                                className="h-9"
                            />
                        </div>
                        {/* Complemento */}
                        <div className="w-full space-y-2 flex-none" style={{ width: '110px' }}>
                            <Label htmlFor="complement" className="text-xs font-bold text-muted-foreground uppercase block">Complemento</Label>
                            <Input
                                id="complement"
                                name="complement"
                                value={formData.complement}
                                onChange={handleChange}
                                placeholder="Apto..."
                                className="h-9"
                            />
                        </div>
                    </div>

                    {/* --- ROW 4: Bairro | Cidade | UF --- */}
                    <div className="flex flex-col md:flex-row gap-3">
                        {/* Bairro - Grows */}
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="neighborhood" className="text-xs font-bold text-muted-foreground uppercase">Bairro</Label>
                            <Input
                                id="neighborhood"
                                name="neighborhood"
                                value={formData.neighborhood}
                                onChange={handleChange}
                                placeholder="Bairro"
                                className="h-9"
                            />
                        </div>
                        {/* Cidade - Grows */}
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="city" className="text-xs font-bold text-muted-foreground uppercase">Cidade</Label>
                            <Input
                                id="city"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                placeholder="Cidade"
                                className="h-9"
                            />
                        </div>
                        {/* UF - Fixed */}
                        <div className="md:w-[60px] flex-none space-y-2">
                            <Label htmlFor="state" className="text-xs font-bold text-muted-foreground uppercase">UF</Label>
                            <Input
                                id="state"
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                placeholder="UF"
                                maxLength={2}
                                className="h-9"
                            />
                        </div>
                    </div>

                    {/* --- ROW 5: Profissão | Origem | Parente | Grau --- */}
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="occupation" className="text-xs font-bold text-muted-foreground uppercase">Profissão</Label>
                            <Input id="occupation" name="occupation" placeholder="Profissão" className="h-9" />
                        </div>
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="marketing_source" className="text-xs font-bold text-muted-foreground uppercase">Origem</Label>
                            <Select name="marketing_source" onValueChange={setMarketingSource}>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="instagram">Instagram</SelectItem>
                                    <SelectItem value="google">Google</SelectItem>
                                    <SelectItem value="indication">Indicação</SelectItem>
                                    <SelectItem value="other">Outro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="related_patient_id" className="text-xs font-bold text-muted-foreground uppercase">Parente?</Label>
                            <Select name="related_patient_id" onValueChange={setRelatedPatientId}>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Nenhum</SelectItem>
                                    {existingPatients.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="relationship_degree" className="text-xs font-bold text-muted-foreground uppercase">Grau</Label>
                            <Select name="relationship_degree" onValueChange={setRelationshipDegree}>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
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

                    {/* --- NOTA FISCAL --- */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="invoice_params"
                                checked={showInvoiceParams}
                                onChange={(e) => setShowInvoiceParams(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor="invoice_params" className="cursor-pointer font-bold uppercase text-xs text-primary">
                                Nota Fiscal para outro CPF/CNPJ?
                            </Label>
                        </div>

                        {showInvoiceParams && (
                            <div className="bg-muted/30 p-4 rounded-md border border-border space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-bold text-primary">DADOS NOTA FISCAL</h4>
                                    <Button type="button" variant="ghost" size="sm" onClick={copyAddressToInvoice} className="h-6 text-xs gap-1">
                                        <Copy className="w-3 h-3" />
                                        Copiar endereço
                                    </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                    <div className="md:col-span-8 space-y-2">
                                        <Label className="text-xs font-bold uppercase text-muted-foreground">Nome / Razão Social</Label>
                                        <Input name="invoice_name" value={invoiceFormData.invoice_name} onChange={handleInvoiceChange} className="h-9" />
                                    </div>
                                    <div className="md:col-span-4 space-y-2">
                                        <Label className="text-xs font-bold uppercase text-muted-foreground">CPF / CNPJ</Label>
                                        <Input name="invoice_cpf" value={invoiceFormData.invoice_cpf} onChange={handleInvoiceCpfChange} className="h-9" placeholder="000.000.000-00" />
                                    </div>

                                    {/* Address Row for Invoice - Compact */}
                                    <div className="md:col-span-12 grid grid-cols-12 gap-4">
                                        <div className="col-span-12 md:col-span-2 space-y-2">
                                            <Label className="text-xs font-bold uppercase text-muted-foreground">CEP</Label>
                                            <Input name="invoice_cep" value={invoiceFormData.invoice_cep} onChange={handleInvoiceCepChange} className="h-9" />
                                        </div>
                                        <div className="col-span-12 md:col-span-6 space-y-2">
                                            <Label className="text-xs font-bold uppercase text-muted-foreground">Endereço</Label>
                                            <Input name="invoice_address" value={invoiceFormData.invoice_address} onChange={handleInvoiceChange} className="h-9" />
                                        </div>
                                        <div className="col-span-12 md:col-span-1 space-y-2">
                                            <Label className="text-xs font-bold uppercase text-muted-foreground">Nº</Label>
                                            <Input name="invoice_number" value={invoiceFormData.invoice_number} onChange={handleInvoiceChange} className="h-9" />
                                        </div>
                                        <div className="col-span-12 md:col-span-3 space-y-2">
                                            <Label className="text-xs font-bold uppercase text-muted-foreground">Cidade/UF</Label>
                                            <div className="flex gap-1">
                                                <Input name="invoice_city" value={invoiceFormData.invoice_city} onChange={handleInvoiceChange} className="h-9 flex-1" placeholder="Cidade" />
                                                <Input name="invoice_state" value={invoiceFormData.invoice_state} onChange={handleInvoiceChange} className="h-9 w-12" placeholder="UF" />
                                            </div>
                                        </div>
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
                        className="h-9 px-6 uppercase text-xs font-bold"
                        onClick={() => {
                            if (initialData?.id) {
                                router.push(`/dashboard/patients/${initialData.id}`)
                            } else {
                                router.push('/dashboard/patients')
                            }
                        }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        className="h-9 px-6 uppercase text-xs font-bold hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: '#16a34a', color: 'white' }}
                    >
                        Salvar Cadastro
                    </Button>
                </CardFooter>
            </Card>
        </form >
    )
}
