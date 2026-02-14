"use client"

import { useState, useCallback } from "react"
import { Search, User, Trash2, Link2, CheckCircle2, AlertTriangle, Home, Phone, CreditCard, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getPatients, mergePatients, markKinship } from "@/actions/patients"
import { useGlobalLoader } from "@/components/providers/global-loader-provider"
import { QuantumLoader } from "@/components/ui/quantum-loader"
import Swal from 'sweetalert2'

interface DuplicatePair {
    patientA: any;
    patientB: any;
    matches: string[];
    score: number;
    isAddressMatch: boolean;
}

export function DuplicateFinderModal({ slug }: { slug: string }) {
    const [open, setOpen] = useState(false)
    const [scanning, setScanning] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [duplicates, setDuplicates] = useState<DuplicatePair[]>([])

    const findDuplicates = async () => {
        setScanning(true)
        setDuplicates([])

        try {
            const { data: allPatients } = await getPatients({
                limit: 1000,
                slug
            })

            if (!allPatients || allPatients.length < 2) {
                toast.info("Poucos pacientes para realizar uma busca de duplicatas.")
                setScanning(false)
                return
            }

            const found: DuplicatePair[] = []

            for (let i = 0; i < allPatients.length; i++) {
                for (let j = i + 1; j < allPatients.length; j++) {
                    const pA = allPatients[i]
                    const pB = allPatients[j]
                    const matches: string[] = []
                    let score = 0
                    let isAddressMatch = false

                    // 1. Exact CPF Match
                    if (pA.cpf && pB.cpf && pA.cpf.replace(/\D/g, '') === pB.cpf.replace(/\D/g, '')) {
                        matches.push("CPF")
                        score += 50
                    }

                    // 2. Exact Phone Match
                    const telA = pA.phone?.replace(/\D/g, '')
                    const telB = pB.phone?.replace(/\D/g, '')
                    if (telA && telB && telA === telB) {
                        matches.push("Telefone")
                        score += 30
                    }

                    // 3. Name Similarity
                    const nameA = pA.name.toLowerCase().trim()
                    const nameB = pB.name.toLowerCase().trim()
                    if (nameA === nameB) {
                        matches.push("Nome Idêntico")
                        score += 40
                    } else if (nameA.includes(nameB) || nameB.includes(nameA)) {
                        matches.push("Nome Similar")
                        score += 20
                    }

                    // 4. Exact Address Match
                    const getAddrPart = (p: any, key: string) => {
                        if (typeof p.address === 'object' && p.address) return p.address[key] || p[`address_${key}`]
                        return p[`address_${key}`]
                    }

                    const zipA = getAddrPart(pA, 'zip_code') || pA.address_zip
                    const zipB = getAddrPart(pB, 'zip_code') || pB.address_zip
                    const numA = getAddrPart(pA, 'number') || pA.address_number
                    const numB = getAddrPart(pB, 'number') || pB.address_number
                    const compA = (getAddrPart(pA, 'complement') || pA.address_complement || "").toLowerCase().trim()
                    const compB = (getAddrPart(pB, 'complement') || pB.address_complement || "").toLowerCase().trim()

                    if (zipA && zipB && zipA === zipB && numA === numB && compA === compB) {
                        matches.push("Endereço Idêntico")
                        score += 25
                        isAddressMatch = true
                    }

                    if (score >= 25) {
                        found.push({ patientA: pA, patientB: pB, matches, score, isAddressMatch })
                    }
                }
            }

            setDuplicates(found.sort((a, b) => b.score - a.score))
            if (found.length === 0) {
                toast.success("Nenhuma duplicata encontrada!")
            }
        } catch (error) {
            console.error(error)
            toast.error("Erro ao realizar varredura.")
        } finally {
            setScanning(false)
        }
    }

    const handleMerge = async (pair: DuplicatePair) => {
        const result = await Swal.fire({
            title: 'Unificar Fichas?',
            html: `O paciente <b>${pair.patientB.name}</b> será removido e todos os seus agendamentos e evoluções serão transferidos para <b>${pair.patientA.name}</b>.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sim, Unificar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#0f172a'
        })

        if (result.isConfirmed) {
            setIsProcessing(true)
            const res = await mergePatients(pair.patientA.id, pair.patientB.id)
            setIsProcessing(false)
            if (res.success) {
                toast.success("Pacientes unificados com sucesso!")
                findDuplicates() // Refresh
            } else {
                toast.error(res.error)
            }
        }
    }

    const handleKinship = async (pair: DuplicatePair) => {
        const { value: degree } = await Swal.fire({
            title: 'Marcar Parentesco',
            input: 'select',
            inputOptions: {
                'Pai/Mãe': 'Pai/Mãe',
                'Filho(a)': 'Filho(a)',
                'Cônjuge': 'Cônjuge',
                'Irmão/Irmã': 'Irmão/Irmã',
                'Outro': 'Outro'
            },
            inputPlaceholder: 'Selecione o grau de parentesco',
            showCancelButton: true,
            confirmButtonText: 'Confirmar',
            confirmButtonColor: '#4f46e5'
        })

        if (degree) {
            setIsProcessing(true)
            const res = await markKinship(pair.patientA.id, pair.patientB.id, degree)
            setIsProcessing(false)
            if (res.success) {
                toast.success("Parentesco marcado com sucesso!")
                findDuplicates()
            } else {
                toast.error(res.error)
            }
        }
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val)
            if (val) findDuplicates()
        }}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-10 md:h-8 gap-2 w-full md:w-auto border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800">
                    <Search className="h-3.5 w-3.5" />
                    <span className="whitespace-nowrap font-bold">Buscar Duplicatas</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] w-full h-[90vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
                <DialogHeader className="p-8 bg-slate-900 text-white shrink-0">
                    <DialogTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                        <AlertTriangle className="h-6 w-6 text-orange-400" />
                        Detector de Duplicatas
                    </DialogTitle>
                    <DialogDescription className="text-slate-400 font-medium">
                        Varredura inteligente baseada em Nome, CPF, Telefone e Endereço.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden relative">
                    {(scanning || isProcessing) ? (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
                            <QuantumLoader />
                            <p className="text-sm font-black text-slate-900 uppercase tracking-widest animate-pulse">
                                {scanning ? "Analisando Base de Dados..." : "Processando..."}
                            </p>
                        </div>
                    ) : (
                        <ScrollArea className="h-full">
                            <div className="p-8">
                                {duplicates.length === 0 ? (
                                    <div className="text-center py-20 flex flex-col items-center gap-4">
                                        <div className="p-4 bg-emerald-50 rounded-full">
                                            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                                        </div>
                                        <p className="font-bold text-slate-600">Nenhum conflito encontrado na sua base.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6 pb-10">
                                        <div className="bg-orange-50 border border-orange-100 p-6 rounded-3xl flex items-center gap-4 mb-6">
                                            <div className="p-3 bg-orange-200 rounded-2xl">
                                                <AlertTriangle className="h-6 w-6 text-orange-700" />
                                            </div>
                                            <p className="text-sm text-orange-800 font-medium leading-relaxed">
                                                Encontramos <b>{duplicates.length} conflitos</b> em potencial. Analise cada caso para unificar as fichas ou marcar parentesco.
                                            </p>
                                        </div>

                                        {duplicates.map((pair, idx) => (
                                            <div key={idx} className="bg-white border-2 border-slate-100 rounded-[2rem] p-8 shadow-sm hover:border-indigo-100 hover:shadow-xl transition-all group">
                                                <div className="flex items-center gap-3 mb-6">
                                                    {pair.matches.map(m => (
                                                        <span key={m} className="text-[10px] font-black uppercase tracking-widest px-4 py-1.5 bg-slate-900 text-white rounded-full">
                                                            {m}
                                                        </span>
                                                    ))}
                                                    {pair.isAddressMatch && (
                                                        <span className="text-[10px] font-black uppercase tracking-widest px-4 py-1.5 bg-indigo-600 text-white rounded-full flex items-center gap-2">
                                                            <Home className="h-3 w-3" /> Potencial Familiar
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative items-stretch">
                                                    {/* Patient A */}
                                                    <div className="space-y-3">
                                                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                            <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full" /> Paciente Principal
                                                        </p>
                                                        <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 h-full">
                                                            <h4 className="text-xl font-bold text-slate-900 underline decoration-indigo-200 underline-offset-4">{pair.patientA.name}</h4>
                                                            <div className="text-sm text-slate-600 mt-4 space-y-3">
                                                                <p className="flex items-center gap-3 font-medium"><CreditCard className="h-4 w-4 text-slate-400" /> {pair.patientA.cpf || 'Sem CPF'}</p>
                                                                <p className="flex items-center gap-3 font-medium"><Phone className="h-4 w-4 text-slate-400" /> {pair.patientA.phone || 'Sem Telefone'}</p>
                                                                <p className="flex items-start gap-3 italic leading-snug">
                                                                    <Home className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                                                                    {typeof pair.patientA.address === 'object'
                                                                        ? (pair.patientA.address.full_text || pair.patientA.address.street || 'Endereço incompleto')
                                                                        : (pair.patientA.address || 'Endereço não informado')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden lg:flex h-14 w-14 bg-white border-2 border-slate-100 rounded-full items-center justify-center z-10 shadow-lg group-hover:scale-110 transition-transform">
                                                        <Link2 className="h-6 w-6 text-slate-400 group-hover:text-indigo-500" />
                                                    </div>

                                                    {/* Patient B */}
                                                    <div className="space-y-3">
                                                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                            <div className="h-1.5 w-1.5 bg-red-500 rounded-full" /> Conflito Detectado
                                                        </p>
                                                        <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 h-full">
                                                            <h4 className="text-xl font-bold text-slate-900 underline decoration-red-200 underline-offset-4">{pair.patientB.name}</h4>
                                                            <div className="text-sm text-slate-600 mt-4 space-y-3">
                                                                <p className="flex items-center gap-3 font-medium"><CreditCard className="h-4 w-4 text-slate-400" /> {pair.patientB.cpf || 'Sem CPF'}</p>
                                                                <p className="flex items-center gap-3 font-medium"><Phone className="h-4 w-4 text-slate-400" /> {pair.patientB.phone || 'Sem Telefone'}</p>
                                                                <p className="flex items-start gap-3 italic leading-snug">
                                                                    <Home className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                                                                    {typeof pair.patientB.address === 'object'
                                                                        ? (pair.patientB.address.full_text || pair.patientB.address.street || 'Endereço incompleto')
                                                                        : (pair.patientB.address || 'Endereço não informado')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-8 flex flex-wrap gap-3 justify-end items-center border-t border-slate-50 pt-6">
                                                    <Button size="sm" variant="ghost" className="rounded-xl text-xs font-bold text-slate-400 hover:text-slate-600 px-6">
                                                        Ignorar este caso
                                                    </Button>
                                                    {pair.isAddressMatch && (
                                                        <Button
                                                            onClick={() => handleKinship(pair)}
                                                            size="lg"
                                                            variant="outline"
                                                            className="rounded-2xl text-xs font-black uppercase tracking-widest border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 px-8"
                                                        >
                                                            Marcar Parentesco
                                                        </Button>
                                                    )}
                                                    <Button
                                                        onClick={() => handleMerge(pair)}
                                                        size="lg"
                                                        className="rounded-2xl text-xs font-black uppercase tracking-widest bg-slate-900 hover:bg-slate-800 px-8 shadow-xl hover:shadow-slate-200"
                                                    >
                                                        Unificar Fichas
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
