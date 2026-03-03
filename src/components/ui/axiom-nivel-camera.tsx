"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, X, Check, RefreshCw, ZapOff, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface AxiomNivelCameraProps {
    open: boolean;
    onClose: () => void;
    onCapture: (base64Image: string) => void;
    title?: string;
}

export function AxiomNivelCamera({ open, onClose, onCapture, title = "Captura de Postura" }: AxiomNivelCameraProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [orientationRequired, setOrientationRequired] = useState(false);
    const [useNativeFallback, setUseNativeFallback] = useState(false);

    // Sensor States
    const [alpha, setAlpha] = useState<number | null>(null); // Z axis (compass)
    const [beta, setBeta] = useState<number | null>(null);   // X axis (front/back tilt - PITCH)
    const [gamma, setGamma] = useState<number | null>(null); // Y axis (left/right tilt - ROLL)
    const [isLevel, setIsLevel] = useState(false);

    // Tolerância para ambos os eixos (graus p/ frente-tras e lado-lado) - Aumentada de 3 para 4 a pedido
    const TOLERANCE_PITCH = 4;
    const TOLERANCE_ROLL = 4;

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }, [stream]);

    // Check if we can use getUserMedia (requires HTTPS or localhost)
    const canUseGetUserMedia = typeof navigator !== 'undefined' &&
        navigator.mediaDevices &&
        typeof navigator.mediaDevices.getUserMedia === 'function' &&
        (window.location.protocol === 'https:' || window.location.hostname === 'localhost');

    const handleNativeFileCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result as string;
            setCapturedImage(base64);
        };
        reader.readAsDataURL(file);
        // Reset input so same file can be re-selected
        e.target.value = '';
    };

    const startCamera = async () => {
        setError(null);
        setCapturedImage(null);

        // If getUserMedia is not available (HTTP over local network), use native fallback
        if (!canUseGetUserMedia) {
            console.warn('[AxiomCamera] getUserMedia not available (likely HTTP). Using native file input fallback.');
            setUseNativeFallback(true);
            // Automatically trigger the native camera
            setTimeout(() => fileInputRef.current?.click(), 100);
            return;
        }

        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: 'environment' },
                    width: { ideal: 3840 },
                    height: { ideal: 2160 },
                },
                audio: false
            });

            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err: any) {
            console.error("Erro ao acessar câmera:", err);
            setUseNativeFallback(true);
            setError("Não conseguimos acessar sua câmera traseira. Use o botão abaixo para tirar a foto pela câmera nativa.");
        }
    };

    // Solicitar Permissão de Sensores Especiais no iOS 13+
    const requestDeviceOrientation = async () => {
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
            try {
                const permissionState = await (DeviceOrientationEvent as any).requestPermission();
                if (permissionState === 'granted') {
                    setOrientationRequired(false);
                    startSensors();
                } else {
                    setError("Permissão para usar os sensores de nível (giroscópio) foi negada.");
                }
            } catch (err) {
                console.error(err);
                setError(String(err));
            }
        } else {
            // Android ou navegadores antigos que não precisam pedir via Modal de usuário
            setOrientationRequired(false);
            startSensors();
        }
    };

    const startSensors = useCallback(() => {
        let lastBeta = 90;
        let lastGamma = 0;
        let isInitialized = false;

        const handleOrientation = (event: DeviceOrientationEvent) => {
            // Se o aparelho estiver em Portrait (em pé):
            // Beta mede o quão tombado pra frente/trás (+90 é reta. 0 é flat na mesa tela p cima)
            // Gamma mede se está torto para esquerda/direita (0 é reto vertical. 90 ou -90 é deitado lateral)

            // Para deixar o celular exato de pé na mão apontado pro paciente:
            // Beta (Frente/Tras Pitch) deveria ser exatamente 90 graus (ou mais próximo de 90).
            // Gamma (Esquerda/Direita Roll) deveria ser exatamente 0 graus.

            let currentBeta = event.beta;
            let currentGamma = event.gamma;

            // Tratamento simplificado para evitar Nulls em emuladores 
            if (currentBeta === null || currentGamma === null) return;

            // Se o celular tiver sido virado de cabeça para baixo
            if (currentBeta > 90) currentBeta = 180 - currentBeta;
            if (currentBeta < -90) currentBeta = -180 - currentBeta;

            // Filtro Passa Baixa (Low-pass filter) para suavizar a tremedeira
            if (!isInitialized) {
                lastBeta = currentBeta;
                lastGamma = currentGamma;
                isInitialized = true;
            } else {
                // Fator de Suavização: 0.15 (15% novo valor, 85% valor antigo) = Mais suave e menos nervoso
                lastBeta = lastBeta + (currentBeta - lastBeta) * 0.15;
                lastGamma = lastGamma + (currentGamma - lastGamma) * 0.15;
            }

            setAlpha(event.alpha);
            setBeta(lastBeta);
            setGamma(lastGamma);

            // Calcula o desvio (Diferença para BETA = 90 e GAMMA = 0) usando os valores suavizados
            const pitchDeviation = Math.abs(90 - Math.abs(lastBeta)); // O quão longe de 90
            const rollDeviation = Math.abs(lastGamma); // O quão longe de 0

            if (pitchDeviation <= TOLERANCE_PITCH && rollDeviation <= TOLERANCE_ROLL) {
                setIsLevel(true);
            } else {
                setIsLevel(false);
            }
        };

        window.addEventListener('deviceorientation', handleOrientation, true);
        return () => window.removeEventListener('deviceorientation', handleOrientation, true);
    }, []);


    // Ao abrir Modal
    useEffect(() => {
        if (open) {
            // No iOS 13+, startCamera deve rodar sem pedir nada restrito, as o DeviceOrientation precisa de clique
            if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
                setOrientationRequired(true);
                startCamera(); // Liga câmera, mas espera clique p/ sensores
            } else {
                startCamera();
                startSensors();
            }
        } else {
            stopCamera();
            setCapturedImage(null);
        }

        return () => stopCamera();
    }, [open]);

    // Cleanup dos Sensores
    useEffect(() => {
        return () => {
            window.removeEventListener('deviceorientation', () => { });
        };
    }, []);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            // Força a resolução máxima capturada pelo stream a ir pro canvas
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const base64 = canvas.toDataURL('image/jpeg', 0.95); // Alta qualidade
                setCapturedImage(base64);
                stopCamera();
            }
        }
    };

    const confirmCapture = () => {
        if (capturedImage) {
            onCapture(capturedImage);
            onClose();
        }
    };

    const retakeCapture = () => {
        setCapturedImage(null);
        startCamera();
    };

    if (!open) return null;

    // ----- CÁLCULO VISUAL DO NÍVEL (MIRA HUD) -----
    // Vamos traduzir o Beta e Gamma em X,Y na tela pra cruzar os círculos.
    // O alvo ("A") no centro e a Bolhinha verde ("B") que mexe.

    // Y (Cima/Baixo) = Diferença do 90 no Beta.
    let crosshairY = 0;
    if (beta !== null) {
        const pitchDiff = 90 - Math.abs(beta);
        // 1 grau = 4px (sensibilidade)
        crosshairY = pitchDiff * 10;
    }

    // X (Esq/Dir) = Gamma puro
    let crosshairX = 0;
    if (gamma !== null) {
        crosshairX = gamma * 10;
    }

    // Trava para a bolinha não sumir muito da tela visualmente
    if (crosshairY > 150) crosshairY = 150;
    if (crosshairY < -150) crosshairY = -150;
    if (crosshairX > 150) crosshairX = 150;
    if (crosshairX < -150) crosshairX = -150;


    return (
        <div className="fixed inset-0 z-[200] bg-black text-white flex flex-col font-sans">
            {/* HUD Header */}
            <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10 bg-gradient-to-b from-black/30 to-transparent pointer-events-none">
                <div className="pointer-events-auto">
                    <h2 className="text-sm font-black uppercase tracking-widest text-emerald-400 drop-shadow-md">{title}</h2>
                    <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest drop-shadow">WebRTC 4K Lens</p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md pointer-events-auto">
                    <X className="h-6 w-6" />
                </Button>
            </div>

            <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
                {/* Hidden native file input for fallback */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleNativeFileCapture}
                />
                {error && !capturedImage ? (
                    <div className="p-8 text-center max-w-sm">
                        <ZapOff className="h-12 w-12 text-rose-500 mx-auto mb-4" />
                        <h3 className="text-lg font-black text-white mb-2">Erro de Câmera</h3>
                        <p className="text-sm text-slate-400 font-medium mb-6">{error}</p>
                        <div className="flex flex-col gap-3">
                            <Button onClick={() => fileInputRef.current?.click()} className="bg-emerald-600 hover:bg-emerald-700 text-white font-black">
                                <Camera className="h-4 w-4 mr-2" />
                                Tirar Foto (Nativo)
                            </Button>
                            <Button variant="secondary" onClick={startCamera}>Tentar Novamente</Button>
                        </div>
                    </div>
                ) : useNativeFallback && !capturedImage ? (
                    <div className="p-8 text-center max-w-sm">
                        <Camera className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                        <h3 className="text-lg font-black text-white mb-2">Câmera Nativa</h3>
                        <p className="text-sm text-slate-400 font-medium mb-6">Estamos usando a câmera nativa do seu dispositivo. Clique abaixo para capturar.</p>
                        <Button onClick={() => fileInputRef.current?.click()} className="bg-emerald-600 hover:bg-emerald-700 text-white font-black h-14 rounded-2xl w-full">
                            <Camera className="h-5 w-5 mr-2" />
                            Abrir Câmera
                        </Button>
                    </div>
                ) : orientationRequired ? (
                    <div className="p-8 text-center max-w-sm bg-slate-900 rounded-[2.5rem] border border-white/10">
                        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/50">
                            <RefreshCw className="h-6 w-6 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-black text-white mb-2 leading-tight">Calibrador 3D<br /> Necessário</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-8 leading-relaxed">
                            No iPhone, você precisa liberar o uso dos sensores para podermos montar a mira 3D na tela.
                        </p>
                        <Button
                            onClick={requestDeviceOrientation}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest h-14 rounded-2xl shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                        >
                            Liberar Nível 3D
                        </Button>
                    </div>
                ) : capturedImage ? (
                    <img src={capturedImage} alt="Foto Capturada" className="w-full h-full object-cover" />
                ) : (
                    <>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <canvas ref={canvasRef} className="hidden" />

                        {/* MIRA NATIVA HUD (DESENHADA POR CIMA DO VIDEO) */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            {/* Alvo Fixo Centro (A) */}
                            <div className={cn(
                                "absolute w-20 h-20 rounded-full border-[3px] transition-colors duration-300",
                                isLevel ? "border-emerald-500 scale-110 shadow-[0_0_20px_rgba(16,185,129,0.5)] bg-emerald-500/10" : "border-white/50 border-dashed"
                            )}></div>

                            {/* Linha Fina Central (Crosshair) */}
                            <div className="absolute w-[120%] h-px bg-white/20"></div>
                            <div className="absolute h-[120%] w-px bg-white/20"></div>

                            {/* Bolhinha Que Flutua Conforme Sensores (B) */}
                            {beta !== null && gamma !== null && (
                                <div
                                    className={cn(
                                        "absolute w-12 h-12 rounded-full border-2 transition-transform duration-100 flex items-center justify-center backdrop-blur-sm",
                                        isLevel ? "bg-emerald-500 border-white" : "bg-white/20 border-white"
                                    )}
                                    style={{ transform: `translate(${crosshairX}px, ${-crosshairY}px)` }} // Negativo no Y pra inverter se ele empina
                                >
                                    {isLevel ? <CheckCircle2 className="w-6 h-6 text-white" /> : <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                </div>
                            )}

                        </div>

                        {/* Indicadores de Grau Reais (Para o Profissional Ver) */}
                        {beta !== null && (
                            <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 flex gap-4">
                                <div className="text-center">
                                    <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest block">A/P Tilt</span>
                                    <span className="text-xs font-mono font-bold text-white">{Math.abs(90 - Math.abs(beta)).toFixed(1)}º</span>
                                </div>
                                <div className="w-px bg-white/20" />
                                <div className="text-center">
                                    <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest block">L/R Tilt</span>
                                    <span className="text-xs font-mono font-bold text-white">{Math.abs(gamma || 0).toFixed(1)}º</span>
                                </div>
                            </div>
                        )}


                        {/* Topo / Rodapé Escuros P/ Contraste */}
                        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                    </>
                )}
            </div>

            {/* Ações (Bottom) */}
            <div className="bg-black/90 border-t border-white/10 p-8 flex items-center justify-center h-32 shrink-0 z-10">
                {capturedImage ? (
                    <div className="flex items-center gap-6 w-full max-w-sm">
                        <Button variant="outline" onClick={retakeCapture} className="flex-1 bg-transparent border-white/30 text-white hover:bg-white/10 h-16 rounded-[2rem] font-black uppercase tracking-widest text-xs">
                            Recusar
                        </Button>
                        <Button onClick={confirmCapture} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white h-16 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(16,185,129,0.3)] gap-2">
                            <Check className="w-5 h-5" />
                            Utilizar
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center justify-between w-full max-w-sm px-4">
                        <div className="w-16"></div> {/* Spacer p alinhar o círculo no centro perfeito */}
                        <Button
                            size="icon"
                            variant="default"
                            onClick={handleCapture}
                            disabled={!isLevel && orientationRequired === false} // Trava disparo se nao tiver nivelado
                            className={cn(
                                "relative w-[4.5rem] h-[4.5rem] rounded-full border-4 flex items-center justify-center transition-all bg-transparent",
                                isLevel ? "border-emerald-500" : "border-white/30 grayscale opacity-50 pointer-events-none"
                            )}
                        >
                            <div className={cn(
                                "w-14 h-14 rounded-full transition-all",
                                isLevel ? "bg-emerald-500 scale-90" : "bg-white/50"
                            )}></div>

                            {!isLevel && !orientationRequired && (
                                <div className="absolute -top-10 whitespace-nowrap bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full animate-pulse shadow-md">
                                    Ache o Prumo
                                </div>
                            )}
                        </Button>
                        <div className="w-16"></div>
                    </div>
                )}
            </div>
        </div>
    );
}
