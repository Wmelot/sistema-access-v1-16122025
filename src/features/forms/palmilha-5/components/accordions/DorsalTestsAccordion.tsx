import React from "react";
import { useFormContext } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { ArrowBigUp, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label as FormLabel } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
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

const MobilityCapsule = ({ value }: { value: number }) => {
    if (value === undefined || value === null || isNaN(value)) {
        return <div className="text-[10px] font-bold px-2 py-0.5 rounded border mt-1 w-full text-center uppercase bg-slate-100 text-slate-400 border-slate-200">Sem Dados</div>;
    }

    let text = "Normal";
    let colorClass = "bg-emerald-100 text-emerald-700 border-emerald-200";

    if (value === 0) {
        text = "Normal";
        colorClass = "bg-emerald-100 text-emerald-700 border-emerald-200";
    } else if (value > 0) {
        if (value === 1) text = "Leve/ Aumentada";
        if (value === 2) text = "Aumentada";
        if (value === 3) text = "Muito Aumentada";
        // Gradiente para aumentados
        if (value === 1) colorClass = "bg-green-100 text-green-700 border-green-200";
        if (value === 2) colorClass = "bg-blue-100 text-blue-700 border-blue-200";
        if (value === 3) colorClass = "bg-indigo-100 text-indigo-700 border-indigo-200";
    } else if (value < 0) {
        if (value === -1) text = "Leve/ Reduzida";
        if (value === -2) text = "Reduzida";
        if (value === -3) text = "Muito Reduzida";
        // Gradiente para reduzidos
        if (value === -1) colorClass = "bg-amber-100 text-amber-700 border-amber-200";
        if (value === -2) colorClass = "bg-orange-100 text-orange-700 border-orange-200";
        if (value === -3) colorClass = "bg-red-100 text-red-700 border-red-200";
    }

    return <div className={cn("text-[10px] font-bold px-2 py-1 rounded border mt-2 w-full text-center uppercase transition-all duration-300", colorClass)}>{value > 0 ? `+${value}` : value} : {text}</div>;
}

interface DorsalTestsAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string; iconColor: string };
}

export function DorsalTestsAccordion({ openSection, isSectionFilled, sectionStyle }: DorsalTestsAccordionProps) {
    const form = useFormContext();

    return (
        <AccordionItem
            value="dorsal"
            data-value="dorsal"
            className={cn(
                "border rounded-xl border-l-4 transition-all duration-300 shadow-sm",
                openSection === 'dorsal' ? 'col-span-1 md:col-span-2 bg-white ring-2 ring-emerald-50' : 'col-span-1 bg-white/50 border-slate-200',
                isSectionFilled('dorsal') ? 'bg-slate-50/80 border-slate-200' : 'bg-card',
                sectionStyle.border
            )}
        >
            <AccordionTrigger className="px-5 py-4 font-bold text-slate-700 hover:no-underline flex gap-2 items-center text-left group">
                <div className="flex items-center gap-3 flex-1 text-base">
                    <ArrowBigUp className={cn("h-5 w-5 transition-colors group-hover:animate-bounce", sectionStyle.iconColor)} />
                    <span className="font-bold tracking-tight text-slate-700 group-hover:text-emerald-600 transition-colors">Testes Funcionais (Decúbito Dorsal)</span>
                </div>
                <div className="flex items-center gap-2 mr-4">
                    {isSectionFilled('dorsal') && <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-none text-[10px] h-5 font-black tracking-widest uppercase">PREENCHIDO</Badge>}
                </div>
            </AccordionTrigger>
            <AccordionContent className="p-4 space-y-8 border-t border-slate-50">

                {/* Avaliações de Mobilidade / Rigidez (NOVO) */}
                <div className="space-y-4">
                    <h4 className="font-black text-xs uppercase tracking-widest text-slate-700">Mobilidade Articular e Rigidez</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* 1º Raio */}
                        <div className="space-y-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                            <FormLabel className="text-[10px] font-black uppercase text-slate-500 block text-center">Mobilidade do 1º Raio</FormLabel>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-[10px] font-bold text-blue-600 uppercase mb-2 block">Esquerdo</span>
                                    <Slider min={-3} max={3} step={1} value={[Number(form.watch("tests.dorsal.first_ray.left")) || 0]} onValueChange={([v]) => form.setValue("tests.dorsal.first_ray.left", v)} />
                                    <MobilityCapsule value={Number(form.watch("tests.dorsal.first_ray.left")) || 0} />
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-green-600 uppercase mb-2 block">Direito</span>
                                    <Slider min={-3} max={3} step={1} value={[Number(form.watch("tests.dorsal.first_ray.right")) || 0]} onValueChange={([v]) => form.setValue("tests.dorsal.first_ray.right", v)} />
                                    <MobilityCapsule value={Number(form.watch("tests.dorsal.first_ray.right")) || 0} />
                                </div>
                            </div>
                        </div>

                        {/* Mediopé */}
                        <div className="space-y-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                            <FormLabel className="text-[10px] font-black uppercase text-slate-500 block text-center">Rigidez do Mediopé</FormLabel>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-[10px] font-bold text-blue-600 uppercase mb-2 block">Esquerdo</span>
                                    <Slider min={-3} max={3} step={1} value={[Number(form.watch("tests.dorsal.midfoot.left")) || 0]} onValueChange={([v]) => form.setValue("tests.dorsal.midfoot.left", v)} />
                                    <MobilityCapsule value={Number(form.watch("tests.dorsal.midfoot.left")) || 0} />
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-green-600 uppercase mb-2 block">Direito</span>
                                    <Slider min={-3} max={3} step={1} value={[Number(form.watch("tests.dorsal.midfoot.right")) || 0]} onValueChange={([v]) => form.setValue("tests.dorsal.midfoot.right", v)} />
                                    <MobilityCapsule value={Number(form.watch("tests.dorsal.midfoot.right")) || 0} />
                                </div>
                            </div>
                        </div>

                        {/* Inversão */}
                        <div className="space-y-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                            <FormLabel className="text-[10px] font-black uppercase text-slate-500 block text-center">Inversão</FormLabel>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-[10px] font-bold text-blue-600 uppercase mb-2 block">Esquerdo</span>
                                    <Slider min={-3} max={3} step={1} value={[Number(form.watch("tests.dorsal.inversion.left")) || 0]} onValueChange={([v]) => form.setValue("tests.dorsal.inversion.left", v)} />
                                    <MobilityCapsule value={Number(form.watch("tests.dorsal.inversion.left")) || 0} />
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-green-600 uppercase mb-2 block">Direito</span>
                                    <Slider min={-3} max={3} step={1} value={[Number(form.watch("tests.dorsal.inversion.right")) || 0]} onValueChange={([v]) => form.setValue("tests.dorsal.inversion.right", v)} />
                                    <MobilityCapsule value={Number(form.watch("tests.dorsal.inversion.right")) || 0} />
                                </div>
                            </div>
                        </div>

                        {/* Eversão */}
                        <div className="space-y-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                            <FormLabel className="text-[10px] font-black uppercase text-slate-500 block text-center">Eversão</FormLabel>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-[10px] font-bold text-blue-600 uppercase mb-2 block">Esquerdo</span>
                                    <Slider min={-3} max={3} step={1} value={[Number(form.watch("tests.dorsal.eversion.left")) || 0]} onValueChange={([v]) => form.setValue("tests.dorsal.eversion.left", v)} />
                                    <MobilityCapsule value={Number(form.watch("tests.dorsal.eversion.left")) || 0} />
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-green-600 uppercase mb-2 block">Direito</span>
                                    <Slider min={-3} max={3} step={1} value={[Number(form.watch("tests.dorsal.eversion.right")) || 0]} onValueChange={([v]) => form.setValue("tests.dorsal.eversion.right", v)} />
                                    <MobilityCapsule value={Number(form.watch("tests.dorsal.eversion.right")) || 0} />
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
                    {/* Teste de Thomas - Ref PDF: 10º */}
                    <div className="space-y-3 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                        <FormLabel className="text-xs font-black uppercase text-blue-800">Teste de Thomas - Psoas (º)</FormLabel>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Input placeholder="Esquerdo" type="number" {...form.register("tests.thomas.left", { valueAsNumber: true })} className="h-10 font-bold text-center" />
                                <ReferenceStatus type="thomas" value={form.watch("tests.thomas.left")} />
                            </div>
                            <div className="space-y-1">
                                <Input placeholder="Direito" type="number" {...form.register("tests.thomas.right", { valueAsNumber: true })} className="h-10 font-bold text-center" />
                                <ReferenceStatus type="thomas" value={form.watch("tests.thomas.right")} />
                            </div>
                        </div>
                    </div>

                    {/* Isquiosurais - Ref PDF: 132º */}
                    <div className="space-y-3 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                        <FormLabel className="text-xs font-black uppercase text-blue-800">Flexibilidade de Isquiosurais (º)</FormLabel>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Input placeholder="Esquerdo" type="number" {...form.register("tests.slr.left", { valueAsNumber: true })} className="h-10 font-bold text-center" />
                                <ReferenceStatus type="slr" value={form.watch("tests.slr.left")} />
                            </div>
                            <div className="space-y-1">
                                <Input placeholder="Direito" type="number" {...form.register("tests.slr.right", { valueAsNumber: true })} className="h-10 font-bold text-center" />
                                <ReferenceStatus type="slr" value={form.watch("tests.slr.right")} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Força Muscular com Sliders Dinâmicos */}
                <div className="border-t border-slate-100 pt-6 space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <h4 className="font-black text-xs uppercase tracking-widest text-slate-700">Força Muscular (0-10)</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Glúteo Médio */}
                        <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-slate-500 uppercase">Glúteo Médio</span>
                                <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Estabilidade</Badge>
                            </div>
                            <div className="space-y-5">
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-black w-4 text-slate-400">E</span>
                                    <Slider max={10} step={0.5} className="flex-1" value={[form.watch("tests.glute_strength.med_left") || 0]} onValueChange={([v]) => form.setValue("tests.glute_strength.med_left", v)} />
                                    <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-lg">{form.watch("tests.glute_strength.med_left") || 0}</div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-black w-4 text-slate-400">D</span>
                                    <Slider max={10} step={0.5} className="flex-1" value={[form.watch("tests.glute_strength.med_right") || 0]} onValueChange={([v]) => form.setValue("tests.glute_strength.med_right", v)} />
                                    <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-lg">{form.watch("tests.glute_strength.med_right") || 0}</div>
                                </div>
                            </div>
                        </div>

                        {/* Glúteo Máximo */}
                        <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-slate-500 uppercase">Glúteo Máximo</span>
                                <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">Propulsão</Badge>
                            </div>
                            <div className="space-y-5">
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-black w-4 text-slate-400">E</span>
                                    <Slider max={10} step={0.5} className="flex-1" value={[form.watch("tests.glute_strength.max_left") || 0]} onValueChange={([v]) => form.setValue("tests.glute_strength.max_left", v)} />
                                    <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-lg">{form.watch("tests.glute_strength.max_left") || 0}</div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-black w-4 text-slate-400">D</span>
                                    <Slider max={10} step={0.5} className="flex-1" value={[form.watch("tests.glute_strength.max_right") || 0]} onValueChange={([v]) => form.setValue("tests.glute_strength.max_right", v)} />
                                    <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-lg">{form.watch("tests.glute_strength.max_right") || 0}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
