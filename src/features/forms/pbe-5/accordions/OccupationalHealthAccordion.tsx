"use client";

import React, { useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
    Briefcase, Activity, Target, ShieldCheck, Info, UserCheck,
    Construction, AlertTriangle, Ruler, Scale, RefreshCw, Layers,
    MousePointer2, Dumbbell, ClipboardList, PenTool, Search, HardHat
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface OccupationalHealthAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string; iconColor: string; bg: string };
    setIsAssessmentModalOpen?: (isOpen: boolean) => void;
}

import { OccupationalHealthRichProtocol } from "./protocols/OccupationalHealthRichProtocol";

interface OccupationalHealthAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string; iconColor: string; bg: string };
    setIsAssessmentModalOpen?: (isOpen: boolean) => void;
}

export function OccupationalHealthAccordion({ openSection, isSectionFilled, sectionStyle, setIsAssessmentModalOpen }: OccupationalHealthAccordionProps) {
    const isFilled = isSectionFilled('occupational_health');

    return (
        <AccordionItem
            value="occupational_health"
            className={cn(
                "border rounded-[2rem] border-l-4 transition-all duration-300 shadow-sm overflow-hidden",
                openSection === 'occupational_health' ? 'bg-white ring-2 ring-amber-50' : 'bg-white/50',
                isFilled ? 'border-slate-200' : 'border-slate-100',
                sectionStyle.border
            )}
        >
            <AccordionTrigger className="px-8 py-6 hover:no-underline flex gap-2 items-center text-left group">
                <div className="flex items-center gap-4 flex-1">
                    <div className={cn("p-2 rounded-xl transition-colors", openSection === 'occupational_health' ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-600")}>
                        <Briefcase className="h-5 w-5 transition-colors group-hover:animate-bounce" />
                    </div>
                    <div>
                        <span className={cn("font-black text-lg tracking-tight", openSection === 'occupational_health' ? "text-slate-900" : "text-slate-600")}>Saúde do Trabalho & Ergonomia</span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Laudos Periciais, Riscos Ergonômicos e Aptidão Laboral</p>
                    </div>
                </div>
                {isFilled && (
                    <Badge variant="outline" className="bg-amber-100 text-amber-700 border-none text-[10px] h-6 px-3 rounded-full font-black uppercase">
                        ANÁLISE PERICIAL ATIVA
                    </Badge>
                )}
            </AccordionTrigger>
            <AccordionContent className="px-0 pb-0 border-t border-slate-50">
                <div className="p-8">
                    <OccupationalHealthRichProtocol />
                </div>

                <div className="bg-amber-50/50 p-8 flex items-center gap-5 border-t border-amber-100">
                    <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center border border-amber-100 shadow-sm shrink-0">
                        <UserCheck className="h-6 w-6 text-amber-500 animate-pulse" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-amber-700 uppercase tracking-[0.1em] mb-1">Parecer Axiom para Médicos e Advogados</p>
                        <p className="text-[10px] font-bold text-amber-900/60 leading-relaxed uppercase tracking-tighter">
                            Este formulário foi estruturado para atender exigências do Ministério do Trabalho e tribunais. O preenchimento detalhado do Nexo e ErgoRisk garante a robustez jurídica do seu atendimento clínico.
                        </p>
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
