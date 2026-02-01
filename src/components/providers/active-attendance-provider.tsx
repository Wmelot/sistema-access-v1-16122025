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
    status: string | null
    setStatus: (status: string | null) => void
    setFullActiveAttendance: (id: string | null, startTime: string | null, patientName: string | null, patientId: string | null, status?: string | null) => void
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
    status: null,
    setStatus: () => { },
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
    const [status, setStatus] = useState<string | null>(null)

    const [lastClearedAt, setLastClearedAt] = useState<number>(0)

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
                    setStatus(data.status || null)
                }
            } catch (e) {
                // Ignore error
            }
        }
    }, [])

    const updateActive = (
        id: string | null,
        start: string | null = null,
        pName: string | null = null,
        pId: string | null = null,
        activeStatus: string | null = null
    ) => {
        const now = Date.now()

        // Se estamos tentando SETAR um ID mas limpamos recentemente (menos de 5s), ignoramos.
        // Isso evita que o polling traga de volta um atendimento que acabou de ser fechado.
        if (id && (now - lastClearedAt < 5000)) {
            console.log('[ActiveAttendance] Ignorando reativação automática pós-limpeza rápida.')
            return
        }

        setActiveAttendanceId(id)
        setStartTime(start)
        setPatientName(pName)
        setPatientId(pId)
        setStatus(activeStatus)

        if (id) {
            localStorage.setItem('active_attendance', JSON.stringify({
                id,
                startTime: start,
                patientName: pName,
                patientId: pId,
                status: activeStatus
            }))
        } else {
            setLastClearedAt(now) // Marca o momento da limpeza
            localStorage.removeItem('active_attendance')
        }
    }

    return (
        <ActiveAttendanceContext.Provider value={{
            activeAttendanceId,
            setActiveAttendanceId: (id) => updateActive(id, startTime, patientName, patientId, status),
            startTime,
            setStartTime: (t) => updateActive(activeAttendanceId, t, patientName, patientId, status),
            patientName,
            setPatientName: (n) => updateActive(activeAttendanceId, startTime, n, patientId, status),
            patientId,
            setPatientId: (pId) => updateActive(activeAttendanceId, startTime, patientName, pId, status),
            status,
            setStatus: (s) => updateActive(activeAttendanceId, startTime, patientName, patientId, s),
            setFullActiveAttendance: (id, start, pName, pId, s) => updateActive(id, start, pName, pId, s || null)
        }}>
            {children}
        </ActiveAttendanceContext.Provider>
    )
}
