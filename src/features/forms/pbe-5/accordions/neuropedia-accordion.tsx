"use client";

import React from "react";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Baby } from "lucide-react";
import { cn } from "@/lib/utils";
import { NeuropediaRichProtocol } from "./protocols/NeuropediaRichProtocol";

interface NeuropediaAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string; iconColor: string; bg: string };
    setIsAssessmentModalOpen?: (isOpen: boolean) => void;
}

export function NeuropediaAccordion({ openSection, isSectionFilled, sectionStyle, setIsAssessmentModalOpen }: NeuropediaAccordionProps) {
    const isFilled = isSectionFilled('neuropedia');

    return (
        <AccordionItem
            value="neuropedia"
            className={cn(
                "border rounded-[2rem] border-l-4 transition-all duration-300 shadow-sm overflow-hidden",
                openSection === 'neuropedia' ? 'bg-white ring-2 ring-pink-50' : 'bg-white/50',
                isFilled ? 'border-slate-200' : 'border-slate-100',
                sectionStyle.border
            )}
        >
            <AccordionTrigger className="px-8 py-6 hover:no-underline flex gap-2 items-center text-left group">
                <div className="flex items-center gap-4 flex-1">
                    <div className={cn("p-2 rounded-xl transition-colors", openSection === 'neuropedia' ? "bg-pink-500 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-pink-50 group-hover:text-pink-500")}>
                        <Baby className="h-5 w-5" />
                    </div>
                    <div>
                        <span className={cn("font-black text-lg tracking-tight", openSection === 'neuropedia' ? "text-slate-900" : "text-slate-600")}>Neuropediatria Sênior</span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Bíblia CanChild (F-Words), GMFM, Tônus e Desenvolvimento</p>
                    </div>
                </div>
                {isFilled && (
                    <Badge variant="outline" className="bg-pink-100 text-pink-700 border-none text-[10px] h-6 px-3 rounded-full font-black uppercase">
                        AVALIAÇÃO ATIVA
                    </Badge>
                )}
            </AccordionTrigger>
            <AccordionContent className="px-0 pb-0 border-t border-slate-50">
                <div className="p-8">
                    <NeuropediaRichProtocol setIsAssessmentModalOpen={setIsAssessmentModalOpen} />
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
