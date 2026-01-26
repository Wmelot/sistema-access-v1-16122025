import * as React from "react"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface DateInputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
    value?: string // Expecting ISO string YYYY-MM-DD
    onChange?: (value: string) => void
}

export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
    ({ className, value, onChange, ...props }, ref) => {
        // Internal state for the display value (DD/MM/YYYY)
        const [displayValue, setDisplayValue] = React.useState("")
        const [popoverOpen, setPopoverOpen] = React.useState(false)

        // Sync internal state when external value changes
        React.useEffect(() => {
            if (value) {
                // value is YYYY-MM-DD
                const parts = value.split("-")
                if (parts.length === 3) {
                    const [year, month, day] = parts
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
                formatted = input.slice(0, 2) + "/" + input.slice(2, 4) + "/" + input.slice(4, 10)
            }

            setDisplayValue(formatted)

            // Emit change only if full date is entered or empty
            if (input.length === 8) {
                const day = input.slice(0, 2)
                const month = input.slice(2, 4)
                const year = input.slice(4, 8)

                onChange?.(`${year}-${month}-${day}`)
            } else if (input.length === 0) {
                onChange?.("")
            }
        }

        // Helper to convert value to Date for Calendar
        const calendarDate = React.useMemo(() => {
            if (!value) return undefined
            const parts = value.split("-")
            if (parts.length === 3) {
                const [y, m, d] = parts.map(Number)
                return new Date(y, m - 1, d)
            }
            return undefined
        }, [value])

        const onCalendarSelect = (date: Date | undefined) => {
            if (date) {
                const y = date.getFullYear()
                const m = String(date.getMonth() + 1).padStart(2, '0')
                const d = String(date.getDate()).padStart(2, '0')
                onChange?.(`${y}-${m}-${d}`)
                setPopoverOpen(false)
            }
        }

        return (
            <div className={cn("relative flex w-full", className)}>
                <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="DD/MM/AAAA"
                    maxLength={10}
                    value={displayValue}
                    onChange={handleChange}
                    ref={ref}
                    className="pr-10" // Space for the calendar icon
                    {...props}
                />
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                            tabIndex={-1} // Don't focus when tabbing through form
                        >
                            <CalendarIcon className="h-4 w-4" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                            mode="single"
                            selected={calendarDate}
                            onSelect={onCalendarSelect}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>
        )
    }
)
DateInput.displayName = "DateInput"
