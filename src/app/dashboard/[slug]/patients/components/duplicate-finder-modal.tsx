"use client"

import { useState, useCallback } from "react"
import { Search, User, Trash2, Link2, CheckCircle2, AlertTriangle, Home, Phone, CreditCard, Loader2, XIcon } from "lucide-react"
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
import { useSidebar } from "@/hooks/use-sidebar"
import { cn } from "@/lib/utils"
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
    const { isCollapsed } = useSidebar()

    const sidebarWidth = isCollapsed ? 60 : 250

    const findDuplicates = async () => {
        setScanning(true)
        setDuplicates([])

        try {
            const { data: allPatients } = await getPatients({ limit: 4000, slug })
            console.log(`[DuplicateFinder] Analisando ${allPatients?.length} pacientes de ${slug}...`)

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

                    // Normalização para comparação
                    const nameA = (pA.name || "").toLowerCase().trim()
                    const nameB = (pB.name || "").toLowerCase().trim()

                    // Evitar comparar o paciente com ele mesmo (idêntico)
                    if (pA.id === pB.id) continue;

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
                    if (nameA === nameB && nameA.length > 0) {
                        matches.push("Nome Idêntico")
                        score += 40
                    } else if (nameA.length > 3 && nameB.length > 3 && (nameA.includes(nameB) || nameB.includes(nameA))) {
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
                toast.success("Nenhuma duplicata encontrada na varredura.")
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
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#0f172a'
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
                <Button size="sm" variant="outline" className="h-10 md:h-8 gap-2 w-full md:w-auto border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800 transition-all active:scale-95 shadow-sm">
                    <Search className="h-3.5 w-3.5" />
                    <span className="whitespace-nowrap font-bold">Buscar Duplicatas</span>
                </Button>
            </DialogTrigger>
            <DialogContent
                className={cn(
                    "w-full h-[90vh] flex flex-col p-0 overflow-hidden rounded-[3rem] border-none shadow-2xl bg-white transition-all duration-300 ease-in-out sm:!max-w-none",
                    isCollapsed
                        ? "sm:!w-[calc(100vw-120px)] left-[calc(30px+50%)]"
                        : "sm:!w-[calc(100vw-300px)] left-[calc(125px+50%)]"
                )}
                showCloseButton={false}
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
            >
                {/* Custom Header with Gradient and better branding */}
                <div className="p-10 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 bg-orange-100 rounded-xl">
                                <AlertTriangle className="h-6 w-6 text-orange-600" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
                                Detector de Duplicatas
                            </h2>
                        </div>
                        <p className="text-slate-500 font-medium ml-12">
                            Análise inteligente de consistência: Nome, CPF, Telefone e Endereço.
                        </p>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setOpen(false)}
                        className="rounded-full h-12 w-12 hover:bg-slate-200 text-slate-400 hover:text-indigo-600 transition-all self-start"
                    >
                        <XIcon className="h-8 w-8" />
                    </Button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col relative">
                    {(scanning || isProcessing) ? (
                        <div className="absolute inset-0 bg-white/90 backdrop-blur-md z-50 flex flex-col items-center justify-center gap-6">
                            <QuantumLoader
                                size="80"
                                color="#4f46e5"
                                messages={scanning ? [
                                    "Sincronizando base de dados...",
                                    "Analisando CPFs e telefones...",
                                    "Cruzando informações de endereço...",
                                    "Calculando similaridade de nomes...",
                                    "Filtrando resultados relevantes...",
                                    "Gerando relatório de duplicatas..."
                                ] : [
                                    "Unificando registros...",
                                    "Transferindo agendamentos...",
                                    "Migrando evoluções...",
                                    "Atualizando vínculos financeiros...",
                                    "Limpando registros duplicados...",
                                    "Finalizando unificação..."
                                ]}
                            />
                        </div>
                    ) : (
                        <ScrollArea className="flex-1 w-full h-full">
                            <div className="p-10 max-w-[1400px] mx-auto min-h-full">
                                {duplicates.length === 0 ? (
                                    <div className="text-center py-32 flex flex-col items-center gap-6">
                                        <div className="p-6 bg-emerald-50 rounded-full shadow-inner">
                                            <CheckCircle2 className="h-16 w-16 text-emerald-500" />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-2xl font-bold text-slate-800">Sua base está limpa!</p>
                                            <p className="text-slate-500 max-w-md mx-auto">Nenhum potencial conflito de duplicidade foi detectado nesta varredura.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-8 pb-12">
                                        <div className="bg-indigo-600 shadow-lg shadow-indigo-100 p-8 rounded-[2.5rem] flex items-center gap-6 mb-10 text-white relative overflow-hidden group">
                                            <div className="absolute right-0 top-0 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                                <Search className="h-40 w-40 -mr-10 -mt-10" />
                                            </div>
                                            <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl shrink-0">
                                                <AlertTriangle className="h-8 w-8 text-white" />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-xl font-black uppercase tracking-widest">Atenção Necessária</h3>
                                                <p className="text-indigo-100 font-medium">
                                                    Identificamos <b>{duplicates.length} casos</b> com altas chances de duplicidade. Revise cada par para otimizar sua gestão.
                                                </p>
                                            </div>
                                        </div>

                                        {duplicates.map((pair, idx) => (
                                            <div key={idx} className="bg-white border-2 border-slate-100 rounded-[3rem] p-10 shadow-sm hover:border-indigo-200 hover:shadow-2xl transition-all group relative overflow-hidden">
                                                {/* Matches Badges Container */}
                                                <div className="flex items-center gap-3 mb-8">
                                                    {pair.matches.map(m => (
                                                        <span key={m} className="text-[11px] font-black uppercase tracking-widest px-5 py-2 bg-slate-50 text-slate-900 rounded-full border border-slate-200 shadow-sm">
                                                            {m}
                                                        </span>
                                                    ))}
                                                    {pair.isAddressMatch && (
                                                        <span className="text-[11px] font-black uppercase tracking-widest px-5 py-2 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 flex items-center gap-2">
                                                            <User className="h-3.5 w-3.5" /> Núcleo Familiar
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 relative items-stretch">
                                                    {/* Patient A */}
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between px-2">
                                                            <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                                <div className="h-2 w-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> Candidato a Principal
                                                            </p>
                                                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg font-bold">ID: {pair.patientA.id.slice(0, 8)}</span>
                                                        </div>
                                                        <div className="p-8 bg-slate-50/50 rounded-[2rem] border-2 border-slate-50 h-full group-hover:bg-white group-hover:border-emerald-100 transition-all">
                                                            <h4 className="text-2xl font-black text-slate-900 mb-6 leading-tight">{pair.patientA.name}</h4>
                                                            <div className="text-[15px] text-slate-600 space-y-4">
                                                                <div className="flex items-center gap-4 p-3 bg-white rounded-2xl shadow-sm border border-slate-50">
                                                                    <div className="p-2 bg-slate-50 rounded-lg"><CreditCard className="h-4 w-4 text-slate-400" /></div>
                                                                    <span className="font-semibold">{pair.patientA.cpf || 'Documento não informado'}</span>
                                                                </div>
                                                                <div className="flex items-center gap-4 p-3 bg-white rounded-2xl shadow-sm border border-slate-50">
                                                                    <div className="p-2 bg-slate-50 rounded-lg"><Phone className="h-4 w-4 text-slate-400" /></div>
                                                                    <span className="font-semibold">{pair.patientA.phone || 'Contato não informado'}</span>
                                                                </div>
                                                                <div className="flex items-start gap-4 p-3 bg-white rounded-2xl shadow-sm border border-slate-50">
                                                                    <div className="p-2 bg-slate-50 rounded-lg shrink-0 mt-0.5"><Home className="h-4 w-4 text-slate-400" /></div>
                                                                    <span className="font-medium leading-relaxed italic text-sm">
                                                                        {typeof pair.patientA.address === 'object'
                                                                            ? (pair.patientA.address.full_text || pair.patientA.address.street || 'Endereço registrado porém incompleto')
                                                                            : (pair.patientA.address || 'Nenhum endereço vinculado')}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden lg:flex h-16 w-16 bg-white border shadow-xl rounded-full items-center justify-center z-10 transition-all group-hover:scale-110 group-hover:rotate-12 group-hover:border-indigo-400">
                                                        <Link2 className="h-8 w-8 text-slate-300 group-hover:text-indigo-400" />
                                                    </div>

                                                    {/* Patient B */}
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between px-2">
                                                            <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                                <div className="h-2 w-2 bg-red-400 rounded-full shadow-[0_0_8px_rgba(248,113,113,0.5)]" /> Possível Duplicidade
                                                            </p>
                                                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg font-bold">ID: {pair.patientB.id.slice(0, 8)}</span>
                                                        </div>
                                                        <div className="p-8 bg-slate-50/50 rounded-[2rem] border-2 border-slate-50 h-full group-hover:bg-white group-hover:border-red-100 transition-all">
                                                            <h4 className="text-2xl font-black text-slate-900 mb-6 leading-tight">{pair.patientB.name}</h4>
                                                            <div className="text-[15px] text-slate-600 space-y-4">
                                                                <div className="flex items-center gap-4 p-3 bg-white rounded-2xl shadow-sm border border-slate-50">
                                                                    <div className="p-2 bg-slate-50 rounded-lg"><CreditCard className="h-4 w-4 text-slate-400" /></div>
                                                                    <span className="font-semibold">{pair.patientB.cpf || 'Documento não informado'}</span>
                                                                </div>
                                                                <div className="flex items-center gap-4 p-3 bg-white rounded-2xl shadow-sm border border-slate-50">
                                                                    <div className="p-2 bg-slate-50 rounded-lg"><Phone className="h-4 w-4 text-slate-400" /></div>
                                                                    <span className="font-semibold">{pair.patientB.phone || 'Contato não informado'}</span>
                                                                </div>
                                                                <div className="flex items-start gap-4 p-3 bg-white rounded-2xl shadow-sm border border-slate-50">
                                                                    <div className="p-2 bg-slate-50 rounded-lg shrink-0 mt-0.5"><Home className="h-4 w-4 text-slate-400" /></div>
                                                                    <span className="font-medium leading-relaxed italic text-sm">
                                                                        {typeof pair.patientB.address === 'object'
                                                                            ? (pair.patientB.address.full_text || pair.patientB.address.street || 'Endereço registrado porém incompleto')
                                                                            : (pair.patientB.address || 'Nenhum endereço vinculado')}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-12 flex flex-wrap gap-4 justify-end items-center border-t border-slate-50 pt-8">
                                                    <Button size="sm" variant="ghost" className="rounded-2xl text-xs font-bold text-slate-400 hover:text-slate-600 px-8 h-12">
                                                        Ignorar este caso
                                                    </Button>
                                                    {pair.isAddressMatch && (
                                                        <Button
                                                            onClick={() => handleKinship(pair)}
                                                            size="lg"
                                                            variant="outline"
                                                            className="rounded-2xl text-sm font-black uppercase tracking-widest border-2 border-indigo-100 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 px-10 h-14"
                                                        >
                                                            Marcar Parentesco
                                                        </Button>
                                                    )}
                                                    <Button
                                                        onClick={() => handleMerge(pair)}
                                                        size="lg"
                                                        className="rounded-2xl text-sm font-black uppercase tracking-widest bg-slate-900 hover:bg-black text-white px-10 h-14 shadow-2xl transition-all active:scale-95"
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
