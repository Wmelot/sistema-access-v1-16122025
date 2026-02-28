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
    Heart, Activity, Wind, Thermometer, Info, Stethoscope,
    Gauge, Clock, Footprints, AlertCircle, Timer, TrendingUp,
    Ruler, Zap, RefreshCw, Microscope, Droplets, Landmark, PenTool
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

export function CardioRespiratorioRichProtocol() {
    const { register, watch, setValue } = useFormContext();
    const data = watch('cardio_respiratory') || {};

    const updateField = (path: string, val: any) => {
        setValue(`cardio_respiratory.${path}`, val, { shouldDirty: true, shouldValidate: true });
    };

    const BORG_CR10 = [
        { value: "0", label: "0 - Repouso Total", color: "bg-emerald-500" },
        { value: "1", label: "1 - Muito Leve", color: "bg-emerald-300" },
        { value: "3", label: "3 - Moderado", color: "bg-yellow-500" },
        { value: "5", label: "5 - Pesado", color: "bg-orange-500" },
        { value: "7", label: "7 - Muito Pesado", color: "bg-rose-500" },
        { value: "10", label: "10 - Exaustão Máxima", color: "bg-slate-900" },
    ];

    const MMRC_SCALE = [
        { value: "0", label: "Grau 0", desc: "Falta de ar apenas em exercício intenso." },
        { value: "1", label: "Grau 1", desc: "Falta de ar ao andar rápido ou subir ladeira leve." },
        { value: "2", label: "Grau 2", desc: "Anda mais devagar que pessoas da mesma idade." },
        { value: "3", label: "Grau 3", desc: "Para para respirar após caminhar ~100 metros." },
        { value: "4", label: "Grau 4", desc: "Falta de ar ao sair de casa ou trocar de roupa." },
    ];

    const NYHA_STAGES = [
        { value: "I", label: "Classe I: Sem limitações físicas." },
        { value: "II", label: "Classe II: Limitação leve; confortável em repouso." },
        { value: "III", label: "Classe III: Limitação marcada; confortável apenas em repouso." },
        { value: "IV", label: "Classe IV: Incapacidade total; sintomas em repouso." },
    ];

    return (
        <div className="space-y-10 animate-in fade-in duration-500">

            {/* REFERENCIAL ACADÊMICO */}
            <div className="flex items-center gap-4 bg-emerald-50/50 p-6 rounded-[2.5rem] border border-emerald-100/50">
                <div className="h-12 w-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg">
                    <Landmark className="h-6 w-6" />
                </div>
                <div className="flex-1">
                    <h5 className="text-[11px] font-black text-emerald-900 uppercase tracking-widest">Base de Evidência Cardiovascular</h5>
                    <p className="text-[10px] font-bold text-emerald-700/70 leading-relaxed uppercase tracking-tighter">
                        Protocolo baseado nas diretrizes <span className="text-emerald-900 font-black">ATS/ERS (TC6M)</span>, <span className="text-emerald-900 font-black">GOLD</span>, <span className="text-emerald-900 font-black">NYHA</span> e <span className="text-emerald-900 font-black">Duke Activity Index</span>.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="vitals" className="w-full">
                <div className="flex justify-center mb-8">
                    <TabsList className="bg-slate-100/50 p-1.5 rounded-2xl h-auto border border-slate-100 shadow-inner gap-1">
                        <TabsTrigger value="vitals" className="rounded-xl px-6 py-2.5 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all flex items-center gap-2">
                            <Stethoscope className="h-3.5 w-3.5" /> Monitoriz. / Ausculta
                        </TabsTrigger>
                        <TabsTrigger value="effort" className="rounded-xl px-6 py-2.5 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all flex items-center gap-2">
                            <Footprints className="h-3.5 w-3.5" /> TC6M / DASI
                        </TabsTrigger>
                        <TabsTrigger value="mechanics" className="rounded-xl px-6 py-2.5 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all flex items-center gap-2">
                            <Ruler className="h-3.5 w-3.5" /> Mecânica / Força
                        </TabsTrigger>
                        <TabsTrigger value="scales" className="rounded-xl px-6 py-2.5 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all flex items-center gap-2">
                            <Activity className="h-3.5 w-3.5" /> Escalas / Qualidade
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* ABA 1: SINAIS VITAIS E AUSCULTA */}
                <TabsContent value="vitals" className="space-y-10 outline-none">
                    <div className="grid md:grid-cols-2 gap-8">
                        <Card className="p-8 rounded-[3.5rem] border-slate-100 shadow-sm space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                                    <Thermometer className="h-4 w-4" />
                                </div>
                                <h5 className="font-black text-slate-700 uppercase text-[11px] tracking-widest">Estado Hemodinâmico Basal</h5>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { id: 'bp_sys', label: 'PA Sistólica', unit: 'mmHg' },
                                    { id: 'bp_dia', label: 'PA Diastólica', unit: 'mmHg' },
                                    { id: 'hr_rest', label: 'FC Repouso', unit: 'bpm' },
                                    { id: 'spo2_rest', label: 'SpO2 Basal', unit: '%' },
                                    { id: 'rr_rest', label: 'FR Repouso', unit: 'irpm' },
                                    { id: 'temp', label: 'Temperatura', unit: 'ºC' },
                                ].map(v => (
                                    <div key={v.id} className="space-y-2">
                                        <Label className="text-[9px] font-black text-slate-400 uppercase ml-1">{v.label}</Label>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                {...register(`cardio_respiratory.vitals.${v.id}`)}
                                                className="h-12 bg-slate-50 border-none rounded-2xl font-black text-center text-lg text-slate-800 transition-all focus:bg-white focus:ring-4 focus:ring-emerald-50"
                                                placeholder="0"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300">{v.unit}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <div className="space-y-6">
                            <div className="flex items-center gap-3 ml-2">
                                <Stethoscope className="h-4 w-4 text-blue-500" />
                                <h5 className="font-black text-slate-700 uppercase text-[11px] tracking-widest">Sons Respiratórios Adventícios</h5>
                            </div>
                            <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-4">
                                {[
                                    { id: 'estertores', label: 'Estertores (Finos/Grossos)', icon: Droplets, color: 'text-blue-400' },
                                    { id: 'sibilos', label: 'Sibilos (Broncoespasmo)', icon: Wind, color: 'text-emerald-400' },
                                    { id: 'roncos', label: 'Roncos (Secreção)', icon: RefreshCw, color: 'text-amber-400' },
                                    { id: 'atrito', label: 'Atrito Pleural', icon: AlertCircle, color: 'text-rose-400' },
                                ].map(son => (
                                    <div key={son.id} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-[2rem] border border-slate-100 transition-all hover:bg-white hover:border-emerald-200 group">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("p-2 bg-white rounded-xl shadow-sm group-hover:bg-emerald-50 transition-colors", son.color)}>
                                                <son.icon className="h-4 w-4" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase text-slate-600 tracking-tight">{son.label}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            {['Ausente', 'Presente'].map(v => (
                                                <button
                                                    key={v}
                                                    onClick={() => updateField(`ausculta.${son.id}`, v.toLowerCase())}
                                                    className={cn(
                                                        "px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all",
                                                        data.ausculta?.[son.id] === v.toLowerCase()
                                                            ? (v === 'Presente' ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" : "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20")
                                                            : "bg-white text-slate-300"
                                                    )}
                                                >{v}</button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* ABA 2: CAPACIDADE FUNCIONAL (TC6M & DASI) */}
                <TabsContent value="effort" className="space-y-10 outline-none">
                    <div className="space-y-8 max-w-6xl mx-auto">
                        <Card className="p-10 rounded-[4rem] border-slate-100 bg-white shadow-2xl space-y-10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 opacity-5">
                                <Clock className="w-48 h-48 text-emerald-900" />
                            </div>

                            <div className="relative z-10 space-y-10">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-8 pb-10 border-b border-slate-100">
                                    <div className="flex items-center gap-6">
                                        <div className="h-16 w-16 bg-emerald-600 rounded-[2rem] flex items-center justify-center text-white shadow-xl rotate-3">
                                            <Timer className="h-8 w-8" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Teste de Caminhada 6 Min (TC6M)</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Padrão ATS/ERS</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-3 gap-8">
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase text-slate-800 tracking-widest ml-2">Distância Alcançada</Label>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                {...register('cardio_respiratory.tc6m.distance')}
                                                className="h-24 bg-emerald-50/50 border-none rounded-[3rem] text-center font-black text-5xl text-emerald-900 focus:bg-white focus:ring-8 focus:ring-emerald-50 transition-all"
                                                placeholder="0"
                                            />
                                            <span className="absolute right-8 top-1/2 -translate-y-1/2 text-xs font-black text-emerald-300">m</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase text-slate-800 tracking-widest ml-2">Saturação (ΔSpO2)</Label>
                                        <div className="bg-slate-50 p-6 rounded-[3rem] border border-slate-100 flex gap-4">
                                            <div className="flex-1 space-y-1">
                                                <span className="text-[8px] font-black text-slate-400 uppercase text-center block">Início</span>
                                                <Input {...register('cardio_respiratory.tc6m.spo2_init')} className="h-10 border-none bg-white rounded-xl text-center font-black" placeholder="98" />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <span className="text-[8px] font-black text-slate-400 uppercase text-center block">Fim</span>
                                                <Input {...register('cardio_respiratory.tc6m.spo2_final')} className="h-10 border-none bg-white rounded-xl text-center font-black" placeholder="94" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase text-slate-800 tracking-widest ml-2">VO2 Estimado (DASI)</Label>
                                        <div className="bg-slate-900 p-8 rounded-[3.5rem] text-white flex flex-col items-center shadow-xl border border-white/5 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-6 opacity-10">
                                                <TrendingUp className="h-16 w-16 text-emerald-400" />
                                            </div>
                                            <div className="relative z-10 text-center">
                                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest block mb-2">Score Duke Functional</span>
                                                <Input
                                                    {...register('cardio_respiratory.dasi_score')}
                                                    className="w-20 h-10 bg-white/5 border-none text-center text-3xl font-black text-white p-0"
                                                    placeholder="0"
                                                />
                                                <div className="mt-4 pt-4 border-t border-white/5">
                                                    <span className="text-[8px] font-bold text-slate-500 uppercase block">VO2 máx (ml/kg/min)</span>
                                                    <span className="text-xl font-black text-emerald-400">
                                                        {((Number(data.dasi_score) || 0) * 0.43 + 9.6).toFixed(1)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </TabsContent>

                {/* ABA 3: MECÂNICA RESPIRATÓRIA E FORÇA */}
                <TabsContent value="mechanics" className="space-y-10 outline-none">
                    <div className="grid md:grid-cols-2 gap-10 max-w-6xl mx-auto">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 ml-2">
                                <Ruler className="h-4 w-4 text-indigo-500" />
                                <h5 className="font-black text-slate-700 uppercase text-[11px] tracking-widest">Cirtometria Toracoabdominal</h5>
                            </div>
                            <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm space-y-8">
                                {[
                                    { id: 'axilar', label: 'Nível Axilar (Apical)' },
                                    { id: 'xifoide', label: 'Nível Xifoide (Médio)' },
                                    { id: 'umbilical', label: 'Nível Umbilical (Base)' },
                                ].map(level => (
                                    <div key={level.id} className="space-y-4 p-6 bg-slate-50/50 rounded-[2.5rem] border border-slate-100">
                                        <div className="flex justify-between items-center px-2">
                                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{level.label}</span>
                                            <Badge className="bg-white text-indigo-600 border-indigo-50 font-black px-4 py-1 rounded-full shadow-sm">
                                                Δ {(Number(data.cirto?.[level.id]?.ins) - Number(data.cirto?.[level.id]?.exp)).toFixed(1)} cm
                                            </Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <span className="text-[8px] font-black text-slate-400 uppercase ml-2 block">Insp. Máx</span>
                                                <Input {...register(`cardio_respiratory.cirto.${level.id}.ins`)} className="h-10 bg-white border-none rounded-xl text-center font-black" />
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[8px] font-black text-slate-400 uppercase ml-2 block">Exp. Máx</span>
                                                <Input {...register(`cardio_respiratory.cirto.${level.id}.exp`)} className="h-10 bg-white border-none rounded-xl text-center font-black" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-3 ml-2">
                                <Gauge className="h-4 w-4 text-emerald-500" />
                                <h5 className="font-black text-slate-700 uppercase text-[11px] tracking-widest">Força Muscular Especializada</h5>
                            </div>
                            <Card className="p-10 rounded-[4rem] border-slate-100 shadow-xl bg-slate-900 text-white h-full">
                                <div className="space-y-8">
                                    {[
                                        { id: 'pi_max', label: 'PImáx (Inspiratória)', color: 'text-emerald-400' },
                                        { id: 'pe_max', label: 'PEmáx (Expiratória)', color: 'text-blue-400' }
                                    ].map(field => (
                                        <div key={field.id} className="p-8 bg-white/5 rounded-[3rem] border border-white/5 space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className={cn("text-xs font-black uppercase", field.color)}>{field.label}</span>
                                                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">cmH2O</span>
                                            </div>
                                            <Input
                                                type="number"
                                                {...register(`cardio_respiratory.${field.id}`)}
                                                className="h-16 bg-white/5 border-none text-center font-black text-4xl"
                                                placeholder="0"
                                            />
                                        </div>
                                    ))}
                                    <p className="text-[9px] font-bold text-slate-500 text-center uppercase tracking-tighter px-6">
                                        Avaliação crítica para desmame ventilatório e manejo de DORN.
                                    </p>
                                </div>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* ABA 4: ESCALAS E QUALIDADE DE VIDA */}
                <TabsContent value="scales" className="space-y-10 outline-none">
                    <div className="max-w-5xl mx-auto space-y-10">
                        <div className="grid md:grid-cols-2 gap-8">
                            <Card className="p-8 rounded-[3.5rem] border-slate-100 shadow-sm space-y-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-50 rounded-xl text-orange-600">
                                        <Wind className="w-5 h-5" />
                                    </div>
                                    <h4 className="font-black text-slate-800 uppercase text-[11px] tracking-widest">Classificação Funcional (mMRC / NYHA)</h4>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-3">
                                        <Label className="text-[9px] font-black text-slate-400 uppercase ml-2">mMRC (Dispneia)</Label>
                                        <Select value={data.mmrc_grade} onValueChange={(v) => updateField('mmrc_grade', v)}>
                                            <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold text-[10px] uppercase">
                                                <SelectValue placeholder="Selecione o Grau" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {MMRC_SCALE.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[9px] font-black text-slate-400 uppercase ml-2">NYHA (Insuf. Cardíaca)</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {NYHA_STAGES.map(s => (
                                                <button
                                                    key={s.value}
                                                    onClick={() => updateField('nyha_class', s.value)}
                                                    className={cn(
                                                        "p-3 rounded-2xl text-[9px] font-black uppercase text-left transition-all",
                                                        data.nyha_class === s.value ? "bg-emerald-600 text-white shadow-lg" : "bg-slate-50 text-slate-400"
                                                    )}
                                                >{s.value}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-8 rounded-[3.5rem] border-slate-100 shadow-sm space-y-8">
                                <h4 className="font-black text-slate-800 uppercase text-[11px] tracking-widest text-center">Score CAT</h4>
                                <div className="bg-slate-900 p-10 rounded-[3rem] text-white flex flex-col items-center shadow-2xl relative overflow-hidden h-full justify-center">
                                    <div className="absolute top-0 left-0 w-full h-full bg-emerald-500/5 blur-3xl"></div>
                                    <span className="text-7xl font-black text-white relative z-10">{data.cat_score || 0}</span>
                                    <span className="text-xl font-black text-slate-600 relative z-10">/ 40</span>
                                    <div className="w-full mt-8 relative z-10">
                                        <Progress value={((data.cat_score || 0) / 40) * 100} className="h-3" />
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* PARECER TÉCNICO AXIOM */}
                        <Card className="p-10 rounded-[4rem] bg-emerald-900 text-white shadow-2xl space-y-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
                                <Heart className="h-48 w-48 text-white" />
                            </div>
                            <div className="relative z-10 space-y-8">
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
                                        <PenTool className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black uppercase tracking-tight">Parecer Clínico Axiom</h4>
                                        <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest font-mono">Synthesis & Therapeutic Core</p>
                                    </div>
                                </div>
                                <Textarea
                                    {...register('cardio_respiratory.clinical_verdict')}
                                    className="min-h-[150px] bg-white/5 border-none rounded-[2rem] p-8 text-sm text-emerald-50 focus:bg-white/10 leading-relaxed"
                                    placeholder="Redija aqui a fundamentação clínica baseada na ausculta, TC6M e escalas funcionais..."
                                />
                                <div className="flex items-center gap-2 bg-emerald-950/40 p-4 rounded-2xl border border-emerald-800/20">
                                    <Info className="h-4 w-4 text-emerald-400" />
                                    <p className="text-[9px] font-bold text-emerald-300 uppercase tracking-tight">Este parecer consolida as diretrizes GOLD/NYHA para fins acadêmicos e periciais.</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
