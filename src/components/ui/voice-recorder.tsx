"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Mic, Square, Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface VoiceRecorderProps {
    onTranscriptionComplete: (text: string) => void
    className?: string
}

export function VoiceRecorder({ onTranscriptionComplete, className }: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream)
            mediaRecorderRef.current = mediaRecorder
            chunksRef.current = []

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data)
                }
            }

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
                await transcribeAudio(audioBlob)

                // Stop all tracks to release microphone
                stream.getTracks().forEach(track => track.stop())
            }

            mediaRecorder.start()
            setIsRecording(true)
        } catch (error) {
            console.error("Error accessing microphone:", error)
            toast.error("Erro ao acessar o microfone. Verifique as permissões.")
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            setIsProcessing(true)
        }
    }

    const transcribeAudio = async (audioBlob: Blob) => {
        try {
            const formData = new FormData()
            formData.append('file', audioBlob, 'audio.webm')
            // Add model if needed, but endpoint defaults to whisper-1

            const response = await fetch('/api/openai/transcribe', {
                method: 'POST',
                body: formData
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Erro na transcrição')
            }

            if (data.text) {
                onTranscriptionComplete(data.text)
                toast.success("Texto transcrito com sucesso!")
            } else {
                toast.warning("Nenhum texto detectado.")
            }

        } catch (error) {
            console.error("Transcription error:", error)
            toast.error("Erro ao transcrever áudio.")
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className={className}>
            {isProcessing ? (
                <Button variant="outline" disabled className="gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-xs">Processando...</span>
                </Button>
            ) : isRecording ? (
                <Button
                    variant="destructive"
                    onClick={stopRecording}
                    className="gap-2 animate-pulse"
                >
                    <Square className="h-4 w-4 fill-current" />
                    Parar Grav.
                </Button>
            ) : (
                <Button
                    variant="outline"
                    onClick={startRecording}
                    className="gap-2 border-primary/20 hover:bg-primary/5 text-primary"
                    title="Gravar Áudio (Whisper AI)"
                >
                    <Mic className="h-4 w-4" />
                </Button>
            )}
        </div>
    )
}
