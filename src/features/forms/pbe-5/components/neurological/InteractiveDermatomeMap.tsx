import React, { useState } from 'react'
import { cn } from "@/lib/utils"
import { DERMATOME_PATHS, DERMATOME_BASE64, DERMATOME_VIEWBOX, DERMATOME_IMG_META } from "./dermatome-data"

interface InteractiveDermatomeMapProps {
    selected?: string[]
    onToggle?: (id: string) => void
    onSelectionChange?: (ids: string[]) => void
    readOnly?: boolean
    debug?: boolean
}

/**
 * Extracts the core root key(s) from an SVG ID.
 * Examples: 
 * "L4_Frontal" -> ["L4"]
 * "S1_Lateral" -> ["S1"]
 * "S4S5_Lateral" -> ["S4", "S5"]
 */
const getRootKeys = (id: string): string[] => {
    if (id.includes('S4S5')) return ['S4', 'S5'];
    const match = id.match(/^([C|T|L|S][0-9]+)/);
    return match ? [match[1]] : [id];
}

export function InteractiveDermatomeMap({
    selected = [],
    onToggle,
    onSelectionChange,
    readOnly = false,
    debug = false
}: InteractiveDermatomeMapProps) {
    const [hoveredId, setHoveredId] = useState<string | null>(null)

    const handlePathClick = (id: string) => {
        if (readOnly) return
        const roots = getRootKeys(id)

        let newSelection = [...selected]

        // If the first root is selected, we assume we should toggle off all roots associated with this path
        const isCurrentlySelected = selected.includes(roots[0])

        if (isCurrentlySelected) {
            newSelection = newSelection.filter(item => !roots.includes(item))
        } else {
            roots.forEach(root => {
                if (!newSelection.includes(root)) newSelection.push(root)
            })
        }

        if (onSelectionChange) onSelectionChange(newSelection)
        if (onToggle) onToggle(roots.join(','))
    }

    const hoveredRoots = hoveredId ? getRootKeys(hoveredId) : []

    return (
        <div className="flex flex-col gap-4 w-full items-center">
            <div className="relative border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-xl bg-white group/map" style={{ width: '100%', maxWidth: '400px', aspectRatio: '210/297' }}>

                {/* SVG Wrap with Embedded Image for Pixel-Perfect Alignment */}
                <svg
                    viewBox={DERMATOME_VIEWBOX}
                    className="absolute inset-0 w-full h-full"
                    preserveAspectRatio="xMidYMid meet"
                >
                    {/* Background Image inside SVG */}
                    <image
                        href={`data:image/png;base64,${DERMATOME_BASE64}`}
                        x={DERMATOME_IMG_META.x}
                        y={DERMATOME_IMG_META.y}
                        width={DERMATOME_IMG_META.width}
                        height={DERMATOME_IMG_META.height}
                    />

                    {/* Interactive Paths */}
                    {Object.entries(DERMATOME_PATHS).map(([id, pathD]) => {
                        const roots = getRootKeys(id)
                        const isSelected = roots.some(r => selected.includes(r))
                        const isHovered = roots.some(r => hoveredRoots.includes(r))

                        return (
                            <path
                                key={id}
                                d={pathD}
                                onClick={() => handlePathClick(id)}
                                onMouseEnter={() => setHoveredId(id)}
                                onMouseLeave={() => setHoveredId(null)}
                                className={cn(
                                    "pointer-events-auto cursor-pointer transition-all duration-300 outline-none",
                                    isSelected
                                        ? "fill-indigo-600/60 stroke-indigo-400 stroke-[1.2] drop-shadow-[0_0_8px_rgba(79,70,229,0.4)]"
                                        : "fill-transparent stroke-slate-400/20 stroke-[0.3]",
                                    isHovered && !isSelected && "fill-indigo-400/20 stroke-indigo-400 stroke-[0.8]",
                                    readOnly && "pointer-events-none"
                                )}
                            />
                        )
                    })}
                </svg>

                {/* Legend/Helper Overlay (Visible on Hover) */}
                {hoveredId !== null && !readOnly && (
                    <div className="absolute top-4 left-4 bg-indigo-950/90 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow-2xl border border-white/20 z-10 animate-in fade-in slide-in-from-top-2 duration-200">
                        {debug ? `ID: ${hoveredId} | ` : ''}Raiz: {getRootKeys(hoveredId).join(' + ')}
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
                    Toque nas áreas para marcar alterações
                </div>
                {debug && (
                    <div className="text-[8px] text-rose-400 font-bold uppercase mt-1">
                        
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
