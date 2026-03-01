"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Zap, Activity, ShieldCheck, AlertTriangle,
    CheckCircle2, Info, Move, Ruler, Dumbbell, Flame, FlaskConical
} from "lucide-react";
import { cn } from "@/lib/utils";
import { checkStatus } from "@/utils/clinical-references";

const ReferenceStatus = ({ value, type }: { value: any, type: string }) => {
    const v = Number(value);
    const isEmpty = value === "" || value === undefined || value === null;
    if (isEmpty) return <div className="text-[9px] font-black px-2 py-0.5 rounded border mt-1 w-full text-center uppercase bg-slate-50 text-slate-300 border-slate-100">Sem Dados</div>;

    const status = checkStatus(type as any, v);

    if (!status) return <div className="text-[9px] font-black px-2 py-1 rounded border mt-1 w-full text-center uppercase bg-slate-50 text-slate-300 border-slate-100">-</div>;

    return <div className={cn("text-[9px] font-black px-2 py-1 rounded border mt-1 w-full text-center uppercase transition-all duration-300", status.color)}>{status.label}</div>;
};

export function KneeRichProtocol() {
    const { register, watch, setValue } = useFormContext();

    const updateField = (path: string, val: any) => {
        setValue(path, val, { shouldDirty: true, shouldValidate: true });
    };

    // Helpes para Y-Balance
    const getVal = (side: string, key: string) => {
        return Number(watch(`protocols.joelho.functional.ybalance.${key}_${side}`)) || 0;
    };

    const getPct = (val: number, side: string) => {
        const legLength = Number(watch(`protocols.joelho.functional.ybalance.legLength_${side}`)) || 0;
        return legLength > 0 && val > 0 ? Math.round((val / legLength) * 100) : 0;
    };

    const lAnt = getVal("l", "Anterior");
    const rAnt = getVal("r", "Anterior");
    const diffAnt = Math.abs(lAnt - rAnt);

    const lPm = getVal("l", "PostMed");
    const rPm = getVal("r", "PostMed");
    const diffPm = Math.abs(lPm - rPm);

    const lPl = getVal("l", "PostLat");
    const rPl = getVal("r", "PostLat");
    const diffPl = Math.abs(lPl - rPl);

    const lComp = (lAnt + lPm + lPl) / 3;
    const lScore = getPct(lComp, "l");

    const rComp = (rAnt + rPm + rPl) / 3;
    const rScore = getPct(rComp, "r");

    const directions = [
        { label: "Anterior", key: "Anterior" },
        { label: "Postero Medial", key: "PostMed" },
        { label: "Postero Lateral", key: "PostLat" }
    ];

    return (
        <div className="space-y-10 animate-in fade-in duration-500">

            <Tabs defaultValue="tests" className="w-full">
                <div className="flex justify-center mb-8">
                    <TabsList className="bg-slate-100/50 p-1.5 rounded-2xl h-auto border border-slate-100 shadow-inner">
                        <TabsTrigger value="tests" className="rounded-xl px-8 py-2.5 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg active:scale-95 transition-all gap-2">
                            <FlaskConical className="h-4 w-4" /> Testes Especiais
                        </TabsTrigger>
                        <TabsTrigger value="functional" className="rounded-xl px-8 py-2.5 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg active:scale-95 transition-all gap-2">
                            <Activity className="h-4 w-4" /> Funcional
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* ABA 1: TESTES ESPECIAIS (Ligamentar & Meniscal) */}
                <TabsContent value="tests" className="space-y-10 focus-visible:outline-none">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                            { id: 'lachman', label: 'Lachman (LCA)', group: 'Ligamentar' },
                            { id: 'anterior_drawer', label: 'Gaveta Anterior', group: 'Ligamentar' },
                            { id: 'posterior_drawer', label: 'Gaveta Posterior', group: 'Ligamentar' },
                            { id: 'valgus_stress', label: 'Estresse Valgo', group: 'Colateral' },
                            { id: 'varus_stress', label: 'Estresse Varo', group: 'Colateral' },
                            { id: 'mcmurray', label: 'McMurray', group: 'Meniscal' },
                            { id: 'thessaly', label: 'Thessaly', group: 'Meniscal' },
                            { id: 'patellar_apprehension', label: 'Apreensão Patelar', group: 'Patelar' },
                            { id: 'clarke', label: 'Sinal de Clarke', group: 'Patelar' }
                        ].map((test) => (
                            <div key={test.id} className={cn(
                                "flex flex-col p-6 bg-white border rounded-[2.5rem] transition-all shadow-sm",
                                (watch(`protocols.joelho.tests.${test.id}_l`) === 'positive' || watch(`protocols.joelho.tests.${test.id}_r`) === 'positive')
                                    ? "border-rose-200 bg-rose-50/10 ring-2 ring-rose-50"
                                    : "border-slate-100"
                            )}>
                                <div className="flex flex-col mb-4 border-b border-slate-50 pb-3">
                                    <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{test.label}</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{test.group}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {['l', 'r'].map((side) => (
                                        <div key={side} className="space-y-1.5">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">{side === 'l' ? 'Esquerdo' : 'Direito'}</span>
                                            <Select
                                                value={watch(`protocols.joelho.tests.${test.id}_${side}`) || 'negative'}
                                                onValueChange={(v) => updateField(`protocols.joelho.tests.${test.id}_${side}`, v)}
                                            >
                                                <SelectTrigger className={cn(
                                                    "w-full h-9 border-none shadow-none text-center font-black text-[9px] uppercase rounded-xl transition-all",
                                                    watch(`protocols.joelho.tests.${test.id}_${side}`) === 'positive' ? "bg-rose-100 text-rose-700" : "bg-slate-50 text-slate-600"
                                                )}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent align="center">
                                                    <SelectItem value="negative" className="text-[9px] font-black uppercase text-emerald-600">Negativo</SelectItem>
                                                    <SelectItem value="positive" className="text-[9px] font-black uppercase text-rose-600">Positivo</SelectItem>
                                                    <SelectItem value="laxity_1" className="text-[9px] font-black uppercase text-amber-600">Frouxidão G1</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </TabsContent>

                {/* ABA 2: FUNCIONAL (Step Down, Hop Test, Y-Balance, Lunge) */}
                <TabsContent value="functional" className="space-y-10 focus-visible:outline-none">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4 md:col-span-2">
                            <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
                                <Activity className="h-4 w-4 text-blue-600" />
                                <h6 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Controle Dinâmico</h6>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Step Down Test</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    {['l', 'r'].map((side) => (
                                        <div key={side} className="space-y-2 p-3 bg-slate-50/50 rounded-2xl border border-slate-50">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">{side === 'l' ? 'Esquerdo' : 'Direito'}</span>
                                            <Select
                                                value={watch(`protocols.joelho.functional.step_down_${side}`) || 'good'}
                                                onValueChange={(v) => updateField(`protocols.joelho.functional.step_down_${side}`, v)}
                                            >
                                                <SelectTrigger className="h-10 bg-white border-none rounded-xl font-black text-xs uppercase px-4 shadow-sm">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="good" className="text-[10px] font-black uppercase text-emerald-600">Bom Alinhamento</SelectItem>
                                                    <SelectItem value="medial_collapse" className="text-[10px] font-black uppercase text-rose-600">Colapso Medial</SelectItem>
                                                    <SelectItem value="shaky" className="text-[10px] font-black uppercase text-amber-600">Instabilidade</SelectItem>
                                                    <SelectItem value="pain" className="text-[10px] font-black uppercase text-rose-600">Dor</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4 md:col-span-2">
                            <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
                                <Move className="h-4 w-4 text-emerald-600" />
                                <h6 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Métricas de Salto</h6>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Hop Test (cm)</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="relative">
                                        <Input
                                            {...register('protocols.joelho.functional.hop_distance_l')}
                                            type="number"
                                            placeholder="L"
                                            className="h-12 bg-slate-50 border-none rounded-2xl font-black text-center text-lg text-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-50 shadow-inner"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300">CM</span>
                                    </div>
                                    <div className="relative">
                                        <Input
                                            {...register('protocols.joelho.functional.hop_distance_r')}
                                            type="number"
                                            placeholder="R"
                                            className="h-12 bg-slate-50 border-none rounded-2xl font-black text-center text-lg text-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-50 shadow-inner"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300">CM</span>
                                    </div>
                                </div>
                                <div className="p-2 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center justify-center">
                                    <p className="text-[8px] font-bold text-emerald-700 uppercase tracking-tighter text-center leading-tight">
                                        Critério de retorno: LSI {'>'} 90%.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* LUNGE TEST & LEG LENGTH */}
                        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4 md:col-span-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Flame className="h-4 w-4 text-orange-500" />
                                        <Label className="text-[10px] uppercase font-black text-slate-700 tracking-widest">Lunge Teste (º)</Label>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['l', 'r'].map(side => (
                                            <div key={side}>
                                                <Input
                                                    {...register(`protocols.joelho.functional.lunge_${side}`)}
                                                    placeholder={side.toUpperCase()}
                                                    type="number"
                                                    className="h-11 bg-slate-50 border-none rounded-xl font-black text-center text-orange-600 shadow-inner focus:bg-white"
                                                />
                                                <ReferenceStatus type="lunge" value={watch(`protocols.joelho.functional.lunge_${side}`)} />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Ruler className="h-4 w-4 text-slate-400" />
                                        <Label className="text-[10px] uppercase font-black text-slate-700 tracking-widest">Comprimento Membro (cm)</Label>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['l', 'r'].map(side => (
                                            <Input
                                                key={side}
                                                {...register(`protocols.joelho.functional.ybalance.legLength_${side}`)}
                                                placeholder={side.toUpperCase() + " (cm)"}
                                                type="number"
                                                className="h-11 bg-slate-50 border-none rounded-xl font-black text-center text-slate-600 shadow-inner focus:bg-white"
                                            />
                                        ))}
                                    </div>
                                    <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest text-center">Necessário para o Score do Y-Balance</p>
                                </div>
                            </div>
                        </div>

                        {/* Y-BALANCE TESTER */}
                        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6 md:col-span-4 overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 -mr-4 -mt-4 transition-transform group-hover:scale-110 pointer-events-none">
                                <Activity className="w-32 h-32 text-purple-600" />
                            </div>

                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 pb-3 border-b border-slate-50 gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 shadow-sm border border-purple-100">
                                        <Zap className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-xs text-slate-800 uppercase tracking-widest">Y-Balance Teste</h4>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter italic">Controle Sensorio-motor Dinâmico</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-[9px] bg-slate-50/50 px-4 py-2 rounded-2xl border border-slate-100 shadow-inner">
                                    <span className="font-black uppercase text-slate-400 tracking-widest">Dominância:</span>
                                    <div className="flex items-center gap-4">
                                        {['left', 'right'].map((d) => (
                                            <div key={d} className="flex items-center gap-2">
                                                <Checkbox
                                                    id={`dom-${d}`}
                                                    checked={watch("protocols.joelho.functional.ybalance.dominance") === d}
                                                    onCheckedChange={() => updateField("protocols.joelho.functional.ybalance.dominance", d)}
                                                    className="rounded-lg h-5 w-5 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                                                />
                                                <label htmlFor={`dom-${d}`} className={cn("cursor-pointer font-black uppercase text-[9px]", watch("protocols.joelho.functional.ybalance.dominance") === d ? "text-purple-600" : "text-slate-400")}>
                                                    {d === 'left' ? 'Esquerda' : 'Direita'}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-center min-w-[500px]">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="p-4 text-left rounded-tl-[1.5rem] font-black tracking-widest text-[9px] text-slate-400 uppercase">Direção</th>
                                            <th className="p-4 bg-blue-50/30 text-blue-700 font-black text-[9px] uppercase tracking-widest">Esq (cm)</th>
                                            <th className="p-4 bg-blue-50/50 text-blue-900 border-r border-white font-black text-[9px] uppercase">%</th>
                                            <th className="p-4 bg-emerald-50/30 text-emerald-700 font-black text-[9px] uppercase tracking-widest">Dir (cm)</th>
                                            <th className="p-4 bg-emerald-50/50 text-emerald-900 rounded-tr-[1.5rem] font-black text-[9px] uppercase">%</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {directions.map((dir, idx) => {
                                            const lVal = getVal("l", dir.key);
                                            const rVal = getVal("r", dir.key);
                                            const lPct = getPct(lVal, "l");
                                            const rPct = getPct(rVal, "r");

                                            return (
                                                <tr key={dir.key} className="hover:bg-slate-50/30 transition-colors">
                                                    <td className="text-left p-4 font-black text-slate-600 text-[10px] uppercase tracking-tight">{dir.label}</td>
                                                    <td className="p-3 bg-blue-50/10">
                                                        <Input className="h-10 w-24 mx-auto text-center font-black text-blue-700 bg-white shadow-sm border-blue-100 rounded-xl" type="number" placeholder="cm" {...register(`protocols.joelho.functional.ybalance.${dir.key}_l` as any, { valueAsNumber: true })} />
                                                    </td>
                                                    <td className="p-3 text-[10px] font-black text-blue-500 bg-blue-50/20 border-r border-white">{lPct ? `${lPct}%` : "-"}</td>
                                                    <td className="p-3 bg-emerald-50/10">
                                                        <Input className="h-10 w-24 mx-auto text-center font-black text-emerald-700 bg-white shadow-sm border-emerald-100 rounded-xl" type="number" placeholder="cm" {...register(`protocols.joelho.functional.ybalance.${dir.key}_r` as any, { valueAsNumber: true })} />
                                                    </td>
                                                    <td className="p-3 text-[10px] font-black text-emerald-500 bg-emerald-50/20">{rPct ? `${rPct}%` : "-"}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-3">
                                {diffAnt > 4 ? (
                                    <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-center text-[9px] font-black tracking-widest uppercase border border-rose-100 flex items-center justify-center gap-2 shadow-sm animate-pulse">
                                        Assimetria Ant: {Math.round(diffAnt)}cm <span className="text-rose-400 bg-white px-2 py-1 rounded-lg border border-rose-50">(Risco)</span>
                                    </div>
                                ) : (
                                    <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl text-center text-[9px] font-black tracking-widest uppercase border border-emerald-100 flex items-center justify-center gap-2 shadow-sm">
                                        Simetria Anterior <span className="text-emerald-500 bg-white px-2 py-1 rounded-lg border border-emerald-50">(Normal)</span>
                                    </div>
                                )}

                                {['l', 'r'].map(side => {
                                    const score = side === 'l' ? lScore : rScore;
                                    const label = side === 'l' ? 'ESQ' : 'DIR';
                                    if (score >= 94) {
                                        return (
                                            <div key={side} className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl text-center text-[9px] font-black tracking-widest uppercase border border-emerald-100 flex items-center justify-center gap-2 shadow-sm">
                                                Score {label}: {score}% <span className="text-emerald-500 bg-white px-2 py-1 rounded-lg border border-emerald-50">Excelência</span>
                                            </div>
                                        );
                                    }
                                    if (score > 0) {
                                        return (
                                            <div key={side} className="bg-amber-50 text-amber-600 p-4 rounded-2xl text-center text-[9px] font-black tracking-widest uppercase border border-amber-100 flex items-center justify-center gap-2 shadow-sm">
                                                Score {label}: {score}% <span className="text-amber-500 bg-white px-2 py-1 rounded-lg border border-amber-50">Atenção</span>
                                            </div>
                                        );
                                    }
                                    return (
                                        <div key={side} className="bg-slate-50 text-slate-300 p-4 rounded-2xl text-center text-[9px] font-black tracking-widest uppercase border border-slate-100 flex items-center justify-center shadow-inner">
                                            Score {label}: Pendente
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
