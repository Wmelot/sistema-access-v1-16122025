import * as React from "react"
import { Input } from "@/components/ui/input"

interface TimeInputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
    value?: string // Expecting HH:mm
    onChange?: (value: string) => void
}

export const TimeInput = React.forwardRef<HTMLInputElement, TimeInputProps>(
    ({ className, value, onChange, ...props }, ref) => {
        const [displayValue, setDisplayValue] = React.useState(value || "")

        React.useEffect(() => {
            if (value !== undefined) {
                setDisplayValue(value)
            }
        }, [value])

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            let input = e.target.value.replace(/\D/g, "")

            if (input.length > 4) input = input.slice(0, 4)

            let formatted = input
            if (input.length > 2) {
                formatted = input.slice(0, 2) + ":" + input.slice(2)
            }

            setDisplayValue(formatted)

            if (input.length === 4) {
                const hour = parseInt(input.slice(0, 2))
                const minute = parseInt(input.slice(2, 4))

                if (hour < 24 && minute < 60) {
                    onChange?.(formatted)
                }
            } else if (input.length === 0) {
                onChange?.("")
            }
        }

        return (
            <Input
                type="text"
                inputMode="numeric"
                placeholder="HH:MM"
                maxLength={5}
                value={displayValue}
                onChange={handleChange}
                ref={ref}
                {...props}
            />
        )
    }
)
TimeInput.displayName = "TimeInput"
