"use client"

import React, { useState } from 'react'
import { cn } from "@/lib/utils"
import { INOMINADO_PATHS, INOMINADO_BASE64 } from "./inominado-data"

interface InteractiveInominadoMapProps {
    selected?: string[]
    onToggle?: (id: string) => void
    onSelectionChange?: (ids: string[]) => void
    readOnly?: boolean
    debug?: boolean
}

// Map the SVG IDs to readable labels if needed, or use the ID directly
const ID_LABELS: Record<string, string> = {
    "L1": "L1",
    "L2": "L2",
    "L3": "L3",
    "L4": "L4",
    "L5": "L5",
    "S1": "S1",
    "T7": "T7",
    "T9": "T9",
    "T10": "T10",
    "T11": "T11",
    "T12": "T12",
    "path7": "Raiz 7?",
    "path29": "Base Inominado A",
    "path29-9": "Base Inominado B",
    "path38": "Segmento 38"
}

export function InteractiveInominadoMap({
    selected = [],
    onToggle,
    onSelectionChange,
    readOnly = false,
    debug = false
}: InteractiveInominadoMapProps) {
    const [hoveredId, setHoveredId] = useState<string | null>(null)

    // Helper to get all root keys from an ID (e.g., "S4S5_Lateral" -> ["S4", "S5"])
    const getRootKeys = (id: string): string[] => {
        if (!id) return []
        const prefix = id.split(/[_-]/)[0]
        // Match patterns like C1, T10, L5, S4, etc.
        const matches = prefix.match(/[C|T|L|S][0-9]+/g)
        return matches || [prefix]
    }

    const handlePathClick = (id: string) => {
        if (readOnly) return

        const rootKeys = getRootKeys(id)
        let newSelection = [...selected]

        // Toggle logic: if ANY of the segment's roots are selected, we toggle all OFF
        const isCurrentlySelected = rootKeys.some(rk => selected.includes(rk))

        if (isCurrentlySelected) {
            newSelection = newSelection.filter(item => !rootKeys.includes(item))
        } else {
            rootKeys.forEach(rk => {
                if (!newSelection.includes(rk)) newSelection.push(rk)
            })
        }

        if (onSelectionChange) onSelectionChange(newSelection)
        rootKeys.forEach(rk => {
            if (onToggle) onToggle(rk)
        })
    }

    return (
        <div className="flex flex-col gap-4 w-full items-center">
            <div className="relative border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-xl bg-white group/map" style={{ width: '100%', maxWidth: '400px', aspectRatio: '210/297' }}>
                {/* SVG Container with Background Image inside */}
                <svg
                    viewBox="0 0 210 297"
                    className="absolute inset-0 w-full h-full"
                    preserveAspectRatio="xMidYMid meet"
                >
                    {/* Background Image mapped exactly as in the original SVG */}
                    <image
                        href={`data:image/png;base64,${INOMINADO_BASE64}`}
                        x="-6.9830499"
                        y="-10.906908"
                        width="222.77916"
                        height="314.32501"
                    />

                    {Object.entries(INOMINADO_PATHS).map(([id, pathD]) => {
                        const roots = getRootKeys(id)
                        const isSelected = roots.some(rk => selected.includes(rk))

                        const hoveredRoots = hoveredId ? getRootKeys(hoveredId) : []
                        const isHovered = roots.some(rk => hoveredRoots.includes(rk))

                        return (
                            <path
                                key={id}
                                id={`inominado-${id}`}
                                d={pathD}
                                onClick={() => handlePathClick(id)}
                                onMouseEnter={() => setHoveredId(id)}
                                onMouseLeave={() => setHoveredId(null)}
                                className={cn(
                                    "pointer-events-auto cursor-pointer transition-all duration-300",
                                    isSelected
                                        ? "fill-indigo-600/60 stroke-indigo-400 stroke-[0.8] drop-shadow-[0_0_8px_rgba(79,70,229,0.4)]"
                                        : "fill-transparent stroke-slate-400/5 stroke-[0.1]",
                                    isHovered && !isSelected && "fill-indigo-400/20 stroke-indigo-400 stroke-[0.5]",
                                    readOnly && "pointer-events-none"
                                )}
                            />
                        )
                    })}
                </svg>

                {/* Legend/Helper Overlay (Visible on Hover) */}
                {hoveredId !== null && !readOnly && (
                    <div className="absolute top-4 left-4 bg-indigo-950/90 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow-2xl border border-white/20 z-10 animate-in fade-in slide-in-from-top-2 duration-200">
                        {debug ? `ID: ${hoveredId} | ` : ''}{getRootKeys(hoveredId).join(' + ')}
                    </div>
                )}

                {/* Highlight Selected Badge */}
                {selected.length > 0 && (
                    <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md border border-slate-100 rounded-2xl px-3 py-1.5 shadow-lg flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                        <span className="text-[9px] font-black text-slate-800 uppercase tracking-tighter">{selected.length} Raízes</span>
                    </div>
                )}
            </div>

            <div className="flex flex-col items-center gap-1">
                <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest bg-slate-50 px-5 py-2 rounded-full border border-slate-100 shadow-inner">
                    Toque nas áreas para testar o mapeamento
                </div>
                {debug && (
                    <div className="text-[8px] text-rose-400 font-bold uppercase mt-1">
                    
                    </div>
                )}
            </div>

            {/* Selected Summary */}
            {selected.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                    {selected.map(id => (
                        <span key={id} className="px-3 py-1 bg-white text-indigo-700 text-[10px] font-black rounded-xl border-2 border-indigo-100 shadow-sm animate-in zoom-in-75 duration-300">
                            {ID_LABELS[id] || id}
                        </span>
                    ))}
                </div>
            )}
        </div>
    )
}
