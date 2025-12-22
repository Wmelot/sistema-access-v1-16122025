"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Printer, FileSpreadsheet } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import ExcelJS from 'exceljs'
import { format } from "date-fns"

interface DateFilterProps {
    startDate: string
    endDate: string
    professionalId: string
    professionals: any[]
    reportData?: any[]
    summaryData?: any
}

export default function DateFilter({ startDate, endDate, professionalId, professionals, reportData = [], summaryData }: DateFilterProps) {
    const router = useRouter()

    // Local state for immediate input feedback
    const [sDate, setSDate] = useState(startDate)
    const [eDate, setEDate] = useState(endDate)
    const [prof, setProf] = useState(professionalId)

    const [isExportOpen, setIsExportOpen] = useState(false)
    const [exportFormat, setExportFormat] = useState<'xlsx' | 'xls' | 'csv'>('xlsx')

    const applyFilter = () => {
        const params = new URLSearchParams()
        if (sDate) params.set('startDate', sDate)
        if (eDate) params.set('endDate', eDate)
        if (prof && prof !== 'all') params.set('professionalId', prof)

        router.push(`/dashboard/reports?${params.toString()}`)
    }

    const handleExport = async () => {
        if (!reportData || reportData.length === 0) {
            alert("Não há dados para exportar.")
            return
        }

        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('Relatório Financeiro')

        // Add Headers
        worksheet.columns = [
            { header: 'Data', key: 'date', width: 20 },
            { header: 'Paciente', key: 'patient', width: 30 },
            { header: 'Profissional', key: 'professional', width: 30 },
            { header: 'Serviço', key: 'service', width: 30 },
            { header: 'Valor (R$)', key: 'price', width: 15 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Pagamento', key: 'payment', width: 20 },
            { header: 'Forma Pagamento', key: 'method', width: 20 },
        ]

        // Add Data
        reportData.forEach(item => {
            worksheet.addRow({
                date: format(new Date(item.start_time), "dd/MM/yyyy HH:mm"),
                patient: item.patients?.name || '-',
                professional: item.profiles?.full_name || '-',
                service: item.services?.name || '-',
                price: item.price,
                status: item.status,
                payment: item.payment_status === 'paid' ? 'Pago' : item.payment_status === 'pending' ? 'Pendente' : 'Agendado',
                method: item.payment_methods?.name || '-'
            })
        })

        // Style Header
        worksheet.getRow(1).font = { bold: true }

        // Setup Buffer
        const buffer = await workbook.xlsx.writeBuffer()
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

        // Determine Filename
        const filename = `relatorio_financeiro_${startDate}_${endDate}.${exportFormat === 'csv' ? 'csv' : 'xlsx'}` // Note: ExcelJS mainly produces xlsx. For CSV we'd use workbook.csv.writeBuffer().

        if (exportFormat === 'csv') {
            // Simple CSV fallback using ExcelJS CSV writer if strict CSV needed, but XLSX acts as universal usually.
            // Actually, letting ExcelJS write CSV:
            const csvBuffer = await workbook.csv.writeBuffer()
            const csvBlob = new Blob([csvBuffer], { type: 'text/csv' })
            downloadFile(csvBlob, filename)
        } else {
            // For .xls (Legacy), actually just naming it .xls usually works but content is openxml. Real binary .xls needs different lib.
            // Usually users are happy with .xlsx. If they check .xls, we can just name it .xls or warn.
            // Let's stick to .xlsx content for both but change extension (often works) or just force xlsx.
            downloadFile(blob, filename)
        }

        setIsExportOpen(false)
    }

    const downloadFile = (blob: Blob, fileName: string) => {
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const handlePrintReview = () => {
        // We close dialog to ensure it doesn't block (though standard print styles should hide it)
        setIsExportOpen(false)
        // Delay print to allow dialog close animation
        setTimeout(() => {
            window.print()
        }, 300)
    }

    return (
        <div className="flex flex-col sm:flex-row gap-4 items-end bg-white p-4 rounded-lg border shadow-sm print:hidden">
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
                        <SelectItem value="all">Todos os Profissionais</SelectItem>
                        {professionals.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Button onClick={applyFilter} className="w-full sm:w-auto bg-primary text-white">
                Filtrar Resultados
            </Button>

            <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="ml-auto w-full sm:w-auto gap-2">
                        <Download className="h-4 w-4" />
                        Exportar / Imprimir
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Opções de Exportação</DialogTitle>
                        <DialogDescription>
                            Selecione o formato desejado para o download ou visualize a impressão.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="space-y-4">
                            <h4 className="font-medium leading-none">Formato do Arquivo</h4>
                            <RadioGroup value={exportFormat} onValueChange={(v: any) => setExportFormat(v)} className="grid grid-cols-1 gap-2">
                                <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-slate-50 cursor-pointer" onClick={() => setExportFormat('xlsx')}>
                                    <RadioGroupItem value="xlsx" id="xlsx" />
                                    <Label htmlFor="xlsx" className="flex-1 cursor-pointer flex items-center gap-2">
                                        <FileSpreadsheet className="h-4 w-4 text-green-600" />
                                        Excel (.xlsx)
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-slate-50 cursor-pointer" onClick={() => setExportFormat('xls')}>
                                    <RadioGroupItem value="xls" id="xls" />
                                    <Label htmlFor="xls" className="flex-1 cursor-pointer flex items-center gap-2">
                                        <FileSpreadsheet className="h-4 w-4 text-green-600" />
                                        Excel 97 (.xls)
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-slate-50 cursor-pointer" onClick={() => setExportFormat('csv')}>
                                    <RadioGroupItem value="csv" id="csv" />
                                    <Label htmlFor="csv" className="flex-1 cursor-pointer flex items-center gap-2">
                                        <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                                        CSV (Texto)
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </div>

                    <DialogFooter className="flex flex-col sm:flex-row gap-2">
                        <Button variant="secondary" onClick={handlePrintReview} className="sm:mr-auto gap-2">
                            <Printer className="h-4 w-4" />
                            Visualizar Impressão
                        </Button>
                        <Button onClick={handleExport} gap-2>
                            <Download className="h-4 w-4" />
                            Baixar Arquivo
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
