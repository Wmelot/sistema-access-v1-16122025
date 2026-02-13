"use client";

import { useState, useCallback, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Dumbbell, Activity, Stethoscope, Footprints, Sparkles, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useDebouncedCallback } from "use-debounce";

/**
 * UltimatePBEForm.tsx (v2 Unified)
 * 
 * Orchestrates Clinical (SmartPBE) and Performance (AdvancedPhysical) assessments into a single interface.
 * Consumes existing forms as modular components without modifying them.
 */
export function UltimatePBEForm({
    patientId,
    initialData,
    onSave,
    readOnly,
    hideHeader = false,
    hideButtons = false,
    patient,
    professional
}: {
    patientId: string,
    initialData?: any,
    onSave: (data: any) => Promise<any> | void,
    readOnly?: boolean,
    hideHeader?: boolean,
    hideButtons?: boolean,
    patient?: any,
    professional?: any
}) {
    // Central state that holds all sub-assessment data
    const [unifiedData, setUnifiedData] = useState<any>(initialData || {
        clinical: {},
        performance: {}
    });

    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("clinical");

    // [AUTO-SAVE] Report back to parent debounced to avoid too many renders/saves
    const debouncedNotify = useDebouncedCallback((data: any) => {
        if (onSave) {
            onSave(data);
        }
    }, 1500);

    // Sync state with initialData if it changes externally
    useEffect(() => {
        if (initialData && JSON.stringify(initialData) !== JSON.stringify(unifiedData)) {
            setUnifiedData(initialData);
        }
    }, [initialData]);

    // Trigger debounced notification when unifiedData changes
    useEffect(() => {
        debouncedNotify(unifiedData);
    }, [unifiedData, debouncedNotify]);

    // Handler for updates from sub-forms
    const handleUpdate = useCallback((section: 'clinical' | 'performance', data: any) => {
        setUnifiedData((prev: any) => {
            const currentSectionData = prev[section];
            // Deep simple check to avoids infinite loop if child triggers same data
            if (JSON.stringify(currentSectionData) === JSON.stringify(data)) return prev;

            const newData = { ...prev, [section]: data };
            return newData;
        });
    }, []);

    const handleSaveAll = async () => {
        setIsSaving(true);
        try {
            await onSave(unifiedData);
            toast.success("Avaliação Ultimate PBE salva com sucesso!");
        } catch (e: any) {
            console.error("Error saving ultimate form:", e);
            toast.error(e?.message || "Erro ao salvar avaliação completa.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-20">
            {!hideHeader && (
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-6 rounded-2xl border shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 rotate-3">
                            <Sparkles className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-tight">Axiom Ultimate PBE</h1>
                                <div className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase rounded-lg border border-indigo-100 tracking-widest">
                                    V2.0 Unified
                                </div>
                            </div>
                            <p className="text-slate-500 font-medium text-sm">Visão consolidada: Clínica (Smart) e Performance (Advanced).</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden lg:flex flex-col items-end mr-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronização Ativa</span>
                            <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                                <Activity className="w-3 h-3 animate-pulse" />
                                Real-time ready
                            </span>
                        </div>
                        <Button
                            onClick={handleSaveAll}
                            disabled={isSaving}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-black px-6 h-12 rounded-xl shadow-xl shadow-slate-200 transition-all active:scale-95 gap-2"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-5 h-5" />}
                            SALVAR TUDO
                        </Button>
                    </div>
                </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-16 p-1.5 bg-slate-100/80 rounded-2xl mb-8 backdrop-blur-sm border shadow-inner">
                    <TabsTrigger
                        value="clinical"
                        className="rounded-xl h-full text-sm font-black uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-md transition-all gap-2"
                    >
                        <Stethoscope className="h-4 w-4" />
                        Clínica (Smart PBE)
                    </TabsTrigger>
                    <TabsTrigger
                        value="physical"
                        className="rounded-xl h-full text-sm font-black uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-md transition-all gap-2"
                    >
                        <Activity className="h-4 w-4" />
                        Performance (Advanced)
                    </TabsTrigger>
                </TabsList>

                {/* --- TAB 1: CLÍNICA (SMART PBE FORM) --- */}
                <TabsContent value="clinical" className="focus-visible:ring-0 animate-in fade-in zoom-in-95 duration-300">
                    <SmartPBEForm
                        patientId={patientId}
                        initialData={unifiedData.clinical}
                        onSave={(data) => handleUpdate('clinical', data)}
                        readOnly={readOnly}
                        hideHeader={true}
                        hideButtons={true}
                    />
                </TabsContent>

                {/* --- TAB 2: PHYSICAL (ADVANCED PHYSICAL FORM) --- */}
                <TabsContent value="physical" className="focus-visible:ring-0 animate-in fade-in zoom-in-95 duration-300">
                    <AdvancedPhysicalForm
                        patientId={patientId}
                        initialData={unifiedData.performance}
                        onDataChange={(data) => handleUpdate('performance', data)}
                        readOnly={readOnly}
                        hideHeader={true}
                        hideButtons={true}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default UltimatePBEForm;
