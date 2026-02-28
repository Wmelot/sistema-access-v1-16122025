"use client";

import React, { useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
    Baby, Activity, Brain, ClipboardCheck, Info, Plus, Star, Zap, Ruler,
    Users, Smile, Heart, Target, Compass, Scale, RefreshCw, CheckCircle,
    Layers, FastForward, ShieldAlert, Move, Dumbbell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const ASHWORTH_SCALE = [
    { value: "0", label: "0 - Tônus Normal", desc: "Sem aumento de tônus muscular." },
    { value: "1", label: "1 - Aumento Leve", desc: "Ligeiro aumento (tensão) no final da amplitude." },
    { value: "1+", label: "1+ - Aumento Leve+", desc: "Ligeiro aumento sentido em menos da metade da amplitude." },
    { value: "2", label: "2 - Aumento Moderado", desc: "Aumento marcante em quase toda a amplitude, mas parte move-se facilmente." },
    { value: "3", label: "3 - Aumento Considerável", desc: "Aumento considerável; movimento passivo difícil." },
    { value: "4", label: "4 - Rigidez", desc: "Parte afetada rígida em flexão ou extensão." },
];

const PRIMITIVE_REFLEXES = [
    { id: "rtca", label: "RTCA (Assimétrico)", description: "Reflexo do Esgrimista. Estimulado pela rotação da cabeça." },
    { id: "rtcs", label: "RTCS (Simétrico)", description: "Estimulado pela flexão/extensão do pescoço (Gato)." },
    { id: "moro", label: "Moro", description: "Reflexo de sobressalto ou queda." },
    { id: "palmar", label: "Preensão Palmar", description: "Fechamento da mão ao toque na palma." },
    { id: "plantar", label: "Preensão Plantar", description: "Flexão dos artelhos ao toque na base." },
    { id: "galant", label: "Galant", description: "Encurvamento lateral do tronco ao toque para-vertebral." },
];

interface NeuropediaRichProtocolProps {
    setIsAssessmentModalOpen?: (isOpen: boolean) => void;
}

export function NeuropediaRichProtocol({ setIsAssessmentModalOpen }: NeuropediaRichProtocolProps) {
    const { watch, setValue, control, register } = useFormContext();
    const [activeTab, setActiveTab] = useState("class");

    const neuropediaData = watch('neuropedia') || {};

    const InfoIcon = ({ content }: { content: string }) => (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Info className="w-3.5 h-3.5 text-slate-300 hover:text-pink-500 cursor-help transition-colors" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs p-3 bg-slate-900 text-white rounded-xl border-none shadow-2xl">
                    <p className="text-[10px] font-bold leading-relaxed">{content}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );

    return (
        <div className="space-y-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex justify-center mb-10 overflow-x-auto pb-2 scrollbar-hide">
                    <TabsList className="bg-slate-100/80 p-1.5 rounded-2xl h-auto gap-1">
                        <TabsTrigger value="class" className="rounded-xl px-4 py-3 data-[state=active]:bg-white data-[state=active]:text-pink-600 data-[state=active]:shadow-sm font-black text-[9px] uppercase tracking-widest transition-all">
                            <Layers className="w-3.5 h-3.5 mr-2" /> F-Words & Class
                        </TabsTrigger>
                        <TabsTrigger value="neuro" className="rounded-xl px-4 py-3 data-[state=active]:bg-white data-[state=active]:text-pink-600 data-[state=active]:shadow-sm font-black text-[9px] uppercase tracking-widest transition-all">
                            <ShieldAlert className="w-3.5 h-3.5 mr-2" /> Clínico (Tônus/Reflexos)
                        </TabsTrigger>
                        <TabsTrigger value="motor" className="rounded-xl px-4 py-3 data-[state=active]:bg-white data-[state=active]:text-pink-600 data-[state=active]:shadow-sm font-black text-[9px] uppercase tracking-widest transition-all">
                            <Move className="w-3.5 h-3.5 mr-2" /> Mobilidade e ADM
                        </TabsTrigger>
                        <TabsTrigger value="aims" className="rounded-xl px-4 py-3 data-[state=active]:bg-white data-[state=active]:text-pink-600 data-[state=active]:shadow-sm font-black text-[9px] uppercase tracking-widest transition-all">
                            <Activity className="w-3.5 h-3.5 mr-2" /> AIMS (0-18m)
                        </TabsTrigger>
                        <TabsTrigger value="scales" className="rounded-xl px-4 py-3 data-[state=active]:bg-white data-[state=active]:text-pink-600 data-[state=active]:shadow-sm font-black text-[9px] uppercase tracking-widest transition-all">
                            <Zap className="w-3.5 h-3.5 mr-2" /> GMFM / MFM / Balanço
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* F-WORDS & CLASSIFICATIONS TAB */}
                <TabsContent value="class" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none">
                    <div className="bg-gradient-to-br from-indigo-50/50 to-pink-50/50 p-8 rounded-[3rem] border border-slate-100 shadow-inner">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-indigo-600 rounded-2xl text-white shadow-lg">
                                <Heart className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-800 uppercase text-xs tracking-[0.2em] flex items-center gap-2">
                                    The F-Words in Childhood Disability
                                    <InfoIcon content="A abordagem mais moderna da CanChild baseada na CIF: Function, Family, Fitness, Fun, Friends, Future." />
                                </h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Referência: Rosenbaum & Gorter (2012)</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[
                                { id: 'f_function', label: 'Function', icon: Activity, placeholder: 'O que a criança faz (Atividade)...', color: 'text-blue-500' },
                                { id: 'f_family', label: 'Family', icon: Users, placeholder: 'Contexto e rede de apoio...', color: 'text-pink-500' },
                                { id: 'f_fitness', label: 'Fitness', icon: Zap, placeholder: 'Saúde física e resistência...', color: 'text-orange-500' },
                                { id: 'f_fun', label: 'Fun', icon: Smile, placeholder: 'O que ela gosta de fazer...', color: 'text-yellow-500' },
                                { id: 'f_friends', label: 'Friends', icon: Users, placeholder: 'Participação social/amizades...', color: 'text-indigo-500' },
                                { id: 'f_future', label: 'Future', icon: Compass, placeholder: 'Expectativas e metas a longo prazo...', color: 'text-emerald-500' },
                            ].map(item => (
                                <Card key={item.id} className="p-4 rounded-3xl border-white/50 bg-white/40 backdrop-blur-sm space-y-3">
                                    <div className="flex items-center gap-2">
                                        <item.icon className={cn("w-4 h-4", item.color)} />
                                        <span className="text-[10px] font-black uppercase text-slate-700 tracking-widest">{item.label}</span>
                                    </div>
                                    <Textarea
                                        {...register(`neuropedia.f_words.${item.id}`)}
                                        className="bg-white/80 border-none rounded-2xl text-[10px] font-medium min-h-[60px] focus:ring-pink-500"
                                        placeholder={item.placeholder}
                                    />
                                </Card>
                            ))}
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        <Card className="p-8 rounded-[2.5rem] border-slate-100 shadow-sm space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-pink-50 rounded-xl text-pink-600">
                                    <Layers className="w-4 h-4" />
                                </div>
                                <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest flex items-center gap-2">
                                    GMFCS - Classificação Motora
                                    <InfoIcon content=" Gross Motor Function Classification System. O padrão-ouro para classificar a função motora grossa em paralisia cerebral." />
                                </h4>
                            </div>
                            <div className="space-y-4">
                                <Select
                                    value={neuropediaData.gmfcs_level}
                                    onValueChange={(v) => setValue('neuropedia.gmfcs_level', v)}
                                >
                                    <SelectTrigger className="h-14 rounded-2xl border-slate-100 bg-slate-50 font-bold text-sm">
                                        <SelectValue placeholder="Selecione o Nível GMFCS..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1" className="font-bold py-3">Nível I - Anda sem restrições</SelectItem>
                                        <SelectItem value="2" className="font-bold py-3">Nível II - Anda com limitações</SelectItem>
                                        <SelectItem value="3" className="font-bold py-3">Nível III - Anda c/ dispositivo manual</SelectItem>
                                        <SelectItem value="4" className="font-bold py-3">Nível IV - Automobilidade c/ limitações</SelectItem>
                                        <SelectItem value="5" className="font-bold py-3">Nível V - Transportado em cadeira</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic text-[11px] text-slate-500 font-medium leading-relaxed">
                                    {neuropediaData.gmfcs_level === '1' && "Crianças andam em casa, na escola e na comunidade. Podem subir escadas sem corrimão. Correm e saltam, mas a velocidade e coordenação são reduzidas."}
                                    {neuropediaData.gmfcs_level === '2' && "Crianças andam na maioria dos ambientes e sobem escadas segurando o corrimão. Podem ter dificuldade em longas distâncias e terrenos irregulares."}
                                    {neuropediaData.gmfcs_level === '3' && "Crianças andam usando um dispositivo de mobilidade manual em ambientes internos. Podem usar cadeira de rodas para longas distâncias."}
                                    {neuropediaData.gmfcs_level === '4' && "Mobilidade limitada; exigem assistência física ou mobilidade motorizada na maioria dos ambientes."}
                                    {neuropediaData.gmfcs_level === '5' && "Comprometimento grave; transportadas em cadeira de rodas manual em todos os ambientes. Capacidade limitada de manter postura antigravitacional."}
                                    {!neuropediaData.gmfcs_level && "Selecione um nível para ver o perfil clínico detalhado."}
                                </div>
                            </div>
                        </Card>

                        <Card className="p-8 rounded-[2.5rem] border-slate-100 shadow-sm space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                                    <Layers className="w-4 h-4" />
                                </div>
                                <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest flex items-center gap-2">
                                    MACS - Habilidade Manual
                                    <InfoIcon content="Manual Ability Classification System. Classifica como crianças com PC usam suas mãos para manipular objetos no dia a dia." />
                                </h4>
                            </div>
                            <Select value={neuropediaData.macs_level} onValueChange={(v) => setValue('neuropedia.macs_level', v)}>
                                <SelectTrigger className="h-14 rounded-2xl border-slate-100 bg-slate-50 font-bold text-sm">
                                    <SelectValue placeholder="Selecione o Nível MACS..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1" className="font-bold py-3">Nível I - Manipula facilmente</SelectItem>
                                    <SelectItem value="2" className="font-bold py-3">Nível II - Manipula com qualidade reduzida</SelectItem>
                                    <SelectItem value="3" className="font-bold py-3">Nível III - Manipula com dificuldade</SelectItem>
                                    <SelectItem value="4" className="font-bold py-3">Nível IV - Manipula itens simples parcialmente</SelectItem>
                                    <SelectItem value="5" className="font-bold py-3">Nível V - Não manipula objetos</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic text-[11px] text-slate-500 font-medium min-h-[100px]">
                                {neuropediaData.macs_level === '1' && "Manipula objetos com facilidade e sucesso. Algumas limitações na velocidade e precisão de tarefas bimanuais complexas."}
                                {neuropediaData.macs_level === '3' && "Manipula objetos com dificuldade; necessita de ajuda para preparar e/ou modificar a atividade. A performance é lenta."}
                                {!neuropediaData.macs_level && "O MACS avalia a performance típica de manipulação bimanual de 4 a 18 anos."}
                            </div>
                        </Card>
                    </div>
                </TabsContent>

                {/* NEURO TAB (TONE/REFLEXES) */}
                <TabsContent value="neuro" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none">
                    <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                        {/* Tone / Ashworth Section */}
                        <Card className="p-8 rounded-[3rem] border-slate-100 shadow-sm space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-100 rounded-xl text-orange-600">
                                    <Scale className="w-5 h-5" />
                                </div>
                                <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest flex items-center gap-3">
                                    Tônus Muscular (Ashworth)
                                    <InfoIcon content="Escala de Ashworth Modificada para avaliação de Espasticidade. Realize o movimento passivo em velocidade rápida." />
                                </h4>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                {['MMS Superiores', 'MMS Inferiores'].map(region => {
                                    const sideKey = region.includes('Superiores') ? 'upper' : 'lower';
                                    return (
                                        <div key={region} className="space-y-4">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center italic">{region}</span>
                                            <div className="space-y-4">
                                                {['Esq', 'Dir'].map(side => (
                                                    <div key={side} className="space-y-2">
                                                        <Label className="text-[9px] font-bold text-slate-500 uppercase px-1">{side}</Label>
                                                        <Select
                                                            value={neuropediaData[`tone_${sideKey}_${side.toLowerCase()}`]}
                                                            onValueChange={(v) => setValue(`neuropedia.tone_${sideKey}_${side.toLowerCase()}`, v)}
                                                        >
                                                            <SelectTrigger className="h-10 rounded-xl border-slate-100 bg-slate-50 font-bold text-xs uppercase">
                                                                <SelectValue placeholder="0" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {ASHWORTH_SCALE.map(opt => (
                                                                    <SelectItem key={opt.value} value={opt.value} className="text-xs font-bold uppercase py-2">
                                                                        {opt.label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100 text-[10px] text-orange-700 italic font-medium leading-relaxed">
                                <strong>Nota:</strong> Espasticidade é dependente de velocidade. Para avaliação de distonia ou rigidez extrapiramidal, use observação clínica funcional.
                            </div>
                        </Card>

                        {/* Primitive Reflexes Section */}
                        <Card className="p-8 rounded-[3rem] border-slate-100 shadow-sm space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-pink-100 rounded-xl text-pink-600">
                                    <RefreshCw className="w-5 h-5" />
                                </div>
                                <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest flex items-center gap-3">
                                    Reflexos e Reações Primitivas
                                    <InfoIcon content="Avaliação da integridade do Tronco Encefálico e integração cortical. A persistência além do tempo esperado indica atraso neuromotor." />
                                </h4>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {PRIMITIVE_REFLEXES.map(reflex => (
                                    <div key={reflex.id} className="group p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between transition-all hover:border-pink-200">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase text-slate-700 tracking-tight flex items-center gap-2">
                                                {reflex.label}
                                                <InfoIcon content={reflex.description} />
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-inner border border-slate-100">
                                            <button
                                                type="button"
                                                onClick={() => setValue(`neuropedia.reflexes.${reflex.id}`, 'integrated')}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all",
                                                    neuropediaData?.reflexes?.[reflex.id] === 'integrated' ? "bg-emerald-600 text-white shadow-md" : "bg-transparent text-slate-400"
                                                )}
                                            > Integrado </button>
                                            <button
                                                type="button"
                                                onClick={() => setValue(`neuropedia.reflexes.${reflex.id}`, 'present')}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all",
                                                    neuropediaData?.reflexes?.[reflex.id] === 'present' ? "bg-rose-600 text-white shadow-md" : "bg-transparent text-slate-400"
                                                )}
                                            > Presente </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </TabsContent>

                {/* MOBILITY & ADM TAB */}
                <TabsContent value="motor" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none">
                    <Card className="p-8 rounded-[3rem] border-slate-100 shadow-sm max-w-4xl mx-auto space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                                    <Move className="w-5 h-5" />
                                </div>
                                <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Amplitude de Movimento (ADM) e Força</h4>
                            </div>
                            <Badge className="bg-slate-100 text-slate-500 border-none font-black text-[9px] px-3 py-1">MOVIMENTOS PASSIVOS</Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { id: 'hip_flex', label: 'Flexão Quadril (º)', info: 'Encurtamento de Psoas?' },
                                { id: 'knee_ext', label: 'Extensão Joelho (º)', info: 'Ângulo Poplíteo.' },
                                { id: 'ankle_dorsi', label: 'Dorsiflexão (º)', info: 'Disfunção do Tríceps Sural.' },
                                { id: 'elbow_ext', label: 'Extensão Cotovelo (º)', info: 'Encurtamento de Bíceps em PC.' },
                                { id: 'head_rot', label: 'Rotação Cervical', info: 'Assimetria (Torcicolo Congênito?)' },
                            ].map(item => (
                                <div key={item.id} className="space-y-2 p-5 bg-slate-50 rounded-3xl border border-slate-100 group transition-all hover:bg-white hover:border-indigo-200">
                                    <div className="flex items-center justify-between px-1">
                                        <Label className="text-[10px] font-black uppercase text-slate-700 tracking-tight flex items-center gap-2">
                                            {item.label}
                                            <InfoIcon content={item.info} />
                                        </Label>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Input
                                            {...register(`neuropedia.adm.${item.id}_l`)}
                                            className="h-12 bg-white rounded-xl border-slate-100 text-center font-black text-lg focus:ring-indigo-500"
                                            placeholder="E"
                                        />
                                        <Input
                                            {...register(`neuropedia.adm.${item.id}_r`)}
                                            className="h-12 bg-white rounded-xl border-slate-100 text-center font-black text-lg focus:ring-indigo-500"
                                            placeholder="D"
                                        />
                                    </div>
                                </div>
                            ))}
                            <Card className="p-5 bg-indigo-950 text-white rounded-3xl space-y-4 shadow-xl">
                                <div className="flex items-center gap-2">
                                    <Dumbbell className="w-4 h-4 text-indigo-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Força Funcional</span>
                                </div>
                                <Textarea
                                    {...register('neuropedia.strength_notes')}
                                    className="bg-white/10 border-none rounded-2xl text-[10px] font-medium min-h-[90px] text-white focus:bg-white/20"
                                    placeholder="Descreva a capacidade de gerar torque em padrões funcionais (ex: subir degraus, transferências)..."
                                />
                            </Card>
                        </div>
                    </Card>
                </TabsContent>

                {/* AIMS TAB */}
                <TabsContent value="aims" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none">
                    <div className="max-w-6xl mx-auto space-y-8">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-pink-100 rounded-2xl flex items-center justify-center text-pink-600 shadow-sm">
                                    <Activity className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-800 uppercase text-sm tracking-[0.1em] flex items-center gap-2">
                                        AIMS (Alberta Infant Motor Scale)
                                        <InfoIcon content="Padrão-ouro para observação do desenvolvimento motor em bebês de 0 a 18 meses. Avalia prono, supino, sentado e de pé." />
                                    </h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Piper & Darrah (1994) - 58 Itens Observacionais</p>
                                </div>
                            </div>
                            <div className="bg-pink-600 text-white px-8 py-3 rounded-[2rem] shadow-xl shadow-pink-200 flex flex-col items-center">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">Score Bruto</span>
                                <span className="text-2xl font-black">{(neuropediaData.aims_score || 0)} <span className="text-sm opacity-50">/ 58</span></span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {['Prono', 'Supino', 'Sentado', 'De pé'].map((postura) => {
                                const key = postura.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                                const itemsCount = postura === 'Prono' ? 21 : postura === 'Supino' ? 9 : postura === 'Sentado' ? 12 : 16;
                                const currentVal = neuropediaData[`aims_${key}`] || 0;

                                return (
                                    <Card key={postura} className="p-6 rounded-3xl border-slate-100 shadow-sm space-y-4 hover:border-pink-200 transition-all group">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">{postura}</h4>
                                            <Badge className="bg-slate-50 text-slate-400 border-none font-black text-[8px]">{itemsCount} ITENS</Badge>
                                        </div>
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-center justify-center h-20 w-20 bg-pink-50 rounded-[2.5rem] mx-auto group-hover:bg-pink-100 transition-colors">
                                                <span className="text-3xl font-black text-pink-600">{currentVal}</span>
                                            </div>
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase">
                                                    <span>Progresso</span>
                                                    <span>{Math.round((currentVal / itemsCount) * 100)}%</span>
                                                </div>
                                                <Progress value={(currentVal / itemsCount) * 100} className="h-2 bg-slate-50" />
                                            </div>
                                            <div className="flex items-center bg-slate-50 border border-slate-100 rounded-2xl p-0.5 shadow-inner">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 text-slate-400"
                                                    onClick={() => setValue(`neuropedia.aims_${key}`, Math.max(0, currentVal - 1))}
                                                > - </Button>
                                                <div className="flex-1 text-center font-black text-slate-800 text-sm">{currentVal}</div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 text-pink-600"
                                                    onClick={() => {
                                                        const newVal = Math.min(itemsCount, currentVal + 1);
                                                        setValue(`neuropedia.aims_${key}`, newVal);
                                                        const s_prono = key === 'prono' ? newVal : (neuropediaData.aims_prono || 0);
                                                        const s_supino = key === 'supino' ? newVal : (neuropediaData.aims_supino || 0);
                                                        const s_sentado = key === 'sentado' ? newVal : (neuropediaData.aims_sentado || 0);
                                                        const s_depe = key === 'depe' ? newVal : (neuropediaData.aims_depe || 0);
                                                        setValue('neuropedia.aims_score', s_prono + s_supino + s_sentado + s_depe);
                                                    }}
                                                > + </Button>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                </TabsContent>

                {/* SCALES TAB (GMFM/MFM/PBS) */}
                <TabsContent value="scales" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-6xl mx-auto">
                        {/* GMFM Card */}
                        <Card className="p-10 rounded-[3rem] border-slate-100 bg-white shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Star className="w-24 h-24 text-indigo-900" />
                            </div>
                            <div className="space-y-8 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                        <Star className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-900 uppercase text-xs tracking-[0.2em] flex items-center gap-2">
                                            GMFM-88
                                            <InfoIcon content="Gross Motor Function Measure. A bíblia da função motora. Avalia as dimensões A a E, do deitado até o correr e pular." />
                                        </h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Referencial: CanChild / GMAE Estimate</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {['A - Deitado', 'B - Sentado', 'C - Gatinhando', 'D - De Pé', 'E - Correr/Pular'].map((dim, i) => (
                                        <div key={dim} className="bg-slate-50 p-4 rounded-[1.5rem] border border-slate-100 flex flex-col gap-1">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{dim}</span>
                                            <div className="flex justify-between items-baseline">
                                                <span className="font-black text-slate-800 text-lg">0%</span>
                                                <span className="text-[8px] font-bold text-slate-300">DIM {String.fromCharCode(65 + i)}</span>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="bg-indigo-600 p-4 rounded-[1.5rem] text-white flex flex-col items-center justify-center shadow-lg">
                                        <span className="text-[9px] font-black uppercase opacity-60">Score Geral</span>
                                        <span className="text-xl font-black">0%</span>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => { setValue('conduct.extraQuestionnaire', 'gmfm88'); setIsAssessmentModalOpen?.(true); }}
                                    className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-all"
                                > ABRIR PROTOCOLO COMPLETO [GMFM-88] </Button>
                            </div>
                        </Card>

                        {/* Balance & Functional Card */}
                        <Card className="p-10 rounded-[3rem] border-slate-100 bg-white shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Compass className="w-24 h-24 text-emerald-900" />
                            </div>
                            <div className="space-y-8 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                        <Compass className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-900 uppercase text-xs tracking-[0.2em] flex items-center gap-2">
                                            Equilíbrio e Outras Escalas
                                            <InfoIcon content="Complemente sua avaliação com PBS (Pediátrico), MFM (Função Motora Neuromuscular) ou ECAB (Balanço Precoce)." />
                                        </h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Instrumentos Validados PEDro</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {[
                                        { id: 'pbs_pediatric', label: 'PBS - Equilíbrio Pediátrico', desc: '0 a 56 pts | 14 itens' },
                                        { id: 'mfm32', label: 'MFM-32 - Função Neuromuscular', desc: 'D1, D2 e D3 | Padrão-ouro em miodistrofias' },
                                        { id: 'ecab', label: 'ECAB - Balanço Inicial', desc: 'Especialmente p/ GMFCS III, IV, V' }
                                    ].map(item => (
                                        <Button
                                            key={item.id}
                                            variant="outline"
                                            onClick={() => { setValue('conduct.extraQuestionnaire', item.id); setIsAssessmentModalOpen?.(true); }}
                                            className="w-full h-16 rounded-2xl border-slate-100 bg-slate-50 flex flex-col items-start px-6 gap-0 hover:bg-emerald-50 hover:border-emerald-200 transition-all group/btn"
                                        >
                                            <span className="text-[10px] font-black uppercase text-slate-800 tracking-widest group-hover/btn:text-emerald-900">{item.label}</span>
                                            <span className="text-[9px] font-bold text-slate-400 group-hover/btn:text-emerald-700/60 uppercase tracking-tighter">{item.desc}</span>
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            <div className="bg-pink-50/50 p-8 flex items-center gap-5 border-t border-pink-100 rounded-[2rem]">
                <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center border border-pink-100 shadow-sm shrink-0">
                    <Star className="h-6 w-6 text-pink-500 fill-pink-500 animate-pulse" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-pink-700 uppercase tracking-[0.1em] mb-1">Dica Clínica Axiom (Ref. PEDro)</p>
                    <p className="text-[10px] font-bold text-pink-900/60 leading-relaxed uppercase tracking-tighter">
                        Integre os achados do GMFCS com os objetivos da família através das "F-Words". Focar em participação (Fun & Friends) aumenta a adesão terapêutica em comparação com o foco exclusivo em funções estruturais.
                    </p>
                </div>
            </div>
        </div>
    );
}
