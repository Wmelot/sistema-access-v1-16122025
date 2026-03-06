"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { Bot, Mic, Square, Sparkles, Loader2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { generateStructuredHma } from '@/app/actions/copilot-ai';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MEDICATIONS_DATA, MED_DESCRIPTIONS } from '@/utils/medication-db'; // For fuzzy matching medications

interface AxiomCopilotProps {
    specialty?: string;
    formSchemaName?: string;
    onStatusChange?: (isListening: boolean) => void;
    basePath?: string; // Optional base path for fields (e.g., 'hma' vs 'anamnesis')
    language?: 'pt-BR' | 'en-US';
    compact?: boolean;
}

const PLACEHOLDER_QUESTIONS = [
    "qual é o motivo de você procurar a fisioterapia hoje",
    "qual o motivo de você procurar a fisioterapia hoje",
    "há quanto tempo esses sintomas começaram",
    "foi um início súbito ou progressivo",
    "quais posições ou atividades pioram a dor",
    "o que você faz que traz algum alívio",
    "como isso está limitando sua rotina",
    "já fez algum tratamento prévio",
    "qual é o motivo de se procurar fisioterapia hoje",
    "tem quanto tempo que você está sentindo essa dor",
    "se tivesse que dar uma nota para essa dor"
];

const REGION_KEYWORDS = [
    { id: "coluna_lombar", terms: ["dor na lombar", "dor no fundo das costas", "dor na coluna", "ciático", "dor nas costas", "travou a coluna"] },
    { id: "coluna_cervical", terms: ["dor na cervical", "dor no pescoço", "dor na nuca", "torcicolo", "cervicalgia"] },
    { id: "ombro", terms: ["dor no ombro", "machuquei o ombro", "dor na escápula", "manguito"] },
    { id: "joelho", terms: ["dor no joelho", "machuquei o joelho", "dor na patela"] },
    { id: "tornozelo_pe", terms: ["dor no tornozelo", "dor no pé", "dor no calcanhar", "machuquei o pé", "fáscia", "esporão"] },
    { id: "quadril", terms: ["dor no quadril", "dor na virilha", "dor na bacia", "dor no fêmur"] },
    { id: "cotovelo_mao", terms: ["dor no cotovelo", "dor na mão", "dor no punho", "dor no dedo"] },
    { id: "insensitive_foot", terms: ["diabetes", "diabético", "diabética", "perda de sensibilidade", "amputação", "ferida no pé", "insensível"] },
];

export function AxiomCopilot({
    specialty = "Fisioterapeuta Sênior PBE",
    formSchemaName = "PBE 5.0",
    onStatusChange,
    basePath,
    language = 'pt-BR',
    compact = false
}: AxiomCopilotProps) {
    const { setValue, watch, getValues } = useFormContext();

    // Effective field paths based on form version
    const isPalmilha = formSchemaName?.toLowerCase().includes('palmilha');
    const regionsPath = basePath ? `${basePath}.mainRegions` : (isPalmilha ? 'hma.mainRegions' : 'anamnesis.mainRegions');
    const qpPath = basePath ? `${basePath}.qp` : (isPalmilha ? 'hma.qp' : 'anamnesis.qp');
    const hmaPath = basePath ? (basePath === 'hma' ? 'hma.history' : `${basePath}.hma`) : (isPalmilha ? 'hma.history' : 'anamnesis.hma');
    const evaPath = basePath ? `${basePath}.eva` : (isPalmilha ? 'hma.eva' : 'anamnesis.eva');

    // Mappings for the new data points:
    const medsPath = isPalmilha ? 'history.meds' : 'clinical.meds';
    const comorbiditiesPath = isPalmilha ? 'history.comorbidities' : 'clinical.comorbidities';
    const efepPath = isPalmilha ? 'efep' : 'functionality.efep';

    // Helper for fuzzy matching medications
    const findMedication = useCallback((spoken: string) => {
        const s = spoken.toLowerCase().trim();
        const found = MEDICATIONS_DATA.find(m =>
            m.activePrinciple.toLowerCase().includes(s) ||
            m.tradeNames.some(t => t.toLowerCase().includes(s))
        );
        if (found) return `${found.activePrinciple} (${found.tradeNames.join(', ')})`;
        return spoken; // Fallback to what was spoken if not found in DB
    }, []);

    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [internalTranscript, setInternalTranscript] = useState("");
    const [hasQpFilled, setHasQpFilled] = useState(false);
    const [lastRawTranscript, setLastRawTranscript] = useState<string | null>(null);

    // Backup to local storage on load
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('axiom-copilot-draft');
            if (saved && saved.trim() !== '') {
                setInternalTranscript(saved);
                toast.info("Rascunho recuperado", { description: "Uma gravação incompleta foi restaurada." });
            }
        }
    }, []);

    const processRef = useRef<any>(null);
    const isListeningRef = useRef(isListening);
    const onStatusChangeRef = useRef(onStatusChange);

    useEffect(() => {
        isListeningRef.current = isListening;
        onStatusChangeRef.current = onStatusChange;
    }, [isListening, onStatusChange]);

    const recognitionRef = useRef<any>(null);

    const processTranscriptChunk = useCallback((chunk: string) => {
        const text = chunk.toLowerCase();

        // Removed early QP filling to let the AI structurize it cleanly.

        // 2. Keyword detection for regions/diabetes
        const currentRegions = getValues(regionsPath) || [];
        const newRegions = [...currentRegions];
        let changed = false;

        REGION_KEYWORDS.forEach(r => {
            if (r.terms.some(term => text.includes(term))) {
                if (!newRegions.includes(r.id)) {
                    newRegions.push(r.id);
                    changed = true;
                    toast.info(`Informação Identificada: ${r.id.replace('_', ' ').toUpperCase()}`, {
                        icon: <Zap className="w-4 h-4 text-blue-500" />,
                        duration: 2000
                    });
                }
            }
        });

        if (changed) {
            setValue(regionsPath, newRegions);
        }

        // We DO NOT set HMA value here anymore to keep placeholder visible
        setInternalTranscript(prev => {
            const updated = prev + " " + chunk;
            localStorage.setItem('axiom-copilot-draft', updated);
            return updated;
        });
    }, [getValues, qpPath, regionsPath, setValue, hasQpFilled]);

    useEffect(() => {
        processRef.current = processTranscriptChunk;
    }, [processTranscriptChunk]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.lang = language || 'pt-BR';
                recognition.continuous = true;
                recognition.interimResults = true;

                recognition.onresult = (event: any) => {
                    let finalTranscript = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript;
                        }
                    }

                    if (finalTranscript && processRef.current) {
                        processRef.current(finalTranscript);
                    }
                };

                recognition.onerror = (event: any) => {
                    console.error("Speech recognition error", event.error);
                    if (event.error === 'not-allowed') {
                        toast.error("Microfone bloqueado", { description: "Permita o acesso ao microfone nas configurações do navegador." });
                    }
                    if (event.error !== 'no-speech') {
                        setIsListening(false);
                        onStatusChangeRef.current?.(false);
                    }
                };

                recognition.onend = () => {
                    if (isListeningRef.current) {
                        try {
                            recognition.start();
                        } catch (e) { }
                    }
                };

                recognitionRef.current = recognition;

                return () => {
                    try {
                        recognition.stop();
                    } catch (e) { }
                };
            }
        }
    }, [language]);

    const processTranscript = async (text: string) => {
        setIsProcessing(true);
        try {
            const response = await generateStructuredHma(text, specialty);

            if (response.success && response.data) {
                const { qp, hma, eva, raw, medications, comorbidities, activities } = response.data as any;

                if (qp) {
                    setValue(qpPath, qp, { shouldDirty: true });
                    setHasQpFilled(true);
                }
                if (hma) {
                    setValue(hmaPath, hma, { shouldDirty: true });
                }
                if (eva !== null && typeof eva === 'number' && eva >= 0 && eva <= 10) {
                    setValue(evaPath, [eva], { shouldDirty: true });
                    toast.success(`Nível de dor (EVA ${eva}) mapeado com sucesso!`);
                }

                // Medications mapping
                if (medications && Array.isArray(medications) && medications.length > 0) {
                    let currentMeds = getValues(medsPath) || [];
                    if (!Array.isArray(currentMeds)) currentMeds = [];
                    const structuredMeds = medications.map((m: string) => {
                        const matchedName = findMedication(m);
                        const desc = MED_DESCRIPTIONS[matchedName] || "Extraído via IA Copilot";
                        return { name: matchedName, dose: "", description: desc };
                    });
                    setValue(medsPath, [...currentMeds, ...structuredMeds], { shouldDirty: true });
                }

                // Comorbidities mapping
                if (comorbidities && Array.isArray(comorbidities) && comorbidities.length > 0) {
                    let currentCom = getValues(comorbiditiesPath) || [];
                    if (!Array.isArray(currentCom)) currentCom = [];
                    const newCom = [...new Set([...currentCom, ...comorbidities])];
                    setValue(comorbiditiesPath, newCom, { shouldDirty: true });
                }

                // Activities (EFEP) mapping
                if (activities && Array.isArray(activities) && activities.length > 0) {
                    let currentEfep = getValues(efepPath) || [];
                    if (!Array.isArray(currentEfep)) currentEfep = [];
                    currentEfep = currentEfep.filter((e: any) => e.activity && e.activity.trim() !== "");
                    const structuredActs = activities.slice(0, 3).map((a: string) => ({ activity: a, score: "" }));
                    setValue(efepPath, [...currentEfep, ...structuredActs], { shouldDirty: true });
                }

                setLastRawTranscript(raw || text);
                toast.success("Anamnese Estruturada!", {
                    description: "A inteligência artificial processou os dados com sucesso.",
                    icon: <Sparkles className="w-4 h-4 text-emerald-500" />
                });
                localStorage.removeItem('axiom-copilot-draft');
                setInternalTranscript("");
            } else {
                setLastRawTranscript(text);
                toast.error("Erro no Processamento AI", {
                    description: "Não conseguimos estruturar os dados, mas sua transcrição foi salva.",
                    duration: 10000
                });
            }
        } catch (error) {
            console.error("Copilot Process Error:", error);
            setLastRawTranscript(text);
            toast.error("Erro Inesperado", { description: "Falha ao processar áudio." });
        } finally {
            setIsProcessing(false);
        }
    };

    const toggleListen = () => {
        if (!recognitionRef.current) {
            toast.error("Navegador não compatível", { description: "Seu navegador não suporta reconhecimento de voz direto." });
            return;
        }

        if (!isListening) {
            setIsListening(true);
            onStatusChange?.(true);
            setInternalTranscript("");
            setHasQpFilled(false);
            recognitionRef.current.start();
            toast.success("Assistente de IA Ativado", {
                description: `Aguardando motivo da consulta. Detecção de sinais clínicos ativa.`
            });
        } else {
            setIsListening(false);
            onStatusChange?.(false);
            recognitionRef.current.stop();
            setIsProcessing(true);

            toast.info("Processando Consulta...", {
                description: "Refinando termos técnicos e estruturando anamnese..."
            });

            // Enhanced clinical AI refinement using real Action
            setTimeout(async () => {
                const textToProcess = internalTranscript.trim();
                if (textToProcess.length > 5) {
                    processTranscript(textToProcess);
                } else {
                    toast.info("Gravação muito curta", { description: "Nenhuma anamnese gerada." });
                    setIsProcessing(false);
                }
            }, 500);
        }
    };

    return (
        <div className={cn("flex items-center gap-2", compact && "w-full")}>
            {isListening && !compact && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-full animate-pulse shadow-sm">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                    </span>
                    <span className="text-[10px] font-black text-rose-700 uppercase tracking-widest">Ouvindo Paciente...</span>
                </div>
            )}

            <Button
                type="button"
                onClick={toggleListen}
                className={cn(
                    "relative h-12 px-6 rounded-full font-black flex items-center justify-center gap-3 shadow-xl transition-all duration-500 overflow-hidden group border-none",
                    compact ? "h-11 px-4 rounded-xl shadow-none border border-white/10" : "",
                    (!compact || !lastRawTranscript) && "flex-1 w-full",
                    (compact && lastRawTranscript && !isListening) && "flex-1",
                    isListening
                        ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200 ring-4 ring-rose-600/10"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200",
                    lastRawTranscript && !isListening && !compact && "px-4 gap-2 text-sm max-w-[calc(100%-60px)]"
                )}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : isListening ? (
                    <Square className="w-4 h-4 fill-current animate-pulse text-white" />
                ) : (
                    <Mic className={cn("w-5 h-5", compact && "w-4 h-4")} />
                )}

                <div className="flex flex-col items-start leading-none text-left overflow-hidden">
                    <span className={cn("text-[10px] uppercase font-black tracking-widest truncate w-full", compact && "text-[9px]")}>
                        {isProcessing ? "Mapeando..." : isListening ? "Pausar" : lastRawTranscript ? "Assistente" : "Assistente de IA"}
                    </span>
                    {!isProcessing && !isListening && !lastRawTranscript && (
                        <span className={cn("text-[8px] opacity-70 font-bold uppercase tracking-tighter text-indigo-200", compact && "text-[7px]")}>
                            Modo Clínico Ativado
                        </span>
                    )}
                </div>

                {!isListening && !isProcessing && (
                    <Sparkles className={cn("w-3.5 h-3.5 text-indigo-200 opacity-60 group-hover:scale-125 transition-transform", compact && "w-3 h-3")} />
                )}
            </Button>

            {lastRawTranscript && !isListening && (
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="icon" className={cn(
                            "h-12 w-12 rounded-full border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all shrink-0 ml-1",
                            compact && "h-11 w-11 rounded-xl bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white ml-2"
                        )}>
                            <Square className="h-4 w-4 shrink-0" />
                            <span className="sr-only">Ver Transcrição Bruta</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Transcrição Bruta (Sem Cortes)</DialogTitle>
                            <DialogDescription>
                                Esta é a gravação exatamente como foi capturada, antes da IA remover saudações e amenidades.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="mt-4 border border-slate-100 rounded-2xl bg-slate-50/50 p-6">
                            <ScrollArea className="h-[400px] w-full pr-4">
                                <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                                    {lastRawTranscript}
                                </p>
                            </ScrollArea>
                        </div>
                        <DialogFooter className="mt-4 flex gap-2">
                            <Button
                                variant="outline"
                                className="flex-1 rounded-xl font-bold"
                                onClick={() => {
                                    navigator.clipboard.writeText(lastRawTranscript);
                                    toast.success("Copiado para a área de transferência!");
                                }}
                            >
                                Copiar Texto
                            </Button>
                            <Button
                                className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2"
                                disabled={isProcessing}
                                onClick={() => processTranscript(lastRawTranscript)}
                            >
                                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                Tentar Estruturar Novamente
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
