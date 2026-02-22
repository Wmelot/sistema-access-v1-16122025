import React, { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const normalizeStr = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const EXERCISES_DB = [
    "Fortalecimento de Glúteo Médio (Drop Pélvico)",
    "Fortalecimento de Glúteo Médio (Ostra)",
    "Fortalecimento Excêntrico de Tríceps Sural",
    "Fortalecimento de Glúteo Máximo",
    "Controlo de CORE e Respiração Diagmática",
    "Ponte Unilateral / Ponte Lateral",
    "Fortalecimento de Quadríceps (CCF/CCA)",
    "Excêntrico de Isquiosurais em Longitude",
    "Mobilidade de Quadril",
    "Mobilidade de Tornozelo / Flexão Dorsal"
];

const ComboboxSelector = ({ value, onChange, database, placeholder = "Buscar...", autoFocus, onCommit }: { value: string, onChange: (v: string) => void, database: string[], placeholder?: string, autoFocus?: boolean, onCommit?: () => void }) => {
    const [open, setOpen] = useState(false);
    const [customInput, setCustomInput] = useState("");

    const normalizedCustom = normalizeStr(customInput);

    // check if it's an exact match (blocks adding)
    const isExactDuplicate = normalizedCustom.length >= 3 && database.some(item => {
        return normalizeStr(item) === normalizedCustom;
    });

    // check if there's a similar item (just warns, but allows adding if not exact)
    const isSimilar = !isExactDuplicate && normalizedCustom.length >= 3 && database.some(item => {
        const normalizedItem = normalizeStr(item);
        return normalizedItem.includes(normalizedCustom) || normalizedCustom.includes(normalizedItem);
    });

    useEffect(() => {
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
                    />
                    <CommandList>
                        <CommandEmpty>
                            <div className="p-2 text-xs text-slate-500 text-center">Para adicionar novo, digite abaixo 👇</div>
                        </CommandEmpty>
                        <CommandGroup heading="Sugestões Populares" className="max-h-[200px] overflow-auto">
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
                <div className="p-2 border-t bg-slate-50">
                    <div className="text-[10px] text-slate-400 font-bold mb-1 uppercase">Não encontrou? Digite aqui:</div>
                    <Input
                        className={cn("h-8 text-xs shadow-none transition-colors",
                            isExactDuplicate ? "bg-red-50 border-red-300 text-red-900 focus-visible:ring-red-400" :
                                isSimilar ? "bg-amber-50 border-amber-300 text-amber-900 focus-visible:ring-amber-400" :
                                    "bg-white border-slate-200"
                        )}
                        placeholder="Nome personalizado..."
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                if (isExactDuplicate) return; // prevents adding exact duplicate
                                if (!customInput.trim()) return;

                                onChange(customInput);
                                setOpen(false);
                                setCustomInput(""); // reset
                                if (onCommit) onCommit()
                            }
                        }}
                    />
                    {isExactDuplicate && (
                        <div className="text-[10px] text-red-600 font-bold flex items-center gap-1 mt-1.5 animate-in fade-in slide-in-from-top-1">
                            <AlertTriangle className="w-3 h-3" />
                            Este exercício já existe exatamente assim!
                        </div>
                    )}
                    {isSimilar && (
                        <div className="text-[10px] text-amber-600 font-bold flex items-center gap-1 mt-1.5 animate-in fade-in slide-in-from-top-1">
                            <AlertTriangle className="w-3 h-3" />
                            Exercício similar encontrado acima. Tem certeza que quer adicionar? (Pressione Enter para forçar)
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
};

export const ExerciseCombobox = ({ value, onChange, autoFocus, onCommit }: { value: string, onChange: (v: string) => void, autoFocus?: boolean, onCommit?: () => void }) => {
    return <ComboboxSelector value={value} onChange={onChange} database={EXERCISES_DB} placeholder="Buscar exercício..." autoFocus={autoFocus} onCommit={onCommit} />;
};
