import React, { useState, useEffect } from 'react'
import { Info } from 'lucide-react'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

// --- INFO TOOLTIP COMPONENT --- isLabel?: boolean
interface InfoLabelProps {
    label: string
    content: React.ReactNode
    className?: string
}

export function InfoLabel({ label, content, className }: InfoLabelProps) {
    return (
        <div className={cn("flex items-center gap-1.5", className)}>
            <Label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {label}
            </Label>
            <TooltipProvider delayDuration={200}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Info className="w-3.5 h-3.5 text-slate-400 cursor-help hover:text-slate-600 transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs bg-slate-900 text-slate-50 border-slate-800 p-3 shadow-xl z-50">
                        {content}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    )
}

// --- AVERAGE INPUT CALCULATOR ---
interface AverageInputProps {
    value?: number // The calculated average to display/sync
    onChange: (avg: number) => void // Callback with new average
    // Optional: We could accept 'trials' if we wanted to persist them upstream
    // For now, let's keep trials internal safely or accept an optional 'trials' prop if the parent manages it.
    // User requested "3 caixinhas".
    trials?: [number, number, number]
    onTrialsChange?: (trials: [number, number, number]) => void
    placeholder?: string
    className?: string
}

export function AverageInput({ value, onChange, trials, onTrialsChange, placeholder, className }: AverageInputProps) {
    // If parent provides trials, use them. Otherwise use local state (but local state won't persist on reload of page if parent doesn't save it)
    // To support persistence without breaking parent schema immediately, we'll try to use props if available.

    // We default to [0,0,0] if undefined
    const currentTrials = trials || [0, 0, 0]

    const trialChange = (index: number, val: number) => {
        const newTrials = [...currentTrials] as [number, number, number]
        newTrials[index] = val

        // Calculate Average (filtering out 0s? or treating 0 as typical? Usually 0 means 'not done' or 'fail' in Y-test? 
        // Actually Y-Test is distance. 0 is valid but unlikely? 
        // Let's assume standard average of non-zero inputs if we want 'smart' averging, or just straight average.)
        // User said "média de 3 repetições". So assume 3 are required.
        // But if user only fills 1, average should be that 1?
        // Let's do: Sum / Count of non-zero entries? Or always /3?
        // Standard protocol is usually max reach or average of 3.
        // Let's do simple average of all 3. If empty/0, it counts as 0.

        // Better UX: Average of non-empty inputs?
        // Let's stick to true average: sum / 3.

        const sum = newTrials.reduce((a, b) => a + b, 0)
        const avg = sum / 3

        onTrialsChange?.(newTrials)
        onChange(Number(avg.toFixed(1))) // Round to 1 decimal
    }

    return (
        <div className={cn("flex flex-col gap-1", className)}>
            <div className="flex gap-1">
                {[0, 1, 2].map((idx) => (
                    <Input
                        key={idx}
                        type="number"
                        className="h-7 px-1 text-center text-xs bg-slate-50 focus:bg-white transition-colors"
                        placeholder={`T${idx + 1}`}
                        value={currentTrials[idx] || ''}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value)
                            trialChange(idx, isNaN(val) ? 0 : val)
                        }}
                    />
                ))}
            </div>
            {/* Display the calculated average explicitly? Or is the parent Input enough? */}
            {/* The parent likely renders the 'Average' input? No, we are REPLACING the single input with this component. */}
            {/* So we should display the result too. */}
            <div className="flex items-center gap-2 justify-end">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Média:</span>
                <span className={cn("text-sm font-bold", value && value > 0 ? "text-blue-600" : "text-slate-300")}>
                    {value || 0}
                </span>
            </div>
        </div>
    )
}
