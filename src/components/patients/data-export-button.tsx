"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { exportPatientData } from "@/app/dashboard/patients/actions"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface DataExportButtonProps {
    patientId: string
    patientName: string
}

export function DataExportButton({ patientId, patientName }: DataExportButtonProps) {
    const [loading, setLoading] = useState(false)

    const handleExport = async () => {
        setLoading(true)
        try {
            const res = await exportPatientData(patientId)

            if (res.error) {
                toast.error(res.error)
                return
            }

            // Trigger Download
            const jsonString = JSON.stringify(res.data, null, 2)
            const blob = new Blob([jsonString], { type: "application/json" })
            const url = URL.createObjectURL(blob)

            const a = document.createElement("a")
            a.href = url
            a.download = `dados_${patientName.replace(/\s+/g, '_').toLowerCase()}_lgpd.json`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

            toast.success("Dados exportados com sucesso!")

        } catch (e) {
            console.error(e)
            toast.error("Erro ao exportar dados")
        } finally {
            setLoading(false)
        }
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleExport}
                        disabled={loading}
                        className="text-gray-500 hover:text-primary"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Exportar Dados (LGPD/Portabilidade)</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
