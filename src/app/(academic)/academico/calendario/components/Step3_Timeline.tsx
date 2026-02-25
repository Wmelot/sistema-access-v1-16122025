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
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
    Plus,
    Trash2,
    Sparkles,
    AlertTriangle,
    GripVertical,
    Library,
    ChevronRight,
    ChevronLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSyllabus } from './SyllabusContext';
import { cn } from "@/lib/utils";
import { METHODOLOGY_GUIDE, RESOURCE_OPTIONS } from './types';
import { Assessment } from './types';

export default function Step3_Timeline() {
    const {
        setStep,
        isOverflow,
        totalNeededHours,
        availableHours,
        generateAIContent,
        addTopic,
        onDragEnd,
        fullSchedule,
        assessments,
        topics,
        updateAssessment,
        updateTopic,
        books,
        removeAssessment,
        removeTopic,
        setShowReallocateModal,
        materializeEmptySlot
    } = useSyllabus();

    return (
        <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
            {/* ALERT OVERFLOW */}
            {isOverflow && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="bg-amber-50 border border-amber-200 rounded-[32px] p-6 flex items-center gap-6 shadow-lg shadow-amber-500/5">
                    <div className="w-16 h-16 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
                        <AlertTriangle size={32} />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-amber-800 font-black text-lg">Estouro de Conteúdo Detectado!</h4>
                        <p className="text-amber-700/70 text-sm font-medium">
                            Sua carga horária planejada (<strong>{totalNeededHours}h</strong>) excede o tempo disponível no calendário (<strong>{availableHours.toFixed(1)}h</strong>).
                        </p>
                        <p className="text-amber-800 text-[10px] font-black uppercase mt-2 italic">A IA pode sugerir uma redução proporcional para caber no semestre.</p>
                    </div>
                    <div className="flex gap-3">
                        <Button onClick={() => setShowReallocateModal(true)} variant="outline" className="border-amber-400 text-amber-900 rounded-xl font-bold text-xs uppercase h-10 px-6 hover:bg-amber-100 transition-all">
                            Redistribuir com IA
                        </Button>
                        <Button onClick={() => setStep(3)} className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs uppercase h-10 px-6 transition-all shadow-md">
                            Organizar Manualmente
                        </Button>
                    </div>
                </motion.div>
            )}

            <div className="flex items-center justify-between mb-2 px-6">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Plano de Ensino (Cronograma de Aulas)</Label>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-xs font-bold bg-slate-100 p-2.5 rounded-xl border border-slate-200/50 shadow-inner">
                        <span className="text-slate-500 uppercase text-[9px]">Carga:</span>
                        <span className={cn("text-[10px] font-black", isOverflow ? "text-red-500" : "text-emerald-500")}>
                            {totalNeededHours}h / {availableHours.toFixed(1)}h
                        </span>
                    </div>
                    <Button onClick={generateAIContent} size="sm" variant="outline" className="border-[#8C132C]/20 text-[#8C132C] hover:bg-[#8C132C]/5 rounded-xl font-black text-[10px] uppercase h-10">
                        <Sparkles size={14} className="mr-2" /> Sugerir com IA
                    </Button>
                    <Button onClick={addTopic} size="sm" className="bg-[#8C132C] text-white rounded-xl font-black text-[10px] uppercase h-10 shadow-lg shadow-[#8C132C]/10 hover:scale-105 transition-all">
                        <Plus size={14} className="mr-1" /> Novo Tópico
                    </Button>
                </div>
            </div>

            <div className="space-y-1">
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="timeline">
                        {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                                {fullSchedule.map((item: any, index: number) => {
                                    const isAssessment = item.type === 'assessment';
                                    const isEmpty = item.type === 'empty';
                                    const isHoliday = item.type === 'holiday';

                                    if (isHoliday) {
                                        return (
                                            <div key={`holiday-${index}`} className="flex items-center gap-4 bg-slate-50/50 px-8 py-4 rounded-[32px] border border-dashed border-slate-200 opacity-60">
                                                <div className="flex items-center gap-3 min-w-[100px]">
                                                    <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center font-black text-slate-400 bg-slate-100">
                                                        <span className="text-xs leading-none">{item.date.split('/')[0]}</span>
                                                        <span className="text-[8px] uppercase opacity-60">
                                                            {format(new Date(2026, parseInt(item.date.split('/')[1]) - 1, 1), 'MMM', { locale: ptBR })}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-black uppercase text-slate-400 leading-none mb-1">{item.dia}</span>
                                                        <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">FERIADO</span>
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">{item.content}</h4>
                                                </div>
                                                <div className="bg-slate-100 px-3 py-1 rounded-full text-[8px] font-black text-slate-400 uppercase">Recesso Escolar</div>
                                            </div>
                                        );
                                    }

                                    const logicalIndex = fullSchedule.slice(0, index).filter((s: any) => s.type !== 'holiday').length;

                                    return (
                                        <Draggable key={item.instanceId || `empty-${index}`} draggableId={item.instanceId || `empty-${index}`} index={logicalIndex}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className={cn(
                                                        "relative group transition-all",
                                                        snapshot.isDragging ? "z-50" : ""
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "flex items-center gap-4 bg-white/80 backdrop-blur-sm px-8 py-6 rounded-[32px] border transition-all",
                                                        isAssessment ? "border-amber-200 bg-amber-50/30 shadow-sm" :
                                                            item.isOverflow ? "border-red-200 bg-red-50/20 opacity-80" :
                                                                isEmpty ? "border-dashed border-slate-100 opacity-80" : "border-slate-50",
                                                        snapshot.isDragging ? "shadow-2xl border-[#8C132C]/30 scale-[1.02] bg-white" : "hover:border-slate-200 hover:shadow-lg hover:translate-x-1"
                                                    )}>
                                                        <div {...provided.dragHandleProps} className="text-slate-200 hover:text-slate-400 p-1 cursor-grab active:cursor-grabbing">
                                                            <GripVertical size={18} />
                                                        </div>

                                                        <div className="flex items-center gap-3 min-w-[100px]">
                                                            <div className={cn(
                                                                "w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black transition-all shadow-sm",
                                                                item.isOverflow ? "text-red-600 bg-red-100" :
                                                                    isAssessment ? "text-amber-600 bg-amber-100" :
                                                                        isEmpty ? "text-slate-300 bg-slate-50" : "text-[#8C132C] bg-[#8C132C]/5"
                                                            )}>
                                                                <span className="text-sm leading-none">{item.date === '---' ? '---' : item.date.split('/')[0]}</span>
                                                                <span className="text-[9px] uppercase opacity-60">
                                                                    {item.isOverflow ? 'EXT' : (item.date.includes('/') ? format(new Date(2026, parseInt(item.date.split('/')[1]) - 1, 1), 'MMM', { locale: ptBR }) : '---')}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-black uppercase text-slate-400 leading-none mb-1">{item.isOverflow ? 'EXCEDENTE' : item.dia}</span>
                                                                <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">{item.time}</span>
                                                            </div>
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                {!isEmpty && (
                                                                    <button
                                                                        onClick={() => {
                                                                            if (isAssessment) {
                                                                                const types: Assessment['type'][] = ['Teórica', 'Prática', 'Individual', 'Dupla'];
                                                                                const current = assessments.find(a => a.id === item.id)?.type || 'Teórica';
                                                                                const next = types[(types.indexOf(current) + 1) % types.length];
                                                                                updateAssessment(item.id, { type: next });
                                                                            } else {
                                                                                updateTopic(item.id, { isPractical: !item.isPractical });
                                                                            }
                                                                        }}
                                                                        className={cn(
                                                                            "text-[9px] font-black px-2.5 py-1 rounded-lg uppercase transition-all shrink-0 border-none",
                                                                            isAssessment ? "bg-amber-100 text-amber-700 hover:bg-amber-200 shadow-sm" :
                                                                                item.isPractical ? "bg-blue-50 text-blue-600 hover:bg-blue-100" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                                                                        )}
                                                                    >
                                                                        {isAssessment ? (assessments.find(a => a.id === item.id)?.type || 'AVALIAÇÃO') : (item.isPractical ? 'Prática' : 'Teórica')}
                                                                    </button>
                                                                )}

                                                                <Input
                                                                    value={isAssessment ? (assessments.find(a => a.id === item.id)?.name || '') : (isEmpty ? '' : (topics.find(t => t.id === item.id)?.title || ''))}
                                                                    onChange={(e) => {
                                                                        if (isEmpty) materializeEmptySlot(item.instanceId, e.target.value);
                                                                        else if (isAssessment) updateAssessment(item.id, { name: e.target.value });
                                                                        else updateTopic(item.id, { title: e.target.value });
                                                                    }}
                                                                    placeholder={isEmpty ? "Espaço Vago" : "Título do Tópico ou Conteúdo Acadêmico"}
                                                                    className={cn(
                                                                        "flex-1 bg-transparent border-none font-black h-8 text-base focus:ring-0 p-0 shadow-none placeholder:text-slate-200",
                                                                        isEmpty ? "text-slate-200 italic font-medium" : "text-slate-700 font-bold"
                                                                    )}
                                                                />

                                                                {!isEmpty && !isAssessment && (
                                                                    <Popover>
                                                                        <PopoverTrigger asChild>
                                                                            <button className={cn(
                                                                                "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                                                                                (topics.find(t => t.id === item.id)?.bibliographyIds.length || 0) > 0
                                                                                    ? "bg-[#8C132C] text-white shadow-lg shadow-[#8C132C]/20"
                                                                                    : "bg-slate-50 text-slate-300 hover:bg-slate-100 hover:text-[#8C132C]"
                                                                            )}>
                                                                                <Library size={16} />
                                                                            </button>
                                                                        </PopoverTrigger>
                                                                        <PopoverContent className="w-80 p-0 rounded-3xl border-none shadow-2xl overflow-hidden">
                                                                            <div className="p-4 bg-slate-50 border-b border-slate-100">
                                                                                <h5 className="text-[10px] font-black uppercase tracking-widest text-[#8C132C]">Referências Indicadas</h5>
                                                                                <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase">Selecione os livros para este tópico</p>
                                                                            </div>
                                                                            <div className="p-2 max-h-[300px] overflow-y-auto no-scrollbar">
                                                                                {books.map(book => (
                                                                                    <div key={book.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer group">
                                                                                        <Checkbox
                                                                                            id={`book-${item.id}-${book.id}`}
                                                                                            checked={topics.find(t => t.id === item.id)?.bibliographyIds.includes(book.id)}
                                                                                            onCheckedChange={(checked) => {
                                                                                                const currentIds = topics.find(t => t.id === item.id)?.bibliographyIds || [];
                                                                                                const newIds = checked
                                                                                                    ? [...currentIds, book.id]
                                                                                                    : currentIds.filter(id => id !== book.id);
                                                                                                updateTopic(item.id, { bibliographyIds: newIds });
                                                                                            }}
                                                                                            className="rounded-md border-slate-200 data-[state=checked]:bg-[#8C132C] data-[state=checked]:border-[#8C132C]"
                                                                                        />
                                                                                        <Label htmlFor={`book-${item.id}-${book.id}`} className="flex-1 cursor-pointer">
                                                                                            <div className="text-[11px] font-black text-slate-700 leading-tight group-hover:text-[#8C132C] transition-colors">{book.title}</div>
                                                                                            <div className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{book.author}</div>
                                                                                        </Label>
                                                                                    </div>
                                                                                ))}
                                                                                {books.length === 0 && (
                                                                                    <div className="py-8 text-center text-slate-300 text-[10px] font-black uppercase">Nenhum livro cadastrado no Passo 2</div>
                                                                                )}
                                                                            </div>
                                                                        </PopoverContent>
                                                                    </Popover>
                                                                )}
                                                            </div>

                                                            {!isEmpty && (
                                                                <div className="flex items-center gap-8 mt-2 tracking-tight">
                                                                    {/* Carga Horária */}
                                                                    <div className="flex items-center gap-2 group/carga">
                                                                        <span className="text-[10px] font-black text-slate-300 uppercase shrink-0">Carga:</span>
                                                                        <div className="flex items-center gap-1 bg-slate-50 rounded-xl px-3 py-1 border border-slate-100 group-hover/carga:border-[#8C132C]/20 transition-all shadow-sm">
                                                                            <Input
                                                                                type="number"
                                                                                value={isAssessment ? (assessments.find(a => a.id === item.id)?.classesNeeded || 0) : (topics.find(t => t.id === item.id)?.classesNeeded || 0)}
                                                                                onChange={(e) => {
                                                                                    const val = parseInt(e.target.value) || 0;
                                                                                    if (isAssessment) updateAssessment(item.id, { classesNeeded: val });
                                                                                    else updateTopic(item.id, { classesNeeded: val });
                                                                                }}
                                                                                className="w-10 h-5 text-[11px] font-black p-0 text-center bg-transparent border-none focus:ring-0 shadow-none text-[#8C132C]"
                                                                            />
                                                                            <span className="text-[10px] font-black text-slate-400">HORAS</span>
                                                                        </div>
                                                                    </div>

                                                                    {isAssessment ? (
                                                                        <div className="flex-1 flex items-center gap-3">
                                                                            <span className="text-[10px] font-black text-amber-600 uppercase shrink-0">Conteúdo:</span>
                                                                            <Input
                                                                                value={assessments.find(a => a.id === item.id)?.content || ''}
                                                                                onChange={(e) => updateAssessment(item.id, { content: e.target.value })}
                                                                                placeholder={item.subContent}
                                                                                className="h-9 text-[11px] bg-amber-100/10 border-amber-200/50 focus:ring-amber-200 text-slate-600 font-bold rounded-xl px-4 flex-1 shadow-none transition-all focus:bg-white"
                                                                            />
                                                                        </div>
                                                                    ) : (
                                                                        <>
                                                                            {/* Metodologia */}
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-[10px] font-black text-slate-300 uppercase shrink-0">Método:</span>
                                                                                <Select
                                                                                    value={item.activity}
                                                                                    onValueChange={(val) => updateTopic(item.id, { methodology: val })}
                                                                                >
                                                                                    <SelectTrigger className="h-8 text-[10px] font-black border-none bg-slate-50 rounded-xl px-3 w-[180px] focus:ring-2 focus:ring-[#8C132C]/5 shadow-sm hover:bg-slate-100 transition-all">
                                                                                        <SelectValue />
                                                                                    </SelectTrigger>
                                                                                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                                                                                        {Object.keys(METHODOLOGY_GUIDE).map(m => (
                                                                                            <SelectItem key={m} value={m} className="text-[11px] font-bold">{m}</SelectItem>
                                                                                        ))}
                                                                                        <SelectItem value="Prática Clínica" className="text-[11px] font-bold">Prática Clínica</SelectItem>
                                                                                    </SelectContent>
                                                                                </Select>
                                                                            </div>

                                                                            {/* Recursos Multi-select */}
                                                                            <div className="flex items-center gap-2 flex-1">
                                                                                <span className="text-[10px] font-black text-slate-300 uppercase shrink-0">Recursos:</span>
                                                                                <Popover>
                                                                                    <PopoverTrigger asChild>
                                                                                        <button className="h-8 flex-1 bg-slate-50 hover:bg-slate-100 rounded-xl px-3 flex items-center justify-between transition-all border border-transparent hover:border-slate-200">
                                                                                            <div className="flex gap-1 overflow-hidden">
                                                                                                {(topics.find(t => t.id === item.id)?.resources || []).length > 0 ? (
                                                                                                    (topics.find(t => t.id === item.id)?.resources || []).slice(0, 2).map(r => (
                                                                                                        <Badge key={r} variant="outline" className="text-[8px] font-black uppercase px-2 py-0 h-4 bg-white border-slate-200 text-slate-500 whitespace-nowrap">{r}</Badge>
                                                                                                    ))
                                                                                                ) : (
                                                                                                    <span className="text-[10px] font-bold text-slate-300 uppercase">Selecionar recursos...</span>
                                                                                                )}
                                                                                                {(topics.find(t => t.id === item.id)?.resources || []).length > 2 && (
                                                                                                    <span className="text-[8px] font-black text-slate-400">+{topics.find(t => t.id === item.id)!.resources.length - 2}</span>
                                                                                                )}
                                                                                            </div>
                                                                                            <ChevronRight size={12} className="text-slate-300 ml-2" />
                                                                                        </button>
                                                                                    </PopoverTrigger>
                                                                                    <PopoverContent className="w-64 p-0 rounded-3xl border-none shadow-2xl overflow-hidden">
                                                                                        <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                                                                            <span className="text-[9px] font-black uppercase tracking-widest text-[#8C132C]">Recursos Didáticos</span>
                                                                                        </div>
                                                                                        <div className="p-2 max-h-[300px] overflow-y-auto no-scrollbar">
                                                                                            {RESOURCE_OPTIONS.map(opt => (
                                                                                                <div key={opt} className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer group">
                                                                                                    <Checkbox
                                                                                                        id={`res-${item.id}-${opt}`}
                                                                                                        checked={topics.find(t => t.id === item.id)?.resources.includes(opt)}
                                                                                                        onCheckedChange={(checked) => {
                                                                                                            const current = topics.find(t => t.id === item.id)?.resources || [];
                                                                                                            const newVal = checked ? [...current, opt] : current.filter(r => r !== opt);
                                                                                                            updateTopic(item.id, { resources: newVal });
                                                                                                        }}
                                                                                                        className="rounded border-slate-200 data-[state=checked]:bg-[#8C132C] data-[state=checked]:border-[#8C132C]"
                                                                                                    />
                                                                                                    <Label htmlFor={`res-${item.id}-${opt}`} className="text-[10px] font-bold text-slate-600 cursor-pointer flex-1 group-hover:text-[#8C132C]">
                                                                                                        {opt}
                                                                                                    </Label>
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    </PopoverContent>
                                                                                </Popover>
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center gap-4 shrink-0">
                                                            {isAssessment && (
                                                                <div className="flex items-center gap-1 bg-amber-100 px-3 py-1.5 rounded-2xl border border-amber-200 shadow-sm">
                                                                    <Input
                                                                        type="number"
                                                                        value={assessments.find(a => a.id === item.id)?.points || 0}
                                                                        onChange={(e) => updateAssessment(item.id, { points: parseInt(e.target.value) || 0 })}
                                                                        className="w-10 h-6 text-[12px] font-black p-0 text-center bg-transparent border-none focus:ring-0 shadow-none text-amber-700 font-bold"
                                                                    />
                                                                    <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest">PTS</span>
                                                                </div>
                                                            )}
                                                            {!isEmpty && (
                                                                <button
                                                                    onClick={() => isAssessment ? removeAssessment(item.id) : removeTopic(item.id)}
                                                                    className="w-12 h-12 rounded-[20px] flex items-center justify-center text-slate-200 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                                                >
                                                                    <Trash2 size={20} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    );
                                })}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            </div>

            <div className="flex justify-between items-center pt-10 border-t border-slate-100">
                <Button onClick={() => setStep(2)} variant="ghost" className="h-14 rounded-2xl px-10 font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">
                    <ChevronLeft size={18} className="mr-2" /> Voltar
                </Button>
                <Button disabled={isOverflow} onClick={() => setStep(4)} className="bg-emerald-600 hover:bg-emerald-700 h-16 rounded-[28px] px-12 font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20 hover:scale-105">
                    <Sparkles size={18} className="mr-2" /> Ativar Cronograma
                </Button>
            </div>
        </motion.div>
    );
}
