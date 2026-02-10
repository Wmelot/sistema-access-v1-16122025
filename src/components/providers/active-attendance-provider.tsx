'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

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
    const [attendance, setAttendance] = useState<{
        id: string | null,
        startTime: string | null,
        patientName: string | null,
        patientId: string | null,
        status: string | null
    }>({
        id: null,
        startTime: null,
        patientName: null,
        patientId: null,
        status: null
    })

    const [lastClearedAt, setLastClearedAt] = useState<number>(0)

    // Optional: Persist to localStorage to survive refreshes
    useEffect(() => {
        const stored = localStorage.getItem('active_attendance')
        if (stored) {
            try {
                const data = JSON.parse(stored)
                if (data.id) {
                    setAttendance({
                        id: data.id,
                        startTime: data.startTime,
                        patientName: data.patientName,
                        patientId: data.patientId || null,
                        status: data.status || null
                    })
                }
            } catch (e) {
                // Ignore error
            }
        }
    }, [])

    const updateActive = useCallback((
        id: string | null,
        start: string | null = null,
        pName: string | null = null,
        pId: string | null = null,
        activeStatus: string | null = null
    ) => {
        const now = Date.now()
        const newState = {
            id,
            startTime: start,
            patientName: pName,
            patientId: pId,
            status: activeStatus
        }

        setAttendance(newState)

        if (id) {
            localStorage.setItem('active_attendance', JSON.stringify(newState))
        } else {
            console.log('[ActiveAttendance] Limpando atendimento ativo.')
            setLastClearedAt(now)
            localStorage.removeItem('active_attendance')
        }
    }, [])

    const setActiveAttendanceId = useCallback((id: string | null) => {
        setAttendance(prev => {
            if (prev.id === id) return prev
            const next = { ...prev, id }
            if (id) localStorage.setItem('active_attendance', JSON.stringify(next))
            else localStorage.removeItem('active_attendance')
            return next
        })
    }, [])

    const setStartTime = useCallback((startTime: string | null) => {
        setAttendance(prev => {
            if (prev.startTime === startTime) return prev
            const next = { ...prev, startTime }
            localStorage.setItem('active_attendance', JSON.stringify(next))
            return next
        })
    }, [])

    const setPatientName = useCallback((patientName: string | null) => {
        setAttendance(prev => {
            if (prev.patientName === patientName) return prev
            const next = { ...prev, patientName }
            localStorage.setItem('active_attendance', JSON.stringify(next))
            return next
        })
    }, [])

    const setPatientId = useCallback((patientId: string | null) => {
        setAttendance(prev => {
            if (prev.patientId === patientId) return prev
            const next = { ...prev, patientId }
            localStorage.setItem('active_attendance', JSON.stringify(next))
            return next
        })
    }, [])

    const setStatus = useCallback((status: string | null) => {
        setAttendance(prev => {
            if (prev.status === status) return prev
            const next = { ...prev, status }
            localStorage.setItem('active_attendance', JSON.stringify(next))
            return next
        })
    }, [])

    const setFullActiveAttendance = useCallback((id: string | null, start: string | null, pName: string | null, pId: string | null, s?: string | null) => {
        setAttendance(prev => {
            if (prev.id === id && prev.startTime === start && prev.patientName === pName && prev.patientId === pId && prev.status === (s || null)) return prev
            const newState = {
                id,
                startTime: start,
                patientName: pName,
                patientId: pId,
                status: s || null
            }
            if (id) localStorage.setItem('active_attendance', JSON.stringify(newState))
            else localStorage.removeItem('active_attendance')
            return newState
        })
    }, [])

    // [NEW] Sync between tabs
    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key === 'active_attendance') {
                if (e.newValue) {
                    const data = JSON.parse(e.newValue)
                    setAttendance({
                        id: data.id,
                        startTime: data.startTime,
                        patientName: data.patientName,
                        patientId: data.patientId || null,
                        status: data.status || null
                    })
                } else {
                    setAttendance({
                        id: null,
                        startTime: null,
                        patientName: null,
                        patientId: null,
                        status: null
                    })
                }
            }
        }
        window.addEventListener('storage', handleStorage)
        return () => window.removeEventListener('storage', handleStorage)
    }, [])

    const contextValue = React.useMemo(() => ({
        activeAttendanceId: attendance.id,
        setActiveAttendanceId,
        startTime: attendance.startTime,
        setStartTime,
        patientName: attendance.patientName,
        setPatientName,
        patientId: attendance.patientId,
        setPatientId,
        status: attendance.status,
        setStatus,
        setFullActiveAttendance
    }), [attendance.id, attendance.startTime, attendance.patientName, attendance.patientId, attendance.status,
        setActiveAttendanceId, setStartTime, setPatientName, setPatientId, setStatus, setFullActiveAttendance])

    return (
        <ActiveAttendanceContext.Provider value={contextValue}>
            {children}
        </ActiveAttendanceContext.Provider>
    )
}
