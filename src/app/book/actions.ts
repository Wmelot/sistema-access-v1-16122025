'use server'

import { getBrazilDate, getBrazilDay, getBrazilHour } from "@/lib/date-utils"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { addMinutes, format, isBefore, parseISO, startOfDay, addDays, differenceInCalendarDays } from "date-fns"
import { sendMessage } from "@/app/dashboard/[slug]/settings/communication/actions"
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
                online_booking_enabled,
                min_advance_booking_days
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

// 2. Fetch Availability (Public) - Enhanced with Smart Rules
export async function getPublicAvailability(professionalId: string, dateStr: string, durationMinutes: number, serviceId?: string) {
    const supabase = await createAdminClient()
    const dayOfWeek = getBrazilDay(new Date(dateStr + 'T12:00:00'))

    // 1. Get Service Details
    let serviceName = ''
    if (serviceId) {
        const { data: s } = await supabase.from('services').select('name').eq('id', serviceId).single()
        serviceName = s?.name || ''
    }
    const isConsulta = serviceName.toLowerCase().includes('consulta') || serviceName.toLowerCase().includes('avaliação')

    // 2. Get Professional Config & Rules
    const { data: profile } = await supabase
        .from('profiles')
        .select('slot_interval, online_booking_enabled, min_advance_booking_days, smart_scheduling_mode, anchor_times, id')
        .eq('id', professionalId)
        .single()

    if (profile?.online_booking_enabled === false) return []

    // 3. Scheduling Rules (Location Allocation)
    const { data: rules } = await supabase
        .from('scheduling_rules')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false })

    // Determine Logic Location
    let targetLocationId: string | null = null

    if (rules && rules.length > 0) {
        for (const rule of rules) {
            // Match Professional (if rule has one)
            if (rule.professional_id && rule.professional_id !== professionalId) continue
            // Match Service Keyword (if rule has one)
            if (rule.service_keyword && !serviceName.toLowerCase().includes(rule.service_keyword.toLowerCase())) continue

            // Match Found!
            targetLocationId = rule.location_id
            break
        }
    }

    // 4. Get Working Hours (Normal + Exceptions)
    let dailyStartMins: number | null = null
    let dailyEndMins: number | null = null

    // 4a. Check for Specific Exception (Saturdays or specific dates)
    const { data: exception } = await supabase
        .from('professional_schedule_exceptions')
        .select('*')
        .eq('profile_id', professionalId)
        .eq('date', dateStr)
        .single()

    if (exception) {
        if (exception.is_blocked) return [] // Date is manually blocked
        dailyStartMins = timeToMinutes(exception.start_time)
        dailyEndMins = timeToMinutes(exception.end_time)
    } else {
        // 4b. Normal Weekly Availability
        const { data: availability } = await supabase
            .from('professional_availability')
            .select('start_time, end_time')
            .eq('profile_id', professionalId)
            .eq('day_of_week', dayOfWeek)
            .single()

        if (!availability) return [] // No normal availability and no exception
        dailyStartMins = timeToMinutes(availability.start_time)
        dailyEndMins = timeToMinutes(availability.end_time)
    }

    if (dailyStartMins === null || dailyEndMins === null) return []

    // 5. Get Existing Appointments (to check overlaps)
    const { data: allAppointments } = await supabase
        .from('appointments')
        .select('start_time, end_time, professional_id, location_id, status, type')
        .gte('start_time', `${dateStr}T00:00:00-03:00`)
        .lte('end_time', `${dateStr}T23:59:59-03:00`)
        .neq('status', 'cancelled')

    const clinicAppointments = allAppointments || []

    const getMins = (iso: string) => {
        const d = new Date(iso);
        const parts = new Intl.DateTimeFormat('pt-BR', {
            hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Sao_Paulo'
        }).formatToParts(d);
        const hh = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
        const mm = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
        return hh * 60 + mm;
    };

    // 6. Get Locations Data (Capacity)
    const { data: locations } = await supabase.from('locations').select('id, name, capacity')
    const gym = locations?.find(l => l.name === 'Ginásio')
    const offices = locations?.filter(l => l.name.startsWith('Consultório')) || []

    if (profile?.min_advance_booking_days && profile.min_advance_booking_days > 0) {
        const today = startOfDay(getBrazilDate());
        const reqDate = startOfDay(new Date(dateStr + 'T12:00:00'));

        const diffDays = differenceInCalendarDays(reqDate, today);

        if (diffDays <= profile.min_advance_booking_days) {
            console.log(`[getPublicAvailability] Blocking date ${dateStr}: ${diffDays} days diff is <= ${profile.min_advance_booking_days} min advance`);
            return [];
        }
    }

    const proBusySlots = clinicAppointments
        .filter(a => a.professional_id === professionalId || (a.type === 'block' && !a.professional_id))
        .map(app => ({ start: getMins(app.start_time), end: getMins(app.end_time) }))

    // Google Calendar Sync
    const { data: integ } = await supabase.from('professional_integrations').select('*').eq('profile_id', professionalId).eq('provider', 'google_calendar').single()
    if (integ) {
        const timeMin = `${dateStr}T00:00:00-03:00`
        const timeMax = `${dateStr}T23:59:59-03:00`
        const googleEvents = await getCalendarEvents(integ.access_token, integ.refresh_token, new Date(timeMin).toISOString(), new Date(timeMax).toISOString())
        if (googleEvents) {
            googleEvents.forEach((evt: any) => {
                const s = timeToMinutes(new Date(evt.start.dateTime || evt.start.date).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }))
                const e = timeToMinutes(new Date(evt.end.dateTime || evt.end.date).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }))
                proBusySlots.push({ start: s, end: e })
            })
        }
    }

    // 8. Generate Slots
    let slots: number[] = []
    const step = profile?.slot_interval || 30

    // Advance Booking Check
    if (profile?.min_advance_booking_days && profile.min_advance_booking_days > 0) {
        const today = startOfDay(getBrazilDate());
        const reqDate = startOfDay(new Date(dateStr + 'T12:00:00'));

        // Calculate difference in calendar days
        const diffDays = Math.round((reqDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < profile.min_advance_booking_days) {
            console.log(`[getPublicAvailability] Blocking date ${dateStr} due to min_advance_booking_days rule: ${diffDays} < ${profile.min_advance_booking_days}`);
            return [];
        }
    }

    let currentMins = dailyStartMins
    const endMins = dailyEndMins

    while (currentMins + durationMinutes <= endMins) {
        const slotStart = currentMins
        const slotEnd = currentMins + durationMinutes

        const isProBusy = proBusySlots.some(busy => (slotStart < busy.end && slotEnd > busy.start))

        let hasRoom = false
        if (!isProBusy) {
            const overlappingApps = clinicAppointments.filter(app => {
                const aStart = getMins(app.start_time)
                const aEnd = getMins(app.end_time)
                return (slotStart < aEnd && slotEnd > aStart)
            })

            const checkCapacity = (locId: string) => {
                const loc = locations?.find(l => l.id === locId)
                if (!loc) return false
                const load = overlappingApps.filter(a => a.location_id === locId).length
                return load < loc.capacity
            }

            if (targetLocationId) {
                hasRoom = checkCapacity(targetLocationId)
            } else {
                if (isConsulta || !gym) {
                    hasRoom = offices.some(off => checkCapacity(off.id))
                } else {
                    hasRoom = checkCapacity(gym.id) || offices.some(off => checkCapacity(off.id))
                }
            }
        }

        if (!isProBusy && hasRoom) {
            slots.push(slotStart)
        }
        currentMins += step
    }

    // 9. Smart Optimization Filtering
    const mode = profile?.smart_scheduling_mode || 'open'
    const anchors = (profile?.anchor_times || ['08:00', '14:00']).map(timeToMinutes)

    if (mode === 'open') {
        return slots.map(minutesToTime)
    }

    // --- SMART ALGORITHM REFINEMENT ---
    // Goal: Prioritize adjacency to existing appointments and early slots (anchors).
    // Avoid creating isolated slots late in the day or large gaps.

    const busyStarts = proBusySlots.map(b => b.start)
    const busyEnds = proBusySlots.map(b => b.end)

    const scoredSlots = slots.map(s => {
        let score = 0
        const slotEnd = s + durationMinutes

        // 1. Adjacency Bonus (Strongest)
        const isAdjacentToFinish = busyEnds.some(end => Math.abs(end - s) <= 5)
        const isAdjacentToStart = busyStarts.some(start => Math.abs(start - slotEnd) <= 5)

        if (isAdjacentToFinish || isAdjacentToStart) {
            score += 100
        }

        // 2. Anchor Bonus (Base preference)
        const isAnchor = anchors.some((a: number) => Math.abs(a - s) <= 5)
        if (isAnchor) {
            score += 50
        }

        // 3. Dispersion Penalty (Avoid large gaps)
        // If it's NOT adjacent to anything, calculate distance to nearest appointment
        if (!isAdjacentToFinish && !isAdjacentToStart && proBusySlots.length > 0) {
            const minPadding = Math.min(...proBusySlots.map(b => {
                const d1 = Math.abs(b.end - s)
                const d2 = Math.abs(b.start - slotEnd)
                return Math.min(d1, d2)
            }))

            // Penalty increases with distance. Gaps > 120 mins are penalized heavily.
            if (minPadding > 120) score -= 150
            else score -= minPadding / 2
        }

        return { time: s, score }
    })

    // Sort by score (descending) and then by time (ascending)
    let optimizedSlots = scoredSlots
        .filter(s => s.score > -100) // Filter out heavily penalized isolated slots
        .sort((a: { score: number, time: number }, b: { score: number, time: number }) => (b.score - a.score) || (a.time - b.time))
        .map(s => s.time)

    // Limit to 6 slots for variety but keep it curated
    if (optimizedSlots.length > 6) {
        optimizedSlots = optimizedSlots.slice(0, 6)
    }

    // Re-sort final selection chronologically for UI
    return optimizedSlots.sort((a, b) => a - b).map(minutesToTime)
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
        injuryRegion: string // [NEW]
        email?: string
    }
}) {
    const supabase = await createAdminClient()

    // 1. Find or Create Patient
    let patientId = null

    // [MODIFIED] Get Professional Organization FIRST to ensure all new data is linked
    const { data: profProfile } = await supabase.from('profiles').select('organization_id').eq('id', data.professionalId).single()
    const organizationId = profProfile?.organization_id

    if (!organizationId) {
        console.error("Critical: Public booking for professional without organization:", data.professionalId)
        return { error: 'Este profissional não está configurado corretamente.' }
    }

    // Clean CPF
    const cpf = data.patientData.cpf.replace(/\D/g, '')

    if (cpf) {
        const { data: existing } = await supabase.from('patients').select('id, organization_id').eq('cpf', cpf).single()
        patientId = existing?.id
    }

    if (!patientId) {
        // Create new
        const { data: newPatient, error: createError } = await supabase.from('patients').insert({
            organization_id: organizationId,
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

    // 2.2. [NEW] PREVENT OVERLAPS - Critical safety check
    const { data: existingAppts } = await supabase
        .from('appointments')
        .select('id')
        .eq('professional_id', data.professionalId)
        .lt('start_time', endTime)
        .gt('end_time', startTime)
        .neq('status', 'cancelled')

    if (existingAppts && existingAppts.length > 0) {
        return { error: 'Desculpe, este horário acabou de ser ocupado. Por favor, escolha outro.' }
    }

    // 3. Create Appointment
    const { data: newAppt, error } = await supabase.from('appointments').insert({
        patient_id: patientId,
        professional_id: data.professionalId,
        service_id: data.serviceId,
        location_id: locationId,
        organization_id: organizationId, // [FIXED] Linked to Org!
        start_time: startTime,
        end_time: endTime,
        price: service.price,
        status: 'scheduled',
        notes: `[Online] Agendado pelo site. Queixa: ${data.patientData.injuryRegion}`,
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
        const { sendAppointmentMessage } = await import('@/app/dashboard/[slug]/settings/communication/actions')
        // Don't await strictly to speed up UI response, but catching errors is good practice
        sendAppointmentMessage(newAppt.id, 'confirmation').catch((e: any) => console.error("Confirmation Msg Error:", e))
    } catch (msgErr) {
        console.error("Msg Import Error:", msgErr)
    }

    return { success: true }
}

// 4. Add to Waitlist
export async function addToWaitlist(data: {
    serviceId: string,
    professionalId: string,
    date: string,
    patientData: {
        name: string,
        phone: string,
        cpf?: string
    },
    preference: string,
    preferredDays?: string[],
    organizationId?: string
}) {
    const supabase = await createAdminClient()

    // Ensure we have an organization_id if not provided (fallback to professional's org)
    let finalOrgId = data.organizationId
    if (!finalOrgId) {
        const { data: pro } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', data.professionalId)
            .single()
        finalOrgId = pro?.organization_id
    }

    const { error } = await supabase.from('waiting_list').insert({
        service_id: data.serviceId,
        professional_id: data.professionalId,
        date: data.date,
        patient_name: data.patientData.name,
        patient_phone: data.patientData.phone,
        preference: data.preference,
        preferred_days: data.preferredDays || [],
        organization_id: finalOrgId,
        status: 'pending'
    })

    if (error) {
        console.error('Waitlist Error:', error)
        throw error
    }

    // --- NOTIFICATIONS ---
    try {
        // 1. Get Professional Details & Preferences
        const { data: pro } = await supabase
            .from('profiles')
            .select('full_name, phone, notify_whatsapp, notify_email')
            .eq('id', data.professionalId)
            .single()

        if (pro) {
            const dateStr = format(parseISO(data.date), 'dd/MM/yyyy')

            const turnos: Record<string, string> = {
                'morning': 'Manhã',
                'afternoon': 'Tarde',
                'night': 'Noite',
                'any': 'Qualquer',
                'Manhã': 'Manhã',
                'Tarde': 'Tarde',
                'Noite': 'Noite',
                'Qualquer': 'Qualquer'
            }
            const turno = turnos[data.preference] || 'Qualquer'

            const msgContent = `📝 Nova entrada na Lista de Espera\nPaciente: ${data.patientData.name}\nData desejada: ${dateStr}\nTurno: ${turno}`

            // 2. Create Internal Reminder (Dashboard Widget)
            await supabase.from('reminders').insert({
                user_id: data.professionalId,
                organization_id: finalOrgId,
                creator_id: data.professionalId,
                content: `Lista de Espera: ${data.patientData.name} | ${data.patientData.phone} | ${dateStr}`,
                due_date: new Date().toISOString(),
                is_read: false,
                status: 'pending'
            })

            // 3. Send WhatsApp if enabled
            if (pro.notify_whatsapp && pro.phone) {
                await sendMessage(pro.phone, msgContent)
            }
        }
    } catch (notifErr) {
        console.error("Waitlist Notification Error:", notifErr)
    }

    return { success: true }
}
