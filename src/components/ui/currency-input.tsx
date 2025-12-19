"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface CurrencyInputProps extends Omit<React.ComponentProps<"input">, "onChange" | "value"> {
    value: number | string | undefined
    onValueChange: (value: number) => void
}

export function CurrencyInput({ className, value, onValueChange, ...props }: CurrencyInputProps) {
    // Format helper
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(val)
    }

    // Handle Change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\D/g, "")
        const numericValue = Number(rawValue) / 100
        onValueChange(numericValue)
    }

    // Render value
    // If value is 0 or undefined, showing R$ 0,00 is fine.
    const displayValue = formatCurrency(Number(value || 0))

    return (
        <Input
            className={cn("font-mono", className)} // font-mono helps alignment
            value={displayValue}
            onChange={handleChange}
            {...props}
        />
    )
}
