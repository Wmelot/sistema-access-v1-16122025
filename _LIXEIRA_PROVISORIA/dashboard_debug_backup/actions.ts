'use server'

import { createClient } from "@/lib/supabase/server"

export async function debugGetAppointments(date: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('appointments')
        .select(`
            *,
            patients ( name ),
            profiles ( full_name ),
            locations ( name )
        `)
        .gte('start_time', `${date}T00:00:00`)
        .lte('end_time', `${date}T23:59:59`)
        .order('start_time')

    if (error) {
        console.error("Debug Query Error:", error)
        return { error: error.message }
    }

    return { data }
}
