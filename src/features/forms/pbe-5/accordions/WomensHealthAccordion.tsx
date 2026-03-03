"use client";

import React, { useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
    Flower2, Baby, Activity, ShieldCheck, Info, UserCheck,
    Heart, Droplets, Ruler, Scale, RefreshCw, Layers,
    Waves, Thermometer, ClipboardList, PenTool, Search, Zap,
    Link2, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

import { WomensHealthRichProtocol } from "./protocols/WomensHealthRichProtocol";
import { generatePortalToken } from "@/app/dashboard/[slug]/patients/actions/voiding-diary";
import { toast } from "sonner";

interface WomensHealthHealthAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string; iconColor: string; bg: string };
    setIsAssessmentModalOpen?: (isOpen: boolean) => void;
    patientId?: string;
}

export function WomensHealthAccordion({ openSection, isSectionFilled, sectionStyle, setIsAssessmentModalOpen, patientId }: WomensHealthHealthAccordionProps) {
    const isFilled = isSectionFilled('womens_health');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateDiary = async () => {
        try {
            const pathSegments = window.location.pathname.split('/');
            const patientIndex = pathSegments.indexOf('patients');

            // Allow patientId to be passed via props (from PBE5Form/attendance) or extracted from URL
            const resolvedPatientId = patientId || (patientIndex !== -1 ? pathSegments[patientIndex + 1] : null);

            const slugIndex = pathSegments.indexOf('dashboard');
            const slug = slugIndex !== -1 ? pathSegments[slugIndex + 1] : undefined;

            if (!resolvedPatientId || resolvedPatientId === 'sandbox') {
                toast.error("Para gerar o link, você deve estar no prontuário do paciente.");
                return;
            }

            setIsGenerating(true);
            const loadingToast = toast.loading("Gerando portal da paciente...");

            const res = await generatePortalToken(resolvedPatientId, slug);

            if (res.success && res.url) {
                await navigator.clipboard.writeText(res.url);
                toast.success("Link enviado direto pelo WhatsApp da paciente (Z-API)! E copiado também.", { id: loadingToast });
            } else {
                toast.error(res.error || "Erro ao gerar link", { id: loadingToast });
            }
        } catch (e) {
            toast.error("Erro inesperado");
            setIsGenerating(false);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <AccordionItem
            value="womens_health"
            className={cn(
                "border rounded-[2rem] border-l-4 transition-all duration-300 shadow-sm overflow-hidden",
                openSection === 'womens_health' ? 'bg-white ring-2 ring-pink-50' : 'bg-white/50',
                isFilled ? 'border-slate-200' : 'border-slate-100',
                sectionStyle.border
            )}
        >
            <AccordionTrigger className="px-8 py-6 hover:no-underline flex gap-2 items-center text-left group">
                <div className="flex items-center gap-4 flex-1">
                    <div className={cn("p-2 rounded-xl transition-colors", openSection === 'womens_health' ? "bg-pink-600 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-pink-50 group-hover:text-pink-600")}>
                        <Flower2 className="h-5 w-5 transition-colors group-hover:animate-bounce" />
                    </div>
                    <div>
                        <span className={cn("font-black text-lg tracking-tight", openSection === 'womens_health' ? "text-slate-900" : "text-slate-600")}>Saúde da Mulher & Pélvica</span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Obstetrícia, Esquema PERFECT e Uroginecologia</p>
                    </div>
                </div>
                {isFilled && (
                    <Badge variant="outline" className="bg-pink-100 text-pink-700 border-none text-[10px] h-6 px-3 rounded-full font-black uppercase">
                        SISTEMA PÉLVICO ATIVO
                    </Badge>
                )}
            </AccordionTrigger>
            <AccordionContent className="px-0 pb-0 border-t border-slate-50">
                <div className="p-8">
                    <div className="mb-6 flex justify-end">
                        <Button
                            onClick={handleGenerateDiary}
                            disabled={isGenerating}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1rem] shadow-sm font-black uppercase text-[10px] tracking-widest gap-2 h-10 px-5"
                        >
                            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                            Gerar Portal / Diário Miccional
                        </Button>
                    </div>
                    <WomensHealthRichProtocol />
                </div>

                <div className="bg-pink-50/50 p-8 flex items-center gap-5 border-t border-pink-100">
                    <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center border border-pink-100 shadow-sm shrink-0">
                        <PenTool className="h-6 w-6 text-pink-500 animate-pulse" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-pink-700 uppercase tracking-[0.1em] mb-1">Princípio de Abordagem Axiom</p>
                        <p className="text-[10px] font-bold text-pink-900/60 leading-relaxed uppercase tracking-tighter">
                            A saúde pélvica vai além da força muscular. Envolve comportamento, emoções e qualidade de vida. O Esquema PERFECT é apenas uma peça do quebra-cabeça funcional da mulher.
                        </p>
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
