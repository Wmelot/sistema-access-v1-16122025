"use client";

import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Activity, CheckCircle2, ShieldCheck, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PhysicalPostureAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string, iconColor: string, bg: string };
}

const POSTURE_CHECKS = [
    'Cabeça Anteriorizada', 'Hiperlordose Cervical', 'Hipercifose Torácica',
    'Hiperlordose Lombar', 'Escoliose', 'Pelve Antevertida', 'Pelve Retrovertida',
    'Joelho Valgo', 'Joelho Varo', 'Joelho Recurvato', 'Pé Plano', 'Pé Cavo'
];

export function PhysicalPostureAccordion({ openSection, isSectionFilled, sectionStyle }: PhysicalPostureAccordionProps) {
    const { control, watch, setValue } = useFormContext();
    const isFilled = isSectionFilled('posture');
    const photos = watch('posture.photos') || {};
    const observations = watch('posture.observations') || [];

    const handlePhotoUpload = (view: string, file: File | null) => {
        if (file) {
            const url = URL.createObjectURL(file);
            setValue(`posture.photos.${view}`, url, { shouldDirty: true, shouldValidate: true });
        }
    };

    const removePhoto = (view: string) => {
        setValue(`posture.photos.${view}`, null, { shouldDirty: true, shouldValidate: true });
    };

    const toggleObservation = (item: string) => {
        const newObs = observations.includes(item)
            ? observations.filter((i: string) => i !== item)
            : [...observations, item];
        setValue('posture.observations', newObs, { shouldDirty: true, shouldValidate: true });
    };

    return (
        <AccordionItem value="posture" className={cn("border rounded-[2rem] px-6 mb-4 transition-all duration-500 shadow-sm", openSection === 'posture' ? "bg-white border-slate-200 shadow-xl scale-[1.01]" : "bg-slate-50/50 border-transparent hover:bg-white")}>
            <AccordionTrigger className="hover:no-underline py-6 group">
                <div className="flex items-center gap-4 w-full text-left">
                    <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500", openSection === 'posture' ? "bg-purple-600 text-white shadow-lg rotate-12" : "bg-white text-slate-400 shadow-sm group-hover:text-purple-600")}>
                        <Camera className="h-6 w-6 transition-colors group-hover:animate-bounce" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className={cn("text-sm font-black uppercase tracking-widest", openSection === 'posture' ? "text-slate-900" : "text-slate-500")}>Avaliação Postural (Fotos)</h3>
                            {isFilled && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Biofotogrametria e Checklist Estático</p>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-8 space-y-10">
                {/* Photo Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {['anterior', 'posterior', 'left', 'right'].map((view) => {
                        const url = photos[view];
                        const label = view === 'left' ? 'Lateral Esquerda' : view === 'right' ? 'Lateral Direita' : view.toUpperCase();

                        return (
                            <div key={view} className="space-y-3">
                                <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block text-center italic">{label}</Label>
                                <div className={cn(
                                    "relative h-64 rounded-3xl border-2 border-dashed transition-all overflow-hidden flex flex-col items-center justify-center gap-2 group",
                                    url ? "border-purple-600" : "border-slate-200 bg-slate-50 hover:bg-purple-50/30 hover:border-purple-300"
                                )}>
                                    {url ? (
                                        <>
                                            <img src={url} alt={label} className="absolute inset-0 w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                                                <Button size="icon" variant="destructive" className="rounded-full h-10 w-10" onClick={() => removePhoto(view)}>
                                                    <Trash2 className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-purple-600 group-hover:scale-110 transition-all">
                                                <Camera className="h-6 w-6" />
                                            </div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Clique p/ Enviar</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                onChange={(e) => handlePhotoUpload(view, e.target.files?.[0] || null)}
                                            />
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Posture Checklist */}
                <div className="space-y-6 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-4 bg-purple-600 rounded-full" />
                        <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Checklist de Desvios Posturais</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {POSTURE_CHECKS.map(item => {
                            const active = observations.includes(item);
                            return (
                                <button
                                    key={item}
                                    type="button"
                                    onClick={() => toggleObservation(item)}
                                    className={cn(
                                        "p-4 rounded-2xl border text-left transition-all flex items-center justify-between group h-full",
                                        active ? "bg-purple-600 border-purple-600 text-white shadow-lg" : "bg-white border-slate-100 text-slate-600 hover:border-purple-200"
                                    )}
                                >
                                    <span className={cn("text-[10px] font-black uppercase leading-tight max-w-[80%]", active ? "text-white" : "text-slate-700")}>{item}</span>
                                    {active ? <ShieldCheck className="w-4 h-4 text-purple-200" /> : <div className="h-2 w-2 rounded-full border border-slate-200 group-hover:border-purple-300" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
