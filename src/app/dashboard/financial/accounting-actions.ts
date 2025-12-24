
'use server'

import { createClient } from "@/lib/supabase/server"
import { getBrazilStartOfMonth, getBrazilEndOfMonth, getBrazilDate } from "@/lib/date-utils"

// Generates a CSV string for accounting
export async function generateAccountingReport(month: number, year: number) {
    const supabase = await createClient()

    // 1. Fetch Completed Appointments (Services)
    const startDate = getBrazilStartOfMonth(year, month)
    const endDate = getBrazilEndOfMonth(year, month) // End of month

    const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
            date,
            price,
            status,
            patient:patients(id, name, cpf, address),
            service:services(name),
            payment_method_id,
            payment_method:payment_methods(name)
        `)
        .eq('status', 'completed')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })

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
        const date = getBrazilDate(app.date).toLocaleDateString("pt-BR")
        const client = app.patient?.name || "Consumidor Final"
        const cpf = app.patient?.cpf || ""
        const address = app.patient?.address || "" // Concatenated string
        const type = "Serviço"
        const desc = app.service?.name || "Atendimento"
        const value = Number(app.price || 0).toFixed(2).replace(".", ",")
        const payment = app.payment_method?.name || "Não informado"

        // CSV Escape
        const safeClient = `"${client.replace(/"/g, '""')}"`
        const safeDesc = `"${desc.replace(/"/g, '""')}"`
        const safeAddress = `"${address.replace(/"/g, '""')}"`

        rows.push(`${date},${safeClient},${cpf},${safeAddress},${type},${safeDesc},"${value}","${payment}"`)
    })

    const csvContent = rows.join("\n")
    return { data: csvContent, filename: `relatorio_contabil_${month}_${year}.csv` }
}
