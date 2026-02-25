'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import {
    Sparkles,
    ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useSyllabus } from './SyllabusContext';

export default function ReallocateModal() {
    const {
        showReallocateModal, setShowReallocateModal,
        reallocateWithIA, isAnalyzing
    } = useSyllabus();

    return (
        <Dialog open={showReallocateModal} onOpenChange={setShowReallocateModal}>
            <DialogContent className="max-w-[600px] rounded-[48px] p-10 border-none shadow-2xl bg-white">
                <DialogHeader>
                    <div className="w-16 h-16 bg-[#8C132C]/10 text-[#8C132C] rounded-3xl flex items-center justify-center mb-6">
                        <Sparkles size={32} />
                    </div>
                    <DialogTitle className="text-3xl font-black text-slate-800">Otimização Estratégica</DialogTitle>
                    <DialogDescription className="font-bold text-slate-400 mt-2">
                        Detectamos que o conteúdo planejado excede o tempo disponível no calendário. Como a IA deve ajustar o cronograma?
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 mt-8">
                    <button
                        disabled={isAnalyzing}
                        onClick={async () => {
                            await reallocateWithIA('prioritize');
                            setShowReallocateModal(false);
                        }}
                        className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 hover:border-[#8C132C]/20 text-left transition-all group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50"
                    >
                        <div className="flex justify-between items-center">
                            <span className="font-black text-slate-700">Priorizar Nucleação de Temas</span>
                            <ChevronRight size={18} className="text-slate-300 group-hover:text-[#8C132C]" />
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Agrupa tópicos correlatos para reduzir carga horária total.</p>
                    </button>

                    <button
                        disabled={isAnalyzing}
                        onClick={async () => {
                            await reallocateWithIA('linear');
                            setShowReallocateModal(false);
                        }}
                        className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 hover:border-[#8C132C]/20 text-left transition-all group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50"
                    >
                        <div className="flex justify-between items-center">
                            <span className="font-black text-slate-700">Ajuste Linear de Carga</span>
                            <ChevronRight size={18} className="text-slate-300 group-hover:text-[#8C132C]" />
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Reduz proporcionalmente o tempo de cada tópico.</p>
                    </button>

                    <Button
                        variant="ghost"
                        onClick={() => setShowReallocateModal(false)}
                        className="mt-4 font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-slate-600"
                    >
                        Cancelar e Ajustar Manualmente
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
