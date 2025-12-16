'use server'

import { createClient } from "@/lib/supabase/server"

// 1. Fetch Professionals linked to a Service (and optionally Location?)
// The schema `service_professionals` links Profile <-> Service.
// Location availability is in `professional_availability` table (or derived).
// For now, list all pros who perform the service.
export async function getProfessionalsForService(serviceId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('service_professionals')
        .select(`
            profile_id,
            profiles (
                id,
                full_name,
                photo_url,
                bio,
                specialty
            )
        `)
        .eq('service_id', serviceId)

    if (error) {
        console.error('Error fetching professionals:', error)
        return []
    }

    // Flatten logic
    return data.map((item: any) => item.profiles).filter((p: any) => p)
}

// 2. Fetch Availability (Public)
// Reuses logic from `schedule/actions` but simplified for public view (only free slots).
export async function getPublicAvailability(professionalId: string, dateStr: string, durationMinutes: number) {
    const supabase = await createClient()
    const dayOfWeek = new Date(dateStr + 'T12:00:00').getDay() // Avoid timezone shift

    // 1. Get Working Hours for that day
    const { data: availability } = await supabase
        .from('professional_availability')
        .select('start_time, end_time')
        .eq('profile_id', professionalId)
        .eq('day_of_week', dayOfWeek)

    if (!availability || availability.length === 0) return []

    // 2. Get Existing Appointments
    const { data: appointments } = await supabase
        .from('appointments')
        .select('start_time, end_time')
        .eq('professional_id', professionalId)
        .gte('start_time', `${dateStr}T00:00:00`)
        .lte('end_time', `${dateStr}T23:59:59`)
        .neq('status', 'cancelled') // Ignore cancelled

    const existingSlots: { start: number, end: number }[] = (appointments || []).map((app: any) => ({
        start: timeToMinutes(new Date(app.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })),
        end: timeToMinutes(new Date(app.end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
    }))

    // 3. Generate Slots
    // We need the professional's interval? Or just use duration?
    // Let's use service duration as the step? or 30 mins?
    // Ideally use `slot_interval` from profile.
    const { data: profile } = await supabase.from('profiles').select('slot_interval').eq('id', professionalId).single()
    const step = profile?.slot_interval || 30

    const freeSlots: string[] = []

    for (const block of availability) {
        let currentMins = timeToMinutes(block.start_time)
        const endMins = timeToMinutes(block.end_time)

        while (currentMins + durationMinutes <= endMins) {
            const slotStart = currentMins
            const slotEnd = currentMins + durationMinutes

            // Check Collision
            const isBusy = existingSlots.some(busy => {
                // Overlap logic: (StartA < EndB) and (EndA > StartB)
                return (slotStart < busy.end && slotEnd > busy.start)
            })

            if (!isBusy) {
                freeSlots.push(minutesToTime(slotStart))
            }

            currentMins += step
        }
    }

    return freeSlots
}

// Helpers
function timeToMinutes(time: string) {
    const [h, m] = time.split(':').map(Number)
    return h * 60 + m
}

function minutesToTime(mins: number) {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// 3. Create Appointment (Public)
export async function createPublicAppointment(data: {
    serviceId: string
    professionalId: string
    date: string
    time: string
    patientData: {
        name: string
        phone: string
        cpf: string // Used to identify
        email?: string
    }
}) {
    const supabase = await createClient()

    // 1. Find or Create Patient
    let patientId = null

    // Clean CPF
    const cpf = data.patientData.cpf.replace(/\D/g, '')

    if (cpf) {
        const { data: existing } = await supabase.from('patients').select('id').eq('cpf', cpf).single()
        patientId = existing?.id
    }

    if (!patientId) {
        // Create new
        const { data: newPatient, error: createError } = await supabase.from('patients').insert({
            name: data.patientData.name,
            phone: data.patientData.phone,
            cpf: cpf || null, // Allow null if empty? Form enforces it visually but logic handles it.
            marketing_source: 'site_agendamento'
        }).select('id').single()

        if (createError) {
            console.error(createError)
            return { error: 'Erro ao criar cadastro.' }
        }
        patientId = newPatient.id
    }

    // 2. Calculate End Time
    // We need service price/duration
    const { data: service } = await supabase.from('services').select('price, duration').eq('id', data.serviceId).single()
    if (!service) return { error: 'Serviço não encontrado' }

    const startTime = `${data.date}T${data.time}:00`
    const [h, m] = data.time.split(':').map(Number)
    const endDate = new Date(`${data.date}T12:00:00`) // Dummy base
    endDate.setHours(h, m + service.duration)
    const endTimeStr = endDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    const endTime = `${data.date}T${endTimeStr}:00`

    // 3. Create Appointment
    const { error } = await supabase.from('appointments').insert({
        patient_id: patientId,
        professional_id: data.professionalId,
        service_id: data.serviceId,
        start_time: startTime,
        end_time: endTime,
        price: service.price,
        status: 'scheduled', // Direct to scheduled? Or pending? User didn't specify approval.
        notes: '[Online] Agendado pelo site'
    })

    if (error) {
        console.error(error)
        return { error: 'Erro ao criar agendamento. Horário pode ter sido ocupado.' }
    }

    return { success: true }
}
