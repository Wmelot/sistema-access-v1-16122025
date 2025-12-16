
'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { generateAccountingReport } from "./accounting-actions" // Verify path
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
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function AccountingExportButton() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [month, setMonth] = useState(String(new Date().getMonth() + 1))
    const [year, setYear] = useState(String(new Date().getFullYear()))

    const [missingPatients, setMissingPatients] = useState<any[]>([])

    const handleExport = async () => {
        setLoading(true)
        setMissingPatients([]) // Reset
        try {
            const res = await generateAccountingReport(Number(month), Number(year))

            if (res.missingData) {
                setMissingPatients(res.missingData)
                toast.warning("Dados incompletos encontrados.")
                return
            }

            if (res.error) {
                toast.error(res.error)
                return
            }

            // Trigger Download
            if (res.data) {
                const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' })
                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.setAttribute('download', res.filename || 'export.csv')
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                toast.success("Relatório gerado!")
                setOpen(false)
            }
        } catch (error) {
            toast.error("Erro ao gerar relatório")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Relatório Contábil
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Exportar Relatório para Contabilidade</DialogTitle>
                    <DialogDescription>
                        Gera um arquivo CSV com todos os atendimentos completados para emissão de notas fiscais.
                    </DialogDescription>
                </DialogHeader>

                {missingPatients.length > 0 ? (
                    <div className="bg-destructive/10 p-4 rounded-md space-y-3">
                        <div className="flex items-center gap-2 text-destructive font-semibold">
                            <span>⚠️ Dados Faltantes</span>
                        </div>
                        <p className="text-sm text-balance">
                            Para gerar o relatório, precisamos que os seguintes dados sejam preenchidos nos cadastros dos pacientes:
                        </p>
                        <div className="max-h-[200px] overflow-y-auto space-y-2 border rounded-md bg-white p-2">
                            {missingPatients.map((p) => (
                                <div key={p.patientId} className="flex flex-col sm:flex-row sm:items-center justify-between text-sm gap-2 border-b last:border-0 pb-2 mb-2 last:pb-0 last:mb-0">
                                    <div>
                                        <p className="font-medium">{p.patientName}</p>
                                        <p className="text-muted-foreground text-xs">
                                            Falta: {p.missing.join(", ")}
                                        </p>
                                    </div>
                                    <Button size="sm" variant="outline" asChild>
                                        <a href={`/dashboard/patients/${p.patientId}`} target="_blank" rel="noopener noreferrer">
                                            Editar Cadastro
                                        </a>
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Preencha os dados e tente gerar novamente.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Mês</Label>
                                <Select value={month} onValueChange={setMonth}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                            <SelectItem key={m} value={String(m)}>
                                                {new Date(0, m - 1).toLocaleString('pt-BR', { month: 'long' })}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Ano</Label>
                                <Select value={year} onValueChange={setYear}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="2024">2024</SelectItem>
                                        <SelectItem value="2025">2025</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    {missingPatients.length === 0 && (
                        <Button onClick={handleExport} disabled={loading}>
                            {loading ? "Gerando..." : "Baixar .CSV"}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
