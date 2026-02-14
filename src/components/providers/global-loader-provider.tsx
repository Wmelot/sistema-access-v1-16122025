"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { usePathname, useSearchParams } from "next/navigation";

// Dynamically load QuantumLoader only on client side to avoid SSR/Prerender issues
const QuantumLoader = dynamic(() => import('@/components/ui/quantum-loader').then(mod => mod.QuantumLoader), {
    ssr: false,
    loading: () => <div className="w-[60px] h-[60px]" /> // Just a spacer to keep layout stable
});

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
    const { setIsLoading } = useGlobalLoader();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Delay before hiding the loader to ensure hydration is likely complete
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 800);
        return () => clearTimeout(timer);
    }, [pathname, searchParams, setIsLoading]);

    return null;
};

export const GlobalLoaderProvider = ({ children }: { children: React.ReactNode }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("PROCESSANDO...");

    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.body.style.overflow = isLoading ? "hidden" : "unset";
        }
    }, [isLoading]);

    const showLoading = useCallback((message: string = "PROCESSANDO...") => {
        setLoadingMessage(message.toUpperCase());
        setIsLoading(true);

        // Safety timeout: Auto-dismiss after 15 seconds if navigation stalls
        setTimeout(() => setIsLoading(false), 15000);
    }, []);

    const hideLoading = useCallback(() => setIsLoading(false), []);

    return (
        <GlobalLoaderContext.Provider value={{ setIsLoading, showLoading, hideLoading, isLoading }}>
            <Suspense fallback={null}>
                <RouteChangeHandler />
            </Suspense>
            {children}
            {isLoading && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/20 backdrop-blur-[6px] transition-all animate-in fade-in duration-500">
                    <div className="flex flex-col items-center gap-7 p-12 rounded-[40px] bg-white/10 border border-white/20 shadow-[0_32px_64px_rgba(0,0,0,0.2)] backdrop-blur-2xl">
                        <div className="relative">
                            <QuantumLoader />
                            <div className="absolute inset-0 bg-indigo-500/10 blur-2xl rounded-full -z-10" />
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.4em] mb-1">
                                Inteligência Clínica
                            </p>
                            <p className="text-sm font-bold text-white uppercase tracking-widest animate-pulse">
                                {loadingMessage}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </GlobalLoaderContext.Provider>
    );
};
