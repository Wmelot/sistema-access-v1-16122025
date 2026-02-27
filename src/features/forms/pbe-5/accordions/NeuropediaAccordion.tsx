"use client";

import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Baby, Activity, Brain, ClipboardCheck, Info, Plus, Star, Zap, Ruler } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

interface NeuropediaAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string; iconColor: string; bg: string };
    setIsAssessmentModalOpen?: (isOpen: boolean) => void;
}

export function NeuropediaAccordion({ openSection, isSectionFilled, sectionStyle, setIsAssessmentModalOpen }: NeuropediaAccordionProps) {
    const { watch, setValue } = useFormContext();
    const [activeTab, setActiveTab] = useState("aims");

    const neuropediaData = watch('neuropedia') || {};

    const isFilled = isSectionFilled('neuropedia');

    return (
        <AccordionItem
            value="neuropedia"
            className={cn(
                "border rounded-[2rem] border-l-4 transition-all duration-300 shadow-sm overflow-hidden",
                openSection === 'neuropedia' ? 'bg-white ring-2 ring-pink-50' : 'bg-white/50',
                isFilled ? 'border-slate-200' : 'border-slate-100',
                sectionStyle.border
            )}
        >
            <AccordionTrigger className="px-8 py-6 hover:no-underline flex gap-2 items-center text-left group">
                <div className="flex items-center gap-4 flex-1">
                    <div className={cn("p-2 rounded-xl transition-colors", openSection === 'neuropedia' ? "bg-pink-500 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-pink-50 group-hover:text-pink-500")}>
                        <Baby className="h-5 w-5" />
                    </div>
                    <div>
                        <span className={cn("font-black text-lg tracking-tight", openSection === 'neuropedia' ? "text-slate-900" : "text-slate-600")}>Neuropediatria & Desenvolvimento</span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">AIMS, GMFM, MFM e Classificações Funcionais</p>
                    </div>
                </div>
                {isFilled && (
                    <Badge variant="outline" className="bg-pink-100 text-pink-700 border-none text-[10px] h-6 px-3 rounded-full font-black uppercase">
                        ATIVA
                    </Badge>
                )}
            </AccordionTrigger>
            <AccordionContent className="px-0 pb-0 border-t border-slate-50">
                <div className="p-8">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="flex justify-center mb-10">
                            <TabsList className="bg-slate-100/80 p-1.5 rounded-2xl h-auto gap-1">
                                <TabsTrigger value="class" className="rounded-xl px-6 py-3 data-[state=active]:bg-white data-[state=active]:text-pink-600 data-[state=active]:shadow-sm font-black text-[10px] uppercase tracking-widest transition-all">
                                    <ClipboardCheck className="w-4 h-4 mr-2" /> Classificações
                                </TabsTrigger>
                                <TabsTrigger value="aims" className="rounded-xl px-6 py-3 data-[state=active]:bg-white data-[state=active]:text-pink-600 data-[state=active]:shadow-sm font-black text-[10px] uppercase tracking-widest transition-all">
                                    <Activity className="w-4 h-4 mr-2" /> AIMS
                                </TabsTrigger>
                                <TabsTrigger value="motor" className="rounded-xl px-6 py-3 data-[state=active]:bg-white data-[state=active]:text-pink-600 data-[state=active]:shadow-sm font-black text-[10px] uppercase tracking-widest transition-all">
                                    <Zap className="w-4 h-4 mr-2" /> GMFM / MFM
                                </TabsTrigger>
                                <TabsTrigger value="equil" className="rounded-xl px-6 py-3 data-[state=active]:bg-white data-[state=active]:text-pink-600 data-[state=active]:shadow-sm font-black text-[10px] uppercase tracking-widest transition-all">
                                    <Ruler className="w-4 h-4 mr-2" /> Eq. Pediátrico
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* CLASSIFICATIONS TAB */}
                        <TabsContent value="class" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none">
                            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                                <Card className="p-8 rounded-[2.5rem] border-slate-100 shadow-sm space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-pink-50 rounded-xl text-pink-600">
                                            <Brain className="w-5 h-5" />
                                        </div>
                                        <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">GMFCS (Classificação Motora)</h4>
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
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic text-[11px] text-slate-500 font-medium">
                                            {neuropediaData.gmfcs_level === '1' && "Crianças andam em casa, na escola, ao ar livre e na comunidade. Podem subir escadas sem usar o corrimão."}
                                            {neuropediaData.gmfcs_level === '2' && "Crianças andam na maioria dos ambientes e sobem escadas segurando o corrimão. Podem ter dificuldade em longas distâncias."}
                                            {neuropediaData.gmfcs_level === '3' && "Crianças andam usando um dispositivo de mobilidade manual na maioria dos ambientes internos."}
                                            {neuropediaData.gmfcs_level === '4' && "Crianças usam métodos de mobilidade que exigem assistência física ou mobilidade motorizada."}
                                            {neuropediaData.gmfcs_level === '5' && "Crianças são transportadas em uma cadeira de rodas manual em todos os ambientes."}
                                            {!neuropediaData.gmfcs_level && "Selecione um nível para ver a descrição detalhada."}
                                        </div>
                                    </div>
                                </Card>
                            </div>
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
                                            <h3 className="font-black text-slate-800 uppercase text-sm tracking-widest">AIMS (Alberta Infant Motor Scale)</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Observação do desenvolvimento motor (58 itens)</p>
                                        </div>
                                    </div>
                                    <div className="bg-pink-600 text-white px-6 py-2.5 rounded-2xl shadow-lg shadow-pink-200">
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-70 mr-2">Score Total:</span>
                                        <span className="text-xl font-black">{(neuropediaData.aims_score || 0)} / 58</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {['Prono', 'Supino', 'Sentado', 'De pé'].map((postura) => {
                                        const key = postura.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                                        const itemsCount = postura === 'Prono' ? 21 : postura === 'Supino' ? 9 : postura === 'Sentado' ? 12 : 16;
                                        const currentVal = neuropediaData[`aims_${key}`] || 0;

                                        return (
                                            <Card key={postura} className="p-8 rounded-[2.5rem] border-slate-100 shadow-sm space-y-6">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">{postura}</h4>
                                                    <Badge className="bg-slate-100 text-slate-600 border-none font-black">{itemsCount} ITENS</Badge>
                                                </div>
                                                <div className="space-y-6">
                                                    <div className="flex items-center gap-6">
                                                        <div className="flex-1 space-y-2">
                                                            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase">
                                                                <span>Janela Motora</span>
                                                                <span>{currentVal} / {itemsCount}</span>
                                                            </div>
                                                            <Progress value={(currentVal / itemsCount) * 100} className="h-3 bg-slate-100" />
                                                        </div>
                                                        <div className="flex items-center bg-white border border-slate-100 rounded-2xl p-1 shadow-inner">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-10 w-10 text-slate-300"
                                                                onClick={() => setValue(`neuropedia.aims_${key}`, Math.max(0, currentVal - 1))}
                                                            >
                                                                -
                                                            </Button>
                                                            <input
                                                                type="number"
                                                                className="w-12 text-center font-black text-slate-700 bg-transparent outline-none border-none"
                                                                value={currentVal}
                                                                onChange={(e) => {
                                                                    const v = parseInt(e.target.value) || 0;
                                                                    setValue(`neuropedia.aims_${key}`, Math.min(itemsCount, v));
                                                                    // Update total
                                                                }}
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-10 w-10 text-pink-600"
                                                                onClick={() => {
                                                                    const newVal = Math.min(itemsCount, currentVal + 1);
                                                                    setValue(`neuropedia.aims_${key}`, newVal);
                                                                    const total = (neuropediaData.aims_prono || 0) + (neuropediaData.aims_supino || 0) +
                                                                        (neuropediaData.aims_sentado || 0) + (neuropediaData.aims_depe || 0) + (newVal - currentVal);
                                                                    setValue('neuropedia.aims_score', total);
                                                                }}
                                                            >
                                                                +
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic">Marque apenas os itens observados no repertório motor estável do bebê.</p>
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        </TabsContent>

                        {/* MOTOR FUNCTION TAB (GMFM/MFM) */}
                        <TabsContent value="motor" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none px-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-6xl mx-auto">
                                {/* GMFM-88 Summary */}
                                <Card className="p-10 rounded-[3rem] border-slate-100 bg-white shadow-xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-5">
                                        <Activity className="w-24 h-24 text-slate-900" />
                                    </div>
                                    <div className="space-y-8 relative z-10">
                                        <div className="flex items-center gap-4">
                                            <div className="h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                                <Star className="w-7 h-7" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-900 uppercase text-sm tracking-widest">GMFM-88</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Gross Motor Function Measure</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            {['A', 'B', 'C', 'D', 'E'].map(dim => (
                                                <div key={dim} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1 hover:border-indigo-200 transition-colors">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dimens {dim}</span>
                                                    <div className="flex justify-between items-end">
                                                        <span className="font-black text-slate-700">0%</span>
                                                        <span className="text-[8px] font-black text-slate-300 uppercase italic">0 / {dim === 'A' ? 17 : dim === 'B' ? 20 : dim === 'C' ? 14 : dim === 'D' ? 13 : 24}</span>
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="bg-indigo-600 p-4 rounded-2xl shadow-lg flex flex-col justify-center items-center col-span-2">
                                                <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">Score Geral</span>
                                                <span className="text-2xl font-black text-white">0%</span>
                                            </div>
                                        </div>

                                        <Button
                                            onClick={() => {
                                                setValue('conduct.extraQuestionnaire', 'gmfm88');
                                                setIsAssessmentModalOpen?.(true);
                                            }}
                                            className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all"
                                        >
                                            ABRIR AVALIAÇÃO COMPLETA
                                        </Button>
                                    </div>
                                </Card>

                                {/* MFM-32 Summary */}
                                <Card className="p-10 rounded-[3rem] border-slate-100 bg-white shadow-xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-5">
                                        <Zap className="w-24 h-24 text-slate-900" />
                                    </div>
                                    <div className="space-y-8 relative z-10">
                                        <div className="flex items-center gap-4">
                                            <div className="h-14 w-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                                <Zap className="w-7 h-7" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-900 uppercase text-sm tracking-widest">MFM-32</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Medida da Função Motora</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="p-5 bg-emerald-50 rounded-3xl border border-emerald-100 space-y-3">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">D1: Em pé / Transferências</span>
                                                    <span className="text-xs font-black text-emerald-600">0%</span>
                                                </div>
                                                <Progress value={0} className="h-2 bg-white" />
                                            </div>
                                            <div className="p-5 bg-blue-50 rounded-3xl border border-blue-100 space-y-3">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-[10px] font-black text-blue-800 uppercase tracking-widest">D2: Axial / Proximal</span>
                                                    <span className="text-xs font-black text-blue-600">0%</span>
                                                </div>
                                                <Progress value={0} className="h-2 bg-white" />
                                            </div>
                                            <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-3">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">D3: Distal</span>
                                                    <span className="text-xs font-black text-slate-600">0%</span>
                                                </div>
                                                <Progress value={0} className="h-2 bg-white" />
                                            </div>
                                        </div>

                                        <Button
                                            onClick={() => {
                                                setValue('conduct.extraQuestionnaire', 'mfm32');
                                                setIsAssessmentModalOpen?.(true);
                                            }}
                                            className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all"
                                        >
                                            ABRIR MFM-32 COMPLETA
                                        </Button>
                                    </div>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* BALANCE TAB (PBS/ECAB) */}
                        <TabsContent value="equil" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none">
                            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                                <Card className="p-8 rounded-[2.5rem] border-slate-100 shadow-sm space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-sky-50 rounded-xl text-sky-600">
                                            <Ruler className="w-5 h-5" />
                                        </div>
                                        <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">PBS (Equilíbrio Pediátrico)</h4>
                                    </div>
                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tighter">Escala de 14 itens para crianças em idade escolar.</p>
                                    <Button
                                        onClick={() => {
                                            setValue('conduct.extraQuestionnaire', 'pbs_pediatric');
                                            setIsAssessmentModalOpen?.(true);
                                        }}
                                        className="w-full h-12 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all font-black uppercase tracking-widest text-[10px]"
                                    >
                                        INICIAR PBS (0-56 pts)
                                    </Button>
                                </Card>

                                <Card className="p-8 rounded-[2.5rem] border-slate-100 shadow-sm space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-orange-50 rounded-xl text-orange-600">
                                            <Activity className="w-5 h-5" />
                                        </div>
                                        <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">ECAB (Balanço Inicial)</h4>
                                    </div>
                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tighter">Ideal para GMFCS III, IV e V (Precoce).</p>
                                    <Button
                                        onClick={() => {
                                            setValue('conduct.extraQuestionnaire', 'ecab');
                                            setIsAssessmentModalOpen?.(true);
                                        }}
                                        className="w-full h-12 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all font-black uppercase tracking-widest text-[10px]"
                                    >
                                        INICIAR ECAB (0-100 pts)
                                    </Button>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="bg-pink-50/50 p-6 flex items-center gap-4 border-t border-pink-100">
                    <Info className="h-5 w-5 text-pink-500 shrink-0" />
                    <p className="text-[10px] font-bold text-pink-700 leading-relaxed uppercase tracking-tighter">
                        As pontuações nestas escalas permitem gerar gráficos de radar no relatório final para visualização da evolução centrada na funcionalidade e neurodesenvolvimento.
                    </p>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
