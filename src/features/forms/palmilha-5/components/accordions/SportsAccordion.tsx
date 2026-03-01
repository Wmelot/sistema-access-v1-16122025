import React, { useMemo, useState } from "react";
import { useFormContext, useFieldArray, useWatch } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Zap, Trash2, Plus, ChevronsUpDown, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label as FormLabel } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { calculateActivityLevel, KCAL_TABLE } from "@/utils/pbe-calculations";

function SportCombobox({ value, onChange, options }: { value: string, onChange: (val: string) => void, options: string[] }) {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between h-9 font-normal text-left px-3 text-sm focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                    <span className="truncate">{value || "Selecione..."}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 z-[120]" align="start" side="bottom" sideOffset={8}>
                <Command>
                    <CommandInput placeholder="Buscar modalidade..." />
                    <CommandList className="max-h-[300px] overflow-y-auto overflow-x-hidden">
                        <CommandEmpty>Nenhuma modalidade encontrada.</CommandEmpty>
                        <CommandGroup>
                            {options.map((sport) => (
                                <CommandItem
                                    key={sport}
                                    value={sport}
                                    onSelect={(currentValue) => {
                                        onChange(sport);
                                        setOpen(false);
                                    }}
                                >
                                    <Check className={cn("mr-2 h-4 w-4", value === sport ? "opacity-100" : "opacity-0")} />
                                    {sport}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

interface SportsAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string; iconColor: string };
}

export function SportsAccordion({ openSection, isSectionFilled, sectionStyle }: SportsAccordionProps) {
    const form = useFormContext();

    const { fields: sportFields, append: appendSport, remove: removeSport } = useFieldArray({
        control: form.control,
        name: "sports"
    });

    const weightVal = form.watch("anthropometry.weight");
    const sportsVal = form.watch("sports");

    const calData = useMemo(() => {
        const currentWeight = weightVal && !isNaN(Number(weightVal)) ? Number(weightVal) : 70;

        try {
            const res = calculateActivityLevel(currentWeight, sportsVal || []);
            return { weekly: res.weeklyBurn, minutes: res.totalMinutes, level: res.level, color: res.color, riskText: res.riskText };
        } catch (e) {
            return { weekly: 0, minutes: 0, level: 'SEDENTÁRIO', color: 'bg-red-50 text-red-600 border-red-200' };
        }
    }, [weightVal, JSON.stringify(sportsVal)]);

    return (
        <AccordionItem
            value="sports"
            data-value="sports"
            className={cn(
                "border rounded-xl border-l-4 transition-all duration-300 shadow-sm",
                openSection === 'sports' ? 'col-span-1 md:col-span-2 bg-white ring-2 ring-yellow-50' : 'col-span-1 bg-white/50 border-slate-200',
                isSectionFilled('sports') ? 'bg-slate-50/80 border-slate-200' : 'bg-card',
                sectionStyle.border
            )}
        >
            <AccordionTrigger className="px-5 py-4 hover:no-underline flex gap-2 items-center text-left group">
                <div className="flex items-center gap-3 flex-1 text-base">
                    <Zap className={cn("h-5 w-5 transition-colors group-hover:animate-bounce", sectionStyle.iconColor)} />
                    <span className="font-bold tracking-tight text-slate-700 group-hover:text-yellow-600 transition-colors">Rotina Desportiva</span>
                </div>
                {isSectionFilled('sports') && <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-none text-[10px] h-5 mr-4 font-black tracking-widest uppercase">PREENCHIDO</Badge>}
            </AccordionTrigger>
            <AccordionContent className="p-4 space-y-6 border-t border-slate-50">
                <div className="flex items-center gap-4 bg-green-50 p-4 rounded-xl border border-green-100">
                    <div className="space-y-1">
                        <FormLabel className="text-[10px] uppercase font-black text-green-600">Peso Corporal (kg)</FormLabel>
                        <Input type="number" {...form.register("anthropometry.weight")} className="bg-white w-24 font-bold h-10 text-lg" placeholder="70" />
                    </div>
                    <div className="flex-1 text-right">
                        <div className="text-[10px] text-slate-500 font-bold uppercase">Estimativa Semanal</div>
                        <div className="text-2xl font-black text-orange-600">{calData.weekly} kcal</div>
                        <div className="flex justify-end gap-2 items-center mt-1">
                            <span className="text-[10px] font-bold text-slate-400">{calData.minutes} min/semana</span>
                            <Badge className={cn("text-[9px] font-black uppercase", calData.color)}>{calData.level}</Badge>
                        </div>
                    </div>
                </div>

                {sportFields.map((field, index) => (
                    <div key={field.id} className="flex flex-col md:flex-row gap-3 md:items-end border-b pb-4 animate-in fade-in duration-300 w-full">
                        <div className="w-full md:w-[35%] shrink-0">
                            <FormLabel className="text-[10px] uppercase font-bold text-slate-400">Modalidade</FormLabel>
                            <SportCombobox
                                value={form.watch(`sports.${index}.type`)}
                                onChange={(val) => form.setValue(`sports.${index}.type` as any, val)}
                                options={Object.keys(KCAL_TABLE)}
                            />
                        </div>
                        <div className="grid grid-cols-2 md:flex gap-3 flex-1">
                            <div className="flex-1">
                                <FormLabel className="text-[10px] uppercase font-bold text-slate-400">Frequência</FormLabel>
                                <Input type="number" {...form.register(`sports.${index}.freq` as any)} placeholder="Ex: 3 Dias/Semana" className="h-9 w-full" />
                            </div>
                            <div className="flex-1">
                                <FormLabel className="text-[10px] uppercase font-bold text-slate-400">Duração</FormLabel>
                                <Input type="number" {...form.register(`sports.${index}.duration` as any)} placeholder="Ex: 40 Min/Dia" className="h-9 w-full" />
                            </div>
                        </div>
                        <div className="flex justify-end md:shrink-0 md:pb-0.5">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    removeSport(index);
                                }}
                                className="focusable-element h-9 w-9 text-red-500 hover:bg-red-50"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                ))}

                <Button type="button" variant="outline" size="sm" onClick={() => appendSport({ type: "", freq: "", duration: "" })} className="focusable-element w-full border-dashed py-5 hover:bg-slate-50 transition-all font-bold text-slate-600">
                    <Plus className="w-4 h-4 mr-2" /> ADICIONAR MODALIDADE
                </Button>
            </AccordionContent>
        </AccordionItem>
    );
}
