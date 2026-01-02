'use server'

import { getBrazilDate, getBrazilDay, getBrazilHour } from "@/lib/date-utils"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { addMinutes, format, isBefore, parseISO, startOfDay } from "date-fns"
import { sendMessage } from "@/app/dashboard/settings/communication/actions"
import { getCalendarEvents, insertCalendarEvent } from "@/lib/google"

// 1. Fetch Professionals linked to a Service
export async function getProfessionalsForService(serviceId: string) {
    const supabase = await createAdminClient()

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

    return data
        .map((item: any) => item.profiles)
        .filter((p: any) => p && p.online_booking_enabled !== false)
}

// 2. Fetch Availability (Public) - Enhanced with Room Capacity & Rules
export async function getPublicAvailability(professionalId: string, dateStr: string, durationMinutes: number, serviceId?: string) {
    const supabase = await createAdminClient()
    const dayOfWeek = getBrazilDay(new Date(dateStr + 'T12:00:00'))

    // 1. Get Service Details (needed for rules)
    let serviceName = ''
    if (serviceId) {
        const { data: s } = await supabase.from('services').select('name').eq('id', serviceId).single()
        serviceName = s?.name || ''
    }
    const isPalmilhaDelivery = serviceName.toLowerCase().includes('entrega') && serviceName.toLowerCase().includes('palmilha')
    const isConsulta = serviceName.toLowerCase().includes('consulta') || serviceName.toLowerCase().includes('avaliação')
    const isAtendimento = !isConsulta && !isPalmilhaDelivery

    // 2. Get Working Hours for that day
    const { data: availability } = await supabase
        .from('professional_availability')
        .select('start_time, end_time')
        .eq('profile_id', professionalId)
        .eq('day_of_week', dayOfWeek)

    if (!availability || availability.length === 0) return []

    // 3. Get ALL Appointments for the Clinic for that Day (to check Rooms)
    const { data: allAppointments } = await supabase
        .from('appointments')
        .select('start_time, end_time, professional_id, location_id, status')
        .gte('start_time', `${dateStr}T00:00:00-03:00`)
        .lte('end_time', `${dateStr}T23:59:59-03:00`)
        .neq('status', 'cancelled')

    const clinicAppointments = allAppointments || []

    // 4. Rule: "Entrega de Palmilha" only if Pro has other appointments
    if (isPalmilhaDelivery) {
        const proApps = clinicAppointments.filter(a => a.professional_id === professionalId)
        if (proApps.length === 0) {
            return []
        }
    }

    // 5. Get Locations
    const { data: locations } = await supabase.from('locations').select('id, name, capacity')
    const gym = locations?.find(l => l.name === 'Ginásio')
    const offices = locations?.filter(l => l.name.startsWith('Consultório')) || []

    // 6. Generate Slots
    // Parse Pro's appointments specifically for collision
    const proAppointments = clinicAppointments.filter(a => a.professional_id === professionalId)
    const proBusySlots = proAppointments.map(app => ({
        start: timeToMinutes(new Date(app.start_time).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })),
        end: timeToMinutes(new Date(app.end_time).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }))
    }))

    // [NEW] Google Calendar Integration Check
    const { data: integ } = await supabase
        .from('professional_integrations')
        .select('*')
        .eq('profile_id', professionalId)
        .eq('provider', 'google_calendar')
        .single()

    if (integ) {
        // Fetch busy slots from Google Calendar
        // We fetch for the whole day in UTC to cover timezone differences safely
        const timeMin = `${dateStr}T00:00:00-03:00`
        const timeMax = `${dateStr}T23:59:59-03:00`

        const googleEvents = await getCalendarEvents(integ.access_token, integ.refresh_token, new Date(timeMin).toISOString(), new Date(timeMax).toISOString())

        if (googleEvents && googleEvents.length > 0) {
            googleEvents.forEach((evt: any) => {
                const start = evt.start.dateTime || evt.start.date
                const end = evt.end.dateTime || evt.end.date

                // Convert to minutes
                const sMins = timeToMinutes(new Date(start).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }))
                const eMins = timeToMinutes(new Date(end).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }))

                proBusySlots.push({ start: sMins, end: eMins })
            })
        }
    }

    const { data: profile } = await supabase.from('profiles').select('slot_interval, online_booking_enabled, min_advance_booking_days').eq('id', professionalId).single()
    if (profile?.online_booking_enabled === false) return []

    // Advance Booking Buffer
    if (profile?.min_advance_booking_days && profile.min_advance_booking_days > 0) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const minDate = new Date(today)
        minDate.setDate(today.getDate() + profile.min_advance_booking_days)
        const [year, month, day] = dateStr.split('-').map(Number)
        const reqDate = new Date(year, month - 1, day)
        reqDate.setHours(0, 0, 0, 0)
        if (reqDate < minDate) return []
    }

    const step = profile?.slot_interval || 30
    const freeSlots: string[] = []

    for (const block of availability) {
        let currentMins = timeToMinutes(block.start_time)
        const endMins = timeToMinutes(block.end_time)

        while (currentMins + durationMinutes <= endMins) {
            const slotStart = currentMins
            const slotEnd = currentMins + durationMinutes

            // A. Check Professional Busyness
            const isProBusy = proBusySlots.some(busy => (slotStart < busy.end && slotEnd > busy.start))

            // B. Check Room Capacity
            let hasRoom = false

            if (!isProBusy) {
                const overlappingApps = clinicAppointments.filter(app => {
                    const aStart = timeToMinutes(new Date(app.start_time).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }))
                    const aEnd = timeToMinutes(new Date(app.end_time).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }))
                    return (slotStart < aEnd && slotEnd > aStart)
                })

                if (isAtendimento) {
                    // Check Gym
                    if (gym) {
                        const gymLoad = overlappingApps.filter(a => a.location_id === gym.id).length
                        if (gymLoad < gym.capacity) hasRoom = true
                    }
                    // Fallback Office
                    if (!hasRoom) {
                        hasRoom = offices.some(off => {
                            const offLoad = overlappingApps.filter(a => a.location_id === off.id).length
                            return offLoad < off.capacity
                        })
                    }
                } else { // Consulta/Eval/Delivery
                    hasRoom = offices.some(off => {
                        const offLoad = overlappingApps.filter(a => a.location_id === off.id).length
                        return offLoad < off.capacity
                    })
                }
            }

            if (!isProBusy && hasRoom) {
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
        cpf: string
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
            cpf: cpf || null,
            marketing_source: 'site_agendamento'
        }).select('id').single()

        if (createError) {
            console.error(createError)
            return { error: 'Erro ao criar cadastro.' }
        }
        patientId = newPatient.id
    }

    // 2. Calculate End Time (Hardcoded BRT -03:00)
    const { data: service } = await supabase.from('services').select('price, duration').eq('id', data.serviceId).single()
    if (!service) return { error: 'Serviço não encontrado' }

    // FORCE Brazil Timezone interpretation
    // We construct the time string with explicit -03:00 offset
    const startStr = `${data.date}T${data.time}:00-03:00`
    const sDate = parseISO(startStr)
    const eDate = addMinutes(sDate, service.duration)

    // Helper to force -03:00 string output regardless of server timezone
    const toFixedOffset = (d: Date) => {
        const offset = -3 * 60; // -180 min (Brazil)
        const userTime = new Date(d.getTime() + offset * 60 * 1000);
        return userTime.toISOString().slice(0, 19) + '-03:00';
    }

    const startTime = toFixedOffset(sDate)
    const endTime = toFixedOffset(eDate)

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
    const { data: newAppt, error } = await supabase.from('appointments').insert({
        patient_id: patientId,
        professional_id: data.professionalId,
        service_id: data.serviceId,
        location_id: locationId,
        start_time: startTime,
        end_time: endTime,
        price: service.price,
        status: 'scheduled',
        notes: '[Online] Agendado pelo site'
    }).select().single()

    if (error) {
        console.error(error)
        return { error: 'Erro ao criar agendamento. Horário pode ter sido ocupado.' }
    }

    // [NEW] Sync to Google Calendar
    try {
        const { data: integ } = await supabase
            .from('professional_integrations')
            .select('*')
            .eq('profile_id', data.professionalId)
            .eq('provider', 'google_calendar')
            .single()

        if (integ) {
            const event = {
                summary: `Agendamento: ${data.patientData.name}`,
                description: `Serviço: ${serviceDetails?.name || 'Consulta'}\n[Online] Agendado pelo site\nTel: ${data.patientData.phone}`,
                start: { dateTime: startTime },
                end: { dateTime: endTime },
            }

            const googleEvent = await insertCalendarEvent(integ.access_token, integ.refresh_token, event)

            if (googleEvent && googleEvent.id) {
                await supabase
                    .from('appointments')
                    .update({ google_event_id: googleEvent.id })
                    .eq('id', newAppt.id)
            }
        }
    } catch (err) {
        console.error("Google Sync Public Appt Error:", err)
    }

    // [NEW] Send Confirmation Message (Async/Fire-and-forget)
    try {
        const { sendAppointmentMessage } = await import('@/app/dashboard/settings/communication/actions')
        // Don't await strictly to speed up UI response, but catching errors is good practice
        sendAppointmentMessage(newAppt.id, 'confirmation').catch(e => console.error("Confirmation Msg Error:", e))
    } catch (msgErr) {
        console.error("Msg Import Error:", msgErr)
    }

    return { success: true }
}

// 4. Add to Waitlist
export async function addToWaitlist(data: {
    serviceId: string
    professionalId: string
    date: string
    patientData: {
        name: string
        phone: string
        cpf?: string
    }
    preference: string
}) {
    const supabase = await createAdminClient()

    const { error } = await supabase.from('waiting_list').insert({
        service_id: data.serviceId,
        professional_id: data.professionalId,
        date: data.date,
        patient_name: data.patientData.name,
        patient_phone: data.patientData.phone,
        preference: data.preference,
        status: 'pending'
    })

    if (error) {
        console.error('Error adding to waitlist:', error)
        throw new Error('Failed to add to waitlist')
    }

    // --- NOTIFICATIONS ---
    try {
        // 1. Get Professional Details & Preferences
        const { data: pro } = await supabase
            .from('profiles')
            .select('full_name, phone, notify_whatsapp, notify_email') // Columns added in migration
            .eq('id', data.professionalId)
            .single()

        if (pro) {
            const dateStr = format(parseISO(data.date), 'dd/MM/yyyy')

            const turnos: Record<string, string> = {
                'morning': 'Manhã',
                'afternoon': 'Tarde',
                'night': 'Noite',
                'any': 'Qualquer'
            }
            const turno = turnos[data.preference] || 'Qualquer'

            const msgContent = `📝 Nova entrada na Lista de Espera\nPaciente: ${data.patientData.name}\nData desejada: ${dateStr}\nTurno: ${turno}`

            // 2. Create Internal Reminder (Dashboard Widget)
            // We use createAdminClient so we can insert for another user
            // We assume a format "Lista de Espera: Name | Phone | Date" for easier parsing in the widget
            await supabase.from('reminders').insert({
                user_id: data.professionalId,
                creator_id: data.professionalId, // Self-assigned or system
                content: `Lista de Espera: ${data.patientData.name} | ${data.patientData.phone} | ${dateStr}`,
                due_date: new Date().toISOString(),
                is_read: false,
                status: 'pending'
            })

            // 3. Send WhatsApp if enabled
            if ((pro as any).notify_whatsapp && pro.phone) {
                await sendMessage(pro.phone, `*Sistema Access:*\n${msgContent}\n\nAcesse o sistema para ver detalhes e agendar.`)
            }
        }
    } catch (notifyError) {
        console.error("Failed to process notifications for waitlist:", notifyError)
        // Do not block the user success response if notification fails
    }

    return { success: true }
}
