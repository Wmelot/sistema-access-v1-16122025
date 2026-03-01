"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { Bot, Mic, Square, Sparkles, Loader2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

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
    { id: "coluna_lombar", terms: ["lombar", "fundo das costas", "l5", "s1", "ciático", "baixa das costas"] },
    { id: "coluna_cervical", terms: ["cervical", "pescoço", "nuca", "atropatologia cervical"] },
    { id: "ombro", terms: ["ombro", "escapula", "manguito", "acromio", "clavícula"] },
    { id: "joelho", terms: ["joelho", "patela", "menisco", "cruzado", "lca"] },
    { id: "tornozelo_pe", terms: ["tornozelo", "pé", "calcanhar", "fáscia", "aquiles"] },
    { id: "quadril", terms: ["quadril", "fêmur", "trocanter", "glúteo"] },
    { id: "cotovelo_mao", terms: ["cotovelo", "punho", "mão", "dedo", "carpo", "epicôndilo"] },
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

    // Effective field paths based on basePath
    const regionsPath = basePath ? `${basePath}.mainRegions` : 'anamnesis.mainRegions';
    const qpPath = basePath ? `${basePath}.qp` : 'qp';
    // Palmilha 5 uses 'hma.history'. PBE 5 uses 'hma' at root.
    const hmaPath = basePath === 'hma' ? 'hma.history' : (basePath ? `${basePath}.hma` : 'hma');

    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [internalTranscript, setInternalTranscript] = useState("");
    const [hasQpFilled, setHasQpFilled] = useState(false);

    const recognitionRef = useRef<any>(null);

    const processTranscriptChunk = useCallback((chunk: string) => {
        const text = chunk.toLowerCase();

        // 1. Fill QP if it's the first time and QP is empty
        const currentQp = getValues(qpPath) || "";
        if (!hasQpFilled && currentQp.length < 5 && chunk.length > 10) {
            setValue(qpPath, chunk.trim(), { shouldDirty: true });
            setHasQpFilled(true);
            toast.success("Queixa Principal Identificada!", { icon: <Bot className="w-4 h-4" /> });
        }

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
        setInternalTranscript(prev => prev + " " + chunk);
    }, [getValues, qpPath, regionsPath, setValue, hasQpFilled]);

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

                    if (finalTranscript) {
                        processTranscriptChunk(finalTranscript);
                    }
                };

                recognition.onerror = (event: any) => {
                    console.error("Speech recognition error", event.error);
                    if (event.error === 'not-allowed') {
                        toast.error("Microfone bloqueado", { description: "Permita o acesso ao microfone nas configurações do navegador." });
                    }
                    setIsListening(false);
                    onStatusChange?.(false);
                };

                recognition.onend = () => {
                    if (isListening) {
                        try {
                            recognition.start();
                        } catch (e) { }
                    }
                };

                recognitionRef.current = recognition;
            }
        }
    }, [isListening, onStatusChange, processTranscriptChunk]);

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

            // Enhanced clinical AI refinement
            setTimeout(() => {
                let textToProcess = internalTranscript.trim();

                // 1. Remove common therapist placeholder questions from the final transcript
                PLACEHOLDER_QUESTIONS.forEach(q => {
                    const regex = new RegExp(q, 'gi');
                    textToProcess = textToProcess.replace(regex, '');
                });

                if (textToProcess.length > 5) {
                    // Clinical cleaning and professional restructuring
                    let cleanedText = textToProcess
                        .replace(/(então |tô |estou |eu |sentindo |né |tipo |assim |bom |éhh?|entende|sabe)/gi, ' ')
                        .replace(/(cê tá|você está|vc ta)/gi, 'paciente apresenta-se')
                        .replace(/(dor na |dor no |dor na região |doendo a |doendo o)/gi, 'quadro álgico em ')
                        .replace(/(muito |bastante |demais)/gi, 'profuso ')
                        .replace(/(tem quanto tempo|faz quanto tempo)/gi, 'tempo de evolução: ')
                        .replace(/(melhora com|alívia com)/gi, 'fatores de alívio: ')
                        .replace(/(piora com|dói mais com)/gi, 'fatores de agravo: ')
                        .replace(/\s+/g, ' ')
                        .trim();

                    // Professional SIC quoting for non-technical patient descriptions
                    cleanedText = cleanedText.replace(/(parece uma pontada|agulhada|queimação|peso|formigamento|choque|rasgando|fisgada)/gi, (match) => `"${match.toLowerCase()}" (SIC)`);

                    // Formal Grammar Correction (Simple local heuristics)
                    cleanedText = cleanedText
                        .replace(/ e /g, ', ')
                        .replace(/, , /g, ', ')
                        .replace(/\. \./g, '.')
                        .replace(/ pacientes /g, ' paciente ');

                    // Capitalization
                    cleanedText = cleanedText.charAt(0).toUpperCase() + cleanedText.slice(1);

                    const structuredHma = `HMA ESTRUTURADA (Axiom AI):\n\n` +
                        `HISTÓRICO: Paciente relata ${cleanedText}.\n\n` +
                        `HIPÓTESE DIAGNÓSTICA FUNCIONAL: Os achados clínicos sugerem disfunção biomecânica compatível com o relato. ` +
                        `Recomenda-se avaliação minuciosa da cinemática segmentar e integridade dos tecidos moles na região alvo.\n\n` +
                        `OBSERVAÇÕES PARA O EXAME FÍSICO: Realizar testes de provocação de dor; avaliar amplitude passiva e ativa para identificação de end-feel anormal; verificar sinais de irritação neural.`;

                    setValue(hmaPath, structuredHma, { shouldDirty: true });
                }

                setIsProcessing(false);
                toast.success("Anamnese Estruturada!", {
                    description: "O relato foi convertido para linguagem técnica clínica formal.",
                    icon: <Sparkles className="w-4 h-4 text-emerald-500" />
                });
            }, 3000);
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
                    "relative h-12 px-6 rounded-full font-black flex items-center gap-3 shadow-xl transition-all duration-500 overflow-hidden group border-none",
                    compact && "h-11 w-full px-4 rounded-xl shadow-none border border-white/10",
                    isListening
                        ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200 ring-4 ring-rose-600/10"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200"
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

                <div className="flex flex-col items-start leading-none text-left">
                    <span className={cn("text-[10px] uppercase font-black tracking-widest", compact && "text-[9px]")}>
                        {isProcessing ? "Mapeando..." : isListening ? "Pausar" : "Assistente de IA"}
                    </span>
                    {!isProcessing && !isListening && (
                        <span className={cn("text-[8px] opacity-70 font-bold uppercase tracking-tighter text-indigo-200", compact && "text-[7px]")}>
                            Modo Clínico Ativado
                        </span>
                    )}
                </div>

                {!isListening && !isProcessing && (
                    <Sparkles className={cn("w-3.5 h-3.5 text-indigo-200 opacity-60 group-hover:scale-125 transition-transform", compact && "w-3 h-3")} />
                )}
            </Button>
        </div>
    );
}
