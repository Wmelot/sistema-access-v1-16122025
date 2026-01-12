import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
        const zapiInstanceId = Deno.env.get('ZAPI_INSTANCE_ID') || ''
        const zapiToken = Deno.env.get('ZAPI_TOKEN') || ''
        const appUrl = 'https://beta.accessfisio.com'

        if (!supabaseServiceKey || !zapiInstanceId || !zapiToken) {
            throw new Error('Missing environment variables: SERVICE_KEY or ZAPI credentials')
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // 1. Calculate Target Date (Today + 2 days)
        const today = new Date()
        const targetDate = new Date(today)
        targetDate.setDate(today.getDate() + 2)
        const targetDateStr = targetDate.toISOString().split('T')[0] // YYYY-MM-DD

        console.log(`Checking appointments for date: ${targetDateStr}`)

        // 2. Query Appointments
        const { data: appointments, error: appError } = await supabase
            .from('appointments')
            .select(`
        id,
        start_time,
        injury_region,
        patient_id,
        professional_id,
        patients (
          id,
          name,
          phone
        ),
        profiles:professional_id (
            full_name
        )
      `)
            .gte('start_time', `${targetDateStr}T00:00:00`)
            .lte('start_time', `${targetDateStr}T23:59:59`)
            .not('injury_region', 'is', null)

        if (appError) throw appError

        if (!appointments || appointments.length === 0) {
            return new Response(JSON.stringify({ message: 'No target appointments found' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // 3. Define Mapping
        const regionMap: Record<string, string> = {
            'Pé/Tornozelo': 'faam',
            'Joelho': 'ikdc',
            'Coluna': 'roland_morris',
            'Saúde Pélvica': 'iciq_sf',
            'Ombro': 'spadi',
        }

        const results = []

        for (const appt of appointments) {
            // Safe check for patient phone
            const patient = appt.patients
            // @ts-ignore
            const professionalName = appt.profiles?.full_name || 'Dr. Warley'
            if (!patient || !patient.phone) {
                results.push({ id: appt.id, status: 'skipped', reason: 'no_patient_phone' })
                continue
            }

            // Determine Questionnaire
            // Default to 'psfs' if not mapped
            const qType = regionMap[appt.injury_region] || 'psfs'

            // 4. Check Duplicate Log
            const { data: existingLog } = await supabase
                .from('questionnaire_logs')
                .select('id')
                .eq('appointment_id', appt.id)
                .eq('questionnaire_type', qType)
                .single()

            if (existingLog) {
                results.push({ id: appt.id, status: 'skipped', reason: 'already_sent' })
                continue
            }

            // 5. Generate Link (Create assessment_follow_up)
            // We use createClient with service key, so RLS bypassed, but we need valid user ID for 'created_by'
            // Ideally we use a system user or the professional's ID. Let's use professional_id.

            // Expiration: Appointment Date + 30 days (generous)
            const apptDate = new Date(appt.start_time)
            const expiresAt = new Date(apptDate)
            expiresAt.setDate(expiresAt.getDate() + 30)

            const { data: followUp, error: fuError } = await supabase
                .from('assessment_follow_ups')
                .insert({
                    patient_id: patient.id,
                    created_by: appt.professional_id, // Attributed to the pro
                    scheduled_for: new Date().toISOString(), // Sent now
                    link_expires_at: expiresAt.toISOString(),
                    questionnaire_type: qType,
                    custom_message: 'Automated pre-consultation',
                    status: 'pending' // Should generate link_token automatically if default exists, if not we rely on DB trigger or default
                })
                .select('link_token')
                .single()

            if (fuError || !followUp) {
                console.error(`Error creating follow-up for appt ${appt.id}:`, fuError)
                results.push({ id: appt.id, status: 'error', reason: 'followup_creation_failed' })
                continue
            }

            const link = `${appUrl}/avaliacao/${followUp.link_token}`

            // 6. Send WhatsApp (Z-API)
            const message = `Olá ${patient.name.split(' ')[0]}! Sua consulta com o ${professionalName} está chegando e seu tratamento já começou. Para aproveitarmos cada minuto, preencha este formulário: ${link}. Suas respostas são cruciais para o sucesso do tratamento.`

            // Normalize phone (remove chars, ensure 55)
            let phone = patient.phone.replace(/\D/g, '')
            if (!phone.startsWith('55')) phone = '55' + phone

            try {
                const zapiRes = await fetch(`https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiToken}/send-text`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        phone: phone,
                        message: message
                    })
                })

                if (!zapiRes.ok) {
                    const zapiErr = await zapiRes.text()
                    console.error('Z-API Error:', zapiErr)
                    throw new Error('Z-API Failed')
                }

                // 7. Log Success
                await supabase.from('questionnaire_logs').insert({
                    appointment_id: appt.id,
                    patient_id: patient.id,
                    questionnaire_type: qType,
                    status: 'enviado'
                })

                results.push({ id: appt.id, status: 'sent', type: qType })

            } catch (err: any) {
                console.error(`Failed to send to ${phone}:`, err)
                results.push({ id: appt.id, status: 'error', reason: err.message })
            }
        }

        return new Response(JSON.stringify({ processed: results }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
