import React, { useState } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, Plus, Trash2, ClipboardCheck, Sparkles, Send, Calendar, Mic, Activity, Info as InfoIcon, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AudioTextarea } from "@/features/forms/pbe/components/audio-textarea";
import { ExerciseCombobox } from "@/features/forms/pbe/components/ExerciseCombobox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

interface ClinicalConductAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string; iconColor: string; bg: string };
}

export function ClinicalConductAccordion({ openSection, isSectionFilled, sectionStyle }: ClinicalConductAccordionProps) {
    const { register, watch, setValue, control, getValues } = useFormContext();
    const { fields: exerciseFields, append: appendExercise, remove: removeExercise } = useFieldArray({
        control,
        name: "plan.exercises"
    });

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiModalOpen, setAiModalOpen] = useState(false);
    const [aiResult, setAiResult] = useState<any>(null);

    const [isEvidenceLoading, setIsEvidenceLoading] = useState(false);
    const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
    const [evidenceResult, setEvidenceResult] = useState("");
    const selectedRegions = watch('anamnesis.mainRegions') || [];

    const handleSuggestProtocol = async () => {
        setIsAnalyzing(true);
        const allData = getValues();
        try {
            const res = await fetch('/api/ai/copilot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'clinical_protocol',
                    data: allData,
                    systemPrompt: 'Você é um fisioterapeuta expert analisando todos os dados da ficha de avaliação. Retorne um JSON estrito contendo: { "redFlags": ["alerta 1"], "yellowFlags": ["alerta 2"], "prognosis": "texto do prognostico", "interventions": "texto corrido com sugestão de conduta", "suggestedExercises": [{ "name": "Nome", "sets": "3", "reps": "12" }] }'
                })
            });
            if (res.ok) {
                const data = await res.json();
                let parsed = data.result || data.response || data;
                if (typeof parsed === 'string') {
                    try {
                        // Strip markdown formatting like ```json
                        const cleanStr = parsed.replace(/```json/g, '').replace(/```/g, '').trim();
                        parsed = JSON.parse(cleanStr);
                    } catch (e) {
                        // Default fallback if JSON fails
                        parsed = {
                            prognosis: "Não foi possível extrair um prognóstico estruturado.",
                            interventions: parsed,
                            redFlags: [],
                            yellowFlags: [],
                            suggestedExercises: []
                        };
                    }
                }
                setAiResult(parsed);
                setAiModalOpen(true);
            } else {
                const errData = await res.json().catch(() => ({}));
                toast.error(`Erro ao gerar protocolo: ${errData.error || res.statusText}`);
            }
        } catch (e: any) {
            toast.error(`Falha de conexão com a IA: ${e.message}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleFetchEvidence = async () => {
        setIsEvidenceLoading(true);
        const allData = getValues();
        try {
            const res = await fetch('/api/ai/copilot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'fetch_evidence',
                    data: allData,
                    systemPrompt: 'Você é um pesquisador em fisioterapia. Baseado nos achados clínicos do paciente, escreva um resumo rico trazendo as diretrizes cínicas mais recentes (PubMed, PEDro) com bom poder metodológico sobre a patologia. Use markdown para formatar o texto.'
                })
            });
            if (res.ok) {
                const data = await res.json();
                setEvidenceResult(data.result || data.response || data.text || '');
                setEvidenceModalOpen(true);
            } else {
                const errData = await res.json().catch(() => ({}));
                toast.error(`Erro ao buscar evidências: ${errData.error || res.statusText}`);
            }
        } catch (e: any) {
            toast.error(`Erro na requisição: ${e.message}`);
        } finally {
            setIsEvidenceLoading(false);
        }
    };

    const applyAIToForm = () => {
        if (!aiResult) return;

        // Append exercises
        if (aiResult.suggestedExercises?.length) {
            aiResult.suggestedExercises.forEach((ex: any) => {
                appendExercise({ name: ex.name, sets: ex.sets || '3', reps: ex.reps || '12', load: ex.load || '' });
            });
        }

        // Populate orientations
        const currentOri = getValues('plan.orientations') || '';
        const newOri = `PROGNÓSTICO:\n${aiResult.prognosis || ''}\n\nINTERVENÇÕES:\n${aiResult.interventions || ''}`;
        setValue('plan.orientations', currentOri ? currentOri + '\n\n' + newOri : newOri, { shouldDirty: true });

        setAiModalOpen(false);
        toast.success("Condutas e Exercícios aplicados na avaliação!");
    };

    return (
        <AccordionItem
            value="plan"
            className={cn(
                "border rounded-[2rem] border-l-4 transition-all duration-300 shadow-sm overflow-hidden",
                openSection === 'plan' ? 'bg-white ring-2 ring-slate-100' : 'bg-white/50',
                isSectionFilled('plan') ? 'border-slate-200' : 'border-slate-100',
                sectionStyle.border
            )}
        >
            <AccordionTrigger className="px-8 py-6 hover:no-underline flex gap-2 items-center text-left group">
                <div className="flex items-center gap-4 flex-1">
                    <ClipboardCheck className="h-5 w-5 transition-colors group-hover:animate-bounce" />
                    <div>
                        <span className={cn("font-black text-lg tracking-tight", openSection === 'plan' ? "text-slate-900" : "text-slate-600")}>8. Conduta Clínica & Planejamento</span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Estratégia terapêutica e prescrições</p>
                    </div>
                </div>
                {isSectionFilled('plan') && (
                    <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-none text-[10px] h-6 px-3 rounded-full font-black">PLANO DEFINIDO</Badge>
                )}
            </AccordionTrigger>
            <AccordionContent className="px-8 pb-10 pt-4 space-y-12 border-t border-slate-50">
                <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">

                    {/* Prescriptions */}
                    <div className="space-y-10">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-1 h-5 bg-slate-800 rounded-full" />
                                    <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Prescrição de Exercícios</h4>
                                </div>
                                <Badge variant="secondary" className="bg-slate-100 text-slate-400 text-[9px] font-black uppercase px-2">Padrão Axiom</Badge>
                            </div>

                            <div className="space-y-4">
                                {exerciseFields.map((field, index) => (
                                    <div key={field.id} className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4 animate-in fade-in slide-in-from-left-2 transition-all hover:shadow-md hover:border-slate-200 group">
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 space-y-1">
                                                <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-1">Exercício</FormLabel>
                                                <ExerciseCombobox
                                                    value={watch(`plan.exercises.${index}.name`)}
                                                    onChange={(val) => setValue(`plan.exercises.${index}.name`, val)}
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeExercise(index)}
                                                className="h-10 w-10 text-slate-200 hover:text-red-500 rounded-xl mt-5 group-hover:text-slate-400 transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="space-y-1">
                                                <FormLabel className="text-[9px] font-black text-slate-400 uppercase tracking-tighter ml-1">Séries</FormLabel>
                                                <Input {...register(`plan.exercises.${index}.sets`)} placeholder="3" className="h-10 rounded-xl bg-slate-50 border-none font-black text-center" />
                                            </div>
                                            <div className="space-y-1">
                                                <FormLabel className="text-[9px] font-black text-slate-400 uppercase tracking-tighter ml-1">Reps</FormLabel>
                                                <Input {...register(`plan.exercises.${index}.reps`)} placeholder="12" className="h-10 rounded-xl bg-slate-50 border-none font-black text-center" />
                                            </div>
                                            <div className="space-y-1">
                                                <FormLabel className="text-[9px] font-black text-slate-400 uppercase tracking-tighter ml-1">Carga</FormLabel>
                                                <Input {...register(`plan.exercises.${index}.load`)} placeholder="2kg" className="h-10 rounded-xl bg-slate-50 border-none font-black text-center" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => appendExercise({ name: "", sets: "3", reps: "12" })}
                                    className="w-full h-14 border-dashed border-slate-200 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-50 group hover:border-slate-300 transition-all"
                                >
                                    <Plus className="h-4 w-4 mr-2 group-hover:scale-125 transition-transform" />
                                    Adicionar Exercício ao Plano
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-5 bg-slate-800 rounded-full" />
                                <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Follow-up & Retorno</h4>
                            </div>
                            <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between gap-6">
                                <div className="flex-1 space-y-1">
                                    <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Frequência Sugerida</FormLabel>
                                    <div className="flex bg-white p-1 rounded-xl border border-slate-100">
                                        {[1, 2, 3].map(n => (
                                            <button
                                                key={n}
                                                type="button"
                                                onClick={() => setValue('plan.frequency', n)}
                                                className={cn(
                                                    "flex-1 py-2 text-xs font-black uppercase rounded-lg transition-all",
                                                    watch('plan.frequency') === n
                                                        ? "bg-slate-900 text-white shadow-lg"
                                                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                                )}
                                            >
                                                {n}x / sem
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-slate-300 border border-slate-100">
                                    <Calendar className="h-6 w-6" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Orientations & AI Audit */}
                    <div className={cn("p-8 rounded-[3rem] border transition-all", sectionStyle.bg, openSection === 'plan' ? "border-slate-200 shadow-inner" : "border-transparent")}>
                        <div className="space-y-10">
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-1 h-5 bg-slate-800 rounded-full" />
                                    <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Orientações ao Paciente</h4>
                                </div>
                                <div className="space-y-4">
                                    <AudioTextarea
                                        value={watch('plan.orientations')}
                                        onChange={(e: any) => setValue('plan.orientations', e.target.value)}
                                        onTranscription={(text) => setValue('plan.orientations', text)}
                                        placeholder="Digite ou dite as orientações finais, cuidados e o prognóstico..."
                                        className="min-h-[220px] rounded-[2rem] border-slate-200 focus:ring-slate-500 bg-white text-base font-medium p-8 shadow-sm"
                                    />
                                    <div className="flex items-center gap-3 px-4">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Audio Intelligence Ativa</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Sparkles className="h-32 w-32 text-indigo-200" />
                                    </div>
                                    <div className="relative z-10 space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-300 border border-indigo-400/30">
                                                <Sparkles className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-white font-black uppercase text-xs tracking-widest leading-none">Axiom Clinical Protocol</h4>
                                                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Protocolos de Reabilitação</span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-indigo-100 font-medium leading-relaxed">
                                            Baseado nas regiões selecionadas e achados, nossa IA sugere as melhores <span className="text-indigo-300 font-black italic">técnicas e exercícios</span> de reabilitação.
                                        </p>
                                        <Button
                                            onClick={handleSuggestProtocol}
                                            disabled={isAnalyzing || selectedRegions.length === 0}
                                            className="w-full h-14 bg-white hover:bg-indigo-50 text-indigo-900 font-black rounded-2xl shadow-xl shadow-indigo-950/50 flex items-center justify-center gap-2 group transition-all"
                                        >
                                            {isAnalyzing ? (
                                                <Activity className="h-4 w-4 animate-spin text-indigo-600" />
                                            ) : (
                                                <Sparkles className="h-4 w-4 text-indigo-600" />
                                            )}
                                            <span>Protocolo Clínico Inteligente</span>
                                        </Button>
                                    </div>
                                </div>

                                <div className="bg-white p-8 rounded-[2.5rem] border border-indigo-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                    <div className="relative z-10 space-y-5">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                                                <InfoIcon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-slate-800 font-black uppercase text-xs tracking-widest leading-none">Principais Evidências</h4>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">O que a ciência diz</span>
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                                            Acesse as diretrizes mais recentes sobre a patologia do paciente diretamente da literatura científica.
                                        </p>
                                        <Button
                                            variant="outline"
                                            onClick={handleFetchEvidence}
                                            disabled={isEvidenceLoading || selectedRegions.length === 0}
                                            className="w-full h-12 border-indigo-200 text-indigo-700 font-black rounded-xl flex items-center justify-center gap-2 group transition-all hover:bg-indigo-50"
                                        >
                                            {isEvidenceLoading ? <Activity className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
                                            <span>Principais Evidências</span>
                                        </Button>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </AccordionContent>

            {/* AI Protocol Dialog */}
            <Dialog open={aiModalOpen} onOpenChange={setAiModalOpen}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden bg-slate-50 border-none rounded-[2rem] gap-0">
                    <DialogHeader className="p-8 bg-white border-b border-slate-100 pb-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                <Sparkles className="h-5 w-5" />
                            </div>
                            <DialogTitle className="text-2xl font-black text-slate-800">Protocolo Clínico Axiom</DialogTitle>
                        </div>
                        <DialogDescription className="text-slate-500 font-medium">Recomendações terapêuticas geradas pela IA baseadas na avaliação clínica.</DialogDescription>
                    </DialogHeader>

                    <div className="p-8 max-h-[60vh] overflow-y-auto space-y-8 scrollbar-thin">
                        {aiResult?.redFlags?.length > 0 && (
                            <div className="bg-red-50 border-2 border-red-200 p-6 rounded-[2rem]">
                                <h4 className="font-black text-red-800 uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                                    Bandeiras Vermelhas
                                </h4>
                                <ul className="list-disc list-inside space-y-2 text-sm text-red-900 font-medium">
                                    {aiResult.redFlags.map((flag: string, i: number) => <li key={i}>{flag}</li>)}
                                </ul>
                            </div>
                        )}

                        {aiResult?.yellowFlags?.length > 0 && (
                            <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-[2rem]">
                                <h4 className="font-black text-amber-800 uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                                    Bandeiras Amarelas
                                </h4>
                                <ul className="list-disc list-inside space-y-2 text-sm text-amber-900 font-medium">
                                    {aiResult.yellowFlags.map((flag: string, i: number) => <li key={i}>{flag}</li>)}
                                </ul>
                            </div>
                        )}

                        <div className="space-y-4">
                            <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2">
                                <Target className="w-4 h-4 text-indigo-500" /> Prognóstico
                            </h4>
                            <p className="text-slate-600 text-sm leading-relaxed bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">{aiResult?.prognosis}</p>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2">
                                <Activity className="w-4 h-4 text-emerald-500" /> Intervenções Sugeridas
                            </h4>
                            <article className="text-slate-600 text-sm leading-relaxed bg-white p-6 rounded-3xl border border-slate-100 shadow-sm whitespace-pre-line">
                                {aiResult?.interventions}
                            </article>
                        </div>

                        {aiResult?.suggestedExercises?.length > 0 && (
                            <div className="space-y-4">
                                <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2">
                                    <ClipboardCheck className="w-4 h-4 text-blue-500" /> Exercícios
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {aiResult.suggestedExercises.map((ex: any, i: number) => (
                                        <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
                                            <div className="h-10 w-10 bg-slate-50 flex items-center justify-center rounded-xl text-slate-400 font-black text-xs">{ex.sets}x{ex.reps}</div>
                                            <div>
                                                <h5 className="font-bold text-sm text-slate-800 leading-tight">{ex.name}</h5>
                                                {ex.load && <Badge variant="secondary" className="mt-2 text-[9px] bg-slate-50 text-slate-500">{ex.load}</Badge>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="p-6 bg-white border-t border-slate-100 sm:justify-between">
                        <Button variant="ghost" onClick={() => setAiModalOpen(false)} className="rounded-xl font-bold uppercase tracking-widest text-[10px] h-12 px-6">Fechar</Button>
                        <Button onClick={applyAIToForm} className="rounded-xl font-bold uppercase tracking-widest text-[10px] h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 gap-2">
                            <CheckCircle2 className="w-4 h-4" /> Importar para o Formulário
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Evidence Dialog */}
            <Dialog open={evidenceModalOpen} onOpenChange={setEvidenceModalOpen}>
                <DialogContent className="max-w-3xl p-0 overflow-hidden bg-white border-none rounded-[2rem] gap-0">
                    <DialogHeader className="p-8 bg-slate-900 border-none pb-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <InfoIcon className="h-32 w-32 text-indigo-400" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-10 w-10 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-300">
                                    <Activity className="h-5 w-5" />
                                </div>
                                <DialogTitle className="text-2xl font-black text-white">Evidências Científicas</DialogTitle>
                            </div>
                            <DialogDescription className="text-slate-400 font-medium">Revisão rápida da literatura para o seu paciente.</DialogDescription>
                        </div>
                    </DialogHeader>

                    <div className="p-8 max-h-[60vh] overflow-y-auto space-y-6 scrollbar-thin">
                        <article className="prose prose-sm prose-slate max-w-none prose-headings:font-black prose-headings:tracking-tight prose-a:text-indigo-600">
                            {evidenceResult ? (
                                <div className="whitespace-pre-wrap leading-relaxed space-y-4">
                                    {evidenceResult.split('\n\n').map((paragraph: string, i: number) => {
                                        if (paragraph.startsWith('#')) {
                                            const level = paragraph.match(/^#+/)?.[0].length || 1;
                                            const text = paragraph.replace(/^#+\s/, '');
                                            if (level === 1 || level === 2) return <h3 key={i} className="text-lg font-black text-slate-800 mt-6 mb-2">{text}</h3>;
                                            return <h4 key={i} className="text-base font-bold text-slate-700 mt-4 mb-2">{text}</h4>;
                                        }
                                        if (paragraph.startsWith('-')) {
                                            const items = paragraph.split('\n');
                                            return (
                                                <ul key={i} className="list-disc list-inside space-y-2 pl-2">
                                                    {items.map((item, j) => <li key={j} className="text-slate-600">{item.replace(/^-\s*/, '')}</li>)}
                                                </ul>
                                            );
                                        }
                                        // Quick bold parsing
                                        const boldParsed = paragraph.split(/(\*\*.*?\*\*)/g).map((part, index) => {
                                            if (part.startsWith('**') && part.endsWith('**')) {
                                                return <strong key={index} className="font-bold text-slate-800">{part.slice(2, -2)}</strong>;
                                            }
                                            return part;
                                        });

                                        return <p key={i} className="text-slate-600 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">{boldParsed}</p>;
                                    })}
                                </div>
                            ) : (
                                <div className="animate-pulse space-y-4">
                                    <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                                    <div className="h-4 bg-slate-100 rounded w-full"></div>
                                    <div className="h-4 bg-slate-100 rounded w-5/6"></div>
                                </div>
                            )}
                        </article>
                    </div>

                    <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 sm:justify-start">
                        <Button variant="outline" onClick={() => setEvidenceModalOpen(false)} className="rounded-xl font-bold uppercase tracking-widest text-[10px] h-12 px-6">Fechar Leitura</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </AccordionItem>
    );
}
