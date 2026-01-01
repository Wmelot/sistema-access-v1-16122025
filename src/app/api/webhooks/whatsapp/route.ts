
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// Service Role Client (to bypass RLS when finding/updating appointments)
// Initialized lazily to avoid build-time errors if env vars are missing
const getSupabase = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseKey) return null
    return createClient(supabaseUrl, supabaseKey)
}

export async function POST(request: Request) {
    const supabase = getSupabase()
    if (!supabase) {
        console.error("Missing Supabase credentials in environment")
        return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 })
    }
    try {
        const body = await request.json()

        // Log payload for debugging (can be removed later)
        // Log payload for debugging (can be removed later)


        // 1. EXTRACT DATA (Support Z-API and Evolution)
        let phone = ""
        let text = ""

        // Z-API Format (Common)
        if (body.phone && body.message) {
            phone = body.phone
            // Z-API sometimes wraps text in invalid format or just 'text'
            text = typeof body.message === 'string' ? body.message : (body.message.text || body.text?.message || "")
        }
        // Evolution API Format
        else if (body.data && body.data.key && body.data.message) {
            phone = body.data.key.remoteJid
            text = body.data.message.conversation || body.data.message.extendedTextMessage?.text || ""
        }
        // Fallback/Generic
        else if (body.sender && body.text) {
            phone = body.sender
            text = body.text
        }

        if (!phone || !text) {
            return NextResponse.json({ message: "Ignored: No phone or text found" })
        }

        // Sanitize
        const cleanPhone = phone.replace(/\D/g, "")
        const cleanText = text.trim().toLowerCase()



        // 2. CHECK KEYWORDS
        const validKeywords = ['sim', 'confirmar', 'confirmo', 'ok', 'tá bom', 'ta bom', 'pode ser', 'confirmado', '👍', 'certinho', 'blz']

        // Check if message STARTS with or IS exactly one of the keywords (to avoid false positives in long sentences)
        // OR if the message is very short (< 20 chars) and contains the keyword.
        const isConfirmation = validKeywords.some(k =>
            cleanText === k ||
            (cleanText.length < 30 && cleanText.includes(k))
        )

        if (!isConfirmation) {
            return NextResponse.json({ message: "Ignored: Not a confirmation message" })
        }

        // 3. FIND APPOINTMENT
        // Find the NEXT scheduled appointment for this patient confirmed by phone
        const today = new Date()
        today.setHours(0, 0, 0, 0) // From start of today

        // First find patient by phone
        const { data: patients } = await supabase
            .from('patients')
            .select('id')
            .ilike('phone', `%${cleanPhone.slice(-8)}%`) // Match last 8 digits to be safe (ignoring country code/9 digit variance)
            .limit(1)

        if (!patients || patients.length === 0) {

            return NextResponse.json({ message: "Patient not found" })
        }

        const patientId = patients[0].id

        // Find upcoming appointment
        const { data: appointment } = await supabase
            .from('appointments')
            .select('id, status, start_time')
            .eq('patient_id', patientId)
            .neq('status', 'cancelled')
            .neq('status', 'completed')
            .neq('status', 'confirmed') // Don't re-confirm
            .gte('start_time', today.toISOString())
            .order('start_time', { ascending: true })
            .limit(1)
            .single()

        if (!appointment) {

            return NextResponse.json({ message: "No pending appointment found" })
        }

        // 4. UPDATE STATUS
        const { error: updateError } = await supabase
            .from('appointments')
            .update({ status: 'confirmed' })
            .eq('id', appointment.id)

        if (updateError) {
            console.error("[Webhook] Update Error:", updateError)
            return NextResponse.json({ error: "Failed to update appointment" }, { status: 500 })
        }



        return NextResponse.json({ success: true, message: "Appointment confirmed" })

    } catch (e: any) {
        console.error("[Webhook] Error:", e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
