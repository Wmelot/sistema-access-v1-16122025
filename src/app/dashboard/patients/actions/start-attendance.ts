'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function startNewAttendance(patientId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, msg: "Usuário não autenticado" }
    }

    try {
        // 1. Find a Service (preferably "Consulta")
        let serviceId = null;
        let serviceDuration = 60; // Default

        const { data: services } = await supabase
            .from('services')
            .select('id, name, duration')
            .ilike('name', '%Consulta%')
            .limit(1)

        if (services && services.length > 0) {
            serviceId = services[0].id
            serviceDuration = services[0].duration || 60
        } else {
            // Fallback: any service
            const { data: anyService } = await supabase
                .from('services')
                .select('id, duration')
                .limit(1)
            if (anyService && anyService.length > 0) {
                serviceId = anyService[0].id
                serviceDuration = anyService[0].duration || 60
            }
        }

        // 2. Fetch Default Location
        let locationId = null;
        const { data: locations } = await supabase
            .from('locations')
            .select('id')
            .limit(1)

        if (locations && locations.length > 0) {
            locationId = locations[0].id
        }

        if (!serviceId) {
            return { success: false, msg: "Nenhum serviço disponível para agendamento." }
        }

        // 3. Create Appointment (Status: Confirmed - mimicking In Progress)
        const now = new Date()
        const endTime = new Date(now.getTime() + serviceDuration * 60000)

        const { data: appointment, error: apptError } = await supabase
            .from('appointments')
            .insert({
                patient_id: patientId,
                professional_id: user.id,
                service_id: serviceId,
                location_id: locationId,
                start_time: now.toISOString(),
                end_time: endTime.toISOString(),
                status: 'confirmed',
                notes: 'Atendimento iniciado via Perfil do Paciente',
                type: 'appointment',
                price: 0,
                original_price: 0,
                is_extra: true // Treat as "Encaixe" (Immediate)
            })
            .select('*, patients(name)')
            .single()

        if (apptError) {
            console.error("Error creating appointment:", apptError)
            return { success: false, msg: "Erro ao criar agendamento: " + apptError.message }
        }

        // 4. Log
        await supabase.from('logs').insert({
            action: 'CREATE_IMMEDIATE_APPOINTMENT',
            entity: 'appointment',
            entity_id: appointment.id,
            details: { patientId, createdBy: user.id }
        })

        revalidatePath('/dashboard/schedule')
        revalidatePath(`/dashboard/patients/${patientId}`)

        // @ts-ignore
        const pName = appointment.patients?.name || 'Paciente'
        return { success: true, appointmentId: appointment.id, patientName: pName }

    } catch (error: any) {
        console.error("Start Attendance Error:", error)
        return { success: false, msg: "Erro inesperado: " + error.message }
    }
}
