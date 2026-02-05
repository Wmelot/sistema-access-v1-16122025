"use client";

import { useEffect, useState } from "react";

export const QuantumLoader = ({ size = "45", speed = "1.75", color = "black", className }: { size?: string, speed?: string, color?: string, className?: string }) => {
    const [isMounted, setIsMounted] = useState(false);

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

    if (!isMounted) return null;

    // @ts-ignore
    return <l-quantum size={size} speed={speed} color={color} class={className}></l-quantum>;
};
