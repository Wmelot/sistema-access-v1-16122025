'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { TimeInput } from '@/components/ui/time-input';
import {
    Calendar as CalendarIcon,
    Clock,
    MapPin,
    Plus,
    Trash2,
    Sparkles,
    FileText,
    Check,
    ChevronRight,
    Settings2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSyllabus } from './SyllabusContext';
import { cn } from "@/lib/utils";

export default function Step1_Config() {
    const {
        setStep,
        courseName, setCourseName,
        publicSlug, setPublicSlug,
        theoryLocation, setTheoryLocation,
        practiceLocation, setPracticeLocation,
        startDate, setStartDate,
        endDate, setEndDate,
        locationCity, setLocationCity,
        weekDays, setWeekDays,
        assessments, setAssessments,
        timelineOrder, setTimelineOrder,
        suggestExamDates,
        totalPoints,
        removeAssessment,
        uploadedFiles, setUploadedFiles,
        isAnalyzing,
        handleImportFromDocument,
        handleRunAIAnalysis,
        isSynced,
        selectedLogo, setSelectedLogo
    } = useSyllabus();

    const isDateDisabled = (date: Date) => {
        if (startDate && date < new Date(startDate.setHours(0, 0, 0, 0))) return true;
        if (endDate && date > new Date(endDate.setHours(23, 59, 59, 999))) return true;

        const jsDay = date.getDay() === 0 ? '7' : date.getDay().toString();
        const activeDays = weekDays.map(w => w.day);
        if (!activeDays.includes(jsDay)) return true;

        return false;
    };

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                    <Card className="p-8 rounded-[40px] border-none shadow-xl bg-white/80 backdrop-blur-xl">
                        <h3 className="text-xl font-black text-[#8C132C] mb-8 flex items-center gap-3">
                            <Settings2 size={24} /> Configurações Gerais
                        </h3>
                        <div className="grid gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nome da Disciplina</Label>
                                <Input value={courseName} onChange={e => setCourseName(e.target.value)} placeholder="Ex: Anatomia Humana I" className="h-12 rounded-2xl border-slate-100 bg-slate-50 font-bold focus:ring-[#8C132C]/10" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Link Público (Slug)</Label>
                                    <Input value={publicSlug} onChange={e => setPublicSlug(e.target.value)} className="h-12 rounded-2xl border-slate-100 bg-slate-50 font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Cidade / Campus</Label>
                                    <Input value={locationCity} onChange={e => setLocationCity(e.target.value)} className="h-12 rounded-2xl border-slate-100 bg-slate-50 font-bold" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Logo da Instituição</Label>
                                <div className="flex gap-4 items-center">
                                    <label className="cursor-pointer group flex-1">
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onload = (event) => setSelectedLogo(event.target?.result as string);
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                            className="hidden"
                                        />
                                        <div className="h-12 rounded-2xl border-2 border-dashed border-slate-100 hover:border-[#8C132C]/30 bg-slate-50 flex items-center justify-center gap-3 transition-all group-hover:bg-white shadow-sm">
                                            <Plus size={16} className="text-slate-400 group-hover:text-[#8C132C]" />
                                            <span className="text-xs font-bold text-slate-400 group-hover:text-[#8C132C]">Subir Logo</span>
                                        </div>
                                    </label>
                                    {selectedLogo && (
                                        <div className="relative group w-12 h-12 shadow-inner rounded-xl bg-slate-50 flex items-center justify-center p-1 border border-slate-100">
                                            <img src={selectedLogo} className="w-full h-full object-contain rounded-lg" />
                                            <button
                                                onClick={() => setSelectedLogo(null)}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-100 shadow-lg hover:bg-red-600 transition-all scale-75 group-hover:scale-100"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 flex flex-col">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 mb-2">Início das Aulas</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="h-12 rounded-2xl border-slate-100 bg-slate-50 font-bold justify-start gap-2">
                                                <CalendarIcon size={16} className="text-[#8C132C]" />
                                                {startDate ? format(startDate, "PPP", { locale: ptBR }) : "Selecione"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 rounded-3xl border-none shadow-2xl overflow-hidden">
                                            <Calendar mode="single" selected={startDate} onSelect={(d) => d && setStartDate(d)} initialFocus locale={ptBR} />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-2 flex flex-col">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 mb-2">Término das Aulas</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="h-12 rounded-2xl border-slate-100 bg-slate-50 font-bold justify-start gap-2">
                                                <CalendarIcon size={16} className="text-[#8C132C]" />
                                                {endDate ? format(endDate, "PPP", { locale: ptBR }) : "Selecione"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 rounded-3xl border-none shadow-2xl overflow-hidden">
                                            <Calendar mode="single" selected={endDate} onSelect={(d) => d && setEndDate(d)} initialFocus locale={ptBR} />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-8 rounded-[40px] border-none shadow-xl bg-white/80 backdrop-blur-xl">
                        <h3 className="text-xl font-black text-[#8C132C] mb-8 flex items-center gap-3">
                            <Clock size={24} /> Dias e Locais
                        </h3>
                        <div className="space-y-6">
                            <div className="grid gap-4">
                                {['1', '2', '3', '4', '5', '6', '7'].map(day => {
                                    const dayName = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'][parseInt(day) - 1];
                                    const config = weekDays.find(w => w.day === day);
                                    return (
                                        <div key={day} className={cn(
                                            "p-4 rounded-3xl transition-all border-2",
                                            config ? "bg-white border-[#8C132C]/10 shadow-sm" : "bg-slate-50/50 border-transparent opacity-60"
                                        )}>
                                            <div className="flex items-center justify-between">
                                                <label className="flex items-center gap-3 cursor-pointer">
                                                    <Checkbox
                                                        checked={!!config}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) setWeekDays([...weekDays, { day, start: '19:00', end: '22:30', frequency: 'weekly' }]);
                                                            else setWeekDays(weekDays.filter(w => w.day !== day));
                                                        }}
                                                        className="h-5 w-5 rounded-lg border-slate-200 data-[state=checked]:bg-[#8C132C] data-[state=checked]:border-[#8C132C]"
                                                    />
                                                    <span className="font-black text-sm text-slate-700">{dayName}</span>
                                                </label>
                                                {config && (
                                                    <div className="flex items-center gap-3 animate-in fade-in zoom-in-95">
                                                        <Select
                                                            value={config.frequency}
                                                            onValueChange={(val: any) => setWeekDays(weekDays.map(w => w.day === day ? { ...w, frequency: val } : w))}
                                                        >
                                                            <SelectTrigger className="w-28 h-9 rounded-xl border-slate-100 bg-slate-50 font-bold text-[10px] uppercase">
                                                                <SelectValue placeholder="Freq." />
                                                            </SelectTrigger>
                                                            <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                                                                <SelectItem value="weekly" className="text-[10px] font-bold uppercase">Semanal</SelectItem>
                                                                <SelectItem value="biweekly" className="text-[10px] font-bold uppercase">Quinzenal</SelectItem>
                                                                <SelectItem value="monthly" className="text-[10px] font-bold uppercase">Mensal</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <div className="flex items-center gap-2">
                                                            <TimeInput
                                                                value={config.start}
                                                                onChange={val => setWeekDays(weekDays.map(w => w.day === day ? { ...w, start: val } : w))}
                                                                className="w-24 h-9 rounded-xl border-slate-100 bg-slate-50 font-bold text-xs"
                                                            />
                                                            <span className="text-slate-300 font-bold text-xs">até</span>
                                                            <TimeInput
                                                                value={config.end}
                                                                onChange={val => setWeekDays(weekDays.map(w => w.day === day ? { ...w, end: val } : w))}
                                                                className="w-24 h-9 rounded-xl border-slate-100 bg-slate-50 font-bold text-xs"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="grid gap-4 pt-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                                        <MapPin size={12} /> Local das Aulas Teóricas
                                    </Label>
                                    <Input value={theoryLocation} onChange={e => setTheoryLocation(e.target.value)} className="h-12 rounded-2xl border-slate-100 bg-slate-50 font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                                        <MapPin size={12} /> Local das Aulas Práticas
                                    </Label>
                                    <Input value={practiceLocation} onChange={e => setPracticeLocation(e.target.value)} className="h-12 rounded-2xl border-slate-100 bg-slate-50 font-bold" />
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="flex flex-col gap-8">
                    <div className="space-y-6">
                        <div className="flex justify-between items-center px-2">
                            <h3 className="text-xl font-black text-[#8C132C] flex items-center gap-3">
                                <Sparkles size={24} /> Avaliações e Pontuação
                            </h3>
                            <Button
                                onClick={suggestExamDates}
                                variant="outline"
                                className="border-[#8C132C]/20 text-[#8C132C] rounded-xl font-black text-[10px] uppercase h-10 hover:bg-[#8C132C]/5"
                            >
                                <Sparkles size={14} className="mr-2" /> Sugerir Datas via IA
                            </Button>
                        </div>

                        <div className={cn(
                            "p-6 rounded-[32px] text-center flex flex-col items-center justify-center transition-all h-32 border-2",
                            totalPoints === 100
                                ? "bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20"
                                : "bg-red-50 border-red-100 text-red-500"
                        )}>
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Soma Total</span>
                            <span className="text-4xl font-black mt-2 mb-1">{totalPoints} / 100</span>
                            {totalPoints !== 100 && (
                                <span className="text-[8px] font-bold mt-1 uppercase italic">Ajuste as avaliações para fechar 100pts</span>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-2">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Atividades Avaliativas</Label>
                                    <p className="text-[9px] text-slate-400 font-medium">Provas, Trabalhos e Seminários.</p>
                                </div>
                                <Button size="sm" variant="ghost" className="bg-[#8C132C]/10 text-[#8C132C] hover:bg-[#8C132C] hover:text-white rounded-xl font-black text-[10px] uppercase h-9 px-4 transition-all" onClick={() => {
                                    const newId = Date.now().toString();
                                    const newAssessment = {
                                        id: newId,
                                        name: 'Nova Atividade',
                                        date: null,
                                        points: 0,
                                        type: 'Individual' as const,
                                        classesNeeded: 2,
                                        content: ''
                                    };
                                    setAssessments([...assessments, newAssessment]);
                                    setTimelineOrder([...timelineOrder, { id: newId, type: 'assessment', instanceId: `a-${newId}-${Date.now()}` }]);
                                }}>+ Adicionar</Button>
                            </div>

                            <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                                {[...assessments].sort((a, b) => {
                                    if (!a.date) return 1;
                                    if (!b.date) return -1;
                                    return new Date(a.date).getTime() - new Date(b.date).getTime();
                                }).map(ass => (
                                    <motion.div layout key={ass.id} className="bg-slate-50/50 p-4 rounded-[24px] flex flex-col gap-3 group border border-slate-100/50 hover:bg-white hover:shadow-lg transition-all border-l-4 border-l-[#8C132C]">
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 min-w-0">
                                                <Input value={ass.name} onChange={e => setAssessments(assessments.map(a => a.id === ass.id ? { ...a, name: e.target.value } : a))} className="bg-transparent border-none font-black h-7 text-xs p-0 text-slate-700 focus:ring-0" />
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Select value={ass.type} onValueChange={(val: any) => setAssessments(assessments.map(a => a.id === ass.id ? { ...a, type: val } : a))}>
                                                        <SelectTrigger className="h-4 border-none bg-transparent p-0 text-[7px] font-black uppercase text-slate-400 w-auto gap-1 shadow-none focus:ring-0">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl border-none shadow-2xl">
                                                            <SelectItem value="Individual">Individual</SelectItem>
                                                            <SelectItem value="Dupla">Dupla</SelectItem>
                                                            <SelectItem value="Prática">Prática</SelectItem>
                                                            <SelectItem value="Teórica">Teórica</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    {ass.isSubstitutive && <Badge className="text-[7px] font-black bg-amber-500 text-white h-4 border-none">SUBST.</Badge>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        value={ass.points}
                                                        onChange={e => setAssessments(assessments.map(a => a.id === ass.id ? { ...a, points: parseInt(e.target.value) || 0 } : a))}
                                                        className="w-14 h-8 rounded-xl border-none bg-white text-[10px] font-black text-center p-0 shadow-sm"
                                                    />
                                                    <span className="absolute -right-1 -top-1 bg-[#8C132C] text-white text-[6px] font-black px-1 rounded-full">PTS</span>
                                                </div>
                                                <button onClick={() => removeAssessment(ass.id)} className="text-slate-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 p-1">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t border-slate-100/50">
                                            <div className="flex items-center gap-2">
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="ghost" className="h-6 p-0 text-[8px] font-black uppercase text-slate-400 gap-1.5 hover:bg-transparent">
                                                            <CalendarIcon size={10} className="text-[#8C132C]" />
                                                            {ass.date ? format(ass.date, "dd/MM") : "Definir Data"}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0 rounded-3xl border-none shadow-2xl overflow-hidden" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={ass.date || undefined}
                                                            onSelect={(d) => setAssessments(assessments.map(a => a.id === ass.id ? { ...a, date: d || null } : a))}
                                                            locale={ptBR}
                                                            disabled={(date) => isDateDisabled(date)}
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <label className="flex items-center gap-1.5 cursor-pointer">
                                                    <Checkbox
                                                        checked={ass.isSubstitutive}
                                                        onCheckedChange={(checked) => setAssessments(assessments.map(a => a.id === ass.id ? { ...a, isSubstitutive: !!checked } : a))}
                                                        className="h-3 w-3 rounded-[4px] border-slate-200 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                                                    />
                                                    <span className="text-[8px] font-black uppercase text-slate-400 mt-0.5">Substitutiva</span>
                                                </label>

                                                {ass.isSubstitutive && (
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button variant="outline" size="sm" className="h-6 text-[8px] font-black uppercase px-2 border-slate-100 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg">
                                                                {ass.substitutesIds?.length ? `${ass.substitutesIds.length} Vinc.` : 'Vincular'}
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-48 p-3 rounded-2xl border-none shadow-2xl">
                                                            <div className="text-[9px] font-black uppercase text-slate-400 mb-2 px-1 tracking-widest">Substitui:</div>
                                                            <div className="space-y-1">
                                                                {assessments.filter(a => a.id !== ass.id && !a.isSubstitutive).map(a => (
                                                                    <label key={a.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                                                                        <Checkbox
                                                                            checked={ass.substitutesIds?.includes(a.id)}
                                                                            onCheckedChange={(checked) => {
                                                                                const currentIds = ass.substitutesIds || [];
                                                                                const newIds = checked ? [...currentIds, a.id] : currentIds.filter(id => id !== a.id);
                                                                                setAssessments(assessments.map(acc => acc.id === ass.id ? { ...acc, substitutesIds: newIds } : acc));
                                                                            }}
                                                                            className="h-3.5 w-3.5 rounded-[4px] border-slate-300 data-[state=checked]:bg-[#8C132C]"
                                                                        />
                                                                        <span className="text-[9px] font-bold text-slate-600 truncate">{a.name}</span>
                                                                    </label>
                                                                ))}
                                                                {assessments.filter(a => a.id !== ass.id && !a.isSubstitutive).length === 0 && (
                                                                    <p className="text-[8px] text-slate-400 italic px-1">Nenhuma avaliação passível de substituição.</p>
                                                                )}
                                                            </div>
                                                        </PopoverContent>
                                                    </Popover>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 pt-6 border-t border-slate-50">
                        <div className="bg-[#8C132C]/5 border-2 border-dashed border-[#8C132C]/20 rounded-3xl p-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <Label className="text-[#8C132C] font-black uppercase text-[10px] tracking-widest">Documentos Ativos (Considerados pela IA)</Label>
                                <div className="px-3 py-1 bg-[#8C132C] text-white text-[9px] font-black rounded-full animate-pulse">
                                    {uploadedFiles.length} ATIVOS
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <label className="cursor-pointer">
                                    <Input type="file" multiple accept=".pdf,.doc,.docx" onChange={handleImportFromDocument} className="hidden" />
                                    <div className="h-20 w-32 rounded-3xl bg-white border border-slate-100 flex flex-col items-center justify-center text-slate-300 hover:text-[#8C132C] hover:border-[#8C132C]/30 transition-all shadow-sm">
                                        <Plus size={24} />
                                    </div>
                                </label>
                                {uploadedFiles.map((f, i) => (
                                    <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} key={i} className="h-20 px-6 rounded-3xl bg-white border border-[#8C132C]/10 flex items-center gap-4 shadow-sm group">
                                        <div className="w-10 h-10 rounded-2xl bg-[#8C132C]/5 flex items-center justify-center text-[#8C132C]">
                                            <FileText size={18} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-700 truncate max-w-[120px]">{f.name}</span>
                                            <span className={cn("text-[8px] font-bold uppercase tracking-tighter flex items-center gap-1", isSynced ? "text-emerald-500" : "text-amber-500")}>
                                                {isSynced ? <Check size={10} /> : <Clock size={10} />}
                                                {isSynced ? "Sincronizado" : "Aguardando Leitura"}
                                            </span>
                                        </div>
                                        <button onClick={() => setUploadedFiles(uploadedFiles.filter((_, idx) => idx !== i))} className="ml-2 text-slate-200 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                                            <Trash2 size={14} />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {uploadedFiles.length > 0 && (
                            <Button
                                onClick={handleRunAIAnalysis}
                                disabled={isAnalyzing}
                                className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#8C132C] to-amber-600 text-white font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-[#8C132C]/20 animate-in fade-in slide-in-from-top-2"
                            >
                                {isAnalyzing ? (
                                    <div className="flex items-center gap-3">
                                        <div className="animate-spin rounded-full h-5 w-5 border-3 border-white border-t-transparent" />
                                        <span>IA Analisando...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <Sparkles size={20} className="animate-pulse" />
                                        <span>Sincronizar com IA</span>
                                    </div>
                                )}
                            </Button>
                        )}

                        <div className="grid grid-cols-1 gap-4">
                            <Button onClick={() => setStep(2)} className="bg-[#8C132C] h-14 rounded-2xl font-black uppercase tracking-widest transition-all hover:scale-105 shadow-xl shadow-[#8C132C]/20 w-full">
                                Próximo Passo <ChevronRight size={18} className="ml-2" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
