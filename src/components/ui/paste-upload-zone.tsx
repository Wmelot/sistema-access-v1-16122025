"use client";

import { useState, useRef, ClipboardEvent } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface PasteUploadZoneProps {
    label: string;
    onImageChange?: (file: File | null) => void;
}

export function PasteUploadZone({ label, onImageChange }: PasteUploadZoneProps) {
    const [preview, setPreview] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = (file: File) => {
        if (!file.type.startsWith("image/")) return;
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result as string);
        reader.readAsDataURL(file);
        if (onImageChange) onImageChange(file);
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
        setPreview(null);
        if (inputRef.current) inputRef.current.value = "";
        if (onImageChange) onImageChange(null);
    };

    return (
        <div className="space-y-2">
            <span className="text-sm font-medium">{label}</span>
            <div
                className={cn(
                    "relative flex flex-col items-center justify-center w-full h-48 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition cursor-pointer overflow-hidden outline-none ring-offset-2 focus:ring-2 focus:ring-slate-400",
                    preview ? "border-solid border-green-500" : ""
                )}
                onPaste={handlePaste}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => inputRef.current?.click()}
                tabIndex={0} // Permite focar para colar
            >
                <input
                    type="file"
                    className="hidden"
                    ref={inputRef}
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />

                {preview ? (
                    <>
                        <Image src={preview} alt="Preview" fill className="object-contain p-2" />
                        <button
                            onClick={clearImage}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 z-10 shadow-md transition-transform hover:scale-110"
                            title="Remover Imagem"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col items-center text-center text-gray-500 p-4 select-none">
                        <Upload className="w-8 h-8 mb-2 text-gray-400" />
                        <p className="text-sm font-semibold text-gray-700">Clique ou Arraste</p>
                        <p className="text-xs mt-1 text-gray-500">ou clique aqui e pressione <kbd className="font-sans font-bold border border-gray-300 bg-white px-1 rounded text-[10px]">Ctrl+V</kbd> para colar</p>
                    </div>
                )}
            </div>
        </div>
    );
}
