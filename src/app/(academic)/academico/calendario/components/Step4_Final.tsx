'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Check,
    Clock,
    Sparkles,
    Info,
    Link as LinkIcon,
    ChevronLeft,
    Calendar as CalendarIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { useSyllabus } from './SyllabusContext';
import { cn } from "@/lib/utils";

export default function Step4_Final() {
    const {
        setStep,
        viewMode, setViewMode,
        completedTopicIds,
        topics,
        publicSlug,
        fullSchedule,
        toggleTopicCompletion,
        books,
        theoryLocation,
        practiceLocation,
        saveDraft
    } = useSyllabus();

    const totalClasses = fullSchedule.filter((s: any) => s.type !== 'holiday' && s.type !== 'empty').length;
    const progressPercent = totalClasses > 0 ? Math.round((completedTopicIds.length / totalClasses) * 100) : 0;

    return (
        <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-10 pb-40">
            {/* HEADBOARD - VIEW MODE SELECTOR */}
            <div className="bg-white/80 backdrop-blur-md p-2 rounded-[32px] shadow-xl shadow-slate-200/50 flex gap-2 w-fit mx-auto border border-white">
                <Button
                    variant="ghost"
                    onClick={() => setViewMode('professor')}
                    className={cn(
                        "rounded-[24px] px-8 h-12 font-black text-[10px] uppercase transition-all",
                        viewMode === 'professor' ? "bg-[#8C132C] text-white shadow-lg shadow-[#8C132C]/20" : "text-slate-400 hover:bg-slate-50"
                    )}
                >
                    Modo Professor (Gestão)
                </Button>
                <Button
                    variant="ghost"
                    onClick={() => setViewMode('student')}
                    className={cn(
                        "rounded-[24px] px-8 h-12 font-black text-[10px] uppercase transition-all",
                        viewMode === 'student' ? "bg-[#8C132C] text-white shadow-lg shadow-[#8C132C]/20" : "text-slate-400 hover:bg-slate-50"
                    )}
                >
                    Modo Aluno (Consulta)
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LEFT: PROGRESS & INFO */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="p-8 rounded-[44px] border-none shadow-2xl bg-[#363636] text-white overflow-hidden relative">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
                        <h3 className="text-sm font-black uppercase tracking-widest opacity-50 mb-6 font-bold">Progresso do Semestre</h3>
                        <div className="flex items-end gap-4 mb-2">
                            <span className="text-6xl font-black">{progressPercent}%</span>
                            <span className="text-xs font-bold opacity-40 pb-3 uppercase">Concluído</span>
                        </div>
                        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                className="h-full bg-emerald-400 shadow-[0_0_20px_#10b981]"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-white/10 font-bold">
                            <div>
                                <div className="text-[9px] font-black uppercase opacity-40">Aulas Dadas</div>
                                <div className="text-xl font-black">{completedTopicIds.length}</div>
                            </div>
                            <div>
                                <div className="text-[9px] font-black uppercase opacity-40">Restantes</div>
                                <div className="text-xl font-black">{totalClasses - completedTopicIds.length}</div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-8 rounded-[44px] border-none shadow-xl bg-white/80 backdrop-blur-xl border border-white space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-[#8C132C]/5 flex items-center justify-center text-[#8C132C]"><LinkIcon size={20} /></div>
                            <div>
                                <h4 className="text-sm font-black text-slate-700">Link de Acesso Acadêmico</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Compartilhe com seus alunos</p>
                            </div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between border border-slate-100">
                            <code className="text-[10px] font-black text-[#8C132C] truncate pr-4">
                                {typeof window !== 'undefined' ? window.location.host : 'axiom.ai'}/cronograma/{publicSlug}
                            </code>
                            <Button variant="ghost" size="sm" className="h-8 rounded-lg bg-white shadow-sm font-black text-[9px] uppercase px-3 hover:bg-[#8C132C] hover:text-white transition-all" onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/cronograma/${publicSlug}`);
                                toast.success("Link copiado!");
                            }}>Copiar</Button>
                        </div>
                    </Card>
                </div>

                {/* RIGHT: INTERACTIVE SCHEDULE LOG */}
                <div className="lg:col-span-8 space-y-4">
                    <div className="flex justify-between items-center px-4">
                        <h3 className="text-lg font-black text-slate-700 font-bold">Diário de Classe Digital</h3>
                        <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] uppercase tracking-[0.2em] px-4 py-1.5 shadow-sm">Semestre Ativo</Badge>
                    </div>

                    <div className="space-y-4">
                        {fullSchedule.filter((s: any) => s.type !== 'empty').map((item, index) => {
                            const isDone = completedTopicIds.includes(item.instanceId);
                            const isAssessment = item.type === 'assessment';
                            const isHoliday = item.type === 'holiday';

                            return (
                                <motion.div
                                    layout
                                    key={`${item.id || item.dateStr}-${index}`}
                                    className={cn(
                                        "p-4 rounded-2xl border-2 transition-all flex items-center gap-4 group",
                                        isHoliday ? "bg-pink-50/50 border-pink-100 shadow-none" : "bg-white/80 backdrop-blur-sm border-slate-50 shadow-sm hover:border-[#8C132C]/20 hover:shadow-lg hover:translate-x-1",
                                        isDone && !isHoliday ? "border-emerald-100 opacity-60" : ""
                                    )}
                                >
                                    {viewMode === 'professor' && !isHoliday && (
                                        <button
                                            onClick={() => toggleTopicCompletion(item.instanceId)}
                                            className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center transition-all border-2 shrink-0 animate-in zoom-in-50",
                                                isDone ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200" : "bg-white border-slate-100 text-slate-200 group-hover:border-[#8C132C]/30"
                                            )}
                                        >
                                            <Check size={20} strokeWidth={4} />
                                        </button>
                                    )}

                                    {isHoliday && (
                                        <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center text-pink-500 shrink-0">
                                            <CalendarIcon size={20} />
                                        </div>
                                    )}

                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-0.5">
                                            <span className={cn("text-[10px] font-black uppercase tracking-widest", isHoliday ? "text-pink-400" : "text-slate-400")}>
                                                {item.date} • {item.dia}
                                            </span>
                                            {isAssessment && <Badge className="bg-amber-500 text-white text-[8px] font-black uppercase px-2 py-0 border-none shadow-sm">Avaliação</Badge>}
                                            {item.isPractical && <Badge className="bg-blue-50 text-blue-500 text-[8px] font-black uppercase px-2 py-0 border-none shadow-sm">Prática</Badge>}
                                            {isHoliday && <Badge className="bg-pink-500 text-white text-[8px] font-black uppercase px-2 py-0 border-none shadow-sm">Feriado / Recesso</Badge>}
                                        </div>
                                        <h4 className={cn(
                                            "text-base font-black transition-all",
                                            isDone && !isHoliday ? "text-slate-400 line-through" : "text-slate-800",
                                            isHoliday ? "text-pink-600/80" : ""
                                        )}>
                                            {item.content}
                                        </h4>

                                        {!isHoliday && (
                                            <>
                                                {isAssessment && item.subContent && (
                                                    <p className="text-[10px] text-amber-600 font-bold mt-1 line-clamp-1 italic tracking-tight">{item.subContent}</p>
                                                )}
                                                <div className="flex items-center gap-4 mt-2">
                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                                        <Clock size={12} className="opacity-50" /> {item.time}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                        <Sparkles size={12} className="opacity-50" /> {item.activity}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {!isDone && !isAssessment && !isHoliday && (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="ghost" className="w-10 h-10 rounded-xl p-0 hover:bg-[#8C132C]/5 text-slate-300 hover:text-[#8C132C] transition-all"><Info size={20} /></Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-64 p-5 rounded-[28px] border-none shadow-2xl space-y-3 bg-white/95 backdrop-blur-md">
                                                <h5 className="font-black text-xs text-[#8C132C] uppercase tracking-[0.1em]">Referência Sugerida</h5>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {item.bibliographyIds?.map((bid: string) => {
                                                        const book = books.find(b => b.id === bid);
                                                        return book ? <Badge key={bid} variant="outline" className="text-[9px] font-bold border-slate-100 bg-slate-50">{book.title}</Badge> : null;
                                                    })}
                                                    {(!item.bibliographyIds || item.bibliographyIds.length === 0) && (
                                                        <span className="text-[9px] text-slate-300 italic">Nenhuma referência vinculada.</span>
                                                    )}
                                                </div>
                                                <div className="pt-2 border-t border-slate-100">
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Localização</p>
                                                    <p className="text-[11px] font-black text-slate-600 flex items-center gap-2">
                                                        <div className="w-1 h-3 bg-[#8C132C] rounded-full" />
                                                        {item.isPractical ? practiceLocation : theoryLocation}
                                                    </p>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="fixed bottom-10 right-10 flex gap-4 z-40">
                <Button
                    onClick={() => setStep(3)}
                    className="h-16 rounded-[32px] px-8 bg-white/90 backdrop-blur-sm border-2 border-slate-100 text-slate-400 font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-slate-50 transition-all hover:-translate-y-1"
                >
                    <ChevronLeft size={18} className="mr-2" /> Voltar para Edição
                </Button>
                <Button
                    onClick={() => saveDraft()}
                    className="h-16 rounded-[32px] px-10 bg-[#8C132C] font-black uppercase text-xs tracking-[0.2em] text-white shadow-2xl transition-all hover:scale-105 active:scale-95 shadow-[#8C132C]/30"
                >
                    Salvar Diário & Progresso
                </Button>
                <Button
                    onClick={() => toast.success("Cronograma arquivado com sucesso!")}
                    className="h-16 rounded-[32px] px-10 bg-[#363636] font-black uppercase text-xs tracking-[0.2em] text-white shadow-2xl transition-all hover:scale-105 active:scale-95 shadow-[#363636]/30"
                >
                    Finalizar Semestre
                </Button>
            </div>
        </motion.div>
    );
}
