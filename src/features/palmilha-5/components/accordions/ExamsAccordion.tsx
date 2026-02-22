import React from "react";
import { useFormContext } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { FileText, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { AudioTextarea } from "@/features/pbe/components/audio-textarea";

interface ExamsAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string; iconColor: string };
    isImported?: boolean;
}

export function ExamsAccordion({ openSection, isSectionFilled, sectionStyle, isImported }: ExamsAccordionProps) {
    const form = useFormContext();

    return (
        <AccordionItem
            value="exams"
            data-value="exams"
            className={cn(
                "border rounded-xl border-l-4 transition-all duration-300 shadow-sm",
                openSection === 'exams' ? 'col-span-1 md:col-span-2 bg-white ring-2 ring-slate-100' : 'col-span-1 bg-white/50 border-slate-200',
                isSectionFilled('exams') ? 'bg-slate-50/80 border-slate-200' : 'bg-card',
                sectionStyle.border
            )}
        >
            <AccordionTrigger className="px-5 py-4 font-bold text-slate-700 hover:no-underline flex gap-2 items-center text-left group">
                <div className="flex items-center gap-3 flex-1 text-base">
                    <FileText className={cn("h-5 w-5 transition-colors group-hover:animate-bounce", sectionStyle.iconColor)} />
                    <span className="font-bold tracking-tight text-slate-700 group-hover:text-slate-600 transition-colors">Exames Complementares</span>
                </div>
            </AccordionTrigger>
            <AccordionContent className="p-4 space-y-4 border-t border-slate-50">
                <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                        <Mic className="w-4 h-4 text-blue-600" />
                        <h4 className="font-black text-xs uppercase tracking-widest text-slate-700">Resultados e Laudos</h4>
                    </div>
                    <div className="bg-white rounded-lg p-2 shadow-sm border border-slate-200">
                        <AudioTextarea
                            value={form.watch("plan.exams")}
                            onChange={(e: any) => form.setValue("plan.exams", e.target.value)}
                            onTranscription={(text: string) => form.setValue("plan.exams", text)}
                            placeholder="Descreva os achados dos exames ou use o microfone para ditar..."
                            className="min-h-[120px] shadow-none border-none focus-visible:ring-0 text-sm resize-none"
                            hideAI={isImported}
                        />
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
