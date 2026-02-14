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
import { getPatients } from "@/actions/patients"
import { useGlobalLoader } from "@/components/providers/global-loader-provider"
import { QuantumLoader } from "@/components/ui/quantum-loader"

interface DuplicatePair {
    patientA: any;
    patientB: any;
    matches: string[];
    score: number;
}

export function DuplicateFinderModal({ slug }: { slug: string }) {
    const [open, setOpen] = useState(false)
    const [scanning, setScanning] = useState(false)
    const [duplicates, setDuplicates] = useState<DuplicatePair[]>([])
    const { showLoading } = useGlobalLoader()

    const findDuplicates = async () => {
        setScanning(true)
        setDuplicates([])

        try {
            // Fetch ALL patients for deep scan (limit: 500 for safety, can be adjusted)
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

            // Comparison loop
            for (let i = 0; i < allPatients.length; i++) {
                for (let j = i + 1; j < allPatients.length; j++) {
                    const pA = allPatients[i]
                    const pB = allPatients[j]
                    const matches: string[] = []
                    let score = 0

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

                    // 3. Name Similarity (Basic)
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
                    const addrA = `${pA.address_zip}|${pA.address}|${pA.address_number}|${pA.address_complement}`.toLowerCase()
                    const addrB = `${pB.address_zip}|${pB.address}|${pB.address_number}|${pB.address_complement}`.toLowerCase()

                    if (pA.address_zip && pA.address_number && addrA === addrB) {
                        matches.push("Endereço Idêntico")
                        score += 25
                    }

                    if (score >= 25) {
                        found.push({ patientA: pA, patientB: pB, matches, score })
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
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
                <DialogHeader className="p-8 bg-slate-900 text-white">
                    <DialogTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                        <AlertTriangle className="h-6 w-6 text-orange-400" />
                        Detector de Duplicatas
                    </DialogTitle>
                    <DialogDescription className="text-slate-400 font-medium">
                        Varredura inteligente baseada em Nome, CPF, Telefone e Endereço.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden relative min-h-[400px]">
                    {scanning ? (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
                            <QuantumLoader />
                            <p className="text-sm font-black text-slate-900 uppercase tracking-widest animate-pulse">
                                Analisando Base de Dados...
                            </p>
                        </div>
                    ) : (
                        <ScrollArea className="h-full p-6">
                            {duplicates.length === 0 ? (
                                <div className="text-center py-20 flex flex-col items-center gap-4">
                                    <div className="p-4 bg-emerald-50 rounded-full">
                                        <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                                    </div>
                                    <p className="font-bold text-slate-600">Nenhum conflito encontrado na sua base.</p>
                                </div>
                            ) : (
                                <div className="space-y-4 pb-10">
                                    <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-center gap-4 mb-6">
                                        <div className="p-2 bg-orange-200 rounded-lg">
                                            <AlertTriangle className="h-5 w-5 text-orange-700" />
                                        </div>
                                        <p className="text-sm text-orange-800 font-medium">
                                            Encontramos <b>${duplicates.length} conflitos</b> em potencial. Analise cada caso para unificar as fichas ou marcar parentesco.
                                        </p>
                                    </div>

                                    {duplicates.map((pair, idx) => (
                                        <div key={idx} className="bg-white border rounded-[1.5rem] p-5 shadow-sm hover:shadow-md transition-all">
                                            <div className="flex items-center gap-2 mb-4">
                                                {pair.matches.map(m => (
                                                    <span key={m} className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                                                        {m}
                                                    </span>
                                                ))}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative items-center">
                                                {/* Patient A */}
                                                <div className="space-y-2">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paciente A</p>
                                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                        <p className="font-bold text-slate-900">{pair.patientA.name}</p>
                                                        <div className="text-xs text-slate-500 mt-1 space-y-1">
                                                            <p className="flex items-center gap-2"><CreditCard className="h-3 w-3" /> {pair.patientA.cpf || 'N/A'}</p>
                                                            <p className="flex items-center gap-2"><Phone className="h-3 w-3" /> {pair.patientA.phone || 'N/A'}</p>
                                                            <p className="flex items-center gap-2 truncate"><Home className="h-3 w-3 shrink-0" /> {pair.patientA.address || 'Sem endereço'}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex h-12 w-12 bg-white border-4 border-slate-50 rounded-full items-center justify-center z-10">
                                                    <Link2 className="h-5 w-5 text-slate-300" />
                                                </div>

                                                {/* Patient B */}
                                                <div className="space-y-2">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paciente B</p>
                                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                        <p className="font-bold text-slate-900">{pair.patientB.name}</p>
                                                        <div className="text-xs text-slate-500 mt-1 space-y-1">
                                                            <p className="flex items-center gap-2"><CreditCard className="h-3 w-3" /> {pair.patientB.cpf || 'N/A'}</p>
                                                            <p className="flex items-center gap-2"><Phone className="h-3 w-3" /> {pair.patientB.phone || 'N/A'}</p>
                                                            <p className="flex items-center gap-2 truncate"><Home className="h-3 w-3 shrink-0" /> {pair.patientB.address || 'Sem endereço'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-6 flex flex-wrap gap-2 justify-end">
                                                <Button size="sm" variant="ghost" className="rounded-xl text-xs font-bold text-slate-500 hover:text-red-600">
                                                    Ignorar
                                                </Button>
                                                <Button size="sm" variant="outline" className="rounded-xl text-xs font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                                                    Marcar Parentesco
                                                </Button>
                                                <Button size="sm" className="rounded-xl text-xs font-black uppercase tracking-widest bg-slate-900">
                                                    Unificar Fichas
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
