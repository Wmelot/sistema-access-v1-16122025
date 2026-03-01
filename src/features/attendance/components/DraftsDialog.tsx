"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PenTool, Trash2, ArrowRight, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getDraftRecords, deleteDraft } from "@/actions/attendance";
import { toast } from "sonner";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import Swal from "sweetalert2";

interface DraftsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    slug: string;
}

export function DraftsDialog({ open, onOpenChange, slug }: DraftsDialogProps) {
    const [drafts, setDrafts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (open) {
            fetchDrafts();
        }
    }, [open]);

    const fetchDrafts = async () => {
        setLoading(true);
        try {
            const res = await getDraftRecords();
            if (res.success) {
                setDrafts(res.data || []);
            }
        } catch (error) {
            toast.error("Erro ao carregar rascunhos");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();

        const confirm = await Swal.fire({
            title: 'Excluir Rascunho?',
            text: "Esta ação não pode ser desfeita.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sim, excluir',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#ef4444'
        });

        if (confirm.isConfirmed) {
            const res = await deleteDraft(id);
            if (res.success) {
                setDrafts(prev => prev.filter(d => d.id !== id));
                toast.success("Rascunho excluído.");
                // Trigger real-time update in sidebar
                window.dispatchEvent(new CustomEvent('draft-count-updated'));
            } else {
                toast.error("Erro ao excluir: " + res.msg);
            }
        }
    };

    const filteredDrafts = drafts.filter(draft => {
        const record = draft.patient_records?.[0];
        const title = record?.form_templates?.title || "Ficha Clínica";
        return title.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col p-0 overflow-hidden bg-slate-50 border-none shadow-2xl">
                <DialogHeader className="p-6 bg-white border-b shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                            <PenTool className="h-6 w-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Rascunhos Rápidos</DialogTitle>
                            <DialogDescription className="text-slate-500 font-medium">
                                Atendimentos iniciados sem vínculo. Localize-os e finalize o prontuário.
                            </DialogDescription>
                        </div>
                    </div>

                    <div className="mt-6 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Buscar por formulário..."
                            className="pl-10 bg-slate-50 border-slate-200 h-11 focus-visible:ring-indigo-500 rounded-xl"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Carregando rascunhos...</p>
                        </div>
                    ) : filteredDrafts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 opacity-50">
                                <PenTool className="h-8 w-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-700">Nenhum rascunho encontrado</h3>
                            <p className="text-sm text-slate-400 max-w-xs mt-1">
                                {searchTerm ? "Nenhum resultado para sua busca." : "Inicie um atendimento rápido pelo menu lateral para agilizar seu fluxo."}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
                            {filteredDrafts.map((draft: any) => {
                                const record = draft.patient_records?.[0];
                                const templateName = record?.form_templates?.title || "Ficha Clínica";
                                return (
                                    <Link
                                        key={draft.id}
                                        href={`/dashboard/${slug}/attendance/${draft.id}`}
                                        onClick={() => onOpenChange(false)}
                                        className="block group"
                                    >
                                        <Card className="h-full border-slate-200 hover:border-indigo-400 transition-all hover:shadow-lg bg-white overflow-hidden relative">
                                            <div className="absolute top-0 right-0 p-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors z-10"
                                                    onClick={(e) => handleDelete(e, draft.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <CardContent className="p-5">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="text-[9px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                                        Rascunho
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase">
                                                        {format(new Date(draft.created_at), "dd/MM HH:mm", { locale: ptBR })}
                                                    </span>
                                                </div>
                                                <h4 className="font-black text-slate-800 text-base leading-tight group-hover:text-indigo-600 transition-colors">
                                                    {templateName}
                                                </h4>
                                                <div className="flex items-center justify-between mt-4">
                                                    <span className="text-[11px] font-bold text-slate-400 uppercase group-hover:text-slate-600 transition-colors">Continuar</span>
                                                    <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:translate-x-1 shrink-0">
                                                        <ArrowRight className="h-4 w-4" />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
