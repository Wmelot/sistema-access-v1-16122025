"use client";

import React, { useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
    Brain, Activity, Zap, ClipboardCheck, Info, UserCheck,
    Move, Scale, RefreshCw, Layers, ShieldAlert, Target,
    Footprints, Accessibility, Gauge, History, Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { NeuroAdultRichProtocol } from "./protocols/NeuroAdultRichProtocol";

interface NeuroAdultAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string; iconColor: string; bg: string };
    setIsAssessmentModalOpen?: (isOpen: boolean) => void;
}

export function NeuroAdultAccordion({ openSection, isSectionFilled, sectionStyle, setIsAssessmentModalOpen }: NeuroAdultAccordionProps) {
    const isFilled = isSectionFilled('neuro_adult');

    return (
        <AccordionItem
            value="neuro_adult"
            className={cn(
                "border rounded-[2rem] border-l-4 transition-all duration-300 shadow-sm overflow-hidden",
                openSection === 'neuro_adult' ? 'bg-white ring-2 ring-indigo-50' : 'bg-white/50',
                isFilled ? 'border-slate-200' : 'border-slate-100',
                sectionStyle.border
            )}
        >
            <AccordionTrigger className="px-8 py-6 hover:no-underline flex gap-2 items-center text-left group">
                <div className="flex items-center gap-4 flex-1">
                    <div className={cn("p-2 rounded-xl transition-colors", openSection === 'neuro_adult' ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600")}>
                        <Brain className="h-5 w-5" />
                    </div>
                    <div>
                        <span className={cn("font-black text-lg tracking-tight", openSection === 'neuro_adult' ? "text-slate-900" : "text-slate-600")}>Neurofuncional Adulto</span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Berg, Fugl-Meyer, TUG e Exame Neurológico</p>
                    </div>
                </div>
                {isFilled && (
                    <Badge variant="outline" className="bg-indigo-100 text-indigo-700 border-none text-[10px] h-6 px-3 rounded-full font-black uppercase">
                        AVALIAÇÃO ATIVA
                    </Badge>
                )}
            </AccordionTrigger>
            <AccordionContent className="px-0 pb-0 border-t border-slate-50">
                <div className="p-8">
                    <NeuroAdultRichProtocol />
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
