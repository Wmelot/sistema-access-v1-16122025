'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import * as XLSX from 'xlsx' // Need to install this library

// --- TYPES ---
export type CampaignContact = {
    name: string
    phone: string
}

export type CampaignStats = {
    total: number
    sent: number
    failed: number
    pending: number
}

// --- ACTIONS ---

export async function parseContactsFromExcel(formData: FormData) {
    try {
        const file = formData.get('file') as File
        if (!file) return { error: "Nenhum arquivo enviado." }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const workbook = XLSX.read(buffer, { type: 'buffer' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const data = XLSX.utils.sheet_to_json(sheet)

        // Map and validate
        // Expect columns: "Nome" and "Telefone" (case insensitive)
        const contacts: CampaignContact[] = []
        let invalidCount = 0

        data.forEach((row: any) => {
            // Flexible key matching
            const keys = Object.keys(row)
            const nameKey = keys.find(k => k.toLowerCase().includes('nome') || k.toLowerCase().includes('name'))
            const phoneKey = keys.find(k => k.toLowerCase().includes('tele') || k.toLowerCase().includes('fone') || k.toLowerCase().includes('phone') || k.toLowerCase().includes('celular'))

            if (nameKey && phoneKey) {
                const rawPhone = String(row[phoneKey]).replace(/\D/g, '')
                if (rawPhone.length >= 10) { // Basic validation
                    contacts.push({
                        name: String(row[nameKey]).trim(),
                        phone: rawPhone
                    })
                } else {
                    invalidCount++
                }
            } else {
                invalidCount++
            }
        })

        if (contacts.length === 0) {
            return { error: "Não foi possível encontrar contatos válidos. Verifique as colunas 'Nome' e 'Telefone'." }
        }

        return { success: true, contacts, invalidCount }

    } catch (e: any) {
        console.error("Excel Parse Error:", e)
        return { error: "Erro ao processar arquivo: " + e.message }
    }
}

export async function createCampaign(title: string, content: string, contacts: CampaignContact[]) {
    const supabase = await createClient()

    // 1. Create Campaign Header
    const { data: campaign, error: campError } = await supabase
        .from('marketing_campaigns')
        .insert({
            title,
            status: 'draft', // Starts as draft until explicitly started
            total_messages: contacts.length,
            template_content: content
        })
        .select()
        .single()

    if (campError) {
        return { error: "Erro ao criar campanha: " + campError.message }
    }

    // 2. Create Messages (Batch Insert)
    const messages = contacts.map(c => ({
        campaign_id: campaign.id,
        phone: c.phone,
        name: c.name,
        // We can store the personalized content here OR just the raw data if we process dynamically.
        // Storing personalized content is safer for history consistency.
        content: content.replace(/{{nome}}/gi, c.name.split(' ')[0]),
        status: 'pending'
    }))

    // Supabase allows bulk insert
    // Split into chunks if too large (e.g. > 1000)
    const chunkSize = 500
    for (let i = 0; i < messages.length; i += chunkSize) {
        const chunk = messages.slice(i, i + chunkSize)
        const { error: msgError } = await supabase.from('campaign_messages').insert(chunk)
        if (msgError) {
            console.error("Error inserting messages chunk:", msgError)
            // Rollback campaign? Or just warn?
            // For now, let's just abort future chunks.
            return { error: "Erro parcial ao salvar contatos: " + msgError.message }
        }
    }

    revalidatePath('/dashboard/marketing')
    return { success: true, campaignId: campaign.id }
}

export async function startCampaign(campaignId: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('marketing_campaigns')
        .update({ status: 'sending' }) // Trigger cron to pick it up
        .eq('id', campaignId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/marketing')
    return { success: true }
}

export async function getCampaigns() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) return []
    return data
}

export async function getCampaignDetails(id: string) {
    const supabase = await createClient()

    const { data: campaign } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .eq('id', id)
        .single()

    if (!campaign) return null

    // Get stats
    const { count: pending } = await supabase.from('campaign_messages').select('*', { count: 'exact', head: true }).eq('campaign_id', id).eq('status', 'pending')
    const { count: sent } = await supabase.from('campaign_messages').select('*', { count: 'exact', head: true }).eq('campaign_id', id).eq('status', 'sent')
    const { count: failed } = await supabase.from('campaign_messages').select('*', { count: 'exact', head: true }).eq('campaign_id', id).eq('status', 'failed')

    return {
        ...campaign,
        stats: { pending, sent, failed }
    }
}

export async function getServicesList() {
    const supabase = await createClient()
    const { data } = await supabase.from('services').select('id, name').order('name')
    return data || []
}

export async function searchPatientsForCampaign(filters: { startDate?: string, endDate?: string, serviceIds?: string[] }) {
    const supabase = await createClient()

    let query = supabase
        .from('appointments')
        .select(`
            patient_id,
            patients!inner (
                id,
                name,
                phone
            )
        `)
        .neq('status', 'cancelled')

    // Filter by Date
    if (filters.startDate) {
        query = query.gte('start_time', filters.startDate) // Start of day ideally
    }
    if (filters.endDate) {
        // Assume endDate is inclusive, so we might want end of day
        query = query.lte('start_time', filters.endDate + 'T23:59:59')
    }

    // Filter by Service
    if (filters.serviceIds && filters.serviceIds.length > 0) {
        query = query.in('service_id', filters.serviceIds)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error searching patients:', error)
        return []
    }

    // Deduplicate patients
    const uniquePatients = new Map<string, CampaignContact>()

    data?.forEach((item: any) => {
        if (item.patients && item.patients.phone) {
            uniquePatients.set(item.patients.id, {
                name: item.patients.name,
                phone: item.patients.phone
            })
        }
    })

    return Array.from(uniquePatients.values())
}

// --- BILLING ACTIONS ---

export type UnbilledPatient = {
    id: string
    name: string
    phone: string
    total_sessions: number
    total_amount: number
    details: Array<{
        date: string
        service: string
        price: number
    }>
}

export async function getUnbilledPatients(month?: string) {
    const supabase = await createClient()

    // Default to current month if not specified
    const targetMonth = month || new Date().toISOString().slice(0, 7) // YYYY-MM format

    // Fetch appointments that are completed but not invoiced
    const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
            id,
            start_time,
            patient_id,
            service_id,
            patients!inner (
                id,
                name,
                phone
            ),
            services (
                name,
                price
            )
        `)
        .eq('status', 'completed')
        .is('invoice_id', null)
        .gte('start_time', `${targetMonth}-01`)
        .lt('start_time', getNextMonth(targetMonth))

    if (error) {
        console.error('Error fetching unbilled appointments:', error)
        return []
    }

    // Group by patient
    const patientMap = new Map<string, UnbilledPatient>()

    appointments?.forEach((apt: any) => {
        if (!apt.patients || !apt.patients.phone) return

        const patientId = apt.patients.id
        const existing = patientMap.get(patientId)

        const detail = {
            date: new Date(apt.start_time).toLocaleDateString('pt-BR'),
            service: apt.services?.name || 'Atendimento',
            price: apt.services?.price || 0
        }

        if (existing) {
            existing.total_sessions++
            existing.total_amount += detail.price
            existing.details.push(detail)
        } else {
            patientMap.set(patientId, {
                id: patientId,
                name: apt.patients.name,
                phone: apt.patients.phone,
                total_sessions: 1,
                total_amount: detail.price,
                details: [detail]
            })
        }
    })

    return Array.from(patientMap.values())
}

function getNextMonth(monthStr: string): string {
    const [year, month] = monthStr.split('-').map(Number)
    const nextMonth = month === 12 ? 1 : month + 1
    const nextYear = month === 12 ? year + 1 : year
    return `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`
}

export async function createBillingCampaign(
    patientIds: string[],
    customMessage?: string
) {
    const supabase = await createClient()

    // Get clinic settings for PIX key
    const { data: clinicSettings } = await supabase
        .from('clinic_settings')
        .select('pix_key, name')
        .single()

    const pixKey = clinicSettings?.pix_key || 'Não configurado'
    const clinicName = clinicSettings?.name || 'Clínica'

    // Fetch unbilled patients
    const allPatients = await getUnbilledPatients()
    const selectedPatients = allPatients.filter(p => patientIds.includes(p.id))

    if (selectedPatients.length === 0) {
        return { error: 'Nenhum paciente selecionado com débitos' }
    }

    // Create campaign
    const { data: campaign, error: campError } = await supabase
        .from('marketing_campaigns')
        .insert({
            title: `Cobrança - ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
            status: 'sending',
            total_messages: selectedPatients.length,
            template_content: customMessage || getDefaultBillingTemplate()
        })
        .select()
        .single()

    if (campError) {
        return { error: 'Erro ao criar campanha: ' + campError.message }
    }

    // Create messages for each patient
    const messages = selectedPatients.map(patient => {
        const detailsText = patient.details
            .map(d => `• ${d.date} - ${d.service}: R$ ${d.price.toFixed(2)}`)
            .join('\n')

        const messageContent = (customMessage || getDefaultBillingTemplate())
            .replace(/{{nome}}/gi, patient.name.split(' ')[0])
            .replace(/{{detalhamento}}/gi, detailsText)
            .replace(/{{total_sessoes}}/gi, String(patient.total_sessions))
            .replace(/{{total}}/gi, patient.total_amount.toFixed(2))
            .replace(/{{pix_key}}/gi, pixKey)
            .replace(/{{clinica}}/gi, clinicName)

        return {
            campaign_id: campaign.id,
            phone: patient.phone,
            name: patient.name,
            content: messageContent,
            status: 'pending'
        }
    })

    // Insert messages in batches
    const chunkSize = 500
    for (let i = 0; i < messages.length; i += chunkSize) {
        const chunk = messages.slice(i, i + chunkSize)
        const { error: msgError } = await supabase.from('campaign_messages').insert(chunk)
        if (msgError) {
            console.error('Error inserting billing messages:', msgError)
            return { error: 'Erro ao criar mensagens: ' + msgError.message }
        }
    }

    revalidatePath('/dashboard/marketing')
    return { success: true, campaignId: campaign.id }
}

function getDefaultBillingTemplate(): string {
    return `Olá {{nome}},

Segue o resumo dos atendimentos realizados este mês:

{{detalhamento}}

📊 *Total de sessões:* {{total_sessoes}}
💰 *Valor total:* R$ {{total}}

💳 *PIX para pagamento:*
{{pix_key}}

Qualquer dúvida, estou à disposição!

Atenciosamente,
{{clinica}}`
}
