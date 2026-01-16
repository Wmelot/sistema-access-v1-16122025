"use server"

import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getBrazilDate, getBrazilDay, getBrazilHour, getBrazilMinutes, getBrazilDateString } from "@/lib/date-utils"
import { logAction } from '@/lib/logger'
import { NotificationService } from "@/lib/notifications"
import { createAdminClient } from "@/lib/supabase/admin"

export async function getAppointments() {
    // [DB BYPASS] Use direct query to ensure immediate consistency for schedule
    try {
        const cutoffDate = new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString();

        const { rows } = await db.query(`
            SELECT 
                a.*,
                json_build_object('id', p.id, 'name', p.name) as patients,
                json_build_object('id', pr.id, 'full_name', pr.full_name, 'color', pr.color) as profiles,
                json_build_object('id', s.id, 'name', s.name, 'color', s.color) as services,
                COALESCE(
                    (
                        SELECT json_agg(json_build_object('status', i.status))
                        FROM invoices i
                        WHERE i.appointment_id = a.id
                    ),
                    '[]'::json
                ) as invoices
            FROM appointments a
            LEFT JOIN patients p ON a.patient_id = p.id
            LEFT JOIN profiles pr ON a.professional_id = pr.id
            LEFT JOIN services s ON a.service_id = s.id
            WHERE a.status != 'cancelled'
            AND a.start_time >= $1
            ORDER BY a.start_time ASC
            LIMIT 3000
        `, [cutoffDate]);

        // Normalize nulls from left joins if necessary (though json_build_object handles nulls gracefully mostly, passing null IDs)
        // Adjust data shape if needed: Supabase returns null for relation if FK is null.
        // SQL json_build_object will return {id: null, name: null}.
        // We might want to clear these up strictly, but usually frontend checks if (appt.patients?.name).

        return rows.map(r => ({
            ...r,
            start_time: new Date(r.start_time).toISOString(),
            end_time: new Date(r.end_time).toISOString(),
            patients: r.patients?.id ? r.patients : null,
            profiles: r.profiles?.id ? r.profiles : null,
            services: r.services?.id ? r.services : null
        }));

    } catch (error) {
        console.error('Error fetching appointments (DB):', error);
        return [];
    }
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

    if (!user) return { patients: [], locations: [], services: [], professionals: [], serviceLinks: [], holidays: [], priceTables: [], paymentMethods: [], defaultLocationId: null }

    const profileRes = await db.query('SELECT organization_id FROM public.profiles WHERE id = $1', [user.id])
    const orgId = profileRes.rows[0]?.organization_id

    // Direct DB Access for Critical Data
    const [locationsRes, servicesRes, serviceLinksRes, availabilityRes, professionalsRes, holidays, priceTables, paymentMethods] = await Promise.all([
        orgId ? db.query('SELECT id, name, color, capacity FROM public.locations WHERE organization_id = $1 ORDER BY name', [orgId]) : Promise.resolve({ rows: [] }),
        orgId ? db.query('SELECT id, name, duration, price FROM public.services WHERE organization_id = $1 AND active = true ORDER BY name', [orgId]) : Promise.resolve({ rows: [] }),
        db.query('SELECT service_id, profile_id FROM public.service_professionals'), // Fetch all links (light table)
        user ? db.query('SELECT location_id FROM public.professional_availability WHERE profile_id = $1 LIMIT 1', [user.id]) : Promise.resolve({ rows: [] }),
        supabase.from('profiles').select('id, full_name, photo_url, color, slot_interval, professional_availability(day_of_week, start_time, end_time, location_id)').order('full_name'),
        supabase.from('holidays' as any).select('date, name, type, is_mandatory'),
        supabase.from('price_tables' as any).select('id, name').order('name'),
        supabase.from('payment_methods').select('id, name, slug').eq('active', true).order('name')
    ])

    const defaultLocationId = availabilityRes.rows[0]?.location_id || null

    return {
        patients: [],
        locations: locationsRes.rows || [],
        services: servicesRes.rows || [],
        professionals: professionalsRes.data || [],
        serviceLinks: serviceLinksRes.rows || [],
        holidays: holidays.data || [],
        priceTables: priceTables.data || [],
        paymentMethods: paymentMethods.data || [],
        defaultLocationId
    }
}

// ... (previous code)

export async function createAppointment(formData: FormData) {
    try {
        const supabase = await createClient()

        const patient_id = (formData.get('patient_id') as string) || null
        const location_id = (formData.get('location_id') as string) || null
        const service_id = (formData.get('service_id') as string) || null
        const professional_id = formData.get('professional_id') as string
        const time = formData.get('time') as string
        const notes = formData.get('notes') as string
        const priceStr = formData.get('price') as string
        const is_extra = formData.get('is_extra') === 'true'

        const is_recurring = formData.get('is_recurring') === 'true'
        let recurrence_days: number[] = []
        try {
            recurrence_days = JSON.parse(formData.get('recurrence_days') as string || '[]')
        } catch (e) {
            console.error("Error parsing recurrence_days:", e)
        }
        const recurrence_count = Number(formData.get('recurrence_count') || 1)
        const recurrence_end_date = formData.get('recurrence_end_date') as string
        const recurrence_end_type = formData.get('recurrence_end_type') as string

        const type = (formData.get('type') as string) || 'appointment'

        if (type === 'appointment' && (!patient_id || !service_id)) {
            return { error: 'Paciente e Serviço são obrigatórios para agendamentos.' }
        }
        if (type === 'appointment' && !professional_id) return { error: 'Selecione um profissional.' }
        if (!time) return { error: 'Selecione um horário.' }

        const datesToSchedule: Date[] = []
        const startDateStr = formData.get('date') as string
        if (!startDateStr) return { error: 'Data inválida.' }

        const startObj = new Date(startDateStr + 'T' + time + ':00-03:00')
        if (isNaN(startObj.getTime())) {
            const fallbackObj = new Date(startDateStr + 'T12:00:00-03:00')
            if (isNaN(fallbackObj.getTime())) return { error: 'Data inválida.' }
            datesToSchedule.push(fallbackObj)
        } else {
            datesToSchedule.push(startObj)
        }

        let duration = 60
        if (type === 'appointment') {
            const { data: service } = await supabase.from('services').select('duration').eq('id', service_id!).single()
            duration = service?.duration || 60
        } else {
            const customDuration = Number(formData.get('custom_duration'))
            duration = customDuration > 0 ? customDuration : 60
        }

        const cleanPrice = priceStr ? Number(priceStr.replace(/[^0-9,]/g, '').replace(',', '.')) : 0
        const discount = Number(formData.get('discount') || 0)
        const addition = Number(formData.get('addition') || 0)
        let payment_method_id = formData.get('payment_method_id') as string
        if (payment_method_id === 'null' || payment_method_id === '') {
            payment_method_id = null as any
        }
        const invoice_issued = formData.get('invoice_issued') === 'true'
        const finalPrice = Math.max(0, cleanPrice - discount + addition)


        if (is_recurring) {

            // Let's rewrite loop cleanly as per original read, but refined.
            datesToSchedule.length = 0 // Clear strictly for recurrence to build full list properly
            let currentDate = new Date(startObj)
            let count = 0
            const groupId = Math.random().toString(36).substring(2, 15)
            const hardEndDate = recurrence_end_type === 'date' && recurrence_end_date ? new Date(recurrence_end_date + 'T12:00:00') : null

            while (true) {
                const dayIdx = getBrazilDay(currentDate)
                if (recurrence_days.includes(dayIdx)) {
                    if (recurrence_end_type === 'count' && count >= recurrence_count) break
                    if (hardEndDate && currentDate > hardEndDate) break
                    datesToSchedule.push(new Date(currentDate))
                    count++
                }
                currentDate.setDate(currentDate.getDate() + 1)
                if (count >= 50 || datesToSchedule.length >= 50) break
                if (currentDate.getTime() - startObj.getTime() > 365 * 24 * 60 * 60 * 1000) break
            }
            (formData as any)._groupId = groupId
        }

        let successCount = 0
        let failCount = 0
        const errors: string[] = []

        const processSingle = async (dateObj: Date, mode: 'check' | 'insert' = 'insert') => {
            const dateStr = getBrazilDateString(dateObj)
            const startDateTime = new Date(`${dateStr}T${time}:00-03:00`)
            const endDateTime = new Date(startDateTime.getTime() + duration * 60000)
            const dayOfWeek = getBrazilDay(startDateTime)

            const [profileRes, availabilityRes, appointmentsRes] = await Promise.all([
                supabase.from('profiles').select('allow_overbooking').eq('id', professional_id).single(),
                supabase.from('professional_availability')
                    .select('*')
                    .eq('profile_id', professional_id)
                    .eq('day_of_week', dayOfWeek),
                supabase.from('appointments')
                    .select('start_time, end_time, patient_id, patients(name), locations(name), type, professional_id, status')
                    .or(`professional_id.eq.${professional_id},professional_id.is.null`)
                    .neq('status', 'cancelled')
                    .lt('start_time', `${dateStr}T23:59:59-03:00`)
                    .gt('end_time', `${dateStr}T00:00:00-03:00`)
            ])

            const availabilitySlots = availabilityRes.data || []
            const existingAppointments = appointmentsRes.data || []

            const force_block_override = formData.get('force_block_override') === 'true'
            const effective_is_extra = is_extra || force_block_override

            let isWithinWorkingHours = false
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

            const { data: { user } } = await supabase.auth.getUser()

            if (!effective_is_extra) {
                for (const appt of existingAppointments) {
                    const apptStart = new Date(appt.start_time)
                    const apptEnd = new Date(appt.end_time)

                    if (startDateTime < apptEnd && endDateTime > apptStart) {
                        if (appt.type === 'block') return { error: `Horário bloqueado em ${dateStr}` }
                        if (type === 'block') {
                            if (!force_block_override) return { confirmationRequired: true, message: "Conflito: Bloqueio sobrepõe agendamentos.", context: 'block_overlap' }
                        } else {
                            const p: any = appt.patients
                            const patientName = Array.isArray(p) ? p[0]?.name : p?.name || 'Sem nome'
                            const startTimeStr = apptStart.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
                            return { error: `Conflito: ${patientName} às ${startTimeStr}` }
                        }
                    }
                }
            }

            if (location_id) {
                const { data: loc } = await supabase.from('locations').select('capacity').eq('id', location_id).single()
                if (loc && loc.capacity) {
                    const { count } = await supabase
                        .from('appointments')
                        .select('*', { count: 'exact', head: true })
                        .eq('location_id', location_id)
                        .neq('status', 'cancelled')
                        .lt('start_time', endDateTime.toISOString())
                        .gt('end_time', startDateTime.toISOString())

                    if ((count || 0) >= loc.capacity) return { error: `Local lotado! Cap: ${loc.capacity}` }
                }
            }

            if (mode === 'check') return { success: true }

            let finalNotes = notes
            const groupId = (formData as any)._groupId
            if (groupId) finalNotes = notes + `\n\n[GRP:${groupId}]`

            // [DB BYPASS] Use direct query for critical insert
            let newAppointment = null;
            let error = null;
            try {
                const { rows } = await db.query(`
                    INSERT INTO appointments (
                        patient_id, location_id, service_id, professional_id,
                        start_time, end_time, notes, status,
                        original_price, price, discount, addition,
                        payment_method_id, invoice_issued, is_extra, type
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                    RETURNING *
                `, [
                    type === 'appointment' ? patient_id : null,
                    location_id,
                    type === 'appointment' ? service_id : null,
                    professional_id,
                    startDateTime.toISOString(),
                    endDateTime.toISOString(),
                    finalNotes,
                    'scheduled',
                    cleanPrice,
                    finalPrice,
                    discount,
                    addition,
                    payment_method_id,
                    invoice_issued,
                    is_extra,
                    type
                ]);
                newAppointment = rows[0];
            } catch (dbErr: any) {
                console.error('DB Insert Error:', dbErr);
                error = dbErr;
            }

            if (error) {
                console.error('Error creating appt:', error)
                return { error: `Erro ao criar: ${error.message}` }
            }

            if (discount > 0 || addition > 0) {
                try {
                    await logAction('Agendamento com Ajuste', {
                        appointment_id: newAppointment.id,
                        base: cleanPrice, discount, addition, final: finalPrice, user_id: user?.id
                    }, 'appointments', newAppointment.id)
                } catch (logErr) { console.error("Log action failed:", logErr) }
            }

            try {
                const integRes = await supabase.from('professional_integrations' as any)
                    .select('*').eq('profile_id', professional_id).eq('provider', 'google_calendar').single()
                const integ: any = integRes.data

                if (integ) {
                    const { insertCalendarEvent } = await import('@/lib/google')
                    const { data: patient } = await supabase.from('patients').select('name').eq('id', patient_id!).single()
                    const { data: service } = await supabase.from('services').select('name').eq('id', service_id!).single()

                    const event = {
                        summary: `Agendamento: ${patient?.name || 'Paciente'}`,
                        description: `Serviço: ${service?.name || 'Consulta'}\nNotas: ${finalNotes || ''}`,
                        start: { dateTime: startDateTime.toISOString() },
                        end: { dateTime: endDateTime.toISOString() },
                    }

                    const googleEvent = await insertCalendarEvent(integ.access_token, integ.refresh_token, event)
                    if (googleEvent && googleEvent.id) {
                        await supabase.from('appointments' as any).update({ google_event_id: googleEvent.id }).eq('id', newAppointment.id)
                    }
                }
            } catch (gErr) { console.error("Google Sync failed:", gErr) }

            try {
                const { sendAppointmentMessage } = await import('@/app/dashboard/settings/communication/actions')
                sendAppointmentMessage(newAppointment.id, 'confirmation').catch(e => console.error("Confirmation Msg Error:", e))
            } catch (msgErr) { console.error("Msg Import Error:", msgErr) }

            return { success: true }
        }

        for (const dateObj of datesToSchedule) {
            const res = await processSingle(dateObj, 'check')
            if ((res as any).confirmationRequired) return res
            if (res.error) return res
        }

        for (const dateObj of datesToSchedule) {
            const res = await processSingle(dateObj, 'insert')
            if (res.success) successCount++
            else {
                failCount++
                if (res.error) errors.push(res.error)
            }
        }

        revalidatePath('/dashboard/schedule')
        if (failCount > 0) return { success: true, warning: `${successCount} criados. ${failCount} falharam.` }
        return { success: true }

    } catch (unexpectedError: any) {
        console.error("CRITICAL ERROR in createAppointment:", unexpectedError)
        return { error: `Erro inesperado no servidor: ${unexpectedError.message}` }
    }
}

// ... (previous code)

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
    const status = formData.get('status') as string || 'scheduled'
    const type = formData.get('type') as string

    const is_recurring = formData.get('is_recurring') === 'true'
    const recurrence_days = JSON.parse(formData.get('recurrence_days') as string || '[]')
    const recurrence_count = Number(formData.get('recurrence_count') || 1)
    const recurrence_end_date = formData.get('recurrence_end_date') as string
    const recurrence_end_type = formData.get('recurrence_end_type') as string

    if (!appointment_id) return { error: 'ID do agendamento não informado.' }

    const startDateTime = new Date(`${date}T${time}:00-03:00`)
    const { data: service } = await supabase.from('services').select('duration').eq('id', service_id).single()

    const customDuration = Number(formData.get('custom_duration'))
    const duration = (type === 'block' && customDuration > 0)
        ? customDuration
        : (service?.duration || 60)

    const endDateTime = new Date(startDateTime.getTime() + duration * 60000)
    const dayOfWeek = getBrazilDay(startDateTime)

    const [profileRes, availabilityRes, appointmentsRes] = await Promise.all([
        supabase.from('profiles').select('allow_overbooking').eq('id', professional_id).single(),
        supabase.from('professional_availability')
            .select('*')
            .eq('profile_id', professional_id)
            .eq('day_of_week', dayOfWeek),
        supabase.from('appointments')
            .select('id, start_time, end_time, patient_id, patients(name), type, professional_id')
            .eq('professional_id', professional_id)
            .neq('status', 'cancelled')
            .gt('end_time', `${date}T00:00:00-03:00`)
            .lt('start_time', `${date}T23:59:59-03:00`)
            .neq('id', appointment_id)
    ])

    const allowOverbooking = profileRes.data?.allow_overbooking || false
    const availabilitySlots = availabilityRes.data || []
    const existingAppointments = appointmentsRes.data || []

    const { data: { user } } = await supabase.auth.getUser()

    const force_block_override = formData.get('force_block_override') === 'true'
    const effective_is_extra = is_extra || force_block_override

    let isStatusUpdateOnly = false
    const { data: currentAppt } = await supabase.from('appointments').select('*').eq('id', appointment_id).single()

    if (currentAppt) {
        const currentStart = new Date(currentAppt.start_time).getTime()
        const currentEnd = new Date(currentAppt.end_time).getTime()
        const newStart = startDateTime.getTime()
        const newEnd = endDateTime.getTime()

        if (Math.abs(currentStart - newStart) < 2000 &&
            Math.abs(currentEnd - newEnd) < 2000 &&
            currentAppt.professional_id === professional_id) {
            isStatusUpdateOnly = true
        }
    }

    const invoice_issued = formData.get('invoice_issued') === 'true'

    if (!isStatusUpdateOnly) {
        for (const appt of existingAppointments) {
            if (appt.type === 'block') {
                const apptStart = new Date(appt.start_time)
                const apptEnd = new Date(appt.end_time)
                if (startDateTime < apptEnd && endDateTime > apptStart) {
                    if (user?.id !== appt.professional_id) {
                        return { error: 'Horário bloqueado. Apenas o profissional responsável pode permitir encaixes.' }
                    } else {
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

        if (location_id) {
            const { data: loc } = await supabase.from('locations').select('capacity').eq('id', location_id).single()
            if (loc && loc.capacity) {
                const { count } = await supabase
                    .from('appointments')
                    .select('*', { count: 'exact', head: true })
                    .eq('location_id', location_id)
                    .neq('status', 'cancelled')
                    .neq('id', appointment_id)
                    .lt('start_time', endDateTime.toISOString())
                    .gt('end_time', startDateTime.toISOString())

                if ((count || 0) >= loc.capacity) {
                    return { error: `Local lotado! Capacidade máxima: ${loc.capacity}.` }
                }
            }
        }

        if (!effective_is_extra) {
            if (type === 'block') {
                const conflict = existingAppointments.find(appt => {
                    const apptStart = new Date(appt.start_time)
                    const apptEnd = new Date(appt.end_time)
                    return (startDateTime < apptEnd && endDateTime > apptStart)
                })

                if (conflict) {
                    if (!force_block_override) {
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
    }

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
        payment_method_id: payment_method_id || null,
        invoice_issued: invoice_issued,
        is_extra: is_extra,
        status: status
    }).eq('id', appointment_id)

    if (error) {
        console.error('Error updating appointment:', error)
        return { error: `Erro ao atualizar: ${error.message}` }
    }

    if (discount > 0 || addition > 0) {
        await logAction(
            'Agendamento Atualizado (Valores)',
            { appointment_id, base: cleanPrice, discount, addition, final: finalPrice },
        )
    }

    try {
        const { data: updatedAppt } = await supabase.from('appointments').select('*').eq('id', appointment_id).single()

        if (updatedAppt && (updatedAppt as any).google_event_id) {
            const integRes = await supabase.from('professional_integrations' as any)
                .select('*').eq('profile_id', professional_id).eq('provider', 'google_calendar').single()
            const integ: any = integRes.data

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

                await updateCalendarEvent(integ.access_token, integ.refresh_token, (updatedAppt as any).google_event_id, event)
            }
        }
    } catch (err) {
        console.error('Google Sync Update Error:', err)
    }

    await syncInvoiceAndCommission(supabase, appointment_id, status)

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/schedule')

    if (is_recurring) {
        const datesToSchedule: Date[] = []
        const startObj = new Date(date + 'T12:00:00')

        let currentDate = new Date(startObj)
        currentDate.setDate(currentDate.getDate() + 1)

        let count = 0
        const targetCount = recurrence_end_type === 'count' ? recurrence_count - 1 : 999
        if (targetCount <= 0 && recurrence_end_type === 'count') return { success: true }

        const hardEndDate = recurrence_end_type === 'date' && recurrence_end_date
            ? new Date(recurrence_end_date + 'T12:00:00')
            : null

        while (true) {
            const dayIdx = getBrazilDay(currentDate)

            if (recurrence_days.includes(dayIdx)) {
                if (recurrence_end_type === 'count' && count >= targetCount) break
                if (hardEndDate && currentDate > hardEndDate) break

                datesToSchedule.push(new Date(currentDate))
                count++
            }

            currentDate.setDate(currentDate.getDate() + 1)
            if (count >= 50 || datesToSchedule.length >= 50) break
            if (currentDate.getTime() - startObj.getTime() > 365 * 24 * 60 * 60 * 1000) break
        }

        const processFuture = async (dateObj: Date) => {
            const fDateStr = dateObj.toISOString().split('T')[0]
            const fStart = new Date(`${fDateStr}T${time}:00-03:00`)
            const fEnd = new Date(fStart.getTime() + duration * 60000)
            const fDay = getBrazilDay(fStart)

            const [pRes, aRes, appRes] = await Promise.all([
                supabase.from('profiles').select('allow_overbooking').eq('id', professional_id).single(),
                supabase.from('professional_availability').select('*').eq('profile_id', professional_id).eq('day_of_week', fDay),
                supabase.from('appointments').select('start_time, end_time').eq('professional_id', professional_id).gte('start_time', `${fDateStr}T00:00:00`).lte('end_time', `${fDateStr}T23:59:59`)
            ])

            const allow = pRes.data?.allow_overbooking
            const slots = aRes.data || []
            const existing = appRes.data || []

            if (!is_extra && !allow) {
                let isWorking = false
                const getMins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
                const sMins = getMins(time)
                const eMins = sMins + duration
                for (const s of slots) {
                    if (sMins >= getMins(s.start_time) && eMins <= getMins(s.end_time)) isWorking = true
                }
                if (!isWorking && slots.length > 0) return { error: 'Indisponível' }
            }

            if (!is_extra && !allow) {
                for (const e of existing) {
                    const eS = new Date(e.start_time); const eE = new Date(e.end_time)
                    if (fStart < eE && fEnd > eS) return { error: 'Conflito' }
                }
            }

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

// ... (previous code)

export async function deleteAppointment(appointmentId: string, deleteAll: boolean = false, password?: string) {
    const supabase = await createClient()

    if (password) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user && user.email) {
            const { error: authError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: password
            })
            if (authError) {
                console.error("Password verification failed:", authError)
                return { error: 'Senha incorreta. Ação cancelada.' }
            }
        }
    }

    let appointmentDetails = null
    try {
        const { data } = await supabase.from('appointments').select('*').eq('id', appointmentId).single()
        appointmentDetails = data
    } catch (err) {
        console.error('Error fetching details for deletion:', err)
    }

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

    if (appointmentDetails && (appointmentDetails as any).google_event_id) {
        try {
            const integRes = await supabase.from('professional_integrations' as any)
                .select('*').eq('profile_id', appointmentDetails.professional_id).eq('provider', 'google_calendar').single()
            const integ: any = integRes.data

            if (integ) {
                const { deleteCalendarEvent } = await import('@/lib/google')
                await deleteCalendarEvent(integ.access_token, integ.refresh_token, (appointmentDetails as any).google_event_id)
            }
        } catch (err) {
            console.error('Google Sync Delete Error:', err)
        }
    }

    const { error: recordsError } = await supabase.from('patient_records').delete().eq('appointment_id', appointmentId)
    if (recordsError) return { error: 'Falha ao remover prontuários associados.' }

    const { error: commError } = await supabase.from('financial_commissions').delete().eq('appointment_id', appointmentId)
    if (commError) console.error('Error deleting commissions:', commError)

    const { error: invError } = await supabase.from('invoices').delete().eq('appointment_id', appointmentId)
    if (invError) console.error('Error deleting invoices:', invError)

    const { error } = await supabase.from('appointments').delete().eq('id', appointmentId)

    if (error) {
        console.error('Error deleting appointment:', error)
        if (error.code === '23503') return { error: 'Não é possível excluir. Existem registros dependentes.' }
        return { error: 'Erro ao excluir agendamento.' }
    }

    try {
        if (appointmentDetails) {
            await logAction(
                'Agendamento Cancelado',
                {
                    appointment_id: appointmentId,
                    professional_id: appointmentDetails.professional_id,
                    google_event_id: (appointmentDetails as any).google_event_id
                },
                'appointments',
                appointmentId
            )
        }
    } catch (err) { }

    revalidatePath('/dashboard/schedule')
    return { success: true }
}

export async function updateAppointmentStatus(
    appointmentId: string,
    status: string,
    paymentDetails?: { method: string, date?: string }
) {
    const supabase = await createClient()

    try {
        const updateData: any = { status }
        if (paymentDetails?.method) {
            updateData.payment_method_id = paymentDetails.method
        }

        const { error } = await supabase.from('appointments').update(updateData).eq('id', appointmentId)
        if (error) return { error: 'Erro ao atualizar status.' }

        await syncInvoiceAndCommission(supabase, appointmentId, status, paymentDetails)

        revalidatePath('/dashboard/schedule')
        revalidatePath('/dashboard')
        return { success: true }
    } catch (err: any) {
        console.error('Fatal Update Error:', err)
        return { error: 'Erro de sistema: ' + err.message }
    }
}

export async function syncInvoiceAndCommission(
    supabase: any,
    appointmentId: string,
    status: string,
    paymentDetails?: { method: string, date?: string }
) {
    const { data: appointment } = await supabase.from('appointments').select('*').eq('id', appointmentId).single()

    if (appointment) {
        let invoiceStatus = null;
        if (status === 'completed') invoiceStatus = 'paid'
        else if (status === 'attended') invoiceStatus = 'pending'
        else if (['scheduled', 'cancelled', 'no_show', 'blocked'].includes(status)) {
            invoiceStatus = 'cancelled'
        }

        if (invoiceStatus) {
            const { data: invItems } = await supabase.from('invoice_items').select('invoice_id').eq('appointment_id', appointmentId).single()
            const invoiceId = appointment.invoice_id || invItems?.invoice_id

            if (invoiceId) {
                const updatePayload: any = { status: invoiceStatus }
                if (invoiceStatus === 'paid' && paymentDetails?.method) {
                    updatePayload.payment_method = paymentDetails.method
                    updatePayload.payment_date = paymentDetails.date || new Date().toISOString()
                }
                await supabase.from('invoices').update(updatePayload).eq('id', invoiceId)
            }
        }

        if (status === 'completed') {
            try {
                await calculateAndSaveCommission(supabase, appointment)
            } catch (commError) { }
        } else {
            await supabase.from('financial_commissions').delete().eq('appointment_id', appointmentId)
        }
    }
}

export async function calculateAndSaveCommission(supabase: any, appointment: any) {
    if (appointment.status !== 'completed') return

    let invoiceId = appointment.invoice_id
    if (!invoiceId) {
        const { data: link } = await supabase.from('invoice_items').select('invoice_id').eq('appointment_id', appointment.id).single()
        if (link) invoiceId = link.invoice_id
    }

    if (!invoiceId) return

    const professionalId = appointment.professional_id
    const serviceId = appointment.service_id
    const price = Number(appointment.price)

    const { data: rules } = await supabase.from('professional_commission_rules').select('*').eq('professional_id', professionalId)

    let rule = rules?.find((r: any) => r.service_id === serviceId)
    if (!rule) rule = rules?.find((r: any) => r.service_id === null)

    if (rule) {
        let basis = price
        const { data: invoice } = await supabase.from('invoices').select('payment_method, installments, applied_fee_rate').eq('id', invoiceId).single()

        if (invoice) {
            let feePercent = 0
            if (invoice.applied_fee_rate !== null && invoice.applied_fee_rate !== undefined) {
                feePercent = Number(invoice.applied_fee_rate)
            } else if (invoice.payment_method) {
                const { data: fees } = await supabase.from('payment_method_fees').select('fee_percent').eq('method', invoice.payment_method).eq('installments', invoice.installments || 1).single()
                if (fees) feePercent = fees.fee_percent
            }

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

        const { data: existingComm } = await supabase.from('financial_commissions').select('id, status').eq('appointment_id', appointment.id).single()

        if (existingComm) {
            if (existingComm.status === 'paid') return
            await supabase.from('financial_commissions').update({
                amount: commissionValue,
                professional_id: professionalId,
                updated_at: new Date().toISOString()
            }).eq('id', existingComm.id)
        } else {
            await supabase.from('financial_commissions').insert({
                professional_id: professionalId,
                appointment_id: appointment.id,
                amount: commissionValue,
                status: 'pending'
            })
        }
    }
}

export async function getAvailableSlots(professionalId: string, dateStr: string, duration: number = 45) {
    const supabase = await createClient()

    if (!professionalId || !dateStr) return []

    const dayOfWeek = getBrazilDay(new Date(dateStr + 'T12:00:00-03:00'))

    const { data: availability } = await supabase.from('professional_availability').select('*').eq('profile_id', professionalId).eq('day_of_week', dayOfWeek)
    if (!availability || availability.length === 0) return []

    const { data: appointments } = await supabase
        .from('appointments')
        .select('start_time, end_time')
        .eq('professional_id', professionalId)
        .neq('status', 'cancelled')
        .gte('start_time', `${dateStr}T00:00:00`)
        .lte('end_time', `${dateStr}T23:59:59`)

    const toMins = (t: string) => {
        const [h, m] = t.split(':').map(Number)
        return h * 60 + m
    }
    const toTime = (m: number) => {
        const h = Math.floor(m / 60)
        const min = m % 60
        return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
    }

    const slots: string[] = []

    availability.forEach(range => {
        let currentMins = toMins(range.start_time)
        const endMins = toMins(range.end_time)

        while (currentMins + duration <= endMins) {
            const slotStart = currentMins
            const slotEnd = currentMins + duration

            const isBlocked = appointments?.some(appt => {
                const apptStart = new Date(appt.start_time)
                const apptEnd = new Date(appt.end_time)
                const apptStartMins = getBrazilHour(apptStart) * 60 + getBrazilMinutes(apptStart)
                const apptEndMins = getBrazilHour(apptEnd) * 60 + getBrazilMinutes(apptEnd)
                return slotStart < apptEndMins && slotEnd > apptStartMins
            })

            if (!isBlocked) {
                slots.push(toTime(slotStart))
            }
            currentMins += 15
        }
    })

    return slots.sort()
}



