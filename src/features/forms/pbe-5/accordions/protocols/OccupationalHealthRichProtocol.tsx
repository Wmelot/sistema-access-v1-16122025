"use client";

import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Briefcase, Activity, Target, ShieldCheck, Info, UserCheck,
    Construction, AlertTriangle, Ruler, Scale, RefreshCw, Layers,
    MousePointer2, Dumbbell, ClipboardList, PenTool, Search, HardHat,
    Gem, Landmark, Zap, Brain, Wind, Thermometer
} from "lucide-react";
import { cn } from "@/lib/utils";

export function OccupationalHealthRichProtocol() {
    const { register, watch, setValue, control } = useFormContext();
    const data = watch('occupational_health') || {};

    const updateField = (path: string, val: any) => {
        setValue(`occupational_health.${path}`, val, { shouldDirty: true, shouldValidate: true });
    };

    const ERGONOMIC_RISK_QUALITATIVE = [
        { value: "low", label: "Baixo Risco", color: "bg-emerald-500", desc: "Aceitável (NR-17)" },
        { value: "moderate", label: "Moderado", color: "bg-yellow-500", desc: "Investigação" },
        { value: "high", label: "Alto Risco", color: "bg-orange-500", desc: "Mudança em breve" },
        { value: "critical", label: "Crítico", color: "bg-rose-600", desc: "Imediato!" },
    ];

    return (
        <div className="space-y-12 animate-in fade-in duration-500">

            {/* REFERENCIAL ACADÊMICO / PERICIAL */}
            <div className="flex items-center gap-4 bg-amber-50/50 p-6 rounded-[2.5rem] border border-amber-100/50">
                <div className="h-12 w-12 rounded-2xl bg-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-200">
                    <Gem className="h-6 w-6" />
                </div>
                <div className="flex-1">
                    <h5 className="text-[11px] font-black text-amber-900 uppercase tracking-widest">Protocolo de Alta Performance Pericial</h5>
                    <p className="text-[10px] font-bold text-amber-700/70 leading-relaxed uppercase tracking-tighter">
                        Referenciado na <span className="text-amber-900 font-black">NR-17</span>, ferramentas <span className="text-amber-900 font-black">RULA/REBA</span>, Equation <span className="text-amber-900 font-black">NIOSH</span> e Matriz de Nexo de <span className="text-amber-900 font-black">Meirelles</span>.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="ergonomy" className="w-full">
                <div className="flex justify-center mb-10 overflow-x-auto pb-4 scrollbar-hide">
                    <TabsList className="bg-slate-100/50 p-1.5 rounded-[2rem] h-auto border border-slate-100 shadow-inner gap-1">
                        <TabsTrigger value="occupational" className="rounded-[1.5rem] px-6 py-3 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-amber-600 data-[state=active]:text-white transition-all">
                            Histórico Profissiográfico
                        </TabsTrigger>
                        <TabsTrigger value="ergonomy" className="rounded-[1.5rem] px-6 py-3 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-amber-600 data-[state=active]:text-white transition-all">
                            Análise Ergonômica
                        </TabsTrigger>
                        <TabsTrigger value="forensic" className="rounded-[1.5rem] px-6 py-3 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-amber-600 data-[state=active]:text-white transition-all">
                            Perícia e Nexo Técnico
                        </TabsTrigger>
                        <TabsTrigger value="capacity" className="rounded-[1.5rem] px-6 py-3 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-amber-600 data-[state=active]:text-white transition-all">
                            Capacidade Funcional
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* ABA 1: HISTÓRICO E POSTURA */}
                <TabsContent value="occupational" className="space-y-10 outline-none">
                    <div className="grid md:grid-cols-2 gap-8">
                        <Card className="p-8 rounded-[3.5rem] border-slate-100 shadow-sm space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                                    <HardHat className="h-5 w-5" />
                                </div>
                                <h4 className="font-black text-slate-800 uppercase text-[11px] tracking-widest">Atividade Laboral</h4>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Cargo e Função</Label>
                                    <Input {...register('occupational_health.job_title')} className="h-14 bg-slate-50 border-none rounded-2xl px-6 font-black text-slate-700 focus:bg-white focus:ring-4 focus:ring-amber-50" placeholder="Ex: Analista de Sistemas" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Jornada (h/dia)</Label>
                                        <Input {...register('occupational_health.hours_per_day')} className="h-12 bg-slate-50 border-none rounded-xl text-center font-black" placeholder="8" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Tempo na Empresa</Label>
                                        <Input {...register('occupational_health.tenure')} className="h-12 bg-slate-50 border-none rounded-xl text-center font-black" placeholder="Anos/Meses" />
                                    </div>
                                </div>
                                <div className="pt-4 space-y-2">
                                    <Label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Tarefas de Alta Demanda</Label>
                                    <Textarea {...register('occupational_health.critical_tasks')} className="min-h-[120px] rounded-[2rem] bg-slate-50 border-none p-6 text-[11px] font-medium" placeholder="Descreva os gestos laborais que mais sobrecarregam o trabalhador..." />
                                </div>
                            </div>
                        </Card>

                        <div className="space-y-8">
                            <Card className="p-8 rounded-[3.5rem] border-slate-100 shadow-sm space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                                        <MousePointer2 className="h-5 w-5" />
                                    </div>
                                    <h4 className="font-black text-slate-800 uppercase text-[11px] tracking-widest">Padrão Dinâmico Laboral</h4>
                                </div>
                                <div className="space-y-3">
                                    {[
                                        { id: 'sitting', label: 'Sedestação (Sentado)' },
                                        { id: 'standing', label: 'Ortostase (Em Pé)' },
                                        { id: 'rep_mmii', label: 'Ciclos de MMII (Caminhada)' },
                                        { id: 'rep_mmss', label: 'Repetitividade (MMSS)' },
                                    ].map(item => (
                                        <div key={item.id} className="p-4 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between transition-all hover:bg-white group">
                                            <span className="text-[10px] font-black uppercase text-slate-700 tracking-tight ml-2">{item.label}</span>
                                            <div className="flex gap-1.5 p-1 bg-white rounded-xl shadow-sm border border-slate-100">
                                                {['B', 'M', 'A'].map(lvl => (
                                                    <button
                                                        key={lvl}
                                                        onClick={() => updateField(`workload.${item.id}`, lvl)}
                                                        className={cn(
                                                            "w-10 h-8 rounded-lg text-[9px] font-black uppercase transition-all",
                                                            data.workload?.[item.id] === lvl ? "bg-blue-600 text-white shadow-md" : "text-slate-300 hover:text-blue-400"
                                                        )}
                                                    >
                                                        {lvl}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            <Card className="p-8 rounded-[3.5rem] border-slate-100 shadow-sm space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
                                        <AlertTriangle className="h-5 w-5" />
                                    </div>
                                    <h4 className="font-black text-slate-800 uppercase text-[11px] tracking-widest">Riscos Ambientais & Psicossociais</h4>
                                </div>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { id: 'noise', label: 'Ruído Excessivo', icon: Wind },
                                            { id: 'vibration', label: 'Vibração (VCI/VMB)', icon: Activity },
                                            { id: 'heat', label: 'Calor/IBUTG', icon: Thermometer },
                                            { id: 'stress', label: 'Estresse Ment.', icon: Brain },
                                        ].map(risk => (
                                            <div key={risk.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 group">
                                                <div className="flex items-center gap-2">
                                                    <risk.icon className="h-3 w-3 text-slate-400 group-hover:text-rose-500 transition-colors" />
                                                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-tighter">{risk.label}</span>
                                                </div>
                                                <Checkbox
                                                    className="h-5 w-5 rounded-md border-slate-200 data-[state=checked]:bg-rose-500"
                                                    checked={data.environmental_risks?.[risk.id]}
                                                    onCheckedChange={(c) => updateField(`environmental_risks.${risk.id}`, !!c)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="pt-2">
                                        <Label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Apoio Psicossocial / Monotonia</Label>
                                        <div className="flex gap-2 mt-2">
                                            {['Irrisório', 'Moderado', 'Crítico'].map(lvl => (
                                                <button
                                                    key={lvl}
                                                    onClick={() => updateField('psychosocial_level', lvl)}
                                                    className={cn(
                                                        "flex-1 py-2 rounded-xl text-[9px] font-black uppercase transition-all",
                                                        data.psychosocial_level === lvl ? "bg-rose-600 text-white" : "bg-slate-50 text-slate-400"
                                                    )}
                                                >{lvl}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <div className="bg-emerald-50 p-6 rounded-[2.5rem] border border-emerald-100 flex items-center gap-4">
                                <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                                    <Activity className="h-5 w-5 animate-pulse" />
                                </div>
                                <p className="text-[9px] font-bold text-emerald-800 uppercase tracking-tighter leading-relaxed">
                                    "A análise da postura deve ser correlacionada com as pausas regulares e o uso de mobiliário ergonômico conforme NR-17."
                                </p>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* ABA 2: FERRAMENTAS ERGONÔMICAS */}
                <TabsContent value="ergonomy" className="space-y-10 outline-none">
                    <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                        <Card className="lg:col-span-2 p-10 rounded-[4.5rem] bg-white border border-slate-100 shadow-2xl space-y-12 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12">
                                <Ruler className="h-64 w-64 text-amber-900" />
                            </div>

                            <div className="relative z-10 space-y-12">
                                <div className="flex items-center gap-6 pb-10 border-b border-slate-100">
                                    <div className="h-16 w-16 bg-amber-600 rounded-[2rem] flex items-center justify-center text-white shadow-xl -rotate-6">
                                        <Layers className="h-8 w-8" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Escores Biomecânicos (EVD)</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Quantificação do Risco Físico Laboral</p>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-3 gap-8">
                                    {[
                                        { id: 'rula', label: 'RULA Score', desc: 'Membros Superiores', placeholder: '0-7' },
                                        { id: 'reba', label: 'REBA Score', desc: 'Corpo Inteiro', placeholder: '0-15' },
                                        { id: 'si', label: 'Strain Index', desc: 'Moore & Garg', placeholder: '0.0' },
                                    ].map(tool => (
                                        <div key={tool.id} className="space-y-4 p-8 bg-slate-50 rounded-[3rem] border border-slate-100 transition-all hover:bg-white hover:border-amber-300 hover:shadow-xl group">
                                            <div className="flex flex-col items-center gap-2">
                                                <Badge className="bg-amber-100 text-amber-700 border-none px-4 py-1 rounded-full text-[8px] font-black uppercase">{tool.label}</Badge>
                                                <p className="text-[9px] font-black text-slate-400 uppercase">{tool.desc}</p>
                                            </div>
                                            <Input
                                                type="number"
                                                {...register(`occupational_health.tools.${tool.id}`)}
                                                className="h-20 bg-white border-none rounded-[2rem] text-center font-black text-4xl text-amber-700 shadow-inner"
                                                placeholder={tool.placeholder}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <Card className="p-8 rounded-[3.5rem] bg-slate-900 text-white space-y-8 shadow-2xl border-none">
                                    <div className="flex items-center gap-3">
                                        <Scale className="h-5 w-5 text-amber-400" />
                                        <h4 className="font-black uppercase text-[10px] tracking-widest text-amber-100">Cálculo de NIOSH (Movimentação de Cargas)</h4>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        {[
                                            { id: 'h_dist', label: 'Distância Horiz' },
                                            { id: 'v_dist', label: 'Altura Vertical' },
                                            { id: 'v_travel', label: 'Deslocamento' },
                                            { id: 'angle', label: 'Ângulo Assimetria' },
                                        ].map(f => (
                                            <div key={f.id} className="space-y-2 bg-white/5 p-4 rounded-2xl border border-white/5">
                                                <Label className="text-[8px] font-black uppercase text-slate-500 tracking-widest">{f.label}</Label>
                                                <Input {...register(`occupational_health.tools.niosh.${f.id}`)} className="h-10 bg-white/10 border-none text-center font-black text-amber-400 rounded-xl" placeholder="0" />
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        </Card>

                        <div className="space-y-8 flex flex-col justify-between h-full">
                            <Card className="p-10 rounded-[4rem] bg-amber-50/50 border border-amber-100 shadow-sm space-y-10 flex-1">
                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-amber-900 uppercase tracking-widest flex items-center gap-2">
                                        Qualificação NR-17
                                    </h4>
                                    <div className="grid grid-cols-1 gap-3">
                                        {ERGONOMIC_RISK_QUALITATIVE.map(risk => (
                                            <button
                                                key={risk.value}
                                                onClick={() => updateField('risk_level', risk.value)}
                                                className={cn(
                                                    "p-5 rounded-[2.5rem] border text-left transition-all relative overflow-hidden group",
                                                    data.risk_level === risk.value ? "bg-white border-amber-500 shadow-xl ring-2 ring-amber-500/10" : "bg-white/40 border-slate-100"
                                                )}
                                            >
                                                <div className="flex items-center gap-4 relative z-10">
                                                    <div className={cn("w-3 h-3 rounded-full shrink-0", risk.color)} />
                                                    <div className="flex flex-col">
                                                        <span className={cn("text-[10px] font-black uppercase tracking-tight", data.risk_level === risk.value ? "text-amber-900" : "text-slate-400")}>{risk.label}</span>
                                                        <span className="text-[8px] font-bold text-slate-400 italic uppercase">{risk.desc}</span>
                                                    </div>
                                                </div>
                                                {data.risk_level === risk.value && <Zap className="absolute right-6 top-1/2 -translate-y-1/2 h-8 w-8 text-amber-500/10 rotate-12" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4 pt-10 border-t border-amber-200/30">
                                    <Label className="text-[9px] font-black text-amber-900/40 uppercase ml-2 tracking-widest">Ações Suportadas pela IA</Label>
                                    <Textarea
                                        {...register('occupational_health.actions')}
                                        className="h-[180px] rounded-[3rem] bg-white border-amber-200 p-8 text-[11px] font-medium text-amber-900 leading-relaxed shadow-sm"
                                        placeholder="Descreva as medidas corretivas imediatas e de médio prazo..."
                                    />
                                </div>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* ABA 3: PERÍCIA E NEXO (MANDATÓRIO PARA LAUDOS) */}
                <TabsContent value="forensic" className="space-y-10 outline-none">
                    <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10">
                        <Card className="p-12 rounded-[5rem] bg-slate-900 text-white shadow-2xl space-y-12 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 opacity-10 -rotate-12">
                                <Scale className="h-64 w-64 text-indigo-500" />
                            </div>

                            <div className="relative z-10 space-y-12">
                                <div className="flex items-center gap-6">
                                    <div className="h-16 w-16 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-indigo-900/20">
                                        <ShieldCheck className="h-8 w-8" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-black text-indigo-50 uppercase tracking-tight">Matriz de Nexo de Meirelles</h3>
                                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Causalidade Técnico-Pericial Jurídica</p>
                                    </div>
                                </div>

                                <div className="space-y-10">
                                    <div className="space-y-4">
                                        <h6 className="text-[10px] font-black uppercase tracking-widest text-indigo-300 ml-4 flex items-center gap-2">
                                            <Target className="h-4 w-4" /> Graduação de Concausa
                                        </h6>
                                        <div className="grid grid-cols-2 gap-4">
                                            {[
                                                { v: 'low', l: 'I - Leve (25%)', d: 'Concausalidade mínima' },
                                                { v: 'medium', l: 'II - Moderada (50%)', d: 'Contribuição relevante' },
                                                { v: 'high', l: 'III - Grave (75%)', d: 'Contribuição decisiva' },
                                                { v: 'direct', l: 'Nexo Direto (100%)', d: 'Causa exclusiva laboral' },
                                            ].map(item => (
                                                <button
                                                    key={item.v}
                                                    onClick={() => updateField('forensic.causality', item.v)}
                                                    className={cn(
                                                        "p-5 rounded-[2.5rem] border text-left transition-all",
                                                        data.forensic?.causality === item.v ? "bg-indigo-600 border-indigo-500 shadow-xl" : "bg-white/5 border-white/5 hover:bg-white/10"
                                                    )}
                                                >
                                                    <div className="flex flex-col">
                                                        <span className={cn("text-[10px] font-black uppercase", data.forensic?.causality === item.v ? "text-white" : "text-indigo-200")}>{item.l}</span>
                                                        <span className="text-[8px] font-bold text-indigo-400 italic uppercase">{item.d}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-6 bg-white/5 p-10 rounded-[4rem] border border-white/5">
                                        <h6 className="text-[10px] font-black uppercase tracking-widest text-indigo-300 flex items-center gap-2">
                                            <Brain className="h-4 w-4" /> Testes de Consistência e Simulação
                                        </h6>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {[
                                                { id: 'waddell', label: 'Sinais de Waddell', info: 'Lombalgia simulação' },
                                                { id: 'bell', label: 'Bell-Magendie', info: 'Nexo Motor-Sensitivo' },
                                                { id: 'consistency', label: 'Clínica x Queixa', info: 'Sincronia fisiopatológica' },
                                                { id: 'behavior', label: 'Comportamento Dor', info: 'Sinais não-verbais' },
                                            ].map(test => (
                                                <div key={test.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black text-indigo-100 uppercase tracking-tight">{test.label}</span>
                                                        <span className="text-[8px] font-bold text-indigo-500 uppercase">{test.info}</span>
                                                    </div>
                                                    <Checkbox
                                                        className="h-6 w-6 rounded-lg border-white/10 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
                                                        checked={data.forensic?.tests?.[test.id]}
                                                        onCheckedChange={(c) => updateField(`forensic.tests.${test.id}`, !!c)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <div className="space-y-8 flex flex-col items-center justify-center">
                            <Card className="p-10 rounded-[4.5rem] bg-white border border-slate-100 shadow-sm space-y-10 w-full animate-pulse-subtle">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 shadow-sm">
                                        <ClipboardList className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-800 uppercase text-[11px] tracking-widest italic">Assistência CIF / ICF</h4>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">O perito deve codificar a funcionalidade.</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <Label className="text-[9px] font-black text-slate-400 uppercase ml-3">Inserir Códigos Funcionais para Laudo</Label>
                                    <Input {...register('occupational_health.forensic.cif_codes')} className="h-16 bg-slate-50 border-none rounded-[1.5rem] px-8 font-black text-slate-700 italic focus:bg-white focus:ring-4 focus:ring-emerald-50" placeholder="S760, B280... Separation by commas." />
                                    <p className="text-[9px] font-black text-emerald-600 bg-emerald-50/50 p-4 rounded-2xl text-center uppercase tracking-tighter">
                                        "Lembre-se: O nexo técnico-epidemiológico (NTEP) será cruzado automaticamente com o CNAE da empresa."
                                    </p>
                                </div>
                            </Card>

                            <div className="bg-amber-600 p-10 rounded-[4.5rem] text-white shadow-2xl w-full space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center">
                                        <Scale className="h-6 w-6 text-amber-100" />
                                    </div>
                                    <h4 className="font-black uppercase text-[12px] tracking-widest">Conclusão do Parecer</h4>
                                </div>
                                <Textarea
                                    {...register('occupational_health.final_verdict')}
                                    className="h-[250px] bg-white/10 border-none rounded-[3rem] p-8 text-[11px] font-bold text-amber-50 placeholder:text-amber-200/40 leading-relaxed shadow-inner"
                                    placeholder="Redija o desfecho pericial aqui. Relacione os riscos encontrados com a lesão clínica..."
                                />
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* ABA 4: CAPACIDADE FUNCIONAL (DINAMOMETRIA) */}
                <TabsContent value="capacity" className="space-y-10 outline-none">
                    <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-10">
                        <Card className="p-10 rounded-[4rem] border-slate-100 shadow-sm space-y-10 relative overflow-hidden group">
                            <div className="absolute -right-6 -top-6 h-32 w-32 bg-slate-50 rounded-full group-hover:scale-150 transition-all duration-700"></div>
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="p-4 bg-slate-100 rounded-2xl text-slate-800 mb-6">
                                    <Dumbbell className="h-8 w-8" />
                                </div>
                                <h4 className="font-black text-slate-800 uppercase text-[12px] tracking-widest mb-2">Handgrip Dinamometria</h4>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight text-center max-w-[200px]">Capacidade Crítica de Preensão Palmar Laboral</p>

                                <div className="grid grid-cols-2 gap-8 w-full mt-10">
                                    {['Esquerda', 'Direita'].map(side => (
                                        <div key={side} className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase text-slate-400 block text-center tracking-widest">{side}</Label>
                                            <div className="relative">
                                                <Input
                                                    {...register(`occupational_health.capacity.handgrip_${side.toLowerCase()}`)}
                                                    className="h-20 bg-slate-50 border-none rounded-[2rem] text-center font-black text-3xl text-slate-800 shadow-inner focus:bg-white transition-all"
                                                    placeholder="0.0"
                                                />
                                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">Kgf</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>

                        <Card className="p-10 rounded-[4rem] bg-indigo-50/50 border border-indigo-100 shadow-sm flex flex-col items-center justify-center space-y-8">
                            <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center border border-indigo-100 shadow-sm">
                                <Scale className="h-10 w-10 text-indigo-500 animate-pulse" />
                            </div>
                            <div className="text-center space-y-2">
                                <h5 className="font-black text-indigo-900 uppercase text-[12px] tracking-widest leading-tight">Sugestão de Carga Máxima</h5>
                                <p className="text-[10px] font-black text-indigo-700/60 uppercase italic tracking-tighter">(Equation NIOSH base)</p>
                            </div>
                            <div className="flex items-center justify-center gap-3">
                                <Input
                                    {...register('occupational_health.capacity.max_load')}
                                    className="h-20 w-32 bg-white border-2 border-indigo-200 rounded-[2rem] text-center font-black text-4xl text-indigo-700 shadow-xl"
                                    placeholder="0"
                                />
                                <span className="text-2xl font-black text-indigo-600">KG</span>
                            </div>
                            <p className="text-[9px] font-bold text-indigo-900/40 uppercase text-center leading-relaxed">
                                "Baseado na simetria de carga e frequência horária informada no NIOSH."
                            </p>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
