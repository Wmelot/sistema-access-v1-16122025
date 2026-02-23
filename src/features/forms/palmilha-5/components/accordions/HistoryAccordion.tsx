import React from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Stethoscope, Trash2, Plus, Info as InfoIcon, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

import { MEDICATIONS_DB, MED_DESCRIPTIONS } from "@/utils/medication-db";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface HistoryAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string; iconColor: string };
}

// Extracted ComboboxSelector from BiomechanicsInsoleForm
const ComboboxSelector = ({ value, onChange, database, placeholder = "Buscar...", autoFocus, onCommit }: { value: string, onChange: (v: string) => void, database: string[], placeholder?: string, autoFocus?: boolean, onCommit?: () => void }) => {
    const [open, setOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState(""); // [NEW] Track input

    React.useEffect(() => {
        if (autoFocus) {
            setOpen(true);
        }
    }, [autoFocus]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-full h-9 justify-between bg-white text-left font-normal text-slate-700 px-3 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                    <span className="truncate">{value || placeholder}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput
                        placeholder="Digite para buscar..."
                        className="h-9 border-none focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                        value={inputValue}
                        onValueChange={setInputValue}
                    />
                    <CommandList>
                        <CommandEmpty>
                            <div className="p-2 text-xs text-slate-500 text-center">
                                {inputValue ? (
                                    <Button
                                        variant="ghost"
                                        className="w-full text-indigo-600 font-bold justify-start"
                                        onClick={() => {
                                            onChange(inputValue.toUpperCase());
                                            setOpen(false);
                                            if (onCommit) onCommit();
                                        }}
                                    >
                                        <Plus className="mr-2 h-4 w-4" /> Adicionar "{inputValue}"
                                    </Button>
                                ) : (
                                    "Para adicionar novo, digite acima 👇"
                                )}
                            </div>
                        </CommandEmpty>
                        <CommandGroup heading="Sugestões Populares" className="max-h-[200px] overflow-auto">
                            {inputValue && !database.some(d => d.toLowerCase() === inputValue.toLowerCase()) && (
                                <CommandItem
                                    value={inputValue}
                                    onSelect={() => {
                                        onChange(inputValue.toUpperCase());
                                        setOpen(false);
                                        if (onCommit) onCommit();
                                    }}
                                    className="text-indigo-600 font-bold bg-indigo-50/50 mb-1"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Adicionar "{inputValue}"
                                </CommandItem>
                            )}
                            {database.map((item) => (
                                <CommandItem
                                    key={item}
                                    value={item}
                                    onSelect={(currentValue) => {
                                        onChange(item)
                                        setOpen(false)
                                        if (onCommit) onCommit()
                                    }}
                                >
                                    <Check className={cn("mr-2 h-4 w-4", value === item ? "opacity-100" : "opacity-0")} />
                                    {item}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

const MedicationCombobox = ({ value, onChange, autoFocus, onCommit }: { value: string, onChange: (v: string) => void, autoFocus?: boolean, onCommit?: () => void }) => {
    return <ComboboxSelector value={value} onChange={onChange} database={MEDICATIONS_DB} placeholder="Buscar medicamento..." autoFocus={autoFocus} onCommit={onCommit} />;
};


export function HistoryAccordion({ openSection, isSectionFilled, sectionStyle }: HistoryAccordionProps) {
    const form = useFormContext();
    const { fields: medFields, append: appendMed, remove: removeMed } = useFieldArray({ control: form.control, name: "history.meds" });

    return (
        <AccordionItem
            value="history"
            data-value="history"
            className={cn(
                "border rounded-xl border-l-4 transition-all duration-300 shadow-sm",
                openSection === 'history' ? 'col-span-1 md:col-span-2 bg-white' : 'col-span-1',
                isSectionFilled('history') ? 'bg-slate-100 border-slate-200' : 'bg-card',
                sectionStyle.border
            )}
        >
            <AccordionTrigger className="px-4 font-bold text-slate-700 hover:no-underline flex gap-2 items-center text-left">
                <div className="flex items-center gap-2 flex-1 text-base">
                    <Stethoscope className={cn("h-5 w-5", sectionStyle.iconColor)} />
                    <span>Histórico Clínico</span>
                </div>
                {isSectionFilled('history') && <Badge variant="outline" className="bg-slate-200 text-slate-600 border-none text-[9px] h-5 mr-4">PREENCHIDO</Badge>}
            </AccordionTrigger>
            <AccordionContent className="p-4 space-y-6">
                <div className="space-y-3">
                    <FormLabel>Comorbilidades</FormLabel>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {['Cardiopatia', 'Diabetes', 'D. Metabólicas', 'D. Reumáticas', 'D. Tiroideanas', 'D. Vasculares', 'Dislipidemia', 'Etilismo', 'HAS', 'Obesidade', 'Osteoporose', 'Tabagismo'].map(c => (
                            <div key={c} className="flex items-center gap-2">
                                <Checkbox onCheckedChange={(checked) => {
                                    const current = form.getValues("history.comorbidities") || [];
                                    form.setValue("history.comorbidities", checked ? [...current, c] : current.filter((i: string) => i !== c));
                                }} />
                                <label className="text-sm">{c}</label>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="space-y-3">
                    <FormLabel>Medicação em Uso</FormLabel>
                    <div className="space-y-3">
                        {medFields.map((field, index) => {
                            const medName = form.watch(`history.meds.${index}.name` as any);
                            const description = MED_DESCRIPTIONS[medName];

                            return (
                                <div key={field.id} className="animate-in slide-in-from-left-2 duration-300 border-b border-dashed pb-3 last:border-0 last:pb-0">
                                    <div className="flex gap-3 items-end">
                                        <div className="flex-1 space-y-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Nome do Medicamento</span>
                                            <MedicationCombobox
                                                value={medName}
                                                onChange={(val) => form.setValue(`history.meds.${index}.name` as any, val)}
                                                autoFocus={index === medFields.length - 1 && !medName}
                                                onCommit={() => document.getElementById(`history.meds.${index}.dose`)?.focus()}
                                            />
                                        </div>
                                        <div className="w-24 space-y-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Dosagem</span>
                                            <Input
                                                id={`history.meds.${index}.dose`}
                                                {...form.register(`history.meds.${index}.dose` as any)}
                                                className="bg-white h-9"
                                                placeholder="miligramas"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Tab' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        document.getElementById('add-med-btn')?.focus();
                                                    }
                                                }}
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                removeMed(index);
                                            }}
                                            className="focusable-element h-9 w-9 text-slate-400 hover:text-red-500 mb-0.5"
                                            tabIndex={-1} // Skip delete on tab
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    {/* Bloco de Informação Farmacológica (Full Width abaixo) */}
                                    {description && (
                                        <Alert className="bg-blue-50 border-blue-100 py-2 mt-2">
                                            <InfoIcon className="h-4 w-4 text-blue-600" />
                                            <div className="flex flex-col items-start text-left">
                                                <AlertTitle className="text-xs font-bold text-blue-800 mb-0.5">Informação Farmacológica</AlertTitle>
                                                <AlertDescription className="text-[10px] text-blue-700 leading-tight">
                                                    {description}
                                                </AlertDescription>
                                            </div>
                                        </Alert>
                                    )}
                                </div>
                            );
                        })}
                        <Button
                            id="add-med-btn"
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => appendMed({ name: "", dose: "" })}
                            className="focusable-element w-full border-dashed h-10 hover:bg-slate-50 text-slate-500 font-bold text-xs"
                        >
                            <Plus className="w-3.5 h-3.5 mr-2" /> ADICIONAR MEDICAÇÃO
                        </Button>
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
