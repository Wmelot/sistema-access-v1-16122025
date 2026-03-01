"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Baby, ShieldCheck, Heart, Droplets,
    Gem, HandMetal, Smile, AlertTriangle,
    Info, RefreshCw, Activity, Zap, ClipboardList,
    BookOpen, ExternalLink
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// ─── Tooltip de informação clínica ────────────────────────────────────────────
function ClinicalNote({ text }: { text: string }) {
    return (
        <div className="flex items-start gap-2 bg-pink-50 border border-pink-100 rounded-2xl p-4">
            <Info className="h-3.5 w-3.5 text-pink-500 shrink-0 mt-0.5" />
            <p className="text-[10px] font-bold text-pink-800 leading-relaxed uppercase tracking-tight">{text}</p>
        </div>
    );
}

// ─── Botão SIM/NÃO ────────────────────────────────────────────────────────────
function YesNo({ value, onChange, labelYes = "Sim", labelNo = "Não" }: { value: boolean; onChange: (v: boolean) => void; labelYes?: string; labelNo?: string }) {
    return (
        <div className="flex gap-2">
            {[{ v: true, label: labelYes }, { v: false, label: labelNo }].map(({ v, label }) => (
                <button
                    key={String(v)}
                    type="button"
                    onClick={() => onChange(v)}
                    className={cn(
                        "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        value === v
                            ? v ? "bg-pink-600 text-white shadow-md" : "bg-slate-600 text-white shadow-md"
                            : "bg-slate-50 text-slate-400 border border-slate-100"
                    )}
                >{label}</button>
            ))}
        </div>
    );
}

// ─── Seletor de intensidade 0-10 ──────────────────────────────────────────────
function IntensityBar({ value, onChange, color = "pink" }: { value: number; onChange: (n: number) => void; color?: string }) {
    const colorMap: Record<string, string> = {
        pink: "bg-pink-600",
        blue: "bg-blue-600",
        amber: "bg-amber-500",
        rose: "bg-rose-600",
    };
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <span className="text-[9px] font-black text-slate-400 uppercase">0 — Sem sintoma</span>
                <span className="text-2xl font-black text-slate-800">{value}</span>
                <span className="text-[9px] font-black text-slate-400 uppercase">10 — Grave</span>
            </div>
            <div className="flex gap-1">
                {Array.from({ length: 11 }, (_, i) => (
                    <button
                        key={i}
                        type="button"
                        onClick={() => onChange(i)}
                        className={cn(
                            "flex-1 h-8 rounded-lg transition-all",
                            i <= value ? colorMap[color] : "bg-slate-100"
                        )}
                    />
                ))}
            </div>
        </div>
    );
}

export function WomensHealthRichProtocol() {
    const { register, watch, setValue } = useFormContext();
    const data = watch('womens_health') || {};

    const upd = (path: string, val: any) =>
        setValue(`womens_health.${path}`, val, { shouldDirty: true });

    const PERFECT_SCHEME = [
        { id: 'power', label: 'P — Power', short: '0–5', info: 'Escala Oxford Modificada. Contração Voluntária Máxima (CVM). 0=Sem contração, 5=Forte com resistência.' },
        { id: 'endurance', label: 'E — Endurance', short: 'segundos', info: 'Tempo que sustenta a CVM. Meta ≥10s. Registre quantos segundos até a fadiga.' },
        { id: 'repetitions', label: 'R — Repetitions', short: 'n°', info: 'Quantas repetições da sustentação consegue fazer com 4s de repouso entre cada.' },
        { id: 'fast', label: 'F — Fast', short: 'n°/10s', info: 'Contrações rápidas em 10 segundos. Avalia fibras de contração rápida (Tipo II).' },
        { id: 'elevation', label: 'ECo — Elevação', short: 'obs', info: 'Observe ascensão perineal durante a contração. Ausente / Presente / Boa.' },
        { id: 'cocontraction', label: 'CC — Co-contração', short: 'obs', info: 'Avalie se há co-contração de adutores, glúteos ou abdominais durante o esforço.' },
    ];

    const oxfordLabels: Record<number, string> = {
        0: "Sem contração palpável",
        1: "Tremor / farfalhar",
        2: "Fraca (sem sustentação)",
        3: "Moderada (resistência leve)",
        4: "Boa (com resistência parcial)",
        5: "Forte (vence resistência total)",
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* BANNER ACADÊMICO */}
            <div className="flex items-center gap-4 bg-gradient-to-r from-pink-600 to-rose-500 p-6 rounded-[2.5rem] text-white shadow-xl shadow-pink-100">
                <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                    <Gem className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                    <h5 className="text-[11px] font-black uppercase tracking-widest">Protocolo: Saúde Pélvica & Uroginecologia</h5>
                    <p className="text-[9px] font-bold text-pink-100 leading-relaxed uppercase tracking-tighter mt-0.5">
                        Esquema PERFECT (Laycock) · Oxford Modificada · ICS · Baracho (2018)
                    </p>
                </div>
            </div>

            <Tabs defaultValue="history" className="w-full">
                <div className="flex justify-center mb-6">
                    <TabsList className="bg-slate-100/60 p-1.5 rounded-2xl h-auto border border-slate-100 shadow-inner flex-wrap gap-1">
                        {[
                            { v: "history", icon: Baby, label: "Anamnese" },
                            { v: "physical", icon: ShieldCheck, label: "PERFECT" },
                            { v: "bladder", icon: Droplets, label: "Bexiga / Intestino" },
                            { v: "sexual", icon: Heart, label: "Sexual / Dor" },
                            { v: "red_flags", icon: AlertTriangle, label: "Bandeiras Vermelhas" },
                        ].map(({ v, icon: Icon, label }) => (
                            <TabsTrigger
                                key={v}
                                value={v}
                                className="rounded-xl px-4 py-2.5 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all flex items-center gap-1.5"
                            >
                                <Icon className="h-3.5 w-3.5" />{label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                {/* ══════════════════════════════════════════════════════════════
                    ABA 1: ANAMNESE COMPLETA
                ══════════════════════════════════════════════════════════════ */}
                <TabsContent value="history" className="space-y-8 outline-none">
                    <div className="grid md:grid-cols-2 gap-8">

                        {/* HISTÓRICO OBSTÉTRICO */}
                        <Card className="p-8 rounded-[3rem] border-slate-100 shadow-sm space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-pink-50 rounded-xl text-pink-600"><Baby className="h-5 w-5" /></div>
                                <div>
                                    <h5 className="font-black text-slate-800 uppercase text-[11px] tracking-widest">Histórico Obstétrico</h5>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">GPA + Paridade</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { id: 'gestations', label: 'G — Gestações', hint: 'Total incl. atual' },
                                    { id: 'births', label: 'P — Partos', hint: 'Todos os tipos' },
                                    { id: 'abortions', label: 'A — Abortos', hint: 'Espontâneos ou não' },
                                ].map(v => (
                                    <div key={v.id} className="space-y-1 text-center">
                                        <Label className="text-[9px] font-black text-slate-400 uppercase">{v.label}</Label>
                                        <Input type="number" {...register(`womens_health.history.${v.id}`)}
                                            className="h-14 bg-slate-50 border-none rounded-2xl font-black text-center text-2xl text-pink-700 shadow-inner"
                                            placeholder="0" />
                                        <p className="text-[8px] text-slate-300 font-bold uppercase">{v.hint}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[9px] font-black text-slate-400 uppercase ml-1">Via de Parto</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Vaginal', 'Cesárea', 'Fórceps / Vácuo', 'Partos Mistos'].map(v => (
                                        <button key={v} type="button"
                                            onClick={() => upd('history.primary_birth_type', v)}
                                            className={cn("py-3 rounded-2xl text-[9px] font-black uppercase transition-all",
                                                data.history?.primary_birth_type === v ? "bg-pink-600 text-white shadow-lg" : "bg-slate-50 text-slate-400 hover:bg-pink-50"
                                            )}>{v}</button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[9px] font-black text-slate-400 uppercase ml-1">Período de Maior Queixa</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Gestação', 'Pós-parto', 'Menopausa', 'Sempre teve', 'Não se aplica'].map(v => (
                                        <button key={v} type="button"
                                            onClick={() => upd('history.complaint_period', v)}
                                            className={cn("py-2.5 rounded-xl text-[9px] font-black uppercase transition-all",
                                                data.history?.complaint_period === v ? "bg-rose-600 text-white" : "bg-slate-50 text-slate-400"
                                            )}>{v}</button>
                                    ))}
                                </div>
                            </div>
                        </Card>

                        {/* FASE DA VIDA / HORMONAL */}
                        <div className="space-y-6">
                            <Card className="p-8 rounded-[3rem] border-slate-100 shadow-sm space-y-5">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-rose-50 rounded-xl text-rose-600"><RefreshCw className="h-5 w-5" /></div>
                                    <div>
                                        <h5 className="font-black text-slate-800 uppercase text-[11px] tracking-widest">Ciclo Hormonal</h5>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase">Marque todas que se aplicam</p>
                                    </div>
                                </div>
                                {[
                                    { id: 'menopause', label: 'Menopausa / Climatério', desc: '→ Atenção à atrofia vulvovaginal' },
                                    { id: 'episiotomy', label: 'Episiotomia / Lacerações', desc: '→ Verificar cicatriz e fibrose' },
                                    { id: 'prolapse', label: 'Sensação de Peso / Prolapso', desc: '→ Avaliar grau de descida pélvica' },
                                    { id: 'tht', label: 'Terapia Hormonal (TH ativa)', desc: '→ Informa resposta tecidual' },
                                    { id: 'endometriosis', label: 'Endometriose diagnosticada', desc: '→ Impacto em dor & aderências' },
                                    { id: 'pcos', label: 'SOP (Ovários Policísticos)', desc: '→ Relevante em incontinência' },
                                ].map(item => (
                                    <div key={item.id}
                                        className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-pink-100 transition-all group">
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-slate-700 tracking-tight">{item.label}</p>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">{item.desc}</p>
                                        </div>
                                        <Checkbox
                                            className="h-6 w-6 rounded-lg data-[state=checked]:bg-pink-600 data-[state=checked]:border-pink-600"
                                            checked={!!data.hormonal?.[item.id]}
                                            onCheckedChange={(c) => upd(`hormonal.${item.id}`, !!c)}
                                        />
                                    </div>
                                ))}
                            </Card>

                            <Card className="p-6 rounded-[2.5rem] border-slate-100 shadow-sm space-y-4">
                                <h5 className="font-black text-slate-800 uppercase text-[11px] tracking-widest flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-pink-500" /> Ciclo Menstrual Atual
                                </h5>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-[9px] font-black text-slate-400 uppercase">Duração (dias)</Label>
                                        <Input type="number" {...register('womens_health.cycle.duration')}
                                            className="h-10 bg-slate-50 border-none rounded-xl text-center font-black" placeholder="28" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[9px] font-black text-slate-400 uppercase">Fluxo</Label>
                                        <div className="flex gap-1">
                                            {['Leve', 'Normal', 'Intenso'].map(v => (
                                                <button key={v} type="button"
                                                    onClick={() => upd('cycle.flow', v)}
                                                    className={cn("flex-1 py-2 rounded-xl text-[8px] font-black uppercase",
                                                        data.cycle?.flow === v ? "bg-pink-600 text-white" : "bg-slate-50 text-slate-400"
                                                    )}>{v}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[9px] font-black text-slate-400 uppercase">Dismenorreia (dor na menstruação)</Label>
                                    <IntensityBar
                                        value={Number(data.cycle?.dysmenorrhea) || 0}
                                        onChange={(n) => upd('cycle.dysmenorrhea', n)}
                                    />
                                </div>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* ══════════════════════════════════════════════════════════════
                    ABA 2: EXAME FÍSICO PÉLVICO — PERFECT + ECo + CC
                ══════════════════════════════════════════════════════════════ */}
                <TabsContent value="physical" className="space-y-8 outline-none">
                    <Card className="p-8 md:p-12 rounded-[3.5rem] border-slate-100 shadow-2xl max-w-5xl mx-auto space-y-10">
                        <div className="flex items-center gap-5 pb-8 border-b border-slate-100">
                            <div className="h-16 w-16 bg-pink-600 rounded-[2rem] flex items-center justify-center text-white shadow-xl -rotate-3">
                                <HandMetal className="h-8 w-8" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Esquema PERFECT + ECo + CC</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Avaliação da MAP — Laycock (1994) + ICS</p>
                            </div>
                        </div>

                        {/* PERFECT 4 itens numéricos */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {PERFECT_SCHEME.slice(0, 4).map(item => (
                                <div key={item.id} className="space-y-3 p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:border-pink-200 hover:shadow-lg transition-all group">
                                    <div className="space-y-1 text-center">
                                        <p className="text-[10px] font-black uppercase text-slate-800 tracking-widest">{item.label}</p>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase">{item.short}</p>
                                    </div>
                                    <div className="flex items-start gap-1.5 text-center">
                                        <Input type="number"
                                            {...register(`womens_health.perfect.${item.id}`)}
                                            className="h-20 bg-white border-transparent rounded-[2rem] text-center font-black text-4xl text-pink-700 shadow-inner"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="flex items-start gap-1.5 mt-2">
                                        <Info className="h-3 w-3 text-slate-300 shrink-0 mt-0.5" />
                                        <p className="text-[8px] font-bold text-slate-400 leading-relaxed">{item.info}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Oxford Score display */}
                        <div className="bg-gradient-to-r from-pink-600 to-rose-500 p-8 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="text-center md:text-left">
                                <p className="text-[10px] font-black uppercase tracking-widest text-pink-100">Oxford Modificada — Power</p>
                                <p className="text-5xl font-black mt-1">{data.perfect?.power || 0}<span className="text-2xl opacity-50"> / 5</span></p>
                                <p className="text-sm font-bold text-pink-100 mt-1">{oxfordLabels[Number(data.perfect?.power)] || '—'}</p>
                            </div>
                            <div className="flex-1 max-w-sm">
                                <p className="text-[9px] font-black uppercase tracking-widest text-pink-100 mb-3">Selecionar grau Oxford</p>
                                <div className="grid grid-cols-6 gap-1">
                                    {[0, 1, 2, 3, 4, 5].map(n => (
                                        <button key={n} type="button"
                                            onClick={() => upd('perfect.power', n)}
                                            className={cn("h-12 rounded-xl font-black text-sm transition-all",
                                                Number(data.perfect?.power) === n ? "bg-white text-pink-700 shadow-xl" : "bg-white/10 text-white hover:bg-white/20"
                                            )}>{n}</button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ECo e CC */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-3 p-6 bg-slate-900 rounded-[2.5rem] text-white">
                                <p className="text-[10px] font-black uppercase tracking-widest text-pink-300">ECo — Elevação & Coordenação</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">Ascensão perineal visível / palpável durante CVM</p>
                                <div className="grid grid-cols-3 gap-2 mt-4">
                                    {['Ausente', 'Presente', 'Boa'].map(v => (
                                        <button key={v} type="button"
                                            onClick={() => upd('perfect.elevation', v)}
                                            className={cn("py-3 rounded-2xl text-[9px] font-black uppercase transition-all",
                                                data.perfect?.elevation === v ? "bg-pink-600 text-white" : "bg-white/10 text-slate-400 hover:bg-white/20"
                                            )}>{v}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-3 p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">CC — Co-contração</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">Músculos sinergistas ativados durante o esforço</p>
                                <div className="space-y-2 mt-2">
                                    {['Adutores', 'Glúteos', 'Abdominais', 'Sem co-contração'].map(m => (
                                        <button key={m} type="button"
                                            onClick={() => {
                                                const curr: string[] = data.perfect?.cocontraction || [];
                                                upd('perfect.cocontraction', curr.includes(m) ? curr.filter((x: string) => x !== m) : [...curr, m]);
                                            }}
                                            className={cn("w-full py-2.5 rounded-xl text-[9px] font-black uppercase transition-all text-left px-4",
                                                data.perfect?.cocontraction?.includes(m) ? "bg-pink-600 text-white" : "bg-white text-slate-500 border border-slate-100 hover:border-pink-200"
                                            )}>{m}</button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Pontos Gatilho */}
                        <div className="space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-2">
                                <Zap className="h-3.5 w-3.5 text-pink-500" /> Pontos Gatilho Miofasciais
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {['Elevador do Ânus', 'Obturador Interno', 'Pubococcígeo', 'Puboretal', 'Bulbo-cavernoso', 'Isquiocavernoso', 'Transverso Superf.', 'Coccígeo'].map(m => (
                                    <button key={m} type="button"
                                        onClick={() => {
                                            const curr: string[] = data.trigger_points || [];
                                            upd('trigger_points', curr.includes(m) ? curr.filter((x: string) => x !== m) : [...curr, m]);
                                        }}
                                        className={cn("py-3 rounded-2xl text-[9px] font-black uppercase transition-all border",
                                            data.trigger_points?.includes(m) ? "bg-pink-600 border-pink-600 text-white shadow-lg" : "bg-slate-50 border-slate-100 text-slate-500 hover:border-pink-200"
                                        )}>{m}</button>
                                ))}
                            </div>
                        </div>

                        <ClinicalNote text="Realize o exame com a paciente em decúbito dorsal com quadris fletidos. Utilize luva e gel. Instrua previamente: 'Aperte o dedo como se fosse segurar xixi'. Observe ascensão, sustentação e relaxamento." />
                    </Card>
                </TabsContent>

                {/* ══════════════════════════════════════════════════════════════
                    ABA 3: BEXIGA & INTESTINO
                ══════════════════════════════════════════════════════════════ */}
                <TabsContent value="bladder" className="space-y-8 outline-none">
                    <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">

                        {/* SINTOMAS URINÁRIOS */}
                        <div className="space-y-5">
                            <div className="flex items-center gap-2 ml-1">
                                <Droplets className="h-4 w-4 text-blue-500" />
                                <h5 className="font-black text-slate-800 uppercase text-[11px] tracking-widest">Sintomas Urinários — LUTS</h5>
                            </div>
                            <Card className="p-8 rounded-[3rem] border-slate-100 shadow-sm space-y-6">

                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { id: 'day_freq', label: 'Frequência Diurna', hint: 'Normal: 4-8x/dia' },
                                        { id: 'nocturia', label: 'Noctúria (noite)', hint: 'Normal: 0-1x' },
                                        { id: 'urgency_episodes', label: 'Episódios Urgência/dia', hint: 'Desejo imprevisto forte' },
                                        { id: 'leakage_episodes', label: 'Perdas urinarias/semana', hint: 'Qualquer quantidade' },
                                    ].map(f => (
                                        <div key={f.id} className="space-y-1">
                                            <Label className="text-[8px] font-black text-slate-400 uppercase">{f.label}</Label>
                                            <Input type="number" {...register(`womens_health.uro.${f.id}`)}
                                                className="h-12 bg-slate-50 border-none rounded-2xl text-center font-black text-lg shadow-inner"
                                                placeholder="0" />
                                            <p className="text-[8px] text-slate-300 font-bold uppercase text-center">{f.hint}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-2">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Tipo de Incontinência</p>
                                    {[
                                        { id: 'stress', label: 'IUE — Esforço', desc: 'Tosse, espirro, pular, rir' },
                                        { id: 'urgency', label: 'IUU — Urgência', desc: 'Desejo repentino, não consegue segurar' },
                                        { id: 'mixed', label: 'IUM — Mista (E + U)', desc: 'Ambas as situações' },
                                        { id: 'nocturnal', label: 'Enurese Noturna', desc: 'Perda durante o sono' },
                                        { id: 'coital', label: 'Perda Coital', desc: 'Durante a relação sexual' },
                                    ].map(s => (
                                        <button key={s.id} type="button"
                                            onClick={() => upd(`uro.incontinence_type.${s.id}`, !data.uro?.incontinence_type?.[s.id])}
                                            className={cn("w-full flex items-center justify-between p-4 rounded-2xl border transition-all",
                                                data.uro?.incontinence_type?.[s.id]
                                                    ? "bg-blue-600 border-blue-600 text-white shadow-lg"
                                                    : "bg-white border-slate-100 text-slate-600 hover:border-blue-200"
                                            )}>
                                            <div className="text-left">
                                                <p className="text-[10px] font-black uppercase">{s.label}</p>
                                                <p className={cn("text-[8px] font-bold uppercase", data.uro?.incontinence_type?.[s.id] ? "text-blue-100" : "text-slate-400")}>{s.desc}</p>
                                            </div>
                                            <div className={cn("h-5 w-5 rounded-full border-2 shrink-0", data.uro?.incontinence_type?.[s.id] ? "bg-white border-white" : "border-slate-200")} />
                                        </button>
                                    ))}
                                </div>

                                <div className="space-y-2">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Uso de Absorvente Protetor</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['Não usa', 'Às vezes', 'Sempre'].map(v => (
                                            <button key={v} type="button"
                                                onClick={() => upd('uro.pad_use', v)}
                                                className={cn("py-3 rounded-xl text-[9px] font-black uppercase transition-all",
                                                    data.uro?.pad_use === v ? "bg-blue-600 text-white shadow-md" : "bg-slate-50 text-slate-400"
                                                )}>{v}</button>
                                        ))}
                                    </div>
                                </div>

                                <ClinicalNote text="Pergunte: 'Com que frequência você perde urina? É com esforço (tosse/espirro) ou com vontade forte repentina?' Anote o TESTE DA TOSSE: positivo se houver perda visível." />
                            </Card>
                        </div>

                        {/* INTESTINO */}
                        <div className="space-y-5">
                            <div className="flex items-center gap-2 ml-1">
                                <Activity className="h-4 w-4 text-amber-600" />
                                <h5 className="font-black text-slate-800 uppercase text-[11px] tracking-widest">Coloproctologia — Escala Bristol</h5>
                            </div>
                            <Card className="p-8 rounded-[3rem] border-amber-50 shadow-sm space-y-6">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Qual tipo mais se parece com as fezes da paciente?</p>
                                <div className="grid grid-cols-7 gap-1">
                                    {[1, 2, 3, 4, 5, 6, 7].map(n => (
                                        <button key={n} type="button"
                                            onClick={() => upd('procto.bristol_type', n)}
                                            className={cn("h-14 flex flex-col items-center justify-center rounded-xl font-black text-sm transition-all",
                                                data.procto?.bristol_type === n ? "bg-amber-600 text-white shadow-lg" : "bg-white text-amber-400 border border-amber-100 hover:border-amber-300"
                                            )}>T{n}</button>
                                    ))}
                                </div>
                                <div className="text-center bg-amber-50 rounded-2xl p-4">
                                    <p className="text-[10px] font-black text-amber-800 uppercase">
                                        {!data.procto?.bristol_type ? 'Selecione um tipo acima' :
                                            [1, 2].includes(data.procto.bristol_type) ? '🔴 Constipação — Fezes ressecadas / bolinhas' :
                                                [3, 4].includes(data.procto.bristol_type) ? '🟢 Normal — Consistência ideal' :
                                                    '🔵 Tendência Diarreica — Fezes pastosas ou líquidas'}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {[
                                        { id: 'fecal_incontinence', label: 'Incontinência Fecal', desc: 'Perda de gases ou fezes' },
                                        { id: 'hemorrhoids', label: 'Hemorroidas', desc: 'Diagnosticadas ou sintomáticas' },
                                        { id: 'constipation_chronic', label: 'Constipação Crônica', desc: '< 3 evacuações/semana' },
                                        { id: 'pain_evacuation', label: 'Dor na Evacuação', desc: 'Disquezia' },
                                    ].map(item => (
                                        <div key={item.id}
                                            className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-slate-700">{item.label}</p>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase">{item.desc}</p>
                                            </div>
                                            <Checkbox
                                                className="h-6 w-6 rounded-lg data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                                                checked={!!data.procto?.[item.id]}
                                                onCheckedChange={(c) => upd(`procto.${item.id}`, !!c)}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[9px] font-black text-slate-400 uppercase">Manobras Defecatórias</Label>
                                    <Textarea {...register('womens_health.procto.maneuvers')}
                                        className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 text-[11px]"
                                        placeholder="Digitação vaginal, esforço excessivo, posição especial..." />
                                </div>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* ══════════════════════════════════════════════════════════════
                    ABA 4: SEXUALIDADE & DOR PÉLVICA
                ══════════════════════════════════════════════════════════════ */}
                <TabsContent value="sexual" className="space-y-8 outline-none">
                    <div className="max-w-5xl mx-auto space-y-8">

                        <div className="p-5 bg-slate-900 rounded-2xl text-slate-400 flex items-center gap-3">
                            <Info className="h-4 w-4 text-pink-400 shrink-0" />
                            <p className="text-[9px] font-bold uppercase leading-relaxed">
                                Esta aba exige ambiente privado e vínculo terapêutico. Palavras recomendadas: "Como está sua vida íntima?" — evite "relação sexual" na abertura.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            {/* DISFUNÇÕES */}
                            <Card className="p-8 rounded-[3rem] border-slate-100 shadow-sm space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-rose-50 rounded-xl text-rose-600"><Heart className="h-5 w-5" /></div>
                                    <h4 className="font-black text-slate-800 uppercase text-[11px] tracking-widest">Disfunções Sexuais</h4>
                                </div>
                                {[
                                    { id: 'dyspareunia', label: 'Dispareunia', desc: 'Dor durante ou após a penetração', q: 'Tem dor durante a relação?' },
                                    { id: 'vaginismus', label: 'Vaginismo', desc: 'Contratura involuntária da vagina', q: 'Sente espasmo ou dificuldade de introdução?' },
                                    { id: 'low_libido', label: 'Desejo Sexual Hipoativo', desc: 'Queda do interesse sexual', q: 'Sente diminuição no desejo?' },
                                    { id: 'anorgasmia', label: 'Anorgasmia', desc: 'Dificuldade ou ausência de orgasmo', q: 'Tem dificuldade de chegar ao orgasmo?' },
                                    { id: 'lubrication', label: 'Lubrificação Insuficiente', desc: 'Secura vaginal', q: 'Tem ressecamento vaginal?' },
                                ].map(opt => (
                                    <div key={opt.id}
                                        className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-rose-100 transition-all">
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-slate-700">{opt.label}</p>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase">{opt.desc}</p>
                                            <p className="text-[8px] font-bold text-rose-400 mt-0.5 italic">"{opt.q}"</p>
                                        </div>
                                        <Checkbox
                                            className="h-6 w-6 rounded-lg data-[state=checked]:bg-rose-500 data-[state=checked]:border-rose-500"
                                            checked={!!data.sexual?.[opt.id]}
                                            onCheckedChange={(c) => upd(`sexual.${opt.id}`, !!c)}
                                        />
                                    </div>
                                ))}
                            </Card>

                            {/* DOR PÉLVICA CRÔNICA */}
                            <div className="space-y-6">
                                <Card className="p-8 rounded-[3rem] bg-slate-900 text-white shadow-2xl space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-rose-600/20 rounded-xl text-rose-400"><Zap className="h-5 w-5" /></div>
                                        <div>
                                            <h4 className="font-black uppercase text-[11px] tracking-widest text-rose-300">Dor Pélvica</h4>
                                            <p className="text-[9px] text-slate-500 uppercase font-bold">EVA (0–10)</p>
                                        </div>
                                    </div>
                                    <IntensityBar
                                        value={Number(data.eva_score) || 0}
                                        onChange={(n) => upd('eva_score', n)}
                                        color="rose"
                                    />
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Localização da Dor</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {['Baixo ventre', 'Vaginal', 'Retal', 'Lombar', 'Irradiada MMII', 'Difusa'].map(l => (
                                                <button key={l} type="button"
                                                    onClick={() => {
                                                        const curr: string[] = data.pain_location || [];
                                                        upd('pain_location', curr.includes(l) ? curr.filter((x: string) => x !== l) : [...curr, l]);
                                                    }}
                                                    className={cn("py-2 rounded-xl text-[9px] font-black uppercase",
                                                        data.pain_location?.includes(l) ? "bg-rose-600 text-white" : "bg-white/10 text-slate-400 hover:bg-white/20"
                                                    )}>{l}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Quando piora?</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {['Menstruação', 'Relação', 'Evacuação', 'Exercício', 'Estresse', 'Sem padrão'].map(t => (
                                                <button key={t} type="button"
                                                    onClick={() => {
                                                        const curr: string[] = data.pain_triggers || [];
                                                        upd('pain_triggers', curr.includes(t) ? curr.filter((x: string) => x !== t) : [...curr, t]);
                                                    }}
                                                    className={cn("py-2 rounded-xl text-[9px] font-black uppercase",
                                                        data.pain_triggers?.includes(t) ? "bg-rose-600 text-white" : "bg-white/10 text-slate-400 hover:bg-white/20"
                                                    )}>{t}</button>
                                            ))}
                                        </div>
                                    </div>
                                </Card>

                                <Card className="p-6 rounded-[2.5rem] border-slate-100 shadow-sm space-y-3">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Observações Clínicas (Confidencial)</p>
                                    <Textarea {...register('womens_health.sexual.notes')}
                                        className="bg-slate-50 border-none rounded-2xl text-[11px] min-h-[100px]"
                                        placeholder="Contexto clínico, histórico de traumas, achados dignos de nota..." />
                                </Card>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* ══════════════════════════════════════════════════════════════
                    ABA 5: RED FLAGS
                ══════════════════════════════════════════════════════════════ */}
                <TabsContent value="red_flags" className="space-y-6 outline-none">
                    <div className="max-w-4xl mx-auto space-y-6">
                        <div className="flex items-center gap-4 bg-red-950 rounded-[2.5rem] p-6 text-white">
                            <AlertTriangle className="h-8 w-8 text-red-400 shrink-0" />
                            <div>
                                <h4 className="font-black uppercase text-sm tracking-widest text-red-300">Sinais de Alerta — Bandeiras Vermelhas</h4>
                                <p className="text-[10px] text-red-400/70 font-bold uppercase mt-0.5">Presença de qualquer item → encaminhamento médico imediato</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { id: 'hematuria', label: 'Hematúria (Sangue na urina)', weight: 'URGENTE', color: 'red' },
                                { id: 'pelvic_mass', label: 'Massa Pélvica palpável', weight: 'URGENTE', color: 'red' },
                                { id: 'neurological', label: 'Sintomas Neurológicos (anestesia perineal)', weight: 'URGENTE', color: 'red' },
                                { id: 'recurrent_uti', label: 'ITU Recorrente (>3x/ano)', weight: 'ATENÇÃO', color: 'orange' },
                                { id: 'abnormal_bleeding', label: 'Sangramento Vaginal Anormal', weight: 'ATENÇÃO', color: 'orange' },
                                { id: 'nocturnal_enuresis_adult', label: 'Enurese Noturna em adulto', weight: 'ATENÇÃO', color: 'orange' },
                                { id: 'overflow_incontinence', label: 'Bexiga Hipoativa / Retenção Urinária', weight: 'ATENÇÃO', color: 'orange' },
                                { id: 'fistula', label: 'Suspeita de Fístula Vesicovaginal', weight: 'URGENTE', color: 'red' },
                                { id: 'cancer_history', label: 'Histórico de Câncer Pélvico / Radioterapia', weight: 'ATENÇÃO', color: 'orange' },
                            ].map(flag => (
                                <div key={flag.id}
                                    className={cn("flex items-center justify-between p-5 rounded-2xl border transition-all",
                                        data.red_flags?.[flag.id]
                                            ? flag.color === 'red' ? "bg-red-50 border-red-300" : "bg-orange-50 border-orange-300"
                                            : "bg-white border-slate-100 hover:border-slate-200"
                                    )}>
                                    <div className="flex items-center gap-4">
                                        <Checkbox
                                            className="h-6 w-6 rounded-lg data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                                            checked={!!data.red_flags?.[flag.id]}
                                            onCheckedChange={(c) => upd(`red_flags.${flag.id}`, !!c)}
                                        />
                                        <div>
                                            <p className="text-[11px] font-black text-slate-800 uppercase">{flag.label}</p>
                                        </div>
                                    </div>
                                    <Badge className={cn("text-[8px] font-black shrink-0",
                                        flag.color === 'red' ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                                    )}>{flag.weight}</Badge>
                                </div>
                            ))}
                        </div>

                        {Object.values(data.red_flags || {}).some(Boolean) && (
                            <div className="bg-red-600 text-white rounded-[2rem] p-6 text-center space-y-2">
                                <AlertTriangle className="h-8 w-8 mx-auto" />
                                <p className="font-black uppercase tracking-widest">Red Flag Identificado!</p>
                                <p className="text-sm text-red-100 font-medium">Registrar no prontuário e comunicar ao médico responsável antes de prosseguir com o tratamento fisioterapêutico.</p>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
