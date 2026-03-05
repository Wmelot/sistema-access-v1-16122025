"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    RefreshCw,
    Lock,
    Unlock,
    Info,
    AlertTriangle,
    Navigation,
    RotateCcw
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function InclinometerTest() {
    const [isSupported, setIsSupported] = useState<boolean | null>(null)
    const [permissionGranted, setPermissionGranted] = useState(false)
    const [angle, setAngle] = useState(0)
    const [isFrozen, setIsFrozen] = useState(false)
    const [referenceValues, setReferenceValues] = useState({ beta: 0, gamma: 0 })
    const [useMode, setUseMode] = useState<'vertical' | 'flat'>('vertical')

    // Refs para controle do filtro de suavização
    const lastBetaRef = useRef(0)
    const lastGammaRef = useRef(0)
    const smoothingFactor = 0.15 // Equilíbrio entre velocidade e estabilidade

    // Solicitar permissão (Necessário para iOS)
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
            const rawBeta = event.beta || 0
            const rawGamma = event.gamma || 0

            // 1. Aplicar filtro de suavização
            lastBetaRef.current = (lastBetaRef.current * (1 - smoothingFactor)) + (rawBeta * smoothingFactor)
            lastGammaRef.current = (lastGammaRef.current * (1 - smoothingFactor)) + (rawGamma * smoothingFactor)

            // 2. Detectar Modo de Uso (Apenas se não estiver congelado)
            const isVertical = Math.abs(lastBetaRef.current) > 40
            setUseMode(isVertical ? 'vertical' : 'flat')

            let currentAngle = 0

            if (isVertical) {
                // MODO RETRATO: Mede a inclinação lateral (gamma)
                const sign = lastBetaRef.current > 0 ? 1 : -1
                currentAngle = lastGammaRef.current * sign
            } else {
                // MODO MESA: Mede a inclinação em relação ao plano horizontal
                currentAngle = Math.sqrt(Math.pow(lastBetaRef.current, 2) + Math.pow(lastGammaRef.current, 2))
                if (Math.abs(lastBetaRef.current) > Math.abs(lastGammaRef.current)) {
                    currentAngle *= (lastBetaRef.current > 0 ? 1 : -1)
                } else {
                    currentAngle *= (lastGammaRef.current > 0 ? 1 : -1)
                }
            }

            // 3. Cálculo Relativo (Usando a calibração do botão Zerar)
            let refBase = 0
            if (isVertical) {
                refBase = referenceValues.gamma * (referenceValues.beta > 0 ? 1 : -1)
            } else {
                refBase = Math.sqrt(Math.pow(referenceValues.beta, 2) + Math.pow(referenceValues.gamma, 2))
                if (Math.abs(referenceValues.beta) > Math.abs(referenceValues.gamma)) {
                    refBase *= (referenceValues.beta > 0 ? 1 : -1)
                } else {
                    refBase *= (referenceValues.gamma > 0 ? 1 : -1)
                }
            }

            setAngle(Number((currentAngle - refBase).toFixed(1)))
        }

        window.addEventListener('deviceorientation', handleOrientation)
        return () => window.removeEventListener('deviceorientation', handleOrientation)
    }, [permissionGranted, isFrozen, referenceValues])

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

    const resetReference = () => {
        setReferenceValues({
            beta: lastBetaRef.current,
            gamma: lastGammaRef.current
        })
        setAngle(0)
        setIsFrozen(false)
        toast.success("Calibrado: 0.0°")
    }

    if (isSupported === false) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-950 text-white text-center">
                <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
                <h1 className="text-xl font-bold mb-2">Sensores não suportados</h1>
                <p className="text-slate-400 text-sm">Este dispositivo ou navegador não possui acesso ao acelerômetro/giroscópio.</p>
            </div>
        )
    }

    if (!permissionGranted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-950 text-white text-center">
                <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <Navigation className="h-10 w-10 text-blue-500" />
                </div>
                <h1 className="text-2xl font-black mb-4 tracking-tight">AXIOM REMOTE</h1>
                <p className="text-slate-400 text-sm mb-8 max-w-[280px]">Clique no botão abaixo para ativar os sensores de movimento do seu celular.</p>
                <Button
                    onClick={requestPermission}
                    className="w-full max-w-[240px] h-14 bg-blue-600 hover:bg-blue-500 text-lg font-bold rounded-2xl shadow-lg shadow-blue-500/20"
                >
                    Ativar Inclinômetro
                </Button>
            </div>
        )
    }

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-between min-h-screen p-6 transition-colors duration-500 overflow-hidden select-none touch-none",
                isFrozen ? "bg-amber-600" : "bg-slate-950"
            )}
            onClick={toggleFreeze}
        >
            {/* Header Info */}
            <div className="w-full flex justify-between items-center pt-4">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black tracking-widest text-blue-400 uppercase">Modo Remoto</span>
                    <h2 className="text-white font-bold text-sm">Teste de Sensores</h2>
                </div>
                <Badge variant="outline" className={cn(
                    "border-none px-3 py-1 text-[10px] font-black uppercase",
                    isFrozen ? "bg-white text-amber-700" : "bg-blue-500/10 text-blue-400"
                )}>
                    {isFrozen ? "Congelado" : "Ao Vivo"}
                </Badge>
            </div>

            {/* Main Visualizer */}
            <div className="relative flex items-center justify-center w-full max-w-[320px] aspect-square">
                {/* Background Ring */}
                <div className={cn(
                    "absolute inset-0 rounded-full border-[10px] opacity-20 transition-colors duration-500",
                    isFrozen ? "border-white" : "border-blue-500"
                )} />

                {/* Animated Axis Line */}
                {!isFrozen && (
                    <div
                        className="absolute w-full h-[2px] bg-blue-500/50 transition-transform duration-75"
                        style={{ transform: `rotate(${angle}deg)` }}
                    />
                )}

                <div className="flex flex-col items-center z-10">
                    <span className={cn(
                        "text-8xl font-black tracking-tighter tabular-nums transition-colors duration-500",
                        isFrozen ? "text-white" : "text-blue-500"
                    )}>
                        {angle.toFixed(1)}°
                    </span>
                    <p className={cn(
                        "text-xs font-bold uppercase tracking-[0.2em] transition-opacity duration-300",
                        isFrozen ? "text-white/70" : "text-slate-500"
                    )}>
                        {isFrozen ? "Toque para Soltar" : "Inclinômetro Digital"}
                    </p>
                </div>

                {/* Status Icon */}
                <div className="absolute -bottom-4 bg-slate-900 border border-slate-800 p-3 rounded-full shadow-xl">
                    {isFrozen ? (
                        <Lock className="h-6 w-6 text-amber-500 animate-in zoom-in" />
                    ) : (
                        <Unlock className="h-6 w-6 text-blue-500" />
                    )}
                </div>
            </div>

            {/* Bottom Controls */}
            <div className="w-full grid grid-cols-2 gap-4 pb-8">
                <Button
                    variant="outline"
                    onClick={resetReference}
                    className="h-16 rounded-2xl border-slate-800 bg-slate-900/50 text-white font-bold gap-3 hover:bg-slate-800"
                >
                    <RotateCcw className="h-5 w-5" />
                    Zerar (Ref)
                </Button>

                <Button
                    variant="outline"
                    className="h-16 rounded-2xl border-slate-800 bg-slate-900/50 text-white font-bold gap-3 hover:bg-slate-800"
                    disabled={!isFrozen}
                >
                    <RefreshCw className={cn("h-5 w-5", isFrozen && "animate-pulse")} />
                    Enviar
                </Button>
            </div>

            {/* User Guidance */}
            <div className="pb-4 opacity-40 flex items-center gap-2">
                <Info className="h-3 w-3" />
                <span className="text-[10px] font-bold uppercase tracking-tight">Toque em qualquer lugar fora dos botões para congelar</span>
            </div>
        </div>
    )
}
