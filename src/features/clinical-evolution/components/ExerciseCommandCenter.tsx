"use client";

import React, { useState } from 'react';
import { Search, Plus, Zap, Activity, Sun, Gauge, Dumbbell, Box, ChevronDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface Exercise {
    id: string;
    name: string;
    category: string;
}

interface CommandProps {
    exercises: Exercise[];
    onSelect: (ex: Exercise) => void;
    onCreate: (name: string) => void;
}

export function ExerciseCommandCenter({ exercises, onSelect, onCreate }: CommandProps) {
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
        if (type === 'Eletroterapia') return <Zap size={14} className="text-amber-500" />;
        if (type === 'Fotobiomodulação') return <Sun size={14} className="text-rose-500" />;
        if (type === 'Recovery') return <Gauge size={14} className="text-sky-500" />;
        if (type === 'Pilates') return <Activity size={14} className="text-teal-500" />;
        if (type === 'Terapia Manual') return <Box size={14} className="text-indigo-500" />;
        return <Dumbbell size={14} className="text-emerald-500" />;
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Header Search */}
            <div className="p-4 border-b border-slate-50 bg-white z-10">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 font-medium text-slate-700"
                        placeholder="Buscar conduta..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Content Area */}
            <ScrollArea className="flex-1 bg-slate-50/30">
                <div className="p-3">
                    {filtered.length === 0 && query.length > 1 ? (
                        <div className="text-center py-10 px-4 flex flex-col items-center justify-center">
                            <Dumbbell size={32} className="text-slate-200 mb-2" />
                            <p className="text-sm text-slate-500 mb-4">Conduta não encontrada: <br /><span className="font-bold text-slate-700">"{query}"</span></p>
                            <Button
                                onClick={() => {
                                    onCreate(query);
                                    setQuery('');
                                }}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-indigo-100"
                            >
                                <Plus size={14} /> Criar "{query}"
                            </Button>
                        </div>
                    ) : (
                        /* Changed defaultValue to empty array to start closed */
                        <Accordion type="single" collapsible className="space-y-2">
                            {sortedCategories.map(category => (
                                <AccordionItem key={category} value={category} className="border border-slate-100 bg-white rounded-xl shadow-sm px-0 overflow-hidden">
                                    <AccordionTrigger className="px-3 py-2.5 hover:no-underline hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-slate-50 p-1.5 rounded-md border border-slate-100">
                                                {getIcon(category)}
                                            </div>
                                            <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
                                                {category}
                                            </span>
                                            <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full font-bold ml-1">
                                                {grouped[category].length}
                                            </span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-0 pb-2 px-2 border-t border-slate-50">
                                        <div className="grid gap-1 mt-2">
                                            {grouped[category].map((ex: Exercise) => (
                                                <button
                                                    key={ex.id}
                                                    onClick={() => {
                                                        onSelect(ex);
                                                        setQuery('');
                                                    }}
                                                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-xs font-medium transition-colors flex items-center justify-between group"
                                                >
                                                    {ex.name}
                                                    <Plus size={12} className="opacity-0 group-hover:opacity-100 text-indigo-400" />
                                                </button>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    )}
                </div>
            </ScrollArea>

            <div className="p-2 border-t border-slate-100 bg-white text-center">
                <span className="text-[10px] uppercase font-bold text-slate-300">
                    {exercises.length} Condutas
                </span>
            </div>
        </div>
    );
}
