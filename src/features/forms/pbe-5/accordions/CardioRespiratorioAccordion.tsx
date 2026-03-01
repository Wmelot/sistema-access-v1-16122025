"use client";

import React, { useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
    Heart, Activity, Wind, Thermometer, Info, Plus,
    Zap, Ruler, Scale, RefreshCw, Layers, Gauge,
    Stethoscope, Clock, Footprints, AlertCircle, Timer, TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { CardioRespiratorioRichProtocol } from "./protocols/CardioRespiratorioRichProtocol";

interface CardioRespiratorioAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string; iconColor: string; bg: string };
    setIsAssessmentModalOpen?: (isOpen: boolean) => void;
}

export function CardioRespiratorioAccordion({ openSection, isSectionFilled, sectionStyle, setIsAssessmentModalOpen }: CardioRespiratorioAccordionProps) {
    const isFilled = isSectionFilled('cardio_respiratory');

    return (
        <AccordionItem
            value="cardio_respiratory"
            className={cn(
                "border rounded-[2rem] border-l-4 transition-all duration-300 shadow-sm overflow-hidden",
                openSection === 'cardio_respiratory' ? 'bg-white ring-2 ring-emerald-50' : 'bg-white/50',
                isFilled ? 'border-slate-200' : 'border-slate-100',
                sectionStyle.border
            )}
        >
            <AccordionTrigger className="px-8 py-6 hover:no-underline flex gap-2 items-center text-left group">
                <div className="flex items-center gap-4 flex-1">
                    <div className={cn("p-2 rounded-xl transition-colors", openSection === 'cardio_respiratory' ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600")}>
                        <Activity className="h-5 w-5 transition-colors group-hover:animate-bounce" />
                    </div>
                    <div>
                        <span className={cn("font-black text-lg tracking-tight", openSection === 'cardio_respiratory' ? "text-slate-900" : "text-slate-600")}>Cardiovascular e Respiratório</span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Teste de 6 Minutos, Borg, Ausculta e Cirtometria</p>
                    </div>
                </div>
                {isFilled && (
                    <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-none text-[10px] h-6 px-3 rounded-full font-black uppercase">
                        MONITORIZAÇÃO ATIVA
                    </Badge>
                )}
            </AccordionTrigger>
            <AccordionContent className="px-0 pb-0 border-t border-slate-50">
                <div className="p-8">
                    <CardioRespiratorioRichProtocol />
                </div>

                <div className="bg-emerald-50/50 p-8 flex items-center gap-5 border-t border-emerald-100">
                    <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center border border-emerald-100 shadow-sm shrink-0">
                        <TrendingUp className="h-6 w-6 text-emerald-500 animate-pulse" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.1em] mb-1">Dica Clínica Axiom (Ref. ATS/ERS)</p>
                        <p className="text-[10px] font-bold text-emerald-900/60 leading-relaxed uppercase tracking-tighter">
                            A dessaturação considerável no TC6M ({">"} {'4%'}) é um forte marcador de desfechos negativos. Monitorar a queda da SpO2 é tão crucial quanto a distância percorrida.
                        </p>
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
