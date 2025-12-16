import * as React from "react"
import { Input } from "@/components/ui/input"

interface DateInputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
    value?: string // Expecting ISO string YYYY-MM-DD
    onChange?: (value: string) => void
}

export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
    ({ className, value, onChange, ...props }, ref) => {
        // Internal state for the display value (DD/MM/YYYY)
        const [displayValue, setDisplayValue] = React.useState("")

        // Sync internal state when external value changes
        React.useEffect(() => {
            if (value) {
                // value is YYYY-MM-DD
                const [year, month, day] = value.split("-")
                if (year && month && day) {
                    setDisplayValue(`${day}/${month}/${year}`)
                    return
                }
            }
            if (!value) setDisplayValue("")
        }, [value])

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            let input = e.target.value.replace(/\D/g, "") // remove non-digits

            // Mask logic
            let formatted = input
            if (input.length > 2) {
                formatted = input.slice(0, 2) + "/" + input.slice(2)
            }
            if (input.length > 4) {
                formatted = input.slice(0, 2) + "/" + input.slice(2, 4) + "/" + input.slice(4, 8)
            }

            setDisplayValue(formatted)

            // Emit change only if full date is entered or empty
            if (input.length === 8) {
                const day = input.slice(0, 2)
                const month = input.slice(2, 4)
                const year = input.slice(4, 8)

                // Simple day/month validation could go here

                onChange?.(`${year}-${month}-${day}`)
            } else if (input.length === 0) {
                onChange?.("")
            }
        }

        return (
            <Input
                type="text"
                inputMode="numeric"
                placeholder="DD/MM/AAAA"
                maxLength={10}
                value={displayValue}
                onChange={handleChange}
                ref={ref}
                {...props}
            />
        )
    }
)
DateInput.displayName = "DateInput"
