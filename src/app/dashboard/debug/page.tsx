'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { debugGetAppointments } from './actions'
import { format } from 'date-fns'

export default function DebugPage() {
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [results, setResults] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    const handleCheck = async () => {
        setLoading(true)
        const res = await debugGetAppointments(date)
        if (res.data) {
            setResults(res.data)
        }
        setLoading(false)
    }

    return (
        <div className="p-8 space-y-6">
            <h1 className="text-2xl font-bold text-red-600">🕵️‍♂️ Debug de Agendamentos (Raio-X)</h1>
            <p className="text-muted-foreground">Esta página consulta o banco de dados diretamente, ignorando filtros visuais.</p>
            <p className="text-sm bg-yellow-100 p-2 rounded text-yellow-800 border border-yellow-200">
                ⚠️ Ferramenta Técnica: Use para identificar conflitos cruzados (mesmo horário em outras salas).
            </p>

            <div className="flex gap-4 items-end bg-card p-4 rounded-lg border">
                <div className="grid gap-2">
                    <label>Data para Investigar</label>
                    <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <Button onClick={handleCheck} disabled={loading}>
                    {loading ? 'Consultando...' : 'Consultar Tudo'}
                </Button>
            </div>

            <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 border-b font-medium text-slate-600">
                        <tr>
                            <th className="p-3">Status</th>
                            <th className="p-3">Hora</th>
                            <th className="p-3">Paciente</th>
                            <th className="p-3">Profissional</th>
                            <th className="p-3">Local (Sala)</th>
                            <th className="p-3">Tipo</th>
                            <th className="p-3">RAW ID</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {results.map((appt) => (
                            <tr key={appt.id} className={`hover:bg-slate-50 ${appt.status === 'cancelled' ? 'opacity-50 line-through bg-red-50' : 'bg-green-50/50'}`}>
                                <td className="p-3 font-mono font-bold">{appt.status}</td>
                                <td className="p-3">
                                    {new Date(appt.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    {' - '}
                                    {new Date(appt.end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="p-3 font-medium">{appt.patients?.name || '---'}</td>
                                <td className="p-3">{appt.profiles?.full_name || '---'}</td>
                                <td className="p-3 text-blue-600 font-medium">{appt.locations?.name || '---'}</td>
                                <td className="p-3">{appt.type}</td>
                                <td className="p-3 text-xs text-muted-foreground font-mono">{appt.id}</td>
                            </tr>
                        ))}
                        {results.length === 0 && !loading && (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-muted-foreground">Nenhum agendamento encontrado nesta data.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="bg-slate-900 text-slate-50 p-4 rounded-lg font-mono text-xs overflow-x-auto">
                <h3 className="mb-2 font-bold text-green-400">Raw JSON Dump (Last Query)</h3>
                <pre>{JSON.stringify(results, null, 2)}</pre>
            </div>
        </div>
    )
}
