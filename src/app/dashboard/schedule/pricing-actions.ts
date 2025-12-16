'use server'

import { createClient } from "@/lib/supabase/server"

export async function getPatientPriceTableId(patientId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('patients')
        .select('price_table_id')
        .eq('id', patientId)
        .single()

    if (error) {
        console.error('Error fetching patient price table:', error)
        return null
    }

    return data?.price_table_id || null
}

export async function getServicePrice(serviceId: string, priceTableId?: string | null) {
    const supabase = await createClient()

    // 1. Fetch default service price
    const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('price')
        .eq('id', serviceId)
        .single()

    if (serviceError || !service) {
        console.error('Error fetching service price:', serviceError)
        return 0
    }

    let finalPrice = service.price

    // 2. If a price table is active, check for override
    if (priceTableId) {
        const { data: override } = await supabase
            .from('price_table_items')
            .select('price')
            .match({ price_table_id: priceTableId, service_id: serviceId })
            .single()

        if (override) {
            finalPrice = override.price
        }
    }

    return Number(finalPrice)
}
