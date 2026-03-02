"use client"

import { useState, useMemo, useEffect } from "react"
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
    Send, CheckCircle, CheckCircle2, Loader2, Calculator,
    Footprints, AlertCircle, Calendar as CalendarIcon,
    Upload, FileCheck, X, Info, CalendarClock
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { checkNavicularStatus } from "@/utils/clinical-references"
import { createAssessment } from "@/app/dashboard/[slug]/patients/actions/assessments"
import { registerInsoleDelivery } from "@/app/dashboard/[slug]/patients/actions/insoles"
import { useParams } from "next/navigation"
import { sendOrderToPropulsao } from "@/app/dashboard/[slug]/patients/actions/propulsao-actions"
import { Badge } from "@/components/ui/badge"

// --- CONSTANTS ---
const COLOR_LEFT_FOOT = '#14b8a6' // Teal-500
const COLOR_RIGHT_FOOT = '#f43f5e' // Rose-500

interface PropulsaoAccordionItemProps {
    value: string
    data: any
    patientId: string
    patientName?: string
    patientEmail?: string
    patientPhone?: string
    disabled?: boolean
    openSection: string | null
    form?: any
    patient?: any
    professional?: any
}

interface FootConfig {
    arco: string
    flexibilidade: string
    borda: string
    elevacao: string
    antep: string // Legacy field, kept for safety
    antepe: string // Correct field
    retrope: string
    absorcao: string
    corretivos: Record<string, boolean>
    pads: Record<string, boolean>
}

const DEFAULT_FOOT: FootConfig = {
    arco: 'Médio (25º)',
    flexibilidade: 'Semirrígido',
    borda: 'Sem Borda (Padrão)',
    elevacao: '0.0',
    antep: '',
    antepe: '',
    retrope: '',
    absorcao: 'Sem absorção',
    corretivos: {},
    pads: {}
}

const ELEVATION_OPTIONS = [
    { label: '0.0 cm', value: '0.0' },
    { label: '0.1 cm', value: '0.1' },
    { label: '0.2 cm', value: '0.2' },
    { label: '0.3 cm', value: '0.3' },
    { label: '0.4 cm', value: '0.4' },
    { label: '0.5 cm', value: '0.5' },
    { label: '0.6 cm', value: '0.6' },
    { label: '0.7 cm', value: '0.7' },
    { label: '0.8 cm', value: '0.8' },
    { label: '0.9 cm', value: '0.9' },
    { label: '1.0 cm', value: '1.0' },
    { label: '1.1 cm', value: '1.1' },
    { label: '1.2 cm', value: '1.2' },
    { label: '1.3 cm', value: '1.3' },
    { label: '1.5 cm', value: '1.5' }, // Common jump
    { label: '1.8 cm', value: '1.8' },
    { label: '2.0 cm', value: '2.0' },
]

export function PropulsaoAccordionItem({ value, data, patientId, patientName, patientEmail, patientPhone, disabled, openSection, form, patient, professional }: PropulsaoAccordionItemProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isSent, setIsSent] = useState(false)
    const [propulsaoStatus, setPropulsaoStatus] = useState<{ success?: boolean, orderNumber?: string, error?: string } | null>(null)

    // Scanner Files (Base64)
    const [fileE, setFileE] = useState<string | null>(null)
    const [fileD, setFileD] = useState<string | null>(null)

    // GENERAL OPTIONS DEFAULTS
    const [produto, setProduto] = useState('Slim')
    const [tipoPalmilha, setTipoPalmilha] = useState('Inteira')
    const [cobertura, setCobertura] = useState('EVA Azul (Padrão)')
    const [tamanho, setTamanho] = useState('')

    // Feet Configuration
    const [leftFoot, setLeftFoot] = useState<FootConfig>(DEFAULT_FOOT)
    const [rightFoot, setRightFoot] = useState<FootConfig>(DEFAULT_FOOT)

    // Observações do Pedido (Free text)
    const [reportText, setReportText] = useState('')

    // Delivery & Automation States
    const [deliveryDate, setDeliveryDate] = useState('')
    const [isRegisteringDelivery, setIsRegisteringDelivery] = useState(false)

    // Sync back to parent form
    useEffect(() => {
        if (!form) return
        const currentData = {
            produto, tipoPalmilha, cobertura, tamanho,
            leftFoot, rightFoot, reportText,
            fileE, fileD
        }
        form.setValue("insole", currentData, { shouldDirty: true })
    }, [produto, tipoPalmilha, cobertura, tamanho, leftFoot, rightFoot, reportText, fileE, fileD, form])

    // Update Helper
    const updateFoot = (side: 'left' | 'right', field: keyof FootConfig, value: any) => {
        const setter = side === 'left' ? setLeftFoot : setRightFoot
        setter(prev => ({ ...prev, [field]: value }))
    }

    const updatePad = (side: 'left' | 'right', padName: string, checked: boolean) => {
        const setter = side === 'left' ? setLeftFoot : setRightFoot
        setter(prev => {
            const newPads = { ...prev.pads, [padName]: checked }

            // Mutual exclusion: Gota <-> Barra
            if (checked) {
                if (padName === 'Gota') newPads['Barra'] = false
                if (padName === 'Barra') newPads['Gota'] = false
            }

            return {
                ...prev,
                pads: newPads
            }
        })
    }

    // --- AUTOMATION LOGIC ---
    useEffect(() => {
        if (!data) return

        if (data.plan?.deliveryDate) {
            setDeliveryDate(data.plan.deliveryDate)
        }

        // LOAD PREVIOUSLY SAVED INSOLE CONFIG
        if (data.insole) {
            const i = data.insole
            if (i.produto) setProduto(i.produto)
            if (i.tipoPalmilha) setTipoPalmilha(i.tipoPalmilha)
            if (i.cobertura) setCobertura(i.cobertura)
            if (i.tamanho) setTamanho(i.tamanho)
            if (i.leftFoot) setLeftFoot(i.leftFoot)
            if (i.rightFoot) setRightFoot(i.rightFoot)
            if (i.reportText) setReportText(i.reportText)
            if (i.fileE) setFileE(i.fileE)
            if (i.fileD) setFileD(i.fileD)
            return // Skip automation if we have local data already
        }

        const shoeSize = Number(data.postural?.shoeSize)
        if (shoeSize) setTamanho(String(shoeSize))

        const mapStatusToArc = (label: string) => {
            if (label.includes("Baixo")) return "Baixo (20º)"
            if (label.includes("Médio")) return "Médio (25º)"
            if (label.includes("Alto")) return "Alto (30º)"
            return null
        }

        // 1. Arch Logic (Navicular Height)
        if (shoeSize) {
            const navLeft = Number(data.postural?.navicular?.left)
            if (navLeft) {
                const status = checkNavicularStatus(navLeft, shoeSize)
                const arc = status?.label ? mapStatusToArc(status.label) : null
                if (arc) setLeftFoot(prev => ({ ...prev, arco: arc }))
            }
            const navRight = Number(data.postural?.navicular?.right)
            if (navRight) {
                const status = checkNavicularStatus(navRight, shoeSize)
                const arc = status?.label ? mapStatusToArc(status.label) : null
                if (arc) setRightFoot(prev => ({ ...prev, arco: arc }))
            }
        }

        // 2. DFI Logic (Antepé & Retropé)
        const mapDfiToDegree = (val: number) => {
            if (val <= -4) return "G (-) negativo | -12 graus"
            if (val === -3) return "M (-) negativo | -9 graus"
            if (val === -2) return "P (-) negativo | -6 graus"
            if (val === -1) return "PP (-) negativo | -3 graus"
            if (val === 0) return "Sem correção | 0 graus"
            if (val === 1) return "PP (+) positivo | 3 graus"
            if (val === 2) return "P (+) positivo | 6 graus"
            if (val === 3) return "M (+) positivo | 9 graus"
            if (val >= 4) return "G (+) positivo | 12 graus"
            return null
        }

        const dfi = data?.tests?.dfi
        if (dfi && Array.isArray(dfi)) {
            const retropL = Number(dfi[0]?.left)
            const antepL = Number(dfi[2]?.left)
            const retropR = Number(dfi[0]?.right)
            const antepR = Number(dfi[2]?.right)

            if (!isNaN(retropL)) { const d = mapDfiToDegree(retropL); if (d) setLeftFoot(prev => ({ ...prev, retrope: d })) }
            if (!isNaN(antepL)) { const d = mapDfiToDegree(antepL); if (d) setLeftFoot(prev => ({ ...prev, antepe: d })) }
            if (!isNaN(retropR)) { const d = mapDfiToDegree(retropR); if (d) setRightFoot(prev => ({ ...prev, retrope: d })) }
            if (!isNaN(antepR)) { const d = mapDfiToDegree(antepR); if (d) setRightFoot(prev => ({ ...prev, antepe: d })) }
        }

        // 3. Pain Map Logic (Labels -> PADS/Absorption)
        const painPoints = data?.painPoints || []
        painPoints.forEach((p: any) => {
            if (!p.label) return
            const text = p.label.toLowerCase()
            const isLeft = p.view === 'feetLeft' || p.view === 'left-feet'
            const isRight = p.view === 'feetRight' || p.view === 'right-feet'
            if (!isLeft && !isRight) return

            const setFoot = isLeft ? setLeftFoot : setRightFoot

            // Absorção
            if (text.includes('calcan') || text.includes('retro') || text.includes('talao') || text.includes('esporao') || text.includes('fascite')) {
                setFoot(prev => ({ ...prev, absorcao: 'Absorção' }))
            }

            // Absorção Logic (Calcâneo/Calcanhar)
            if (text.includes('calcaneo') || text.includes('calcâneo') || text.includes('calcanhar') || text.includes('talao')) {
                setFoot(prev => ({ ...prev, absorcao: 'Absorção' }))
            }

            // PADS MAPPING (New Keys)
            // 1st Met / Sesamoid -> Alívio 1º
            if (text.includes('1') || text.includes('halux') || text.includes('sesamoide')) {
                setFoot(prev => ({ ...prev, pads: { ...prev.pads, 'Alívio 1º Metatarso': true } }))
            }
            // 2/3 Met -> Alívio 2/3º
            if ((text.includes('2') || text.includes('3') || text.includes('central') || text.includes('medio')) && !text.includes('neuroma')) {
                setFoot(prev => ({ ...prev, pads: { ...prev.pads, 'Alívio 2/3º Metatarso': true } }))
            }
            // 4/5 Met -> Alívio 4/5º
            if (text.includes('4') || text.includes('5') || text.includes('quinto')) {
                setFoot(prev => ({ ...prev, pads: { ...prev.pads, 'Alívio 4/5º Metatarso': true } }))
            }
            // Neuroma -> Gota
            if (text.includes('neuroma')) {
                setFoot(prev => ({ ...prev, pads: { ...prev.pads, 'Gota': true } }))
            }
            // Metatarsalgia General -> Barra
            if (text.includes('metatarsalgia') || text.includes('barra')) {
                setFoot(prev => ({ ...prev, pads: { ...prev.pads, 'Barra': true } }))
            }
        })

        // 4. Elevation Logic (Teste do Catálogo)
        const catalogo = data?.postural?.teste_catalogo
        if (catalogo) {
            const hL = Number(catalogo.left)
            const hR = Number(catalogo.right)
            // Map specific mm to nearest 0.1cm string if possible, or just default to exact match
            if (!isNaN(hL) && hL > 0) setLeftFoot(prev => ({ ...prev, elevacao: String(hL / 10) }))
            if (!isNaN(hR) && hR > 0) setRightFoot(prev => ({ ...prev, elevacao: String(hR / 10) }))
        }

    }, [data])

    // --- REPORT GENERATOR AI ---
    useEffect(() => {
        const getCorrectionType = (val: string) => {
            if (!val || val.includes("Sem correção")) return null
            if (val.includes("positivo")) return "Pronação"
            if (val.includes("negativo")) return "Supinação"
            return null
        }

        let parts: string[] = []

        // 1. Introduction
        parts.push("Indicação de órteses plantares (palmilhas) desenhadas para distribuir melhor a pressão plantar e controlar o movimentos indesejados do pé.")

        // 2. Corrections (Refatorado para melhor gramática e menos repetição)
        const getCorrectionDetails = (conf: any) => {
            const ret = getCorrectionType(conf.retrope)
            const ant = getCorrectionType(conf.antepe)
            if (!ret && !ant) return null
            let details: string[] = []
            if (ret) details.push(`controle de ${ret} no retropé`)
            if (ant) details.push(`controle de ${ant} no antepé`)
            return details.join(" e ")
        }

        const leftDetails = getCorrectionDetails(leftFoot)
        const rightDetails = getCorrectionDetails(rightFoot)

        if (leftDetails && rightDetails && leftDetails === rightDetails) {
            parts.push(`Para ambos os pés, foram aplicadas correções biomecânicas visando o ${leftDetails}.`)
        } else {
            if (leftDetails) parts.push(`Para o pé esquerdo, a órtese inclui ${leftDetails}.`)
            if (rightDetails) parts.push(`Para o pé direito, foram incorporadas correções para o ${rightDetails}.`)
        }

        // 3. Elevation
        if ((leftFoot.elevacao !== '0.0' && leftFoot.elevacao !== '0') || (rightFoot.elevacao !== '0.0' && rightFoot.elevacao !== '0')) {
            parts.push("Foi incluída compensação (elevação) com o intuito de proporcionar alinhamento dos membros inferiores e da pelve, melhorando a distribuição de carga axial.")
        }

        // 4. Borda
        if (leftFoot.borda !== 'Sem Borda (Padrão)' || rightFoot.borda !== 'Sem Borda (Padrão)') {
            parts.push("O dispositivo possui bordas elevadas para otimizar o controle e estabilidade dos movimentos do calcâneo.")
        }

        // 5. Pads & Absorption
        const hasPads = Object.values(leftFoot.pads).some(Boolean) || Object.values(rightFoot.pads).some(Boolean)
        const hasAbs = leftFoot.absorcao !== 'Sem absorção' || rightFoot.absorcao !== 'Sem absorção'
        if (hasPads || hasAbs) {
            parts.push("Foram adicionados elementos de absorção e alívio (PADS) estrategicamente posicionados para reduzir a pressão nos pontos de maior sobrecarga e sintomatologia dolorosa.")
        }

        setReportText(parts.join("\n\n"))
    }, [leftFoot, rightFoot])

    // Pricing Logic
    const calculatePrice = useMemo(() => {
        let total = 0
        const basePrice = produto.includes("Slim") ? 190 : 240
        total += basePrice

        // Cobertura (Não padrão +20)
        if (!cobertura.includes("EVA Azul")) total += 20

        // Per Foot Calculation
        const calculateFootExtras = (foot: FootConfig) => {
            let footTotal = 0;

            // Absorção
            if (foot.absorcao === 'Absorção') footTotal += 5;
            if (foot.absorcao === 'Absorção inteira') footTotal += 10;

            // PADS
            if (foot.pads['Gota']) footTotal += 5;
            if (foot.pads['Barra']) footTotal += 10;

            // Alívios (R$ 5,00 cada)
            if (foot.pads['Alívio 1º Metatarso']) footTotal += 5;
            if (foot.pads['Alívio 2/3º Metatarso']) footTotal += 5;
            if (foot.pads['Alívio 4/5º Metatarso']) footTotal += 5;

            return footTotal;
        }

        total += calculateFootExtras(leftFoot);
        total += calculateFootExtras(rightFoot);

        return total
    }, [produto, cobertura, leftFoot, rightFoot])

    const params = useParams()
    const slug = params?.slug as string

    const handleRegisterDelivery = async () => {
        if (!patientId || patientId === 'sandbox') {
            toast.error("Não é possível registrar entrega em modo Sandbox.")
            return
        }

        setIsRegisteringDelivery(true)
        try {
            const date = deliveryDate ? new Date(deliveryDate) : new Date()
            // Fix: registerInsoleDelivery expects a single object
            const res = await registerInsoleDelivery({
                patientId,
                deliveryDate: date,
                slug,
                note: `Entrega de palmilha registrada via formulário PBE. Modelo: ${produto}.`
            })

            if (res.success) {
                toast.success("Entrega registrada! Acompanhamentos de 40 dias e 1 ano agendados automaticamente.")
                if (form) {
                    form.setValue("plan.deliveryDate", date.toISOString().split('T')[0])
                }
                setDeliveryDate(date.toISOString().split('T')[0])
            } else {
                toast.error(res.message)
            }
        } catch (error) {
            console.error("Error registering delivery:", error)
            toast.error("Erro ao registrar entrega.")
        } finally {
            setIsRegisteringDelivery(false)
        }
    }

    const handleSend = async () => {
        if (!patientId || patientId === 'sandbox') {
            toast.error("Não é possível enviar pedidos reais em modo Sandbox.")
            return
        }

        // --- VALIDAÇÕES DE DADOS OBRIGATÓRIOS ---
        const nomeLimpo = patientName.trim();
        if (nomeLimpo.split(' ').length < 2 || nomeLimpo.toUpperCase() === "PACIENTE TESTE") {
            toast.error("O pedido exige o NOME COMPLETO do paciente. Por favor, atualize o cadastro.");
            return;
        }

        if (!patientPhone || patientPhone.trim() === '') {
            toast.error("O pedido exige o número de TELEFONE do paciente para contato. Por favor, atualize o cadastro.");
            return;
        }

        if (!tamanho || tamanho.trim() === '' || isNaN(Number(tamanho))) {
            toast.error("O pedido exige a NUMERAÇÃO da palmilha preenchida corretamente.");
            return;
        }
        // ----------------------------------------

        setIsLoading(true)
        try {
            const prescriptionData = {
                general: {
                    produto,
                    tipoPalmilha,
                    cobertura,
                    tamanho
                },
                leftFoot,
                rightFoot,
                reportText,
                totalPrice: calculatePrice
            }

            // 1. Enviar para a Propulsão
            const propulsaoRes = await sendOrderToPropulsao(
                {
                    ...prescriptionData,
                    fileE: fileE || "UExhY2Vob2xkZXI=",
                    fileD: fileD || "UExhY2Vob2xkZXI="
                },
                { nome: patientName, email: patientEmail },
                {
                    email: professional?.email || professional?.id || 'contato@axiom.com',
                    nome: professional?.full_name || 'Fisioterapeuta',
                    address: professional?.address || 'Axiom'
                }
            )

            setPropulsaoStatus(propulsaoRes)

            // 2. Salvar localmente no prontuário
            try {
                const assessmentRes = await createAssessment(
                    patientId,
                    'insoles_prescription',
                    {
                        ...prescriptionData,
                        propulsaoOrder: propulsaoRes.success ? propulsaoRes.orderNumber : null
                    },
                    {
                        total: calculatePrice,
                        model: produto,
                        type: tipoPalmilha,
                        propulsaoOrder: propulsaoRes.success ? propulsaoRes.orderNumber : null
                    },
                    `Prescrição de Palmilha - ${produto} ${propulsaoRes.success ? `(Pedido Propulsão: ${propulsaoRes.orderNumber})` : ''}`,
                    slug
                );

                if (!assessmentRes.success) {
                    console.error("Erro ao salvar avaliação localmente:", assessmentRes.msg);
                    toast.warning("Pedido processado, mas houve um problema ao salvar no prontuário local.");
                }
            } catch (err: any) {
                console.error("Exceção ao salvar no prontuário:", err);
            }

            setIsSent(true)
            if (propulsaoRes.success) {
                toast.success(`Pedido enviado à Propulsão!`)
            } else {
                toast.warning("Prescrição salva no prontuário, mas houve um erro ao enviar para a Propulsão. Verifique o log.")
            }
        } catch (error) {
            console.error("Erro ao salvar prescrição:", error)
            toast.error("Erro ao processar pedido.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AccordionItem
            value={value}
            data-value={value}
            className={cn(
                "border rounded-xl bg-card border-l-4 transition-all duration-300",
                openSection === value ? 'col-span-1 md:col-span-2' : 'col-span-1'
            )}
            style={{ borderLeftColor: '#3b82f6' }}
        >
            <AccordionTrigger className="px-4 font-semibold text-lg hover:no-underline">
                <div className="flex items-center gap-2">
                    <Send className="w-5 h-5 text-blue-600" />
                    Pedido de Palmilha
                </div>
            </AccordionTrigger>

            <AccordionContent className="p-4 bg-slate-50/50">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT COLUMN: FORM */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* 1. General Options (LAYOUT REFORMULADO) */}
                        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
                            {/* Row 1: Model & Type */}
                            <div className="flex gap-4">
                                <div className="space-y-2 flex-grow">
                                    <Label>Modelo da Palmilha</Label>
                                    <Select value={produto} onValueChange={setProduto}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Slim">Slim</SelectItem>
                                            <SelectItem value="Biomecânica">Biomecânica</SelectItem>
                                            <SelectItem value="Chinelo">Chinelo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 w-1/3">
                                    <Label>Tipo</Label>
                                    <Select value={tipoPalmilha} onValueChange={setTipoPalmilha}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Inteira">Inteira</SelectItem>
                                            <SelectItem value="3/4">3/4</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Row 2: Numeração | Cobertura */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Numeração</Label>
                                    <div className="relative">
                                        <Footprints className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <input
                                            type="number"
                                            value={tamanho}
                                            onChange={(e) => setTamanho(e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 pl-9"
                                            placeholder="Ex: 37"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Cobertura (Acabamento)</Label>
                                    <Select value={cobertura} onValueChange={setCobertura}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="EVA Azul (Padrão)">EVA Azul (Padrão)</SelectItem>
                                            <SelectItem value="Tecido Azul">Tecido Azul</SelectItem>
                                            <SelectItem value="Tecido Preto">Tecido Preto</SelectItem>
                                            <SelectItem value="Plastazote">Plastazote</SelectItem>
                                            <SelectItem value="Nobuk">Nobuk</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 items-start shadow-sm">
                                <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                                <div className="space-y-1">
                                    <p className="text-xs text-blue-900 font-bold uppercase tracking-tight">Registro de Entrega</p>
                                    <p className="text-[11px] text-blue-800 leading-relaxed italic">
                                        Para registrar a <strong>entrega física</strong> (que gera uma evolução no prontuário) e programar os acompanhamentos automáticos, utilize a aba <strong>"Palmilhas"</strong> no perfil do paciente.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 2. Feet Config */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FootForm
                                side="left"
                                color={COLOR_LEFT_FOOT}
                                label="Pé Esquerdo"
                                config={leftFoot}
                                onUpdate={updateFoot}
                                onTogglePad={updatePad}
                                scannerFile={fileE}
                                onFileChange={setFileE}
                            />
                            <FootForm
                                side="right"
                                color={COLOR_RIGHT_FOOT}
                                label="Pé Direito"
                                config={rightFoot}
                                onUpdate={updateFoot}
                                onTogglePad={updatePad}
                                scannerFile={fileD}
                                onFileChange={setFileD}
                            />
                        </div>
                    </div>

                    {/* RIGHT COLUMN: SUMMARY */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-4 space-y-4">
                            <div className="bg-white p-6 rounded-xl border shadow-lg ring-1 ring-slate-200">
                                <h3 className="font-bold text-lg border-b pb-2 mb-4 flex items-center gap-2 text-slate-800">
                                    <Calculator className="w-5 h-5 text-green-600" />
                                    Resumo do Pedido
                                </h3>
                                <div className="space-y-4 text-sm">
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-slate-500 uppercase tracking-wider">Paciente DO</span>
                                        </div>
                                        <div className="font-bold text-slate-900 truncate" title={patientName}>{patientName || "Não identificado"}</div>
                                        <div className="text-xs text-slate-600 truncate">{patientEmail || "Sem email"}</div>
                                        <div className="text-xs text-slate-600">{patientPhone || "Sem telefone"}</div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs border-y border-dashed py-2 my-2">
                                        <div>
                                            <span className="text-slate-500 block mb-1">Modelo / Tipo</span>
                                            <div className="flex flex-wrap gap-1">
                                                <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-100">{produto}</span>
                                                <span className="px-1.5 py-0.5 rounded bg-green-50 text-green-700 font-bold border border-green-100">{tipoPalmilha}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-slate-500 block mb-1">Tam.</span>
                                            <span className="font-bold text-slate-900 text-lg">{tamanho || "-"}</span>
                                        </div>

                                        <div className="col-span-2 mt-1">
                                            <span className="text-slate-500 block mb-1">Cobertura</span>
                                            <CoberturaBadge cobertura={cobertura} />
                                        </div>
                                    </div>

                                    <FootSummary side="Esquerdo" config={leftFoot} color="text-teal-500" />
                                    <div className="border-t border-dashed my-2" />
                                    <FootSummary side="Direito" config={rightFoot} color="text-rose-500" />

                                    <div className="border-t border-double border-slate-300 my-4" />
                                    <div className="flex justify-between items-center text-lg font-bold text-slate-900">
                                        <span>Total:</span><span>R$ {calculatePrice.toFixed(2)}</span>
                                    </div>
                                    <div className="text-xs text-right text-slate-400">
                                        (Gota/Alívio/Abs: +R$5 | Barra/Abs.Int: +R$10 | Cob: R$20)
                                    </div>
                                </div>

                                <div className="mt-6">
                                    {!isSent ? (
                                        <Button className="w-full bg-green-600 hover:bg-green-700 h-10 font-bold shadow-md" onClick={handleSend} disabled={isLoading}>
                                            {isLoading ? <Loader2 className="animate-spin" /> : <>ENVIAR PARA FÁBRICA <Send className="ml-2 w-4 h-4" /></>}
                                        </Button>
                                    ) : (
                                        <div className="flex flex-col gap-3">
                                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center text-green-800 text-sm">
                                                {propulsaoStatus?.success ? (
                                                    <div className="mb-2 p-2 rounded-lg bg-green-50 text-green-800 flex items-start gap-3 justify-between">
                                                        <div className="flex gap-3">
                                                            <CheckCircle className="w-5 h-5 mt-0.5" />
                                                            <div className="text-left">
                                                                <h4 className="font-bold">Pedido Aceito pela Propulsão!</h4>
                                                                <p className="text-sm text-green-700 mt-1">
                                                                    {propulsaoStatus?.orderNumber ? (
                                                                        <>Pedido gerado: <span className="font-mono font-bold bg-green-100 px-1 rounded">#{propulsaoStatus.orderNumber}</span>. Os dados foram entregues à fábrica.</>
                                                                    ) : (
                                                                        "Os dados criptografados foram entregues à fábrica."
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="font-bold flex items-center justify-center gap-2">
                                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                        SALVO NO PRONTUÁRIO
                                                    </p>
                                                )}
                                                {propulsaoStatus && !propulsaoStatus.success && (
                                                    <p className="text-[10px] text-red-500 mt-1 font-medium italic">
                                                        Erro no envio: {propulsaoStatus.error}
                                                    </p>
                                                )}
                                            </div>

                                            <Button
                                                variant="outline"
                                                className="w-full font-bold border-blue-200 text-blue-700 hover:bg-blue-50 active:scale-95 transition-transform"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    console.log("Resetting order state...");
                                                    setPropulsaoStatus(null);
                                                    setIsSent(false);
                                                }}
                                            >
                                                {propulsaoStatus?.success ? "NOVO PEDIDO / REPETIR" : "TENTAR NOVAMENTE"}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Observations (Full Width) */}
                <div className="mt-8 space-y-6">
                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                        <Label className="text-base font-semibold flex items-center gap-2 mb-3">
                            Orientações para o paciente e/ou profissional de saúde
                        </Label>
                        <textarea
                            className="flex w-full rounded-md border border-slate-300 bg-slate-50 px-4 py-3 text-sm min-h-[100px] focus:bg-white transition-all shadow-inner"
                            placeholder="Descreva modificações específicas..."
                        />
                    </div>
                    {/* 4. Clinical Report (New Location) */}
                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 shadow-sm relative">
                        <Label className="text-base font-semibold flex items-center gap-2 mb-3 text-blue-900">
                            Resumo Clínico da Palmilha (Relatório)
                        </Label>
                        <textarea
                            value={reportText}
                            onChange={(e) => setReportText(e.target.value)}
                            className="flex w-full rounded-md border border-blue-200 bg-white px-4 py-3 text-sm min-h-[150px] focus:ring-2 focus:ring-blue-500 text-slate-700 leading-relaxed"
                        />
                        <div className="absolute top-6 right-6">
                        </div>
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem >
    )
}

function FootSummary({ side, config, color }: { side: string, config: FootConfig, color: string }) {
    const hasCorrections = (config.retrope && !config.retrope.includes("Sem correção")) || (config.antepe && !config.antepe.includes("Sem correção"))
    const shortText = (t: string) => t?.split('|')[0]?.trim() || t

    // Logic for Flexibility Colors
    const flexColor = (f: string) => {
        if (f.includes("Flexível")) return "bg-green-50 text-green-700 border-green-100"
        if (f.includes("Semirrígido")) return "bg-yellow-50 text-yellow-700 border-yellow-100" // Amarelo "suave"
        if (f.includes("Rígido")) return "bg-red-50 text-red-700 border-red-100"
        return "bg-slate-50 text-slate-500"
    }

    // Logic for Correction Colors (+/-)
    const correctionColor = (c: string) => {
        if (c.includes("(+)")) return "bg-green-50 text-green-700 border-green-100"
        if (c.includes("(-)")) return "bg-orange-50 text-orange-700 border-orange-100"
        return "bg-slate-50 text-slate-600 border-slate-100"
    }

    // Logic for Relief Grouping
    const reliefPads = ['Alívio 1º Metatarso', 'Alívio 2/3º Metatarso', 'Alívio 4/5º Metatarso']
    const activeReliefs = reliefPads.filter(pad => config.pads[pad])
    const hasAllReliefs = activeReliefs.length === 3

    // Logic for Special Pads
    const specialPads = ['Gota', 'Barra']
    const activeSpecials = specialPads.filter(pad => config.pads[pad])

    return (
        <div className="space-y-1">
            <div className={`font-bold text-xs uppercase ${color} flex justify-between items-center`}>
                {side}
                <div className="flex gap-1">
                    <span className={`text-[10px] font-bold normal-case border px-1.5 rounded ${flexColor(config.flexibilidade)}`}>
                        {config.flexibilidade.substring(0, 5)}.
                    </span>
                    {config.borda !== 'Sem Borda (Padrão)' && <span className="text-[10px] text-slate-400 font-normal normal-case border px-1 rounded">Borda</span>}
                </div>
            </div>

            <div className="flex justify-between text-xs">
                <span className="text-slate-500">Arco:</span>
                <span className="font-medium">{config.arco}</span>
            </div>

            {hasCorrections && (
                <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className={`text-[10px] font-bold px-2 py-1 rounded border flex flex-col items-center justify-center text-center leading-tight ${correctionColor(config.retrope)}`}>
                        <span className="opacity-60 text-[8px] uppercase tracking-wide mb-0.5">Retropé</span>
                        <span>{shortText(config.retrope) || "-"}</span>
                    </div>
                    <div className={`text-[10px] font-bold px-2 py-1 rounded border flex flex-col items-center justify-center text-center leading-tight ${correctionColor(config.antepe)}`}>
                        <span className="opacity-60 text-[8px] uppercase tracking-wide mb-0.5">Antepé</span>
                        <span>{shortText(config.antepe) || "-"}</span>
                    </div>
                </div>
            )}

            {config.elevacao && config.elevacao !== "0.0" && config.elevacao !== "0" && (
                <div className="flex justify-between text-orange-600 text-xs font-medium bg-orange-50 px-2 py-1 rounded"><span>Elevação:</span><span>+{config.elevacao} cm</span></div>
            )}

            {config.absorcao !== "Sem absorção" && config.absorcao !== "Não" && (
                <div className="flex justify-between text-pink-700 text-xs font-medium bg-pink-50 border border-pink-100 px-2 py-1 rounded mt-1">
                    <span>Absorção:</span><span>{config.absorcao}</span>
                </div>
            )}

            {/* RELIEF PADS (PINK) */}
            {(hasAllReliefs || activeReliefs.length > 0) && (
                <div className="text-xs text-pink-700 bg-pink-50 border border-pink-100 p-2 rounded mt-1">
                    <span className="font-bold block mb-1"></span>
                    {hasAllReliefs ? "Alívio Total de Metatarsos" : activeReliefs.join(", ")}
                </div>
            )}

            {/* SPECIAL PADS (ORANGE) - GOTA / BARRA */}
            {activeSpecials.length > 0 && (
                <div className="text-xs text-orange-700 bg-orange-50 border border-orange-100 p-2 rounded mt-1">
                    <span className="font-bold block mb-1"></span>
                    {activeSpecials.join(", ")}
                </div>
            )}
        </div>
    )
}

function FootForm({
    side,
    color,
    label,
    config,
    onUpdate,
    onTogglePad,
    scannerFile,
    onFileChange
}: {
    side: 'left' | 'right',
    color?: string,
    label: string,
    config: FootConfig,
    onUpdate: any,
    onTogglePad: any,
    scannerFile: string | null,
    onFileChange: (base64: string | null) => void
}) {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onloadend = () => {
            const base64String = reader.result as string
            // Remove data:application/octet-stream;base64, or similar prefixes
            const cleanBase64 = base64String.split(',')[1]
            onFileChange(cleanBase64)
            toast.success("Arquivo do scanner carregado com sucesso!")
        }
        reader.readAsDataURL(file)
    }

    return (
        <div className="space-y-4">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: color }}>
                <Footprints className="w-5 h-5" />
                {label}
            </h3>

            <div className="grid gap-3 bg-slate-50 p-4 rounded-lg border">
                {/* 1. Arco, Flexibilidade, Borda (Stacked Vertical per User Request) */}
                <div className="space-y-3">
                    <div>
                        <Label className="text-xs text-slate-500 block mb-1">Arco (Altura)</Label>
                        <Select value={config.arco} onValueChange={(v) => onUpdate(side, 'arco', v)}>
                            <SelectTrigger className="h-9 bg-white"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Baixo (20º)">Baixo (20º)</SelectItem>
                                <SelectItem value="Médio (25º)">Médio (25º)</SelectItem>
                                <SelectItem value="Alto (30º)">Alto (30º)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="text-xs text-slate-500 block mb-1">Flexibilidade</Label>
                        <Select value={config.flexibilidade} onValueChange={(v) => onUpdate(side, 'flexibilidade', v)}>
                            <SelectTrigger className="h-9 bg-white"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Flexível">Flexível</SelectItem>
                                <SelectItem value="Semirrígido">Semirrígido</SelectItem>
                                <SelectItem value="Rígido">Rígido</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="text-xs text-slate-500 block mb-1">Borda</Label>
                        <Select value={config.borda} onValueChange={(v) => onUpdate(side, 'borda', v)}>
                            <SelectTrigger className="h-9 bg-white"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Sem Borda (Padrão)">Sem Borda (Padrão)</SelectItem>
                                <SelectItem value="Borda Simples">Borda Simples</SelectItem>
                                <SelectItem value="Borda Prolongada">Borda Prolongada</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="border-t my-1 border-slate-200 opacity-50" />

                {/* 2. Elevação (Full List) */}
                <div>
                    <Label className="text-xs text-slate-500 block mb-1">Elevação (Compensação)</Label>
                    <Select value={config.elevacao} onValueChange={(v) => onUpdate(side, 'elevacao', v)}>
                        <SelectTrigger className="h-9 bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent className="max-h-[200px]">
                            {ELEVATION_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* 3. Absorção (Updated Options) */}
                <div>
                    <Label className="text-xs text-slate-500 block mb-1">Absorção de Impacto (Talão)</Label>
                    <Select value={config.absorcao} onValueChange={(v) => onUpdate(side, 'absorcao', v)}>
                        <SelectTrigger className="h-9 bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Sem absorção">Sem absorção</SelectItem>
                            <SelectItem value="Absorção">Absorção</SelectItem>
                            <SelectItem value="Absorção inteira">Absorção inteira</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* 4. Correções (Vertical Stack) */}
                {/* 4. Correções (Vertical Stack Separado) */}
                <div className="pt-2 space-y-3">
                    {/* Retropé */}
                    <div>
                        <Label className="text-xs mb-1 block font-semibold text-slate-700">Correção do Retropé</Label>
                        <Select value={config.retrope} onValueChange={(v) => onUpdate(side, 'retrope', v)}>
                            <SelectTrigger className="h-8 text-[11px] bg-white text-wrap h-auto py-1"><SelectValue placeholder="Retropé" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Sem correção | 0 graus">Neutro (0º)</SelectItem>
                                <SelectItem value="G (-) negativo | -12 graus">Supinação (-12º)</SelectItem>
                                <SelectItem value="M (-) negativo | -9 graus">Supinação (-9º)</SelectItem>
                                <SelectItem value="P (-) negativo | -6 graus">Supinação (-6º)</SelectItem>
                                <SelectItem value="PP (-) negativo | -3 graus">Supinação (-3º)</SelectItem>
                                <SelectItem value="PP (+) positivo | 3 graus">Pronação (+3º)</SelectItem>
                                <SelectItem value="P (+) positivo | 6 graus">Pronação (+6º)</SelectItem>
                                <SelectItem value="M (+) positivo | 9 graus">Pronação (+9º)</SelectItem>
                                <SelectItem value="G (+) positivo | 12 graus">Pronação (+12º)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Antepé */}
                    <div>
                        <Label className="text-xs mb-1 block font-semibold text-slate-700">Correção do Antepé</Label>
                        <Select value={config.antepe} onValueChange={(v) => onUpdate(side, 'antepe', v)}>
                            <SelectTrigger className="h-8 text-[11px] bg-white text-wrap h-auto py-1"><SelectValue placeholder="Antepé" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Sem correção | 0 graus">Neutro (0º)</SelectItem>
                                <SelectItem value="G (-) negativo | -12 graus">Supinação (-12º)</SelectItem>
                                <SelectItem value="M (-) negativo | -9 graus">Supinação (-9º)</SelectItem>
                                <SelectItem value="P (-) negativo | -6 graus">Supinação (-6º)</SelectItem>
                                <SelectItem value="PP (-) negativo | -3 graus">Supinação (-3º)</SelectItem>
                                <SelectItem value="PP (+) positivo | 3 graus">Pronação (+3º)</SelectItem>
                                <SelectItem value="P (+) positivo | 6 graus">Pronação (+6º)</SelectItem>
                                <SelectItem value="M (+) positivo | 9 graus">Pronação (+9º)</SelectItem>
                                <SelectItem value="G (+) positivo | 12 graus">Pronação (+12º)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* 5. PADS (Specific List) */}
                <div className="pt-3 border-t border-slate-200 mt-2">
                    <Label className="text-xs mb-2 block font-semibold text-slate-700">PADS & Elementos Extras</Label>
                    <div className="space-y-2">
                        {[
                            'Alívio 1º Metatarso',
                            'Alívio 2/3º Metatarso',
                            'Alívio 4/5º Metatarso',
                            'Gota',
                            'Barra'
                        ].map((pad) => (
                            <div key={pad} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`pad-${side}-${pad}`}
                                    checked={config.pads[pad] || false}
                                    onCheckedChange={(checked) => onTogglePad(side, pad, checked === true)}
                                    className="h-4 w-4 rounded border-slate-300"
                                />
                                <label htmlFor={`pad-${side}-${pad}`} className="text-xs leading-none cursor-pointer text-slate-600 font-medium">
                                    {pad}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 6. Scanner 3D Upload */}
                <div className="pt-3 border-t border-slate-200 mt-2">
                    <Label className="text-xs mb-2 block font-semibold text-slate-700 flex items-center gap-2">
                        <Upload className="w-3 h-3" /> Scanner 3D (Arquivo .STL)
                    </Label>
                    {!scannerFile ? (
                        <div className="relative group">
                            <input
                                type="file"
                                accept=".stl,.obj,.ply"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center group-hover:border-blue-300 transition-colors bg-white">
                                <p className="text-[10px] text-slate-400 font-medium tracking-tight">
                                    Clique para selecionar o arquivo do scanner
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between bg-blue-50 border border-blue-100 p-2 rounded-lg">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <FileCheck className="w-4 h-4 text-blue-600 shrink-0" />
                                <span className="text-[10px] font-bold text-blue-800 truncate">Scanner Carregado!</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onFileChange(null)}
                                className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-500 rounded-full"
                            >
                                <X className="w-3 h-3" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function CoberturaBadge({ cobertura }: { cobertura: string }) {
    let style = "bg-slate-100 text-slate-600 border-slate-200"
    if (cobertura.includes("EVA Azul")) style = "bg-blue-100 text-blue-700 border-blue-200"
    if (cobertura.includes("Tecido Azul")) style = "bg-blue-600 text-white border-blue-700 shadow-sm"
    if (cobertura.includes("Tecido Preto")) style = "bg-slate-800 text-white border-slate-900 shadow-sm"
    if (cobertura.includes("Plastazote")) style = "bg-pink-50 text-pink-600 border-pink-100"
    if (cobertura.includes("Nobuk")) style = "bg-stone-100 text-stone-600 border-stone-200"

    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${style} block w-fit shadow-sm`}>
            {cobertura}
        </span>
    )
}
