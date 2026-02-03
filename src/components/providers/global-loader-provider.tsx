"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { usePathname, useSearchParams } from "next/navigation";

// Dynamically load QuantumLoader only on client side to avoid SSR/Prerender issues
const QuantumLoader = dynamic(() => import('@/components/ui/quantum-loader').then(mod => mod.QuantumLoader), {
    ssr: false,
    loading: () => <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
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
        setIsLoading(false);
    }, [pathname, searchParams, setIsLoading]);

    return null;
};

export const GlobalLoaderProvider = ({ children }: { children: React.ReactNode }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("PROCESSANDO...");

    // Prevent scrolling when loading
    useEffect(() => {
        if (typeof document !== 'undefined') { // Safety check
            if (isLoading) {
                document.body.style.overflow = "hidden";
            } else {
                document.body.style.overflow = "unset";
            }
        }
        return () => {
            if (typeof document !== 'undefined') {
                document.body.style.overflow = "unset";
            }
        };
    }, [isLoading]);

    const showLoading = useCallback((message: string = "PROCESSANDO...") => {
        setLoadingMessage(message.toUpperCase());
        setIsLoading(true);
    }, []);

    const hideLoading = useCallback(() => setIsLoading(false), []);

    return (
        <GlobalLoaderContext.Provider value={{ setIsLoading, showLoading, hideLoading, isLoading }}>
            <Suspense fallback={null}>
                <RouteChangeHandler />
            </Suspense>
            {children}
            {isLoading && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-sm transition-opacity duration-200">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <QuantumLoader size="60" speed="4.0" color="#4f46e5" />
                        </div>
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-widest animate-pulse">
                            {loadingMessage}
                        </p>
                    </div>
                </div>
            )}
        </GlobalLoaderContext.Provider>
    );
};
