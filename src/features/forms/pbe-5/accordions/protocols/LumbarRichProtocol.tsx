"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    UserCheck, Accessibility, Activity, Zap, Ruler,
    ShieldCheck, AlertTriangle, CheckCircle2, Info,
    Thermometer, Dumbbell, Move
} from "lucide-react";
import { cn } from "@/lib/utils";
import { InteractiveDermatomeMap } from "../../components/neurological/InteractiveDermatomeMap";
import { InteractiveInominadoMap } from "../../components/neurological/InteractiveInominadoMap";

export function LumbarRichProtocol() {
    const { register, watch, setValue } = useFormContext();
    const data = watch();

    const updateField = (path: string, val: any) => {
        setValue(path, val, { shouldDirty: true, shouldValidate: true });
    };

    // Inteligência Clínica: Monitor de Radiculopatia
    const renderRadiculopathyAlerts = () => {
        const neuro = data?.protocols?.coluna_lombar?.neuro || {};
        const dermatomes = neuro.dermatomes || [];
        const inominado = neuro.inominado_test || [];
        const allDermatomes = [...new Set([...dermatomes, ...inominado])];

        const alerts: { root: string; side: string; reasons: string[] }[] = [];

        ['d', 'e'].forEach(side => {
            const sideLabel = side === 'd' ? 'Direita' : 'Esquerda';

            // L4 Correlation
            const l4Reasons = [];
            if (allDermatomes.includes('L4')) l4Reasons.push('Dermátomo L4');
            if (neuro.myotomes?.[`L4_${side}`] === 'WEAK') l4Reasons.push('Fraqueza Tibial Ant. (L4)');
            if (['hipo', 'arreflexia'].includes(neuro.reflexes?.[`patelar_${side}`])) l4Reasons.push('Reflexo Patelar alterado');
            if (l4Reasons.length >= 2) alerts.push({ root: 'L4', side: sideLabel, reasons: l4Reasons });

            // L5 Correlation
            const l5Reasons = [];
            if (allDermatomes.includes('L5')) l5Reasons.push('Dermátomo L5');
            if (neuro.myotomes?.[`L5_${side}`] === 'WEAK') l5Reasons.push('Fraqueza Ext. Hálux (L5)');
            if (['hipo', 'arreflexia'].includes(neuro.reflexes?.[`semitendineo_${side}`])) l5Reasons.push('Reflexo Semitendíneo alterado');
            if (neuro.tension?.[`slr_${side}`] || neuro.tension?.[`slump_${side}`]) l5Reasons.push('Tensão Neural (+)');
            if (l5Reasons.length >= 3) alerts.push({ root: 'L5', side: sideLabel, reasons: l5Reasons });

            // S1 Correlation
            const s1Reasons = [];
            if (allDermatomes.includes('S1')) s1Reasons.push('Dermátomo S1');
            if (neuro.myotomes?.[`S1_${side}`] === 'WEAK') s1Reasons.push('Fraqueza Tríceps Sur. (S1)');
            if (['hipo', 'arreflexia'].includes(neuro.reflexes?.[`aquileu_${side}`])) s1Reasons.push('Reflexo Aquileu alterado');
            if (neuro.tension?.[`slr_${side}`]) s1Reasons.push('Tensão Neural (+)');
            if (s1Reasons.length >= 3) alerts.push({ root: 'S1', side: sideLabel, reasons: s1Reasons });
        });

        if (alerts.length === 0) return null;

        return (
            <div className="space-y-3 mb-8 animate-in slide-in-from-top-4 duration-500">
                {alerts.map((alert, i) => (
                    <div key={i} className="bg-rose-50 border-2 border-rose-200 p-5 rounded-[2rem] flex items-start gap-4 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Zap className="h-20 w-20 text-rose-500 rotate-12" />
                        </div>
                        <div className="h-10 w-10 rounded-2xl bg-rose-500 flex items-center justify-center text-white shadow-lg animate-pulse">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                                <Badge className="bg-rose-500 hover:bg-rose-600 text-white font-black px-3 py-1 rounded-lg text-[10px]">RADICULOPATIA SUSPEITA</Badge>
                                <span className="text-[11px] font-black text-rose-900 uppercase tracking-widest">{alert.root} - Lado {alert.side}</span>
                            </div>
                            <p className="text-[10px] font-bold text-rose-700 leading-relaxed uppercase">
                                Foram identificados múltiplos marcadores clínicos convergentes:
                                <span className="ml-1 text-rose-900 font-black">{alert.reasons.join(' + ')}</span>.
                            </p>
                            <p className="text-[9px] font-black text-rose-500 uppercase tracking-tighter pt-1">
                                Sugestão Axiom: Correlacionar com RM e avaliação neurofuncional profunda.
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500">

            {renderRadiculopathyAlerts()}

            <Tabs defaultValue="standing" className="w-full">
                <div className="flex justify-center mb-8">
                    <TabsList className="bg-slate-100/50 p-1.5 rounded-2xl h-auto border border-slate-100 shadow-inner">
                        <TabsTrigger value="standing" className="rounded-xl px-8 py-2.5 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg active:scale-95 transition-all">
                            🧍 Em Pé
                        </TabsTrigger>
                        <TabsTrigger value="sitting" className="rounded-xl px-8 py-2.5 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg active:scale-95 transition-all">
                            🪑 Sentado
                        </TabsTrigger>
                        <TabsTrigger value="lying" className="rounded-xl px-8 py-2.5 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg active:scale-95 transition-all">
                            🛌 Deitado
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* ABA 1: EM PÉ (Postural, Funcional, Marcha, Movimento) */}
                <TabsContent value="standing" className="space-y-10 focus-visible:outline-none">

                    {/* AVALIAÇÃO POSTURAL */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 ml-2">
                            <div className="h-2 w-2 rounded-full bg-purple-600 shadow-[0_0_8px_rgba(147,51,234,0.4)]" />
                            <h5 className="font-black text-slate-700 uppercase text-[11px] tracking-widest">Avaliação Postural</h5>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {['Vista Anterior', 'Vista Posterior', 'Vista Lateral D', 'Vista Lateral E'].map((view) => (
                                <div key={view} className="aspect-[3/4] bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer hover:bg-purple-50 hover:border-purple-300 transition-all group relative overflow-hidden shadow-sm">
                                    <div className="absolute inset-0 opacity-5 pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:16px_16px]"></div>
                                    <div className="p-3 bg-white rounded-2xl shadow-sm text-slate-300 group-hover:text-purple-500 transition-colors mb-4">
                                        <Ruler className="w-6 h-6" />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 group-hover:text-purple-700 text-center px-4 uppercase tracking-tighter leading-tight">{view}</span>
                                    <span className="text-[8px] font-bold text-slate-300 mt-2 uppercase tracking-widest">(Adicionar Foto)</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* TESTES FUNCIONAIS & MARCHA */}
                    <div className="space-y-6 pt-6 border-t border-slate-50">
                        <div className="flex items-center gap-3 ml-2">
                            <div className="h-2 w-2 rounded-full bg-purple-600" />
                            <h5 className="font-black text-slate-700 uppercase text-[11px] tracking-widest">Testes Funcionais & Marcha</h5>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className={cn(
                                "flex items-center justify-between p-5 bg-white border rounded-3xl transition-all shadow-sm",
                                watch('protocols.coluna_lombar.functional.heel_walk') ? "border-rose-200 bg-rose-50/30 ring-2 ring-rose-50" : "border-slate-100"
                            )}>
                                <div className="flex items-center gap-4">
                                    <Checkbox
                                        id="heel_walk"
                                        className="h-6 w-6 rounded-lg data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600"
                                        checked={watch('protocols.coluna_lombar.functional.heel_walk')}
                                        onCheckedChange={(c) => updateField('protocols.coluna_lombar.functional.heel_walk', c)}
                                    />
                                    <Label htmlFor="heel_walk" className="flex flex-col cursor-pointer">
                                        <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">Caminhada Calcanhares (L5)</span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">Avaliação de Déficit Motor</span>
                                    </Label>
                                </div>
                                {watch('protocols.coluna_lombar.functional.heel_walk') && <Badge className="bg-rose-600 text-white border-none text-[8px] font-black uppercase">Alterado</Badge>}
                            </div>

                            <div className={cn(
                                "flex items-center justify-between p-5 bg-white border rounded-3xl transition-all shadow-sm",
                                watch('protocols.coluna_lombar.functional.toe_walk') ? "border-rose-200 bg-rose-50/30 ring-2 ring-rose-50" : "border-slate-100"
                            )}>
                                <div className="flex items-center gap-4">
                                    <Checkbox
                                        id="toe_walk"
                                        className="h-6 w-6 rounded-lg data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600"
                                        checked={watch('protocols.coluna_lombar.functional.toe_walk')}
                                        onCheckedChange={(c) => updateField('protocols.coluna_lombar.functional.toe_walk', c)}
                                    />
                                    <Label htmlFor="toe_walk" className="flex flex-col cursor-pointer">
                                        <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">Caminhada Ponta dos Pés (S1)</span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">Avaliação de Déficit Motor</span>
                                    </Label>
                                </div>
                                {watch('protocols.coluna_lombar.functional.toe_walk') && <Badge className="bg-rose-600 text-white border-none text-[8px] font-black uppercase">Alterado</Badge>}
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100">
                            {['Direito', 'Esquerdo'].map((side) => {
                                const key = side === 'Direito' ? 'r' : 'l';
                                return (
                                    <div key={key} className="space-y-6">
                                        <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                                            <div className="h-8 w-8 rounded-xl bg-white flex items-center justify-center text-purple-600 shadow-sm border border-slate-100 font-black text-xs">{side[0]}</div>
                                            <h6 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Apoio Unipodal {side}</h6>
                                        </div>
                                        <div className="space-y-4">
                                            {[
                                                { label: 'Equilíbrio', id: 'balance' },
                                                { label: 'Controle Motor', id: 'control' },
                                                { label: 'Queda Pélvica', id: 'pelvic_drop' },
                                            ].map(test => (
                                                <div key={test.id} className="flex items-center justify-between">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{test.label}</span>
                                                    <Select
                                                        value={watch(`protocols.coluna_lombar.functional.unipodal_${key}.${test.id}`) || 'normal'}
                                                        onValueChange={(v) => updateField(`protocols.coluna_lombar.functional.unipodal_${key}.${test.id}`, v)}
                                                    >
                                                        <SelectTrigger className="w-32 h-9 bg-white rounded-xl text-[10px] font-black uppercase tracking-tight">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="normal" className="text-[10px] font-black uppercase">Normal</SelectItem>
                                                            <SelectItem value="reduced" className="text-[10px] font-black uppercase">Reduzido</SelectItem>
                                                            <SelectItem value="absent" className="text-[10px] font-black uppercase">Ausente</SelectItem>
                                                            {test.id === 'control' && <SelectItem value="poor" className="text-[10px] font-black uppercase">Pobre</SelectItem>}
                                                            {test.id === 'pelvic_drop' && <SelectItem value="increased" className="text-[10px] font-black uppercase">Aumentada</SelectItem>}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </TabsContent>

                {/* ABA 2: SENTADO (Neurológico) */}
                <TabsContent value="sitting" className="space-y-10 focus-visible:outline-none">

                    <div className="grid md:grid-cols-2 gap-10">
                        {/* REFLEXOS */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 ml-2">
                                <Zap className="h-4 w-4 text-amber-500" />
                                <h5 className="font-black text-slate-700 uppercase text-[11px] tracking-widest">Reflexos (Osteotendíneos)</h5>
                            </div>

                            <div className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100 space-y-4">
                                {[
                                    { id: 'patelar', label: 'Patelar', roots: 'L3, L4' },
                                    { id: 'tibial_posterior', label: 'Tibial Posterior', roots: 'L4, L5' },
                                    { id: 'semitendineo', label: 'Semitendíneo', roots: 'L5, S1' },
                                    { id: 'biceps_femoral', label: 'Bíceps Femoral', roots: 'S1, S2' },
                                    { id: 'aquileu', label: 'Aquileu', roots: 'S1, S2' }
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
                                                        value={watch(`protocols.coluna_lombar.neuro.reflexes.${ref.id}_${side}`) || 'normal'}
                                                        onValueChange={(v) => updateField(`protocols.coluna_lombar.neuro.reflexes.${ref.id}_${side}`, v)}
                                                    >
                                                        <SelectTrigger className="w-full h-9 bg-slate-50 border-none shadow-none text-right font-black text-[9px] uppercase rounded-xl">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent align="end">
                                                            <SelectItem value="normal" className="text-[9px] font-black uppercase text-emerald-600">Normal (2+)</SelectItem>
                                                            <SelectItem value="hiper" className="text-[9px] font-black uppercase text-amber-600">Hiper (3+/4+)</SelectItem>
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

                        {/* MIÓTOMOS */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 ml-2">
                                <Activity className="h-4 w-4 text-blue-500" />
                                <h5 className="font-black text-slate-700 uppercase text-[11px] tracking-widest">Miótomos (Força/Déficit)</h5>
                            </div>

                            <div className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-sm">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Raíz / Músculo</th>
                                            <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">D</th>
                                            <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">E</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {[
                                            { root: 'L2', muscle: 'Iliopsoas', action: 'Flexão Quadril' },
                                            { root: 'L3', muscle: 'Quadríceps', action: 'Extensão Joelho' },
                                            { root: 'L4', muscle: 'Tibial Ant.', action: 'Dorsiflexão' },
                                            { root: 'L5', muscle: 'Ext. Hálux', action: 'Ext. Hálux' },
                                            { root: 'S1', muscle: 'Tríceps Sur.', action: 'Flexão Plant.' },
                                        ].map((item) => (
                                            <tr key={item.root} className="group hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black text-slate-900 uppercase leading-none mb-1">{item.root} - {item.muscle}</span>
                                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{item.action}</span>
                                                    </div>
                                                </td>
                                                {['d', 'e'].map((side) => (
                                                    <td key={side} className="px-4 py-4">
                                                        <div className="flex justify-center">
                                                            <Checkbox
                                                                className="h-6 w-6 rounded-lg data-[state=checked]:bg-rose-500 data-[state=checked]:border-rose-500"
                                                                checked={watch(`protocols.coluna_lombar.neuro.myotomes.${item.root}_${side}`) === 'WEAK'}
                                                                onCheckedChange={(c) => updateField(`protocols.coluna_lombar.neuro.myotomes.${item.root}_${side}`, c ? 'WEAK' : 'NORMAL')}
                                                            />
                                                        </div>
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-10 pt-6 border-t border-slate-50">
                        {/* DERMÁTOMOS */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 ml-2">
                                <div className="h-8 w-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 shadow-sm border border-purple-200">✋</div>
                                <h5 className="font-black text-slate-700 uppercase text-[11px] tracking-widest">Dermátomos (Sensibilidade)</h5>
                            </div>

                            <div className="bg-slate-50/50 p-4 pt-8 rounded-[3rem] border border-slate-100 flex flex-col items-center">
                                <InteractiveDermatomeMap
                                    selected={watch('protocols.coluna_lombar.neuro.dermatomes') || []}
                                    onSelectionChange={(val) => updateField('protocols.coluna_lombar.neuro.dermatomes', val)}
                                    debug={true}
                                />
                            </div>

                        </div>

                        {/* TENSÃO NEURAL */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 ml-2">
                                <Info className="h-4 w-4 text-slate-400" />
                                <h5 className="font-black text-slate-700 uppercase text-[11px] tracking-widest">Testes de Tensão Neural</h5>
                            </div>

                            <div className="space-y-3">
                                {[
                                    { id: 'slr', label: 'SLR (Elevação Perna Reta)', type: 'Nervo Ciático' },
                                    { id: 'slump', label: 'Slump Test (Pos. Sentada)', type: 'Dural / Ciático' },
                                    { id: 'pkb', label: 'Prone Knee Bend (Femoral)', type: 'Nervo Femoral' }
                                ].map(test => (
                                    <div key={test.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-purple-200 transition-all">
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{test.label}</span>
                                            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">{test.type}</span>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100 group-hover:bg-white group-hover:border-purple-100 transition-all">
                                                <Checkbox
                                                    id={`${test.id}-d`}
                                                    checked={watch(`protocols.coluna_lombar.neuro.tension.${test.id}_d`)}
                                                    onCheckedChange={(c) => updateField(`protocols.coluna_lombar.neuro.tension.${test.id}_d`, c)}
                                                    className="h-4 w-4"
                                                />
                                                <Label htmlFor={`${test.id}-d`} className="text-[10px] font-black text-slate-400 cursor-pointer">D</Label>
                                            </div>
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100 group-hover:bg-white group-hover:border-purple-100 transition-all">
                                                <Checkbox
                                                    id={`${test.id}-e`}
                                                    checked={watch(`protocols.coluna_lombar.neuro.tension.${test.id}_e`)}
                                                    onCheckedChange={(c) => updateField(`protocols.coluna_lombar.neuro.tension.${test.id}_e`, c)}
                                                    className="h-4 w-4"
                                                />
                                                <Label htmlFor={`${test.id}-e`} className="text-[10px] font-black text-slate-400 cursor-pointer">E</Label>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* ABA 3: DEITADO (Palpação, Mecânicos, SIJ, Capacity) */}
                <TabsContent value="lying" className="space-y-10 focus-visible:outline-none">

                    {/* PALPAÇÃO */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 ml-2">
                            <div className="h-2 w-2 rounded-full bg-purple-600" />
                            <h5 className="font-black text-slate-700 uppercase text-[11px] tracking-widest">Palpação & Tecidos Moles</h5>
                        </div>
                        <div className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100 shadow-inner">
                            <textarea
                                {...register('protocols.coluna_lombar.palpation')}
                                className="w-full min-h-[120px] bg-transparent border-none focus:ring-0 text-sm font-medium text-slate-700 placeholder:text-slate-300 placeholder:uppercase placeholder:text-[10px] placeholder:font-black placeholder:tracking-widest"
                                placeholder="Descreva trigger points, espasmos, mobilidade acessória (PA), dor à palpação..."
                            />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-10 pt-6 border-t border-slate-50">
                        {/* MECÂNICOS & INSTABILIDADE */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 ml-2">
                                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                <h5 className="font-black text-slate-700 uppercase text-[11px] tracking-widest">Instabilidade & Controle</h5>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="flex flex-col bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:border-purple-200 transition-all">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">Instabilidade (Prona)</span>
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="prone_instability"
                                                className="h-6 w-6 rounded-lg data-[state=checked]:bg-rose-500 data-[state=checked]:border-rose-500"
                                                checked={watch(`protocols.coluna_lombar.stability.prone_instability`)}
                                                onCheckedChange={(c) => updateField(`protocols.coluna_lombar.stability.prone_instability`, c)}
                                            />
                                            <Label htmlFor="prone_instability" className="text-[10px] font-black text-slate-400 cursor-pointer">Positivo</Label>
                                        </div>
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Redução de dor ao contrair extensores</p>
                                </div>

                                <div className="flex flex-col bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:border-purple-200 transition-all">
                                    <div className="flex flex-col mb-3 border-b border-slate-50 pb-2">
                                        <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">Quadrante (Kemp)</span>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Compressão facetária dinâmica</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['d', 'e'].map((side) => (
                                            <div key={side} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                                                <Checkbox
                                                    id={`quadrant-${side}`}
                                                    checked={watch(`protocols.coluna_lombar.stability.quadrant_${side}`)}
                                                    onCheckedChange={(c) => updateField(`protocols.coluna_lombar.stability.quadrant_${side}`, c)}
                                                    className="h-4 w-4"
                                                />
                                                <Label htmlFor={`quadrant-${side}`} className="text-[10px] font-black text-slate-400 cursor-pointer">{side.toUpperCase()}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                                <h6 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Rigidez Rotadores (HHD)</h6>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="relative">
                                        <Input
                                            {...register('protocols.coluna_lombar.stability.rotator_stiff_l')}
                                            placeholder="0.0"
                                            className="h-10 bg-slate-50 border-none rounded-xl font-black text-center text-slate-800 pr-10"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300">L (º)</span>
                                    </div>
                                    <div className="relative">
                                        <Input
                                            {...register('protocols.coluna_lombar.stability.rotator_stiff_r')}
                                            placeholder="0.0"
                                            className="h-10 bg-slate-50 border-none rounded-xl font-black text-center text-slate-800 pr-10"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300">R (º)</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CLUSTER LASLETT */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 ml-2">
                                <div className="h-2 w-2 rounded-full bg-purple-600" />
                                <h5 className="font-black text-slate-700 uppercase text-[11px] tracking-widest">Sacroilíaca (Cluster Laslett)</h5>
                            </div>

                            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 space-y-6 shadow-sm">
                                <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-2xl border border-purple-100">
                                    <Info className="h-5 w-5 text-purple-600" />
                                    <p className="text-[9px] font-bold text-purple-700 uppercase leading-snug tracking-tighter">
                                        3/6 testes positivos é sugestivo de <span className="text-purple-900 font-black">Disfunção da SIJ</span>.
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: 'distraction', label: 'Distração' },
                                        { id: 'compression', label: 'Compressão' },
                                        { id: 'thigh_thrust', label: 'Thigh Thrust' },
                                        { id: 'sacral_thrust', label: 'Sacral Thrust' },
                                        { id: 'gaenslen_d', label: 'Gaenslen (D)' },
                                        { id: 'gaenslen_e', label: 'Gaenslen (E)' },
                                        { id: 'faber_d', label: 'FABER (D)' },
                                        { id: 'faber_e', label: 'FABER (E)' },
                                    ].map(test => (
                                        <div key={test.id} className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-xl hover:bg-slate-50 transition-colors">
                                            <Checkbox
                                                id={`laslett-${test.id}`}
                                                className="h-5 w-5"
                                                checked={watch(`protocols.coluna_lombar.laslett.${test.id}`)}
                                                onCheckedChange={(c) => updateField(`protocols.coluna_lombar.laslett.${test.id}`, c)}
                                            />
                                            <Label htmlFor={`laslett-${test.id}`} className="text-[10px] font-black text-slate-500 uppercase cursor-pointer hover:text-slate-800 transition-colors">{test.label}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CAPACITY / RESISTÊNCIA */}
                    <div className="space-y-6 pt-6 border-t border-slate-50">
                        <div className="flex items-center justify-between ml-2">
                            <div className="flex items-center gap-3">
                                <Dumbbell className="h-4 w-4 text-orange-600" />
                                <h5 className="font-black text-slate-700 uppercase text-[11px] tracking-widest">Resistência Muscular (Capacity)</h5>
                            </div>
                            <Badge variant="outline" className="text-[9px] font-black border-orange-100 text-orange-400">UNIDADE: SEGUNDOS</Badge>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            {[
                                { id: 'sorensen', label: 'Extensores (Sorensen)', pos: 'Prono' },
                                { id: 'plank', label: 'Prancha Frontal', pos: 'Prono' },
                                { id: 'bridge', label: 'Ponte Unilateral', pos: 'Supino' }
                            ].map(test => (
                                <div key={test.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:border-orange-200 transition-all group">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{test.label}</span>
                                        <Badge className="bg-slate-100 text-slate-400 border-none text-[8px] font-black uppercase tracking-widest">{test.pos}</Badge>
                                    </div>
                                    <div className="relative">
                                        <Input
                                            {...register(`protocols.coluna_lombar.capacity.${test.id}`)}
                                            placeholder="0"
                                            className="h-12 bg-slate-50 border-none rounded-2xl font-black text-center text-xl text-orange-600 focus:bg-white focus:ring-2 focus:ring-orange-200"
                                            type="number"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">SEG</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </TabsContent>
            </Tabs>
        </div>
    );
}
