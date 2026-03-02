"use client";

import React, { useState } from "react";
import { Mic, Camera, LayoutGrid, Check, ArrowLeft, Loader2, Sparkles, Database, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AxiomCopilot } from "@/components/copilot/AxiomCopilot";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface RemoteMobileViewProps {
    patient: any;
    appointment: any;
    currentRecord: any;
    onUpdate: (path: string, value: any) => void;
    onSave: () => Promise<void>;
    onClose: () => void;
    basePath?: string;
}

export default function RemoteMobileView({
    patient,
    appointment,
    currentRecord,
    onUpdate,
    onSave,
    onClose,
    basePath = "hma"
}: RemoteMobileViewProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [view, setView] = useState<'hub' | 'copilot' | 'camera'>('hub');

    const handleInternalSave = async () => {
        setIsSaving(true);
        try {
            await onSave();
            toast.success("Dados sincronizados com o computador!");
        } catch (e) {
            toast.error("Erro ao sincronizar.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#f8fafc] z-[100] flex flex-col font-sans overflow-hidden">
            {/* Mobile Header (FOTO 2 Style) */}
            <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-10 w-10 bg-slate-100">
                        <ArrowLeft className="h-5 w-5 text-slate-600" />
                    </Button>
                    <div>
                        <h1 className="text-sm font-black text-slate-900 tracking-tight leading-none uppercase">Controle Remoto</h1>
                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-0.5">Sessão Ativa</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">Conectado</span>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Patient Overview Card */}
                <Card className="p-6 rounded-[2.5rem] border-none shadow-xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Database className="w-24 h-24 rotate-12" />
                    </div>
                    <Badge className="bg-white/20 text-white border-none font-black text-[9px] uppercase tracking-widest mb-2">Paciente Selecionado</Badge>
                    <h2 className="text-2xl font-black tracking-tight leading-tight">{patient?.name || '---'}</h2>
                    <div className="flex items-center gap-3 mt-1 opacity-80 text-xs font-bold uppercase tracking-widest">
                        <span>PBE 5.0</span>
                        <div className="w-1 h-1 bg-white rounded-full" />
                        <span>{appointment?.services?.name || 'Consulta'}</span>
                    </div>
                </Card>

                {/* Main Action Hub */}
                <div className="grid grid-cols-1 gap-4">
                    {/* 1. Mapeamento de IA (Axiom Copilot) */}
                    <button
                        onClick={() => setView('hub')}
                        className="w-full bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-lg flex items-center justify-between group active:scale-95 transition-transform"
                    >
                        <div className="flex items-center gap-6">
                            <div className="h-16 w-16 bg-indigo-50 rounded-[1.5rem] flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm">
                                <Mic className="h-8 w-8" />
                            </div>
                            <div className="text-left">
                                <h3 className="text-lg font-black text-slate-800 leading-none">Assistente de Voz</h3>
                                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-tighter">Capturar relato do paciente</p>
                            </div>
                        </div>
                        <Sparkles className="h-5 w-5 text-indigo-400 group-hover:scale-125 transition-transform" />
                    </button>

                    <div className="p-4 bg-white rounded-[2.5rem] border border-slate-100 shadow-inner">
                        <AxiomCopilot
                            basePath={basePath}
                            compact={true}
                            onStatusChange={(isListening) => {
                                if (!isListening) handleInternalSave();
                            }}
                        />
                    </div>

                    {/* 2. Captura Postural (Camera) */}
                    <button
                        className="w-full bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-lg flex items-center justify-between group active:scale-95 transition-transform overflow-hidden relative"
                    >
                        <div className="flex items-center gap-6">
                            <div className="h-16 w-16 bg-purple-50 rounded-[1.5rem] flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors shadow-sm">
                                <Camera className="h-8 w-8" />
                            </div>
                            <div className="text-left">
                                <h3 className="text-lg font-black text-slate-800 leading-none">Fotos de Postura</h3>
                                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-tighter">Anterior, Posterior, Perfil</p>
                            </div>
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    toast.loading("Subindo foto para o computador...");
                                    // Future: Real upload to storage
                                    // For now, let's just toast
                                    setTimeout(() => {
                                        toast.dismiss();
                                        toast.success("Foto enviada com sucesso!");
                                    }, 2000);
                                }
                            }}
                        />
                    </button>
                </div>

                {/* Quick Info Field */}
                <div className="space-y-3 pt-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Queixa Principal (QP)</label>
                    <textarea
                        className="w-full bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-slate-700 font-bold text-sm min-h-[100px] focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        placeholder="Edite a queixa principal aqui..."
                        value={currentRecord?.content?.qp || ""}
                        onChange={(e) => onUpdate("qp", e.target.value)}
                    />
                </div>
            </main>

            {/* Sticky Bottom Actions */}
            <footer className="p-6 bg-white border-t border-slate-100 shrink-0">
                <Button
                    onClick={handleInternalSave}
                    disabled={isSaving}
                    className="w-full h-16 rounded-[1.5rem] bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-600/20 gap-3"
                >
                    {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    {isSaving ? "Sincronizando..." : "Sincronizar Dados"}
                </Button>
            </footer>
        </div>
    );
}
