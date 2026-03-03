"use client";

import React, { useState } from "react";
import { Mic, Camera, LayoutGrid, Check, ArrowLeft, Loader2, Sparkles, Database, Save, Info, Video } from "lucide-react";
import { VideoFrameGrabberModal } from "@/components/ui/video-frame-grabber";
import { AxiomNivelCamera } from "@/components/ui/axiom-nivel-camera";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AxiomCopilot } from "@/components/copilot/AxiomCopilot";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useForm, FormProvider } from "react-hook-form";

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

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
    const [isGrabberOpen, setIsGrabberOpen] = useState(false);

    // Nivel Camera State
    const [isNivelOpen, setIsNivelOpen] = useState(false);
    const [activeNivelSlot, setActiveNivelSlot] = useState<{ id: string, label: string } | null>(null);

    const methods = useForm({
        defaultValues: {
            qp: currentRecord?.content?.qp || "",
            ...currentRecord?.content
        }
    });

    // Keep parent updated with Copilot voice changes (e.g., QP, regions)
    React.useEffect(() => {
        const subscription = methods.watch((value, { name }) => {
            if (name) {
                // If it changes, sync upward so when we save we have the freshest data
                onUpdate(name, methods.getValues(name));
            }
        });
        return () => subscription.unsubscribe();
    }, [methods, onUpdate]);

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
                        <FormProvider {...methods}>
                            <AxiomCopilot
                                basePath={basePath}
                                compact={true}
                                onStatusChange={(isListening) => {
                                    if (!isListening) handleInternalSave();
                                }}
                            />
                        </FormProvider>
                    </div>

                    {/* 2. Captura Postural (Camera) Menu Toggle */}
                    {view === 'hub' ? (
                        <button
                            onClick={() => setView('camera')}
                            className="w-full bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-lg flex items-center justify-between group active:scale-95 transition-transform relative"
                        >
                            <div className="flex items-center gap-6">
                                <div className="h-16 w-16 bg-purple-50 rounded-[1.5rem] flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors shadow-sm">
                                    <Camera className="h-8 w-8" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-lg font-black text-slate-800 leading-none">Câmera e Mídia</h3>
                                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-tighter">Escolher campo para foto/vídeo</p>
                                </div>
                            </div>
                            <LayoutGrid className="h-5 w-5 text-purple-400 group-hover:scale-125 transition-transform" />
                        </button>
                    ) : (
                        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-inner space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Selecionar Campo</h3>
                                <Button variant="ghost" size="sm" onClick={() => setView('hub')} className="text-slate-400 hover:text-slate-600 uppercase text-[10px] font-bold">Voltar</Button>
                            </div>
                            {[
                                { id: 'posture.photos.anterior', label: 'Postura Anterior', icon: Camera, color: 'text-blue-500', accept: 'image/*' },
                                { id: 'posture.photos.posterior', label: 'Postura Posterior', icon: Camera, color: 'text-blue-500', accept: 'image/*' },
                                { id: 'posture.photos.left', label: 'Perfil Esquerdo', icon: Camera, color: 'text-indigo-500', accept: 'image/*' },
                                { id: 'posture.photos.right', label: 'Perfil Direito', icon: Camera, color: 'text-indigo-500', accept: 'image/*' },
                                { id: 'movement.gaitPhotos.rc_left', label: 'RC Esq', title: 'Pisada', icon: Camera, color: 'text-emerald-500', accept: 'image/*' },
                                { id: 'movement.gaitPhotos.am_left', label: 'AM Esq', title: 'Pisada', icon: Camera, color: 'text-emerald-500', accept: 'image/*' },
                                { id: 'movement.gaitPhotos.fi_left', label: 'FI Esq', title: 'Pisada', icon: Camera, color: 'text-emerald-500', accept: 'image/*' },
                                { id: 'movement.gaitPhotos.rc_right', label: 'RC Dir', title: 'Pisada', icon: Camera, color: 'text-emerald-600', accept: 'image/*' },
                                { id: 'movement.gaitPhotos.am_right', label: 'AM Dir', title: 'Pisada', icon: Camera, color: 'text-emerald-600', accept: 'image/*' },
                                { id: 'movement.gaitPhotos.fi_right', label: 'FI Dir', title: 'Pisada', icon: Camera, color: 'text-emerald-600', accept: 'image/*' },
                            ].map((slot) => (
                                <div key={slot.id} className="relative w-full bg-slate-50 p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between overflow-hidden active:scale-95 transition-transform">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                            <slot.icon className={`h-5 w-5 ${slot.color}`} />
                                        </div>
                                        <div>
                                            {slot.title && <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{slot.title}</p>}
                                            <h4 className="text-xs font-black text-slate-700 uppercase">{slot.label}</h4>
                                        </div>
                                    </div>
                                    {currentRecord?.content?.[slot.id.split('.')[0]]?.[slot.id.split('.')[1]]?.[slot.id.split('.')[2]] && (
                                        <Check className="h-5 w-5 text-emerald-500" />
                                    )}
                                    {/* Use Axiom Nivel Camera for Photos */}
                                    <button
                                        onClick={() => {
                                            setActiveNivelSlot({ id: slot.id, label: slot.label });
                                            setIsNivelOpen(true);
                                        }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        title={`Abrir Câmera para ${slot.label}`}
                                    />
                                </div>
                            ))}
                            <div className="mt-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex gap-3">
                                <Info className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                                <p className="text-[10px] text-indigo-700 font-bold leading-relaxed">
                                    Tire a foto usando este celular e ela aparecerá instantaneamente no PBE 5.0 aberto no computador.
                                </p>
                            </div>

                            <hr className="my-2 border-slate-100" />

                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setIsGrabberOpen(true);
                                }}
                                className="w-full bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 shadow-sm flex items-center justify-between group active:scale-95 transition-transform"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="h-12 w-12 bg-white rounded-[1rem] flex items-center justify-center text-emerald-600 shadow-sm">
                                        <Video className="h-6 w-6" />
                                    </div>
                                    <div className="text-left">
                                        <h4 className="text-sm font-black text-emerald-700 uppercase">Extrair de Vídeo</h4>
                                        <p className="text-[10px] font-bold text-emerald-600/70 mt-0.5 uppercase tracking-widest">Grave e fatie os quadros</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    )}
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

            <VideoFrameGrabberModal
                open={isGrabberOpen}
                onClose={() => setIsGrabberOpen(false)}
                slots={[
                    { id: 'movement.gaitPhotos.midstance_left', label: 'Apoio Médio (Pé E)', value: currentRecord?.content?.movement?.gaitPhotos?.midstance_left || null },
                    { id: 'movement.gaitPhotos.midstance_right', label: 'Apoio Médio (Pé D)', value: currentRecord?.content?.movement?.gaitPhotos?.midstance_right || null },
                    { id: 'movement.gaitPhotos.running_heel_strike', label: 'Corrida (Retropé)', value: currentRecord?.content?.movement?.gaitPhotos?.running_heel_strike || null },
                ]}
                onCaptureToSlot={async (id, base64) => {
                    const loadingToast = toast.loading("Processando frame...");
                    try {
                        onUpdate(id, base64);
                        await handleInternalSave();
                        toast.success("Frame extraído e salvo no computador!", { id: loadingToast });
                    } catch (err) {
                        toast.error("Falha ao salvar frame.", { id: loadingToast });
                    }
                }}
            />

            {/* Axiom Nivel 3D Camera */}
            <AxiomNivelCamera
                open={isNivelOpen}
                onClose={() => {
                    setIsNivelOpen(false);
                    setActiveNivelSlot(null);
                }}
                title={activeNivelSlot?.label || "Captura"}
                onCapture={async (base64: string) => {
                    if (activeNivelSlot) {
                        const loadingToast = toast.loading(`Salvando ${activeNivelSlot.label}...`);
                        try {
                            onUpdate(activeNivelSlot.id, base64);
                            await handleInternalSave();
                            toast.success("Foto salva e calibrada em 90 graus!", { id: loadingToast });
                        } catch (err) {
                            toast.error("Erro ao salvar foto calibrada.", { id: loadingToast });
                        }
                    }
                }}
            />
        </div>
    );
}
