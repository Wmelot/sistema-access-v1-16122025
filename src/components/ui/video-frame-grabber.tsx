import React, { useRef, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Video, Camera, Upload, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface VideoSlot {
    id: string;
    label: string;
    value: string | null;
}

interface VideoFrameGrabberProps {
    open: boolean;
    onClose: () => void;
    slots?: VideoSlot[];
    onCaptureToSlot?: (slotId: string, base64Image: string) => void;
    // Fallback for single capture mode
    onCapture?: (base64Image: string) => void;
}

export function VideoFrameGrabberModal({ open, onClose, slots, onCaptureToSlot, onCapture }: VideoFrameGrabberProps) {
    const [videoSrc, setVideoSrc] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Clean up object URL when closing or unmounting
    useEffect(() => {
        if (!open && videoSrc) {
            URL.revokeObjectURL(videoSrc);
            setVideoSrc(null);
        }
        return () => {
            if (videoSrc) URL.revokeObjectURL(videoSrc);
        };
    }, [open, videoSrc]);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('video/')) {
            const url = URL.createObjectURL(file);
            setVideoSrc(url);
        }
    };

    const skipFrame = (direction: 1 | -1) => {
        if (videoRef.current) {
            videoRef.current.pause();
            // Assume 30 fps
            videoRef.current.currentTime += direction * (1 / 30);
        }
    };

    const extractFrameBase64 = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return null;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.8);
    };

    const captureToGlobal = () => {
        const dataUrl = extractFrameBase64();
        if (dataUrl && onCapture) {
            onCapture(dataUrl);
            onClose();
        }
    };

    const captureToSlot = (slotId: string) => {
        const dataUrl = extractFrameBase64();
        if (dataUrl && onCaptureToSlot) {
            onCaptureToSlot(slotId, dataUrl);
        }
    };

    const hasSlots = slots && slots.length > 0;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className={cn(
                "bg-white border-none rounded-[2rem] shadow-2xl p-0 overflow-y-auto w-[95vw] max-h-[90vh]",
                hasSlots ? "max-w-[95vw] xl:max-w-[90vw] 2xl:max-w-[1600px]" : "max-w-3xl"
            )} showCloseButton={false}>
                <DialogHeader className="p-6 pb-2 border-b border-slate-100 sticky top-0 bg-white z-20">
                    <DialogTitle className="flex items-center gap-2 font-black text-slate-800 uppercase tracking-tight">
                        <Video className="w-5 h-5 text-purple-600" />
                        Laboratório de ExtrAção Dinâmica (Video Frame)
                    </DialogTitle>
                    <DialogDescription className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                        Faça o upload do vídeo da avaliação, deslize até a fase desejada e capture a foto de cada etapa.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 bg-slate-50 flex flex-col lg:flex-row gap-8 items-start min-h-[500px]">

                    {/* VIDEO SECTION */}
                    <div className={cn("flex-1 w-full flex flex-col items-center justify-start max-h-[600px]", hasSlots ? "" : "col-span-1 lg:col-span-2")}>
                        {!videoSrc ? (
                            <div className="flex flex-col items-center justify-center h-[400px] gap-4 w-full">
                                <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full">
                                    <div className="relative group overflow-hidden w-48 h-40 border-2 border-dashed border-purple-200 rounded-3xl bg-purple-50 hover:bg-purple-100/50 hover:border-purple-300 transition-colors shadow-sm flex flex-col items-center justify-center">
                                        <Camera className="w-8 h-8 text-purple-600 mb-2 pointer-events-none" />
                                        <span className="font-black text-purple-700 uppercase tracking-widest text-[11px] text-center px-4 pointer-events-none">Gravar Agora</span>
                                        <span className="text-[9px] text-purple-500 font-bold uppercase mt-1 tracking-widest text-center px-4 pointer-events-none">Abrir Câmera</span>
                                        <input type="file" accept="video/*" capture="environment" className="absolute inset-0 w-full h-full opacity-0 outline-none cursor-pointer z-10 block" title="Gravar Agora" onChange={handleFile} />
                                    </div>

                                    <div className="relative group overflow-hidden w-48 h-40 border-2 border-dashed border-slate-300 rounded-3xl bg-white hover:bg-slate-50 hover:border-slate-400 transition-colors shadow-sm flex flex-col items-center justify-center">
                                        <Upload className="w-8 h-8 text-slate-400 mb-2 pointer-events-none" />
                                        <span className="font-black text-slate-600 uppercase tracking-widest text-[11px] text-center px-4 pointer-events-none">Da Galeria</span>
                                        <span className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-widest text-center px-4 pointer-events-none">Arquivo do Aparelho</span>
                                        <input type="file" accept="video/*" className="absolute inset-0 w-full h-full opacity-0 outline-none cursor-pointer z-10 block" title="Da Galeria" onChange={handleFile} />
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center max-w-xs">
                                    Envie um único vídeo (ex: caminhada inteira) para fatiar todos os frames em sequência. O arquivo ficará apenas localmente para extração.
                                </p>
                            </div>
                        ) : (
                            <div className="w-full flex flex-col items-center gap-4">
                                <video
                                    ref={videoRef}
                                    src={videoSrc}
                                    controls
                                    className="w-full max-h-[500px] bg-black rounded-xl shadow-lg ring-4 ring-slate-900/5 object-contain"
                                    playsInline
                                />
                                <div className="flex gap-4 items-center bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                                    <Button variant="ghost" size="sm" onClick={() => onClose()} className="text-[10px] font-black uppercase text-red-500 hover:bg-red-50 px-4">
                                        Descartar
                                    </Button>
                                    <div className="w-px h-6 bg-slate-200" />
                                    <Button variant="ghost" size="sm" onClick={() => skipFrame(-1)} className="text-xs font-bold uppercase tracking-widest text-slate-600 hover:text-purple-600 hover:bg-purple-50">
                                        <ChevronLeft className="w-4 h-4 mr-1" /> Frame
                                    </Button>
                                    <div className="w-px h-6 bg-slate-200" />
                                    <Button variant="ghost" size="sm" onClick={() => skipFrame(1)} className="text-xs font-bold uppercase tracking-widest text-slate-600 hover:text-purple-600 hover:bg-purple-50">
                                        Frame <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                    {hasSlots && (
                                        <>
                                            <div className="w-px h-6 bg-slate-200" />
                                            <Button size="sm" onClick={() => onClose()} className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase h-8 px-6 rounded-xl shadow-lg shadow-emerald-500/20">
                                                Concluir
                                            </Button>
                                        </>
                                    )}
                                </div>
                                <canvas ref={canvasRef} className="hidden" />
                            </div>
                        )}
                    </div>

                    {/* SLOTS SECTION */}
                    {hasSlots && (
                        <div className="w-full lg:w-[450px] shrink-0 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm h-full max-h-[600px] overflow-y-auto scrollbar-thin">
                            <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-4 text-center">Fases da Marcha</h4>
                            <div className="grid grid-cols-2 gap-4">
                                {slots.map(s => (
                                    <div key={s.id} className="border border-slate-200 rounded-2xl p-3 flex flex-col items-center justify-center gap-2 relative bg-slate-50 transition-all hover:border-purple-200">
                                        <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">{s.label}</span>
                                        {s.value ? (
                                            <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border border-slate-200 group">
                                                <img src={s.value} className="object-cover w-full h-full" alt={s.label} />
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                                    <Button size="sm" onClick={() => captureToSlot(s.id)} className="bg-purple-600 hover:bg-purple-700 text-[9px] uppercase font-black px-2 py-1 h-auto leading-none rounded-lg shadow-lg">
                                                        Substituir<br />Foto
                                                    </Button>
                                                </div>
                                                <div className="absolute bottom-1 right-1 bg-emerald-500 text-white p-0.5 rounded-full shadow-sm">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="w-full aspect-[3/4] bg-white border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center group-hover:border-purple-300 transition-colors">
                                                <Button size="sm" onClick={() => captureToSlot(s.id)} className="bg-white hover:bg-purple-50 text-purple-600 border border-purple-200 shadow-sm text-[9px] uppercase font-black px-2 py-1 h-auto leading-none rounded-lg disabled:opacity-50" disabled={!videoSrc}>
                                                    <Camera className="w-3 h-3 mb-1 mx-auto block" />
                                                    Capturar<br />Aqui
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer removed to move buttons to the center bar */}
            </DialogContent>
        </Dialog>
    );
}
