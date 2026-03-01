"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Zap, Activity, ShieldCheck, AlertTriangle,
    CheckCircle2, Info, Move, Ruler, FlaskConical, Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import { InteractiveDermatomeMap } from "../../components/neurological/InteractiveDermatomeMap";

export function CervicalRichProtocol() {
    const { register, watch, setValue } = useFormContext();

    const updateField = (path: string, val: any) => {
        setValue(path, val, { shouldDirty: true, shouldValidate: true });
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500">

            <Tabs defaultValue="tests" className="w-full">
                <div className="flex justify-center mb-8">
                    <TabsList className="bg-slate-100/50 p-1.5 rounded-2xl h-auto border border-slate-100 shadow-inner">
                        <TabsTrigger value="tests" className="rounded-xl px-8 py-2.5 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg active:scale-95 transition-all gap-2">
                            <FlaskConical className="h-4 w-4" /> Testes Especiais
                        </TabsTrigger>
                        <TabsTrigger value="neuro" className="rounded-xl px-8 py-2.5 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg active:scale-95 transition-all gap-2">
                            <Zap className="h-4 w-4" /> Neurológico
                        </TabsTrigger>
                        <TabsTrigger value="control" className="rounded-xl px-8 py-2.5 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg active:scale-95 transition-all gap-2">
                            <Target className="h-4 w-4" /> Controle Motor
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* ABA 1: TESTES ESPECIAIS (Spurling, Distração, ULTTs, etc) */}
                <TabsContent value="tests" className="space-y-10 focus-visible:outline-none">
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            { id: 'spurling', label: 'Spurling (Radiculopatia)', type: 'Compressão', bilateral: true },
                            { id: 'ultt1', label: 'ULTT 1', type: 'Mediano, Interósseo Ant, C5-C7', bilateral: true },
                            { id: 'ultt2', label: 'ULTT 2', type: 'Mediano, Axilar, Musculocutâneo', bilateral: true },
                            { id: 'ultt3', label: 'ULTT 3', type: 'Nervo Radial', bilateral: true },
                            { id: 'ultt4', label: 'ULTT 4', type: 'Nervo Ulnar', bilateral: true },
                            { id: 'vertebral_artery', label: 'Artéria Vertebral (VBI)', type: 'Segurança', bilateral: true },
                            { id: 'distraction', label: 'Teste de Distração', type: 'Alívio', bilateral: false },
                            { id: 'sharp_purser', label: 'Sharp-Purser', type: 'Instabilidade Atlas', bilateral: false },
                            { id: 'alar_ligament', label: 'Ligamento Alar', type: 'Instabilidade', bilateral: false },
                        ].map((test) => (
                            <div key={test.id} className={cn(
                                "flex flex-col p-6 bg-white border rounded-[2.5rem] transition-all shadow-sm",
                                (!test.bilateral && watch(`protocols.coluna_cervical.tests.${test.id}`) === 'positive') ||
                                    (test.bilateral && (watch(`protocols.coluna_cervical.tests.${test.id}_l`) === 'positive' || watch(`protocols.coluna_cervical.tests.${test.id}_r`) === 'positive'))
                                    ? "border-rose-200 bg-rose-50/10 ring-2 ring-rose-50"
                                    : "border-slate-100"
                            )}>
                                <div className="flex flex-col mb-4 border-b border-slate-50 pb-3 text-center sm:text-left">
                                    <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{test.label}</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{test.type}</span>
                                </div>

                                {test.bilateral ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        {['l', 'r'].map((side) => (
                                            <div key={side} className="space-y-1.5">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">{side === 'l' ? 'Esquerdo' : 'Direito'}</span>
                                                <Select
                                                    value={watch(`protocols.coluna_cervical.tests.${test.id}_${side}`) || 'negative'}
                                                    onValueChange={(v) => updateField(`protocols.coluna_cervical.tests.${test.id}_${side}`, v)}
                                                >
                                                    <SelectTrigger className={cn(
                                                        "w-full h-9 border-none shadow-none text-center font-black text-[9px] uppercase rounded-xl transition-all",
                                                        watch(`protocols.coluna_cervical.tests.${test.id}_${side}`) === 'positive' ? "bg-rose-100 text-rose-700" : "bg-slate-50 text-slate-600"
                                                    )}>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent align="center">
                                                        <SelectItem value="negative" className="text-[9px] font-black uppercase text-emerald-600">Negativo</SelectItem>
                                                        <SelectItem value="positive" className="text-[9px] font-black uppercase text-rose-600">Positivo</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex justify-center">
                                        <div className="w-full max-w-[140px]">
                                            <Select
                                                value={watch(`protocols.coluna_cervical.tests.${test.id}`) || 'negative'}
                                                onValueChange={(v) => updateField(`protocols.coluna_cervical.tests.${test.id}`, v)}
                                            >
                                                <SelectTrigger className={cn(
                                                    "w-full h-9 border-none shadow-none text-center font-black text-[10px] uppercase rounded-xl transition-all",
                                                    watch(`protocols.coluna_cervical.tests.${test.id}`) === 'positive' ? "bg-rose-100 text-rose-700 font-black" : "bg-slate-50 text-slate-600"
                                                )}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent align="center">
                                                    <SelectItem value="negative" className="text-[10px] font-black uppercase text-emerald-600">Negativo</SelectItem>
                                                    <SelectItem value="positive" className="text-[10px] font-black uppercase text-rose-600">Positivo</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </TabsContent>

                {/* ABA 2: NEUROLÓGICO (Miótomos, Dermátomos, Reflexos) */}
                <TabsContent value="neuro" className="space-y-10 focus-visible:outline-none">
                    <div className="grid md:grid-cols-2 gap-10">
                        {/* MIÓTOMOS MMSS */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 ml-2">
                                <Activity className="h-4 w-4 text-blue-500" />
                                <h5 className="font-black text-slate-700 uppercase text-[11px] tracking-widest">Miótomos (Cervical / MMSS)</h5>
                            </div>

                            <div className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-sm">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Raíz / Ação</th>
                                            <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">D</th>
                                            <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">E</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {[
                                            { root: 'C1-C2', action: 'Flexão Cervical', bilateral: false },
                                            { root: 'C3', action: 'Inclinação Lateral', bilateral: true },
                                            { root: 'C4', action: 'Elevação Ombros', bilateral: true },
                                            { root: 'C5', action: 'Abdução Ombro', bilateral: true },
                                            { root: 'C6', action: 'Flexão Cotovelo / Ext. Punho', bilateral: true },
                                            { root: 'C7', action: 'Ext. Cotovelo / Flexão Punho', bilateral: true },
                                            { root: 'C8', action: 'Flexão Dedos', bilateral: true },
                                            { root: 'T1', action: 'Abdução de Dedos', bilateral: true },
                                        ].map((item) => (
                                            <tr key={item.root} className="group hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black text-slate-900 uppercase leading-none mb-1">{item.root}</span>
                                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{item.action}</span>
                                                    </div>
                                                </td>
                                                {item.bilateral ? (
                                                    ['d', 'e'].map((side) => (
                                                        <td key={side} className="px-4 py-4">
                                                            <div className="flex justify-center">
                                                                <Checkbox
                                                                    className="h-6 w-6 rounded-lg data-[state=checked]:bg-rose-500 data-[state=checked]:border-rose-500"
                                                                    checked={watch(`protocols.coluna_cervical.neuro.myotomes.${item.root}_${side}`) === 'WEAK'}
                                                                    onCheckedChange={(c) => updateField(`protocols.coluna_cervical.neuro.myotomes.${item.root}_${side}`, c ? 'WEAK' : 'NORMAL')}
                                                                />
                                                            </div>
                                                        </td>
                                                    ))
                                                ) : (
                                                    <td colSpan={2} className="px-4 py-4">
                                                        <div className="flex justify-center">
                                                            <Checkbox
                                                                className="h-6 w-6 rounded-lg data-[state=checked]:bg-rose-500 data-[state=checked]:border-rose-500"
                                                                checked={watch(`protocols.coluna_cervical.neuro.myotomes.${item.root}`) === 'WEAK'}
                                                                onCheckedChange={(c) => updateField(`protocols.coluna_cervical.neuro.myotomes.${item.root}`, c ? 'WEAK' : 'NORMAL')}
                                                            />
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* REFLEXOS MMSS */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 ml-2">
                                <Zap className="h-4 w-4 text-amber-500" />
                                <h5 className="font-black text-slate-700 uppercase text-[11px] tracking-widest">Reflexos (MMSS)</h5>
                            </div>

                            <div className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100 space-y-4 shadow-inner">
                                {[
                                    { id: 'biceps', label: 'Bicipital', roots: 'C5, C6' },
                                    { id: 'braquiorradial', label: 'Braquiorradial', roots: 'C5, C6' },
                                    { id: 'triceps', label: 'Tricipital', roots: 'C7, C8' }
                                ].map((ref) => (
                                    <div key={ref.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                                        <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{ref.label}</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{ref.roots}</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            {['d', 'e'].map((side) => (
                                                <div key={side} className="space-y-2">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">{side === 'd' ? 'Direito' : 'Esquerdo'}</span>
                                                    <Select
                                                        value={watch(`protocols.coluna_cervical.neuro.reflexes.${ref.id}_${side}`) || 'normal'}
                                                        onValueChange={(v) => updateField(`protocols.coluna_cervical.neuro.reflexes.${ref.id}_${side}`, v)}
                                                    >
                                                        <SelectTrigger className="w-full h-9 bg-slate-50 border-none shadow-none text-right font-black text-[9px] uppercase rounded-xl">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent align="end">
                                                            <SelectItem value="normal" className="text-[9px] font-black uppercase text-emerald-600">Normal (2+)</SelectItem>
                                                            <SelectItem value="hiper" className="text-[9px] font-black uppercase text-amber-600">Hiper (3+)</SelectItem>
                                                            <SelectItem value="hipo" className="text-[9px] font-black uppercase text-blue-600">Hipo (1+)</SelectItem>
                                                            <SelectItem value="arreflexia" className="text-[9px] font-black uppercase text-rose-600">Ausente (0)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* DERMÁTOMOS MMSS */}
                        <div className="space-y-6 md:col-span-2 pt-6 border-t border-slate-50">
                            <div className="flex items-center gap-3 ml-2">
                                <Activity className="h-4 w-4 text-purple-500" />
                                <h5 className="font-black text-slate-700 uppercase text-[11px] tracking-widest">Dermátomos (Sensibilidade)</h5>
                            </div>
                            <div className="bg-slate-50/50 p-4 pt-8 rounded-[3rem] border border-slate-100 flex flex-col items-center">
                                <InteractiveDermatomeMap
                                    selected={watch('protocols.coluna_cervical.neuro.dermatomes') || []}
                                    onSelectionChange={(val) => updateField('protocols.coluna_cervical.neuro.dermatomes', val)}
                                    debug={true}
                                />
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* ABA 3: CONTROLE MOTOR (CCFT, Stabilizer) */}
                <TabsContent value="control" className="space-y-10 focus-visible:outline-none">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
                        <div className="flex items-center gap-4 p-5 bg-purple-50 rounded-3xl border border-purple-100">
                            <Info className="h-6 w-6 text-purple-600 shrink-0" />
                            <div>
                                <h6 className="text-[11px] font-black text-purple-900 uppercase tracking-widest mb-1">Flexão Craniocervical (CCFT)</h6>
                                <p className="text-[10px] text-purple-700 leading-relaxed font-bold opacity-80 uppercase tracking-tighter">
                                    Utilize o Stabilizer (Biofeedback) para avaliar a resistência dos flexores profundos.
                                </p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-10">
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ativação Máxima (mmHg)</Label>
                                <div className="relative">
                                    <Input
                                        {...register('protocols.coluna_cervical.control.ccft_value')}
                                        type="number"
                                        placeholder="20-30"
                                        className="h-14 bg-slate-50 border-none rounded-2xl font-black text-center text-2xl text-purple-600 focus:bg-white focus:ring-4 focus:ring-purple-100"
                                    />
                                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[11px] font-black text-slate-300">mmHg</span>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Qualidade do Movimento</Label>
                                <Select
                                    value={watch('protocols.coluna_cervical.control.quality') || 'good'}
                                    onValueChange={(v) => updateField('protocols.coluna_cervical.control.quality', v)}
                                >
                                    <SelectTrigger className="h-14 bg-slate-50 border-none rounded-2xl font-black text-sm uppercase px-6 shadow-inner">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="good" className="text-[11px] font-black uppercase">Bom Controle</SelectItem>
                                        <SelectItem value="substitution" className="text-[11px] font-black uppercase">Substituição (ECM)</SelectItem>
                                        <SelectItem value="shaky" className="text-[11px] font-black uppercase">Tremor / Fadiga Precoce</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
