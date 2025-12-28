'use server'

import { getBrazilDay } from "@/lib/date-utils"

import { createClient, createAdminClient } from "@/lib/supabase/server"

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
                specialty,
                online_booking_enabled
            )
        `)
        .eq('service_id', serviceId)

    if (error) {
        console.error('Error fetching professionals:', error)
        return []
    }

    // Flatten logic & Filter
    return data
        .map((item: any) => item.profiles)
        .filter((p: any) => p && p.online_booking_enabled !== false)
}

// 2. Fetch Availability (Public)
// Reuses logic from `schedule/actions` but simplified for public view (only free slots).
export async function getPublicAvailability(professionalId: string, dateStr: string, durationMinutes: number) {
    const supabase = await createClient()
    const dayOfWeek = getBrazilDay(new Date(dateStr + 'T12:00:00')) // Avoid timezone shift

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
    const { data: profile } = await supabase.from('profiles').select('slot_interval, online_booking_enabled, min_advance_booking_days').eq('id', professionalId).single()

    // 1. Check if Online Booking is Enabled
    if (profile?.online_booking_enabled === false) return []

    // 2. Check Advance Booking Buffer
    if (profile?.min_advance_booking_days && profile.min_advance_booking_days > 0) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const minDate = new Date(today)
        minDate.setDate(today.getDate() + profile.min_advance_booking_days)

        // Parse dateStr (YYYY-MM-DD) carefully
        const [year, month, day] = dateStr.split('-').map(Number)
        const reqDate = new Date(year, month - 1, day) // Month is 0-indexed
        reqDate.setHours(0, 0, 0, 0)

        if (reqDate < minDate) {
            return [] // Date is too soon
        }
    }

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
    const supabase = await createAdminClient()

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

    // 2. Calculate End Time (Hardcoded BRT -03:00 for simplicity as system is localized)
    const { data: service } = await supabase.from('services').select('price, duration').eq('id', data.serviceId).single()
    if (!service) return { error: 'Serviço não encontrado' }

    // FORCE Brazil Timezone interpretation
    const startTime = `${data.date}T${data.time}:00-03:00`

    // Calculate End Time using Timestamps to strictly add minutes
    const startObj = new Date(startTime) // This parses the ISO with offset correctly
    const endObj = new Date(startObj.getTime() + service.duration * 60000)

    // Format End Time ISO with generic Z or retain offset?
    // Supabase works best with ISO strings. 
    // toISOString() returns UTC (Z). This is fine, as long as the Point in Time is correct.
    // 14:00-03:00 = 17:00 UTC.
    // end at 14:45-03:00 = 17:45 UTC.
    // When DB returns, it returns UTC. Front-end converts to Local.

    // HOWEVER, to be safe and consistent with previous logic if any:
    const endTime = endObj.toISOString()

    // 2.5. Assign Location (Room) Logic
    let locationId = null
    const { data: serviceDetails } = await supabase.from('services').select('name').eq('id', data.serviceId).single()
    const serviceNameLower = serviceDetails?.name?.toLowerCase() || ''

    // Fetch all locations
    const { data: allLocations } = await supabase.from('locations').select('id, name, capacity')

    if (allLocations && allLocations.length > 0) {
        const isConsulta = serviceNameLower.includes('consulta') || serviceNameLower.includes('avaliação')
        const isAtendimento = !isConsulta

        const gym = allLocations.find(l => l.name === 'Ginásio')
        const offices = allLocations.filter(l => l.name.startsWith('Consultório'))

        // Helper to check load
        const checkLocationLoad = async (locId: string, cap: number) => {
            const { count } = await supabase
                .from('appointments')
                .select('*', { count: 'exact', head: true })
                .eq('location_id', locId)
                // Overlap: Start < EndB AND End > StartB
                .lt('start_time', endTime)
                .gt('end_time', startTime)
                .neq('status', 'cancelled')

            return (count || 0) < cap
        }

        // 1. Atendimento Logic (Gym -> Office)
        if (isAtendimento && gym) {
            if (await checkLocationLoad(gym.id, gym.capacity)) {
                locationId = gym.id
            } else {
                // Gym full, try offices
                for (const off of offices) {
                    if (await checkLocationLoad(off.id, off.capacity)) {
                        locationId = off.id
                        break
                    }
                }
            }
        }

        // 2. Consulta Logic (Office Only) OR Fallback from Atendimento
        if ((isConsulta || (isAtendimento && !locationId))) {
            for (const off of offices) {
                if (await checkLocationLoad(off.id, off.capacity)) {
                    locationId = off.id
                    break
                }
            }
        }
    }

    // 3. Create Appointment
    const { error } = await supabase.from('appointments').insert({
        patient_id: patientId,
        professional_id: data.professionalId,
        service_id: data.serviceId,
        location_id: locationId, // Auto-assigned
        start_time: startTime,
        end_time: endTime,
        price: service.price,
        status: 'scheduled',
        notes: '[Online] Agendado pelo site'
    })

    if (error) {
        console.error(error)
        return { error: 'Erro ao criar agendamento. Horário pode ter sido ocupado.' }
    }

    return { success: true }
}
