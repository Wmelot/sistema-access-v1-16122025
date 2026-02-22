import React from "react";
import { useFormContext } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Bot, Sparkles, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { AudioTextarea } from "@/features/pbe/components/audio-textarea"; // Assuming it's exported here

interface AiAssistantAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string; iconColor: string };
    isImported: boolean;
}

export function AiAssistantAccordion({ openSection, isSectionFilled, sectionStyle, isImported }: AiAssistantAccordionProps) {
    const form = useFormContext();
    const hmaHistory = form.watch('hma.history');

    return (
        <AccordionItem
            value="ai-assistant"
            data-value="ai-assistant"
            className={cn(
                "border rounded-xl border-l-4 transition-all duration-300 shadow-sm",
                openSection === 'ai-assistant' ? 'col-span-1 md:col-span-2 bg-gradient-to-r from-indigo-50/50 to-purple-50/50' : 'col-span-1 border-indigo-200',
                isSectionFilled('ai-assistant') ? 'bg-slate-100 border-slate-200' : 'bg-card',
                sectionStyle.border
            )}
        >
            <AccordionTrigger className="px-4 font-bold text-slate-700 hover:no-underline flex gap-2 items-center text-left AccordionTrigger">
                <div className="flex items-center gap-2 flex-1 text-base">
                    <Bot className={cn("h-5 w-5", sectionStyle.iconColor)} />
                    <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Assistente IA & Transcrição PBE</span>
                </div>
                {hmaHistory?.length > 10 && <span className="text-[10px] font-bold text-indigo-600 uppercase mr-4 bg-indigo-100 px-2 py-0.5 rounded-full">ATIVO ✨</span>}
            </AccordionTrigger>
            <AccordionContent className="p-4 pt-2">
                <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-sm space-y-4">
                    <div className="flex items-start gap-4 mb-2">
                        <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                            <Mic className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-indigo-900 uppercase">Grave o Relato do Paciente</h3>
                            <p className="text-xs text-indigo-700 mt-1">
                                O Axiom vai transcrever organizar em <b>QP, HMA, Red Flags e Sinais PBE</b> usando o raciocínio de um Fisioterapeuta Sênior.
                                <br /> O texto gerado irá automaticamente para a seção "História da Moléstia Atual (HMA)" acima.
                            </p>
                        </div>
                    </div>

                    <AudioTextarea
                        value={form.watch('hma.history')} // Mapeando para o mesmo campo de HMA para mostrar como integra
                        onChange={(e: any) => form.setValue('hma.history', e.target.value)}
                        onTranscription={(text: string) => form.setValue('hma.history', text)}
                        placeholder="Clique no microfone roxo abaixo para começar a falar, ou utilize a varinha mágica para transformar anotações soltas."
                        hideAI={isImported}
                        className="border-indigo-200 focus-visible:ring-indigo-500 min-h-[160px]"
                    />
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
