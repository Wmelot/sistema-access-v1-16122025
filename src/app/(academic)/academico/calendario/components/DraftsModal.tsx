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
    Trash2,
    Calendar as CalendarIcon
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
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
            <DialogContent className="sm:max-w-[95vw] lg:max-w-[1240px] w-full h-[85vh] rounded-[48px] p-12 border-none shadow-2xl bg-white flex flex-col !max-w-[1240px] overflow-hidden">
                <DialogHeader className="mb-10 text-left">
                    <DialogTitle className="text-5xl font-black text-[#363636] tracking-tight">Meus Cronogramas</DialogTitle>
                    <DialogDescription className="font-bold uppercase text-[12px] tracking-widest text-[#8C132C] opacity-70 mt-3 ml-1">
                        Gerencie e carregue as versões oficiais dos seus planos de ensino
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4 overflow-y-auto pr-4 flex-1 mb-6 custom-scrollbar">
                    {drafts.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-32 text-slate-300 gap-6">
                            <BookOpen size={64} className="opacity-10" />
                            <span className="font-black uppercase text-sm tracking-widest">Nenhum cronograma salvo ainda</span>
                        </div>
                    ) : (
                        drafts.map((draft) => (
                            <div key={draft.id} className="group bg-slate-50 p-8 rounded-[40px] border border-slate-100/50 hover:bg-white hover:shadow-2xl hover:shadow-[#8C132C]/5 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between gap-6 relative overflow-hidden min-h-[320px]">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#8C132C]/5 rounded-bl-full -mr-10 -mt-10 group-hover:bg-[#8C132C]/10 transition-colors" />

                                <div className="relative z-10 flex-1 flex flex-col pt-2">
                                    <div className="flex justify-between items-start mb-6">
                                        <Badge className="bg-[#8C132C]/10 text-[#8C132C] border-none text-[8px] font-black uppercase px-3 py-1">Semestre Atual</Badge>
                                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                                            <CalendarIcon size={14} className="text-slate-400" />
                                        </div>
                                    </div>
                                    <h4 className="font-black text-slate-800 text-2xl leading-[1.2] mb-6 line-clamp-3 group-hover:text-[#8C132C] transition-colors">
                                        {draft.data?.courseName || draft.courseName || draft.name || "Cronograma sem nome"}
                                    </h4>
                                    <div className="mt-auto flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#8C132C] opacity-40" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            {format(new Date(draft.date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3 relative z-10 pt-4 border-t border-slate-100">
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => loadDraft(draft, 4)}
                                            className="flex-1 bg-[#363636] rounded-[20px] h-12 px-6 font-black uppercase text-[9px] tracking-widest text-white transition-all shadow-lg hover:scale-[1.02] hover:bg-black"
                                        >
                                            Gerenciar Diário
                                        </Button>
                                        <Button
                                            onClick={() => loadDraft(draft)}
                                            variant="outline"
                                            className="bg-white border-slate-100 rounded-[20px] h-12 px-6 font-black uppercase text-[9px] tracking-widest text-slate-600 transition-all hover:bg-slate-50"
                                        >
                                            Editar Plano
                                        </Button>
                                        <button
                                            onClick={() => {
                                                if (window.confirm("Deseja realmente excluir este cronograma?")) {
                                                    deleteDraft(draft.id);
                                                }
                                            }}
                                            className="w-12 h-12 rounded-[20px] bg-white border border-slate-100 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all shadow-sm"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
