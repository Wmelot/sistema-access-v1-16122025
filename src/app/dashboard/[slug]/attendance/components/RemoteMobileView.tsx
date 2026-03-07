"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Camera, ArrowLeft, Video, Save, Smartphone, CheckCircle, Zap, X, ChevronLeft, ChevronRight, Image as ImageIcon, Check, Lock, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { saveAttendanceRecord } from "@/actions/attendance";

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
    { id: 'tests.photos.anterior', label: 'Postura Anterior', group: 'Postura' },
    { id: 'tests.photos.posterior', label: 'Postura Posterior', group: 'Postura' },
    { id: 'tests.photos.left', label: 'Perfil Esquerdo', group: 'Postura' },
    { id: 'tests.photos.right', label: 'Perfil Direito', group: 'Postura' },
    { id: 'tests.gait_photos.left.initial', label: 'RC Esquerdo', group: 'Fases da Marcha' },
    { id: 'tests.gait_photos.left.mid', label: 'AM Esquerdo', group: 'Fases da Marcha' },
    { id: 'tests.gait_photos.left.terminal', label: 'FI Esquerdo', group: 'Fases da Marcha' },
    { id: 'tests.gait_photos.right.initial', label: 'RC Direito', group: 'Fases da Marcha' },
    { id: 'tests.gait_photos.right.mid', label: 'AM Direito', group: 'Fases da Marcha' },
    { id: 'tests.gait_photos.right.terminal', label: 'FI Direito', group: 'Fases da Marcha' },
    { id: 'tests.single_squat.photo_left', label: 'Agachamento Unipodal Esq', group: 'Funcional' },
    { id: 'tests.single_squat.photo_right', label: 'Agachamento Unipodal Dir', group: 'Funcional' },
];

const GONIO_SLOTS: MediaSlot[] = [
    { id: 'tests.lunge.left', label: 'Lunge Esquerdo', group: 'Goniometria' },
    { id: 'tests.lunge.right', label: 'Lunge Direito', group: 'Goniometria' },
    { id: 'tests.thomas.left', label: 'Thomas Esquerdo', group: 'Goniometria' },
    { id: 'tests.thomas.right', label: 'Thomas Direito', group: 'Goniometria' },
    { id: 'tests.slr.left', label: 'Isquiosurais Esquerdo', group: 'Goniometria' },
    { id: 'tests.slr.right', label: 'Isquiosurais Direito', group: 'Goniometria' },
    { id: 'tests.ventral.rotation.left', label: 'Rigidez Rotadores Esquerdo', group: 'Goniometria' },
    { id: 'tests.ventral.rotation.right', label: 'Rigidez Rotadores Direito', group: 'Goniometria' },
    { id: 'tests.ventral.craig.left', label: 'Craig Esquerdo', group: 'Goniometria' },
    { id: 'tests.ventral.craig.right', label: 'Craig Direito', group: 'Goniometria' },
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

    // Palmilha 5: Remove Postura slots per user request
    if (tid === 'palmilha-5' || tid === 'e0000000-0000-0000-0000-000000000005' || tid.includes('palmilha')) {
        return PALMILHA5_SLOTS.filter(s => s.group !== 'Postura');
    }

    if (tid === 'pbe-5' || tid === 'e0000000-0000-0000-0000-000000000010' || tid.includes('pbe')) {
        return PBE5_SLOTS;
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
    const [savingSlotId, setSavingSlotId] = useState<string | null>(null);

    // View states: 'home' | 'video-review' | 'pick-slot' | 'gonio' | 'gonio-prep'
    const [view, setView] = useState<'home' | 'video-review' | 'pick-slot' | 'gonio' | 'gonio-prep'>('home');

    // Captured media or values
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
    const [videoSrc, setVideoSrc] = useState<string | null>(null);
    const [currentFrame, setCurrentFrame] = useState<string | null>(null);
    const [capturedGonioValue, setCapturedGonioValue] = useState<number | null>(null);

    const [gonioAngle, setGonioAngle] = useState(0);
    const [isGonioFrozen, setIsGonioFrozen] = useState(false);
    const [showGonioSign, setShowGonioSign] = useState(false);
    const gonioReferenceRef = useRef(0);
    const gonioSmoothRef = useRef(0);
    const videoRef = useRef<HTMLVideoElement>(null);
    const lastVideoTimeRef = useRef(0);
    const frameIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    // Use the record's template_id from DB as primary (works on both desktop and mobile browsers)
    // Fall back to the prop templateId (only set on desktop's local state)
    const effectiveTemplateId = currentRecord?.template_id || templateId;
    const formName = getFormName(effectiveTemplateId);
    const slots = getSlotsForTemplate(effectiveTemplateId);
    const patientFirstName = patient?.name?.split(' ')[0] || 'Paciente';

    const handleInternalSave = async () => {
        // Obsolete global save
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
            lastVideoTimeRef.current = videoRef.current.currentTime;
        }
    };

    const startContinuousSkip = (direction: 1 | -1) => {
        if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
        skipFrame(direction);
        frameIntervalRef.current = setInterval(() => skipFrame(direction), 100);
    };

    const stopContinuousSkip = () => {
        if (frameIntervalRef.current) {
            clearInterval(frameIntervalRef.current);
            frameIntervalRef.current = null;
        }
    };

    // Restore video time after pick-slot
    useEffect(() => {
        if (view === 'video-review' && videoRef.current && lastVideoTimeRef.current > 0) {
            videoRef.current.currentTime = lastVideoTimeRef.current;
        }
    }, [view]);

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

    // ── Goniometer Engine ──
    const startGonio = async () => {
        // Both orientation and motion need permission on iOS
        if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
            const res = await (DeviceMotionEvent as any).requestPermission();
            if (res !== 'granted') {
                toast.error("Permissão de sensor negada.");
                return;
            }
        }
        setView('gonio-prep');
    };

    React.useEffect(() => {
        if (view !== 'gonio' || isGonioFrozen) return;

        const handleMotion = (e: DeviceMotionEvent) => {
            const acc = e.accelerationIncludingGravity;
            if (!acc) return;
            const x = acc.x || 0;
            const y = acc.y || 0;

            // Atan2(x, -y) coloca o 0 na vertical e movimento positivo p/ direita
            const raw = Math.atan2(x, -y) * (180 / Math.PI);
            let relative = raw - gonioReferenceRef.current;
            if (relative > 180) relative -= 360;
            if (relative < -180) relative += 360;

            // Smooth only for display
            gonioSmoothRef.current = (gonioSmoothRef.current * 0.9) + (relative * 0.1);
            setGonioAngle(relative);
        };

        window.addEventListener('devicemotion', handleMotion);
        return () => window.removeEventListener('devicemotion', handleMotion);
    }, [view, isGonioFrozen]);

    const handleGonioSend = () => {
        setCapturedGonioValue(gonioAngle);
        setView('pick-slot');
    };

    const handleGrabFrame = () => {
        if (videoRef.current) {
            lastVideoTimeRef.current = videoRef.current.currentTime;
        }
        const frame = extractCurrentFrame();
        if (frame) {
            setCurrentFrame(frame);
            setView('pick-slot');
        }
    };

    // ── Assign to Slot ──
    const handleAssignToSlot = async (slotId: string) => {
        const imageData = capturedPhoto || currentFrame;
        const numericData = capturedGonioValue;

        setSavingSlotId(slotId);
        try {
            if (imageData) {
                onUpdate(slotId, imageData);
            } else if (numericData !== null) {
                let finalVal = Number(numericData.toFixed(1));

                // Fórmulas Especiais
                if (slotId.includes('tests.thomas')) {
                    // Thomas: |Leitura| - 90 (permite negativos conforme solicitado e mantém simetria entre lados)
                    finalVal = Number((Math.abs(numericData) - 90).toFixed(1));
                } else if (!showGonioSign) {
                    // Se não for Thomas e o sinal estiver desligado, registra o absoluto
                    finalVal = Math.abs(finalVal);
                }

                onUpdate(slotId, finalVal);
            }
            await onSave();
        } catch (err) {
            toast.error("Erro ao salvar.");
        } finally {
            setSavingSlotId(null);
        }

        // Reset captured state
        setCapturedPhoto(null);
        setCurrentFrame(null);
        setCapturedGonioValue(null);

        if (numericData !== null) {
            setView('gonio');
            setIsGonioFrozen(false);
        } else if (videoSrc) {
            setView('video-review');
        } else {
            setView('home');
        }
    };

    // ── Group slots by category ──
    const effectiveSlots = capturedGonioValue !== null ? GONIO_SLOTS : slots;

    const groupedSlots = effectiveSlots.reduce<Record<string, MediaSlot[]>>((acc, slot) => {
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
            <div className="fixed inset-0 h-[100dvh] bg-gradient-to-b from-slate-900 to-slate-950 z-[100] flex flex-col font-sans overflow-hidden">
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
                <div className="flex-1 flex flex-col items-center justify-center px-8 -mt-12 gap-12">
                    {/* Patient Name */}
                    <div className="text-center">
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-2">Paciente</p>
                        <h1 className="text-4xl font-black text-white tracking-tight">{patientFirstName}</h1>
                        <div className="mt-3 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full">
                            <div className="h-1.5 w-1.5 bg-indigo-400 rounded-full" />
                            <span className="text-xs font-black text-indigo-300 uppercase tracking-widest">{formName}</span>
                        </div>
                    </div>

                    <div className="flex gap-8">
                        {/* Camera Button */}
                        <div className="flex flex-col items-center gap-4">
                            <button
                                onClick={() => cameraInputRef.current?.click()}
                                className="relative w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-[0_0_60px_rgba(255,255,255,0.15)] active:scale-90 transition-transform"
                            >
                                <Camera className="h-8 w-8 text-slate-900" />
                            </button>
                            <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em]">Câmera</span>
                        </div>

                        {/* Goniometer Button */}
                        <div className="flex flex-col items-center gap-4">
                            <button
                                onClick={startGonio}
                                className="relative w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center shadow-[0_0_60px_rgba(79,70,229,0.3)] active:scale-90 transition-transform border-4 border-white/20"
                            >
                                <Zap className="h-8 w-8 text-white" />
                            </button>
                            <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em]">Inclinômetro</span>
                        </div>
                    </div>
                </div>

                {/* Footer hint */}
                <footer className="px-8 pb-10 text-center">
                    <p className="text-[10px] text-white/30 font-bold leading-relaxed max-w-xs mx-auto uppercase tracking-widest">
                        Modo Remoto Axiom — {new Date().getFullYear()}
                    </p>
                </footer>
            </div>
        );
    }

    // ══════════════════════════════════════════
    // VIEW: GONIO PREP (Preparation steps)
    // ══════════════════════════════════════════
    if (view === 'gonio-prep') {
        return (
            <div className="fixed inset-0 h-[100dvh] bg-slate-950 z-[100] flex flex-col font-sans overflow-hidden pb-safe-bottom">
                <header className="px-6 pt-safe-top py-6">
                    <Button variant="ghost" size="icon" onClick={() => setView('home')} className="rounded-full h-10 w-10 bg-white/10 text-white hover:bg-white/20">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </header>

                <div className="flex-1 flex flex-col items-center justify-center px-10 gap-12 -mt-10 text-center">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-3xl bg-white/5 flex items-center justify-center animate-pulse border border-white/10">
                            <RotateCcw className="h-10 w-10 text-indigo-400" />
                        </div>
                        <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center border-4 border-slate-950">
                            <Lock className="h-3 w-3 text-white" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-4xl font-black text-white tracking-tight uppercase">Preparação</h2>
                        <p className="text-xs font-bold text-white/40 uppercase tracking-[0.2em]">Siga os passos abaixo</p>
                    </div>

                    <div className="w-full space-y-4">
                        {[
                            { step: 1, text: "Abra a Central de Controle (arraste do topo direito)" },
                            { step: 2, text: "Ative o Bloqueio de Orientação Vertical (ícone de cadeado)" },
                            { step: 3, text: "Isso garante que o sensor não se perca durante as medidas" }
                        ].map((item) => (
                            <div key={item.step} className="flex gap-4 p-5 rounded-3xl bg-white/5 border border-white/5 text-left items-start">
                                <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                                    <span className="text-xs font-black text-white">{item.step}</span>
                                </div>
                                <p className="text-xs font-bold text-white/80 leading-relaxed uppercase tracking-tight">{item.text}</p>
                            </div>
                        ))}
                    </div>

                    <Button
                        onClick={() => setView('gonio')}
                        className="w-full h-20 rounded-3xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-base uppercase tracking-widest shadow-2xl mt-4"
                    >
                        Tudo Pronto
                    </Button>
                </div>
            </div>
        );
    }
    if (view === 'gonio') {
        const visualAngle = isGonioFrozen ? capturedGonioValue || gonioAngle : gonioAngle;
        const absAngle = Math.abs(visualAngle);
        const circumference = 2 * Math.PI * 90;
        const dashLength = circumference * (absAngle / 360);

        return (
            <div className="fixed inset-0 h-[100dvh] bg-slate-950 z-[100] flex flex-col font-sans overflow-hidden pb-safe-bottom">
                <header className="px-6 pt-safe-top py-6 flex items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={() => setView('home')} className="rounded-full h-10 w-10 bg-white/10 text-white hover:bg-white/20">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="px-4 py-1 rounded-full bg-white/5 border border-white/10">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Goniometria Digital</span>
                    </div>
                    <div className="w-10" />
                </header>

                <div className="flex-1 flex flex-col items-center justify-center gap-12 -mt-12">
                    {/* Circle Gauge - Size 90x90 footprint */}
                    <div className="relative w-[340px] h-[340px] flex items-center justify-center">
                        {/* Interactive Area for Freezing */}
                        <div
                            className="absolute inset-0 z-20 cursor-pointer active:scale-95 transition-transform rounded-full"
                            onClick={() => setIsGonioFrozen(!isGonioFrozen)}
                        />

                        <svg viewBox="0 0 340 340" className="w-full h-full transform -rotate-90">
                            {/* Background Circle */}
                            <circle cx="170" cy="170" r="130" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                            {/* Progress Bar (Solid Arc) */}
                            <circle
                                cx="170" cy="170" r="130" fill="none"
                                stroke="#4f46e5" strokeWidth="24"
                                strokeDasharray={(2 * Math.PI * 130 * (absAngle / 360)) + " " + (2 * Math.PI * 130)}
                                style={{
                                    transformOrigin: 'center',
                                    // SINCRO PERFEITA: Sem offsets de 90deg extras.
                                    // Se inclinar p/ direita (pos), inicia no Topo (0).
                                    // Se inclinar p/ esquerda (neg), rotaciona o início para o valor negativo.
                                    transform: visualAngle >= 0 ? 'rotate(0deg)' : `rotate(${visualAngle}deg)`,
                                    transition: 'none'
                                }}
                            />
                        </svg>

                        {/* Value Display - Font size preserved */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 pointer-events-none">
                            <span className="text-8xl font-black tracking-tighter transition-opacity" style={{ opacity: isGonioFrozen ? 0.6 : 1 }}>
                                {showGonioSign ? visualAngle.toFixed(1) : absAngle.toFixed(1)}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mt-2">Graus</span>
                        </div>

                        {/* Needle - NO TRANSITION (Instant) */}
                        <div
                            className="absolute inset-0 flex items-center justify-center pointer-events-none"
                            style={{
                                transform: `rotate(${visualAngle}deg)`
                            }}
                        >
                            <div className="w-2 h-48 -mt-48 bg-indigo-400 rounded-full relative shadow-[0_0_25px_rgba(129,140,248,0.7)]">
                                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-5 h-5 bg-white rounded-full blur-[1px] shadow-lg" />
                            </div>
                        </div>

                        {/* Signal Toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); setShowGonioSign(!showGonioSign); }}
                            className={cn(
                                "absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-30 h-14 w-14 rounded-2xl border border-white/10 shadow-2xl",
                                showGonioSign ? "bg-white text-slate-950" : "bg-white/5 text-white"
                            )}
                        >
                            <span className="font-black text-sm">+/-</span>
                        </Button>
                    </div>

                    <div className="flex gap-4 px-8 w-full z-30">
                        <Button
                            variant="outline"
                            onClick={(e) => {
                                e.stopPropagation();
                                gonioReferenceRef.current += gonioAngle;
                                setGonioAngle(0);
                                toast.info("Referência Zerada", { duration: 800 });
                            }}
                            className="flex-1 h-20 rounded-3xl bg-white/10 border-2 border-white/20 text-white font-black uppercase tracking-widest hover:bg-white/20 active:bg-indigo-600 focus:outline-none focus:ring-0 active:scale-95 transition-all"
                        >
                            Zerar
                        </Button>
                        <Button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (isGonioFrozen) {
                                    handleGonioSend();
                                } else {
                                    setIsGonioFrozen(true);
                                }
                            }}
                            className={cn(
                                "flex-1 h-20 rounded-3xl font-black uppercase tracking-widest shadow-2xl gap-2",
                                isGonioFrozen ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-white text-slate-950"
                            )}
                        >
                            {isGonioFrozen ? <Save className="w-6 h-6" /> : null}
                            {isGonioFrozen ? "Enviar" : "Congelar"}
                        </Button>
                    </div>
                </div>

                <footer className="px-12 pb-10">
                    <p className="text-[9px] text-white/20 font-bold text-center uppercase tracking-widest leading-relaxed">
                        Mantenha o celular estável no plano de medição. Use o botão Congelar para travar o valor antes de enviar.
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
                            onPointerDown={() => startContinuousSkip(-1)}
                            onPointerUp={stopContinuousSkip}
                            onPointerLeave={stopContinuousSkip}
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
                            Extrair Frame
                        </Button>

                        <Button
                            variant="ghost"
                            onPointerDown={() => startContinuousSkip(1)}
                            onPointerUp={stopContinuousSkip}
                            onPointerLeave={stopContinuousSkip}
                            className="h-14 px-6 rounded-2xl bg-white/10 text-white hover:bg-white/20 font-black text-xs uppercase tracking-widest gap-2"
                        >
                            Frame
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </div>

                    <Button
                        variant="ghost"
                        onClick={() => {
                            if (videoSrc) URL.revokeObjectURL(videoSrc);
                            setVideoSrc(null);
                            setView('home');
                        }}
                        className="w-full text-white/40 font-black uppercase text-[10px] tracking-[0.2em]"
                    >
                        Encerrar Análise do Vídeo
                    </Button>
                </div>
            </div>
        );
    }

    // ══════════════════════════════════════════
    // VIEW: PICK SLOT (Choose where this image goes)
    // ══════════════════════════════════════════
    if (view === 'pick-slot') {
        const imageToAssign = capturedPhoto || currentFrame;
        const gonioValue = capturedGonioValue;

        return (
            <div className="fixed inset-0 h-[100dvh] bg-slate-50 z-[100] flex flex-col font-sans overflow-hidden pb-safe-bottom">
                {/* Header */}
                <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm shrink-0 pt-safe-top">
                    <Button variant="ghost" size="icon" onClick={() => {
                        setCapturedPhoto(null);
                        setCurrentFrame(null);
                        setView(videoSrc ? 'video-review' : 'home');
                    }} className="rounded-full h-10 w-10 bg-slate-100">
                        <ArrowLeft className="h-5 w-5 text-slate-600" />
                    </Button>
                    <div className="text-center">
                        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Paciente</h2>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tighter">{patientFirstName}</h3>
                    </div>
                    <div className="w-10" />
                </header>

                <main className="flex-1 overflow-y-auto bg-slate-50/50">
                    {/* Preview */}
                    {imageToAssign && (
                        <div className="p-4">
                            <div className="rounded-3xl overflow-hidden border-4 border-white shadow-2xl max-h-[220px]">
                                <img src={imageToAssign} alt="Captura" className="w-full h-full object-cover max-h-[220px]" />
                            </div>
                        </div>
                    )}

                    {gonioValue !== null && (
                        <div className="p-8 bg-slate-900 mx-4 mt-4 rounded-3xl flex flex-col items-center justify-center border border-white/10 shadow-2xl overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-500" />
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Medida Capturada</span>
                            <span className="text-7xl font-black text-white tracking-tighter tabular-nums">
                                {showGonioSign ? gonioValue.toFixed(1) : Math.abs(gonioValue).toFixed(1)}º
                            </span>
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
                                                disabled={savingSlotId !== null}
                                                onClick={() => handleAssignToSlot(slot.id)}
                                                className={cn(
                                                    "w-full bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between active:scale-95 transition-all hover:border-indigo-300 hover:bg-indigo-50/10",
                                                    hasValue && "border-emerald-200 bg-emerald-50/10",
                                                    savingSlotId === slot.id && "ring-2 ring-indigo-500 border-indigo-500 shadow-indigo-100"
                                                )}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center shadow-sm", hasValue ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400")}>
                                                        {savingSlotId === slot.id ? (
                                                            <div className="h-5 w-5 border-2 border-indigo-600 border-t-transparent animate-spin rounded-full" />
                                                        ) : (
                                                            hasValue ? <Check className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />
                                                        )}
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{slot.label}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{hasValue ? 'Preenchido' : 'Disponível'}</p>
                                                    </div>
                                                </div>
                                                {savingSlotId === slot.id ? (
                                                    <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Sincronizando...</span>
                                                ) : (
                                                    <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100/50">
                                                        <ChevronRight className="h-5 w-5 text-slate-300" />
                                                    </div>
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
