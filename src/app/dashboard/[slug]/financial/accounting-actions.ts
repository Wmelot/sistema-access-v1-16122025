
'use server'

import { createClient } from "@/lib/supabase/server"
import { getBrazilStartOfMonth, getBrazilEndOfMonth, getBrazilDate } from "@/lib/date-utils"

// Generates a CSV string for accounting
export async function generateAccountingReport(isoStartDate: string, isoEndDate: string) {
    const supabase = await createClient()

    // 1. Fetch Completed Appointments (Services)
    // Ensure we cover the full day on the end date
    const start = `${isoStartDate}T00:00:00.000Z`
    const end = `${isoEndDate}T23:59:59.999Z`

    const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
            start_time,
            price,
            status,
            patient:patients(id, name, cpf, address),
            title
        `)
        .eq('status', 'completed')
        .gte('start_time', start)
        .lte('start_time', end)
        .order('start_time', { ascending: true })

    if (error) {
        console.error("Export Error (Appts):", error)
        return { error: "Erro ao buscar agendamentos" }
    }

    // 2. Validate Data
    const missingData: any[] = []
    const processedPatients = new Set()

    appointments?.forEach((app: any) => {
        const p = app.patient
        if (!p) return
        if (processedPatients.has(p.id)) return

        const missingFields = []
        if (!p.cpf) missingFields.push("CPF")

        // Address check (Length > 5 as a proxy for valid address since it's a concatenated string)
        if (!p.address || p.address.length < 5) missingFields.push("Endereço Completo")

        if (missingFields.length > 0) {
            missingData.push({
                patientId: p.id,
                patientName: p.name,
                missing: missingFields
            })
            processedPatients.add(p.id)
        }
    })

    if (missingData.length > 0) {
        return { missingData, error: null }
    }

    // 3. Build CSV
    const headers = ["Data", "Cliente", "CPF", "Endereço", "Tipo", "Descrição", "Valor", "Forma Pagamento"]
    const rows = [headers.join(",")]

    appointments?.forEach((app: any) => {
        const date = getBrazilDate(app.start_time).toLocaleDateString("pt-BR")
        const client = app.patient?.name || "Consumidor Final"
        const cpf = app.patient?.cpf || ""
        const address = app.patient?.address || "" // Concatenated string
        const type = "Serviço"
        const desc = app.title || "Atendimento"
        const value = Number(app.price || 0).toFixed(2).replace(".", ",")
        const payment = "Não informado" // app.payment_method?.name is removed to prevent error

        // CSV Escape
        const safeClient = `"${client.replace(/"/g, '""')}"`
        const safeDesc = `"${desc.replace(/"/g, '""')}"`
        const safeAddress = `"${address.replace(/"/g, '""')}"`

        rows.push(`${date},${safeClient},${cpf},${safeAddress},${type},${safeDesc},"${value}","${payment}"`)
    })

    const csvContent = rows.join("\n")
    const filename = `relatorio_contabil_${isoStartDate.replace(/-/g, '')}_${isoEndDate.replace(/-/g, '')}.csv`
    return { data: csvContent, filename }
}
