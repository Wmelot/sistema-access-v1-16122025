"use client"

import { useEffect, useState } from "react"
import { checkActiveAttendance, getAttendanceData, saveAttendanceRecord } from "@/actions/attendance"
import RemoteMobileView from "@/app/dashboard/[slug]/attendance/components/RemoteMobileView"
import { Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function RemotePage() {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [attendanceData, setAttendanceData] = useState<any>(null)

    const loadActiveSession = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await checkActiveAttendance()
            if (!res.data) {
                setError("Nenhuma sessão ativa. Inicie um atendimento no computador primeiro.")
                setLoading(false)
                return
            }

            const data = await getAttendanceData(res.data.id)
            setAttendanceData(data)
        } catch (err: any) {
            setError(err.message || "Erro ao carregar sessão.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadActiveSession()
    }, [])

    if (loading) {
        return (
            <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center text-white">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">Sincronizando Sessão...</p>
            </div>
        )
    }

    if (error || !attendanceData) {
        return (
            <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center p-12 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h1 className="text-lg font-black text-white mb-2 uppercase tracking-tight">Sem Conexão Ativa</h1>
                <p className="text-xs text-slate-400 font-bold mb-8 uppercase tracking-widest">{error}</p>
                <Button onClick={loadActiveSession} className="h-12 w-full max-w-xs bg-white text-slate-950 font-black uppercase tracking-widest rounded-xl hover:bg-white/90 shadow-xl">
                    Recarregar
                </Button>
            </div>
        )
    }

    return (
        <RemoteMobileView
            patient={attendanceData.patient}
            appointment={attendanceData.appointment}
            currentRecord={attendanceData.existingRecord}
            templateId={attendanceData.existingRecord?.template_id}
            onUpdate={(path, value) => {
                const parts = path.split('.');
                let current = attendanceData.existingRecord.content || {};
                for (let i = 0; i < parts.length - 1; i++) {
                    if (!current[parts[i]]) current[parts[i]] = {};
                    current = current[parts[i]];
                }
                current[parts[parts.length - 1]] = value;
            }}
            onSave={async () => {
                await saveAttendanceRecord({
                    appointment_id: attendanceData.appointment.id,
                    patient_id: attendanceData.patient.id,
                    template_id: attendanceData.existingRecord?.template_id,
                    content: attendanceData.existingRecord?.content
                })
            }}
            onClose={() => window.location.reload()}
        />
    )
}
