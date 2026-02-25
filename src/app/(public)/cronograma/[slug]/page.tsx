'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    Calendar as CalendarIcon,
    BookOpen,
    MapPin,
    Award,
    CheckCircle2,
    Clock,
    Library,
    ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";

export default function StudentSyllabusPage({ params }: { params: { slug: string } }) {
    const [syllabus, setSyllabus] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSyllabus = async () => {
            try {
                const res = await fetch(`/api/public/syllabus/${params.slug}`);
                if (!res.ok) throw new Error("Não encontrado");
                const data = await res.json();
                setSyllabus(data.syllabus);
            } catch (err) {
                toast.error("Cronograma não encontrado ou ainda não publicado.");
            } finally {
                setLoading(false);
            }
        };
        fetchSyllabus();
    }, [params.slug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#8C132C] border-t-transparent mb-4" />
                <p className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Carregando Cronograma...</p>
            </div>
        );
    }

    if (!syllabus) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
                <div className="text-6xl mb-6">🗓️</div>
                <h1 className="text-2xl font-black text-slate-800 mb-2">Cronograma não encontrado</h1>
                <p className="text-slate-400 max-w-md">O link pode estar incorreto ou o professor ainda não publicou o cronograma final.</p>
            </div>
        );
    }

    // Reuse scheduling logic (Local implementation for the public page)
    const calculateFullSchedule = () => {
        const { startDate, endDate, weekDays, holidays, topics, assessments, timelineOrder, completedTopicIds = [] } = syllabus;
        const schedule: any[] = [];
        if (!startDate || !endDate) return [];
        let current = new Date(startDate);
        const end = new Date(endDate);
        const todayStr = format(new Date(), 'yyyy-MM-dd');

        const consumedHours: { [id: string]: number } = {};
        let tIndex = 0;

        while (current <= end) {
            const dateStr = format(current, 'yyyy-MM-dd');
            const jsDayNum = current.getDay();
            const diaSemanaEnum = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][jsDayNum];
            const jsDayStr = jsDayNum === 0 ? '7' : jsDayNum.toString();
            const dayConfig = weekDays.find((w: any) => w.day === jsDayStr);
            const holiday = (holidays || []).find((h: any) => h.date === dateStr);
            const isPast = dateStr < todayStr;

            if (holiday && dayConfig) {
                schedule.push({ date: format(current, 'dd/MM'), dia: diaSemanaEnum, type: 'holiday', content: holiday.desc });
            } else if (dayConfig) {
                const [h1, m1] = dayConfig.start.split(':').map(Number);
                const [h2, m2] = dayConfig.end.split(':').map(Number);
                const classDuration = (h2 * 60 + m2 - (h1 * 60 + m1)) / 50;
                let dayHoursRemaining = classDuration;
                let scheduledOnThisDay = false;

                const pinnedAss = (assessments || []).find((a: any) => a.date && format(new Date(a.date), 'yyyy-MM-dd') === dateStr);
                const pinnedTop = (topics || []).find((t: any) => t.date && format(new Date(t.date), 'yyyy-MM-dd') === dateStr);

                if (pinnedAss && (!isPast || completedTopicIds.includes(pinnedAss.id))) {
                    schedule.push({ date: format(current, 'dd/MM'), dia: diaSemanaEnum, type: 'assessment', content: pinnedAss.name, time: `${dayConfig.start}-${dayConfig.end}`, points: pinnedAss.points });
                    scheduledOnThisDay = true;
                    dayHoursRemaining = 0;
                } else if (pinnedTop && (!isPast || completedTopicIds.includes(pinnedTop.id))) {
                    schedule.push({ date: format(current, 'dd/MM'), dia: diaSemanaEnum, type: 'topic', content: pinnedTop.title, time: `${dayConfig.start}-${dayConfig.end}`, isPractical: pinnedTop.isPractical });
                    scheduledOnThisDay = true;
                    dayHoursRemaining = 0;
                } else {
                    const order = timelineOrder || topics.map((t: any) => ({ id: t.id, type: 'topic' }));
                    while (dayHoursRemaining > 0.1 && tIndex < order.length) {
                        const item = order[tIndex];
                        const source = item.type === 'topic' ? topics.find((t: any) => t.id === item.id) : assessments.find((a: any) => a.id === item.id);
                        if (!source) { tIndex++; continue; }
                        const isDone = completedTopicIds.includes(item.id);
                        if (isPast && !isDone) break;

                        const total = source.classesNeeded || 2;
                        const consumed = consumedHours[item.id] || 0;
                        const remaining = total - consumed;
                        if (remaining <= 0) { tIndex++; continue; }

                        const allocated = Math.min(dayHoursRemaining, remaining);
                        schedule.push({
                            date: format(current, 'dd/MM'),
                            dia: diaSemanaEnum,
                            type: item.type,
                            content: (item.type === 'topic' ? source.title : source.name) + (allocated < remaining ? ' (Parte)' : ''),
                            time: `${dayConfig.start}-${dayConfig.end}`,
                            isPractical: source.isPractical || false,
                            isDone
                        });

                        consumedHours[item.id] = consumed + allocated;
                        dayHoursRemaining -= allocated;
                        scheduledOnThisDay = true;
                        if (consumedHours[item.id] >= total - 0.1) tIndex++;
                        else break;
                    }
                }

                if (!scheduledOnThisDay) {
                    schedule.push({
                        date: format(current, 'dd/MM'),
                        dia: diaSemanaEnum,
                        type: isPast ? 'missed' : 'empty',
                        content: isPast ? 'AULA PENDENTE (Reposição)' : 'Planejamento / Aula Extra',
                        time: `${dayConfig.start}-${dayConfig.end}`
                    });
                }
            }
            current.setDate(current.getDate() + 1);
        }
        return schedule;
    };

    const schedule = calculateFullSchedule();
    const progressPercent = syllabus.topics?.length > 0 ? Math.round(((syllabus.completedTopicIds?.length || 0) / syllabus.topics.length) * 100) : 0;

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* STICKY HEADER */}
            <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-100 px-6 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#8C132C] flex items-center justify-center text-white shadow-lg shadow-[#8C132C]/20 shrink-0">
                            <BookOpen size={24} />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-lg font-black text-slate-800 truncate">{syllabus.courseName}</h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cronograma Acadêmico • 2026.1</p>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-6">
                        <div className="text-right">
                            <div className="text-[10px] font-black uppercase text-slate-400 mb-1">Progresso</div>
                            <div className="flex items-center gap-3">
                                <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
                                </div>
                                <span className="text-sm font-black text-slate-700">{progressPercent}%</span>
                            </div>
                        </div>
                        {syllabus.selectedLogo && <img src={syllabus.selectedLogo} alt="Logo" className="h-10 object-contain grayscale opacity-50" />}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* LEFT SIDE: SYNOPSIS */}
                    <div className="lg:col-span-4 space-y-8">
                        <Card className="p-8 rounded-[40px] border-none shadow-2xl bg-[#363636] text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10"><CalendarIcon size={120} /></div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-8">Informações da Disciplina</h3>
                            <div className="space-y-6 relative z-10">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0"><MapPin size={18} className="text-amber-400" /></div>
                                    <div>
                                        <div className="text-[9px] font-black uppercase text-white/30 mb-1">Cidades / Locais</div>
                                        <p className="text-sm font-bold">{syllabus.locationCity} • {syllabus.theoryLocation}</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0"><Clock size={18} className="text-emerald-400" /></div>
                                    <div>
                                        <div className="text-[9px] font-black uppercase text-white/30 mb-1">Carga Horária</div>
                                        <p className="text-sm font-bold">{syllabus.topics?.reduce((acc: number, t: any) => acc + (t.classesNeeded || 0), 0)} Horas Totais</p>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Bibliografia Sugerida</h3>
                            <div className="space-y-3">
                                {syllabus.books?.map((book: any, i: number) => (
                                    <Card key={i} className="p-4 rounded-3xl border-none shadow-sm bg-white flex gap-4 items-center group hover:shadow-md transition-all">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-[#8C132C] transition-colors"><Library size={20} /></div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-black text-slate-700 truncate">{book.title}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase italic">{book.author}</p>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDE: TIMELINE */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="flex justify-between items-center px-4">
                            <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
                                <div className="w-2 h-8 bg-[#8C132C] rounded-full" /> Linha do Tempo Acadêmica
                            </h2>
                            <Badge className="bg-white text-slate-400 border border-slate-100 font-bold text-[9px] uppercase px-4 py-2 rounded-full">Atualizado em Tempo Real</Badge>
                        </div>

                        <div className="grid gap-4">
                            {schedule.map((item, idx) => {
                                const isDone = item.isDone;
                                const isMissed = item.type === 'missed';

                                return (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={idx}
                                        className={cn(
                                            "bg-white p-6 rounded-[32px] border-2 transition-all flex items-center gap-6 group",
                                            isDone ? "border-emerald-50 opacity-60" :
                                                isMissed ? "border-red-50 bg-red-50/10" : "border-transparent shadow-sm hover:shadow-xl hover:translate-x-2"
                                        )}
                                    >
                                        <div className="w-16 shrink-0 text-center">
                                            <div className={cn(
                                                "w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black mb-1",
                                                isDone ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200" :
                                                    isMissed ? "bg-red-400 text-white" : "bg-slate-50 text-slate-700"
                                            )}>
                                                {isDone ? <CheckCircle2 size={24} /> : (
                                                    <>
                                                        <span className="text-xl leading-none">{item.date?.split('/')[0]}</span>
                                                        <span className="text-[9px] uppercase opacity-60 mt-1">{item.dia}</span>
                                                    </>
                                                )}
                                            </div>
                                            {!isDone && <p className="text-[8px] font-black text-slate-300 uppercase mt-2">{item.time}</p>}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                {item.type === 'assessment' && <Badge className="bg-amber-500 text-white text-[8px] font-black uppercase px-2 py-0 border-none">Avaliação</Badge>}
                                                {item.isPractical && <Badge className="bg-blue-100 text-blue-600 text-[8px] font-black uppercase px-2 py-0 border-none">Aula Prática</Badge>}
                                                {isMissed && <Badge className="bg-red-100 text-red-500 text-[8px] font-black uppercase px-2 py-0 border-none">Pendente (Não Ministrada)</Badge>}
                                            </div>
                                            <h4 className={cn(
                                                "text-lg font-black truncate transition-all",
                                                isDone ? "text-slate-400 line-through" : "text-slate-800"
                                            )}>
                                                {item.content}
                                            </h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{item.activity || 'Aula Teórica Magistral'}</p>
                                        </div>

                                        {!isDone && !isMissed && (
                                            <div className="opacity-0 group-hover:opacity-100 transition-all">
                                                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300"><ArrowRight size={20} /></div>
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
