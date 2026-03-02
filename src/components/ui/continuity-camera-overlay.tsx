import React, { useRef } from 'react';

export function ContinuityCameraOverlay({ onCapture, children }: { onCapture: (f: File) => void, children?: React.ReactNode }) {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const imgs = target.getElementsByTagName('img');
        if (imgs.length > 0) {
            const imgSrc = imgs[0].src;
            fetch(imgSrc)
                .then(r => r.blob())
                .then(blob => {
                    const file = new File([blob], "iphone-capture.jpg", { type: "image/jpeg" });
                    onCapture(file);
                })
                .catch(err => console.error("Continuity Camera Error:", err))
                .finally(() => { target.innerHTML = ""; });
        } else {
            target.innerHTML = "";
        }
    };

    return (
        <div className="relative w-full h-full group">
            {/* Invisível contentEditable só para puxar o Menu do Safari (Import from iPhone) com Botão Direito */}
            <div 
                contentEditable 
                suppressContentEditableWarning
                title="Clique com o Direito p/ Câmera do iPhone"
                className="absolute inset-0 z-20 text-transparent bg-transparent outline-none caret-transparent overflow-hidden cursor-context-menu"
                onInput={handleInput}
                onClick={() => inputRef.current?.click()}
            />
            {/* Input normal para clique esquerdo (Finder) */}
            <input 
                ref={inputRef}
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => onCapture(e.target.files?.[0] as File)} 
            />
            
            <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
                {children}
            </div>
        </div>
    );
}
