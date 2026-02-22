import React from "react";
import { useFormContext } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BodyPainMap } from "@/features/pbe/components/body-pain-map";

interface PainMapAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string; iconColor: string };
    painFields: any[]; // Or a specific type if you have one
}

export function PainMapAccordion({ openSection, isSectionFilled, sectionStyle, painFields }: PainMapAccordionProps) {
    const form = useFormContext();

    return (
        <AccordionItem
            value="map"
            data-value="map"
            className={cn(
                "border rounded-xl border-l-4 transition-all duration-300 shadow-sm",
                openSection === 'map' ? 'col-span-1 md:col-span-2 bg-white ring-2 ring-red-50' : 'col-span-1 bg-white/50 border-slate-200',
                isSectionFilled('map') ? 'bg-slate-50/80 border-slate-200' : 'bg-card',
                sectionStyle.border
            )}
        >
            <AccordionTrigger className="px-5 py-4 hover:no-underline flex gap-2 items-center text-left group">
                <div className="flex items-center gap-3 flex-1 text-base">
                    <Target className={cn("h-5 w-5 transition-colors", sectionStyle.iconColor)} />
                    <span className={cn("font-bold tracking-tight text-slate-700 group-hover:text-red-600 transition-colors")}>Mapa de Dor & Sintomas</span>
                </div>
                {isSectionFilled('map') && <Badge variant="outline" className="bg-red-50 text-red-600 border-none text-[10px] h-5 mr-4 font-black tracking-widest uppercase">PREENCHIDO</Badge>}
            </AccordionTrigger>
            <AccordionContent className="p-0 border-t border-slate-50">
                <div className="bg-slate-50/50 p-6 rounded-b-xl">
                    <BodyPainMap
                        painPoints={form.watch('painZones') || {}}
                        onChange={(val: any) => form.setValue('painZones', val)}
                        customPoints={form.watch('painPoints') || []}
                        onCustomPointsChange={(val: any) => form.setValue('painPoints', val)}
                    />
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
