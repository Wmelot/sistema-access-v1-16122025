"use client";

import React from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { FormLabel, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { MEDICATIONS_DB, MED_DESCRIPTIONS } from "@/utils/medication-db";
import { Stethoscope, Trash2, Plus, Info as InfoIcon, Moon, Dumbbell, Target, Pill, Check, ChevronsUpDown, AlertTriangle, AlertCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Controller } from "react-hook-form";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
const ComboboxSelector = ({ value, onChange, database, placeholder = "Buscar...", autoFocus, onCommit }: { value: string, onChange: (v: string) => void, database: string[], placeholder?: string, autoFocus?: boolean, onCommit?: () => void }) => {
    const [open, setOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState("");

    React.useEffect(() => {
        if (autoFocus) {
            setOpen(true);
        }
    }, [autoFocus]);

    const filteredItems = React.useMemo(() => {
        if (!inputValue) return database.slice(0, 50); // Show first 50 as suggestions
        return database.filter(item =>
            item.toLowerCase().includes(inputValue.toLowerCase())
        ).slice(0, 50); // Limit to 50 results
    }, [database, inputValue]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-full h-11 justify-between bg-white text-left font-bold text-slate-700 px-4 rounded-2xl border-slate-200 hover:bg-slate-50 transition-all">
                    <span className="truncate">{value || placeholder}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0 z-[200] rounded-3xl overflow-hidden shadow-2xl border-slate-100" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Digite para buscar..."
                        className="h-12 border-none focus:ring-0 focus:outline-none font-medium px-4"
                        value={inputValue}
                        onValueChange={setInputValue}
                    />
                    <CommandList className="max-h-[300px] overflow-y-auto custom-scrollbar">
                        {filteredItems.length === 0 && (
                            <div className="p-4 text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Nenhum resultado</p>
                                {inputValue && (
                                    <Button
                                        variant="outline"
                                        className="w-full text-indigo-600 font-bold justify-start rounded-xl h-10 border-indigo-100"
                                        onClick={() => {
                                            onChange(inputValue.toUpperCase());
                                            setOpen(false);
                                            if (onCommit) onCommit();
                                        }}
                                    >
                                        <Plus className="mr-2 h-4 w-4" /> Adicionar "{inputValue}"
                                    </Button>
                                )}
                            </div>
                        )}

                        <CommandGroup heading={inputValue ? "Resultados da Busca" : "Sugestões Populares"}>
                            {filteredItems.map((item) => (
                                <CommandItem
                                    key={item}
                                    value={item}
                                    onSelect={() => {
                                        onChange(item)
                                        setOpen(false)
                                        if (onCommit) onCommit()
                                    }}
                                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-indigo-50/50"
                                >
                                    <Check className={cn("h-4 w-4 text-indigo-600", value === item ? "opacity-100" : "opacity-0")} />
                                    <span className="text-xs font-bold text-slate-700">{item}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>

                        {inputValue && !database.some(d => d.toLowerCase() === inputValue.toLowerCase()) && (
                            <CommandGroup heading="Novo Item">
                                <CommandItem
                                    value={inputValue}
                                    onSelect={() => {
                                        onChange(inputValue.toUpperCase());
                                        setOpen(false);
                                        if (onCommit) onCommit();
                                    }}
                                    className="px-4 py-3 text-indigo-600 font-bold bg-indigo-50/20"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Adicionar "{inputValue}"
                                </CommandItem>
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

const MedicationCombobox = ({ value, onChange, autoFocus, onCommit }: { value: string, onChange: (v: string) => void, autoFocus?: boolean, onCommit?: () => void }) => {
    return <ComboboxSelector value={value} onChange={onChange} database={MEDICATIONS_DB} placeholder="Buscar medicamento..." autoFocus={autoFocus} onCommit={onCommit} />;
};

interface ClinicalHistoryAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string; iconColor: string; bg: string };
}

export function ClinicalHistoryAccordion({ openSection, isSectionFilled, sectionStyle }: ClinicalHistoryAccordionProps) {
    const { register, watch, setValue, control } = useFormContext();
    const { fields: medFields, append: appendMed, remove: removeMed } = useFieldArray({ control, name: "clinical.meds" });

    const comorbidities = watch('clinical.comorbidities') || [];

    const COMORBIDITIES_LIST = [
        'HAS', 'Diabetes', 'Cardiopatia', 'D. Reumáticas',
        'D. Respiratórias', 'D. Vasculares', 'D. Tiroideanas',
        'Obesidade', 'Dislipidemia', 'Tabagismo', 'Etilismo', 'Ansiedade/Depressão'
    ];

    return (
        <AccordionItem
            value="clinical"
            className={cn(
                "border rounded-[2rem] border-l-4 transition-all duration-300 shadow-sm overflow-hidden",
                openSection === 'clinical' ? 'bg-white ring-2 ring-indigo-50' : 'bg-white/50',
                isSectionFilled('clinical') ? 'border-slate-200' : 'border-slate-100',
                sectionStyle.border
            )}
        >
            <AccordionTrigger className="px-8 py-6 hover:no-underline flex gap-2 items-center text-left group">
                <div className="flex items-center gap-4 flex-1">
                    <div className={cn("p-2 rounded-xl transition-colors", openSection === 'clinical' ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600")}>
                        <Stethoscope className="h-5 w-5 transition-colors group-hover:animate-bounce" />
                    </div>
                    <div>
                        <span className={cn("font-black text-lg tracking-tight", openSection === 'clinical' ? "text-slate-900" : "text-slate-600")}>2. Histórico Clínico & Estilo de Vida</span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Comorbidades, medicamentos e hábitos</p>
                    </div>
                </div>
                {isSectionFilled('clinical') && (
                    <Badge variant="outline" className="bg-indigo-100 text-indigo-700 border-none text-[10px] h-6 px-3 rounded-full font-black">PROGRESSO OK</Badge>
                )}
            </AccordionTrigger>
            <AccordionContent className="px-8 pb-10 pt-4 border-t border-slate-50">
                <div className="flex flex-col gap-8 max-w-5xl mx-auto">

                    {/* SEÇÃO 1: Saúde Geral */}
                    <div className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100 space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-5 bg-indigo-600 rounded-full" />
                            <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Saúde Geral</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {COMORBIDITIES_LIST.map(c => (
                                <div
                                    key={c}
                                    className={cn(
                                        "flex items-center gap-2 p-2.5 rounded-xl border transition-all cursor-pointer select-none",
                                        comorbidities.includes(c)
                                            ? "bg-white border-indigo-200 text-indigo-700 shadow-sm ring-2 ring-indigo-500/5"
                                            : "bg-white/50 border-slate-100 text-slate-400 opacity-70 hover:opacity-100 hover:border-indigo-100"
                                    )}
                                    onClick={() => {
                                        const next = comorbidities.includes(c)
                                            ? comorbidities.filter((i: string) => i !== c)
                                            : [...comorbidities, c];
                                        setValue('clinical.comorbidities', next);
                                    }}
                                >
                                    <Checkbox
                                        checked={comorbidities.includes(c)}
                                        onCheckedChange={() => { }} // Controlled by div click
                                        className="rounded-md border-indigo-200 h-4 w-4"
                                    />
                                    <span className="text-[10px] font-bold leading-tight">{c}</span>
                                </div>
                            ))}
                        </div>

                        {/* Campo Outros */}
                        <div className="space-y-2 pt-2 border-t border-slate-100/50">
                            <FormLabel className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Outras Condições de Saúde</FormLabel>
                            <Textarea
                                {...register('clinical.otherComorbidities')}
                                placeholder="Digite outras condições, cirurgias prévias ou observações importantes..."
                                className="min-h-[60px] rounded-2xl bg-white border-slate-200 text-[11px] font-medium resize-none focus:ring-indigo-500 shadow-sm"
                            />
                        </div>
                    </div>

                    {/* SEÇÃO 3: Medicamentos */}
                    <div className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100 space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-5 bg-indigo-600 rounded-full" />
                            <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Medicamentos</h4>
                        </div>
                        <div className="space-y-4">
                            {medFields.length > 0 ? medFields.map((field, index) => (
                                <div key={field.id} className="p-4 bg-white rounded-2xl border border-slate-100 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 shadow-sm relative overflow-hidden group">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 space-y-1">
                                            <FormLabel className="text-[9px] font-black text-slate-300 uppercase tracking-tighter ml-1">Substância</FormLabel>
                                            <MedicationCombobox
                                                value={watch(`clinical.meds.${index}.name`)}
                                                onChange={(val) => {
                                                    setValue(`clinical.meds.${index}.name`, val);
                                                    if (MED_DESCRIPTIONS[val]) {
                                                        setValue(`clinical.meds.${index}.description`, MED_DESCRIPTIONS[val]);
                                                    }
                                                }}
                                                autoFocus={index === medFields.length - 1 && !watch(`clinical.meds.${index}.name`)}
                                            />
                                        </div>
                                        <div className="w-20 space-y-1">
                                            <FormLabel className="text-[9px] font-black text-slate-300 uppercase tracking-tighter ml-1">Dose</FormLabel>
                                            <Input
                                                {...register(`clinical.meds.${index}.dose`)}
                                                placeholder="mg"
                                                className="h-10 rounded-xl bg-white border-slate-200 font-bold text-center text-xs"
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-2 pl-3 border-l-2 border-indigo-100">
                                        <Textarea
                                            {...register(`clinical.meds.${index}.description`)}
                                            placeholder="Informação farmacológica..."
                                            className="min-h-[50px] text-[10px] py-1.5 border-none bg-indigo-50/10 focus:bg-white transition-colors rounded-lg font-medium resize-none"
                                        />
                                    </div>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeMed(index)}
                                        className="h-7 w-7 text-slate-200 hover:text-red-500 absolute top-2 right-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            )) : (
                                <div className="p-10 border-2 border-dashed border-slate-100 rounded-[2rem] text-center bg-white/30 backdrop-blur-sm">
                                    <Pill className="h-8 w-8 text-slate-100 mx-auto mb-2" />
                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest uppercase">Nenhuma medicação</p>
                                </div>
                            )}
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => appendMed({ name: "", dose: "" })}
                                className="w-full h-11 border-dashed border-indigo-200 rounded-xl font-black text-[10px] uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-all"
                            >
                                <Plus className="h-4 w-4 mr-2" /> Novo Item
                            </Button>
                        </div>
                    </div>

                    {/* SEÇÃO 3: Estilo de Vida & Metas */}
                    <div className={cn("p-8 rounded-[2.5rem] border transition-all flex flex-col justify-between", sectionStyle.bg, openSection === 'clinical' ? "border-indigo-100 shadow-inner" : "border-transparent")}>
                        <div className="space-y-8">
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-1 h-5 bg-indigo-600 rounded-full" />
                                    <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Estilo de Vida</h4>
                                </div>
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="space-y-2">
                                        <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-1">Qualidade do Sono</FormLabel>
                                        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                                            {['bad', 'regular', 'good'].map(s => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onClick={() => setValue('clinical.sleepQuality', s)}
                                                    className={cn(
                                                        "flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all",
                                                        watch('clinical.sleepQuality') === s
                                                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                                                            : "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50"
                                                    )}
                                                >
                                                    {s === 'bad' ? 'Ruim' : s === 'regular' ? 'Ok' : 'Bom'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-1">Atividade Física</FormLabel>
                                        <select
                                            {...register('clinical.activityLevel')}
                                            className="w-full h-11 bg-white border border-slate-200 rounded-2xl px-4 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                                        >
                                            <option value="sedentary">Sedentário</option>
                                            <option value="light">Leve (1-2x/sem)</option>
                                            <option value="moderate">Moderado (3-4x/sem)</option>
                                            <option value="vigorous">Vigoroso (5x+/sem)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-1 h-5 bg-indigo-600 rounded-full" />
                                    <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Expectativas & Metas</h4>
                                </div>
                                <div className="space-y-4">
                                    <Textarea
                                        {...register('clinical.goals')}
                                        placeholder="Ex: Voltar a jogar futebol..."
                                        className="min-h-[120px] rounded-[2rem] border-slate-200 focus:ring-indigo-500 bg-white text-sm font-medium p-6 shadow-sm resize-none"
                                    />
                                    <div className="p-4 bg-white/80 border border-indigo-100 rounded-2xl flex gap-3 text-[10px] text-indigo-700 font-black uppercase tracking-tight leading-relaxed">
                                        <Target className="h-4 w-4 shrink-0 text-indigo-400" />
                                        <span>Metas claras aumentam a aderência em até 40%.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
