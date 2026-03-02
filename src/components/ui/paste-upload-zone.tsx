"use client";

import { useState, useRef, ClipboardEvent } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface PasteUploadZoneProps {
    label?: string;
    value?: string | null;
    onChange?: (base64: string | null) => void;
    height?: number; // kept for legacy compatibility if used elsewhere, but className is preferred
    className?: string; // Add className
    capture?: "user" | "environment" | boolean;
    onAnalyze?: () => void; // Added for integration with ImageCimetografo
    onGrabFrame?: () => void; // Integrate video frame extraction
}

export function PasteUploadZone({ label, value, onChange, className, capture, onAnalyze, onGrabFrame }: PasteUploadZoneProps) {
    const [internalPreview, setInternalPreview] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Controlled vs Uncontrolled logic
    const preview = value !== undefined ? value : internalPreview;

    const handleFile = (file: File) => {
        if (!file.type.startsWith("image/")) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const raw = reader.result as string;

            // Image Compression Logic
            const img = new (window as any).Image();
            img.src = raw;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Max resolution 1280px
                const MAX_SIZE = 1280;
                if (width > height) {
                    if (width > MAX_SIZE) {
                        height *= MAX_SIZE / width;
                        width = MAX_SIZE;
                    }
                } else {
                    if (height > MAX_SIZE) {
                        width *= MAX_SIZE / height;
                        height = MAX_SIZE;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                // Export as compressed JPEG
                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);

                setInternalPreview(compressedBase64);
                if (onChange) onChange(compressedBase64);
            };
        };
        reader.readAsDataURL(file);
    };

    const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
                const file = items[i].getAsFile();
                if (file) handleFile(file);
            }
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
    };

    const clearImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setInternalPreview(null);
        if (inputRef.current) inputRef.current.value = "";
        if (onChange) onChange(null);
    };

    const triggerAnalyze = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onAnalyze) onAnalyze();
    };

    const triggerGrabFrame = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onGrabFrame) onGrabFrame();
    };

    return (
        <div className="space-y-2 relative group w-full">
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</span>
                {!preview && onGrabFrame && (
                    <button
                        onClick={triggerGrabFrame}
                        className="text-[10px] bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors px-2 py-0.5 rounded uppercase font-black tracking-widest flex items-center gap-1 opacity-0 group-hover:opacity-100"
                        title="Extrair Frame de Vídeo"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                        Vídeo
                    </button>
                )}
            </div>

            <div
                className={cn(
                    "relative flex flex-col items-center justify-center w-full aspect-video rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-100 transition-all cursor-pointer overflow-hidden outline-none ring-offset-2 focus:ring-2 focus:ring-blue-400 group/zone",
                    preview ? "border-solid border-blue-200 bg-white" : "",
                    className
                )}
                onPaste={handlePaste}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => inputRef.current?.click()}
                tabIndex={0}
            >
                <input
                    type="file"
                    className="hidden"
                    ref={inputRef}
                    accept="image/*"
                    capture={capture}
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />

                {/* ContentEditable Layer for Mobile Paste */}
                <div
                    contentEditable
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onPaste={(e) => { e.preventDefault(); handlePaste(e as any); }}
                    onInput={(e) => {
                        const img = (e.currentTarget as HTMLDivElement).querySelector('img');
                        if (img && img.src) {
                            fetch(img.src).then(r => r.blob()).then(b => handleFile(new File([b], "paste.jpg", { type: "image/jpeg" })));
                            e.currentTarget.innerHTML = "";
                        }
                    }}
                    style={{ WebkitUserSelect: 'text', userSelect: 'text' }}
                />

                {preview ? (
                    <>
                        <Image src={preview} alt="Preview" fill className="object-contain p-1" />
                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover/zone:opacity-100 transition-opacity z-20">
                            {onAnalyze && (
                                <button
                                    onClick={triggerAnalyze}
                                    className="p-1.5 bg-blue-100 text-blue-600 rounded-lg shadow-sm hover:bg-blue-200 transition-colors"
                                    title="Analisar Imagem"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                                </button>
                            )}
                            <button
                                onClick={clearImage}
                                className="p-1.5 bg-white/90 text-red-500 rounded-lg shadow-sm hover:bg-red-50 transition-colors"
                                title="Remover"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center text-center text-slate-400 p-4 select-none pointer-events-none">
                        <Upload className="w-6 h-6 mb-2 opacity-50" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-tight">Colar / Arrastar<br /><span>ou clique p/ iPhone</span></p>
                    </div>
                )}
            </div>
        </div>
    );
}
