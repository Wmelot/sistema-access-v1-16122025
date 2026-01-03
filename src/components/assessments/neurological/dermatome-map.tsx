"use client"

import React, { useState, useEffect } from 'react'
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { ScanEye } from "lucide-react"

interface DermatomeMapProps {
    selected?: string[]
    onToggle?: (id: string) => void
    onSelectionChange?: (ids: string[]) => void
    view?: 'anterior' | 'posterior' // Ignored in this new version (image shows both)
    region?: 'cervical' | 'lumbar' | 'all'
    readOnly?: boolean
}

const REGIONS = {
    cervical: ['C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'T1'],
    lumbar: ['L1', 'L2', 'L3', 'L4', 'L5', 'S1', 'S2', 'S3', 'S4', 'S5']
}

export function DermatomeMap({
    selected = [],
    onToggle,
    onSelectionChange,
    region = 'all',
    readOnly = false
}: DermatomeMapProps) {
    const [internalSelected, setInternalSelected] = useState<string[]>(selected)
    const activeIds = (onToggle === undefined && onSelectionChange === undefined) ? internalSelected : selected

    useEffect(() => {
        setInternalSelected(selected)
    }, [selected])

    const handleToggle = (id: string) => {
        if (readOnly) return

        let newSelection = [...activeIds]
        if (newSelection.includes(id)) {
            newSelection = newSelection.filter(item => item !== id)
        } else {
            newSelection.push(id)
        }

        if (onSelectionChange) onSelectionChange(newSelection)
        if (onToggle) onToggle(id)
        setInternalSelected(newSelection)
    }

    const availableRegions = []
    if (region === 'all' || region === 'cervical') availableRegions.push({ name: 'Cervical / Torácica Alta', ids: REGIONS.cervical })
    if (region === 'all' || region === 'lumbar') availableRegions.push({ name: 'Lombar / Sacral', ids: REGIONS.lumbar })

    return (
        <div className="flex flex-col gap-4 w-full">
            {/* 1. REFERENCE IMAGE (Top) */}
            <div className="w-full flex justify-center bg-slate-50 rounded-lg border border-slate-100 py-2">
                <Dialog>
                    <DialogTrigger asChild>
                        <div className="relative group cursor-pointer max-w-[300px]">
                            <img
                                src="/dermatome_reference.jpg"
                                alt="Mapa de Dermátomos"
                                className="h-48 w-auto object-contain mix-blend-multiply"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/5 transition-colors rounded-lg">
                                <ScanEye className="w-8 h-8 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <p className="text-[10px] text-slate-400 text-center mt-1 group-hover:text-indigo-500 transition-colors">
                                Clique para ampliar
                            </p>
                        </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-screen-lg max-h-[90vh] p-0 bg-white border-none">
                        <div className="flex justify-center bg-slate-50 p-4 h-full overflow-auto">
                            <img src="/dermatome_reference.jpg" className="h-full max-h-[85vh] w-auto object-contain" />
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* 2. BUTTONS (Bottom - Single Line Flow) */}
            <div className="w-full">
                {availableRegions.map((group) => (
                    <div key={group.name} className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2 last:mb-0 border-b pb-2 last:border-0 last:pb-0 border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400 w-24 shrink-0 sm:text-right">{group.name}:</span>
                        <div className="flex-1 flex flex-wrap gap-2 items-center">
                            {group.ids.map((root: string) => {
                                const isSelected = activeIds.includes(root)
                                return (
                                    <button
                                        key={root}
                                        onClick={() => handleToggle(root)}
                                        disabled={readOnly}
                                        className={cn(
                                            "h-8 px-3 flex items-center justify-center text-sm font-bold rounded border transition-all select-none hover:scale-105 active:scale-95",
                                            isSelected
                                                ? "bg-indigo-600 text-white border-indigo-700 shadow-sm transform"
                                                : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-slate-50 hover:text-indigo-600",
                                            readOnly && "opacity-50 cursor-not-allowed hover:scale-100"
                                        )}
                                    >
                                        {root}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Selected Summary */}
            {!readOnly && activeIds.length > 0 && (
                <div className="bg-slate-50 px-3 py-2 rounded border border-slate-200 flex items-center gap-2 flex-wrap text-xs mt-1">
                    <span className="font-bold text-slate-500">Selecionados:</span>
                    {activeIds.map(id => (
                        <span key={id} className="bg-white px-1.5 py-0.5 rounded border border-indigo-100 text-indigo-600 font-medium">
                            {id}
                        </span>
                    ))}
                </div>
            )}
        </div>
    )
}
