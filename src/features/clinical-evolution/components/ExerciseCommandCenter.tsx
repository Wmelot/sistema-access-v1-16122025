"use client";

import React, { useState } from 'react';
import { Search, Plus, Zap, Activity, Sun, Gauge, Dumbbell, Box, ChevronDown, List } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

interface Exercise {
    id: string;
    name: string;
    category: string;
}

interface CommandProps {
    exercises: Exercise[];
    onSelect: (ex: Exercise) => void;
    onCreate: (name: string) => void;
    gridView?: boolean;
}

export function ExerciseCommandCenter({ exercises, onSelect, onCreate, gridView = false }: CommandProps) {
    const [query, setQuery] = useState('');

    // 1. Filter exercises based on search
    const filtered = exercises.filter(ex =>
        ex.name.toLowerCase().includes(query.toLowerCase()) ||
        ex.category.toLowerCase().includes(query.toLowerCase())
    );

    // 2. Group by Category
    const grouped = filtered.reduce((acc: any, ex) => {
        const cat = ex.category || 'Geral';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(ex);
        return acc;
    }, {});

    // Sort categories logic
    const categoryOrder = ['Cinesioterapia', 'Terapia Manual', 'Eletroterapia', 'Fotobiomodulação', 'Pilates', 'Recovery', 'Geral'];
    const sortedCategories = Object.keys(grouped).sort((a, b) => {
        const idxA = categoryOrder.indexOf(a);
        const idxB = categoryOrder.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
    });

    const getIcon = (type: string) => {
        if (type === 'Eletroterapia') return <Zap size={18} className="text-amber-500" />;
        if (type === 'Fotobiomodulação') return <Sun size={18} className="text-rose-500" />;
        if (type === 'Recovery') return <Gauge size={18} className="text-sky-500" />;
        if (type === 'Pilates') return <Activity size={18} className="text-teal-500" />;
        if (type === 'Terapia Manual') return <Box size={18} className="text-indigo-500" />;
        return <Dumbbell size={18} className="text-emerald-500" />;
    };

    return (
        <div className="flex flex-col h-full bg-slate-50/50">
            {/* Header Search */}
            <div className="p-4 bg-white border-b border-slate-100/50 sticky top-0 z-20">
                <div className="relative shadow-sm rounded-xl">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 font-medium text-slate-700"
                        placeholder="Buscar conduta..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Content Area */}
            <ScrollArea className="flex-1 px-4 py-2">
                {filtered.length === 0 && query.length > 1 ? (
                    <div className="text-center py-20 px-4 flex flex-col items-center justify-center">
                        <Dumbbell size={40} className="text-slate-200 mb-3" />
                        <p className="text-base text-slate-500 mb-6">Conduta não encontrada: <br /><span className="font-bold text-slate-800">"{query}"</span></p>
                        <Button
                            onClick={() => {
                                onCreate(query);
                                setQuery('');
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm h-10 px-6 rounded-full transition-colors flex items-center gap-2 shadow-lg shadow-indigo-200 font-bold"
                        >
                            <Plus size={16} /> Criar "{query}"
                        </Button>
                    </div>
                ) : (
                    /* GRID LAYOUT FOR DESKTOP (IF REQUESTED), LIST FOR MOBILE/DEFAULT */
                    <Accordion
                        type="single"
                        collapsible
                        className={cn(
                            "space-y-3 pb-20",
                            gridView ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 space-y-0 items-start" : ""
                        )}
                    >
                        {sortedCategories.map(category => (
                            <AccordionItem
                                key={category}
                                value={category}
                                className="border border-slate-200 bg-white rounded-2xl shadow-sm overflow-hidden data-[state=open]:ring-2 data-[state=open]:ring-indigo-500/20 transition-all hover:shadow-md"
                            >
                                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-50/50 transition-colors">
                                    <div className="flex items-center gap-3 w-full text-left">
                                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 shrink-0">
                                            {getIcon(category)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm font-bold uppercase tracking-wide text-slate-700 block truncate">
                                                {category}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-medium">
                                                {grouped[category].length} opções
                                            </span>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-0 pb-2 px-2 border-t border-slate-50 bg-slate-50/30">
                                    <div className="grid gap-1 mt-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                                        {grouped[category].map((ex: Exercise) => (
                                            <button
                                                key={ex.id}
                                                onClick={() => {
                                                    onSelect(ex);
                                                    setQuery('');
                                                }}
                                                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-white hover:text-indigo-700 text-slate-600 text-xs font-semibold transition-all flex items-center justify-between group border border-transparent hover:border-indigo-100 hover:shadow-sm"
                                            >
                                                <span className="truncate pr-2">{ex.name}</span>
                                                <Plus size={14} className="opacity-0 group-hover:opacity-100 text-indigo-500 shrink-0 transition-opacity" />
                                            </button>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                )}
            </ScrollArea>
        </div>
    );
}
