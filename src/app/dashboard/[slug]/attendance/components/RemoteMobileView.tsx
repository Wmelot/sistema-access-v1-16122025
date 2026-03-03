"use client";

import React, { useState, useRef, useCallback } from "react";
import { Camera, ArrowLeft, Loader2, Save, Video, ChevronLeft, ChevronRight, X, Check, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface RemoteMobileViewProps {
    patient: any;
    appointment: any;
    currentRecord: any;
    templateId?: string;
    onUpdate: (path: string, value: any) => void;
    onSave: () => Promise<void>;
    onClose: () => void;
    basePath?: string;
}

// ── Slot configurations per form type ──
// Each form defines which media fields it supports
interface MediaSlot {
    id: string;
    label: string;
    group: string;
}

const PBE5_SLOTS: MediaSlot[] = [
    { id: 'posture.photos.anterior', label: 'Postura Anterior', group: 'Postura' },
    { id: 'posture.photos.posterior', label: 'Postura Posterior', group: 'Postura' },
    { id: 'posture.photos.left', label: 'Perfil Esquerdo', group: 'Postura' },
    { id: 'posture.photos.right', label: 'Perfil Direito', group: 'Postura' },
    { id: 'movement.gaitPhotos.rc_left', label: 'RC Esquerdo', group: 'Pisada' },
    { id: 'movement.gaitPhotos.am_left', label: 'AM Esquerdo', group: 'Pisada' },
    { id: 'movement.gaitPhotos.fi_left', label: 'FI Esquerdo', group: 'Pisada' },
    { id: 'movement.gaitPhotos.midstance_left', label: 'Apoio Médio Esq', group: 'Pisada' },
    { id: 'movement.gaitPhotos.rc_right', label: 'RC Direito', group: 'Pisada' },
    { id: 'movement.gaitPhotos.am_right', label: 'AM Direito', group: 'Pisada' },
    { id: 'movement.gaitPhotos.fi_right', label: 'FI Direito', group: 'Pisada' },
    { id: 'movement.gaitPhotos.midstance_right', label: 'Apoio Médio Dir', group: 'Pisada' },
    { id: 'movement.gaitPhotos.running_heel_strike', label: 'Corrida (Retropé)', group: 'Corrida' },
];

const PALMILHA5_SLOTS: MediaSlot[] = [
    { id: 'posture.photos.anterior', label: 'Postura Anterior', group: 'Postura' },
    { id: 'posture.photos.posterior', label: 'Postura Posterior', group: 'Postura' },
    { id: 'posture.photos.left', label: 'Perfil Esquerdo', group: 'Postura' },
    { id: 'posture.photos.right', label: 'Perfil Direito', group: 'Postura' },
    { id: 'movement.gaitPhotos.rc_left', label: 'RC Esquerdo', group: 'Pisada' },
    { id: 'movement.gaitPhotos.am_left', label: 'AM Esquerdo', group: 'Pisada' },
    { id: 'movement.gaitPhotos.fi_left', label: 'FI Esquerdo', group: 'Pisada' },
    { id: 'movement.gaitPhotos.rc_right', label: 'RC Direito', group: 'Pisada' },
    { id: 'movement.gaitPhotos.am_right', label: 'AM Direito', group: 'Pisada' },
    { id: 'movement.gaitPhotos.fi_right', label: 'FI Direito', group: 'Pisada' },
];

// Fallback for any other/future form
const DEFAULT_SLOTS: MediaSlot[] = [
    { id: 'photos.general_1', label: 'Foto 1', group: 'Geral' },
    { id: 'photos.general_2', label: 'Foto 2', group: 'Geral' },
    { id: 'photos.general_3', label: 'Foto 3', group: 'Geral' },
];

function getSlotsForTemplate(templateId?: string): MediaSlot[] {
    if (!templateId) return DEFAULT_SLOTS;
    const tid = templateId.toLowerCase();
    if (tid === 'pbe-5' || tid === 'e0000000-0000-0000-0000-000000000010' || tid.includes('pbe')) {
        return PBE5_SLOTS;
    }
    if (tid === 'palmilha-5' || tid === 'e0000000-0000-0000-0000-000000000005' || tid.includes('palmilha')) {
        return PALMILHA5_SLOTS;
    }
    return DEFAULT_SLOTS;
}

function getFormName(templateId?: string): string {
    if (!templateId) return 'Formulário';
    const tid = templateId.toLowerCase();
    if (tid === 'pbe-5' || tid === 'e0000000-0000-0000-0000-000000000010' || tid.includes('pbe')) return 'PBE 5.0';
    if (tid === 'palmilha-5' || tid === 'e0000000-0000-0000-0000-000000000005' || tid.includes('palmilha')) return 'Palmilha 5.0';
    if (tid === 'clinical_evolution_system' || tid === 'e0000000-0000-0000-0000-000000000004') return 'Evolução Clínica';
    return 'Formulário';
}

function getNestedValue(obj: any, path: string): any {
    if (!obj) return null;
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

// ── Main Component ──
export default function RemoteMobileView({
    patient,
    appointment,
    currentRecord,
    templateId,
    onUpdate,
    onSave,
    onClose,
    basePath = "hma"
}: RemoteMobileViewProps) {
    const [isSaving, setIsSaving] = useState(false);

    // View states: 'home' | 'video-review' | 'pick-slot'
    const [view, setView] = useState<'home' | 'video-review' | 'pick-slot'>('home');

    // Captured media
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
    const [videoSrc, setVideoSrc] = useState<string | null>(null);
    const [currentFrame, setCurrentFrame] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    // Use the record's template_id from DB as primary (works on both desktop and mobile browsers)
    // Fall back to the prop templateId (only set on desktop's local state)
    const effectiveTemplateId = currentRecord?.template_id || templateId;
    const formName = getFormName(effectiveTemplateId);
    const slots = getSlotsForTemplate(effectiveTemplateId);
    const patientFirstName = patient?.name?.split(' ')[0] || 'Paciente';

    const handleInternalSave = async () => {
        setIsSaving(true);
        try {
            await onSave();
            toast.success("Sincronizado!");
        } catch (e) {
            toast.error("Erro ao sincronizar.");
        } finally {
            setIsSaving(false);
        }
    };

    // ── Camera/Video Capture ──
    const handleFileCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type.startsWith('image/')) {
            // PHOTO mode
            const reader = new FileReader();
            reader.onload = () => {
                setCapturedPhoto(reader.result as string);
                setView('pick-slot');
            };
            reader.readAsDataURL(file);
        } else if (file.type.startsWith('video/')) {
            // VIDEO mode
            const url = URL.createObjectURL(file);
            setVideoSrc(url);
            setView('video-review');
        }

        e.target.value = '';
    };

    // ── Video Frame Navigation ──
    const skipFrame = (direction: 1 | -1) => {
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime += direction * (1 / 30); // 30fps
        }
    };

    const extractCurrentFrame = useCallback(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return null;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.85);
    }, []);

    const handleGrabFrame = () => {
        const frame = extractCurrentFrame();
        if (frame) {
            setCurrentFrame(frame);
            setView('pick-slot');
        }
    };

    // ── Assign to Slot ──
    const handleAssignToSlot = async (slotId: string) => {
        const imageData = capturedPhoto || currentFrame;
        if (!imageData) return;

        const loadingToast = toast.loading("Salvando...");
        try {
            onUpdate(slotId, imageData);
            await handleInternalSave();
            toast.success("Salvo e sincronizado!", { id: loadingToast });
        } catch (err) {
            toast.error("Erro ao salvar.", { id: loadingToast });
        }

        // Reset and go back
        setCapturedPhoto(null);
        setCurrentFrame(null);

        // If we came from video review, go back to video
        if (videoSrc) {
            setView('video-review');
        } else {
            setView('home');
        }
    };

    // ── Group slots by category ──
    const groupedSlots = slots.reduce<Record<string, MediaSlot[]>>((acc, slot) => {
        if (!acc[slot.group]) acc[slot.group] = [];
        acc[slot.group].push(slot);
        return acc;
    }, {});

    // ── Cleanup video on close ──
    const handleClose = () => {
        if (videoSrc) URL.revokeObjectURL(videoSrc);
        onClose();
    };

    // ══════════════════════════════════════════
    // VIEW: HOME (Patient + Form + Camera Button)
    // ══════════════════════════════════════════
    if (view === 'home') {
        return (
            <div className="fixed inset-0 bg-gradient-to-b from-slate-900 to-slate-950 z-[100] flex flex-col font-sans">
                {/* Hidden file input */}
                <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*,video/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileCapture}
                />

                {/* Header */}
                <header className="px-6 pt-safe-top py-6 flex items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full h-10 w-10 bg-white/10 text-white hover:bg-white/20">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Conectado</span>
                    </div>
                </header>

                {/* Center Content */}
                <div className="flex-1 flex flex-col items-center justify-center px-8 -mt-12">
                    {/* Patient Name */}
                    <div className="text-center mb-12">
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-2">Paciente</p>
                        <h1 className="text-4xl font-black text-white tracking-tight">{patientFirstName}</h1>
                        <div className="mt-3 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full">
                            <div className="h-1.5 w-1.5 bg-indigo-400 rounded-full" />
                            <span className="text-xs font-black text-indigo-300 uppercase tracking-widest">{formName}</span>
                        </div>
                    </div>

                    {/* Single Camera Button */}
                    <button
                        onClick={() => cameraInputRef.current?.click()}
                        className="relative w-28 h-28 rounded-full bg-white flex items-center justify-center shadow-[0_0_60px_rgba(255,255,255,0.15)] active:scale-90 transition-transform"
                    >
                        <Camera className="h-10 w-10 text-slate-900" />
                        <div className="absolute -bottom-8 whitespace-nowrap">
                            <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">Foto ou Vídeo</span>
                        </div>
                    </button>
                </div>

                {/* Footer hint */}
                <footer className="px-8 pb-10 text-center">
                    <p className="text-[10px] text-white/30 font-bold leading-relaxed max-w-xs mx-auto">
                        Tire uma foto ou grave um vídeo. Depois escolha para qual campo do {formName} o conteúdo vai.
                    </p>
                </footer>
            </div>
        );
    }

    // ══════════════════════════════════════════
    // VIEW: VIDEO REVIEW (Play, Navigate, Grab)
    // ══════════════════════════════════════════
    if (view === 'video-review') {
        return (
            <div className="fixed inset-0 bg-black z-[100] flex flex-col font-sans">
                <canvas ref={canvasRef} className="hidden" />

                {/* Header */}
                <header className="absolute top-0 left-0 right-0 z-10 px-6 pt-safe-top py-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
                    <Button variant="ghost" size="icon" onClick={() => {
                        if (videoSrc) URL.revokeObjectURL(videoSrc);
                        setVideoSrc(null);
                        setView('home');
                    }} className="rounded-full h-10 w-10 bg-white/10 text-white hover:bg-white/20">
                        <X className="h-5 w-5" />
                    </Button>
                    <h2 className="text-xs font-black text-white/80 uppercase tracking-widest">Navegue e Extraia</h2>
                    <div className="w-10" /> {/* spacer */}
                </header>

                {/* Video */}
                <div className="flex-1 flex items-center justify-center bg-black">
                    <video
                        ref={videoRef}
                        src={videoSrc || ''}
                        controls
                        muted
                        playsInline
                        className="w-full max-h-[70vh] object-contain"
                    />
                </div>

                {/* Bottom Controls */}
                <div className="bg-black/90 border-t border-white/10 p-6 space-y-4 shrink-0">
                    {/* Frame Navigation */}
                    <div className="flex items-center justify-center gap-4">
                        <Button
                            variant="ghost"
                            onClick={() => skipFrame(-1)}
                            className="h-14 px-6 rounded-2xl bg-white/10 text-white hover:bg-white/20 font-black text-xs uppercase tracking-widest gap-2"
                        >
                            <ChevronLeft className="h-5 w-5" />
                            Frame
                        </Button>

                        <Button
                            onClick={handleGrabFrame}
                            className="h-14 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest shadow-[0_0_30px_rgba(16,185,129,0.3)] gap-2"
                        >
                            <ImageIcon className="h-5 w-5" />
                            Armazenar Frame
                        </Button>

                        <Button
                            variant="ghost"
                            onClick={() => skipFrame(1)}
                            className="h-14 px-6 rounded-2xl bg-white/10 text-white hover:bg-white/20 font-black text-xs uppercase tracking-widest gap-2"
                        >
                            Frame
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // ══════════════════════════════════════════
    // VIEW: PICK SLOT (Choose where this image goes)
    // ══════════════════════════════════════════
    if (view === 'pick-slot') {
        const imageToAssign = capturedPhoto || currentFrame;

        return (
            <div className="fixed inset-0 bg-slate-50 z-[100] flex flex-col font-sans">
                {/* Header */}
                <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => {
                        setCapturedPhoto(null);
                        setCurrentFrame(null);
                        setView(videoSrc ? 'video-review' : 'home');
                    }} className="rounded-full h-10 w-10 bg-slate-100">
                        <ArrowLeft className="h-5 w-5 text-slate-600" />
                    </Button>
                    <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">Selecione o campo</h2>
                    <div className="w-10" />
                </header>

                <main className="flex-1 overflow-y-auto">
                    {/* Preview */}
                    {imageToAssign && (
                        <div className="p-4">
                            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm max-h-[200px]">
                                <img src={imageToAssign} alt="Captura" className="w-full h-full object-cover max-h-[200px]" />
                            </div>
                        </div>
                    )}

                    {/* Slot List Grouped */}
                    <div className="px-4 pb-8 space-y-6">
                        {Object.entries(groupedSlots).map(([groupName, groupSlots]) => (
                            <div key={groupName}>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 px-2">{groupName}</h3>
                                <div className="space-y-2">
                                    {groupSlots.map((slot) => {
                                        const hasValue = !!getNestedValue(currentRecord?.content, slot.id);
                                        return (
                                            <button
                                                key={slot.id}
                                                onClick={() => handleAssignToSlot(slot.id)}
                                                className="w-full bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between active:scale-95 transition-transform hover:border-indigo-300 hover:bg-indigo-50/30"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${hasValue ? 'bg-emerald-50' : 'bg-slate-100'}`}>
                                                        {hasValue ? (
                                                            <Check className="h-4 w-4 text-emerald-600" />
                                                        ) : (
                                                            <ImageIcon className="h-4 w-4 text-slate-400" />
                                                        )}
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-700">{slot.label}</span>
                                                </div>
                                                {hasValue && (
                                                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Substituir</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        );
    }

    return null;
}
