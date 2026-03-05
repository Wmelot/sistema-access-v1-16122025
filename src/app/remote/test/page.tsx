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
    Smartphone,
    RotateCcw
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function InclinometerTest() {
    const [isSupported, setIsSupported] = useState<boolean | null>(null)
    const [permissionGranted, setPermissionGranted] = useState(false)
    const [displayAngle, setDisplayAngle] = useState(0)
    const [isFrozen, setIsFrozen] = useState(false)
    const [referenceAngle, setReferenceAngle] = useState(0)

    // Filtro de suavização
    const lastAngleRef = useRef(0)
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
            const beta = event.beta || 0
            const gamma = event.gamma || 0

            // ALGORITMO DE PÊNDULO CLÍNICO
            // Calculamos o ângulo de inclinação lateral (clock-hand rotation)
            // Usamos atan2(gamma, beta) para que 0 seja a posição vertical perfeita
            const rad = Math.atan2(gamma, beta)
            let currentRotation = rad * (180 / Math.PI)

            // Filtro de suavização
            const smoothedAngle = (lastAngleRef.current * (1 - smoothingFactor)) + (currentRotation * smoothingFactor)
            lastAngleRef.current = smoothedAngle

            // Diferença relativa ao ZERO calibrado
            let diff = smoothedAngle - referenceAngle

            // Garantimos que o valor seja absoluto para o contador (como no Physiocode)
            // ou mantemos o sinal para saber se é pra direita/esquerda
            setDisplayAngle(Number(Math.abs(diff).toFixed(1)))
        }

        window.addEventListener('deviceorientation', handleOrientation)
        return () => window.removeEventListener('deviceorientation', handleOrientation)
    }, [permissionGranted, isFrozen, referenceAngle])

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
        setReferenceAngle(lastAngleRef.current)
        setDisplayAngle(0)
        setIsFrozen(false)
        toast.success("Calibrado em 0.0°")
    }

    if (isSupported === false) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-950 text-white text-center">
                <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
                <h1 className="text-xl font-bold mb-2">Sensores não suportados</h1>
                <p className="text-slate-400 text-sm">Use Safari ou Chrome em modo seguro (HTTPS).</p>
            </div>
        )
    }

    if (!permissionGranted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-950 text-white text-center font-sans">
                <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
                    <Smartphone className="h-10 w-10 text-blue-500" />
                </div>
                <h1 className="text-2xl font-black mb-4 tracking-tight">AXIOM REMOTO</h1>
                <p className="text-slate-400 text-sm mb-8 max-w-[280px]">Inicie os sensores para avaliar inclinações e ângulos clínicos.</p>
                <Button
                    onClick={requestPermission}
                    className="w-full max-w-[240px] h-14 bg-blue-600 hover:bg-blue-500 text-lg font-bold rounded-2xl shadow-xl shadow-blue-900/20"
                >
                    Iniciar Inclinômetro
                </Button>
            </div>
        )
    }

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-between min-h-screen p-6 transition-colors duration-500 overflow-hidden select-none touch-none bg-slate-950",
                isFrozen && "bg-blue-700"
            )}
            onClick={toggleFreeze}
        >
            <div className="w-full flex justify-between items-center pt-4">
                <div className="text-left">
                    <span className="text-[10px] font-black tracking-widest text-blue-400 uppercase">Goniômetro Axiom</span>
                    <h2 className="text-white font-bold text-sm tracking-tight">Teste de Inclinação</h2>
                </div>
                <Badge className={cn(
                    "px-3 py-1 text-[10px] font-black uppercase rounded-full",
                    isFrozen ? "bg-white text-blue-700" : "bg-blue-600 text-white"
                )}>
                    {isFrozen ? "Congelado" : "Ao Vivo"}
                </Badge>
            </div>

            {/* Visualizador Circular Estilo Physiocode */}
            <div className="relative flex items-center justify-center w-full max-w-[320px] aspect-square">
                {/* Arco de Fundo */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle
                        cx="50%"
                        cy="50%"
                        r="45%"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="transparent"
                        className="text-slate-900"
                    />
                    {/* Arco de Progresso Dinâmico */}
                    {!isFrozen && (
                        <circle
                            cx="50%"
                            cy="50%"
                            r="45%"
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="transparent"
                            strokeDasharray="283%"
                            strokeDashoffset={`${283 - (displayAngle / 90) * 70}%`}
                            strokeLinecap="round"
                            className="text-blue-500 transition-all duration-75"
                        />
                    )}
                </svg>

                <div className="flex flex-col items-center z-10 text-white">
                    <span className="text-[120px] font-black tracking-tighter tabular-nums leading-none">
                        {displayAngle.toFixed(1)}
                    </span>
                    <span className="text-2xl font-bold opacity-40 -mt-2 tracking-widest uppercase">Graus</span>
                </div>

                <div className="absolute -bottom-4 bg-slate-900 border border-slate-800 p-4 rounded-full shadow-2xl">
                    {isFrozen ? (
                        <Lock className="h-6 w-6 text-white" />
                    ) : (
                        <Unlock className="h-6 w-6 text-blue-500" />
                    )}
                </div>
            </div>

            {/* Botões Grandes e Acessíveis */}
            <div className="w-full grid grid-cols-2 gap-4 pb-12">
                <Button
                    variant="outline"
                    onClick={(e) => { e.stopPropagation(); calibrateZero(); }}
                    className="h-20 rounded-[30px] border-slate-800 bg-slate-900 text-white text-xl font-black gap-2 hover:bg-slate-800 active:scale-95 transition-all"
                >
                    <RotateCcw className="h-6 w-6 text-blue-400" />
                    Zerar
                </Button>

                <Button
                    variant="outline"
                    className="h-20 rounded-[30px] border-slate-800 bg-slate-900 text-white text-xl font-black gap-2 opacity-30"
                    disabled={!isFrozen}
                >
                    <RefreshCw className="h-5 w-5" />
                    Enviar
                </Button>
            </div>

            <div className="pb-4 flex items-center gap-2 opacity-40">
                <Info className="h-3 w-3" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Toque em qualquer lugar para congelar</span>
            </div>
        </div>
    )
}
