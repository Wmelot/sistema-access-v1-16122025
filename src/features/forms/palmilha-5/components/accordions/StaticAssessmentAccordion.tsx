import React, { useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Camera, Ruler } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label as FormLabel } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { checkNavicularStatus } from "@/utils/clinical-references";
import { calculateFpiScore } from "@/utils/pbe-calculations";

interface StaticAssessmentAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string; iconColor: string };
    fpiSectionStyle: { border: string; iconColor: string };
}

export function StaticAssessmentAccordion({ openSection, isSectionFilled, sectionStyle, fpiSectionStyle }: StaticAssessmentAccordionProps) {
    const form = useFormContext();

    const fpiLeftVals = form.watch("postural.fpi_left");
    const fpiRightVals = form.watch("postural.fpi_right");

    const l = calculateFpiScore(fpiLeftVals);
    const r = calculateFpiScore(fpiRightVals);

    const fpiData = {
        left: { s: l.score, l: l.status, c: l.color, desc: l.description },
        right: { s: r.score, l: r.status, c: r.color, desc: r.description }
    };

    return (
        <>
            <AccordionItem
                value="static"
                data-value="static"
                className={cn(
                    "border rounded-xl border-l-4 transition-all duration-300 shadow-sm",
                    openSection === 'static' ? 'col-span-1 md:col-span-2 bg-white ring-2 ring-purple-50' : 'col-span-1 bg-white/50 border-slate-200',
                    isSectionFilled('static') ? 'bg-slate-50/80 border-slate-200' : 'bg-card',
                    sectionStyle.border
                )}
            >
                <AccordionTrigger className="px-5 py-4 font-bold text-slate-700 hover:no-underline flex gap-2 items-center text-left group">
                    <div className="flex items-center gap-3 flex-1 text-base">
                        <Camera className={cn("h-5 w-5 transition-colors group-hover:animate-bounce", sectionStyle.iconColor)} />
                        <span className="font-bold tracking-tight text-slate-700 group-hover:text-purple-600 transition-colors">Avaliação Estática</span>
                    </div>
                    <div className="flex items-center gap-2 mr-4">
                        {isSectionFilled('static') && <Badge variant="outline" className="bg-purple-50 text-purple-600 border-none text-[10px] h-5 font-black tracking-widest uppercase">PREENCHIDO</Badge>}
                    </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 space-y-6 border-t border-slate-50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <FormLabel className="text-[10px] uppercase font-bold text-slate-500">Teste do Catálogo</FormLabel>
                            <div className="flex gap-2">
                                <Input placeholder="E (mm)" type="number" {...form.register("postural.teste_catalogo.left")} className="h-10 text-center font-bold" />
                                <Input placeholder="D (mm)" type="number" {...form.register("postural.teste_catalogo.right")} className="h-10 text-center font-bold" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <FormLabel className="text-[10px] uppercase font-bold text-slate-500">Naviculômetro (mm)</FormLabel>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Input placeholder="E" type="number" {...form.register("postural.navicular.left")} className="h-10 text-center font-bold" />
                                    {(() => {
                                        const status = checkNavicularStatus(Number(form.watch("postural.navicular.left")), Number(form.watch("postural.shoeSize"))) || { label: "Aguardando...", color: "bg-slate-100 text-slate-400" };
                                        return (
                                            <Badge className={cn("w-full justify-center text-[9px] mt-1 h-5", status.color)}>
                                                {status.label}
                                            </Badge>
                                        );
                                    })()}
                                </div>
                                <div>
                                    <Input placeholder="D" type="number" {...form.register("postural.navicular.right")} className="h-10 text-center font-bold" />
                                    {(() => {
                                        const status = checkNavicularStatus(Number(form.watch("postural.navicular.right")), Number(form.watch("postural.shoeSize"))) || { label: "Aguardando...", color: "bg-slate-100 text-slate-400" };
                                        return (
                                            <Badge className={cn("w-full justify-center text-[9px] mt-1 h-5", status.color)}>
                                                {status.label}
                                            </Badge>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <FormLabel className="text-[10px] uppercase font-bold text-slate-500">Nº Calçado</FormLabel>
                            <Input
                                type="number"
                                placeholder="Ex: 40"
                                {...form.register("postural.shoeSize")}
                                className="h-10 text-center font-bold"
                            />
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>

            <AccordionItem
                value="fpi_detail"
                data-value="fpi_detail"
                className={cn(
                    "border rounded-xl border-l-4 transition-all duration-300 shadow-sm",
                    openSection === 'fpi_detail' ? 'col-span-1 md:col-span-2 bg-white ring-2 ring-indigo-50' : 'col-span-1 bg-white/50 border-slate-200',
                    isSectionFilled('fpi_detail') ? 'bg-slate-50/80 border-slate-200' : 'bg-card',
                    fpiSectionStyle.border
                )}
            >
                <AccordionTrigger className="px-5 py-4 font-bold text-slate-700 hover:no-underline flex gap-2 items-center text-left group">
                    <div className="flex items-center gap-3 flex-1 text-base">
                        <Ruler className={cn("h-5 w-5 transition-colors group-hover:animate-bounce", fpiSectionStyle.iconColor)} />
                        <span className="font-bold tracking-tight text-slate-700 group-hover:text-indigo-600 transition-colors">Foot Posture Index (FPI-6)</span>
                    </div>
                    <div className="flex items-center gap-2 mr-4">
                        {isSectionFilled('fpi_detail') && <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-none text-[10px] h-5 font-black tracking-widest uppercase">PREENCHIDO</Badge>}
                    </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 space-y-6 border-t border-slate-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* PÉ ESQUERDO */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                                <div className="w-2 h-2 rounded-full bg-blue-600" />
                                <h4 className="text-xs font-black uppercase text-slate-500">Lado Esquerdo</h4>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                {[
                                    { id: "talus", label: "Cabeça do Tálus", full: "Palpação da Cabeça do Tálus" },
                                    { id: "curves", label: "Maléolos", full: "Curvaturas Supra/Infra Maleolares" },
                                    { id: "calc", label: "Calcâneo", full: "Inversão/Eversão do Calcâneo" },
                                    { id: "tnj", label: "Navicular", full: "Articulação Talo-Navicular" },
                                    { id: "arch", label: "Arco", full: "Arco Medial" },
                                    { id: "abd", label: "Dedos", full: "Abdução/Adução do Antepé" }
                                ].map((item) => (
                                    <div key={item.id} className="flex items-center justify-between gap-4 p-2 bg-slate-50/50 rounded-xl">
                                        <label className="text-[10px] font-bold text-slate-600 uppercase leading-tight flex-1">
                                            <span className="md:hidden">{item.label}</span>
                                            <span className="hidden md:inline">{item.full}</span>
                                        </label>
                                        <Input
                                            type="number"
                                            {...form.register(`postural.fpi_left.${item.id}` as any)}
                                            className="w-16 h-8 text-center font-bold bg-white"
                                            placeholder="0"
                                            min={-2}
                                            max={2}
                                            onBlur={(e) => {
                                                let val = parseInt(e.target.value);
                                                if (isNaN(val)) val = 0;
                                                if (val > 2) val = 2;
                                                if (val < -2) val = -2;
                                                form.setValue(`postural.fpi_left.${item.id}`, val, { shouldValidate: true, shouldDirty: true });
                                                e.target.value = val.toString();
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                            <Badge className={cn("w-full h-10 justify-center text-xs font-black shadow-inner", fpiData.left.c)}>
                                <span className="md:inline hidden mr-1">TOTAL E:</span> {fpiData.left.s} ({fpiData.left.l})
                            </Badge>
                        </div>

                        {/* PÉ DIREITO */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                                <div className="w-2 h-2 rounded-full bg-green-600" />
                                <h4 className="text-xs font-black uppercase text-slate-500">Lado Direito</h4>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                {[
                                    { id: "talus", label: "Cabeça do Tálus", full: "Palpação da Cabeça do Tálus" },
                                    { id: "curves", label: "Maléolos", full: "Curvaturas Supra/Infra Maleolares" },
                                    { id: "calc", label: "Calcâneo", full: "Inversão/Eversão do Calcâneo" },
                                    { id: "tnj", label: "Navicular", full: "Articulação Talo-Navicular" },
                                    { id: "arch", label: "Arco", full: "Arco Medial" },
                                    { id: "abd", label: "Dedos", full: "Abdução/Adução do Antepé" }
                                ].map((item) => (
                                    <div key={item.id} className="flex items-center justify-between gap-4 p-2 bg-slate-50/50 rounded-xl">
                                        <label className="text-[10px] font-bold text-slate-600 uppercase leading-tight flex-1">
                                            <span className="md:hidden">{item.label}</span>
                                            <span className="hidden md:inline">{item.full}</span>
                                        </label>
                                        <Input
                                            type="number"
                                            {...form.register(`postural.fpi_right.${item.id}` as any)}
                                            className="w-16 h-8 text-center font-bold bg-white"
                                            placeholder="0"
                                            min={-2}
                                            max={2}
                                            onBlur={(e) => {
                                                let val = parseInt(e.target.value);
                                                if (isNaN(val)) val = 0;
                                                if (val > 2) val = 2;
                                                if (val < -2) val = -2;
                                                form.setValue(`postural.fpi_right.${item.id}`, val, { shouldValidate: true, shouldDirty: true });
                                                e.target.value = val.toString();
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                            <Badge className={cn("w-full h-10 justify-center text-xs font-black shadow-inner", fpiData.right.c)}>
                                <span className="md:inline hidden mr-1">TOTAL D:</span> {fpiData.right.s} ({fpiData.right.l})
                            </Badge>
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </>
    );
}
