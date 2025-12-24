import { useState, useRef, useCallback } from 'react';

export function useAudioRecorder() {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);

        } catch (error) {
            console.error('Error accessing microphone:', error);
            throw error; // Let caller handle UI feedback (e.g. Permission Denied)
        }
    }, []);

    const stopRecording = useCallback(async (): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const recorder = mediaRecorderRef.current;
            if (!recorder) {
                reject(new Error("No recorder instance found"));
                return;
            }

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' }); // webm is standard for MediaRecorder
                chunksRef.current = [];
                setIsRecording(false);
                if (timerRef.current) clearInterval(timerRef.current);

                // Stop all tracks to release mic
                recorder.stream.getTracks().forEach(track => track.stop());

                resolve(blob);
            };

            recorder.stop();
        });
    }, []);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return {
        isRecording,
        recordingTime,
        startRecording,
        stopRecording,
        formatTime
    };
}
