"use client";

import { PenTool, Trash2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { deleteDraft } from "@/actions/attendance";
import { toast } from "sonner";
import { useState } from "react";
import Swal from "sweetalert2";

export function DraftsList({ initialDrafts, slug }: { initialDrafts: any[], slug: string }) {
    const [drafts, setDrafts] = useState(initialDrafts);

    const handleDelete = async (id: string) => {
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
            } else {
                toast.error("Erro ao excluir: " + res.msg);
            }
        }
    };

    if (drafts.length === 0) {
        return (
            <Card className="border-dashed flex flex-col items-center justify-center p-12 text-center bg-slate-50/50">
                <PenTool className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                <h3 className="text-lg font-semibold text-slate-700">Nenhum rascunho encontrado</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                    Inicie um novo atendimento rápido pelo menu lateral para agilizar seu fluxo.
                </p>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {drafts.map((draft: any) => {
                const record = draft.patient_records?.[0];
                const templateName = record?.form_templates?.title || "Ficha Clínica";
                return (
                    <Card key={draft.id} className="hover:border-indigo-200 transition-all hover:shadow-md group bg-white border-slate-200">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2 text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                                    <PenTool className="h-2.5 w-2.5" />
                                    Rascunho Rápido
                                </div>
                                <span className="text-[10px] text-slate-400 font-medium">
                                    {format(new Date(draft.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                </span>
                            </div>
                            <CardTitle className="text-lg mt-3 font-bold text-slate-800">{templateName}</CardTitle>
                            <CardDescription className="text-slate-500 text-xs">
                                Aguardando vínculo com paciente
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex gap-2 pt-4">
                            <Button asChild className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm font-bold">
                                <Link href={`/dashboard/${slug}/attendance/${draft.id}`}>
                                    Atender e Vincular
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </Link>
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleDelete(draft.id)}
                                className="text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100 h-10 w-10 transition-colors border-slate-200"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
