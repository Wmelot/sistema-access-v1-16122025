
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
}
