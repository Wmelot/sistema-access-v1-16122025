import { NextResponse } from 'next/server'
import { db } from '@/lib/db' // Using direct connection for reliability

// Z-API Payload Structure (Based on common patterns + user desc)
// User said: phone in 'phone', text in 'message.text'
interface ZApiPayload {
    phone: string
    isGroup?: boolean
    message?: {
        text?: string
    }
}

export async function POST(request: Request) {
    try {
        // 1. Authorization (Optional - check for a specific header if configured)
        // const secret = request.headers.get('Client-Token')
        // if (secret !== process.env.ZAPI_WEBHOOK_SECRET) ...

        const body: ZApiPayload = await request.json()

        // 2. Validate Payload
        if (!body.phone || !body.message?.text) {
            return NextResponse.json({ message: 'Invalid payload' }, { status: 400 })
        }

        // Ignore Groups
        if (body.isGroup) {
            return NextResponse.json({ message: 'Ignored group message' }, { status: 200 })
        }

        const rawText = body.message.text.trim().toLowerCase()
        const rawPhone = body.phone.replace(/\D/g, '')

        // 3. Check for Confirmation Keywords
        const confirmationKeywords = ['1', 'sim', 'confirmar', 'confirmo', 'ok']
        // Check if message STARTS with or IS exactly one of the keywords
        // (to avoid false positives in long sentences, though minimal check is safer)
        const isConfirmation = confirmationKeywords.some(w => rawText === w || rawText.startsWith(w + ' '))

        if (!isConfirmation) {
            // Log for debugging?
            console.log(`[Webhook] Received non-confirmation from ${rawPhone}: ${rawText}`)
            return NextResponse.json({ message: 'Received' }, { status: 200 })
        }

        console.log(`[Webhook] Processing confirmation from ${rawPhone}`)

        // 4. Find Patient by Phone
        // Need to fuzzy match phone? Or assume exact format (55 + DDD + Number)?
        // Z-API usually sends 55319...
        // DB usually stores 55319... or just 319...
        // We'll try exact match first, then without 55.

        let patientId = null

        const patientRes = await db.query(
            `SELECT id FROM public.patients WHERE phone = $1 OR phone = $2 LIMIT 1`,
            [rawPhone, rawPhone.replace(/^55/, '')]
        )

        if (patientRes.rows.length > 0) {
            patientId = patientRes.rows[0].id
        } else {
            console.log(`[Webhook] No patient found for phone ${rawPhone}`)
            return NextResponse.json({ message: 'Patient not found' }, { status: 200 })
        }

        // 5. Find Nearest Future Appointment
        const appRes = await db.query(
            `SELECT id, status, start_time FROM public.appointments 
             WHERE patient_id = $1 
               AND start_time > NOW() 
               AND status NOT IN ('cancelled', 'completed', 'confirmed')
             ORDER BY start_time ASC 
             LIMIT 1`,
            [patientId]
        )

        if (appRes.rows.length === 0) {
            console.log(`[Webhook] No pending future appointment for patient ${patientId}`)
            return NextResponse.json({ message: 'No appointment to confirm' }, { status: 200 })
        }

        const appointment = appRes.rows[0]

        // 6. Update Status
        await db.query(
            `UPDATE public.appointments 
             SET status = 'confirmed', updated_at = NOW() 
             WHERE id = $1`,
            [appointment.id]
        )

        // 7. Log Action
        await db.query(
            `INSERT INTO public.system_logs (action, table_name, record_id, details)
             VALUES ($1, $2, $3, $4)`,
            ['AUTO_CONFIRM_WHATSAPP', 'appointments', appointment.id, JSON.stringify({ phone: rawPhone, text: rawText })]
        )

        console.log(`[Webhook] Appointment ${appointment.id} confirmed for patient ${patientId}`)

        return NextResponse.json({ success: true, appointment_id: appointment.id }, { status: 200 })

    } catch (error: any) {
        console.error('[Webhook Error]', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
