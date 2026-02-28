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
    Flower2, Baby, Activity, ShieldCheck, Info, UserCheck,
    Heart, Droplets, Ruler, Scale, RefreshCw, Layers,
    Waves, Thermometer, ClipboardList, PenTool, Search,
    Zap, Gem, HandMetal, Smile, AlertTriangle, Landmark
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function WomensHealthRichProtocol() {
    const { register, watch, setValue } = useFormContext();
    const data = watch('womens_health') || {};

    const updateField = (path: string, val: any) => {
        setValue(`womens_health.${path}`, val, { shouldDirty: true, shouldValidate: true });
    };

    const PERFECT_SCHEME = [
        { id: 'power', label: 'P - Power (0-5)', info: ' Oxford Modificada (Contração Voluntária Máxima).' },
        { id: 'endurance', label: 'E - Endurance (s)', info: 'Tempo de sustentação da contração máxima (objetivo 10s).' },
        { id: 'repetitions', label: 'R - Repetitions', info: 'Nº de repetições da sustentação (com 4s de repouso).' },
        { id: 'fast', label: 'F - Fast (1s)', info: 'Nº de contrações rápidas em 10 segundos.' },
    ];

    return (
        <div className="space-y-10 animate-in fade-in duration-500">

            {/* REFERENCIAL ACADÊMICO */}
            <div className="flex items-center gap-4 bg-pink-50/50 p-6 rounded-[2.5rem] border border-pink-100/50">
                <div className="h-12 w-12 rounded-2xl bg-pink-600 flex items-center justify-center text-white shadow-lg">
                    <Gem className="h-6 w-6" />
                </div>
                <div className="flex-1">
                    <h5 className="text-[11px] font-black text-pink-900 uppercase tracking-widest">Protocolo de Especialidade Pélvica</h5>
                    <p className="text-[10px] font-bold text-pink-700/70 leading-relaxed uppercase tracking-tighter">
                        Baseado no <span className="text-pink-900 font-black">Esquema PERFECT (Laycock)</span>, escala de <span className="text-pink-900 font-black">Oxford Modificada</span> e diretrizes da <span className="text-pink-900 font-black">ICS (International Continence Society)</span>.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="obstetric" className="w-full">
                <div className="flex justify-center mb-8">
                    <TabsList className="bg-slate-100/50 p-1.5 rounded-2xl h-auto border border-slate-100 shadow-inner gap-1">
                        <TabsTrigger value="obstetric" className="rounded-xl px-6 py-2.5 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
                            🤰 Obstetrícia / Ciclo
                        </TabsTrigger>
                        <TabsTrigger value="physical" className="rounded-xl px-6 py-2.5 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
                            ✋ Exame Pélvico (PERFECT)
                        </TabsTrigger>
                        <TabsTrigger value="bladder" className="rounded-xl px-6 py-2.5 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
                            💧 Bexiga / Intestino
                        </TabsTrigger>
                        <TabsTrigger value="sexual" className="rounded-xl px-6 py-2.5 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
                            💖 Sexualidade / Dor
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* ABA 1: OBSTETRÍCIA E CICLO VIDA */}
                <TabsContent value="obstetric" className="space-y-10 outline-none">
                    <div className="grid md:grid-cols-2 gap-8">
                        <Card className="p-8 rounded-[3.5rem] border-slate-100 shadow-sm space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-pink-50 rounded-xl text-pink-600">
                                    <Baby className="h-4 w-4" />
                                </div>
                                <h5 className="font-black text-slate-700 uppercase text-[11px] tracking-widest">Histórico Obstétrico (GPA)</h5>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { id: 'gestations', label: 'Gestações', short: 'G' },
                                    { id: 'births', label: 'Partos', short: 'P' },
                                    { id: 'abortions', label: 'Abortos', short: 'A' },
                                ].map(v => (
                                    <div key={v.id} className="space-y-2">
                                        <Label className="text-[9px] font-black text-slate-400 uppercase ml-1">{v.short}</Label>
                                        <Input
                                            type="number"
                                            {...register(`womens_health.history.${v.id}`)}
                                            className="h-14 bg-slate-50 border-none rounded-2xl font-black text-center text-xl text-slate-800 transition-all focus:bg-white focus:ring-4 focus:ring-pink-50"
                                            placeholder="0"
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="pt-4 border-t border-slate-50">
                                <Label className="text-[9px] font-black text-slate-400 uppercase ml-1">Via de Partos predominante</Label>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    {['Vaginal', 'Cesárea', 'Fórceps', 'Espontâneo'].map(v => (
                                        <button
                                            key={v}
                                            onClick={() => updateField('history.primary_birth_type', v)}
                                            className={cn(
                                                "py-3 rounded-[1.5rem] text-[9px] font-black uppercase transition-all",
                                                data.history?.primary_birth_type === v ? "bg-pink-600 text-white shadow-xl rotate-1" : "bg-slate-50 text-slate-400"
                                            )}
                                        >{v}</button>
                                    ))}
                                </div>
                            </div>
                        </Card>

                        <div className="space-y-6">
                            <div className="flex items-center gap-3 ml-2">
                                <RefreshCw className="h-4 w-4 text-emerald-500" />
                                <h5 className="font-black text-slate-700 uppercase text-[11px] tracking-widest">Ciclo Hormonal & Tecidual</h5>
                            </div>
                            <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-4">
                                {[
                                    { id: 'menopause', label: 'Menopausa / Climatério', desc: 'Atrofia Vulvovaginal' },
                                    { id: 'episiotomy', label: 'Cicatriz de Episiotomia', desc: 'Presença de dor/fibrose' },
                                    { id: 'prolapse', label: 'Sensação de Prolapso', desc: 'Peso na região pélvica' },
                                    { id: 'tht', label: 'Terapia Hormonal', desc: 'Reposição ativa' },
                                ].map(item => (
                                    <div key={item.id} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-[2rem] border border-slate-100 transition-all hover:bg-white hover:border-pink-200 group">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase text-slate-700 tracking-tight">{item.label}</span>
                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{item.desc}</span>
                                        </div>
                                        <Checkbox
                                            id={item.id}
                                            className="h-6 w-6 rounded-lg border-slate-200 data-[state=checked]:bg-pink-600 data-[state=checked]:border-pink-600 transition-all"
                                            checked={data.hormonal?.[item.id]}
                                            onCheckedChange={(c) => updateField(`hormonal.${item.id}`, !!c)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* ABA 2: EXAME FÍSICO PÉLVICO (PERFECT) */}
                <TabsContent value="physical" className="space-y-10 outline-none">
                    <Card className="p-10 rounded-[4.5rem] border-slate-100 bg-white shadow-2xl max-w-5xl mx-auto space-y-12 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12">
                            <HandMetal className="w-56 h-56 text-pink-900" />
                        </div>

                        <div className="relative z-10 space-y-12">
                            <div className="flex items-center gap-6 pb-10 border-b border-slate-100">
                                <div className="h-16 w-16 bg-pink-600 rounded-[2rem] flex items-center justify-center text-white shadow-xl -rotate-6">
                                    <ShieldCheck className="h-8 w-8" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Esquema PERFECT de Avaliação</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Funcionalidade da Musculatura do Assoalho Pélvico (MAP)</p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                                {PERFECT_SCHEME.map(item => (
                                    <div key={item.id} className="space-y-4 p-8 bg-slate-50/80 rounded-[3rem] border border-slate-100 group transition-all hover:bg-white hover:border-pink-300 hover:shadow-xl hover:scale-105">
                                        <div className="flex flex-col items-center gap-2">
                                            <Label className="text-[10px] font-black uppercase text-slate-800 tracking-widest text-center">{item.label}</Label>
                                            <p className="text-[8px] font-bold text-slate-400 text-center uppercase px-4 leading-tight">{item.info}</p>
                                        </div>
                                        <Input
                                            type="number"
                                            {...register(`womens_health.perfect.${item.id}`)}
                                            className="h-20 bg-white border-transparent rounded-[2rem] text-center font-black text-4xl text-pink-700 shadow-inner"
                                            placeholder="0"
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-4 bg-slate-900 p-8 rounded-[3.5rem] text-white shadow-2xl">
                                    <h6 className="text-[10px] font-black uppercase tracking-widest text-pink-400 flex items-center gap-2">
                                        <PenTool className="h-4 w-4" /> Pontos Gatilho / Sensibilidade
                                    </h6>
                                    <div className="grid grid-cols-2 gap-3 mt-4">
                                        {['Elevador do Ânus', 'Obturador Int.', 'Pubococcígeo', 'Bulbo cavernoso'].map(muscle => (
                                            <button
                                                key={muscle}
                                                onClick={() => {
                                                    const current = data.trigger_points || [];
                                                    const next = current.includes(muscle) ? current.filter((m: string) => m !== muscle) : [...current, muscle];
                                                    updateField('trigger_points', next);
                                                }}
                                                className={cn(
                                                    "py-3 rounded-2xl text-[9px] font-black uppercase transition-all border",
                                                    data.trigger_points?.includes(muscle) ? "bg-pink-600 border-pink-600 text-white shadow-lg" : "bg-white/5 border-white/10 text-slate-500 hover:bg-white/10"
                                                )}
                                            >{muscle}</button>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-8 bg-pink-50 rounded-[3.5rem] border border-pink-100 flex flex-col items-center justify-center space-y-4">
                                    <Badge className="bg-white text-pink-600 border-pink-100 font-bold px-4 py-1.5 rounded-full shadow-sm text-[9px] uppercase tracking-widest">Score Oxford Modificado</Badge>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-6xl font-black text-pink-900">{data.perfect?.power || 0}</span>
                                        <span className="text-xl font-black text-pink-300">/ 5</span>
                                    </div>
                                    <p className="text-[9px] font-bold text-pink-700/60 text-center uppercase leading-relaxed max-w-[200px]">
                                        Grau {data.perfect?.power || 0}: {(Number(data.perfect?.power) || 0) >= 3 ? 'Capaz de vencer resistência' : 'Contrações precárias ou nulas'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </TabsContent>

                {/* ABA 3: BEXIGA E INTESTINO (UROPROCTO) */}
                <TabsContent value="bladder" className="space-y-10 outline-none">
                    <div className="grid md:grid-cols-2 gap-10 max-w-6xl mx-auto">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 ml-2">
                                <Droplets className="h-4 w-4 text-blue-500" />
                                <h5 className="font-black text-slate-700 uppercase text-[11px] tracking-widest">Sintomas Urinários (LUTS)</h5>
                            </div>
                            <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm space-y-8">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <span className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Frequência Diurna</span>
                                        <Input {...register('womens_health.uro.day_freq')} className="h-12 bg-slate-50 border-none rounded-2xl text-center font-black text-lg shadow-inner" placeholder="0" />
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Noctúria (Vezes)</span>
                                        <Input {...register('womens_health.uro.nocturia')} className="h-12 bg-slate-50 border-none rounded-2xl text-center font-black text-lg shadow-inner" placeholder="0" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {[
                                        { id: 'stress', label: 'E - Esforço (Tosse/Espirro)', color: 'text-blue-500' },
                                        { id: 'urgency', label: 'U - Urgência (Desejo súbito)', color: 'text-indigo-500' },
                                        { id: 'pad', label: 'Uso de Absorvente Protético', color: 'text-slate-500' },
                                    ].map(symp => (
                                        <button
                                            key={symp.id}
                                            onClick={() => updateField(`uro.symptoms.${symp.id}`, !data.uro?.symptoms?.[symp.id])}
                                            className={cn(
                                                "w-full flex items-center justify-between p-5 rounded-[2.5rem] border transition-all",
                                                data.uro?.symptoms?.[symp.id] ? "bg-blue-600 border-blue-600 text-white shadow-xl" : "bg-white border-slate-100 text-slate-600 hover:border-blue-200"
                                            )}
                                        >
                                            <span className="text-[10px] font-black uppercase tracking-tight">{symp.label}</span>
                                            <div className={cn("h-4 w-4 rounded-full border-2", data.uro?.symptoms?.[symp.id] ? "bg-white border-white" : "border-slate-200")}></div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-3 ml-2">
                                <Landmark className="h-4 w-4 text-amber-600" />
                                <h5 className="font-black text-slate-700 uppercase text-[11px] tracking-widest">Coloproctologia (Escala Bristol)</h5>
                            </div>
                            <div className="bg-amber-50/50 p-10 rounded-[4rem] border border-amber-100/50 shadow-sm space-y-8 flex flex-col items-center">
                                <div className="grid grid-cols-7 gap-1 w-full max-w-sm">
                                    {[1, 2, 3, 4, 5, 6, 7].map(num => (
                                        <button
                                            key={num}
                                            onClick={() => updateField('procto.bristol_type', num)}
                                            className={cn(
                                                "h-12 flex flex-col items-center justify-center rounded-xl font-black text-[11px] transition-all",
                                                data.procto?.bristol_type === num ? "bg-amber-600 text-white shadow-lg" : "bg-white text-amber-300"
                                            )}
                                        >
                                            T{num}
                                        </button>
                                    ))}
                                </div>
                                <div className="text-center space-y-2">
                                    <span className="text-[10px] font-black text-amber-900 uppercase tracking-widest block">Classificação Bristol</span>
                                    <p className="text-[11px] font-bold text-amber-700/70 uppercase max-w-[250px]">
                                        {(data.procto?.bristol_type === 1 || data.procto?.bristol_type === 2) ? '🚨 Constipação Provável' : (data.procto?.bristol_type === 3 || data.procto?.bristol_type === 4) ? '✅ Normal' : '🔹 Tendência Diarréica'}
                                    </p>
                                </div>
                                <div className="w-full space-y-4 pt-6 border-t border-amber-200/50">
                                    <Label className="text-[9px] font-black text-amber-800/60 uppercase ml-2">Manobras Defecatórias</Label>
                                    <Textarea
                                        {...register('womens_health.procto.maneuvers')}
                                        className="h-24 bg-white/80 border-none rounded-[2rem] p-5 text-[11px] font-medium text-amber-900 focus:bg-white shadow-sm"
                                        placeholder="Digitação vaginal, esforço excessivo..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* ABA 4: SEXUALIDADE E DOR PÉLVICA */}
                <TabsContent value="sexual" className="space-y-10 outline-none">
                    <div className="max-w-5xl mx-auto space-y-10">
                        <div className="grid md:grid-cols-2 gap-8">
                            <Card className="p-8 rounded-[3.5rem] border-slate-100 shadow-sm space-y-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
                                        <Heart className="h-5 w-5" />
                                    </div>
                                    <h4 className="font-black text-slate-800 uppercase text-[11px] tracking-widest">Saúde Sexual & Disfunções</h4>
                                </div>
                                <div className="space-y-3">
                                    {[
                                        { id: 'dyspareunia', label: 'Dispareunia (Dor na Relação)', color: 'text-rose-500' },
                                        { id: 'vaginismus', label: 'Vaginismo (Contração Involuntária)', color: 'text-rose-600' },
                                        { id: 'libido', label: 'Desejo Sexual Hipotivo', color: 'text-rose-400' },
                                        { id: 'orgasm', label: 'Anorgasmia / Dificuldade Orgasmo', color: 'text-rose-500' },
                                    ].map(opt => (
                                        <div key={opt.id} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-[2.5rem] border border-slate-100">
                                            <span className="text-[10px] font-black uppercase text-slate-700 tracking-tight">{opt.label}</span>
                                            <Checkbox
                                                className="h-6 w-6 rounded-lg border-rose-200 data-[state=checked]:bg-rose-500 data-[state=checked]:border-rose-500"
                                                checked={data.sexual?.[opt.id]}
                                                onCheckedChange={(c) => updateField(`sexual.${opt.id}`, !!c)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            <div className="space-y-8">
                                <Card className="p-10 rounded-[4rem] bg-slate-900 text-white shadow-2xl space-y-8 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-10 opacity-10">
                                        <AlertTriangle className="h-40 w-40 text-rose-500" />
                                    </div>
                                    <div className="relative z-10 space-y-8">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 bg-white/5 rounded-2xl flex items-center justify-center text-rose-400">
                                                <Smile className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-black uppercase text-[10px] tracking-[0.2em] text-rose-300">Eva (Escala Visual Analógica)</h4>
                                                <p className="text-[9px] font-bold text-slate-500 uppercase">Intensidade da Dor Pélvica Crônica</p>
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            <div className="flex justify-between items-baseline">
                                                <span className="text-6xl font-black text-rose-500">{data.eva_score || 0}</span>
                                                <span className="text-sm font-black text-slate-700 uppercase tracking-widest">Pain Level</span>
                                            </div>
                                            <Input
                                                type="range" min="0" max="10" step="1"
                                                value={data.eva_score || 0}
                                                onChange={(e) => updateField('eva_score', e.target.value)}
                                                className="h-4 bg-white/10 rounded-full appearance-none cursor-pointer accent-rose-500"
                                            />
                                            <div className="flex justify-between text-[8px] font-black uppercase text-slate-600 tracking-[0.2em]">
                                                <span>Sem Dor</span>
                                                <span>Pior Dor</span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="p-8 rounded-[3.5rem] border-slate-100 shadow-sm space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                                            <ClipboardList className="h-5 w-5" />
                                        </div>
                                        <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Atenção Axiom (Privacidade)</h4>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed text-center px-4 italic">
                                        "Questões de intimidade e dor sexual exigem ambiente preservado e vínculo terapêutico sólido."
                                    </p>
                                </Card>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
