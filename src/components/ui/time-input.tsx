import * as React from "react"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { Clock, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface TimeInputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
    value?: string // Expecting HH:mm
    onChange?: (value: string) => void
    availableSlots?: string[] // [NEW] Optional list of HH:mm strings
}

export const TimeInput = React.forwardRef<HTMLInputElement, TimeInputProps>(
    ({ className, value, onChange, availableSlots, ...props }, ref) => {
        const [displayValue, setDisplayValue] = React.useState(value || "")
        const [popoverOpen, setPopoverOpen] = React.useState(false)

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

        const handleSelectSlot = (slot: string) => {
            setDisplayValue(slot)
            onChange?.(slot)
            setPopoverOpen(false)
        }

        return (
            <div className={cn("relative flex w-full", className)}>
                <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="HH:MM"
                    maxLength={5}
                    value={displayValue}
                    onChange={handleChange}
                    ref={ref}
                    className="pr-10"
                    {...props}
                />
                {availableSlots && availableSlots.length > 0 && (
                    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                                tabIndex={-1}
                            >
                                <Clock className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[180px] p-0" align="end">
                            <Command>
                                <CommandInput placeholder="Buscar horário..." className="h-9" />
                                <CommandList className="max-h-[400px]">
                                    <CommandEmpty>Sem horários.</CommandEmpty>
                                    <CommandGroup heading="Horários Livres">
                                        {availableSlots.map((slot) => (
                                            <CommandItem
                                                key={slot}
                                                value={slot}
                                                onSelect={() => handleSelectSlot(slot)}
                                                className="cursor-pointer"
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        value === slot ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {slot}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                )}
            </div>
        )
    }
)
TimeInput.displayName = "TimeInput"
