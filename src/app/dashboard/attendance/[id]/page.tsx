import { getAttendanceData, startAttendance } from "../actions"
import { notFound } from "next/navigation"
import { AttendanceClient } from "../attendance-client"
import { createClient } from "@/lib/supabase/server"

export default async function AttendancePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    try {
        const data = await getAttendanceData(id)
        const { data: { user } } = await supabase.auth.getUser()
        const userId = user?.id

        // Filter templates based on visibility rules
        const filteredTemplates = (data.templates || []).filter((t: any) => {
            // 1. Check if active (undefined is considered true for legacy)
            if (t.is_active === false) return false

            // 2. Check restricted roles
            if (t.allowed_roles && Array.isArray(t.allowed_roles) && t.allowed_roles.length > 0) {
                // If roles are defined, user MUST be in the list
                if (!userId || !t.allowed_roles.includes(userId)) return false
            }

            return true
        })

        return (
            <AttendanceClient
                appointment={data.appointment}
                patient={data.patient}
                templates={filteredTemplates}
                preferences={data.preferences || []}
                existingRecord={data.existingRecord}
                history={data.history || []}
                assessments={data.assessments || []}
                paymentMethods={data.paymentMethods || []}
                professionals={data.professionals || []}
            />
        )
    } catch (e) {
        console.error("Error loading attendance page:", e)
        return notFound()
    }
}
