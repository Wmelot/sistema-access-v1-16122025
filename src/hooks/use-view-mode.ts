'use client'

import { useState, useEffect } from 'react'

type ViewMode = 'grid' | 'list'

/**
 * Custom hook to manage view mode (grid/list) with localStorage persistence
 * @param storageKey - Unique key for localStorage (e.g., 'professionals-view-mode')
 * @param defaultMode - Default view mode if no preference is saved
 */
export function useViewMode(storageKey: string, defaultMode: ViewMode = 'grid') {
    const [viewMode, setViewModeState] = useState<ViewMode>(defaultMode)
    const [isLoaded, setIsLoaded] = useState(false)

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(storageKey)
        if (saved === 'grid' || saved === 'list') {
            setViewModeState(saved)
        }
        setIsLoaded(true)
    }, [storageKey])

    // Save to localStorage when changed
    const setViewMode = (mode: ViewMode) => {
        setViewModeState(mode)
        localStorage.setItem(storageKey, mode)
    }

    return { viewMode, setViewMode, isLoaded }
}
