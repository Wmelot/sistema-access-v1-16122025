"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getAppointments() {
    const supabase = await createClient()

    // Fetch appointments with patient name
    const { data, error } = await supabase
        .from('appointments')
        .select(`
            *,
            patients ( id, name ),
            profiles ( id, full_name, color )
        `)

    if (error) {
        console.error('Error fetching appointments:', error)
        return []
    }

    return data
}

export async function getAppointmentFormData() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const [patients, locations, services, professionals, serviceLinks, holidays, priceTables, availability] = await Promise.all([
        supabase.from('patients').select('id, name').order('name'),
        supabase.from('locations').select('id, name, color').order('name'),
        supabase.from('services').select('id, name, duration, price').eq('active', true).order('name'),
        supabase.from('profiles').select('id, full_name, photo_url, color, slot_interval').order('full_name'),
        supabase.from('service_professionals').select('service_id, profile_id'),
        supabase.from('holidays').select('date, name, type'),
        supabase.from('price_tables').select('id, name').order('name'),
        user ? supabase.from('professional_availability').select('location_id').eq('profile_id', user.id).limit(1) : Promise.resolve({ data: [] })
    ])

    const defaultLocationId = (availability as any).data?.[0]?.location_id || null

    return {
        patients: patients.data || [],
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
    const patient_id = formData.get('patient_id') as string
    const location_id = formData.get('location_id') as string
    const service_id = formData.get('service_id') as string
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

    const type = formData.get('type') as string || 'appointment'

    if (type === 'appointment' && !professional_id) return { error: 'Selecione um profissional.' }

    // Service & Duration
    let duration = 60
    if (type === 'appointment') {
        const { data: service } = await supabase.from('services').select('duration').eq('id', service_id).single()
        duration = service?.duration || 60
    } else {
        // Block duration - simpler approach? Or user defines end time?
        // distinct start/end times usually provided for blocks?
        // For now assume logic uses 'time' + duration or maybe 'time_start' and 'time_end' from form?
        // The form usually sends 'time' and we calc end based on duration.
        // Let's assume for blocks we might want a manual duration input or re-use service duration concept (e.g. "Bloqueio 1h")
        // Or better: If block, maybe we just use a default or let user pick. 
        // For MVP plan: Use same duration logic or a fixed block time? 
        // Let's check if we added a duration input. No. 
        // Let's assume standard 60m for block if not specified? 
        // Or actually, let's keep using 'duration' from a special "Block" service? 
        // No, `type` is separate.
        // Let's assume 60 min for block for now or 30?
        duration = 60
        // Ideally we should add a duration input for blocks.
    }

    // Price
    const cleanPrice = priceStr ? Number(priceStr.replace(/[^0-9,]/g, '').replace(',', '.')) : 0

    // GENERATE DATES
    const datesToSchedule: Date[] = []
    const startDateStr = formData.get('date') as string
    const startObj = new Date(startDateStr + 'T12:00:00') // Avoid timezone

    if (!is_recurring) {
        datesToSchedule.push(startObj)
    } else {
        // Recurrence Logic
        let currentDate = new Date(startObj)
        let count = 0
        const MAX_LOOPS = 50 // Safety break

        // If "End Date" is chosen, set a limit for the loop
        const hardEndDate = recurrence_end_type === 'date' && recurrence_end_date
            ? new Date(recurrence_end_date + 'T12:00:00')
            : null

        // Start generating
        // We look ahead day by day
        while (true) {
            const dayIdx = currentDate.getDay()

            // Check if this day is in allowed days
            // But usually the START date is implied as the first one?
            // User interface has toggle buttons.
            // If the start date matches one of the toggle buttons, includes it.
            // Or should we just advance?

            // Logic: Check if current day is in recurrence_days.
            // If yes, add to list.
            if (recurrence_days.includes(dayIdx)) {
                // Check constraints
                if (recurrence_end_type === 'count' && count >= recurrence_count) break
                if (hardEndDate && currentDate > hardEndDate) break

                datesToSchedule.push(new Date(currentDate))
                count++
            }

            // Next day
            currentDate.setDate(currentDate.getDate() + 1)

            // Safety
            if (count >= 50 || datesToSchedule.length >= 50) break

            // Time limit safety (e.g. 1 year)
            if (currentDate.getTime() - startObj.getTime() > 365 * 24 * 60 * 60 * 1000) break
        }

        if (datesToSchedule.length === 0) {
            // Fallback: If logic failed (e.g. no days selected), add at least the start date?
            // Or return error?
            return { error: 'Selecione pelo menos um dia da semana para a recorrência.' }
        }
    }

    // PROCESS APPOINTMENTS
    let successCount = 0
    let failCount = 0
    let warningMsg = null
    const errors: string[] = []

    // Helper to process one
    const processSingle = async (dateObj: Date) => {
        const dateStr = dateObj.toISOString().split('T')[0]
        const startDateTime = new Date(`${dateStr}T${time}:00`)
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
                .select('start_time, end_time, patient_id, patients(name), type, professional_id')
                .eq('professional_id', professional_id)
                .gte('start_time', `${dateStr}T00:00:00`)
                .lte('end_time', `${dateStr}T23:59:59`)
        ])

        const allowOverbooking = profileRes.data?.allow_overbooking || false
        const availabilitySlots = availabilityRes.data || []
        const existingAppointments = appointmentsRes.data || []

        // Validate Availability (Only for appointments, blocks can be anytime?)
        // Actually blocks usually block availability, so they can be anywhere.
        let isWithinWorkingHours = false
        if (type === 'appointment' && !is_extra) {
            const getMinutes = (timeStr: string) => {
                const [h, m] = timeStr.split(':').map(Number)
                return h * 60 + m
            }
            const appStartMins = getMinutes(time)
            const appEndMins = appStartMins + duration

            for (const slot of availabilitySlots) {
                const slotStartMins = getMinutes(slot.start_time)
                const slotEndMins = getMinutes(slot.end_time)
                if (appStartMins >= slotStartMins && appEndMins <= slotEndMins) {
                    isWithinWorkingHours = true
                    break
                }
            }
            if (!isWithinWorkingHours && availabilitySlots.length > 0 && !allowOverbooking) return { error: `Profissional indisponível em ${dateStr}` }
            if (!isWithinWorkingHours && availabilitySlots.length === 0 && !allowOverbooking) return { error: `Sem agenda em ${dateStr}` }
        }

        // Validate Overlaps

        // [NEW] Strict Block Permission Check (Runs even for Encaixe/Extra)
        const { data: { user } } = await supabase.auth.getUser()

        // Handle Force Override (Treat as is_extra for logic purposes)
        const force_block_override = formData.get('force_block_override') === 'true'
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
        // Rules:
        // 1. If existing is BLOCK: No one can schedule (unless owner override - assumed checked via UI/Force flag?)
        //    Actually, owner-override usually means they can double book. 
        //    But if it's a BLOCK, maybe we should return a specific error "BLOCK_CONFLICT".
        // 2. If new is BLOCK: It conflicts with existing (unless owner forces).
        // Let's stick to: Blocks are treated as conflicts.
        // User (Owner) might have "allowOverbooking".

        // Get current user to check if they are the owner? 
        // For now, relies on 'allowOverbooking' profile setting which is imperfect for "Owner overriding block".
        // Better: Check if `is_extra` (Encaixe/Force) is true.

        if ((!effective_is_extra && !allowOverbooking) || (type === 'block' && !effective_is_extra)) {
            for (const appt of existingAppointments) {
                const apptStart = new Date(appt.start_time)
                const apptEnd = new Date(appt.end_time)

                if (startDateTime < apptEnd && endDateTime > apptStart) {
                    // Conflict found
                    if (appt.type === 'block') {
                        return { error: `Horário bloqueado em ${dateStr}` }
                    }
                    if (type === 'block') {
                        return { error: `Já existe agendamento neste horário em ${dateStr}` }
                    }
                    return { error: `Conflito em ${dateStr}` }
                }
            }
        }

        // Location Check (Optional/Skipped if Extra)
        if (location_id && !is_extra && type === 'appointment') {
            // ... (keep existing logic)
        }

        // Check Duplicate (Warning)
        if (type === 'appointment' && existingAppointments.some(appt => appt.patient_id === patient_id)) {
            warningMsg = 'Aviso: Paciente já tem agendamento em um dos dias.' // Keep last warning
        }

        // Insert
        const { error } = await supabase.from('appointments').insert({
            patient_id: type === 'appointment' ? patient_id : null,
            location_id,
            service_id: type === 'appointment' ? service_id : null,
            professional_id,
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString(),
            notes,
            status: 'scheduled', // Default for new
            price: cleanPrice,
            is_extra: is_extra,
            type: type
            // recurrence_group_id // TODO: Add if we want grouping
        })

        if (error) return { error: error.message }
        return { success: true }
    }

    // Execute in parallel or serial? Serial is safer for DB locks/logic.
    for (const dateObj of datesToSchedule) {
        const res = await processSingle(dateObj)
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

    // Recurrence Data
    const is_recurring = formData.get('is_recurring') === 'true'
    const recurrence_days = JSON.parse(formData.get('recurrence_days') as string || '[]')
    const recurrence_count = Number(formData.get('recurrence_count') || 1)
    const recurrence_end_date = formData.get('recurrence_end_date') as string
    const recurrence_end_type = formData.get('recurrence_end_type') as string

    if (!appointment_id) return { error: 'ID do agendamento não informado.' }

    // 1. Prepare Dates
    const startDateTime = new Date(`${date}T${time}:00`)
    const { data: service } = await supabase.from('services').select('duration').eq('id', service_id).single()
    const duration = service?.duration || 60
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
    if (!effective_is_extra) {
        const getMinutes = (timeStr: string) => {
            const [h, m] = timeStr.split(':').map(Number)
            return h * 60 + m
        }
        const appStartMins = getMinutes(time)
        const appEndMins = appStartMins + duration

        for (const slot of availabilitySlots) {
            const slotStartMins = getMinutes(slot.start_time)
            const slotEndMins = getMinutes(slot.end_time)
            if (appStartMins >= slotStartMins && appEndMins <= slotEndMins) {
                isWithinWorkingHours = true
                break
            }
        }

        if (!isWithinWorkingHours && availabilitySlots.length > 0 && !allowOverbooking) {
            return { error: 'O profissional não atende neste horário.' }
        }
        if (!isWithinWorkingHours && availabilitySlots.length === 0 && !allowOverbooking) {
            return { error: 'O profissional não tem horários neste dia.' }
        }
    }

    // 4. Validate Overlaps
    if (!effective_is_extra && !allowOverbooking) {
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

    const { error } = await supabase.from('appointments').update({
        patient_id,
        location_id: location_id || null,
        service_id,
        professional_id,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        notes,
        price: cleanPrice,
        is_extra: is_extra,
        status: status // [NEW]
    }).eq('id', appointment_id)

    if (error) {
        console.error('Error updating appointment:', error)
        return { error: `Erro ao atualizar: ${error.message}` }
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

export async function deleteAppointment(appointmentId: string) {
    const supabase = await createClient()

    const { error } = await supabase.from('appointments').delete().eq('id', appointmentId)

    if (error) {
        console.error('Error deleting appointment:', error)
        return { error: 'Erro ao excluir agendamento.' }
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
