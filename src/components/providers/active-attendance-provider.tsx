'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface ActiveAttendanceContextType {
    activeAttendanceId: string | null
    setActiveAttendanceId: (id: string | null) => void
    startTime: string | null
    setStartTime: (time: string | null) => void
    patientName: string | null
    setPatientName: (name: string | null) => void
    patientId: string | null
    setPatientId: (id: string | null) => void
    setFullActiveAttendance: (id: string | null, startTime: string | null, patientName: string | null, patientId: string | null) => void
}

const ActiveAttendanceContext = createContext<ActiveAttendanceContextType>({
    activeAttendanceId: null,
    setActiveAttendanceId: () => { },
    startTime: null,
    setStartTime: () => { },
    patientName: null,
    setPatientName: () => { },
    patientId: null,
    setPatientId: () => { },
    setFullActiveAttendance: () => { }
})

export function useActiveAttendance() {
    return useContext(ActiveAttendanceContext)
}

export function ActiveAttendanceProvider({ children }: { children: React.ReactNode }) {
    const [activeAttendanceId, setActiveAttendanceId] = useState<string | null>(null)
    const [startTime, setStartTime] = useState<string | null>(null)
    const [patientName, setPatientName] = useState<string | null>(null)
    const [patientId, setPatientId] = useState<string | null>(null)

    // Optional: Persist to localStorage to survive refreshes
    useEffect(() => {
        const stored = localStorage.getItem('active_attendance')
        if (stored) {
            try {
                const data = JSON.parse(stored)
                if (data.id) {
                    setActiveAttendanceId(data.id)
                    setStartTime(data.startTime)
                    setPatientName(data.patientName)
                    setPatientId(data.patientId || null)
                }
            } catch (e) {
                // Ignore error
            }
        }
    }, [])

    const updateActive = (id: string | null, start: string | null = null, pName: string | null = null, pId: string | null = null) => {
        setActiveAttendanceId(id)
        setStartTime(start)
        setPatientName(pName)
        setPatientId(pId)
        if (id) {
            localStorage.setItem('active_attendance', JSON.stringify({ id, startTime: start, patientName: pName, patientId: pId }))
        } else {
            localStorage.removeItem('active_attendance')
        }
    }

    return (
        <ActiveAttendanceContext.Provider value={{
            activeAttendanceId,
            setActiveAttendanceId: (id) => updateActive(id, startTime, patientName, patientId),
            startTime,
            setStartTime: (t) => updateActive(activeAttendanceId, t, patientName, patientId),
            patientName,
            setPatientName: (n) => updateActive(activeAttendanceId, startTime, n, patientId),
            patientId,
            setPatientId: (pId) => updateActive(activeAttendanceId, startTime, patientName, pId),
            setFullActiveAttendance: (id, start, pName, pId) => updateActive(id, start, pName, pId)
        }}>
            {children}
        </ActiveAttendanceContext.Provider>
    )
}
