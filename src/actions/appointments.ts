"use server"

import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getBrazilDate, getBrazilDay, getBrazilHour, getBrazilMinutes, getBrazilDateString } from "@/lib/date-utils"
import { logAction } from '@/lib/logger'
import { NotificationService } from "@/lib/notifications"
import { createAdminClient } from "@/lib/supabase/admin"
import { format as formatTz } from 'date-fns-tz'
import { DEFAULT_TIMEZONE } from "@/lib/date-utils"
import { sendAppointmentMessage } from "@/app/dashboard/[slug]/settings/communication/actions"

// [REFACTORED] Use Supabase Client to avoid connecting failures on Vercel
export async function getAppointments(slug?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Fetch Profile for Role check (even if we use adminSupabase for data)
    const { data: profile } = await supabase.from('profiles').select('organization_id, role').eq('id', user.id).single()
    let userOrgId = profile?.organization_id

    const adminSupabase = createAdminClient()

    if (slug) {
        const { data: orgData } = await adminSupabase.from('organizations').select('id').eq('slug', slug).single()
        if (orgData) userOrgId = orgData.id
    }

    // [PRIVACY] Master user (Warley) should NOT see sensitive data from other clinics 
    // unless they are explicitly members of that clinic.
    const MASTER_ORG_ID = '9571532e-fdf8-4aaa-b236-416fd6459566'
    const isMaster = (profile as any)?.role === 'master' || user.email === 'wmelot@gmail.com'

    // EXCEPTION: In Access Fisio, Master sees EVERYTHING
    const isAccessOrg = slug === 'access-fisioterapia' || userOrgId === MASTER_ORG_ID

    if (isMaster && !isAccessOrg && slug) {
        // [WARNING] Block sensitive data viewing for Master in 3rd party clinics
        console.warn(`Master user ${user.email} blocked from viewing sensitive data in Org ${slug}`)
        return []
    }

    if (!userOrgId) return []

    try {
        const cutoffDate = new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString()

        const { data, error } = await adminSupabase
            .from('appointments')
            .select(`
                *,
                patients:patient_id (id, name),
                profiles:professional_id (id, full_name, color),
                services:service_id (id, name, color),
                invoices!invoices_appointment_id_fkey (status)
            `)
            .or(`organization_id.eq.${userOrgId},professional_id.eq.${user.id},professional_id.is.null`)
            .or(`status.neq.cancelled,status.is.null`)
            .gte('start_time', cutoffDate)
            .order('start_time', { ascending: true })
            .limit(3000)

        if (error) {
            console.error('Supabase Appointments Error:', error)
            return []
        }

        // Normalize Data Shape
        return data.map((r: any) => {
            // [FIX] Supabase can return arrays or objects depending on join type/count.
            // We ensure we get the FIRST item if it's an array, or the object itself.
            const pResults = r.patients || r.patient;
            const patient = Array.isArray(pResults) ? pResults[0] : pResults;

            const prResults = r.profiles || r.profile;
            const profileData = Array.isArray(prResults) ? prResults[0] : prResults;

            const sResults = r.services || r.service;
            const serviceData = Array.isArray(sResults) ? sResults[0] : sResults;

            return {
                ...r,
                start_time: new Date(r.start_time).toISOString(),
                end_time: new Date(r.end_time).toISOString(),
                // Use plural name to match expected prop in AppointmentCard/Calendar
                patients: patient || null,
                profiles: profileData || null,
                services: serviceData || null,
                invoices: r.invoices || []
            }
        })

    } catch (error) {
        console.error('Error fetching appointments:', error)
        return []
    }
}

// [NEW] Async Patient Search for Performance
export async function searchPatients(query: string, slug?: string) {
    const supabase = await createClient()

    if (!query || query.length < 2) return []

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    let userOrgId: string | undefined
    if (slug) {
        const { data: orgData } = await supabase.from('organizations').select('id').eq('slug', slug).single()
        if (orgData) userOrgId = orgData.id
    }

    if (!userOrgId) {
        const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
        userOrgId = profile?.organization_id
    }

    const MASTER_ORG_ID = '9571532e-fdf8-4aaa-b236-416fd6459566'
    const isMaster = user.email === 'wmelot@gmail.com'
    if (isMaster && userOrgId !== MASTER_ORG_ID) return []

    const adminSupabase = createAdminClient()

    const { data } = await adminSupabase
        .from('patients')
        .select('id, name, phone')
        .eq('organization_id', userOrgId as string) // SECURE FILTER
        .ilike('name', `%${query}%`)
        .limit(50)
        .order('name')

    return data || []
}

export async function getAppointmentFormData(slug?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { patients: [], locations: [], services: [], professionals: [], serviceLinks: [], holidays: [], priceTables: [], paymentMethods: [], defaultLocationId: null }

    // Fetch Org ID from Profile
    const { data: profile } = await supabase.from('profiles').select('organization_id, role').eq('id', user.id).single()
    let orgId = profile?.organization_id

    if (slug) {
        const { data: orgData } = await supabase.from('organizations').select('id').eq('slug', slug).single()
        if (orgData) orgId = orgData.id
    }

    // [PRIVACY] Master user (Warley) should NOT see patients list from other clinics
    const ACCESS_ORG_SLUG = 'access-fisioterapia'
    const isMaster = user.email === 'wmelot@gmail.com'
    const isAccessOrg = slug === ACCESS_ORG_SLUG || orgId === '9571532e-fdf8-4aaa-b236-416fd6459566'

    // [NEW] Use Admin Client for Form Data too to ensure master sees everything
    const adminSupabase = createAdminClient()

    // Parallel Fetch using Admin Supabase
    const [locationsRes, servicesRes, serviceLinksRes, availabilityRes, professionalsRes, holidays, priceTables, paymentMethods, initialPatientsRes] = await Promise.all([
        orgId ? adminSupabase.from('locations').select('id, name, color, capacity').eq('organization_id', orgId).order('name') : Promise.resolve({ data: [] }),
        orgId ? adminSupabase.from('services').select('id, name, duration, price').eq('organization_id', orgId).eq('active', true).order('name') : Promise.resolve({ data: [] }),
        adminSupabase.from('service_professionals').select('service_id, profile_id'),
        adminSupabase.from('professional_availability').select('location_id').eq('profile_id', user.id).limit(1),
        orgId ? adminSupabase.from('profiles').select('id, full_name, photo_url, color, role, slot_interval, professional_availability(day_of_week, start_time, end_time, location_id)').eq('organization_id', orgId).order('full_name') : Promise.resolve({ data: [] }),
        adminSupabase.from('holidays' as any).select('date, name, type, is_mandatory'),
        orgId ? adminSupabase.from('price_tables' as any).select('id, name').eq('organization_id', orgId).order('name') : Promise.resolve({ data: [] }),
        adminSupabase.from('payment_methods').select('id, name, slug').eq('active', true).order('name'),
        orgId && (!isMaster || isAccessOrg) ? adminSupabase.from('patients').select('id, name').eq('organization_id', orgId).order('name').limit(200) : Promise.resolve({ data: [] })
    ])

    const defaultLocationId = (availabilityRes.data && availabilityRes.data.length > 0) ? availabilityRes.data[0].location_id : null

    const userRole = (profile as any)?.role

    // Ensure current user is in professionals if they are admin/master but not strictly in that org's profile list
    let allProfessionals = professionalsRes.data || []
    const isOwner = userRole === 'master' || userRole === 'admin'
    if (isOwner && !allProfessionals.find(p => p.id === user.id)) {
        // [FIX] Must include professional_availability to show white slots for master/owner
        const { data: myProfile } = await adminSupabase
            .from('profiles')
            .select('id, full_name, photo_url, color, role, slot_interval, professional_availability(day_of_week, start_time, end_time, location_id)')
            .eq('id', user.id)
            .single()
        if (myProfile) allProfessionals.push(myProfile)
    }

    return {
        patients: initialPatientsRes.data || [],
        locations: locationsRes.data || [],
        services: servicesRes.data || [],
        professionals: allProfessionals,
        serviceLinks: serviceLinksRes.data || [],
        holidays: holidays.data || [],
        priceTables: priceTables.data || [],
        paymentMethods: paymentMethods.data || [],
        defaultLocationId,
        userRole,
        currentUserId: user.id
    }
}

// ... (previous code)

export async function createAppointment(formData: FormData) {
    try {
        const supabase = await createClient()

        // [CRITICAL FIX] Fetch User & Org ID ONCE at start
        const { data: { user } } = await supabase.auth.getUser()
        if (!user?.id) return { error: 'Usuário não autenticado.' }

        const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
        const organization_id = profile?.organization_id

        if (!organization_id) {
            console.error("Critical: User has no Organization ID linked.")
            return { error: 'Erro de permissão: Organização não encontrada.' }
        }

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
        let card_brand_id = formData.get('card_brand_id') as string
        if (card_brand_id === 'null' || card_brand_id === '') {
            card_brand_id = null as any
        }
        let acquirer_id = formData.get('acquirer_id') as string
        if (acquirer_id === 'null' || acquirer_id === '') {
            acquirer_id = null as any
        }
        const installments = Number(formData.get('installments') || 1)
        const invoice_issued = formData.get('invoice_issued') === 'true'
        const finalPrice = Math.max(0, cleanPrice - discount + addition)


        if (is_recurring) {
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

        // [REFACTORED] processSingle now uses scope variables, avoiding redundant DB calls
        const processSingle = async (dateObj: Date, mode: 'check' | 'insert' = 'insert') => {
            const dateStr = getBrazilDateString(dateObj)
            const startDateTime = new Date(`${dateStr}T${time}:00-03:00`)
            const endDateTime = new Date(startDateTime.getTime() + duration * 60000)
            const dayOfWeek = getBrazilDay(startDateTime)

            // 1. Parallel Validations
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

            const conflicts: string[] = []
            let confirmationRequired = false

            if (!effective_is_extra) {
                // Professional Conflict Check
                for (const appt of existingAppointments) {
                    const apptStart = new Date(appt.start_time)
                    const apptEnd = new Date(appt.end_time)

                    if (startDateTime < apptEnd && endDateTime > apptStart) {
                        if (appt.type === 'block') {
                            conflicts.push(`O horário já possui um bloqueio (${appt.notes || 'Sem título'})`)
                            confirmationRequired = true
                            continue // Don't return error, just add to conflicts to ask confirmation
                        }

                        const p: any = appt.patients
                        const patientName = Array.isArray(p) ? p[0]?.name : p?.name || 'Sem nome'
                        const startTimeStr = apptStart.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })

                        if (type === 'block') {
                            conflicts.push(`Horário ocupado por ${patientName} (${startTimeStr})`)
                            confirmationRequired = true
                        } else {
                            conflicts.push(`Profissional já tem agendamento com ${patientName} às ${startTimeStr}`)
                            confirmationRequired = true
                        }
                    }
                }

                // Location Conflict Check
                if (location_id) {
                    const { data: loc } = await supabase.from('locations').select('name, capacity').eq('id', location_id).single()
                    if (loc && loc.capacity) {
                        const { count } = await supabase
                            .from('appointments')
                            .select('*', { count: 'exact', head: true })
                            .eq('location_id', location_id)
                            .neq('status', 'cancelled')
                            .lt('start_time', endDateTime.toISOString())
                            .gt('end_time', startDateTime.toISOString())

                        if ((count || 0) >= loc.capacity) {
                            conflicts.push(`Local [${loc.name}] já atingiu a capacidade máxima de ${loc.capacity} atendimentos simultâneos`)
                            confirmationRequired = true
                        }
                    }
                }
            }

            if (confirmationRequired && !force_block_override) {
                const title = type === 'block' ? "Confirmar Bloqueio" : "Confirmar Encaixe/Conflito"
                const msg = `⚠️ IDENTIFICAMOS CONFLITOS:\n\n${conflicts.map(c => `• ${c}`).join('\n')}\n\nDeseja prosseguir com o agendamento mesmo assim?`
                return { confirmationRequired: true, message: msg, context: 'conflict_override' }
            }

            if (mode === 'check') return { success: true }

            let finalNotes = notes
            const groupId = (formData as any)._groupId
            if (groupId) finalNotes = notes + `\n\n[GRP:${groupId}]`

            // [FIXED] Insert using the securely fetched organization_id
            const { data: apptRes, error: dbErr } = await supabase
                .from('appointments')
                .insert({
                    patient_id: type === 'appointment' ? patient_id : null,
                    location_id,
                    service_id: type === 'appointment' ? service_id : null,
                    professional_id,
                    start_time: startDateTime.toISOString(),
                    end_time: endDateTime.toISOString(),
                    notes: finalNotes,
                    status: 'scheduled',
                    original_price: cleanPrice,
                    price: finalPrice,
                    discount,
                    addition,
                    payment_method_id,
                    card_brand_id,
                    acquirer_id,
                    installments,
                    invoice_issued,
                    is_extra,
                    type,
                    organization_id: organization_id // Explicitly set!
                })
                .select('*')
                .single()

            if (dbErr) {
                console.error('Error creating appt:', dbErr)
                return { error: `Erro ao criar: ${dbErr.message}` }
            }

            const newAppointment = apptRes;

            // ... (Logging logic same as before, omitted strictly in edit but implicit in flow if we kept it, but here I am rewriting the block so I must include it)
            if (discount > 0 || addition > 0) {
                try {
                    await logAction('Agendamento com Ajuste', {
                        appointment_id: newAppointment.id,
                        base: cleanPrice, discount, addition, final: finalPrice, user_id: user?.id
                    }, 'appointments', newAppointment.id)
                } catch (logErr) { console.error("Log action failed:", logErr) }
            }

            // Google Sync (Simplified for brevity in fix, but keeping logic)
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
                sendAppointmentMessage(newAppointment.id, 'appointment_confirmation_immediate').catch((e: any) => console.error("Immediate Confirmation Msg Error:", e))
            } catch (msgErr) { console.error("Msg sending error:", msgErr) }

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
        const conflicts: string[] = []
        let confirmationRequired = false

        if (!effective_is_extra) {
            // Professional Check
            for (const appt of existingAppointments) {
                const apptStart = new Date(appt.start_time)
                const apptEnd = new Date(appt.end_time)

                if (startDateTime < apptEnd && endDateTime > apptStart) {
                    if (appt.type === 'block') {
                        if (user?.id !== appt.professional_id) {
                            return { error: '⚠️ Horário Bloqueado: Apenas o profissional responsável pode permitir encaixes sobre bloqueios.' }
                        } else {
                            conflicts.push(`O horário possui um bloqueio pessoal seu.`)
                            confirmationRequired = true
                        }
                    } else {
                        const p: any = appt.patients
                        const patientName = Array.isArray(p) ? p[0]?.name : p?.name || 'Sem nome'
                        const startTimeStr = apptStart.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })

                        if (type === 'block') {
                            conflicts.push(`Bloqueio sobrepõe o agendamento de ${patientName} às ${startTimeStr}`)
                        } else {
                            conflicts.push(`Profissional já tem agendamento com ${patientName} às ${startTimeStr}`)
                        }
                        confirmationRequired = true
                    }
                }
            }

            // Location Check
            if (location_id) {
                const { data: loc } = await supabase.from('locations').select('name, capacity').eq('id', location_id).single()
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
                        conflicts.push(`Local [${loc.name}] já atingiu a capacidade máxima de ${loc.capacity} atendimentos simulâneos`)
                        confirmationRequired = true
                    }
                }
            }
        }

        if (confirmationRequired && !force_block_override) {
            const title = type === 'block' ? "Mover Bloqueio" : "Confirmar Conflito ao Editar"
            const msg = `⚠️ IDENTIFICAMOS CONFLITOS AO ALTERAR:\n\n${conflicts.map(c => `• ${c}`).join('\n')}\n\nDeseja salvar as alterações mesmo assim?`
            return { confirmationRequired: true, message: msg, context: 'conflict_override' }
        }
    }

    const cleanPrice = price ? Number(price.replace(/[^0-9,]/g, '').replace(',', '.')) : 0
    const discount = Number(formData.get('discount') || 0)
    const addition = Number(formData.get('addition') || 0)
    let payment_method_id = formData.get('payment_method_id') as string // [NEW]
    if (payment_method_id === 'null' || payment_method_id === '') {
        payment_method_id = null as any
    }
    let card_brand_id = formData.get('card_brand_id') as string
    if (card_brand_id === 'null' || card_brand_id === '') {
        card_brand_id = null as any
    }
    let acquirer_id = formData.get('acquirer_id') as string
    if (acquirer_id === 'null' || acquirer_id === '') {
        acquirer_id = null as any
    }
    const installments = Number(formData.get('installments') || 1)
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
        card_brand_id: card_brand_id || null,
        acquirer_id: acquirer_id || null,
        installments,
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


            // Get organization_id from the original appointment
            const { data: originalAppt } = await supabase
                .from('appointments')
                .select('organization_id')
                .eq('id', appointment_id)
                .single()

            const { error } = await supabase.from('appointments').insert({
                patient_id,
                location_id: location_id || null,
                service_id,
                professional_id,
                organization_id: originalAppt?.organization_id, // Include organization_id
                start_time: fStart.toISOString(),
                end_time: fEnd.toISOString(),
                notes,
                price: cleanPrice,
                is_extra,
                status: 'scheduled'
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

export async function deleteAppointment(appointmentId: string, deleteAll: boolean = false) {
    const supabase = await createClient()

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
            // [NEW] Waitlist notification logic
            const dateStr = new Date(appointmentDetails.start_time).toISOString().split('T')[0]
            const timeStr = new Date(appointmentDetails.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

            const { data: waiting } = await supabase
                .from('waitlist')
                .select('*, patient:patients(name, phone)')
                .eq('professional_id', appointmentDetails.professional_id)
                .eq('preferred_date', dateStr)
                .eq('status', 'pending')

            if (waiting && waiting.length > 0) {
                for (const entry of waiting) {
                    // Start notification process
                    await NotificationService.notifyWaitlist(
                        appointmentDetails.organization_id,
                        appointmentDetails.professional_id,
                        dateStr,
                        timeStr
                    )
                    // Mark as notified in DB
                    await supabase.from('waitlist').update({
                        status: 'notified',
                        notified_at: new Date().toISOString()
                    } as any).eq('id', entry.id)
                }
            }

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
    } catch (err) {
        console.error("Error in post-deletion logic:", err)
    }

    revalidatePath('/dashboard/schedule')
    return { success: true }
}

export async function updateAppointmentStatus(
    appointmentId: string,
    status: string,
    paymentDetails?: { method: string, date?: string },
    slug?: string
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

        if (slug) {
            revalidatePath(`/dashboard/${slug}/schedule`)
            revalidatePath(`/dashboard/${slug}`)
        } else {
            revalidatePath('/dashboard/schedule')
            revalidatePath('/dashboard')
        }
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
        // 'billed' and 'attended' are the valid final statuses (not 'completed')
        if (status === 'billed' || status === 'attended') invoiceStatus = 'paid'
        else if (status === 'completed') invoiceStatus = 'paid' // Legacy support
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

        // Calculate commission for completed appointments (billed, attended, or legacy 'completed')
        if (status === 'billed' || status === 'attended' || status === 'completed') {
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

export async function getAvailableSlots(professionalId: string, date: string, serviceId?: string) {
    try {
        const supabase = await createClient()

        // 1. Fetch Professional Config (Interval + Availability)
        const [profRes, appsRes, serviceRes] = await Promise.all([
            supabase.from('profiles').select('slot_interval, buffer_enabled, buffer_time, professional_availability(*)').eq('id', professionalId).single(),
            supabase.from('appointments')
                .select('start_time, end_time')
                .eq('professional_id', professionalId)
                .neq('status', 'cancelled')
                .gte('start_time', `${date}T00:00:00-03:00`)
                .lte('start_time', `${date}T23:59:59-03:00`),
            serviceId ? supabase.from('services').select('duration').eq('id', serviceId).single() : Promise.resolve({ data: null })
        ])

        const prof = profRes.data
        if (!prof) return []

        const buffer = (prof.buffer_enabled && prof.buffer_time) ? prof.buffer_time : 0
        const interval = prof.slot_interval || 30
        const duration = serviceRes.data?.duration || interval
        const availability = prof.professional_availability || []
        const existingApps = appsRes.data || []

        // 2. Determine Day of Week (0=Sunday, 1=Monday, etc.)
        // Ensure date parsing doesn't shift days due to timezone
        const [y, m, d] = date.split('-').map(Number)
        const dateObj = new Date(y, m - 1, d, 12, 0, 0)
        const dayOfWeek = getBrazilDay(dateObj)

        const daySlots = (availability as any[]).filter(s => s.day_of_week === dayOfWeek)
        if (daySlots.length === 0) return []

        // Helper to convert HH:mm or ISO to minutes from midnight (EXTREMELY ROBUST BRAZIL VERSION)
        const toMins = (timeOrIso: string) => {
            if (timeOrIso.includes('T') || timeOrIso.includes('Z')) {
                // For ISO strings, we must extract the hour/min in America/Sao_Paulo specifically
                const zonedStr = formatTz(new Date(timeOrIso), 'HH:mm', { timeZone: DEFAULT_TIMEZONE })
                const [h, m] = zonedStr.split(':').map(Number)
                return h * 60 + m
            }
            // For time strings without date (HH:mm:ss), split normally
            const [h, m] = timeOrIso.split(':').map(Number)
            return h * 60 + m
        }

        const busyMins = existingApps.map(app => {
            const start = toMins(app.start_time)
            const end = toMins(app.end_time) + buffer
            console.log(`[getAvailableSlots] Busy: ${app.start_time} -> StartMins: ${start}, EndMins: ${end}`)
            return { start, end }
        })

        console.log(`[getAvailableSlots] Prof ${professionalId} on ${date}: Interval=${interval}, Duration=${duration}, BusyItems=${busyMins.length}`)

        const slots: string[] = []

        // 3. Generate Potential Slots
        daySlots.forEach(avail => {
            const startMins = toMins(avail.start_time)
            const endMins = toMins(avail.end_time)

            console.log(`[getAvailableSlots] Processing Range: ${avail.start_time} (${startMins}m) to ${avail.end_time} (${endMins}m). Duration: ${duration}m`)

            let currentMins = startMins
            while (currentMins + duration <= endMins) {
                const hour = Math.floor(currentMins / 60)
                const min = currentMins % 60
                const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`

                const slotStart = currentMins
                const slotEnd = currentMins + duration

                const isBlocked = busyMins.some(busy => {
                    // Overlap check: slot starts before busy ends AND slot ends after busy starts
                    return slotStart < busy.end && slotEnd > busy.start
                })

                if (!isBlocked) {
                    slots.push(timeStr)
                }

                currentMins += interval
            }
        })

        return slots.sort()
    } catch (error) {
        console.error("Error fetching available slots:", error)
        return []
    }
}

/**
 * Public confirmation of an appointment (no session required)
 * This uses createAdminClient to bypass RLS for this specific update.
 */
export async function confirmAppointmentPublic(appointmentId: string) {
    const supabase = await createAdminClient()

    try {
        // 1. Fetch current status to avoid redundant updates
        const { data: appt, error: fetchError } = await supabase
            .from('appointments')
            .select('status, organization_id')
            .eq('id', appointmentId)
            .single()

        if (fetchError || !appt) return { success: false, error: 'Consulta não encontrada.' }

        // 2. Perform Update to 'confirmed'
        const { error: updateError } = await supabase
            .from('appointments')
            .update({ status: 'confirmed' })
            .eq('id', appointmentId)

        if (updateError) throw updateError

        // 3. Optional: Sync and Revalidate
        // Since we don't have the slug here easily (unless we fetch organization), 
        // we use the organization_id to find the slug if we want to revalidate paths.
        const { data: org } = await supabase.from('organizations').select('slug').eq('id', appt.organization_id).single()

        if (org?.slug) {
            revalidatePath(`/dashboard/${org.slug}/schedule`)
            revalidatePath(`/dashboard/${org.slug}`)
        }

        return { success: true }
    } catch (e: any) {
        console.error("Confirm Public Error:", e)
        return { success: false, error: 'Falha ao processar confirmação.' }
    }
}
