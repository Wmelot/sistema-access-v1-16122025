
import { logAction } from "@/lib/logger"

export class NotificationService {
    /**
     * Send Appointment Confirmation
     * Triggered when a new appointment is created.
     */
    static async sendAppointmentConfirmation(appointment: any) {
        try {
            // [PLACEHOLDER] Replace with actual Z-API / Twilio call
            // const phone = appointment.patients?.phone
            // const message = `Olá ${appointment.patients?.name}, seu agendamento foi confirmado para ${appointment.start_time}.`

            console.log(`[NotificationService] Sending Confirmation to Patient ID: ${appointment.patient_id}`)

            // Log for audit
            await logAction("SEND_NOTIFICATION", {
                type: "confirmation",
                appointmentId: appointment.id,
                target: appointment.patients?.name
            }, 'system', appointment.id)

            return { success: true }
        } catch (error) {
            console.error("[NotificationService] Error:", error)
            return { success: false, error }
        }
    }

    /**
     * Send Appointment Reminder
     * Triggered by cron job or manual action.
     */
    static async sendAppointmentReminder(appointment: any) {
        console.log(`[NotificationService] Sending Reminder for Appointment ID: ${appointment.id}`)
        return { success: true }
    }

    /**
     * Notify Waitlist
     * Triggered when an appointment is cancelled/deleted.
     */
    static async notifyWaitlist(organizationId: string, professionalId: string, date: string, time: string, entry?: any) {
        try {
            console.log(`[NotificationService] Notificando lista de espera: Org ${organizationId}, Prof ${professionalId}, Data ${date}, Hora ${time}`)

            if (!entry) return { success: true }

            // Create reminder for the professional
            const { createClient } = await import('@/lib/supabase/server')
            const supabase = await createClient()

            // Format reminder content to be parsed by ReminderWidget.tsx
            // Format: "Lista de Espera: [Nome] | [Phone] | [Date] | Turno: [Turno] | Dias: [Dias]"
            const dateStr = date.split('-').reverse().join('/') // yyyy-mm-dd -> dd/mm/yyyy
            const content = `✨ VAGA DISPONÍVEL (Lista de Espera): ${entry.patient_name} | ${entry.patient_phone} | ${dateStr} | Turno: ${entry.preference || 'N/A'}`

            await supabase.from('reminders').insert({
                user_id: professionalId,
                organization_id: organizationId,
                creator_id: professionalId,
                content: content,
                due_date: new Date().toISOString(),
                is_read: false,
                status: 'pending'
            })

            return { success: true }
        } catch (error) {
            console.error("[NotificationService] Error in notifyWaitlist:", error)
            return { success: false, error }
        }
    }
}
