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
    hideLoading: () => void;
    isLoading: boolean;
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
        // We only hide automatically if the loader was NOT shown manually with a message
        // This is a bit tricky with the current state. 
        // Let's just add a small delay to the hide to allow the new page to start rendering
        const timer = setTimeout(() => {
            hideLoading();
        }, 5000); // 5000ms safe window to ensure rendering is visible and data fetching has started

        return () => clearTimeout(timer);
    }, [pathname, searchParams, hideLoading]);

    return null;
};

export const GlobalLoaderProvider = ({ children }: { children: React.ReactNode }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("PROCESSANDO...");
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.body.style.overflow = isLoading ? "hidden" : "unset";
        }
    }, [isLoading]);

    const hideLoading = useCallback(() => {
        setIsLoading(false);
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

        // Safety timeout: Auto-dismiss after 8 seconds if navigation stalls
        timeoutRef.current = setTimeout(() => {
            setIsLoading(false);
            timeoutRef.current = null;
        }, 8000);
    }, []);

    return (
        <GlobalLoaderContext.Provider value={{ setIsLoading, showLoading, hideLoading, isLoading }}>
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
