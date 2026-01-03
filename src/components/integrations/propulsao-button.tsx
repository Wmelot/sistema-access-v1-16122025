"use client"

import React, { useState, useMemo } from 'react'
import { Button } from "@/components/ui/button"
import { Send, Loader2, CheckCircle, AlertCircle, Calculator } from "lucide-react"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface PropulsaoButtonProps {
    data: any
    patientId: string
    patientName: string
    patientEmail?: string
    patientPhone?: string
    disabled?: boolean
}

type FootConfig = {
    antepe: string
    retrope: string
    elevacao: string
    arco: string
    suporte: string
    borda: string
    absorcao: string
    pads: Record<string, boolean>
}

const DEFAULT_FOOT: FootConfig = {
    antepe: 'Sem correção | 0 graus',
    retrope: 'Sem correção | 0 graus',
    elevacao: '0.0 cm',
    arco: 'Baixo (20º)',
    suporte: 'Flexível',
    borda: 'Sem Borda',
    absorcao: 'Sem absorção',
    pads: {
        'Alívio 1º Metatarso': false,
        'Alívio 2º/3º Metatarso': false,
        'Alívio 4º/5º Metatarso': false,
        'Gota': false,
        'Barra': false
    }
}

export function PropulsaoButton({ data, patientId, patientName, patientEmail, patientPhone, disabled }: PropulsaoButtonProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isSent, setIsSent] = useState(false)
    const [open, setOpen] = useState(false)

    // General Options
    const [produto, setProduto] = useState('Biomecanica')
    const [cobertura, setCobertura] = useState('EVA Azul')

    // Feet Configuration
    const [leftFoot, setLeftFoot] = useState<FootConfig>({ ...DEFAULT_FOOT })
    const [rightFoot, setRightFoot] = useState<FootConfig>({ ...DEFAULT_FOOT })

    // Update Helper
    const updateFoot = (side: 'left' | 'right', field: keyof FootConfig, value: any) => {
        const setter = side === 'left' ? setLeftFoot : setRightFoot
        setter(prev => ({ ...prev, [field]: value }))
    }

    const updatePad = (side: 'left' | 'right', padName: string, checked: boolean) => {
        const setter = side === 'left' ? setLeftFoot : setRightFoot
        setter(prev => ({
            ...prev,
            pads: { ...prev.pads, [padName]: checked }
        }))
    }

    // Pricing Logic
    const calculatePrice = useMemo(() => {
        let total = 0

        // Coberturas (Par)
        // Coberturas (Par)
        if (cobertura === 'Tecido Azul' || cobertura === 'Tecido Preto') total += 15
        if (cobertura === 'Plastazote' || cobertura === 'Nobuk') total += 30
        // EVA Azul is base (0)

        const calculateFootExtras = (foot: FootConfig) => {
            let sub = 0
            // Absorção
            if (foot.absorcao === 'Com Absorção') sub += 5
            if (foot.absorcao === 'Absorção Inteira') sub += 10

            // PADS
            if (foot.pads['Alívio 1º Metatarso']) sub += 5
            if (foot.pads['Alívio 2º/3º Metatarso']) sub += 5
            if (foot.pads['Alívio 4º/5º Metatarso']) sub += 5
            if (foot.pads['Gota']) sub += 5
            if (foot.pads['Barra']) sub += 10

            return sub
        }

        total += calculateFootExtras(leftFoot)
        total += calculateFootExtras(rightFoot)

        return total
    }, [cobertura, leftFoot, rightFoot])


    const handleSend = async () => {
        setIsLoading(true)
        try {
            const response = await fetch('/api/integrations/propulsao/order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assessment: data,
                    patient: { name: patientName, email: patientEmail, phone: patientPhone },
                    professionalId: 'current-user-id',
                    options: {
                        produto,
                        cobertura,
                        leftFoot,
                        rightFoot,
                        priceAdditional: calculatePrice
                    }
                })
            })

            const result = await response.json()

            if (!result.success) {
                throw new Error(result.error || 'Falha na integração')
            }

            toast.success('Pedido enviado para Propulsão com sucesso!')
            setIsSent(true)
            setOpen(false)
        } catch (error: any) {
            console.error(error)
            toast.error(`Erro ao enviar: ${error.message}`)
        } finally {
            setIsLoading(false)
        }
    }

    if (isSent) {
        return (
            <Button variant="outline" className="bg-green-50 text-green-700 border-green-200" disabled>
                <CheckCircle className="w-4 h-4 mr-2" />
                Pedido Enviado
            </Button>
        )
    }

    const degreesOptions = [
        "G (-) negativo | -12 graus",
        "M (-) negativo | -9 graus",
        "P (-) negativo | -6 graus",
        "PP (-) negativo | -3 graus",
        "Sem correção | 0 graus",
        "PP (+) positivo | 3 graus",
        "P (+) positivo | 6 graus",
        "M (+) positivo | 9 graus",
        "G (+) positivo | 12 graus"
    ]

    const FootForm = ({ side, config }: { side: 'left' | 'right', config: FootConfig }) => (
        <div className="space-y-3">
            <div className="grid grid-cols-4 items-center gap-2">
                <Label className="text-right text-xs">Antepé</Label>
                <Select value={config.antepe} onValueChange={(v) => updateFoot(side, 'antepe', v)}>
                    <SelectTrigger className="col-span-3 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-56">
                        {degreesOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-2">
                <Label className="text-right text-xs">Retropé</Label>
                <Select value={config.retrope} onValueChange={(v) => updateFoot(side, 'retrope', v)}>
                    <SelectTrigger className="col-span-3 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-56">
                        {degreesOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-2">
                <Label className="text-right text-xs">Arco</Label>
                <Select value={config.arco} onValueChange={(v) => updateFoot(side, 'arco', v)}>
                    <SelectTrigger className="col-span-3 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Baixo (20º)">Baixo (20º)</SelectItem>
                        <SelectItem value="Médio (25º)">Médio (25º)</SelectItem>
                        <SelectItem value="Alto (30º)">Alto (30º)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-2">
                <Label className="text-right text-xs">Suporte</Label>
                <Select value={config.suporte} onValueChange={(v) => updateFoot(side, 'suporte', v)}>
                    <SelectTrigger className="col-span-3 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Flexível">Flexível</SelectItem>
                        <SelectItem value="Semi-Flexível">Semi-Flexível</SelectItem>
                        <SelectItem value="Rígido">Rígido</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-2">
                <Label className="text-right text-xs">Elevação</Label>
                <Select value={config.elevacao} onValueChange={(v) => updateFoot(side, 'elevacao', v)}>
                    <SelectTrigger className="col-span-3 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-48">
                        {Array.from({ length: 21 }, (_, i) => (i / 10).toFixed(1)).map(val => (
                            <SelectItem key={val} value={`${val} cm`}>{val} cm</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-2">
                <Label className="text-right text-xs">Borda</Label>
                <Select value={config.borda} onValueChange={(v) => updateFoot(side, 'borda', v)}>
                    <SelectTrigger className="col-span-3 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Sem Borda">Sem Borda</SelectItem>
                        <SelectItem value="Borda Simples">Borda Simples</SelectItem>
                        <SelectItem value="Borda Prolongada">Borda Prolongada</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-2">
                <Label className="text-right text-xs">Absorção</Label>
                <Select value={config.absorcao} onValueChange={(v) => updateFoot(side, 'absorcao', v)}>
                    <SelectTrigger className="col-span-3 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Sem absorção">Sem absorção</SelectItem>
                        <SelectItem value="Com Absorção">Com Absorção</SelectItem>
                        <SelectItem value="Absorção Inteira">Absorção Inteira</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="border-t pt-2">
                <Label className="text-xs font-semibold mb-2 block">PADS / Alívios</Label>
                <div className="space-y-1.5">
                    {Object.entries(config.pads).map(([key, val]) => (
                        <div key={key} className="flex items-center space-x-2">
                            <Checkbox
                                id={`${side}-${key}`}
                                checked={val}
                                onCheckedChange={(c) => updatePad(side, key, c as boolean)}
                            />
                            <Label htmlFor={`${side}-${key}`} className="text-xs font-normal cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                {key}
                            </Label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    disabled={isLoading || disabled}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                >
                    <Send className="w-4 h-4 mr-2" />
                    Enviar para Produção
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Configuração do Pedido Propulsão</DialogTitle>
                    <DialogDescription>
                        Personalize os detalhes técnicos para fabricação.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Top Bar: General Options */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border">
                        <div>
                            <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Produto</Label>
                            <Select value={produto} onValueChange={setProduto}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Biomecanica">Biomecânica</SelectItem>
                                    <SelectItem value="Slim">Palmilha Slim</SelectItem>
                                    <SelectItem value="Chinelo">Chinelo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Cobertura</Label>
                            <Select value={cobertura} onValueChange={setCobertura}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EVA Azul">EVA Azul</SelectItem>
                                    <SelectItem value="Tecido Preto">Tecido Preto</SelectItem>
                                    <SelectItem value="Tecido Azul">Tecido Azul</SelectItem>
                                    <SelectItem value="Plastazote">Plastazote</SelectItem>
                                    <SelectItem value="Nobuk">Nobuk</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Columns for Feet */}
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <h3 className="font-bold text-lg mb-4 text-blue-700 flex items-center">
                                🦶 Pé Esquerdo
                            </h3>
                            <FootForm side="left" config={leftFoot} />
                        </div>
                        <div className="border-l pl-8">
                            <h3 className="font-bold text-lg mb-4 text-blue-700 flex items-center">
                                🦶 Pé Direito
                            </h3>
                            <FootForm side="right" config={rightFoot} />
                        </div>
                    </div>

                    {/* Price Display */}
                    <div className="bg-slate-900 text-white p-4 rounded-lg flex justify-between items-center shadow-md">
                        <div className="flex flex-col">
                            <span className="text-sm text-slate-400">Valor Base: R$ 190,00</span>
                            {calculatePrice > 0 && (
                                <span className="text-sm text-slate-400">Adicionais: + R$ {calculatePrice.toFixed(2)}</span>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                                <Calculator className="w-5 h-5 text-green-400" />
                                <span className="font-medium text-lg">Valor Final:</span>
                            </div>
                        </div>
                        <span className="text-3xl font-bold text-green-400">
                            R$ {(190 + calculatePrice).toFixed(2)}
                        </span>
                    </div>

                    {/* Warning if data seems incomplete */}
                    {(!data.shoeSize || data.shoeSize === 0) && (
                        <div className="rounded-md bg-amber-50 p-3 text-amber-800 text-sm flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>Atenção: A numeração do calçado não foi preenchida na avaliação.</span>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                        Cancelar
                    </Button>
                    <Button type="submit" onClick={handleSend} disabled={isLoading} className="bg-green-600 hover:bg-green-700 text-white">
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Enviando...
                            </>
                        ) : (
                            'Confirmar Envio'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
