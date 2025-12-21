'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { addDays, format, getYear } from "date-fns"
import { getStartOfDayBRT, getEndOfDayBRT } from "@/lib/date-helper"

// Calculate Easter Date (Meeus/Jones/Butcher's Algorithm)
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
    return new Date(year, month - 1, day)
}

function getHolidaysForYear(year: number) {
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

    // 2. Mobile National Holidays
    const easter = getEasterDate(year)
    const carnivalTuesday = addDays(easter, -47)
    const carnivalMonday = addDays(easter, -48)
    const ashWednesday = addDays(easter, -46)
    const goodFriday = addDays(easter, -2)
    const corpusChristi = addDays(easter, 60)

    holidays.push(
        { date: format(carnivalMonday, 'yyyy-MM-dd'), name: 'Carnaval (Segunda)', type: 'national', is_mandatory: false },
        { date: format(carnivalTuesday, 'yyyy-MM-dd'), name: 'Carnaval (Terça)', type: 'national', is_mandatory: true },
        { date: format(ashWednesday, 'yyyy-MM-dd'), name: 'Quarta-feira de Cinzas', type: 'national', is_mandatory: false },
        { date: format(goodFriday, 'yyyy-MM-dd'), name: 'Paixão de Cristo', type: 'national', is_mandatory: true },
        { date: format(corpusChristi, 'yyyy-MM-dd'), name: 'Corpus Christi', type: 'national', is_mandatory: true }
    )

    // 3. City Holidays (Belo Horizonte)
    holidays.push(
        { date: `${year}-08-15`, name: 'Assunção de Nossa Senhora', type: 'city', is_mandatory: true },
        { date: `${year}-12-08`, name: 'Imaculada Conceição', type: 'city', is_mandatory: true }
    )

    return holidays
}

export async function generateUpcomingHolidays() {
    const supabase = await createClient()
    const currentYear = new Date().getFullYear()
    const nextYear = currentYear + 1

    // User wants "1 year ahead". We process Current + Next Year to be safe and complete.
    const holidaysCurrent = getHolidaysForYear(currentYear)
    const holidaysNext = getHolidaysForYear(nextYear)
    const allHolidays = [...holidaysCurrent, ...holidaysNext]

    let successCount = 0
    const finalHolidays = []

    for (const h of allHolidays) {
        const { data, error } = await supabase
            .from('holidays')
            .upsert(h, { onConflict: 'date, name' })
            .select()
            .single()

        if (!error && data) {
            successCount++
            finalHolidays.push(data)
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

    const { data: existing } = await supabase
        .from('appointments')
        .select('id')
        .eq('type', 'block')
        .is('professional_id', null)
        .eq('notes', notes)
        .maybeSingle()

    if (existing) {
        await supabase.from('appointments').update({
            start_time: start,
            end_time: end
        }).eq('id', existing.id)
    } else {
        await supabase.from('appointments').insert({
            type: 'block',
            professional_id: null,
            start_time: start,
            end_time: end,
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
}

export async function toggleHolidayStatus(id: string, is_mandatory: boolean) {
    const supabase = await createClient()

    // 1. Update Holiday
    const { data: holiday, error } = await supabase
        .from('holidays')
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
