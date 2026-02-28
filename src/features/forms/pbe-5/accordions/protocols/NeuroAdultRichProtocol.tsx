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
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
    Footprints, Accessibility, Gauge, History, Search,
    Eye, Speech, AlertTriangle, CheckCircle2, Heart,
    Smartphone, Home, Users, PenTool, Dumbbell, Brain,
    ShieldAlert, Layers, Activity, Zap, Scale, Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import { InteractiveDermatomeMap } from "../../components/neurological/InteractiveDermatomeMap";
import { Textarea } from "@/components/ui/textarea";

export function NeuroAdultRichProtocol() {
    const { register, watch, setValue } = useFormContext();
    const data = watch('neuro_adult') || {};

    const updateField = (path: string, val: any) => {
        setValue(`neuro_adult.${path}`, val, { shouldDirty: true, shouldValidate: true });
    };

    const ASHWORTH_MODIFIED = [
        { value: "0", label: "0 - Normal" },
        { value: "1", label: "1 - Leve" },
        { value: "1+", label: "1+ - Leve+" },
        { value: "2", label: "2 - Moderado" },
        { value: "3", label: "3 - Grave" },
        { value: "4", label: "4 - Rigidez" },
    ];

    const BRUNNSTROM_STAGES = [
        { value: "1", label: "Fase 1: Flacidez total" },
        { value: "2", label: "Fase 2: Início de sinergias básicas" },
        { value: "3", label: "Fase 3: Sinergia voluntária" },
        { value: "4", label: "Fase 4: Movimentos fora de sinergia" },
        { value: "5", label: "Fase 5: Combinações mais complexas" },
        { value: "6", label: "Fase 6: Coordenação quase normal" },
    ];

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            {/* REFERENCIAL ACADÊMICO */}
            <div className="flex items-center gap-4 bg-indigo-50/50 p-6 rounded-[2.5rem] border border-indigo-100/50">
                <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                    <History className="h-6 w-6" />
                </div>
                <div className="flex-1">
                    <h5 className="text-[11px] font-black text-indigo-900 uppercase tracking-widest">Base de Evidência Científica</h5>
                    <p className="text-[10px] font-bold text-indigo-700/70 leading-relaxed uppercase tracking-tighter">
                        Protocolo baseado no <span className="text-indigo-900">NIH Stroke Scale</span>, <span className="text-indigo-900">Brunnström Approach</span> e diretrizes da <span className="text-indigo-900">WFNR</span>.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="clinical" className="w-full">
                <div className="flex justify-center mb-8">
                    <TabsList className="bg-slate-100/50 p-1.5 rounded-2xl h-auto border border-slate-100 shadow-inner gap-1">
                        <TabsTrigger value="clinical" className="rounded-xl px-6 py-2.5 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
                            🧠 Cognição/Sensório
                        </TabsTrigger>
                        <TabsTrigger value="motor" className="rounded-xl px-6 py-2.5 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
                            💪 Motor/Tônus
                        </TabsTrigger>
                        <TabsTrigger value="balance" className="rounded-xl px-6 py-2.5 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
                            ⚖️ Equilíbrio
                        </TabsTrigger>
                        <TabsTrigger value="function" className="rounded-xl px-6 py-2.5 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
                            ♿ Funcionalidade
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* ABA 1: COGNIÇÃO E SENSÓRIO */}
                <TabsContent value="clinical" className="space-y-10 outline-none">
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 ml-2">
                                    <Brain className="h-4 w-4 text-indigo-500" />
                                    <h5 className="font-black text-slate-700 uppercase text-[11px] tracking-widest">Cognição (MEEM Resumido)</h5>
                                </div>
                                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { id: 'orientation', label: 'Orientação T/E', max: 10 },
                                            { id: 'memory', label: 'Memória Imediata', max: 3 },
                                            { id: 'attention', label: 'Atenção/Cálculo', max: 5 },
                                            { id: 'evocation', label: 'Evocação', max: 3 },
                                        ].map(item => (
                                            <div key={item.id} className="space-y-2">
                                                <Label className="text-[9px] font-black text-slate-400 uppercase ml-1">{item.label}</Label>
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        {...register(`neuro_adult.cognition.${item.id}`)}
                                                        className="h-10 bg-slate-50 border-none rounded-xl font-black text-center text-slate-800 pr-10"
                                                        placeholder="0"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300">/{item.max}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-900 uppercase">Score Total MEEM:</span>
                                        <Badge className="bg-indigo-600 text-white font-black text-lg px-4 py-1 rounded-xl">
                                            {(Number(data.cognition?.orientation) || 0) +
                                                (Number(data.cognition?.memory) || 0) +
                                                (Number(data.cognition?.attention) || 0) +
                                                (Number(data.cognition?.evocation) || 0)} / 30
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 ml-2">
                                    <ShieldAlert className="h-4 w-4 text-rose-500" />
                                    <h5 className="font-black text-slate-700 uppercase text-[11px] tracking-widest">Escalas de Urgência (GCS & NIHSS)</h5>
                                </div>
                                <div className="bg-rose-50/30 p-6 rounded-[2.5rem] border border-rose-100/50 space-y-6">
                                    {/* GLASGOW */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center px-1">
                                            <span className="text-[10px] font-black uppercase text-rose-900">Glasgow Coma Scale (GCS)</span>
                                            <Badge className="bg-rose-600 text-white text-[10px] rounded-lg px-2">Total: {(Number(data.cognition?.gcs_eye) || 0) + (Number(data.cognition?.gcs_verbal) || 0) + (Number(data.cognition?.gcs_motor) || 0)}</Badge>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { id: 'eye', label: 'AO (1-4)', max: 4 },
                                                { id: 'verbal', label: 'RV (1-5)', max: 5 },
                                                { id: 'motor', label: 'RM (1-6)', max: 6 }
                                            ].map(f => (
                                                <div key={f.id} className="bg-white p-2 rounded-xl border border-rose-100 flex flex-col items-center">
                                                    <span className="text-[8px] font-black text-rose-400 uppercase">{f.label}</span>
                                                    <Input
                                                        type="number"
                                                        {...register(`neuro_adult.cognition.gcs_${f.id}`)}
                                                        className="h-8 text-center font-black border-none bg-rose-50/50 rounded-lg text-xs"
                                                        placeholder="0"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* NIHSS */}
                                    <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-rose-100">
                                        <span className="text-[10px] font-black uppercase text-rose-900">Score NIHSS (AVC)</span>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                {...register('neuro_adult.nihss_score')}
                                                className="w-16 h-10 text-center font-black bg-rose-50 border-none rounded-xl"
                                                placeholder="0"
                                            />
                                            <span className="text-[10px] font-black text-rose-300">/ 42</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* PARES CRANIANOS */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 ml-2">
                                    <Eye className="h-4 w-4 text-emerald-500" />
                                    <h5 className="font-black text-slate-700 uppercase text-[11px] tracking-widest">Nervos Cranianos (Triagem)</h5>
                                </div>
                                <div className="bg-emerald-50/30 p-6 rounded-[2.5rem] border border-emerald-100/50 grid grid-cols-2 gap-3">
                                    {[
                                        { id: 'ii_iii', label: 'II/III (Pupilas)' },
                                        { id: 'iii_iv_vi', label: 'III/IV/VI (Ocular)' },
                                        { id: 'v_vii', label: 'V/VII (Facial)' },
                                        { id: 'ix_x_xii', label: 'IX/X/XII (Deglut/Língua)' }
                                    ].map(nerve => (
                                        <div key={nerve.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-emerald-100">
                                            <span className="text-[9px] font-black text-slate-500 uppercase">{nerve.label}</span>
                                            <Checkbox
                                                className="h-5 w-5 rounded-md border-emerald-200 data-[state=checked]:bg-emerald-500"
                                                checked={data.cranial_nerves?.[nerve.id]}
                                                onCheckedChange={(c) => updateField(`cranial_nerves.${nerve.id}`, !!c)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 ml-2">
                                <Layers className="h-4 w-4 text-indigo-500" />
                                <h5 className="font-black text-slate-700 uppercase text-[11px] tracking-widest">Sensibilidade (Dermátomos)</h5>
                            </div>
                            <div className="bg-slate-50/50 p-6 pt-10 rounded-[3.5rem] border border-slate-100 flex flex-col items-center">
                                <InteractiveDermatomeMap
                                    selected={data.sensory?.dermatomes || []}
                                    onSelectionChange={(val: string[]) => updateField('sensory.dermatomes', val)}
                                    debug={false}
                                />
                                <div className="mt-8 grid grid-cols-2 gap-4 w-full">
                                    {['Superficial', 'Profunda', 'Propriocepção'].map(type => (
                                        <div key={type} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-3">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block text-center border-b border-slate-50 pb-2">{type}</span>
                                            <div className="flex justify-center gap-3">
                                                {['N', 'A', 'S'].map(v => (
                                                    <button
                                                        key={v}
                                                        onClick={() => updateField(`sensory.${type.toLowerCase()}`, v)}
                                                        className={cn(
                                                            "w-8 h-8 rounded-xl text-[10px] font-black transition-all",
                                                            data.sensory?.[type.toLowerCase()] === v ? "bg-indigo-600 text-white shadow-lg" : "bg-slate-50 text-slate-300"
                                                        )}
                                                    >{v}</button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* ABA 2: MOTOR E TÔNUS */}
                <TabsContent value="motor" className="space-y-10 outline-none">
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* COLUNA 1 */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 ml-2">
                                <Activity className="h-4 w-4 text-rose-500" />
                                <h5 className="font-black text-slate-700 uppercase text-[11px] tracking-widest">Brunnström & Ashworth</h5>
                            </div>
                            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
                                {['Membro Superior', 'Mão', 'Membro Inferior'].map(segment => {
                                    const key = segment.toLowerCase().replace(' ', '_');
                                    return (
                                        <div key={segment} className="space-y-3">
                                            <div className="flex justify-between items-center px-1">
                                                <Label className="text-[10px] font-black text-slate-500 uppercase">{segment}</Label>
                                            </div>
                                            <Select
                                                value={data.brunnstrom?.[key] || "1"}
                                                onValueChange={(v) => updateField(`brunnstrom.${key}`, v)}
                                            >
                                                <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold text-[11px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {BRUNNSTROM_STAGES.map(s => (
                                                        <SelectItem key={s.value} value={s.value} className="font-bold uppercase text-[10px] py-3">{s.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="bg-indigo-50/50 p-6 rounded-[2.5rem] border border-indigo-100 space-y-6">
                                <h6 className="text-[10px] font-black uppercase text-indigo-900 tracking-widest ml-2">Ashworth & Sinais Piramidais</h6>

                                <div className="space-y-3">
                                    {['Flexores Cotovelo', 'Plante-flexores'].map(m => (
                                        <div key={m} className="space-y-2">
                                            <Label className="text-[9px] font-black text-slate-400 uppercase ml-2">{m}</Label>
                                            <div className="flex gap-1">
                                                {ASHWORTH_MODIFIED.map(opt => (
                                                    <button
                                                        key={opt.value}
                                                        onClick={() => updateField(`ashworth.${m}`, opt.value)}
                                                        className={cn(
                                                            "flex-1 h-8 rounded-lg text-[8px] font-black transition-all",
                                                            data.ashworth?.[m] === opt.value ? "bg-indigo-600 text-white shadow-md" : "bg-white text-slate-300 border border-slate-50"
                                                        )}
                                                    >
                                                        {opt.value}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-4 border-t border-indigo-100/50 grid grid-cols-2 gap-4">
                                    {[
                                        { id: 'babinski', label: 'Babinski' },
                                        { id: 'hoffmann', label: 'Hoffmann' }
                                    ].map(sign => (
                                        <div key={sign.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-indigo-100 shadow-sm">
                                            <span className="text-[9px] font-black text-indigo-900 uppercase">{sign.label}</span>
                                            <div className="flex gap-1">
                                                {['-', '+'].map(v => (
                                                    <button
                                                        key={v}
                                                        onClick={() => updateField(`reflexes.${sign.id}`, v)}
                                                        className={cn(
                                                            "w-6 h-6 rounded-md text-[10px] font-black",
                                                            data.reflexes?.[sign.id] === v ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-300"
                                                        )}
                                                    >{v}</button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center gap-3 ml-2">
                                    <ShieldAlert className="h-4 w-4 text-orange-500" />
                                    <h5 className="font-black text-slate-700 uppercase text-[11px] tracking-widest">Escala de Tardieu</h5>
                                </div>
                            </div>
                        </div>

                        {/* COLUNA 2: FORÇA (MIÓTOMOS) E TESTES NEURAIS */}
                        <div className="space-y-10">
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 ml-2">
                                    <Dumbbell className="h-4 w-4 text-emerald-500" />
                                    <h5 className="font-black text-slate-700 uppercase text-[11px] tracking-widest">Controle Motor (Miótomos)</h5>
                                </div>
                                <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-4">
                                    {[
                                        { id: 'l2', label: 'L2 (Flexão Quadril)' },
                                        { id: 'l3', label: 'L3 (Extensão Joelho)' },
                                        { id: 'l4', label: 'L4 (Dorsiflexão)' },
                                        { id: 'l5', label: 'L5 (Ext. Hálux)' },
                                        { id: 's1', label: 'S1 (Planta/Eversão)' },
                                    ].map(myo => (
                                        <div key={myo.id} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-2xl border border-slate-100 group hover:bg-white hover:border-emerald-200 transition-all">
                                            <span className="text-[10px] font-black text-slate-500 uppercase">{myo.label}</span>
                                            <div className="flex gap-1 bg-white p-1 rounded-xl shadow-inner">
                                                {['0', '1', '2', '3', '4', '5'].map(v => (
                                                    <button
                                                        key={v}
                                                        onClick={() => updateField(`myotomes.${myo.id}`, v)}
                                                        className={cn(
                                                            "w-7 h-7 rounded-lg text-[10px] font-black transition-all",
                                                            data.myotomes?.[myo.id] === v ? "bg-emerald-600 text-white shadow-md" : "bg-transparent text-slate-300"
                                                        )}
                                                    >{v}</button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center gap-3 ml-2">
                                    <Zap className="h-4 w-4 text-rose-500" />
                                    <h5 className="font-black text-slate-700 uppercase text-[11px] tracking-widest">Testes de Tensão Neural</h5>
                                </div>
                                <div className="bg-slate-900 p-8 rounded-[3rem] text-white space-y-4 shadow-xl">
                                    {[
                                        { id: 'slump', label: 'Slump Test' },
                                        { id: 'lassegue', label: 'Lassègue (SLR)' },
                                        { id: 'unlp_radial', label: 'ULNT1 (N. Radial)' }
                                    ].map(test => (
                                        <div key={test.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{test.label}</span>
                                            <div className="flex gap-2">
                                                {['NEG', 'POS'].map(v => (
                                                    <button
                                                        key={v}
                                                        onClick={() => updateField(`neural_tension.${test.id}`, v)}
                                                        className={cn(
                                                            "px-4 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all",
                                                            data.neural_tension?.[test.id] === v
                                                                ? (v === 'POS' ? "bg-rose-600 text-white" : "bg-emerald-600 text-white")
                                                                : "bg-white/10 text-slate-500"
                                                        )}
                                                    >{v}</button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* ABA 3: EQUILÍBRIO */}
                <TabsContent value="balance" className="space-y-10 outline-none">
                    <div className="grid md:grid-cols-2 gap-10">
                        <Card className="p-10 rounded-[4rem] border-slate-100 shadow-xl bg-white space-y-6">
                            <div className="flex items-center gap-3">
                                <Scale className="h-5 w-5 text-indigo-500" />
                                <h5 className="font-black text-slate-700 uppercase text-[11px] tracking-widest">Escala PASS (Stroke)</h5>
                            </div>
                            <div className="bg-indigo-50 p-8 rounded-[3rem] flex flex-col items-center">
                                <span className="text-5xl font-black text-indigo-900">{data.pass_score || 0}</span>
                                <span className="text-[10px] font-black text-indigo-300 uppercase mt-2">Score Total / 36</span>
                            </div>
                            <Button className="w-full h-12 bg-indigo-950 text-white rounded-2xl font-black text-[10px] uppercase">AVALIAR ITENS PASS</Button>
                        </Card>

                        <div className="space-y-6">
                            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 px-1">
                                        <Target className="h-4 w-4 text-indigo-400" />
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Coorden. (Ataxia)</span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        {[
                                            { id: 'index_nose', label: 'Dedo-Nariz' },
                                            { id: 'heel_shin', label: 'Calcanhar-Canela' },
                                            { id: 'diado', label: 'Diadococinésia' }
                                        ].map(test => (
                                            <div key={test.id} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                                                <span className="text-[10px] font-black text-slate-600 uppercase">{test.label}</span>
                                                <div className="flex gap-1">
                                                    {['N', 'D', 'A'].map(v => (
                                                        <button
                                                            key={v}
                                                            onClick={() => updateField(`coordination.${test.id}`, v)}
                                                            className={cn(
                                                                "w-7 h-7 rounded-lg text-[10px] font-black transition-all",
                                                                data.coordination?.[test.id] === v ? "bg-indigo-600 text-white shadow-md" : "bg-white text-slate-300"
                                                            )}
                                                        >{v}</button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 space-y-2">
                                    <Label className="text-[9px] font-black text-slate-400 uppercase">10m Walk Test</Label>
                                    <Input {...register('neuro_adult.walk_10m')} className="h-12 bg-slate-50 border-none rounded-2xl text-center font-black" placeholder="0.0s" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-black text-slate-400 uppercase">TUG Test</Label>
                                    <Input {...register('neuro_adult.tug')} className="h-12 bg-slate-50 border-none rounded-2xl text-center font-black" placeholder="0.0s" />
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl text-center text-[10px] font-bold text-slate-400 uppercase tracking-tighter italic">
                                "Velocidade de marcha: 6º sinal vital."
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* ABA 4: FUNCIONALIDADE */}
                <TabsContent value="function" className="space-y-10 outline-none">
                    <div className="grid md:grid-cols-2 gap-8">
                        <Card className="p-8 rounded-[3.5rem] border-slate-100 shadow-sm space-y-6">
                            <h4 className="font-black text-slate-900 uppercase text-[11px] tracking-widest text-center">Indice de Barthel</h4>
                            <div className="bg-slate-50 p-8 rounded-[2.5rem] flex flex-col items-center">
                                <span className="text-4xl font-black text-slate-800">{data.barthel_score || 0} / 100</span>
                                <Progress value={data.barthel_score || 0} className="w-full h-2 mt-4" />
                            </div>
                            <Button className="w-full h-12 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase">CHECKLIST AVDs</Button>
                        </Card>

                        <Card className="p-8 rounded-[3.5rem] border-slate-100 shadow-sm space-y-6">
                            <h4 className="font-black text-slate-900 uppercase text-[11px] tracking-widest text-center">Rankin Modificado</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {["0", "1", "2", "3", "4", "5"].map(v => (
                                    <button
                                        key={v}
                                        onClick={() => updateField('rankin_level', v)}
                                        className={cn("p-2 rounded-xl text-[10px] font-black", data.rankin_level === v ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-400")}
                                    >G{v}</button>
                                ))}
                            </div>
                        </Card>
                    </div>

                    <Card className="p-10 rounded-[4rem] bg-indigo-900 text-white shadow-2xl space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-10">
                            <Brain className="h-48 w-48" />
                        </div>
                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                                    <PenTool className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black uppercase tracking-tight">Parecer Clínico Axiom</h4>
                                    <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Síntese Neurofuncional e Prognóstico</p>
                                </div>
                            </div>
                            <Textarea
                                {...register('neuro_adult.clinical_verdict')}
                                className="min-h-[150px] bg-white/5 border-none rounded-[2rem] p-6 text-sm text-indigo-50 focus:bg-white/10"
                                placeholder="Descreva a fundamentação neurofisiológica..."
                            />
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
