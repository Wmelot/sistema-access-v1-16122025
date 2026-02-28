"use client";

import { useState, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mic, StopCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { transcribeAndOrganize } from "@/actions/attendance";
import { AxiomAssistantButton } from "@/components/ai/AxiomAssistantButton";

interface AudioTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    onTranscription?: (text: string) => void;
    label?: string;
}

export function AudioTextarea({ className, onTranscription, label, ...props }: AudioTextareaProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
                stream.getTracks().forEach(track => track.stop());
                await processAudio(audioBlob);
            };

            mediaRecorder.start();
            setIsRecording(true);
            toast.info("Gravando... Fale claramente.");
        } catch (error: any) {
            console.error("Mic Error:", error);
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                toast.error("Permissão negada. Clique no cadeado 🔒 na barra de endereço > Redefinir Permissões.");
            } else if (error.name === 'NotFoundError') {
                toast.error("Nenhum microfone encontrado no sistema.");
            } else if (error.name === 'NotReadableError') {
                toast.error("O microfone está sendo usado por outro programa ou está com defeito.");
            } else {
                toast.error("Erro no microfone: " + (error.message || "Verifique a conexão."));
            }
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsProcessing(true);
            toast.loading("Processando com Inteligência Artificial...");
        }
    };

    const processAudio = async (audioBlob: Blob) => {
        try {
            const base64Audio = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const result = reader.result as string;
                    resolve(result.split(',')[1] || '');
                };
                reader.onerror = reject;
                reader.readAsDataURL(audioBlob);
            });

            if (!base64Audio) {
                throw new Error("Falha ao processar arquivo de áudio.");
            }

            const result = await transcribeAndOrganize(base64Audio);

            if (result.success && result.text) {
                // If controlled component, trigger onChange via synthesized event
                if (props.onChange) {
                    const event = {
                        target: { value: result.text, name: props.name },
                        currentTarget: { value: result.text, name: props.name }
                    } as any;
                    props.onChange(event);
                }

                if (onTranscription) onTranscription(result.text);

                toast.dismiss();
                toast.success("Transcrito e Organizado!");
            } else {
                toast.dismiss();
                toast.error(result.msg || "Falha na transcrição.");
            }
        } catch (error) {
            console.error(error);
            toast.dismiss();
            toast.error("Erro ao processar áudio.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex flex-col gap-2 w-full">
            <div className="relative">
                <Textarea
                    {...props}
                    className={`min-h-[120px] pr-12 pb-10 ${className}`}
                    placeholder={props.placeholder || "Digite ou grave o relato..."}
                />

                <div className="absolute bottom-2 right-2 flex gap-2">
                    {isProcessing ? (
                        <Button type="button" size="icon" variant="ghost" disabled className="h-8 w-8 animate-spin text-purple-600">
                            <Loader2 className="w-4 h-4" />
                        </Button>
                    ) : isRecording ? (
                        <Button
                            type="button"
                            size="icon"
                            variant="destructive"
                            onClick={stopRecording}
                            className="h-8 w-8 animate-pulse rounded-full shadow-lg"
                            title="Parar Gravação"
                        >
                            <StopCircle className="w-4 h-4" />
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            size="icon"
                            variant="secondary"
                            onClick={startRecording}
                            className="h-8 w-8 rounded-full shadow hover:bg-purple-100 hover:text-purple-700 transition-colors"
                            title="Gravar com IA"
                        >
                            <Mic className="w-4 h-4" />
                        </Button>
                    )}
                </div>
                {label && <span className="absolute -top-3 left-2 bg-white px-1 text-[10px] uppercase font-bold text-slate-500">{label}</span>}

                {/* Embedded Axiom Assistant Button inside the text area container (bottom left) */}
                <div className="absolute bottom-2 left-2 z-10">
                    <AxiomAssistantButton
                        initialText={(props.value as string) || ""}
                        onGenerate={(text) => {
                            // Synthesize change event to update parent
                            if (props.onChange) {
                                const event = {
                                    target: { value: text, name: props.name },
                                    currentTarget: { value: text, name: props.name }
                                } as any;
                                props.onChange(event);
                            }
                            // Also call onTranscription if provided (some consumers might rely on this)
                            if (onTranscription) onTranscription(text);
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
