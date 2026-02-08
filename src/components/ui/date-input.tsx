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
            const inputElement = e.target
            const cursorPosition = inputElement.selectionStart || 0
            const rawValue = inputElement.value

            // Numbers only
            let digits = rawValue.replace(/\D/g, "")
            if (digits.length > 8) digits = digits.slice(0, 8)

            // Calculate new formatted value
            let formatted = ""
            if (digits.length > 0) {
                formatted = digits.slice(0, 2)
                if (digits.length > 2) {
                    formatted += "/" + digits.slice(2, 4)
                    if (digits.length > 4) {
                        formatted += "/" + digits.slice(4, 8)
                    }
                }
            }

            setDisplayValue(formatted)

            // Fix cursor position jump
            // If the user added or removed a digit before the 2nd or 5th character,
            // we need to adjust the cursor for the "/" that was inserted or removed.
            setTimeout(() => {
                let newCursorPos = cursorPosition

                // If we inserted a "/" automatically, shift cursor forward
                const addedSlash1 = formatted.length >= 3 && displayValue.length < 3 && cursorPosition === 3
                const addedSlash2 = formatted.length >= 6 && displayValue.length < 6 && cursorPosition === 6

                if (addedSlash1 || addedSlash2) {
                    newCursorPos++
                }

                inputElement.setSelectionRange(newCursorPos, newCursorPos)
            }, 0)

            // Emit change only if full date is entered or empty
            if (digits.length === 8) {
                const day = digits.slice(0, 2)
                const month = digits.slice(2, 4)
                const year = digits.slice(4, 8)
                onChange?.(`${year}-${month}-${day}`)
            } else if (digits.length === 0) {
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
            <div className={cn("relative flex w-full group", className)}>
                <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="DD/MM/AAAA"
                    maxLength={10}
                    value={displayValue}
                    onChange={handleChange}
                    ref={ref}
                    className={cn(
                        "pr-12 w-full transition-all border-slate-100",
                        className
                    )}
                    {...props}
                />
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full w-12 hover:bg-transparent text-slate-300 hover:text-[#8C132C] transition-colors"
                            tabIndex={-1}
                        >
                            <CalendarIcon className="h-4 w-4" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-[24px] border-none shadow-2xl" align="end">
                        <Calendar
                            mode="single"
                            selected={calendarDate}
                            onSelect={onCalendarSelect}
                            initialFocus
                            defaultMonth={calendarDate}
                            className="p-3"
                        />
                    </PopoverContent>
                </Popover>
            </div>
        )
    }
)
DateInput.displayName = "DateInput"
