"use client"

import { useEffect } from "react"
import { useActiveAttendance } from "@/components/providers/active-attendance-provider"
import { checkActiveAttendance } from "@/components/attendance/actions"

export function GlobalAttendanceRestorer() {
    const { setFullActiveAttendance, activeAttendanceId } = useActiveAttendance()

    useEffect(() => {
        const sync = async () => {
            try {
                console.log("GlobalAttendanceRestorer: Checking active attendance...")
                const res = await checkActiveAttendance()
                console.log("GlobalAttendanceRestorer: Result", res)

                if (res && res.data) {
                    const active = res.data
                    console.log("GlobalAttendanceRestorer: Found active", active)
                    // Update context if meaningful change
                    if (active.id !== activeAttendanceId) {
                        const pPayload = active.patient as any
                        const pName = Array.isArray(pPayload)
                            ? pPayload[0]?.name
                            : pPayload?.name || "Paciente"
                        const pId = active.patient_id
                        const startTime = active.start_time
                        // Supabase type might not include updated_at if we didn't select it, so just use start_time


                        // Pass patientId to context
                        setFullActiveAttendance(active.id, startTime, pName, pId)
                    }
                } else {
                    console.log("GlobalAttendanceRestorer: No active attendance. Clearing state.")
                    setFullActiveAttendance(null, null, null, null)
                }
            } catch (err) {
                console.error("Failed to restore attendance", err)
            }
        }

        sync()
    }, []) // Run once on mount

    return null
}
