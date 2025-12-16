"use client"

import CurrencyInputBase, { CurrencyInputProps as BaseProps } from 'react-currency-input-field'
import { cn } from '@/lib/utils'

interface CurrencyInputProps extends Omit<BaseProps, 'onValueChange'> {
    onValueChange?: (value: number | undefined) => void
    label?: string
}

export function CurrencyInput({ className, onValueChange, ...props }: CurrencyInputProps) {
    return (
        <CurrencyInputBase
            className={cn(
                "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            decimalsLimit={2}
            decimalScale={2}
            intlConfig={{ locale: 'pt-BR', currency: 'BRL' }}
            onValueChange={(value, name, values) => {
                // Convert string value to number for parent
                const floatVal = values?.float
                if (onValueChange) onValueChange(floatVal ?? 0)
            }}
            {...props}
        />
    )
}
