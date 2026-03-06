"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export const DEFAULT_QUANTUM_MESSAGES = [
    "Iniciando conexão segura...",
    "Validando acesso ao banco...",
    "Buscando dados da clínica...",
    "Sincronizando protocolos...",
    "Otimizando interface clínica...",
    "Preparando prontuários...",
    "Finalizando ambiente..."
];

interface QuantumLoaderProps {
    size?: string;
    speed?: string;
    color?: string;
    className?: string;
    title?: string;
    messages?: string[];
    defaultMessages?: boolean;
    interval?: number;
    textColor?: string;
}

export const QuantumLoader = ({
    size = "45",
    speed = "1.75",
    color = "black",
    className,
    title,
    messages = [], // Default to empty array
    defaultMessages = false,
    interval = 2500,
    textColor
}: QuantumLoaderProps) => {
    const [isMounted, setIsMounted] = useState(false);
    const [currentMsgIdx, setCurrentMsgIdx] = useState(0);

    const actualMessages = (messages && messages.length > 0) ? messages : (defaultMessages ? DEFAULT_QUANTUM_MESSAGES : []);

    useEffect(() => {
        async function getLoader() {
            try {
                // @ts-ignore
                const { quantum } = await import('ldrs');
                quantum.register();
                setIsMounted(true);
            } catch (e) {
                console.error("Failed to load quantum loader", e);
            }
        }
        getLoader();
    }, []);

    useEffect(() => {
        if (actualMessages && actualMessages.length > 0) {
            const timer = setInterval(() => {
                setCurrentMsgIdx((prev) => (prev + 1) % actualMessages.length);
            }, interval);
            return () => clearInterval(timer);
        }
    }, [actualMessages, interval]);

    if (!isMounted) return null;

    const displayMessage = actualMessages && actualMessages.length > 0 ? actualMessages[currentMsgIdx] : null;
    const hasText = title || displayMessage;

    return (
        <div
            className={cn("flex items-center justify-center shrink-0 transition-all duration-300", hasText ? "flex-col gap-6" : "gap-0", className)}
            style={!hasText ? { width: `${size}px`, height: `${size}px` } : {}}
        >
            {/* @ts-ignore */}
            <l-quantum size={size} speed={speed} color={color}></l-quantum>

            {hasText && (
                <div className="flex flex-col items-center gap-1.5 min-h-[40px]">
                    {title && (
                        <p
                            className={cn("text-[10px] font-black uppercase tracking-[0.3em] mb-1 text-center", !textColor && color === 'white' ? "text-white/40" : "text-slate-400")}
                            style={textColor ? { color: textColor } : {}}
                        >
                            {title}
                        </p>
                    )}
                    {displayMessage && (
                        <p
                            className={cn("text-xs font-semibold italic opacity-80 transition-all duration-500 text-center max-w-[280px]", !textColor && color === 'white' ? "text-white" : "text-slate-600")}
                            style={textColor ? { color: textColor } : {}}
                        >
                            {displayMessage}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};
