"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { QuantumLoader } from "@/components/ui/quantum-loader";
import { AnimatePresence, motion } from "framer-motion";

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

export const GlobalLoaderProvider = ({ children }: { children: React.ReactNode }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("PROCESSANDO...");
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Auto-hide when route changes
    useEffect(() => {
        setIsLoading(false);
    }, [pathname, searchParams]);

    // Prevent scrolling when loading
    useEffect(() => {
        if (isLoading) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => { document.body.style.overflow = "unset"; };
    }, [isLoading]);

    const showLoading = useCallback((message: string = "PROCESSANDO...") => {
        setLoadingMessage(message.toUpperCase());
        setIsLoading(true);
    }, []);

    const hideLoading = useCallback(() => setIsLoading(false), []);

    return (
        <GlobalLoaderContext.Provider value={{ setIsLoading, showLoading, hideLoading, isLoading }}>
            {children}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-sm"
                    >
                        <div className="flex flex-col items-center gap-4">
                            <QuantumLoader size="60" speed="4.0" color="#4f46e5" />
                            <motion.p
                                key={loadingMessage}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-sm font-medium text-slate-500 uppercase tracking-widest animate-pulse"
                            >
                                {loadingMessage}
                            </motion.p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </GlobalLoaderContext.Provider>
    );
};
