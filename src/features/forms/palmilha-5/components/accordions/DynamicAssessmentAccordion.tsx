import React, { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { TimerReset, Footprints, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label as FormLabel } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PasteUploadZone } from "@/components/ui/paste-upload-zone";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

const COLOR_LEFT_FOOT = "#2563eb";
const COLOR_RIGHT_FOOT = "#16a34a";
const COLOR_REF_LINE = "#94a3b8";

interface DynamicAssessmentAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string; iconColor: string };
}

export function DynamicAssessmentAccordion({ openSection, isSectionFilled, sectionStyle }: DynamicAssessmentAccordionProps) {
    const form = useFormContext();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    return (
        <AccordionItem
            value="dynamic"
            data-value="dynamic"
            className={cn(
                "border rounded-xl border-l-4 transition-all duration-300 shadow-sm",
                openSection === 'dynamic' ? 'col-span-1 md:col-span-2 bg-white ring-2 ring-violet-50' : 'col-span-1 bg-white/50 border-slate-200',
                isSectionFilled('dynamic') ? 'bg-slate-50/80 border-slate-200' : 'bg-card',
                sectionStyle.border
            )}
        >
            <AccordionTrigger className="px-5 py-4 font-bold text-slate-700 hover:no-underline flex gap-2 items-center text-left group">
                <div className="flex items-center gap-3 flex-1 text-base">
                    <TimerReset className={cn("h-5 w-5 transition-colors group-hover:animate-bounce", sectionStyle.iconColor)} />
                    <span className="font-bold tracking-tight text-slate-700 group-hover:text-violet-600 transition-colors">Avaliação Dinâmica</span>
                </div>
                <div className="flex items-center gap-2 mr-4">
                    {isSectionFilled('dynamic') && <Badge variant="outline" className="bg-violet-50 text-violet-600 border-none text-[10px] h-5 font-black tracking-widest uppercase">PREENCHIDO</Badge>}
                </div>
            </AccordionTrigger>
            <AccordionContent className="p-4 space-y-8 border-t border-slate-50">

                {/* DYNAMIC FOOT INDEX (DFI) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-slate-50 border border-slate-100 p-4 rounded-xl shadow-sm">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <FormLabel className="font-bold text-slate-700 text-sm">Dynamic Foot Index (DFI)</FormLabel>
                            <Badge variant="outline" className="text-[10px] font-bold text-slate-400 border-slate-200 uppercase tracking-widest bg-white">
                                -4 a +4
                            </Badge>
                        </div>

                        <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm bg-white">
                            <table className="w-full text-sm text-center">
                                <thead className="bg-slate-50 text-[10px] uppercase font-black tracking-widest text-slate-500 border-b border-slate-200">
                                    <tr>
                                        <th className="p-3 text-left">Fase da Marcha</th>
                                        <th className="p-3 bg-blue-50/50 text-blue-800">Esquerdo</th>
                                        <th className="p-3 bg-green-50/50 text-green-800">Direito</th>
                                    </tr>
                                </thead>
                                <tbody className="text-slate-700 font-semibold text-xs">
                                    {[
                                        { key: "RC", label: "Resposta à Carga" },
                                        { key: "AM", label: "Apoio Médio" },
                                        { key: "FI", label: "Fase de Impulsão" }
                                    ].map((f, i) => (
                                        <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                                            <td className="p-3 text-left">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800">{f.key}</span>
                                                    <span className="text-[10px] text-slate-400 font-medium">{f.label}</span>
                                                </div>
                                            </td>
                                            <td className="p-2 bg-blue-50/20">
                                                <Input
                                                    type="number"
                                                    className="h-10 w-20 mx-auto text-center font-bold text-blue-900 bg-white border-blue-200 focus-visible:ring-blue-500 shadow-sm"
                                                    min={-4}
                                                    max={4}
                                                    placeholder="0"
                                                    value={form.watch(`tests.dfi.${i}.left` as any) ?? ""}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === "" || val === "-") {
                                                            form.setValue(`tests.dfi.${i}.left` as any, val as any);
                                                            return;
                                                        }
                                                        const parsed = parseInt(val);
                                                        if (!isNaN(parsed)) form.setValue(`tests.dfi.${i}.left` as any, parsed);
                                                    }}
                                                    onBlur={(e) => {
                                                        let val = parseInt(e.target.value);
                                                        if (isNaN(val)) val = 0;
                                                        if (val > 4) val = 4;
                                                        if (val < -4) val = -4;
                                                        form.setValue(`tests.dfi.${i}.left` as any, val);
                                                    }}
                                                />
                                            </td>
                                            <td className="p-2 bg-green-50/20">
                                                <Input
                                                    type="number"
                                                    className="h-10 w-20 mx-auto text-center font-bold text-green-900 bg-white border-green-200 focus-visible:ring-green-500 shadow-sm"
                                                    min={-4}
                                                    max={4}
                                                    placeholder="0"
                                                    value={form.watch(`tests.dfi.${i}.right` as any) ?? ""}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === "" || val === "-") {
                                                            form.setValue(`tests.dfi.${i}.right` as any, val as any);
                                                            return;
                                                        }
                                                        const parsed = parseInt(val);
                                                        if (!isNaN(parsed)) form.setValue(`tests.dfi.${i}.right` as any, parsed);
                                                    }}
                                                    onBlur={(e) => {
                                                        let val = parseInt(e.target.value);
                                                        if (isNaN(val)) val = 0;
                                                        if (val > 4) val = 4;
                                                        if (val < -4) val = -4;
                                                        form.setValue(`tests.dfi.${i}.right` as any, val);
                                                    }}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="h-[250px] bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex flex-col relative w-full overflow-hidden">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 absolute top-4 left-4 z-10">Gráfico Cinemático</span>
                        <div className="flex-1 mt-6">
                            {isMounted && (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={[
                                            { name: 'Resp. Carga', e: Number(form.watch("tests.dfi.0.left")) || 0, d: Number(form.watch("tests.dfi.0.right")) || 0, ref: 1 },
                                            { name: 'Apoio Médio', e: Number(form.watch("tests.dfi.1.left")) || 0, d: Number(form.watch("tests.dfi.1.right")) || 0, ref: -2 },
                                            { name: 'Impulsão', e: Number(form.watch("tests.dfi.2.left")) || 0, d: Number(form.watch("tests.dfi.2.right")) || 0, ref: 2 }
                                        ]}
                                        margin={{ top: 20, right: 20, bottom: 5, left: 0 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                        <YAxis domain={[-4, 4]} ticks={[-4, -2, 0, 2, 4]} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                        <RechartsTooltip
                                            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                                            cursor={{ stroke: '#cbd5e1', strokeWidth: 2, strokeDasharray: '4 4' }}
                                        />
                                        <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} />
                                        <Line type="monotone" dataKey="e" stroke={COLOR_LEFT_FOOT} strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} name="Esquerdo" />
                                        <Line type="monotone" dataKey="d" stroke={COLOR_RIGHT_FOOT} strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} name="Direito" />
                                        <Line type="monotone" dataKey="ref" stroke={COLOR_REF_LINE} strokeDasharray="5 5" strokeWidth={2} dot={false} name="Referência Normal" />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>

                {/* AGACHAMENTO UNIPODAL */}
                <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-6 shadow-sm">
                    <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                        Agachamento Unipodal (Step Down)
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                        {/* Lado Esquerdo */}
                        <div className="space-y-5 md:pr-4 pt-4 md:pt-0">
                            <div className="flex items-center gap-2 mb-2">
                                <Badge className="bg-blue-600 hover:bg-blue-700 uppercase tracking-widest text-[10px] font-black h-6">Membro Esquerdo</Badge>
                            </div>

                            <div className="grid grid-cols-1 gap-4 text-xs font-semibold">
                                <div className="space-y-1.5 flex flex-col">
                                    <label className="text-slate-500 uppercase text-[10px] tracking-wider font-bold shrink-0">Queda Pélvica</label>
                                    <Select onValueChange={v => form.setValue("tests.single_squat.pelvic_drop_left", v)} value={form.watch("tests.single_squat.pelvic_drop_left") || "Normal"}>
                                        <SelectTrigger className="bg-slate-50 border-slate-200 h-9 font-bold text-slate-700"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                        <SelectContent position="popper" side="bottom" className="z-[110]">
                                            <SelectItem value="Normal"><span className="text-emerald-600 font-bold">Normal</span></SelectItem>
                                            <SelectItem value="Leve"><span className="text-emerald-500 font-medium">Leve</span></SelectItem>
                                            <SelectItem value="Moderado"><span className="text-amber-500 font-bold">Moderado</span></SelectItem>
                                            <SelectItem value="Acentuado"><span className="text-red-500 font-black">Acentuado</span></SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5 flex flex-col">
                                    <label className="text-slate-500 uppercase text-[10px] tracking-wider font-bold shrink-0">Valgo Dinâmico do Joelho</label>
                                    <Select onValueChange={v => form.setValue("tests.single_squat.valgus_left", v)} value={form.watch("tests.single_squat.valgus_left") || "Normal"}>
                                        <SelectTrigger className="bg-slate-50 border-slate-200 h-9 font-bold text-slate-700"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                        <SelectContent position="popper" side="bottom" className="z-[110]">
                                            <SelectItem value="Normal"><span className="text-emerald-600 font-bold">Normal</span></SelectItem>
                                            <SelectItem value="Leve"><span className="text-emerald-500 font-medium">Leve</span></SelectItem>
                                            <SelectItem value="Moderado"><span className="text-amber-500 font-bold">Moderado</span></SelectItem>
                                            <SelectItem value="Acentuado"><span className="text-red-500 font-black">Acentuado</span></SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5 flex flex-col">
                                    <label className="text-slate-500 uppercase text-[10px] tracking-wider font-bold shrink-0">Anteriorização Excessiva do Tronco</label>
                                    <Select onValueChange={v => form.setValue("tests.single_squat.trunk_left", v)} value={form.watch("tests.single_squat.trunk_left") || "Normal"}>
                                        <SelectTrigger className="bg-slate-50 border-slate-200 h-9 font-bold text-slate-700"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                        <SelectContent position="popper" side="bottom" className="z-[110]">
                                            <SelectItem value="Normal"><span className="text-emerald-600 font-bold">Normal</span></SelectItem>
                                            <SelectItem value="Leve"><span className="text-emerald-500 font-medium">Leve</span></SelectItem>
                                            <SelectItem value="Moderado"><span className="text-amber-500 font-bold">Moderado</span></SelectItem>
                                            <SelectItem value="Acentuado"><span className="text-red-500 font-black">Acentuado</span></SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="pt-2">
                                <label className="text-slate-400 font-bold text-[10px] tracking-wider uppercase mb-2 block text-center">Registro Fotográfico Frontal</label>
                                <PasteUploadZone
                                    value={form.watch("tests.single_squat.photo_left")}
                                    onChange={(v) => form.setValue("tests.single_squat.photo_left", v)}
                                    className="aspect-[3/4] w-48 object-cover mx-auto ring-4 ring-slate-50 rounded-xl"
                                />
                            </div>
                        </div>

                        {/* Lado Direito */}
                        <div className="space-y-5 md:pl-4 pt-4 md:pt-0">
                            <div className="flex items-center gap-2 mb-2">
                                <Badge className="bg-green-600 hover:bg-green-700 uppercase tracking-widest text-[10px] font-black h-6">Membro Direito</Badge>
                            </div>

                            <div className="grid grid-cols-1 gap-4 text-xs font-semibold">
                                <div className="space-y-1.5 flex flex-col">
                                    <label className="text-slate-500 uppercase text-[10px] tracking-wider font-bold shrink-0">Queda Pélvica</label>
                                    <Select onValueChange={v => form.setValue("tests.single_squat.pelvic_drop_right", v)} value={form.watch("tests.single_squat.pelvic_drop_right") || "Normal"}>
                                        <SelectTrigger className="bg-slate-50 border-slate-200 h-9 font-bold text-slate-700"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                        <SelectContent position="popper" side="bottom" className="z-[110]">
                                            <SelectItem value="Normal"><span className="text-emerald-600 font-bold">Normal</span></SelectItem>
                                            <SelectItem value="Leve"><span className="text-emerald-500 font-medium">Leve</span></SelectItem>
                                            <SelectItem value="Moderado"><span className="text-amber-500 font-bold">Moderado</span></SelectItem>
                                            <SelectItem value="Acentuado"><span className="text-red-500 font-black">Acentuado</span></SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5 flex flex-col">
                                    <label className="text-slate-500 uppercase text-[10px] tracking-wider font-bold shrink-0">Valgo Dinâmico do Joelho</label>
                                    <Select onValueChange={v => form.setValue("tests.single_squat.valgus_right", v)} value={form.watch("tests.single_squat.valgus_right") || "Normal"}>
                                        <SelectTrigger className="bg-slate-50 border-slate-200 h-9 font-bold text-slate-700"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                        <SelectContent position="popper" side="bottom" className="z-[110]">
                                            <SelectItem value="Normal"><span className="text-emerald-600 font-bold">Normal</span></SelectItem>
                                            <SelectItem value="Leve"><span className="text-emerald-500 font-medium">Leve</span></SelectItem>
                                            <SelectItem value="Moderado"><span className="text-amber-500 font-bold">Moderado</span></SelectItem>
                                            <SelectItem value="Acentuado"><span className="text-red-500 font-black">Acentuado</span></SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5 flex flex-col">
                                    <label className="text-slate-500 uppercase text-[10px] tracking-wider font-bold shrink-0">Anteriorização Excessiva do Tronco</label>
                                    <Select onValueChange={v => form.setValue("tests.single_squat.trunk_right", v)} value={form.watch("tests.single_squat.trunk_right") || "Normal"}>
                                        <SelectTrigger className="bg-slate-50 border-slate-200 h-9 font-bold text-slate-700"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                        <SelectContent position="popper" side="bottom" className="z-[110]">
                                            <SelectItem value="Normal"><span className="text-emerald-600 font-bold">Normal</span></SelectItem>
                                            <SelectItem value="Leve"><span className="text-emerald-500 font-medium">Leve</span></SelectItem>
                                            <SelectItem value="Moderado"><span className="text-amber-500 font-bold">Moderado</span></SelectItem>
                                            <SelectItem value="Acentuado"><span className="text-red-500 font-black">Acentuado</span></SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="pt-2">
                                <label className="text-slate-400 font-bold text-[10px] tracking-wider uppercase mb-2 block text-center">Registro Fotográfico Frontal</label>
                                <PasteUploadZone
                                    value={form.watch("tests.single_squat.photo_right")}
                                    onChange={(v) => form.setValue("tests.single_squat.photo_right", v)}
                                    className="aspect-[3/4] w-48 object-cover mx-auto ring-4 ring-slate-50 rounded-xl"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* FOTOS DE MARCHA */}
                <div className="p-5 bg-slate-50 border border-slate-100 rounded-xl shadow-sm">
                    <h4 className="font-bold text-slate-700 text-sm mb-4">Mecânica de Corrida / Marcha 2D (Fases)</h4>

                    <div className="space-y-8">
                        {/* Esquerda */}
                        <div className="space-y-3 bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                            <span className="text-[10px] font-black uppercase flex items-center gap-2 text-blue-700 tracking-widest"><Footprints className="w-4 h-4 text-blue-500" /> Cinemática Perna Esquerda</span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <PasteUploadZone
                                    label="Contato Inicial (RC)"
                                    value={form.watch("tests.gait_photos.left.initial")}
                                    onChange={(v) => form.setValue("tests.gait_photos.left.initial", v)}
                                    className="aspect-[3/4] w-full object-cover"
                                />
                                <PasteUploadZone
                                    label="Apoio Médio (AM)"
                                    value={form.watch("tests.gait_photos.left.mid")}
                                    onChange={(v) => form.setValue("tests.gait_photos.left.mid", v)}
                                    className="aspect-[3/4] w-full object-cover"
                                />
                                <PasteUploadZone
                                    label="Fase de Impulsão (TO)"
                                    value={form.watch("tests.gait_photos.left.terminal")}
                                    onChange={(v) => form.setValue("tests.gait_photos.left.terminal", v)}
                                    className="aspect-[3/4] w-full object-cover"
                                />
                            </div>
                        </div>

                        {/* Direita */}
                        <div className="space-y-3 bg-white p-4 rounded-xl border border-green-100 shadow-sm">
                            <span className="text-[10px] font-black uppercase flex items-center gap-2 text-green-700 tracking-widest"><Footprints className="w-4 h-4 text-green-500" /> Cinemática Perna Direita</span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <PasteUploadZone
                                    label="Contato Inicial (RC)"
                                    value={form.watch("tests.gait_photos.right.initial")}
                                    onChange={(v) => form.setValue("tests.gait_photos.right.initial", v)}
                                    className="aspect-[3/4] w-full object-cover"
                                />
                                <PasteUploadZone
                                    label="Apoio Médio (AM)"
                                    value={form.watch("tests.gait_photos.right.mid")}
                                    onChange={(v) => form.setValue("tests.gait_photos.right.mid", v)}
                                    className="aspect-[3/4] w-full object-cover"
                                />
                                <PasteUploadZone
                                    label="Fase de Impulsão (TO)"
                                    value={form.watch("tests.gait_photos.right.terminal")}
                                    onChange={(v) => form.setValue("tests.gait_photos.right.terminal", v)}
                                    className="aspect-[3/4] w-full object-cover"
                                />
                            </div>
                        </div>
                    </div>
                </div>

            </AccordionContent>
        </AccordionItem>
    );
}
