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
    AlertTriangle,
    ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { useSyllabus } from './SyllabusContext';

export default function ConflictModal() {
    const {
        showConflictModal, setShowConflictModal,
        setUploadedFiles,
        handleRunAIAnalysis
    } = useSyllabus();

    return (
        <Dialog open={showConflictModal} onOpenChange={setShowConflictModal}>
            <DialogContent className="max-w-[600px] rounded-[48px] p-10 border-none shadow-2xl bg-white">
                <DialogHeader>
                    <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mb-6">
                        <AlertTriangle size={32} />
                    </div>
                    <DialogTitle className="text-2xl font-black text-slate-800">Divergência entre Documentos</DialogTitle>
                    <DialogDescription className="font-bold text-slate-400 mt-2">
                        A Axiom AI detectou informações conflitantes entre o <strong className="text-slate-600 font-bold">Plano de Ensino</strong> e o <strong className="text-slate-600 font-bold">Cronograma Auxiliar</strong>. Como deseja proceder?
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 mt-8">
                    <button
                        onClick={() => {
                            setShowConflictModal(false);
                            setUploadedFiles([]); // Limpa para evitar loop de conflito
                            toast.success("Utilizando dados do Plano de Ensino (Prioridade Acadêmica)");
                            setTimeout(() => handleRunAIAnalysis(), 500);
                        }}
                        className="bg-slate-50 p-6 rounded-3xl border border-slate-100 hover:border-[#8C132C]/20 text-left transition-all group"
                    >
                        <div className="flex justify-between items-center">
                            <span className="font-black text-slate-700 font-bold">Priorizar Plano de Ensino</span>
                            <ChevronRight size={18} className="text-slate-300 group-hover:text-[#8C132C]" />
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Usa bibliografia e ementa oficial do PPC.</p>
                    </button>

                    <button
                        onClick={() => {
                            setShowConflictModal(false);
                            setUploadedFiles([]); // Limpa para evitar loop de conflito
                            toast.success("Utilizando dados do Cronograma Auxiliar");
                            setTimeout(() => handleRunAIAnalysis(), 500);
                        }}
                        className="bg-slate-50 p-6 rounded-3xl border border-slate-100 hover:border-[#8C132C]/20 text-left transition-all group"
                    >
                        <div className="flex justify-between items-center">
                            <span className="font-black text-slate-700 font-bold">Priorizar Cronograma Auxiliar</span>
                            <ChevronRight size={18} className="text-slate-300 group-hover:text-[#8C132C]" />
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Usa datas e sequências customizadas do docente.</p>
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
