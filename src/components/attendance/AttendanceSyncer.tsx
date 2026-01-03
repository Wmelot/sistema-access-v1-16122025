'use client'

import { useEffect } from 'react'
import { useActiveAttendance } from '@/components/providers/active-attendance-provider'

interface AttendanceSyncerProps {
    appointmentId: string
    startTime?: string
    patientName?: string
    patientId?: string
}

export function AttendanceSyncer({ appointmentId, startTime, patientName, patientId }: AttendanceSyncerProps) {
    const { setFullActiveAttendance, activeAttendanceId } = useActiveAttendance()

    useEffect(() => {
        if (appointmentId && activeAttendanceId !== appointmentId) {
            console.log("Syncing Active Attendance:", appointmentId)
            setFullActiveAttendance(appointmentId, startTime || null, patientName || null, patientId || null)
        }
    }, [appointmentId, startTime, patientName, patientId, activeAttendanceId, setFullActiveAttendance])

    return null
}
