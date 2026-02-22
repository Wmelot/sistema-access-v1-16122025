"use client";

import React, { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

export const QUESTIONNAIRES_BY_CATEGORY = [
    {
        category: "Coluna Cervical",
        items: [
            { id: "ndi", label: "NDI (Cervical)" }
        ]
    },
    {
        category: "Coluna Lombar",
        items: [
            { id: "oswestry", label: "Oswestry (Lombar)" },
            { id: "roland_morris", label: "Roland-Morris (Lombar)" },
            { id: "quebec", label: "Quebec (Lombar)" },
            { id: "start_back", label: "STarT Back (Triagem)" }
        ]
    },
    {
        category: "Ombro",
        items: [
            { id: "spadi", label: "SPADI (Ombro)" }
        ]
    },
    {
        category: "Cotovelo, Punho e Mão",
        items: [
            { id: "quickdash", label: "QuickDASH (Mm. Superior)" },
            { id: "prwe", label: "PRWE (Punho)" }
        ]
    },
    {
        category: "Quadril",
        items: [
            { id: "hoos", label: "HOOS (Quadril)" },
            { id: "ihot33", label: "iHOT-33 (Quadril)" }
        ]
    },
    {
        category: "Joelho",
        items: [
            { id: "koos", label: "KOOS (Joelho)" },
            { id: "ikdc", label: "IKDC Subjetivo (Joelho)" },
            { id: "lysholm", label: "Lysholm (Joelho)" }
        ]
    },
    {
        category: "Pé e Tornozelo",
        items: [
            { id: "lefs", label: "LEFS (Membro Inferior)" },
            { id: "faam", label: "FAAM (Tornozelo e Pé)" },
            { id: "faos", label: "FAOS (Tornozelo e Pé)" },
            { id: "aofas", label: "AOFAS (Tornozelo/Retropé)" }
        ]
    },
    {
        category: "Saúde Pélvica",
        items: [
            { id: "iciq_sf", label: "ICIQ-SF (Incontinência)" },
            { id: "udi_6", label: "UDI-6 (Urogenital)" },
            { id: "fsfi", label: "FSFI (Função Sexual)" }
        ]
    },
    {
        category: "Geral & Dor",
        items: [
            { id: "tampa_kinesiophobia", label: "Tampa (Cinesiofobia)" },
            { id: "mcgill_short", label: "McGill (Dor)" }
        ]
    }
];

export const ALL_QUESTIONNAIRES = QUESTIONNAIRES_BY_CATEGORY.flatMap(c => c.items);

export const ExtraQuestionnaireSelector = ({ value, onChange, readonly }: { value: string, onChange: (v: string) => void, readonly?: boolean }) => {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={readonly}
                    className="w-full justify-between h-9 text-xs border-blue-200 font-bold bg-white text-blue-900 shadow-sm hover:bg-blue-50 focus:ring-0"
                >
                    <span className="truncate">{value && value !== 'none'
                        ? ALL_QUESTIONNAIRES.find((q) => q.id === value)?.label
                        : "Selecionar Questionário Clínico..."}</span>
                    <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Buscar questionário..." className="h-9 border-none focus:ring-0 focus:outline-none" />
                    <CommandList className="max-h-[400px]">
                        <CommandEmpty>Não encontrado.</CommandEmpty>
                        <CommandGroup>
                            <CommandItem value="none" onSelect={() => { onChange('none'); setOpen(false); }}>
                                <span className="font-bold text-slate-400">Nenhum (Apenas Funcional)</span>
                            </CommandItem>
                            {QUESTIONNAIRES_BY_CATEGORY.map((cat) => (
                                <div key={cat.category} className="px-2 py-1.5 border-b last:border-0 border-slate-50">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1 px-2">{cat.category}</div>
                                    {cat.items.map((q) => (
                                        <CommandItem
                                            key={q.id}
                                            value={q.label}
                                            onSelect={() => {
                                                onChange(q.id);
                                                setOpen(false);
                                            }}
                                            className="pl-4 h-8"
                                        >
                                            <Check className={cn("mr-2 h-3.5 w-3.5", value === q.id ? "opacity-100" : "opacity-0")} />
                                            <span className="text-xs">{q.label}</span>
                                        </CommandItem>
                                    ))}
                                </div>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};
