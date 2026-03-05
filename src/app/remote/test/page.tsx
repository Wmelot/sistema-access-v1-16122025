"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    RefreshCw,
    Lock,
    Unlock,
    Info,
    AlertTriangle,
    Navigation,
    RotateCcw,
    Smartphone
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function InclinometerTest() {
    const [isSupported, setIsSupported] = useState<boolean | null>(null)
    const [permissionGranted, setPermissionGranted] = useState(false)
    const [angle, setAngle] = useState(0)
    const [isFrozen, setIsFrozen] = useState(false)
    const [referenceValue, setReferenceValue] = useState(0)
    const [mode, setMode] = useState<'lunge' | 'level'>('lunge')

    // Filtro de suavização
    const lastValueRef = useRef(0)
    const smoothingFactor = 0.2

    const requestPermission = async () => {
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
            try {
                const permission = await (DeviceOrientationEvent as any).requestPermission()
                if (permission === 'granted') {
                    setPermissionGranted(true)
                }
            } catch (err) {
                console.error("Erro ao solicitar permissão:", err)
            }
        } else {
            setPermissionGranted(true)
        }
    }

    useEffect(() => {
        if (!permissionGranted || isFrozen) return

        const handleOrientation = (event: DeviceOrientationEvent) => {
            const beta = event.beta || 0   // Inclinação frontal/traseira (Eixo dos botões)
            const gamma = event.gamma || 0 // Inclinação lateral

            let rawValue = 0

            // 1. Detecção de Modo
            // Se o celular estiver a mais de 45 graus (em pé), usamos Modo Lunge (Goniômetro)
            // Se estiver mais "deitado", usamos Modo Nível (Eixo dos botões)
            const isUpright = Math.abs(beta) > 45
            const currentMode = isUpright ? 'lunge' : 'level'
            setMode(currentMode)

            if (currentMode === 'lunge') {
                // MODO LUNGE: Rotação no plano da tela (Ponteiro de relógio)
                const rad = Math.atan2(beta, gamma)
                const deg = rad * (180 / Math.PI)
                rawValue = (deg + 360) % 360
            } else {
                // MODO NÍVEL: Inclinação ao longo do eixo dos botões laterais
                // Usamos o beta diretamente, que mede o 'pitch' do aparelho
                rawValue = beta
            }

            // 2. Filtro de suavização
            const smoothedValue = (lastValueRef.current * (1 - smoothingFactor)) + (rawValue * smoothingFactor)
            lastValueRef.current = smoothedValue

            // 3. Diferencial (Zero)
            let finalOutput = 0
            if (currentMode === 'lunge') {
                let diff = smoothedValue - referenceValue
                if (diff > 180) diff -= 360
                if (diff < -180) diff += 360
                finalOutput = Math.abs(diff)
            } else {
                finalOutput = smoothedValue - referenceValue
            }

            setAngle(Number(finalOutput.toFixed(1)))
        }

        window.addEventListener('deviceorientation', handleOrientation)
        return () => window.removeEventListener('deviceorientation', handleOrientation)
    }, [permissionGranted, isFrozen, referenceValue])

    useEffect(() => {
        if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
            setIsSupported(true)
        } else {
            setIsSupported(false)
        }
    }, [])

    const toggleFreeze = (e: React.MouseEvent | React.TouchEvent) => {
        if ((e.target as HTMLElement).closest('button')) return
        setIsFrozen(!isFrozen)
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(50)
        }
    }

    const calibrateZero = () => {
        setReferenceValue(lastValueRef.current)
        setAngle(0)
        setIsFrozen(false)
        toast.success("Referência Calibrada")
    }

    if (isSupported === false) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-950 text-white text-center">
                <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
                <h1 className="text-xl font-bold mb-2">Sensores não suportados</h1>
                <p className="text-slate-400 text-sm">Use o Safari (iOS) ou Chrome (Android) com HTTPS.</p>
            </div>
        )
    }

    if (!permissionGranted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-950 text-white text-center">
                <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <Smartphone className="h-10 w-10 text-blue-500" />
                </div>
                <h1 className="text-2xl font-black mb-4 tracking-tight">AXIOM REMOTE</h1>
                <p className="text-slate-400 text-sm mb-8 max-w-[280px]">Ative os sensores para usar o celular como Goniômetro e Nível Digital.</p>
                <Button
                    onClick={requestPermission}
                    className="w-full max-w-[240px] h-14 bg-blue-600 hover:bg-blue-500 text-lg font-bold rounded-2xl shadow-lg"
                >
                    Ativar Sensores
                </Button>
            </div>
        )
    }

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-between min-h-screen p-6 transition-colors duration-500 overflow-hidden select-none touch-none",
                isFrozen ? "bg-indigo-600" : "bg-slate-950"
            )}
            onClick={toggleFreeze}
        >
            {/* ESTE CSS ABAIXO TENTA FORÇAR O LAYOUT A NÃO QUEBRAR COM O GIRO DO CELULAR */}
            <style jsx global>{`
                @media screen and (min-aspect-ratio: 1/1) {
                    .rotate-warning { display: flex !important; }
                }
            `}</style>

            {/* Overlay para forçar modo Retrato */}
            <div className="rotate-warning hidden fixed inset-0 z-50 bg-slate-950 flex-col items-center justify-center p-10 text-center">
                <RotateCcw className="h-12 w-12 text-blue-500 animate-spin mb-4" />
                <h2 className="text-white font-bold text-lg italic">Por favor, use o celular em pé</h2>
                <p className="text-slate-400 text-sm">Para maior precisão nas medidas clínicas, o modo horizontal é bloqueado.</p>
            </div>

            <div className="w-full flex justify-between items-center pt-4">
                <div className="flex flex-col text-left">
                    <span className="text-[10px] font-black tracking-widest text-blue-400 uppercase">Axiom Inclinometer</span>
                    <h2 className="text-white font-bold text-sm">
                        {mode === 'lunge' ? "Modo Goniômetro (Em pé)" : "Modo Nível (Deitado)"}
                    </h2>
                </div>
                <Badge className={cn(
                    "px-3 py-1 text-[10px] font-black uppercase",
                    isFrozen ? "bg-white text-indigo-700" : "bg-blue-600 text-white"
                )}>
                    {isFrozen ? "Trava Ativa" : "Leitura Real"}
                </Badge>
            </div>

            <div className="relative flex items-center justify-center w-full max-w-[320px] aspect-square">
                {/* Visualização de Nível vs Goniômetro */}
                {mode === 'level' ? (
                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                        <div className="w-full h-[2px] bg-white" />
                        <div className="w-[2px] h-full bg-white" />
                    </div>
                ) : (
                    <div className="absolute inset-0 rounded-full border border-slate-800 opacity-30" />
                )}

                {/* Ponteiro / Bolha de Nível */}
                {!isFrozen && (
                    <div
                        className={cn(
                            "absolute transition-transform duration-75",
                            mode === 'lunge' ? "w-[240px] h-[4px] bg-blue-500 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.6)]" : "w-full h-[1px] bg-indigo-400 border-t border-indigo-300"
                        )}
                        style={{ transform: `rotate(${mode === 'lunge' ? angle : 0}deg) translateY(${mode === 'level' ? -angle * 2 : 0}px)` }}
                    />
                )}

                <div className="flex flex-col items-center z-10">
                    <span className={cn(
                        "text-9xl font-black tracking-tighter tabular-nums transition-colors duration-500",
                        isFrozen ? "text-white" : "text-blue-500"
                    )}>
                        {angle.toFixed(1)}
                    </span>
                    <span className="text-xl font-black -mt-4 text-slate-500 tracking-widest">GRAUS</span>
                </div>

                <div className="absolute -bottom-4 bg-slate-900 border border-slate-800 p-4 rounded-full shadow-2xl">
                    {isFrozen ? (
                        <Lock className="h-6 w-6 text-white" />
                    ) : (
                        <Unlock className="h-6 w-6 text-blue-500" />
                    )}
                </div>
            </div>

            <div className="w-full grid grid-cols-2 gap-4 pb-10">
                <Button
                    variant="outline"
                    onClick={(e) => { e.stopPropagation(); calibrateZero(); }}
                    className="h-20 rounded-3xl border-slate-800 bg-slate-900 text-white text-lg font-black gap-3 hover:bg-slate-800 active:scale-95 transition-all shadow-lg"
                >
                    <RotateCcw className="h-6 w-6" />
                    Zerar
                </Button>

                <Button
                    variant="outline"
                    className="h-20 rounded-3xl border-slate-800 bg-slate-900 text-white text-lg font-black gap-3 opacity-30"
                    disabled={!isFrozen}
                >
                    <RefreshCw className="h-6 w-6" />
                    Enviar
                </Button>
            </div>

            <div className="pb-4 opacity-30 text-[9px] font-bold uppercase tracking-widest text-center">
                Aparelho deve estar em pé para Lunge <br />ou deitado para Nível de Mesa
            </div>
        </div>
    )
}
