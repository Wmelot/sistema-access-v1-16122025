
import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FieldDateProps {
    field: any;
    value?: Date | string;
    onChange?: (val: string) => void;
    isPreview: boolean;
}

export const FieldDate = ({ field, value, onChange, isPreview }: FieldDateProps) => {

    // Parse value to Date
    const dateValue = value ? new Date(value) : undefined;

    // Handler
    const handleSelect = (date: Date | undefined) => {
        if (!isPreview || !onChange) return;
        if (!date) {
            onChange('');
            return;
        }
        // Save as ISO string or whatever format backend prefers. Usually ISO.
        // But for display we use dateFormat if configured.
        onChange(date.toISOString());
    };

    return (
        <div className="space-y-2">
            <Label>{field.label} {field.required && <span className="text-red-500">*</span>}</Label>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !dateValue && "text-muted-foreground"
                        )}
                        disabled={!isPreview}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateValue ? format(dateValue, "PPP", { locale: ptBR }) : <span>{field.placeholder || "Selecione uma data"}</span>}
                    </Button>
                </PopoverTrigger>
                {isPreview && (
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={dateValue}
                            onSelect={handleSelect}
                            initialFocus
                            locale={ptBR}
                            disabled={(date) => {
                                // Optional Min/Max logic
                                if (field.minDate && date < new Date(field.minDate)) return true;
                                if (field.maxDate && date > new Date(field.maxDate)) return true;
                                return false;
                            }}
                        />
                    </PopoverContent>
                )}
            </Popover>
            {field.helpText && <p className="text-[0.8rem] text-muted-foreground">{field.helpText}</p>}
        </div>
    );
};
