import { getAttendanceData, startAttendance } from "../actions"
import { notFound } from "next/navigation"
import { AttendanceClient } from "../attendance-client"

export default async function AttendancePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    try {
        const data = await getAttendanceData(id)



        return (
            <AttendanceClient
                appointment={data.appointment}
                patient={data.patient}
                templates={data.templates || []}
                preferences={data.preferences || []}
                existingRecord={data.existingRecord}
                history={data.history || []}
                assessments={data.assessments || []}
            />
        )
    } catch (e) {
        console.error("Error loading attendance page:", e)
        return notFound()
    }
}
