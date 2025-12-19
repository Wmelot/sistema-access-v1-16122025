"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download } from "lucide-react"

interface DateFilterProps {
    startDate: string
    endDate: string
    professionalId: string
    professionals: any[]
}

export default function DateFilter({ startDate, endDate, professionalId, professionals }: DateFilterProps) {
    const router = useRouter()

    // Local state for immediate input feedback
    const [sDate, setSDate] = useState(startDate)
    const [eDate, setEDate] = useState(endDate)
    const [prof, setProf] = useState(professionalId)

    const applyFilter = () => {
        const params = new URLSearchParams()
        if (sDate) params.set('startDate', sDate)
        if (eDate) params.set('endDate', eDate)
        if (prof && prof !== 'all') params.set('professionalId', prof)

        router.push(`/dashboard/reports?${params.toString()}`)
    }

    return (
        <div className="flex flex-col sm:flex-row gap-4 items-end bg-white p-4 rounded-lg border shadow-sm">
            <div className="grid gap-1.5 w-full sm:w-auto">
                <Label>Data Início</Label>
                <Input type="date" value={sDate} onChange={e => setSDate(e.target.value)} className="w-full sm:w-[150px]" />
            </div>

            <div className="grid gap-1.5 w-full sm:w-auto">
                <Label>Data Fim</Label>
                <Input type="date" value={eDate} onChange={e => setEDate(e.target.value)} className="w-full sm:w-[150px]" />
            </div>

            <div className="grid gap-1.5 w-full sm:w-[200px]">
                <Label>Profissional</Label>
                <Select value={prof} onValueChange={setProf}>
                    <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {professionals.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Button onClick={applyFilter} className="w-full sm:w-auto bg-primary text-white">
                Filtrar Resultados
            </Button>

            <Button variant="outline" className="ml-auto w-full sm:w-auto gap-2" onClick={() => window.print()}>
                <Download className="h-4 w-4" />
                Exportar / Imprimir
            </Button>
        </div>
    )
}
