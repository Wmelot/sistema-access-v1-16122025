import React from "react";
import { useFormContext } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import { PasteUploadZone } from "@/components/ui/paste-upload-zone";
import { Badge } from "@/components/ui/badge";

interface BaropodometryAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string; iconColor: string };
}

export function BaropodometryAccordion({ openSection, isSectionFilled, sectionStyle }: BaropodometryAccordionProps) {
    const form = useFormContext();

    return (
        <AccordionItem
            value="baropo"
            data-value="baropo"
            className={cn(
                "border rounded-xl border-l-4 transition-all duration-300 shadow-sm",
                openSection === 'baropo' ? 'col-span-1 md:col-span-2 bg-white ring-2 ring-rose-50' : 'col-span-1 bg-white/50 border-slate-200',
                isSectionFilled('baropo') ? 'bg-slate-50/80 border-slate-200' : 'bg-card',
                sectionStyle.border
            )}
        >
            <AccordionTrigger className="px-5 py-4 font-bold text-slate-700 hover:no-underline flex gap-2 items-center text-left group">
                <div className="flex items-center gap-3 flex-1 text-base">
                    <Gauge className={cn("h-5 w-5 transition-colors group-hover:animate-bounce", sectionStyle.iconColor)} />
                    <span className="font-bold tracking-tight text-slate-700 group-hover:text-rose-600 transition-colors">Baropodometria</span>
                </div>
                <div className="flex items-center gap-2 mr-4">
                    {isSectionFilled('baropo') && <Badge variant="outline" className="bg-rose-50 text-rose-600 border-none text-[10px] h-5 font-black tracking-widest uppercase">PREENCHIDO</Badge>}
                </div>
            </AccordionTrigger>
            <AccordionContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">Baropodometria 2D</span>
                        <PasteUploadZone
                            label="Imagem 2D"
                            value={form.watch("tests.baropo_2d")}
                            onChange={(v) => form.setValue("tests.baropo_2d", v)}
                        />
                    </div>
                    <div className="space-y-2">
                        <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">Baropodometria 3D</span>
                        <PasteUploadZone
                            label="Imagem 3D"
                            value={form.watch("tests.baropo_3d")}
                            onChange={(v) => form.setValue("tests.baropo_3d", v)}
                        />
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
