import { getAttendanceData, startAttendance } from "../actions"
import { notFound } from "next/navigation"
import { AttendanceClient } from "../attendance-client"

export default async function AttendancePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    try {
        const data = await getAttendanceData(id)

        // Auto-start (mark as in progress) if not already
        // This is a side-effect, but valid for "entering the room"
        if (data.appointment.status !== 'Em Atendimento' && data.appointment.status !== 'Realizado') {
            await startAttendance(id)
        }

        return (
            <AttendanceClient
                appointment={data.appointment}
                patient={data.patient}
                templates={data.templates || []}
                preferences={data.preferences || []}
                existingRecord={data.existingRecord}
                history={data.history || []}
            />
        )
    } catch (e) {
        return notFound()
    }
}
