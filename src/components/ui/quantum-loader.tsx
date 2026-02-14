"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface QuantumLoaderProps {
    size?: string;
    speed?: string;
    color?: string;
    className?: string;
    text?: string;
    messages?: string[];
    interval?: number;
}

export const QuantumLoader = ({
    size = "45",
    speed = "1.75",
    color = "black",
    className,
    text,
    messages = [
        "Carregando informações...",
        "Sincronizando dados...",
        "Preparando ambiente...",
        "Quase pronto...",
        "Finalizando processamento..."
    ],
    interval = 3000
}: QuantumLoaderProps) => {
    const [isMounted, setIsMounted] = useState(false);
    const [currentMsgIdx, setCurrentMsgIdx] = useState(0);

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
        if (messages && messages.length > 0) {
            const timer = setInterval(() => {
                setCurrentMsgIdx((prev) => (prev + 1) % messages.length);
            }, interval);
            return () => clearInterval(timer);
        }
    }, [messages, interval]);

    if (!isMounted) return null;

    const displayMessage = messages && messages.length > 0 ? messages[currentMsgIdx] : text;

    return (
        <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
            {/* @ts-ignore */}
            <l-quantum size={size} speed={speed} color={color}></l-quantum>
            {displayMessage && (
                <p className="text-sm font-bold text-slate-600 animate-pulse text-center max-w-[250px] leading-relaxed">
                    {displayMessage}
                </p>
            )}
        </div>
    );
};
