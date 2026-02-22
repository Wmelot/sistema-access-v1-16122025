import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Bot, Mic, Square, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface AxiomCopilotProps {
    specialty?: string;
    formSchemaName?: string;
    onStatusChange?: (isListening: boolean) => void;
}

export function AxiomCopilot({ specialty = "Fisioterapeuta Sênior PBE", formSchemaName = "Palmilha 5.0", onStatusChange }: AxiomCopilotProps) {
    const form = useFormContext();
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const toggleListen = () => {
        if (!isListening) {
            setIsListening(true);
            onStatusChange?.(true);
            toast.success("Co-Piloto Axiom Ativado", {
                description: `Ouvindo consulta com perfil: ${specialty}. O preenchimento automático está ativo em segundo plano.`
            });
            // TODO: Iniciar MediaRecorder e streaming para o Backend
        } else {
            setIsListening(false);
            onStatusChange?.(false);
            setIsProcessing(true);

            toast.info("Processando Consulta...", {
                description: "Analisando referências clínicas e mapeando para o formulário..."
            });

            // Simulação de processamento inteligente e preenchimento de campos vazios
            setTimeout(() => {
                setIsProcessing(false);
                toast.success("Preenchimento Concluído!", {
                    description: "Os campos relevantes foram atualizados com sucesso."
                });
            }, 3000);
        }
    };

    return (
        <div className="flex items-center gap-2">
            {/* Indicador Visual do Status da IA */}
            {isListening && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-full animate-in fade-in slide-in-from-right-4">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                    </span>
                    <span className="text-[10px] font-bold text-rose-700 uppercase tracking-widest">Gravando & Preenchendo...</span>
                </div>
            )}

            {/* O Botão de Controle Principal */}
            <Button
                type="button"
                onClick={toggleListen}
                className={cn(
                    "relative h-10 px-4 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all duration-500",
                    isListening
                        ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200 hover:shadow-rose-300 ring-2 ring-rose-600/20 ring-offset-2"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200"
                )}
            >
                {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : isListening ? (
                    <Square className="w-4 h-4 fill-current" />
                ) : (
                    <Mic className="w-4 h-4" />
                )}

                <span className="hidden md:inline">
                    {isProcessing ? "Mapeando Dados..." : isListening ? "Pausar Co-Piloto" : "Co-Piloto Axiom"}
                </span>

                {/* Partícula de Brilho */}
                {!isListening && !isProcessing && (
                    <Sparkles className="w-3.5 h-3.5 text-indigo-200 absolute right-2 top-1 opacity-60" />
                )}
            </Button>
        </div>
    );
}
