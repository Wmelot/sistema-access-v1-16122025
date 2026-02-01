'use client'

import { useEffect } from 'react'
import { useActiveAttendance } from '@/components/providers/active-attendance-provider'

interface AttendanceSyncerProps {
    appointmentId: string
    startTime?: string
    patientName?: string
    patientId?: string
    status?: string
}

export function AttendanceSyncer({ appointmentId, startTime, patientName, patientId, status }: AttendanceSyncerProps) {
    const { setFullActiveAttendance, activeAttendanceId } = useActiveAttendance()

    useEffect(() => {
        if (appointmentId && activeAttendanceId !== appointmentId) {
            console.log("Syncing Active Attendance:", appointmentId)
            setFullActiveAttendance(appointmentId, startTime || null, patientName || null, patientId || null, status || null)
        }
    }, [appointmentId, startTime, patientName, patientId, status, activeAttendanceId, setFullActiveAttendance])

    return null
}
