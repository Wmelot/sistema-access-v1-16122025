'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface ActiveAttendanceContextType {
    activeAttendanceId: string | null
    setActiveAttendanceId: (id: string | null) => void
    startTime: string | null
    setStartTime: (time: string | null) => void
    patientName: string | null
    setPatientName: (name: string | null) => void
}

const ActiveAttendanceContext = createContext<ActiveAttendanceContextType>({
    activeAttendanceId: null,
    setActiveAttendanceId: () => { },
    startTime: null,
    setStartTime: () => { },
    patientName: null,
    setPatientName: () => { }
})

export function useActiveAttendance() {
    return useContext(ActiveAttendanceContext)
}

export function ActiveAttendanceProvider({ children }: { children: React.ReactNode }) {
    const [activeAttendanceId, setActiveAttendanceId] = useState<string | null>(null)
    const [startTime, setStartTime] = useState<string | null>(null)
    const [patientName, setPatientName] = useState<string | null>(null)

    // Optional: Persist to localStorage to survive refreshes
    useEffect(() => {
        const stored = localStorage.getItem('active_attendance')
        if (stored) {
            try {
                const data = JSON.parse(stored)
                setActiveAttendanceId(data.id)
                setStartTime(data.startTime)
                setPatientName(data.patientName)
            } catch (e) {
                // Ignore error
            }
        }
    }, [])

    const updateActive = (id: string | null, start: string | null = null, pName: string | null = null) => {
        setActiveAttendanceId(id)
        setStartTime(start)
        setPatientName(pName)
        if (id) {
            localStorage.setItem('active_attendance', JSON.stringify({ id, startTime: start, patientName: pName }))
        } else {
            localStorage.removeItem('active_attendance')
        }
    }

    return (
        <ActiveAttendanceContext.Provider value={{
            activeAttendanceId,
            setActiveAttendanceId: (id) => updateActive(id, startTime, patientName),
            startTime,
            setStartTime: (t) => updateActive(activeAttendanceId, t, patientName),
            patientName,
            setPatientName: (n) => updateActive(activeAttendanceId, startTime, n),
        }}>
            {children}
        </ActiveAttendanceContext.Provider>
    )
}
