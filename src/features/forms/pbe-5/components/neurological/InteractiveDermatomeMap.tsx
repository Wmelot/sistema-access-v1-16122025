"use client"

import React, { useState } from 'react'
import { cn } from "@/lib/utils"
import { DERMATOME_PATHS, DERMATOME_BASE64 } from "./dermatome-data"

interface InteractiveDermatomeMapProps {
    selected?: string[]
    onToggle?: (id: string) => void
    onSelectionChange?: (ids: string[]) => void
    readOnly?: boolean
    debug?: boolean
}

// Initial mapping provided by user or common anatomical knowledge
// This will be refined as the user provides more feedback
const ROOT_MAPPING: Record<number, string> = {
    0: "C5",
    1: "C6",
    2: "C7",
    3: "C8",
    4: "T1",
    5: "L1",
    6: "L2",
    7: "L3",
    8: "L4",
    9: "L5",
    10: "S1",
    11: "S2",
    12: "S3",
    13: "S4",
    14: "S5"
}

export function InteractiveDermatomeMap({
    selected = [],
    onToggle,
    onSelectionChange,
    readOnly = false,
    debug = false
}: InteractiveDermatomeMapProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

    const handlePathClick = (index: number) => {
        if (readOnly) return
        const root = ROOT_MAPPING[index] || `root_${index}`

        let newSelection = [...selected]
        if (newSelection.includes(root)) {
            newSelection = newSelection.filter(item => item !== root)
        } else {
            newSelection.push(root)
        }

        if (onSelectionChange) onSelectionChange(newSelection)
        if (onToggle) onToggle(root)
    }

    return (
        <div className="flex flex-col gap-4 w-full items-center">
            <div className="relative border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-xl bg-white group/map" style={{ width: '100%', maxWidth: '400px', aspectRatio: '210/297' }}>
                {/* Background Image */}
                <img
                    src={`data:image/png;base64,${DERMATOME_BASE64}`}
                    alt="Dermatome Map Background"
                    className="absolute inset-0 w-full h-full object-contain"
                />

                {/* SVG Overlay */}
                <svg
                    viewBox="0 0 210 297"
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    preserveAspectRatio="xMidYMid meet"
                >
                    {DERMATOME_PATHS.map((pathD, index) => {
                        const root = ROOT_MAPPING[index] || `root_${index}`
                        const isSelected = selected.includes(root)
                        const isHovered = hoveredIndex === index

                        return (
                            <path
                                key={index}
                                d={pathD}
                                onClick={() => handlePathClick(index)}
                                onMouseEnter={() => setHoveredIndex(index)}
                                onMouseLeave={() => setHoveredIndex(null)}
                                className={cn(
                                    "pointer-events-auto cursor-pointer transition-all duration-300",
                                    isSelected
                                        ? "fill-indigo-600/60 stroke-indigo-400 stroke-[0.8] drop-shadow-[0_0_8px_rgba(79,70,229,0.4)]"
                                        : "fill-transparent stroke-slate-400/10 stroke-[0.2]",
                                    isHovered && !isSelected && "fill-indigo-400/20 stroke-indigo-400 stroke-[0.5]",
                                    readOnly && "pointer-events-none"
                                )}
                            />
                        )
                    })}
                </svg>

                {/* Legend/Helper Overlay (Visible on Hover) */}
                {hoveredIndex !== null && !readOnly && (
                    <div className="absolute top-4 left-4 bg-indigo-950/90 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow-2xl border border-white/20 z-10 animate-in fade-in slide-in-from-top-2 duration-200">
                        {debug ? `Índice: ${hoveredIndex} | Raiz: ` : ''}{ROOT_MAPPING[hoveredIndex] || `Raiz ${hoveredIndex}`}
                    </div>
                )}

                {/* Highlight Selected Badge in corner */}
                {selected.length > 0 && (
                    <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md border border-slate-100 rounded-2xl px-3 py-1.5 shadow-lg flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                        <span className="text-[9px] font-black text-slate-800 uppercase tracking-tighter">{selected.length} Raízes</span>
                    </div>
                )}
            </div>

            <div className="flex flex-col items-center gap-1">
                <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest bg-slate-50 px-5 py-2 rounded-full border border-slate-100 shadow-inner">
                    Toque nas áreas para marcar alterações
                </div>
                {debug && (
                    <div className="text-[8px] text-rose-400 font-bold uppercase mt-1">
                        Modo Debug Ativo - Verifique os índices passando o mouse
                    </div>
                )}
            </div>

            {/* Selected Roots Summary */}
            {selected.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                    {selected.map(root => (
                        <span key={root} className="px-3 py-1 bg-white text-indigo-700 text-[10px] font-black rounded-xl border-2 border-indigo-100 shadow-sm animate-in zoom-in-75 duration-300">
                            {root}
                        </span>
                    ))}
                </div>
            )}
        </div>
    )
}
