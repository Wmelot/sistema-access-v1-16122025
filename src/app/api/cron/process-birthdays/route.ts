
import { createAdminClient } from "@/lib/supabase/server"
import { getWhatsappConfig, sendMessage } from "@/app/dashboard/[slug]/settings/communication/actions"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

/**
 * CRON: Process Birthdays
 * This route should be called once a day (e.g., at 09:00 AM Brazil time).
 */
export async function GET(request: Request) {
    try {
        const supabase = await createAdminClient()
        const now = new Date()

        // Brazil Time correction (if needed, but for Day/Month usually local server time is fine if it matches the DB)
        const currentDay = now.getDate()
        const currentMonth = now.getMonth() + 1

        console.log(`[Cron Birthdays] Checking birthdays for ${currentDay}/${currentMonth}`)

        // 1. Fetch Patients who have birthdays
        // Note: For large databases, we'd use a Postgres function (RPC) to filter by month/day.
        const { data: patients, error: patientError } = await supabase
            .from('patients')
            .select('id, name, phone, birthdate, organization_id')
            .not('birthdate', 'is', null)

        if (patientError) {
            console.error("[Cron Birthdays] Error fetching patients:", patientError)
            return NextResponse.json({ error: patientError.message }, { status: 500 })
        }

        const todayBirthdays = (patients || []).filter(p => {
            if (!p.birthdate) return false
            const bday = new Date(p.birthdate)
            return bday.getUTCDate() === currentDay && (bday.getUTCMonth() + 1) === currentMonth
        })

        if (todayBirthdays.length === 0) {
            return NextResponse.json({ message: "No birthdays today", count: 0 })
        }

        const results = []

        // 2. Process each birthday
        for (const patient of todayBirthdays) {
            try {
                const orgId = patient.organization_id
                if (!orgId) continue

                // Check if already sent today to prevent duplicates
                const startOfDay = new Date()
                startOfDay.setHours(0, 0, 0, 0)

                const { data: existingLog } = await supabase
                    .from('message_logs')
                    .select('id')
                    .eq('patient_id', patient.id)
                    .eq('trigger_type', 'birthday')
                    .gte('created_at', startOfDay.toISOString())
                    .maybeSingle()

                if (existingLog) {
                    results.push({ patient: patient.name, status: 'skipped', reason: 'Already sent today' })
                    continue
                }

                // Fetch Organization and Template
                const { data: org } = await supabase.from('organizations').select('name, slug').eq('id', orgId).single()

                // Fetch Birthday Template for this Org
                const { data: template } = await supabase
                    .from('message_templates')
                    .select('*')
                    .eq('organization_id', orgId)
                    .eq('trigger_type', 'birthday')
                    .eq('is_active', true)
                    .maybeSingle()

                if (!template) {
                    results.push({ patient: patient.name, status: 'skipped', reason: 'No active birthday template' })
                    continue
                }

                // Config
                const whatsappConfig = await getWhatsappConfig(org?.slug)
                if (!whatsappConfig || !whatsappConfig.isFeatureActive) {
                    results.push({ patient: patient.name, status: 'skipped', reason: 'WhatsApp feature disabled or not configured' })
                    continue
                }

                // Construct Message
                const patientFirstName = patient.name.split(' ')[0]
                const messageText = template.content
                    .replace(/{{paciente}}/g, patientFirstName)
                    .replace(/{{clinica}}/g, org?.name || 'Access Fisioterapia')
                    .replace(/{{profissional}}/g, 'Equipe Access')
                    .replace(/{{medico}}/g, 'Equipe Access')

                // Send
                const res = await sendMessage(patient.phone, messageText, whatsappConfig)

                if (res.success) {
                    await supabase.from('message_logs').insert({
                        organization_id: orgId,
                        patient_id: patient.id,
                        template_id: template.id,
                        trigger_type: 'birthday',
                        phone: patient.phone.replace(/\D/g, ''),
                        content: messageText,
                        status: 'sent',
                        message_id: (res as any).messageId
                    })
                    results.push({ patient: patient.name, status: 'success' })
                } else {
                    results.push({ patient: patient.name, status: 'failed', error: (res as any).error })
                }

            } catch (err: any) {
                console.error(`[Cron Birthdays] Error for patient ${patient.name}:`, err)
                results.push({ patient: patient.name, status: 'error', error: err.message })
            }
        }

        return NextResponse.json({
            processed: todayBirthdays.length,
            timestamp: now.toISOString(),
            results
        })

    } catch (globalError: any) {
        console.error("[Cron Birthdays] Global Error:", globalError)
        return NextResponse.json({ error: globalError.message }, { status: 500 })
    }
}
