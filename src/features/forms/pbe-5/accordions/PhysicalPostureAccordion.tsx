"use client";

import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Activity, CheckCircle2, ShieldCheck, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { PhotoAnalyzer } from "../components/interactive/ImageCimetografo";

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
    const [analyzerView, setAnalyzerView] = React.useState<string | null>(null);

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
                                            <img src={watch(`posture.photosAnalyzed.${view}`) || url} alt={label} className="absolute inset-0 w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                                                <Button size="icon" variant="secondary" className="rounded-full h-10 w-10 text-emerald-600 hover:text-emerald-700 bg-white" onClick={() => setAnalyzerView(view)}>
                                                    <Activity className="h-5 w-5" />
                                                </Button>
                                                <Button size="icon" variant="destructive" className="rounded-full h-10 w-10" onClick={() => removePhoto(view)}>
                                                    <Trash2 className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex flex-col items-center justify-center gap-2 p-2 w-full h-full pointer-events-none">
                                                <Camera className="h-8 w-8 text-purple-300 group-hover:text-purple-600 transition-all pointer-events-none" />
                                                <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-tighter text-center leading-tight">
                                                    Clique p/ Enviar<br />(ou Finder)
                                                </h6>
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                title=""
                                                onChange={(e) => handlePhotoUpload(view, e.target.files?.[0] || null)}
                                            />
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Posture Observations & AI Formatting */}
                <div className="space-y-4 pt-6 mt-8 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-purple-600 rounded-full" />
                            <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Observações Posturais Adicionais</h4>
                        </div>
                        <Button
                            type="button"
                            variant="secondary"
                            className="bg-purple-100 text-purple-700 hover:bg-purple-200 font-bold text-[10px] uppercase tracking-widest gap-2 rounded-xl"
                            onClick={async () => {
                                const currentText = watch('posture.freeText') || '';
                                if (!currentText) {
                                    toast.error('Escreva alguma observação primeiro para a IA analisar.');
                                    return;
                                }

                                const loadingToast = toast.loading('Analisando postura com IA...');
                                try {
                                    const res = await fetch('/api/ai/copilot', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            action: 'format_posture',
                                            text: currentText,
                                            systemPrompt: 'Você é um fisioterapeuta especialista. O usuário inseriu observações posturais soltas. Reescreva-as num texto corrido, altamente profissional e estruturado (Padrão MAGE), focado apenas no que foi relatado, sem inventar dados.'
                                        })
                                    });
                                    if (res.ok) {
                                        const data = await res.json();
                                        setValue('posture.freeText', data.result || data.text || data.response, { shouldDirty: true, shouldValidate: true });
                                        toast.success('Texto formatado pela IA!', { id: loadingToast });
                                    } else {
                                        toast.error('Erro na IA', { id: loadingToast });
                                    }
                                } catch (e) {
                                    toast.error('Erro de conexão com a IA', { id: loadingToast });
                                }
                            }}
                        >
                            <Activity className="w-4 h-4" />
                            Analisar e Corrigir (IA)
                        </Button>
                    </div>

                    <Textarea
                        placeholder="Descreva as alterações posturais (ex: ombro D mais alto, escoliose à C à esquerda, anteriorização de cabeça...). Ao terminar, clique em 'Analisar (IA)' para padronizar o texto."
                        className="min-h-[120px] resize-none text-sm p-4 rounded-2xl bg-slate-50 border-slate-200 focus:bg-white focus:border-purple-400 focus:ring-purple-400"
                        value={watch('posture.freeText') || ''}
                        onChange={(e: any) => setValue('posture.freeText', e.target.value, { shouldDirty: true })}
                    />
                </div>
            </AccordionContent>

            <Dialog open={!!analyzerView} onOpenChange={() => setAnalyzerView(null)}>
                <DialogContent className="max-w-5xl p-0 overflow-hidden bg-slate-50 border-none rounded-[2rem] gap-0">
                    <DialogHeader className="p-6 bg-white border-b border-slate-100 text-center">
                        <DialogTitle className="text-xl font-black text-slate-800 uppercase tracking-widest">
                            Cimetógrafo Digital - {analyzerView === 'anterior' ? 'Vista Anterior' : analyzerView === 'posterior' ? 'Vista Posterior' : analyzerView === 'left' ? 'Lateral Esquerda' : 'Lateral Direita'}
                        </DialogTitle>
                        <DialogDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                            Arraste os pontos para as marcações anatômicas. O zoom auxilia na precisão. Os ângulos são calculados automaticamente.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-8 pb-0">
                        {analyzerView && photos[analyzerView] && (
                            <PhotoAnalyzer
                                src={photos[analyzerView]}
                                savedPoints={watch(`posture.pointsAnalyzed.${analyzerView}`)}
                                mode={
                                    analyzerView === 'anterior' ? 'posture_anterior' :
                                        analyzerView === 'posterior' ? 'posture_posterior' : 'posture_lateral'
                                }
                                onFinalize={(base64, pts) => {
                                    setValue(`posture.photosAnalyzed.${analyzerView}`, base64, { shouldDirty: true });
                                    setValue(`posture.pointsAnalyzed.${analyzerView}`, pts, { shouldDirty: true });
                                    setAnalyzerView(null);
                                    toast.success("Análise processada com sucesso!");
                                }}
                            />
                        )}
                    </div>

                    <DialogFooter className="p-6 bg-white border-t border-slate-100 flex items-center justify-center">
                        <Button
                            onClick={() => (window as any).finalizeCimetografo?.()}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-black uppercase tracking-widest text-[10px] h-12 rounded-xl px-12"
                        >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Finalizar Análise
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AccordionItem>
    );
}
