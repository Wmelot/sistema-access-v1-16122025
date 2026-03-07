"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { usePathname, useSearchParams } from "next/navigation";

// Dynamically load QuantumLoader only on client side to avoid SSR/Prerender issues
const QuantumLoader = dynamic(() => import('@/components/ui/quantum-loader').then(mod => ({ default: mod.QuantumLoader })), {
    ssr: false,
    loading: () => <div className="w-[60px] h-[60px]" /> // Just a spacer to keep layout stable
});

// Import types if needed (none currently used from here)

interface GlobalLoaderContextType {
    setIsLoading: (loading: boolean) => void;
    showLoading: (message?: string) => void;
    showDiscrete: (id?: string) => void;
    hideLoading: () => void;
    isLoading: boolean;
    isDiscrete: boolean;
    activeDiscreteId: string | null;
}

const GlobalLoaderContext = createContext<GlobalLoaderContextType | undefined>(undefined);

export const useGlobalLoader = () => {
    const context = useContext(GlobalLoaderContext);
    if (!context) {
        throw new Error("useGlobalLoader must be used within a GlobalLoaderProvider");
    }
    return context;
};

// Component to handle route changes causing loader to hide
const RouteChangeHandler = () => {
    const { hideLoading, isLoading } = useGlobalLoader();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        // When route changes, we want to hide the loader almost immediately
        // as the new page segment has already started rendering.
        // A small delay (300ms) ensures the transition feels smooth.
        const timer = setTimeout(() => {
            hideLoading();
        }, 300);

        return () => clearTimeout(timer);
    }, [pathname, searchParams, hideLoading]);

    return null;
};

export const GlobalLoaderProvider = ({ children }: { children: React.ReactNode }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isDiscrete, setIsDiscrete] = useState(false);
    const [activeDiscreteId, setActiveDiscreteId] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState("PROCESSANDO...");
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.body.style.overflow = isLoading ? "hidden" : "unset";
            // [NEW] Hide cursor if discrete loading is active
            if (isDiscrete && !isLoading) {
                document.body.style.cursor = "none";
            } else {
                document.body.style.cursor = "default";
            }
        }
    }, [isLoading, isDiscrete]);

    const hideLoading = useCallback(() => {
        setIsLoading(false);
        setIsDiscrete(false);
        setActiveDiscreteId(null);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const showLoading = useCallback((message: string = "PROCESSANDO...") => {
        // If already showing for the SAME message, ignore to avoid resetting timeouts unnecessarily
        setLoadingMessage(message.toUpperCase());
        setIsLoading(true);

        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        // Safety timeout: Auto-dismiss after 30 seconds if navigation or action stalls.
        // Increased from 8s to handle slower database queries or reports without giving up.
        timeoutRef.current = setTimeout(() => {
            setIsLoading(false);
            timeoutRef.current = null;
        }, 30000);
    }, []);

    const showDiscrete = useCallback((id: string = 'global') => {
        if (isLoading) return; // Full loader takes priority
        setIsDiscrete(true);
        setActiveDiscreteId(id);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        // Safety timeout for discrete (max 10s)
        timeoutRef.current = setTimeout(() => {
            setIsDiscrete(false);
            setActiveDiscreteId(null);
            timeoutRef.current = null;
        }, 10000);
    }, [isLoading]);

    // [NEW] Mouse Follower for Discrete Loading
    const [mousePos, setMousePos] = useState({ x: 0, y: 0, visible: false });
    useEffect(() => {
        if (!isDiscrete) {
            setMousePos(prev => ({ ...prev, visible: false }));
            return;
        }
        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY, visible: true });
        };
        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [isDiscrete]);

    return (
        <GlobalLoaderContext.Provider value={{ setIsLoading, showLoading, showDiscrete, hideLoading, isLoading, isDiscrete, activeDiscreteId }}>
            {/* Discrete Cursor Follower - Quantum Particles */}
            {isDiscrete && !isLoading && mousePos.visible && (
                <div
                    className="fixed pointer-events-none z-[99999] transition-opacity duration-300"
                    style={{
                        left: mousePos.x,
                        top: mousePos.y,
                        transform: 'translate(-50%, -50%)'
                    }}
                >
                    <QuantumLoader size="35" speed="1.2" color="#6366f1" />
                </div>
            )}
            <Suspense fallback={null}>
                <RouteChangeHandler />
            </Suspense>
            {children}
            {isLoading && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/20 backdrop-blur-[8px] transition-all animate-in fade-in duration-500">
                    <div className="flex flex-col items-center gap-8 p-14 rounded-[50px] bg-slate-900/40 border border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.4)] backdrop-blur-3xl">
                        <div className="relative">
                            <QuantumLoader
                                color="white"
                                size="55"
                                speed="1.5"
                                title={loadingMessage || "Inteligência Clínica"}
                                defaultMessages={true}
                            />
                            <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full -z-10 animate-pulse" />
                        </div>
                    </div>
                </div>
            )}
        </GlobalLoaderContext.Provider>
    );
};
