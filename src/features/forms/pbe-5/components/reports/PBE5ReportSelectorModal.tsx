"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FileText, CheckCircle2, ChevronRight, LayoutPanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PBE5ReportSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (selectedSections: string[]) => void;
    menuSections: { id: string; label: string; desc: string }[];
    isSectionFilled: (id: string) => boolean;
}

export function PBE5ReportSelectorModal({
    isOpen,
    onClose,
    onConfirm,
    menuSections,
    isSectionFilled
}: PBE5ReportSelectorModalProps) {
    const [selected, setSelected] = React.useState<string[]>([]);

    // Auto-select all filled sections on open
    React.useEffect(() => {
        if (isOpen) {
            const filledIds = menuSections.filter((s: any) => isSectionFilled(s.id)).map((s: any) => s.id);
            setSelected(filledIds);
        }
    }, [isOpen, menuSections, isSectionFilled]);

    const toggle = (id: string) => {
        setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handleConfirm = () => {
        if (selected.length === 0) return;
        onConfirm(selected);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md rounded-[40px] p-8 border-none shadow-2xl bg-white">
                <DialogHeader className="space-y-3">
                    <DialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20 rotate-3">
                            <LayoutPanelLeft className="w-6 h-6 text-white" />
                        </div>
                        Configurar Laudo
                    </DialogTitle>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                        Escolha os itens que deseja incluir na visualização final do relatório.
                    </p>
                </DialogHeader>

                <div className="py-6">
                    <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                        {menuSections.filter((s: any) => isSectionFilled(s.id)).map((sec: any) => (
                            <div
                                key={sec.id}
                                className={cn(
                                    "flex items-center gap-4 p-4 rounded-[2rem] border transition-all cursor-pointer group",
                                    selected.includes(sec.id)
                                        ? "bg-indigo-50 border-indigo-200 shadow-sm"
                                        : "bg-white border-slate-100 hover:bg-slate-50 hover:border-indigo-100"
                                )}
                                onClick={() => toggle(sec.id)}
                            >
                                <Checkbox
                                    id={sec.id}
                                    checked={selected.includes(sec.id)}
                                    className="h-5 w-5 rounded-lg border-2 border-slate-200 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                />
                                <div className="flex-1">
                                    <Label
                                        htmlFor={sec.id}
                                        className="text-[13px] font-black text-slate-800 cursor-pointer group-hover:text-indigo-700 transition-colors uppercase tracking-tight"
                                    >
                                        {sec.label}
                                    </Label>
                                    <p className="text-[10px] font-bold text-slate-400 line-clamp-1 italic">{sec.desc}</p>
                                </div>
                                {selected.includes(sec.id) && (
                                    <CheckCircle2 className="w-4 h-4 text-indigo-600 opacity-60" />
                                )}
                            </div>
                        ))}

                        {menuSections.filter((s: any) => isSectionFilled(s.id)).length === 0 && (
                            <div className="text-center py-12 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                                <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                <p className="text-sm font-bold text-slate-400">Nenhuma seção preenchida.</p>
                                <p className="text-[10px] text-slate-400 uppercase">Preencha o formulário antes de gerar o laudo.</p>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="rounded-2xl font-bold h-12 px-6"
                    >
                        Cancelar
                    </Button>
                    <Button
                        disabled={selected.length === 0}
                        onClick={handleConfirm}
                        className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-[1.5rem] h-14 gap-2 flex items-center justify-center shadow-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                    >
                        GERAR RELATÓRIO <ChevronRight className="w-4 h-4" />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
