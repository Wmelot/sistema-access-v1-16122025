"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    Activity, Zap, ShieldCheck, AlertTriangle,
    CheckCircle2, Info, Move, Ruler, Dumbbell, Flame
} from "lucide-react";
import { cn } from "@/lib/utils";

export function AtmRichProtocol() {
    const { register, watch, setValue } = useFormContext();

    const updateField = (path: string, val: any) => {
        setValue(path, val, { shouldDirty: true, shouldValidate: true });
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <Tabs defaultValue="mobility" className="w-full">
                <div className="flex justify-center mb-8">
                    <TabsList className="bg-slate-100/50 p-1.5 rounded-2xl h-auto border border-slate-100 shadow-inner">
                        <TabsTrigger value="mobility" className="rounded-xl px-8 py-2.5 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg active:scale-95 transition-all">
                            📏 Mobilidade & ADM
                        </TabsTrigger>
                        <TabsTrigger value="special" className="rounded-xl px-8 py-2.5 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg active:scale-95 transition-all">
                            🧪 Testes (Magee)
                        </TabsTrigger>
                        <TabsTrigger value="mckenzie" className="rounded-xl px-8 py-2.5 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg active:scale-95 transition-all">
                            🧠 MDT (McKenzie)
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* ABA 1: MOBILIDADE & ADM */}
                <TabsContent value="mobility" className="space-y-10 focus-visible:outline-none">
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* ABERTURA E OCLUSÃO */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <Ruler className="h-4 w-4 text-indigo-500" />
                                <h5 className="font-black text-slate-700 uppercase text-[11px] tracking-widest">Cinemática Mandibular (mm)</h5>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <Label className="text-[9px] font-black text-slate-400 uppercase ml-1">Abertura Max (MIO)</Label>
                                    <div className="relative">
                                        <Input {...register('protocols.atm.mobility.opening')} type="number" placeholder="40-50" className="h-12 bg-slate-50 border-none rounded-2xl font-black text-center text-lg focus:bg-white focus:ring-2 focus:ring-indigo-100" />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">mm</span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[9px] font-black text-slate-400 uppercase ml-1">Protrusão</Label>
                                    <div className="relative">
                                        <Input {...register('protocols.atm.mobility.protrusion')} type="number" placeholder="> 7" className="h-12 bg-slate-50 border-none rounded-2xl font-black text-center text-lg focus:bg-white focus:ring-2 focus:ring-indigo-100" />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">mm</span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[9px] font-black text-slate-400 uppercase ml-1">Lat. Direita</Label>
                                    <div className="relative">
                                        <Input {...register('protocols.atm.mobility.lateral_r')} type="number" placeholder="8-12" className="h-12 bg-slate-50 border-none rounded-2xl font-black text-center text-lg focus:bg-white focus:ring-2 focus:ring-indigo-100" />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">mm</span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[9px] font-black text-slate-400 uppercase ml-1">Lat. Esquerda</Label>
                                    <div className="relative">
                                        <Input {...register('protocols.atm.mobility.lateral_l')} type="number" placeholder="8-12" className="h-12 bg-slate-50 border-none rounded-2xl font-black text-center text-lg focus:bg-white focus:ring-2 focus:ring-indigo-100" />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">mm</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PADRÃO DE DESVIO (Magee) */}
                        <div className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100 space-y-6">
                            <div className="flex items-center gap-3">
                                <Activity className="h-4 w-4 text-emerald-500" />
                                <h5 className="font-black text-slate-700 uppercase text-[11px] tracking-widest">Trajetória de Abertura</h5>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { id: 'normal', label: 'Retilínea (Normal)', color: 'emerald' },
                                    { id: 'deviation_c', label: 'Desvio em C (Deflexão)', color: 'rose' },
                                    { id: 'deviation_s', label: 'Desvio em S (Desvio)', color: 'rose' },
                                ].map((pattern) => (
                                    <div
                                        key={pattern.id}
                                        onClick={() => updateField('protocols.atm.mobility.pattern', pattern.id)}
                                        className={cn(
                                            "flex items-center justify-between p-4 rounded-2xl cursor-pointer border transition-all shadow-sm",
                                            watch('protocols.atm.mobility.pattern') === pattern.id
                                                ? `bg-white border-${pattern.color}-200 ring-2 ring-${pattern.color}-50`
                                                : "bg-white border-transparent hover:border-slate-200"
                                        )}
                                    >
                                        <span className={cn(
                                            "text-[10px] font-black uppercase tracking-tight",
                                            watch('protocols.atm.mobility.pattern') === pattern.id ? `text-${pattern.color}-700` : "text-slate-600"
                                        )}>{pattern.label}</span>
                                        {watch('protocols.atm.mobility.pattern') === pattern.id && <CheckCircle2 className={cn("w-4 h-4", `text-${pattern.color}-500`)} />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* ABA 2: TESTES ESPECIAIS (Magee) */}
                <TabsContent value="special" className="space-y-10 focus-visible:outline-none">
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            { id: 'loading_test', label: 'Teste de Carregamento (Loading)', type: 'Provocação Intra-articular', bilateral: true },
                            { id: 'click_opening', label: 'Clique na Abertura', type: 'Ruído Articular', bilateral: true },
                            { id: 'click_closing', label: 'Clique no Fechamento', type: 'Recaptura de Disco', bilateral: true },
                            { id: 'chvostek', label: 'Sinal de Chvostek', type: 'Nervo Facial (VII)', bilateral: true },
                            { id: 'ruler_test', label: 'Teste da Régua (Rocabado)', type: 'Instabilidade', bilateral: false },
                        ].map((test) => (
                            <div key={test.id} className={cn(
                                "flex flex-col p-6 bg-white border rounded-[2.5rem] transition-all shadow-sm",
                                (watch(`protocols.atm.tests.${test.id}`) === 'positive' || watch(`protocols.atm.tests.${test.id}_l`) === 'positive' || watch(`protocols.atm.tests.${test.id}_r`) === 'positive')
                                    ? "border-rose-200 bg-rose-50/10 ring-2 ring-rose-50"
                                    : "border-slate-100"
                            )}>
                                <div className="flex flex-col mb-4 border-b border-slate-50 pb-3">
                                    <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{test.label}</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{test.type}</span>
                                </div>

                                {test.bilateral ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        {['l', 'r'].map((side) => (
                                            <div key={side} className="space-y-1.5">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">{side === 'l' ? 'Esquerdo' : 'Direito'}</span>
                                                <Select
                                                    value={watch(`protocols.atm.tests.${test.id}_${side}`) || 'negative'}
                                                    onValueChange={(v) => updateField(`protocols.atm.tests.${test.id}_${side}`, v)}
                                                >
                                                    <SelectTrigger className={cn(
                                                        "w-full h-9 border-none shadow-none text-center font-black text-[9px] uppercase rounded-xl transition-all",
                                                        watch(`protocols.atm.tests.${test.id}_${side}`) === 'positive' ? "bg-rose-100 text-rose-700" : "bg-slate-50 text-slate-600"
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
                                                value={watch(`protocols.atm.tests.${test.id}`) || 'negative'}
                                                onValueChange={(v) => updateField(`protocols.atm.tests.${test.id}`, v)}
                                            >
                                                <SelectTrigger className={cn(
                                                    "w-full h-9 border-none shadow-none text-center font-black text-[10px] uppercase rounded-xl transition-all",
                                                    watch(`protocols.atm.tests.${test.id}`) === 'positive' ? "bg-rose-100 text-rose-700 font-black" : "bg-slate-50 text-slate-600"
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

                    {/* PALPAÇÃO MUSCULAR (Magee) */}
                    <div className="space-y-6 pt-6 border-t border-slate-50 text-center">
                        <div className="flex items-center justify-center gap-3">
                            <Flame className="h-4 w-4 text-orange-500" />
                            <h5 className="font-black text-slate-700 uppercase text-[11px] tracking-widest">Palpação Muscular & Sensibilidade</h5>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { id: 'masseter', label: 'Masseter' },
                                { id: 'temporalis', label: 'Temporal' },
                                { id: 'pterygoid_lat', label: 'Pterigóideo Lat.' },
                                { id: 'digastric', label: 'Digástrico' },
                            ].map((muscle) => (
                                <div key={muscle.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-3">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">{muscle.label}</span>
                                    <div className="flex justify-center gap-2">
                                        {['D', 'E'].map(side => (
                                            <button
                                                key={side}
                                                type="button"
                                                onClick={() => {
                                                    const key = `protocols.atm.palpation.${muscle.id}_${side.toLowerCase()}`;
                                                    updateField(key, !watch(key));
                                                }}
                                                className={cn(
                                                    "w-8 h-8 rounded-lg border-2 text-[10px] font-black transition-all",
                                                    watch(`protocols.atm.palpation.${muscle.id}_${side.toLowerCase()}`)
                                                        ? "bg-rose-500 border-rose-500 text-white"
                                                        : "bg-slate-50 border-transparent text-slate-400 hover:border-slate-200"
                                                )}
                                            >
                                                {side}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </TabsContent>

                {/* ABA 3: MCKENZIE (MDT) */}
                <TabsContent value="mckenzie" className="space-y-10 focus-visible:outline-none">
                    <div className="bg-indigo-50/50 p-8 rounded-[3rem] border border-indigo-100/50 space-y-8 shadow-inner">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                                <Activity className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-indigo-900 uppercase tracking-widest">Movimentos Repetidos (MDT)</h4>
                                <p className="text-[10px] text-indigo-600 font-bold uppercase opacity-80 tracking-tighter italic">Identifique a Preferência Direcional Mandibular</p>
                            </div>
                        </div>

                        <div className="grid gap-6">
                            {[
                                { id: 'retraction', label: 'Retração da Mandíbula', desc: 'Movimento posterior (gaveta posterior)' },
                                { id: 'protrusion', label: 'Protrusão da Mandíbula', desc: 'Movimento anterior' },
                                { id: 'opening', label: 'Abertura Repetida', desc: 'Monitorar cliques e desvios' },
                            ].map((mov) => (
                                <div key={mov.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:ring-2 hover:ring-indigo-100">
                                    <div className="flex flex-col">
                                        <span className="text-[12px] font-black text-slate-800 uppercase tracking-tight">{mov.label}</span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{mov.desc}</span>
                                    </div>

                                    <div className="flex flex-wrap gap-3 justify-end">
                                        {[
                                            { id: 'better', label: 'Melhor', color: 'emerald' },
                                            { id: 'worse', label: 'Pior', color: 'rose' },
                                            { id: 'neutral', label: 'Sem Efeito', color: 'slate' },
                                            { id: 'centralized', label: 'Centralizou', color: 'indigo' },
                                        ].map((resp) => (
                                            <button
                                                key={resp.id}
                                                type="button"
                                                onClick={() => updateField(`protocols.atm.mdt.${mov.id}`, resp.id)}
                                                className={cn(
                                                    "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 transition-all active:scale-95",
                                                    watch(`protocols.atm.mdt.${mov.id}`) === resp.id
                                                        ? `bg-${resp.color}-600 border-${resp.color}-600 text-white shadow-lg shadow-${resp.color}-200`
                                                        : `bg-slate-50 border-transparent text-slate-400 hover:border-slate-200`
                                                )}
                                            >
                                                {resp.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-4">
                        <Label className="text-[11px] font-black text-slate-700 uppercase tracking-widest ml-2 flex items-center gap-2">
                            <Info className="w-4 h-4 text-indigo-500" />
                            Conclusão MDT (ATM)
                        </Label>
                        <Select
                            value={watch('protocols.atm.mdt.classification') || 'derangement'}
                            onValueChange={(v) => updateField('protocols.atm.mdt.classification', v)}
                        >
                            <SelectTrigger className="h-14 bg-slate-50 border-none rounded-[1.5rem] font-black text-sm uppercase px-8 shadow-inner focus:ring-2 focus:ring-indigo-100">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="derangement" className="text-[11px] font-black uppercase text-indigo-600">Desarranjo (Preferência Direcional)</SelectItem>
                                <SelectItem value="dysfunction" className="text-[11px] font-black uppercase text-emerald-600">Disfunção (Padrão de Dor no fim da ADM)</SelectItem>
                                <SelectItem value="postural" className="text-[11px] font-black uppercase text-amber-600">Síndrome Postural</SelectItem>
                                <SelectItem value="other" className="text-[11px] font-black uppercase text-slate-600">Outros (Odontológico, Artrose)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
