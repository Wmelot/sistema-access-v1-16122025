'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    BookOpen,
    Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSyllabus } from './SyllabusContext';

export default function DraftsModal() {
    const {
        showDraftsModal, setShowDraftsModal,
        drafts,
        loadDraft,
        deleteDraft
    } = useSyllabus();

    return (
        <Dialog open={showDraftsModal} onOpenChange={setShowDraftsModal}>
            <DialogContent className="max-w-[800px] rounded-[48px] p-10 border-none shadow-2xl bg-white">
                <DialogHeader>
                    <DialogTitle className="text-3xl font-black text-slate-800">Meus Rascunhos</DialogTitle>
                    <DialogDescription className="font-bold uppercase text-[10px] tracking-widest text-slate-400">
                        Gerencie e carregue versões salvas do seu cronograma
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 mt-8 max-h-[500px] overflow-y-auto pr-4 no-scrollbar">
                    {drafts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-300 gap-4">
                            <BookOpen size={48} className="opacity-20" />
                            <span className="font-black uppercase text-xs tracking-widest font-bold">Nenhum rascunho salvo</span>
                        </div>
                    ) : (
                        drafts.map((draft) => (
                            <div key={draft.id} className="group bg-slate-50 p-6 rounded-[32px] border border-slate-100/50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all flex items-center justify-between gap-6">
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-black text-slate-700 truncate font-bold">{draft.name}</h4>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            {format(new Date(draft.date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => loadDraft(draft)}
                                        className="bg-[#8C132C] rounded-2xl h-11 px-6 font-black uppercase text-[10px] tracking-widest text-white transition-all hover:scale-105"
                                    >
                                        Carregar
                                    </Button>
                                    <button
                                        onClick={() => deleteDraft(draft.id)}
                                        className="w-11 h-11 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
