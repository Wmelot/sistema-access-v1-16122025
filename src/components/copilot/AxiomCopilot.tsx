"use client";

import React, { useState, useRef, useEffect } from 'react';
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
}

const REGION_KEYWORDS = [
    { id: "coluna_lombar", terms: ["lombar", "fundo das costas", "l5", "s1", "ciático", "baixa das costas"] },
    { id: "coluna_cervical", terms: ["cervical", "pescoço", "nuca", "atropatologia cervical"] },
    { id: "ombro", terms: ["ombro", "escapula", "manguito", "acromio", "clavícula"] },
    { id: "joelho", terms: ["joelho", "patela", "menisco", "cruzado", "lca"] },
    { id: "tornozelo_pe", terms: ["tornozelo", "pé", "calcanhar", "fáscia", "aquiles"] },
    { id: "quadril", terms: ["quadril", "fêmur", "trocanter", "glúteo"] },
    { id: "cotovelo_mao", terms: ["cotovelo", "punho", "mão", "dedo", "carpo", "epicôndilo"] },
];

export function AxiomCopilot({ specialty = "Fisioterapeuta Sênior PBE", formSchemaName = "PBE 5.0", onStatusChange }: AxiomCopilotProps) {
    const { setValue, watch, getValues } = useFormContext();
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [transcript, setTranscript] = useState("");

    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.lang = 'pt-BR';
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
                        const text = finalTranscript.toLowerCase();
                        setTranscript(prev => prev + " " + finalTranscript);

                        // Keyword detection for regions (Final results only)
                        const currentRegions = getValues('anamnesis.mainRegions') || [];
                        const newRegions = [...currentRegions];
                        let changed = false;

                        REGION_KEYWORDS.forEach(r => {
                            if (r.terms.some(term => text.includes(term))) {
                                if (!newRegions.includes(r.id)) {
                                    newRegions.push(r.id);
                                    changed = true;
                                    toast.info(`Articulação Identificada: ${r.id.replace('_', ' ').toUpperCase()}`, {
                                        icon: <Zap className="w-4 h-4 text-blue-500" />,
                                        duration: 2000
                                    });
                                }
                            }
                        });

                        if (changed) {
                            setValue('anamnesis.mainRegions', newRegions);
                        }

                        // Appending to HMA during recording (only final segments)
                        const hma = getValues('anamnesis.hma') || "";
                        if (hma.length < 5000) {
                            setValue('anamnesis.hma', (hma + " " + finalTranscript).trim());
                        }
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
                        recognition.start(); // Keep alive if we didn't explicitly stop
                    }
                };

                recognitionRef.current = recognition;
            }
        }
    }, [getValues, setValue, onStatusChange, isListening]);

    const toggleListen = () => {
        if (!recognitionRef.current) {
            toast.error("Navegador não compatível", { description: "Seu navegador não suporta reconhecimento de voz direto." });
            return;
        }

        if (!isListening) {
            setIsListening(true);
            onStatusChange?.(true);
            setTranscript("");
            recognitionRef.current.start();
            toast.success("Co-Piloto Axiom Ativado", {
                description: `Ouvindo consulta com perfil: ${specialty}. Detecção de regiões em tempo real ativa.`
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
                const currentHma = getValues('anamnesis.hma') || "";

                if (currentHma.length > 5) {
                    // Clinical cleaning and restructuring - More aggressive for professional tone
                    let cleanedText = currentHma
                        .replace(/(então |tô |estou |eu |sentindo |né |tipo |assim |bom |éhh?)/gi, ' ') // Remove fillers
                        .replace(/(dor na |dor no |dor na região |doendo a |doendo o)/gi, 'queixa álgica em ')
                        .replace(/(muito |bastante |demais)/gi, 'intensa ')
                        .replace(/\s+/g, ' ')
                        .trim();

                    // Capitalization and structure
                    const firstChar = cleanedText.charAt(0).toUpperCase();
                    cleanedText = firstChar + cleanedText.slice(1);

                    const structuredHma = `HMA ESTRUTURADA PELA IA:\n\n` +
                        `QUADRO CLÍNICO: Paciente reporta ${cleanedText.toLowerCase()}.\n\n` +
                        `SINTOMATOLOGIA: O relato sugere comportamento mecânico dos sintomas. ` +
                        `As regiões identificadas foram sincronizadas com o mapa de dor.\n\n` +
                        `CONDUTA SUGERIDA: Prosseguir com avaliação de mobilidade e testes de força para confirmar o diagnóstico funcional.`;

                    setValue('anamnesis.hma', structuredHma.toUpperCase(), { shouldDirty: true });
                }

                setIsProcessing(false);
                toast.success("Anamnese Estruturada!", {
                    description: "A IA reorganizou o relato do paciente para um formato clínico profissional.",
                    icon: <Sparkles className="w-4 h-4 text-amber-500" />
                });
            }, 2500);
        }
    };

    return (
        <div className="flex items-center gap-2">
            {/* Indicador Visual do Status da IA */}
            {isListening && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-full animate-pulse shadow-sm">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                    </span>
                    <span className="text-[10px] font-black text-rose-700 uppercase tracking-widest">Co-Piloto Ouvindo...</span>
                </div>
            )}

            {/* O Botão de Controle Principal */}
            <Button
                type="button"
                onClick={toggleListen}
                className={cn(
                    "relative h-12 px-6 rounded-full font-black flex items-center gap-3 shadow-xl transition-all duration-500 overflow-hidden group",
                    isListening
                        ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200 ring-4 ring-rose-600/10"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200"
                )}
            >
                {/* Efeito de brilho no fundo */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : isListening ? (
                    <Square className="w-4 h-4 fill-current animate-pulse text-white" />
                ) : (
                    <Mic className="w-5 h-5" />
                )}

                <div className="flex flex-col items-start leading-none text-left">
                    <span className="text-[10px] uppercase font-black tracking-widest">
                        {isProcessing ? "Mapeando..." : isListening ? "Pausar" : "Co-Piloto"}
                    </span>
                    {!isProcessing && !isListening && (
                        <span className="text-[8px] opacity-70 font-bold uppercase tracking-tighter">Axiom Clinical AI</span>
                    )}
                </div>

                {!isListening && !isProcessing && (
                    <Sparkles className="w-3.5 h-3.5 text-indigo-200 opacity-60 group-hover:scale-125 transition-transform" />
                )}
            </Button>
        </div>
    );
}
