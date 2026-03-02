import React from "react";
import { useFormContext } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { FileText, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { AudioTextarea } from "@/features/forms/pbe/components/audio-textarea";

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
            className={cn("border rounded-[2rem] px-6 mb-4 transition-all duration-500 shadow-sm", openSection === 'exams' ? "bg-white border-slate-200 shadow-xl scale-[1.01]" : "bg-slate-50/50 border-transparent hover:bg-white")}
        >
            <AccordionTrigger className="hover:no-underline py-6 group">
                <div className="flex items-center gap-4 w-full text-left">
                    <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500", openSection === 'exams' ? "bg-cyan-600 text-white shadow-lg rotate-12" : "bg-white text-slate-400 shadow-sm group-hover:text-cyan-600")}>
                        <FileText className="h-6 w-6 transition-colors group-hover:animate-bounce" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className={cn("text-sm font-black uppercase tracking-widest", openSection === 'exams' ? "text-slate-900" : "text-slate-500")}>Exames Complementares</h3>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Laudos de Exames (RX, RNM, USG, etc)</p>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent className="p-4 space-y-4 border-t border-slate-50">
                <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                        <Mic className="w-4 h-4 text-cyan-600" />
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
