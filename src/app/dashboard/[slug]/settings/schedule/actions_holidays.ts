'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { addDays, format, getYear } from "date-fns"
import { getStartOfDayBRT, getEndOfDayBRT, parseBrazilDate, formatBrazilDate, DEFAULT_TIMEZONE } from "@/lib/date-utils"
import { toZonedTime } from 'date-fns-tz'

// Calculate Easter Date (Meeus/Jones/Butcher's Algorithm)
// Returns a Date object in São Paulo timezone
function getEasterDate(year: number): Date {
    const a = year % 19
    const b = Math.floor(year / 100)
    const c = year % 100
    const d = Math.floor(b / 4)
    const e = b % 4
    const f = Math.floor((b + 8) / 25)
    const g = Math.floor((b - f + 1) / 3)
    const h = (19 * a + b - d - g + 15) % 30
    const i = Math.floor(c / 4)
    const k = c % 4
    const l = (32 + 2 * e + 2 * i - h - k) % 7
    const m = Math.floor((a + 11 * h + 22 * l) / 451)
    const month = Math.floor((h + l - 7 * m + 114) / 31)
    const day = ((h + l - 7 * m + 114) % 31) + 1

    // [FIX] Create date in São Paulo timezone, not UTC
    const utcDate = new Date(year, month - 1, day)
    return toZonedTime(utcDate, DEFAULT_TIMEZONE)
}

function getHolidaysForYear(year: number, city?: string, state?: string) {
    const holidays = []

    // 1. Fixed National Holidays
    const fixedHolidays = [
        { date: `${year}-01-01`, name: 'Confraternização Universal', type: 'national', is_mandatory: true },
        { date: `${year}-04-21`, name: 'Tiradentes', type: 'national', is_mandatory: true },
        { date: `${year}-05-01`, name: 'Dia do Trabalho', type: 'national', is_mandatory: true },
        { date: `${year}-09-07`, name: 'Independência do Brasil', type: 'national', is_mandatory: true },
        { date: `${year}-10-12`, name: 'Nossa Senhora Aparecida', type: 'national', is_mandatory: true },
        { date: `${year}-11-02`, name: 'Finados', type: 'national', is_mandatory: true },
        { date: `${year}-11-15`, name: 'Proclamação da República', type: 'national', is_mandatory: true },
        { date: `${year}-11-20`, name: 'Dia da Consciência Negra', type: 'national', is_mandatory: true },
        { date: `${year}-12-25`, name: 'Natal', type: 'national', is_mandatory: true },
    ]
    holidays.push(...fixedHolidays)

    // 2. Mobile National Holidays (based on Easter)
    const easter = getEasterDate(year)
    const carnivalTuesday = addDays(easter, -47)
    const carnivalMonday = addDays(easter, -48)
    const ashWednesday = addDays(easter, -46)
    const goodFriday = addDays(easter, -2)
    const corpusChristi = addDays(easter, 60)

    // [FIX] Use formatBrazilDate to ensure dates are in São Paulo timezone
    holidays.push(
        { date: formatBrazilDate(carnivalMonday), name: 'Carnaval (Segunda)', type: 'national', is_mandatory: false },
        { date: formatBrazilDate(carnivalTuesday), name: 'Carnaval (Terça)', type: 'national', is_mandatory: true },
        { date: formatBrazilDate(ashWednesday), name: 'Quarta-feira de Cinzas', type: 'national', is_mandatory: false },
        { date: formatBrazilDate(goodFriday), name: 'Paixão de Cristo', type: 'national', is_mandatory: true },
        { date: formatBrazilDate(corpusChristi), name: 'Corpus Christi', type: 'national', is_mandatory: true }
    )

    // 3. State Holidays (Common ones)
    if (state === 'SP') {
        holidays.push({ date: `${year}-07-09`, name: 'Revolução Constitucionalista', type: 'state', is_mandatory: true })
    } else if (state === 'RS') {
        holidays.push({ date: `${year}-09-20`, name: 'Revolução Farroupilha', type: 'state', is_mandatory: true })
    } else if (state === 'MG' || !state) {
        // MG has no specific state-wide mandatory holidays besides national ones that are originated there
    }

    // 4. City Holidays
    const cityUpper = city?.toUpperCase()
    if (cityUpper === 'BELO HORIZONTE' || cityUpper === 'BH') {
        holidays.push(
            { date: `${year}-08-15`, name: 'Assunção de Nossa Senhora', type: 'city', is_mandatory: true, location: 'BH' },
            { date: `${year}-12-08`, name: 'Imaculada Conceição', type: 'city', is_mandatory: true, location: 'BH' }
        )
    } else if (cityUpper === 'SÃO PAULO' || cityUpper === 'SAO PAULO') {
        holidays.push(
            { date: `${year}-01-25`, name: 'Aniversário de São Paulo', type: 'city', is_mandatory: true, location: 'SP' }
        )
    }

    return holidays
}

export async function generateUpcomingHolidays() {
    const supabase = await createClient()

    // 1. Fetch Clinic Settings for Location context
    const { data: { user } } = await supabase.auth.getUser()
    let city, state, organizationId;
    if (user) {
        const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
        if (profile?.organization_id) {
            organizationId = profile.organization_id
            const { data: settings } = await supabase.from('clinic_settings').select('address').eq('id', profile.organization_id).single()
            if (settings?.address) {
                city = (settings.address as any).city
                state = (settings.address as any).state
                console.log('[Holidays] Detected location:', { city, state })
            }
        }
    }

    const currentYear = new Date().getFullYear()
    const nextYear = currentYear + 1

    // User wants "1 year ahead". We process Current + Next Year to be safe and complete.
    const holidaysCurrent = getHolidaysForYear(currentYear, city, state)
    const holidaysNext = getHolidaysForYear(nextYear, city, state)
    const allHolidays = [...holidaysCurrent, ...holidaysNext]

    console.log('[Holidays] Generated', allHolidays.length, 'holidays for', city, state)

    let successCount = 0
    const finalHolidays = []

    for (const h of allHolidays) {
        // [FIX] Add organization_id to each holiday
        const holidayWithOrg = {
            ...h,
            organization_id: organizationId
        }

        const { data, error } = await supabase
            .from('holidays' as any)
            .upsert(holidayWithOrg, { onConflict: 'organization_id,date,name' })
            .select()
            .single()

        if (!error && data) {
            successCount++
            finalHolidays.push(data)
        } else if (error) {
            console.error('[Holidays] Error upserting:', h.name, error)
        }
    }

    // GENERATE BLOCKS FOR MANDATORY HOLIDAYS
    const mandatoryHolidays = finalHolidays.filter((h: any) => h.is_mandatory)

    for (const h of mandatoryHolidays) {
        await ensureHolidayBlock(supabase, h)
    }

    revalidatePath('/dashboard/schedule')
    return { success: true, count: successCount, holidays: finalHolidays }
}

async function ensureHolidayBlock(supabase: any, holiday: any) {
    const start = getStartOfDayBRT(holiday.date)
    const end = getEndOfDayBRT(holiday.date)
    const notes = `Feriado: ${holiday.name} (${holiday.type === 'city' ? 'BH' : holiday.type === 'state' ? 'MG' : 'Nacional'})`

    // Get organization_id from logged user
    const { data: { user } } = await supabase.auth.getUser()
    let organizationId: string | undefined
    if (user) {
        const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
        organizationId = profile?.organization_id
    }

    // [FIX] Search by organization_id AND notes to avoid conflicts
    const { data: existing } = await supabase
        .from('appointments')
        .select('id')
        .eq('type', 'block')
        .is('professional_id', null)
        .eq('organization_id', organizationId)
        .eq('notes', notes)
        .maybeSingle()

    if (existing) {
        await supabase.from('appointments').update({
            start_time: start,
            end_time: end,
            all_day: true // [NEW] Mark as all-day
        }).eq('id', existing.id)
    } else {
        await supabase.from('appointments').insert({
            type: 'block',
            professional_id: null,
            organization_id: organizationId, // Include organization_id
            start_time: start,
            end_time: end,
            all_day: true, // [NEW] Mark as all-day
            notes: notes,
            status: 'scheduled',
            patient_id: null,
            service_id: null
        })
    }
}

async function removeHolidayBlock(supabase: any, holiday: any) {
    const notes = `Feriado: ${holiday.name} (${holiday.type === 'city' ? 'BH' : holiday.type === 'state' ? 'MG' : 'Nacional'})`

    // We search by notes because that's our unique identifier for the block
    await supabase.from('appointments')
        .delete()
        .eq('type', 'block')
        .is('professional_id', null)
        .eq('notes', notes)
    // No error handling needed for delete typically unless enforcing
}

export async function toggleHolidayStatus(id: string, is_mandatory: boolean) {
    const supabase = await createClient()

    // 1. Update Holiday
    const { data: holiday, error } = await supabase
        .from('holidays' as any)
        .update({ is_mandatory })
        .eq('id', id)
        .select()
        .single()

    if (error || !holiday) throw new Error('Failed to update holiday')

    // 2. Handle Block
    if (is_mandatory) {
        await ensureHolidayBlock(supabase, holiday)
    } else {
        await removeHolidayBlock(supabase, holiday)
    }

    revalidatePath('/dashboard/schedule')
    return { success: true, holiday }
}
