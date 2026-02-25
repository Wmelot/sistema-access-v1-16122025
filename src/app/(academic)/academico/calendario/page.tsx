'use client';

import React from 'react';
import { SyllabusProvider, useSyllabus } from './components/SyllabusContext';
import { StepIndicator } from './components/StepIndicator';
import Step1_Config from './components/Step1_Config';
import Step2_Library from './components/Step2_Library';
import Step3_Timeline from './components/Step3_Timeline';
import Step4_Final from './components/Step4_Final';
import ConflictModal from './components/ConflictModal';
import DraftsModal from './components/DraftsModal';
import PrintPreview from './components/PrintPreview';
import ReallocateModal from './components/ReallocateModal';
import { AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle2, Save, ChevronRight, BookOpen, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

function SyllabusWizardContent() {
    const {
        step,
        isOverflow,
        totalNeededHours,
        availableHours,
        totalPoints,
        setShowDraftsModal,
        saveDraft,
        setShowPreviewModal,
        createNewSyllabus,
        drafts
    } = useSyllabus();

    return (
        <div className="min-h-screen bg-[#FDFDFD] p-8 lg:p-12 font-sans text-slate-900 selection:bg-[#8C132C]/10 selection:text-[#8C132C]">
            <div className="max-w-[1600px] mx-auto space-y-12 animate-in fade-in duration-700">
                {/* Header Section */}
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h1 className="text-4xl font-black text-[#363636] tracking-tight">Design de Cronograma 2.0</h1>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">Gestor Estratégico de Conteúdo Acadêmico • Axiom Intelligence</p>
                    </div>
                    <div className="flex gap-4">
                        <Button
                            onClick={() => {
                                if (window.confirm("Deseja iniciar um novo cronograma? Certifique-se de ter salvo o atual como rascunhos primeiro!")) {
                                    createNewSyllabus();
                                }
                            }}
                            variant="ghost"
                            className="rounded-2xl font-black text-[10px] uppercase tracking-widest h-14 px-8 text-slate-400 hover:text-emerald-500 transition-all flex items-center gap-2 hover:bg-emerald-50/50"
                        >
                            <Plus size={18} /> Novo Cronograma
                        </Button>
                        <Button
                            onClick={() => setShowDraftsModal(true)}
                            variant="ghost"
                            className="rounded-2xl font-black text-[10px] uppercase tracking-widest h-14 px-8 text-slate-500 hover:text-[#8C132C] transition-all flex items-center gap-2 hover:bg-[#8C132C]/5"
                        >
                            <BookOpen size={18} /> Meus Rascunhos ({drafts.length})
                        </Button>
                        <Button
                            onClick={() => saveDraft()}
                            variant="outline"
                            className="rounded-2xl border-slate-200 font-black text-[10px] uppercase tracking-widest h-14 px-8 hover:border-[#8C132C]/20 hover:bg-[#8C132C]/5 transition-all"
                        >
                            <Save size={18} className="mr-2" /> Salvar Rascunho
                        </Button>
                        <Button
                            onClick={() => setShowPreviewModal(true)}
                            className="bg-[#363636] hover:bg-[#222] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest h-14 px-10 shadow-2xl shadow-slate-200/50 transition-all hover:scale-105"
                        >
                            Visualizar Cronograma <ChevronRight size={18} className="ml-2" />
                        </Button>
                    </div>
                </div>

                <StepIndicator />

                <AnimatePresence mode="wait">
                    {step === 1 && <Step1_Config key="step1" />}
                    {step === 2 && <Step2_Library key="step2" />}
                    {step === 3 && <Step3_Timeline key="step3" />}
                    {step === 4 && <Step4_Final key="step4" />}
                </AnimatePresence>
            </div>

            {/* FLOATING STATUS INFO */}
            {step === 3 && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-8 duration-500">
                    <div className={cn(
                        "px-8 py-4 rounded-full shadow-2xl flex items-center gap-8 backdrop-blur-xl border-2 transition-all",
                        isOverflow ? "bg-red-500/95 border-red-400 text-white" : "bg-[#363636]/95 border-white/20 text-slate-100"
                    )}>
                        <div className="flex items-center gap-3 border-r border-white/10 pr-8">
                            <div className={cn("w-2.5 h-2.5 rounded-full shadow-[0_0_15px]", isOverflow ? "bg-white animate-pulse shadow-white/50" : "bg-emerald-400 shadow-emerald-400/50")} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Calendário Ativo</span>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black uppercase opacity-60 tracking-tighter">Carga Horária</span>
                                <div className="text-xs font-black">{totalNeededHours} / {availableHours.toFixed(0)}h</div>
                            </div>

                            {totalPoints !== 100 && (
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black uppercase opacity-60 tracking-tighter text-red-100">Avaliação</span>
                                    <div className="flex items-center gap-2 bg-red-400/20 px-3 py-1 rounded-lg text-[10px] font-black text-red-100">
                                        <AlertTriangle size={12} /> {totalPoints}/100 pts
                                    </div>
                                </div>
                            )}

                            {isOverflow ? (
                                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase">
                                    <AlertTriangle size={14} /> Estouro: {(totalNeededHours - availableHours).toFixed(1)}h
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <span className="text-[9px] font-black uppercase opacity-60 tracking-tighter text-emerald-400">Espaço</span>
                                    <div className="flex items-center gap-2 bg-emerald-500/20 px-3 py-1 rounded-lg text-[10px] font-black text-emerald-300">
                                        <CheckCircle2 size={12} /> OK
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modals Sub-components */}
            <ConflictModal />
            <DraftsModal />
            <PrintPreview />
            <ReallocateModal />
        </div>
    );
}

export default function SyllabusWizard() {
    return (
        <SyllabusProvider>
            <SyllabusWizardContent />
        </SyllabusProvider>
    );
}
