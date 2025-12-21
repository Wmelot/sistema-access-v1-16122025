'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const TemplateSchema = z.object({
    title: z.string().min(3, "Título muito curto"),
    content: z.string().min(10, "Mensagem muito curta"),
    channel: z.enum(['whatsapp', 'email', 'sms']),
    trigger_type: z.enum([
        'manual',
        'appointment_confirmation',
        'appointment_reminder',
        'birthday',
        'post_attendance',
        'insole_maintenance'
    ]),
    is_active: z.boolean().default(true)
})

export async function getTemplates() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error("Error fetching templates:", error)
        return []
    }
    return data
}

export async function createTemplate(formData: FormData) {
    const rawData = {
        title: formData.get('title'),
        content: formData.get('content'),
        channel: formData.get('channel'),
        trigger_type: formData.get('trigger_type'),
        is_active: formData.get('is_active') === 'on'
    }

    const result = TemplateSchema.safeParse(rawData)

    if (!result.success) {
        return { success: false, error: result.error.issues[0].message }
    }

    const supabase = await createClient()
    const { error } = await supabase.from('message_templates').insert(result.data)

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/settings/communication')
    return { success: true }
}

export async function updateTemplate(id: string, formData: FormData) {
    const rawData = {
        title: formData.get('title'),
        content: formData.get('content'),
        channel: formData.get('channel'),
        trigger_type: formData.get('trigger_type'),
        is_active: formData.get('is_active') === 'on'
    }

    const result = TemplateSchema.safeParse(rawData)

    if (!result.success) {
        return { success: false, error: result.error.issues[0].message }
    }

    const supabase = await createClient()
    const { error } = await supabase
        .from('message_templates')
        .update(result.data)
        .eq('id', id)

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/settings/communication')
    return { success: true }
}

export async function deleteTemplate(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('message_templates').delete().eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/settings/communication')
    return { success: true }
}

export async function getMessageLogs() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('message_logs')
        .select(`
            *,
            template:message_templates (title)
        `)
        .order('created_at', { ascending: false })
        .limit(50)

    if (error) {
        console.error("Error fetching logs:", error)
        return []
    }
    return data
}

export async function sendTestMessage(templateId: string, phone: string) {
    const supabase = await createClient()
    const { data: template, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('id', templateId)
        .single()

    if (error || !template) {
        return { success: false, error: "Modelo não encontrado." }
    }

    // 1. Prepare Content (Replace Variables)
    let message = template.content
        .replace(/{{paciente}}/g, "João (Teste)")
        .replace(/{{data}}/g, new Date().toLocaleDateString('pt-BR'))
        .replace(/{{horario}}/g, "14:30")
        .replace(/{{medico}}/g, "Dra. Rayane")

    // 2. Format Phone
    let cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length <= 11) {
        cleanPhone = '55' + cleanPhone
    }

    // 3. Create Pending Log
    const { data: logInfo } = await supabase.from('message_logs').insert({
        template_id: templateId,
        phone: cleanPhone,
        content: message,
        status: 'pending'
    }).select().single()

    // 4. Call Evolution API
    try {
        const EVO_API_URL = "http://localhost:8080"
        const EVO_API_KEY = "B8988582-7067-463E-A4C3-A3F0E0D06939"
        const INSTANCE_NAME = "AccessFisioMain"

        const res = await fetch(`${EVO_API_URL}/message/sendText/${INSTANCE_NAME}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': EVO_API_KEY
            },
            body: JSON.stringify({
                number: cleanPhone,
                text: message
            })
        })

        const data = await res.json()

        if (res.ok && data.key?.id) {
            // Success: Update Log
            if (logInfo) {
                await supabase.from('message_logs').update({
                    status: 'sent',
                    message_id: data.key.id
                }).eq('id', logInfo.id)
            }
            revalidatePath('/dashboard/settings/communication')
            return { success: true }
        } else {
            console.error("Evolution API Error:", data)
            // Error: Update Log
            if (logInfo) {
                await supabase.from('message_logs').update({
                    status: 'failed',
                    error_message: JSON.stringify(data)
                }).eq('id', logInfo.id)
            }
            revalidatePath('/dashboard/settings/communication')
            return { success: false, error: "Falha na API do WhatsApp. Verifique se está conectada." }
        }

    } catch (e) {
        console.error("Fetch Error:", e)
        if (logInfo) {
            await supabase.from('message_logs').update({
                status: 'failed',
                error_message: "Connection Error (Port 8080)"
            }).eq('id', logInfo.id)
        }
        revalidatePath('/dashboard/settings/communication')
        return { success: false, error: "Erro de conexão com o servidor local (Porta 8080)." }
    }
}
