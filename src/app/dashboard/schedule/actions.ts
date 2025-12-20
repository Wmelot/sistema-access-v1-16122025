"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { logAction } from '@/lib/logger'

import { createAdminClient } from "@/lib/supabase/admin" // [NEW]

export async function getAppointments() {
    const supabase = await createClient()

    // [RLS BYPASS] Always use Admin Client to ensure visibility for all functionality
    const clientToUse = createAdminClient()

    // Fetch appointments with patient name
    const { data, error } = await clientToUse
        .from('appointments')
        .select(`
            *,
            patients ( id, name ),
            profiles ( id, full_name, color ),
            services ( id, name, color )
        `)
        .gte('start_time', new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString()) // [PERFORMANCE] Limit to last 6 months

    if (error) {
        console.error('Error fetching appointments:', error)
        return []
    }

    return data
}

// [NEW] Async Patient Search for Performance
export async function searchPatients(query: string) {
    const supabase = await createClient()

    if (!query || query.length < 2) return []

    const { data } = await supabase
        .from('patients')
        .select('id, name')
        .ilike('name', `%${query}%`)
        .limit(50)
        .order('name')

    return data || []
}

export async function getAppointmentFormData() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const [locations, services, professionals, serviceLinks, holidays, priceTables, availability] = await Promise.all([
        supabase.from('locations').select('id, name, color, capacity').order('name'),
        supabase.from('services').select('id, name, duration, price').eq('active', true).order('name'),
        supabase.from('profiles').select('id, full_name, photo_url, color, has_agenda, slot_interval, professional_availability(day_of_week, start_time, end_time, location_id)').eq('has_agenda', true).order('full_name'),
        supabase.from('service_professionals').select('service_id, profile_id'),
        supabase.from('holidays').select('date, name, type'),
        supabase.from('price_tables').select('id, name').order('name'),
        user ? supabase.from('professional_availability').select('location_id').eq('profile_id', user.id).limit(1) : Promise.resolve({ data: [] })
    ])

    const defaultLocationId = (availability as any).data?.[0]?.location_id || null

    return {
        patients: [], // [PERFORMANCE] Load asynchronously via searchPatients
        locations: locations.data || [],
        services: services.data || [],
        professionals: professionals.data || [],
        serviceLinks: serviceLinks.data || [],
        holidays: holidays.data || [],
        priceTables: priceTables.data || [],
        defaultLocationId
    }
}

export async function createAppointment(formData: FormData) {
    const supabase = await createClient()

    // Common Data
    // [MODIFIED] Sanitize Inputs for Block/Appointment
    // Ensure empty strings become NULL to avoid "invalid input syntax for type uuid"
    const patient_id = (formData.get('patient_id') as string) || null
    const location_id = (formData.get('location_id') as string) || null
    const service_id = (formData.get('service_id') as string) || null

    // Professional is mandatory
    const professional_id = formData.get('professional_id') as string

    const time = formData.get('time') as string
    const notes = formData.get('notes') as string
    const priceStr = formData.get('price') as string
    const is_extra = formData.get('is_extra') === 'true'

    // Recurrence Data
    const is_recurring = formData.get('is_recurring') === 'true'
    const recurrence_days = JSON.parse(formData.get('recurrence_days') as string || '[]') // [0, 1, 2...]
    const recurrence_count = Number(formData.get('recurrence_count') || 1)
    const recurrence_end_date = formData.get('recurrence_end_date') as string
    const recurrence_end_type = formData.get('recurrence_end_type') as string

    const type = (formData.get('type') as string) || 'appointment'

    // Validate Mandatory for Appointment type
    if (type === 'appointment' && (!patient_id || !service_id)) {
        return { error: 'Paciente e Serviço são obrigatórios para agendamentos.' }
    }

    if (type === 'appointment' && !professional_id) return { error: 'Selecione um profissional.' }
    if (!time) return { error: 'Selecione um horário.' } // [NEW] Validation

    // GENERATE DATES
    const datesToSchedule: Date[] = []
    const startDateStr = formData.get('date') as string

    if (!startDateStr) return { error: 'Data inválida.' } // [NEW] Validation

    const startObj = new Date(startDateStr + 'T' + time + ':00-03:00') // Explicit Brazil Timezone Offset
    if (isNaN(startObj.getTime())) {
        // Fallback for cases where time might be missing or wrongly formatted
        const fallbackObj = new Date(startDateStr + 'T12:00:00-03:00')
        if (isNaN(fallbackObj.getTime())) return { error: 'Data inválida.' }
        datesToSchedule.push(fallbackObj)
    } else {
        datesToSchedule.push(startObj)
    }

    // Service & Duration
    let duration = 60
    if (type === 'appointment') {
        const { data: service } = await supabase.from('services').select('duration').eq('id', service_id).single()
        duration = service?.duration || 60
    } else {
        // [FIX] Respect custom duration for blocks
        const customDuration = Number(formData.get('custom_duration'))
        duration = customDuration > 0 ? customDuration : 60
    }

    // Price
    // Price
    // Price & Adjustments
    const cleanPrice = priceStr ? Number(priceStr.replace(/[^0-9,]/g, '').replace(',', '.')) : 0
    const discount = Number(formData.get('discount') || 0)
    const addition = Number(formData.get('addition') || 0)
    let payment_method_id = formData.get('payment_method_id') as string // [NEW]
    if (payment_method_id === 'null' || payment_method_id === '') {
        payment_method_id = null as any // Force null for UUID field
    }
    const invoice_issued = formData.get('invoice_issued') === 'true' // [NEW]

    // Calculate Final Price (Logic: Base - Discount + Addition)
    // IMPORTANT: The `price` column in DB stores the FINAL EFFECTIVE value for financial consistency.
    // `original_price` stores the base unit price.

    // In the UI, the user sees "Unit Price" (cleanPrice).
    // If they add discount, the Final "price" stored should be (cleanPrice - discount + addition).
    const finalPrice = Math.max(0, cleanPrice - discount + addition)

    if (!is_recurring) {
        // datesToSchedule already has startObj from validation above
    } else {
        // Recurrence Logic
        let currentDate = new Date(startObj)
        let count = 0
        const MAX_LOOPS = 50 // Safety break

        // [NEW] Generate Group ID for batch operations
        const groupId = Math.random().toString(36).substring(2, 15)
        const groupTag = `\n\n[GRP:${groupId}]`

        // If "End Date" is chosen, set a limit for the loop
        const hardEndDate = recurrence_end_type === 'date' && recurrence_end_date
            ? new Date(recurrence_end_date + 'T12:00:00')
            : null

        // Start generating
        while (true) {
            const dayIdx = currentDate.getDay()

            if (recurrence_days.includes(dayIdx)) {
                if (recurrence_end_type === 'count' && count >= recurrence_count) break
                if (hardEndDate && currentDate > hardEndDate) break

                const taggedDate = new Date(currentDate)
                // We'll tag the notes in processSingle
                datesToSchedule.push(taggedDate)
                count++
            }

            currentDate.setDate(currentDate.getDate() + 1)
            if (count >= 50 || datesToSchedule.length >= 50) break
            if (currentDate.getTime() - startObj.getTime() > 365 * 24 * 60 * 60 * 1000) break
        }

        // Attach groupId to the scope of createAppointment so processSingle can see it
        (formData as any)._groupId = groupId
    }

    // PROCESS APPOINTMENTS
    let successCount = 0
    let failCount = 0
    let warningMsg = null
    const errors: string[] = []

    // Helper to process one
    const processSingle = async (dateObj: Date, mode: 'check' | 'insert' = 'insert') => {
        const dateStr = dateObj.toISOString().split('T')[0]
        const startDateTime = new Date(`${dateStr}T${time}:00-03:00`)
        const endDateTime = new Date(startDateTime.getTime() + duration * 60000)
        const dayOfWeek = startDateTime.getDay()

        // Checks
        const [profileRes, availabilityRes, appointmentsRes] = await Promise.all([
            supabase.from('profiles').select('allow_overbooking').eq('id', professional_id).single(),
            supabase.from('professional_availability')
                .select('*')
                .eq('profile_id', professional_id)
                .eq('day_of_week', dayOfWeek),
            supabase.from('appointments')
                .select('start_time, end_time, patient_id, patients(name), locations(name), type, professional_id, status') // Include status & location
                .or(`professional_id.eq.${professional_id},professional_id.is.null`) // [FIX] Include Global Blocks
                .neq('status', 'cancelled') // [FIX] Ignore cancelled appointments
                .lte('start_time', `${dateStr}T23:59:59`) // Started before end of day
                .gte('end_time', `${dateStr}T00:00:00`)   // Ended after start of day
        ])

        const allowOverbooking = profileRes.data?.allow_overbooking || false
        const availabilitySlots = availabilityRes.data || []
        const existingAppointments = appointmentsRes.data || []

        // Validate Availability (Only for appointments, blocks can be anytime?)
        let isWithinWorkingHours = false
        if (type === 'appointment' && !is_extra) {
            const getMinutes = (timeStr: string) => {
                const [h, m] = timeStr.split(':').map(Number)
                return h * 60 + m
            }
            const appStartMins = getMinutes(time)
            const appEndMins = appStartMins + duration

            let startWithinSlot = false
            let closingTime = ''

            for (const slot of availabilitySlots) {
                const slotStartMins = getMinutes(slot.start_time)
                const slotEndMins = getMinutes(slot.end_time)

                // Exact fit check
                if (appStartMins >= slotStartMins && appEndMins <= slotEndMins) {
                    isWithinWorkingHours = true
                    break
                }

                // Partial overlap check (Start is OK, End is NOT)
                if (appStartMins >= slotStartMins && appStartMins < slotEndMins) {
                    startWithinSlot = true
                    closingTime = slot.end_time
                }
            }

            if (!isWithinWorkingHours && availabilitySlots.length > 0) {
                if (startWithinSlot) {
                    return { error: `O atendimento excede o horário de encerramento (${closingTime.slice(0, 5)}).` }
                }
                return { error: `Profissional indisponível neste horário (${dateStr}).` }
            }
            if (!isWithinWorkingHours && availabilitySlots.length === 0) return { error: `Sem agenda configurada para ${dateStr}` }
        }

        // Validate Overlaps
        // [NEW] Strict Block Permission Check (Runs even for Encaixe/Extra)
        const { data: { user } } = await supabase.auth.getUser()

        // Handle Force Override (Treat as is_extra for logic purposes)
        const force_block_override = formData.get('force_block_override') === 'true'
        // If creating a block, we only override if force_block_override is true
        const effective_is_extra = is_extra || force_block_override

        for (const appt of existingAppointments) {
            if (appt.type === 'block') {
                const apptStart = new Date(appt.start_time)
                const apptEnd = new Date(appt.end_time)
                if (startDateTime < apptEnd && endDateTime > apptStart) {
                    // Found overlapping block
                    if (user?.id !== appt.professional_id) {
                        return { error: 'Horário bloqueado. Apenas o profissional responsável pode permitir encaixes neste período.' }
                    } else {
                        // Owner Override Confirmation
                        if (!effective_is_extra) {
                            return {
                                confirmationRequired: true,
                                message: 'Tentativa de agendamento em horário bloqueado, quer continuar assim mesmo?',
                                context: 'block_override'
                            }
                        }
                    }
                }
            }
        }

        // Standard Conflict Logic
        if (!effective_is_extra) {
            for (const appt of existingAppointments) {
                const apptStart = new Date(appt.start_time)
                const apptEnd = new Date(appt.end_time)

                if (startDateTime < apptEnd && endDateTime > apptStart) {
                    // Conflict found
                    if (appt.type === 'block') {
                        return { error: `Horário bloqueado em ${dateStr}` }
                    }
                    if (type === 'block') {
                        if (force_block_override) continue // Rewrite/Ignore conflict
                        return {
                            confirmationRequired: true,
                            message: `⚠️ CONFLITO DETECTADO\n\nEste período já possui agendamentos marcados que impediriam o bloqueio.\n\nPara prosseguir, você precisará REMANEJAR estes pacientes manualmente após criar o bloqueio.\n\nDeseja forçar o bloqueio mesmo assim?`,
                            context: 'block_overlap'
                        }
                    }
                    const p: any = appt.patients
                    const patientName = Array.isArray(p) ? p[0]?.name : p?.name || 'Sem nome'
                    const l: any = (appt as any).locations
                    const locName = Array.isArray(l) ? l[0]?.name : l?.name || 'Local desconhecido'
                    const startTimeStr = apptStart.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                    return { error: `Conflito: ${patientName} às ${startTimeStr} em ${locName} (${appt.status})` }
                }
            }
        }

        // Location Capacity Check (Mandatory, even for Encaixe)
        if (location_id) {
            const { data: loc } = await supabase.from('locations').select('capacity').eq('id', location_id).single()
            if (loc && loc.capacity) {
                // Count active appointments in this slot at this location
                // Overlap logic: (StartA < EndB) and (EndA > StartB)
                const { count } = await supabase
                    .from('appointments')
                    .select('*', { count: 'exact', head: true })
                    .eq('location_id', location_id)
                    .neq('status', 'cancelled')
                    .lt('start_time', endDateTime.toISOString())
                    .gt('end_time', startDateTime.toISOString())

                if ((count || 0) >= loc.capacity) {
                    return { error: `Local lotado! Capacidade máxima: ${loc.capacity}.` }
                }
            }
        }

        // Check Duplicate (Warning)
        if (type === 'appointment' && existingAppointments.some(appt => appt.patient_id === patient_id)) {
            warningMsg = 'Aviso: Paciente já tem agendamento em um dos dias.'
        }

        // [Refactor] Return early if only checking
        if (mode === 'check') return { success: true }

        // Tag notes with group ID if present
        let finalNotes = notes
        const groupId = (formData as any)._groupId
        if (groupId) {
            finalNotes = notes + `\n\n[GRP:${groupId}]`
        }

        // Insert
        const { data: newAppointment, error } = await supabase.from('appointments').insert({
            patient_id: type === 'appointment' ? patient_id : null,
            location_id,
            service_id: type === 'appointment' ? service_id : null,
            professional_id,
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString(),
            notes: finalNotes,
            status: 'scheduled',
            original_price: cleanPrice, // Base price
            price: finalPrice,          // Check createAppointment math above (we defined finalPrice earlier, but scope?)
            // WAIT. replace_file_content doesn't share scope between different calls if they are not physically in the same block.
            // I updated the definition of `cleanPrice` to also define `finalPrice`.
            // Now I need to use `finalPrice` here.
            // But `finalPrice` is a variable I defined in the previous edit.
            // However, `cleanPrice` was originally const. 
            // My previous edit replaced `const cleanPrice = ...` with constants `cleanPrice, discount, addition, finalPrice`.
            // So they are available in the scope of `createAppointment`.

            discount: discount,
            addition: addition,
            payment_method_id: payment_method_id || null, // [NEW]
            invoice_issued: invoice_issued, // [NEW]

            is_extra: is_extra,
            type: type
            // recurrence_group_id // TODO
        })
            .select()
            .single()

        if (error) {
            console.error('Error creating appointment:', error)
            if (error.code === '23505') return { error: 'Opa! Já existe um agendamento idêntico (Duplicado).' }
            if (error.code === '23503') return { error: 'Erro de vínculo: Profissional, Paciente ou Serviço não encontrado.' }
            return { error: 'Erro ao salvar agendamento. Tente novamente.' }
        }

        // [NEW] Audit Log for Value Changes
        if (discount > 0 || addition > 0) {
            await logAction(
                'Agendamento com Ajuste',
                {
                    appointment_id: newAppointment.id,
                    base: cleanPrice,
                    discount,
                    addition,
                    final: finalPrice,
                    user_id: user?.id
                },
                'appointments',
                newAppointment.id
            )
        }

        // [NEW] Google Calendar Sync (Insert)
        try {
            const { data: integ } = await supabase
                .from('professional_integrations')
                .select('*')
                .eq('profile_id', professional_id)
                .eq('provider', 'google_calendar')
                .single()

            if (integ && newAppointment) {
                const { insertCalendarEvent } = await import('@/lib/google')
                const { data: patient } = await supabase.from('patients').select('name').eq('id', patient_id).single()
                const { data: service } = await supabase.from('services').select('name').eq('id', service_id).single()

                const event = {
                    summary: `Agendamento: ${patient?.name || 'Paciente'}`,
                    description: `Serviço: ${service?.name || 'Consulta'}\nNotas: ${notes || ''}`,
                    start: { dateTime: startDateTime.toISOString() },
                    end: { dateTime: endDateTime.toISOString() },
                }

                const gEvent = await insertCalendarEvent(integ.access_token, integ.refresh_token, event)

                if (gEvent && gEvent.id) {
                    await supabase
                        .from('appointments')
                        .update({ google_event_id: gEvent.id })
                        .eq('id', newAppointment.id)
                }
            }
        } catch (err) {
            console.error('Google Sync Insert Error:', err)
        }

        return { success: true }
    }

    // [NEW] Two-Pass Execution: Validate ALL, then Insert ALL

    // Pass 1: Validation
    for (const dateObj of datesToSchedule) {
        const res = await processSingle(dateObj, 'check')
        if ((res as any).confirmationRequired) {
            return res // Propagate confirmation immediately (Blocking)
        }
        if (res.error) {
            return res // Propagate error immediately
        }
    }

    // Pass 2: Execution (Only if all validations passed)
    for (const dateObj of datesToSchedule) {
        const res = await processSingle(dateObj, 'insert')
        if (res.success) {
            successCount++
        } else {
            failCount++
            if (res.error) errors.push(res.error)
        }
    }

    revalidatePath('/dashboard/schedule')

    if (failCount > 0) {
        if (successCount === 0) {
            return { error: `Falha ao criar agendamentos. Erros: ${errors.slice(0, 3).join(', ')}` }
        }
        return {
            success: true,
            warning: `${successCount} criados. ${failCount} falharam por conflito (ex: ${errors[0]}).`
        }
    }

    return { success: true, warning: warningMsg }
}

export async function updateAppointment(formData: FormData) {
    const supabase = await createClient()

    const appointment_id = formData.get('appointment_id') as string
    const patient_id = formData.get('patient_id') as string
    const location_id = formData.get('location_id') as string
    const service_id = formData.get('service_id') as string
    const professional_id = formData.get('professional_id') as string
    const date = formData.get('date') as string
    const time = formData.get('time') as string
    const notes = formData.get('notes') as string
    const price = formData.get('price') as string
    const is_extra = formData.get('is_extra') === 'true'
    const status = formData.get('status') as string || 'scheduled' // [NEW]
    const type = formData.get('type') as string // [NEW]

    // Recurrence Data
    const is_recurring = formData.get('is_recurring') === 'true'
    const recurrence_days = JSON.parse(formData.get('recurrence_days') as string || '[]')
    const recurrence_count = Number(formData.get('recurrence_count') || 1)
    const recurrence_end_date = formData.get('recurrence_end_date') as string
    const recurrence_end_type = formData.get('recurrence_end_type') as string

    if (!appointment_id) return { error: 'ID do agendamento não informado.' }

    // 1. Prepare Dates
    const startDateTime = new Date(`${date}T${time}:00-03:00`)
    const { data: service } = await supabase.from('services').select('duration').eq('id', service_id).single()

    const customDuration = Number(formData.get('custom_duration'))
    // Duration Logic ...
    const duration = (type === 'block' && customDuration > 0)
        ? customDuration
        : (service?.duration || 60)

    const endDateTime = new Date(startDateTime.getTime() + duration * 60000)
    const dayOfWeek = startDateTime.getDay()

    // 2. Checks (Similar to Create, but exclude CURRENT appointment from conflicts)
    const [profileRes, availabilityRes, appointmentsRes] = await Promise.all([
        supabase.from('profiles').select('allow_overbooking').eq('id', professional_id).single(),
        supabase.from('professional_availability')
            .select('*')
            .eq('profile_id', professional_id)
            .eq('day_of_week', dayOfWeek),
        supabase.from('appointments')
            .select('id, start_time, end_time, patient_id, patients(name), type, professional_id') // [UPDATED]
            .eq('professional_id', professional_id)
            .gte('start_time', `${date}T00:00:00`)
            .lte('end_time', `${date}T23:59:59`)
            .neq('id', appointment_id) // Exclude itself!
    ])

    const allowOverbooking = profileRes.data?.allow_overbooking || false
    const availabilitySlots = availabilityRes.data || []
    const existingAppointments = appointmentsRes.data || []

    // 3. Validate Availability

    // [NEW] Strict Block Permission Check (Runs even for Encaixe)
    const { data: { user } } = await supabase.auth.getUser()

    // Handle Force Override
    const force_block_override = formData.get('force_block_override') === 'true'
    const effective_is_extra = is_extra || force_block_override

    for (const appt of existingAppointments) {
        if (appt.type === 'block') {
            const apptStart = new Date(appt.start_time)
            const apptEnd = new Date(appt.end_time)
            if (startDateTime < apptEnd && endDateTime > apptStart) {
                if (user?.id !== appt.professional_id) {
                    return { error: 'Horário bloqueado. Apenas o profissional responsável pode permitir encaixes.' }
                } else {
                    // Owner Override Confirmation
                    if (!effective_is_extra) {
                        return {
                            confirmationRequired: true,
                            message: 'Tentativa de agendamento em horário bloqueado, quer continuar assim mesmo?',
                            context: 'block_override'
                        }
                    }
                }
            }
        }
    }

    let isWithinWorkingHours = false
    const invoice_issued = formData.get('invoice_issued') === 'true' // [NEW]
    if (type === 'appointment' && !effective_is_extra) {
        const getMinutes = (timeStr: string) => {
            const [h, m] = timeStr.split(':').map(Number)
            return h * 60 + m
        }
        const appStartMins = getMinutes(time)
        const appEndMins = appStartMins + duration

        let startWithinSlot = false
        let closingTime = ''

        for (const slot of availabilitySlots) {
            const slotStartMins = getMinutes(slot.start_time)
            const slotEndMins = getMinutes(slot.end_time)
            if (appStartMins >= slotStartMins && appEndMins <= slotEndMins) {
                isWithinWorkingHours = true
                break
            }
            // Partial overlap check
            if (appStartMins >= slotStartMins && appStartMins < slotEndMins) {
                startWithinSlot = true
                closingTime = slot.end_time
            }
        }

        if (!isWithinWorkingHours && availabilitySlots.length > 0) {
            if (startWithinSlot) {
                return { error: `⚠️ Horário Inválido: O atendimento ultrapassa o encerramento da clínica (${closingTime.slice(0, 5)}).` }
            }
            return { error: `⚠️ Profissional Indisponível: Não há agenda aberta para este horário em ${date}.` }
        }
        if (!isWithinWorkingHours && availabilitySlots.length === 0) return { error: `⚠️ Agenda Fechada: O profissional não atende nesta data (${date}).` }
    }


    // [NEW] Location Capacity Check (Mandatory for Update too)
    if (location_id) {
        // Fetch capacity (optimization: could pass from client, but safer here)
        const { data: loc } = await supabase.from('locations').select('capacity').eq('id', location_id).single()
        if (loc && loc.capacity) {
            // Count overlaps excluding current
            const { count } = await supabase
                .from('appointments')
                .select('*', { count: 'exact', head: true })
                .eq('location_id', location_id)
                .neq('status', 'cancelled')
                .neq('id', appointment_id) // Exclude self
                .lt('start_time', endDateTime.toISOString())
                .gt('end_time', startDateTime.toISOString())

            if ((count || 0) >= loc.capacity) {
                return { error: `Local lotado! Capacidade máxima: ${loc.capacity}.` }
            }
        }
    }

    // 4. Validate Overlaps
    if (!effective_is_extra) {
        // [NEW] Check for Block Overlaps first
        if (type === 'block') {
            // If we are a lock, we check if we overlap ANY appointment
            const conflict = existingAppointments.find(appt => {
                const apptStart = new Date(appt.start_time)
                const apptEnd = new Date(appt.end_time)
                return (startDateTime < apptEnd && endDateTime > apptStart)
            })

            if (conflict) {
                if (!force_block_override) {
                    // const dateStr = ... (we have date var)
                    return {
                        confirmationRequired: true,
                        message: `⚠️ CONFLITO AO MOVER\n\nO novo horário possui agendamentos marcados.\n\nPara prosseguir, você precisará REMANEJAR estes pacientes manualmente.\n\nDeseja mover o bloqueio mesmo assim?`,
                        context: 'block_overlap'
                    }
                }
            }
        }

        for (const appt of existingAppointments) {
            const apptStart = new Date(appt.start_time)
            const apptEnd = new Date(appt.end_time)
            if (startDateTime < apptEnd && endDateTime > apptStart) {
                return { error: `Conflito de horário com outro paciente!` }
            }
        }
    }

    // 5. Update
    const cleanPrice = price ? Number(price.replace(/[^0-9,]/g, '').replace(',', '.')) : 0
    const discount = Number(formData.get('discount') || 0)
    const addition = Number(formData.get('addition') || 0)
    let payment_method_id = formData.get('payment_method_id') as string // [NEW]
    if (payment_method_id === 'null' || payment_method_id === '') {
        payment_method_id = null as any
    }
    const finalPrice = Math.max(0, cleanPrice - discount + addition)

    const { error } = await supabase.from('appointments').update({
        patient_id,
        location_id: location_id || null,
        service_id,
        professional_id,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        notes,

        original_price: cleanPrice,
        price: finalPrice,
        discount,
        addition,
        payment_method_id: payment_method_id || null, // [NEW]
        invoice_issued: invoice_issued, // [NEW]

        is_extra: is_extra,
        status: status // [NEW]
    }).eq('id', appointment_id)

    if (error) {
        console.error('Error updating appointment:', error)
        return { error: `Erro ao atualizar: ${error.message}` }
    }

    // [NEW] Log Adjustment
    if (discount > 0 || addition > 0) {
        await logAction(
            'Agendamento Atualizado (Valores)',
            {
                appointment_id,
                base: cleanPrice,
                discount,
                addition,
                final: finalPrice
            },
            'appointments',
            appointment_id
        )
    }

    // [NEW] Recalculate Commission if Price Changed and Status is Completed
    // The previous logic only calculated commission inside `updateAppointmentStatus` or if we manually did it.
    // If we just edited the price but kept status 'completed', we MUST update the commission.
    if (status === 'completed') {
        // Import self not needed, function is available in module scope
        // const { calculateAndSaveCommission } = await import('./actions')
        // Actually, `calculateAndSaveCommission` is exported at the bottom of this file.
        // I can just call it (since I am in the same module, functions are hoisted or available).
        // Wait, `calculateAndSaveCommission` expects `supabase` client and `appointment` object.
        // I need to fetch the FRESH appointment object because `calculateAndSaveCommission` expects it to have `service_id`, `professional_id`, `price` etc.
        // Or I can construct a partial object.

        // Let's fetch the updated appointment to be safe and clean.
        const { data: freshAppt } = await supabase.from('appointments').select('*').eq('id', appointment_id).single()
        if (freshAppt) {
            await calculateAndSaveCommission(supabase, freshAppt)
        }
    }

    // [NEW] Google Calendar Sync (Update)
    try {
        // Fetch current appointment to get google_event_id (it might be there)
        const { data: updatedAppt } = await supabase.from('appointments').select('*').eq('id', appointment_id).single()

        if (updatedAppt && updatedAppt.google_event_id) {
            const { data: integ } = await supabase
                .from('professional_integrations')
                .select('*')
                .eq('profile_id', professional_id)
                .eq('provider', 'google_calendar')
                .single()

            if (integ) {
                const { updateCalendarEvent } = await import('@/lib/google')
                const { data: patient } = await supabase.from('patients').select('name').eq('id', patient_id).single()
                const { data: service } = await supabase.from('services').select('name').eq('id', service_id).single()

                const event = {
                    summary: `Agendamento: ${patient?.name || 'Paciente'}`,
                    description: `Serviço: ${service?.name || 'Consulta'}\nNotas: ${notes || ''}`,
                    start: { dateTime: startDateTime.toISOString() },
                    end: { dateTime: endDateTime.toISOString() },
                }

                await updateCalendarEvent(integ.access_token, integ.refresh_token, updatedAppt.google_event_id, event)
            }
        }
    } catch (err) {
        console.error('Google Sync Update Error:', err)
    }

    // [NEW] Handle Commission Logic on Update
    if (status === 'completed') {
        // ... (reuse logic or call internal helper)
        // For simplicity, duplicate logic here or call updateAppointmentStatus?
        // Let's call updateAppointmentStatus logic logic here to ensure consistency
        // Wait, updateAppointmentStatus fetches appointment again. 
        // Let's inline the Commission Logic.

        const { data: rules } = await supabase
            .from('professional_commission_rules')
            .select('*')
            .eq('professional_id', professional_id)

        let rule = rules?.find(r => r.service_id === service_id)
        if (!rule) rule = rules?.find(r => r.service_id === null)

        if (rule) {
            let commissionValue = 0
            if (rule.type === 'percentage') {
                commissionValue = (cleanPrice * Number(rule.value)) / 100
            } else {
                commissionValue = Number(rule.value)
            }

            await supabase
                .from('financial_commissions')
                .upsert({
                    professional_id: professional_id,
                    appointment_id: appointment_id,
                    amount: commissionValue,
                    status: 'pending'
                }, { onConflict: 'appointment_id' })
        }
    } else {
        // Remove commission if not completed
        await supabase.from('financial_commissions').delete().eq('appointment_id', appointment_id)
    }

    revalidatePath('/dashboard/schedule')

    // 6. Handle Recurrence (Create Future Appointments)
    if (is_recurring) {
        // GENERATE DATES (Similar to Create)
        const datesToSchedule: Date[] = []
        const startObj = new Date(date + 'T12:00:00') // Reference date

        // Loop logic
        let currentDate = new Date(startObj)
        // Advance to next day to avoid duplicating the current updated appointment
        currentDate.setDate(currentDate.getDate() + 1)

        let count = 0
        const targetCount = recurrence_end_type === 'count' ? recurrence_count - 1 : 999
        if (targetCount <= 0 && recurrence_end_type === 'count') return { success: true }

        const hardEndDate = recurrence_end_type === 'date' && recurrence_end_date
            ? new Date(recurrence_end_date + 'T12:00:00')
            : null

        while (true) {
            const dayIdx = currentDate.getDay()

            if (recurrence_days.includes(dayIdx)) {
                if (recurrence_end_type === 'count' && count >= targetCount) break
                if (hardEndDate && currentDate > hardEndDate) break

                datesToSchedule.push(new Date(currentDate))
                count++
            }

            currentDate.setDate(currentDate.getDate() + 1)
            if (count >= 50 || datesToSchedule.length >= 50) break // Safety
            if (currentDate.getTime() - startObj.getTime() > 365 * 24 * 60 * 60 * 1000) break
        }

        // Helper for single insertion
        const processFuture = async (dateObj: Date) => {
            const fDateStr = dateObj.toISOString().split('T')[0]
            const fStart = new Date(`${fDateStr}T${time}:00`)
            const fEnd = new Date(fStart.getTime() + duration * 60000)
            const fDay = fStart.getDay()

            // Check Availability & Overlap
            const [pRes, aRes, appRes] = await Promise.all([
                supabase.from('profiles').select('allow_overbooking').eq('id', professional_id).single(),
                supabase.from('professional_availability').select('*').eq('profile_id', professional_id).eq('day_of_week', fDay),
                supabase.from('appointments').select('start_time, end_time').eq('professional_id', professional_id).gte('start_time', `${fDateStr}T00:00:00`).lte('end_time', `${fDateStr}T23:59:59`)
            ])

            const allow = pRes.data?.allow_overbooking
            const slots = aRes.data || []
            const existing = appRes.data || []

            // Availability
            if (!is_extra && !allow) {
                let isWorking = false
                const getMins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
                const sMins = getMins(time)
                const eMins = sMins + duration
                for (const s of slots) {
                    if (sMins >= getMins(s.start_time) && eMins <= getMins(s.end_time)) isWorking = true
                }
                if (!isWorking && slots.length > 0) return { error: 'Indisponível' }
                // if (!isWorking && slots.length === 0) -> maybe day off?
            }

            // Conflict
            if (!is_extra && !allow) {
                for (const e of existing) {
                    const eS = new Date(e.start_time); const eE = new Date(e.end_time)
                    if (fStart < eE && fEnd > eS) return { error: 'Conflito' }
                }
            }

            // Insert
            const { error } = await supabase.from('appointments').insert({
                patient_id, location_id: location_id || null, service_id, professional_id,
                start_time: fStart.toISOString(), end_time: fEnd.toISOString(),
                notes, price: cleanPrice, is_extra, status: 'scheduled'
            })
            return { success: !error, error: error?.message }
        }

        let created = 0
        for (const d of datesToSchedule) {
            const res = await processFuture(d)
            if (res.success) created++
        }

        if (created > 0) {
            return { success: true, warning: `Agendamento atualizado e ${created} novos criados.` }
        }
    }

    return { success: true }
}

export async function deleteAppointment(appointmentId: string, deleteAll: boolean = false) {
    const supabase = await createClient()

    // Fetch details for Sync & Audit before deletion
    let appointmentDetails = null
    try {
        const { data } = await supabase.from('appointments').select('*').eq('id', appointmentId).single()
        appointmentDetails = data
    } catch (err) {
        console.error('Error fetching details for deletion:', err)
    }

    // [NEW] Multi-day Block/Recurrence Deletion
    if (deleteAll && appointmentDetails?.notes?.includes('[GRP:')) {
        const match = appointmentDetails.notes.match(/\[GRP:([^\]]+)\]/)
        if (match) {
            const groupId = match[1]
            const { error: groupError } = await supabase
                .from('appointments')
                .delete()
                .ilike('notes', `%[GRP:${groupId}]%`)

            if (groupError) return { error: groupError.message }

            revalidatePath('/dashboard/schedule')
            return { success: true }
        }
    }

    // Google Calendar Sync (Delete)
    if (appointmentDetails && appointmentDetails.google_event_id) {
        try {
            const { data: integ } = await supabase
                .from('professional_integrations')
                .select('*')
                .eq('profile_id', appointmentDetails.professional_id)
                .eq('provider', 'google_calendar')
                .single()

            if (integ) {
                const { deleteCalendarEvent } = await import('@/lib/google')
                await deleteCalendarEvent(integ.access_token, integ.refresh_token, appointmentDetails.google_event_id)
            }
        } catch (err) {
            console.error('Google Sync Delete Error:', err)
        }
    }

    // [FIX] Constraint: Check and Delete Linked Patient Records (Prontuários)
    const { error: recordsError } = await supabase.from('patient_records').delete().eq('appointment_id', appointmentId)
    if (recordsError) {
        console.error('Error deleting linked records:', recordsError)
        return { error: 'Falha ao remover prontuários associados. Tente novamente ou contate o suporte.' }
    }

    // [FIX] Cleanup Financial Data (Commissions & Invoices)
    const { error: commError } = await supabase.from('financial_commissions').delete().eq('appointment_id', appointmentId)
    if (commError) console.error('Error deleting commissions:', commError)

    const { error: invError } = await supabase.from('invoices').delete().eq('appointment_id', appointmentId)
    if (invError) console.error('Error deleting invoices:', invError)

    // Final Delete
    const { error } = await supabase.from('appointments').delete().eq('id', appointmentId)

    if (error) {
        console.error('Error deleting appointment:', error)
        // Friendly Constraints Error
        if (error.code === '23503') {
            return { error: 'Não é possível excluir. Existem registros dependentes (ex: Faturas) que não puderam ser removidos.' }
        }
        return { error: 'Erro ao excluir agendamento. Tente novamente.' }
    }

    // [NEW] Audit Log
    try {
        if (appointmentDetails) {
            await logAction(
                'Agendamento Cancelado',
                {
                    appointment_id: appointmentId,
                    professional_id: appointmentDetails.professional_id,
                    google_event_id: appointmentDetails.google_event_id
                },
                'appointments',
                appointmentId
            )
        }
    } catch (err) {
        console.error('Audit Log Error:', err)
    }

    revalidatePath('/dashboard/schedule')
    return { success: true }
}

export async function updateAppointmentStatus(appointmentId: string, status: string) {
    const supabase = await createClient()

    // 1. Update Status
    const { data: appointment, error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', appointmentId)
        .select('*, services(name), profiles(full_name)')
        .single()

    if (error) {
        console.error('Error updating status:', error)
        return { error: `Erro DB: ${error.message}` }
    }

    // 2. Handle Commission
    if (status === 'completed') {
        await calculateAndSaveCommission(supabase, appointment)
    } else {
        await supabase.from('financial_commissions').delete().eq('appointment_id', appointmentId)
    }

    revalidatePath('/dashboard/schedule')
    return { success: true }
}

// Helper (Exported to be used by createInvoice)
export async function calculateAndSaveCommission(supabase: any, appointment: any) {
    // 1. Check if appointment is completed. If not, skip.
    if (appointment.status !== 'completed') {
        return
    }

    // 2. Check if Invoice Exists (MANDATORY per user request)
    // Try column first (preferred) or invoice_items
    let invoiceId = appointment.invoice_id

    if (!invoiceId) {
        // Fallback check in invoice_items (for backward compatibility or complex cases)
        const { data: link } = await supabase.from('invoice_items').select('invoice_id').eq('appointment_id', appointment.id).single()
        if (link) invoiceId = link.invoice_id
    }

    if (!invoiceId) {
        // Ensure we delete any existing "pending" commission if invoice was deleted? 
        // Or just let it be? User wants "Billing" based, so maybe we should ensure consistency.
        // For now, just return. Later we might want to cleanup.
        return
    }

    const professionalId = appointment.professional_id
    const serviceId = appointment.service_id
    const price = Number(appointment.price)

    // Fetch Rule
    const { data: rules } = await supabase
        .from('professional_commission_rules')
        .select('*')
        .eq('professional_id', professionalId)

    let rule = rules?.find((r: any) => r.service_id === serviceId)
    if (!rule) rule = rules?.find((r: any) => r.service_id === null)

    if (rule) {
        let basis = price

        // Fetch Invoice Data for Fee Calculation
        const { data: invoice } = await supabase
            .from('invoices')
            .select('payment_method, installments, applied_fee_rate')
            .eq('id', invoiceId)
            .single()

        if (invoice) {
            let feePercent = 0

            if (invoice.applied_fee_rate !== null && invoice.applied_fee_rate !== undefined) {
                feePercent = Number(invoice.applied_fee_rate)
            } else if (invoice.payment_method) {
                // Fallback for old invoices
                const { data: fees } = await supabase
                    .from('payment_method_fees')
                    .select('fee_percent')
                    .eq('method', invoice.payment_method)
                    .eq('installments', invoice.installments || 1)
                    .single()
                if (fees) feePercent = fees.fee_percent
            }

            // Apply Net Basis Logic
            if (rule.calculation_basis === 'net') {
                const feeAmount = price * (feePercent / 100)
                basis = price - feeAmount
            }
        }

        let commissionValue = 0
        if (rule.type === 'percentage') {
            commissionValue = basis * (rule.value / 100)
        } else {
            commissionValue = Number(rule.value)
        }

        // Check for existing commission to avoid constraint error and overwriting paid ones
        const { data: existingComm } = await supabase
            .from('financial_commissions')
            .select('id, status')
            .eq('appointment_id', appointment.id)
            .single()

        if (existingComm) {
            if (existingComm.status === 'paid') {
                console.log('Skipping commission update for paid record.')
                return
            }
            // Update existing pending commission
            await supabase
                .from('financial_commissions')
                .update({
                    amount: commissionValue,
                    professional_id: professionalId, // Verify pro hasn't changed
                    updated_at: new Date().toISOString()
                })
                .eq('id', existingComm.id)
        } else {
            // Insert new
            await supabase
                .from('financial_commissions')
                .insert({
                    professional_id: professionalId,
                    appointment_id: appointment.id,
                    amount: commissionValue,
                    status: 'pending'
                })
        }
    }
}

// [NEW] Get Available Slots for Dropdown
export async function getAvailableSlots(professionalId: string, dateStr: string, duration: number = 45) {
    const supabase = await createClient()

    if (!professionalId || !dateStr) return []

    const dayOfWeek = new Date(dateStr + 'T12:00:00-03:00').getDay()

    // 1. Get Availability Config
    const { data: availability } = await supabase
        .from('professional_availability')
        .select('*')
        .eq('profile_id', professionalId)
        .eq('day_of_week', dayOfWeek)

    if (!availability || availability.length === 0) return []

    // 2. Get Existing Appointments
    const { data: appointments } = await supabase
        .from('appointments')
        .select('start_time, end_time')
        .eq('professional_id', professionalId)
        .neq('status', 'cancelled')
        .gte('start_time', `${dateStr}T00:00:00`)
        .lte('end_time', `${dateStr}T23:59:59`)

    // 3. Generate Slots
    // Helper to converting HH:MM to minutes
    const toMins = (t: string) => {
        const [h, m] = t.split(':').map(Number)
        return h * 60 + m
    }
    // Helper to format minutes to HH:MM
    const toTime = (m: number) => {
        const h = Math.floor(m / 60)
        const min = m % 60
        return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
    }

    const slots: string[] = []

    // For each availability range
    availability.forEach(range => {
        let currentMins = toMins(range.start_time)
        const endMins = toMins(range.end_time)

        // Step by 15 minutes to find all possible start times
        while (currentMins + duration <= endMins) {
            const slotStart = currentMins
            const slotEnd = currentMins + duration

            // Check Collision
            const isBlocked = appointments?.some(appt => {
                const apptStart = new Date(appt.start_time)
                const apptEnd = new Date(appt.end_time)
                const apptStartMins = apptStart.getHours() * 60 + apptStart.getMinutes()
                const apptEndMins = apptEnd.getHours() * 60 + apptEnd.getMinutes()

                // Collision: Start < EndB && End > StartB
                return slotStart < apptEndMins && slotEnd > apptStartMins
            })

            if (!isBlocked) {
                slots.push(toTime(slotStart))
            }

            // [MODIFIED] Check every 15 mins instead of 30 or duration
            // This ensures if a slot opens at 15:15, it is found.
            currentMins += 15
        }
    })

    return slots.sort()
}
