import React from "react";
import { useFormContext } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { ArrowBigDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label as FormLabel } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { checkStatus } from "@/utils/clinical-references";

export const ReferenceStatus = ({ value, type }: { value: any, type: string }) => {
    const v = Number(value);
    const isEmpty = value === "" || value === undefined || value === null;
    if (isEmpty) return <div className="text-[10px] font-bold px-2 py-0.5 rounded border mt-1 w-full text-center uppercase bg-slate-100 text-slate-400 border-slate-200">Sem Dados</div>;

    const status = checkStatus(type as any, v);

    if (!status) return <div className="text-[10px] font-bold px-2 py-0.5 rounded border mt-1 w-full text-center uppercase bg-slate-100 text-slate-400 border-slate-200">-</div>;

    return <div className={cn("text-[10px] font-bold px-2 py-0.5 rounded border mt-1 w-full text-center uppercase transition-all duration-300", status.color)}>{status.label}</div>;
};

interface VentralTestsAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string; iconColor: string };
}

export function VentralTestsAccordion({ openSection, isSectionFilled, sectionStyle }: VentralTestsAccordionProps) {
    const form = useFormContext();

    return (
        <AccordionItem
            value="ventral"
            data-value="ventral"
            className={cn(
                "border rounded-xl border-l-4 transition-all duration-300 shadow-sm",
                openSection === 'ventral' ? 'col-span-1 md:col-span-2 bg-white ring-2 ring-emerald-50' : 'col-span-1 bg-white/50 border-slate-200',
                isSectionFilled('ventral') ? 'bg-slate-50/80 border-slate-200' : 'bg-card',
                sectionStyle.border
            )}
        >
            <AccordionTrigger className="px-5 py-4 font-bold text-slate-700 hover:no-underline flex gap-2 items-center text-left group">
                <div className="flex items-center gap-3 flex-1 text-base">
                    <ArrowBigDown className={cn("h-5 w-5 transition-colors group-hover:animate-bounce", sectionStyle.iconColor)} />
                    <span className="font-bold tracking-tight text-slate-700 group-hover:text-emerald-600 transition-colors">Testes Funcionais (Decúbito Ventral)</span>
                </div>
            </AccordionTrigger>
            <AccordionContent className="p-4 space-y-6 border-t border-slate-50">
                {/* Tabela de Medidas de Torção */}
                <div className="overflow-hidden border border-slate-200 rounded-xl shadow-sm bg-white">
                    <table className="w-full text-sm text-center border-collapse">
                        <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-500">
                            <tr>
                                <th className="p-3 border-b border-r border-slate-200">Lado</th>
                                <th className="p-3 border-b border-r border-slate-200">Retropé (º)</th>
                                <th className="p-3 border-b border-r border-slate-200">Antepé (º)</th>
                                <th className="p-3 border-b border-slate-200">APA (º)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {['left', 'right'].map((side) => (
                                <tr key={side} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                                    <td className="p-3 font-bold text-slate-700 bg-slate-50/30 border-r border-slate-200">{side === 'left' ? 'Esquerdo' : 'Direito'}</td>
                                    <td className="p-2 border-r border-slate-200"><Input className="h-9 w-20 mx-auto text-center font-bold bg-white border-slate-200" type="number" {...form.register(`tests.ventral.measures.${side}.retro` as any, { valueAsNumber: true })} /></td>
                                    <td className="p-2 border-r border-slate-200"><Input className="h-9 w-20 mx-auto text-center font-bold bg-white border-slate-200" type="number" {...form.register(`tests.ventral.measures.${side}.ante` as any, { valueAsNumber: true })} /></td>
                                    <td className="p-2"><Input className="h-9 w-20 mx-auto text-center font-bold bg-white border-slate-200" type="number" {...form.register(`tests.ventral.measures.${side}.apa` as any, { valueAsNumber: true })} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    {/* Rigidez Rotadores Laterais - Ref PDF: 40-42º Normal */}
                    <div className="space-y-3 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                        <FormLabel className="text-xs font-black uppercase text-blue-800">Rigidez Rotadores Laterais (º)</FormLabel>
                        <div className="grid grid-cols-2 gap-3">
                            {['left', 'right'].map((side) => (
                                <div key={side} className="space-y-1">
                                    <Input placeholder={side === 'left' ? "Esquerdo" : "Direito"} type="number" {...form.register(`tests.ventral.rotation.${side}` as any, { valueAsNumber: true })} className="h-10 text-center font-bold" />
                                    <ReferenceStatus type="hip_rotation_stiffness" value={form.watch(`tests.ventral.rotation.${side}`)} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Teste de Craig - Anteversão Femoral */}
                    <div className="space-y-3 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                        <FormLabel className="text-xs font-black uppercase text-slate-600">Teste de Craig (º)</FormLabel>
                        <div className="grid grid-cols-2 gap-3">
                            {['left', 'right'].map((side) => (
                                <div key={side} className="space-y-1">
                                    <Input placeholder={side === 'left' ? "Esquerdo" : "Direito"} type="number" {...form.register(`tests.ventral.craig.${side}` as any, { valueAsNumber: true })} className="h-10 text-center font-bold" />
                                    <ReferenceStatus type="craig" value={form.watch(`tests.ventral.craig.${side}`)} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
