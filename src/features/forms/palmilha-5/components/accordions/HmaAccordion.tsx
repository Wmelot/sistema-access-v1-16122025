import React from "react";
import { useFormContext } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Ear, Database } from "lucide-react";
import { cn } from "@/lib/utils";

interface HmaAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    setFeegowImportOpen: (open: boolean) => void;
    isImported: boolean;
    sectionStyle: { border: string; iconColor: string };
}

export function HmaAccordion({ openSection, isSectionFilled, setFeegowImportOpen, isImported, sectionStyle }: HmaAccordionProps) {
    const form = useFormContext();

    // Safely parse EVA value whether it's an array or number
    const evaRaw = form.watch('hma.eva');
    const evaValue = Array.isArray(evaRaw) ? (evaRaw[0] || 0) : (Number(evaRaw) || 0);

    return (
        <AccordionItem
            value="hma"
            data-value="hma"
            className={cn(
                "border rounded-xl border-l-4 transition-all duration-300 shadow-sm",
                openSection === 'hma' ? 'col-span-1 md:col-span-2 bg-white' : 'col-span-1',
                isSectionFilled('hma') ? 'bg-slate-100 border-slate-200' : 'bg-card',
                sectionStyle.border
            )}
        >
            <AccordionTrigger className="px-4 font-bold text-slate-700 hover:no-underline flex gap-2 items-center text-left AccordionTrigger">
                <div className="flex items-center gap-2 flex-1 text-base">
                    <Ear className={cn("h-5 w-5", sectionStyle.iconColor)} />
                    <span>Anamnese & Queixa Principal</span>
                </div>
                {isSectionFilled('hma') && <Badge variant="outline" className="bg-slate-200 text-slate-600 border-none text-[9px] h-5 mr-4">PREENCHIDO</Badge>}
            </AccordionTrigger>
            <AccordionContent className="p-4 space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                        <FormLabel>Queixa Principal (QP)</FormLabel>
                        <Input {...form.register('hma.qp')} className="bg-white" placeholder="Motivo principal do comparecimento a clínica..." />
                    </div>
                    <Button
                        type="button"
                        onClick={() => setFeegowImportOpen(true)}
                        variant="outline"
                        className="mt-6 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 font-bold px-4 rounded-xl flex items-center gap-2 h-10 shadow-sm transition-all active:scale-95"
                    >
                        <Database className="w-4 h-4" />
                        Sincronizar Feegow
                    </Button>
                </div>
                <div className="space-y-2">
                    <FormLabel>História da Moléstia Atual (HMA)</FormLabel>
                    <Textarea
                        {...form.register('hma.history')}
                        placeholder="Registre o histórico completo dos sintomas e mecanismos de lesão do paciente... (Dica: Use a Inteligência Artificial do Axiom abaixo para transcrever isso!)"
                        className="bg-white min-h-[120px]"
                    />
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border">
                    <div className="flex justify-between mb-4">
                        <FormLabel>Intensidade da Dor (EVA)</FormLabel>
                        <span className={cn(
                            "text-2xl font-bold transition-colors",
                            evaValue >= 8 ? "text-red-500" :
                                evaValue >= 4 ? "text-orange-500" :
                                    "text-green-500"
                        )}>{evaValue}/10</span>
                    </div>
                    <Slider max={10} step={1} value={[evaValue]} onValueChange={(v: number[]) => form.setValue('hma.eva', v)} className={cn(
                        "[&_[role=slider]]:border-2 transition-colors duration-300",
                        evaValue >= 8 ? "[&_[role=slider]]:border-red-500 [&_.bg-primary]:bg-red-500" :
                            evaValue >= 4 ? "[&_[role=slider]]:border-orange-500 [&_.bg-primary]:bg-orange-500" :
                                "[&_[role=slider]]:border-green-500 [&_.bg-primary]:bg-green-500"
                    )} />
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
