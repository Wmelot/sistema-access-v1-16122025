"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface PercentageInputProps extends Omit<React.ComponentProps<"input">, "onChange" | "value"> {
    value: number | string | undefined
    onValueChange: (value: number) => void
}

export function PercentageInput({ className, value, onValueChange, ...props }: PercentageInputProps) {
    // Format helper
    const formatPercentage = (val: number) => {
        // Handle undefined/null as 0
        const num = Number(val || 0)
        return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }

    // Handle Change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Remove everything that isn't digit
        const rawValue = e.target.value.replace(/\D/g, "")
        // Divide by 100 to get decimal places (e.g. 1234 -> 12,34)
        const numericValue = Number(rawValue) / 100
        onValueChange(numericValue)
    }

    const displayValue = formatPercentage(Number(value || 0))

    return (
        <div className="relative w-full">
            <Input
                className={cn("font-mono pr-8 text-right", className)}
                value={displayValue}
                onChange={handleChange}
                {...props}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">%</span>
        </div>
    )
}
