"use client";

import { useState, useRef, ClipboardEvent } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface PasteUploadZoneProps {
    label: string;
    value?: string | null;
    onChange?: (base64: string | null) => void;
}

export function PasteUploadZone({ label, value, onChange }: PasteUploadZoneProps) {
    const [internalPreview, setInternalPreview] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Controlled vs Uncontrolled logic
    const preview = value !== undefined ? value : internalPreview;

    const handleFile = (file: File) => {
        if (!file.type.startsWith("image/")) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            setInternalPreview(result);
            if (onChange) onChange(result);
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

    return (
        <div className="space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</span>
            <div
                className={cn(
                    "relative flex flex-col items-center justify-center w-full aspect-video rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-100 transition-all cursor-pointer overflow-hidden outline-none ring-offset-2 focus:ring-2 focus:ring-blue-400 group",
                    preview ? "border-solid border-blue-200 bg-white" : ""
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
                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <button
                                onClick={clearImage}
                                className="p-1.5 bg-white/90 text-red-500 rounded-lg shadow-sm hover:bg-red-50"
                                title="Remover"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center text-center text-slate-400 p-4 select-none pointer-events-none">
                        <Upload className="w-6 h-6 mb-2 opacity-50" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">Colar / Arrastar</p>
                    </div>
                )}
            </div>
        </div>
    );
}
