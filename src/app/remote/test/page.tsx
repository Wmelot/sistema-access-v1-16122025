"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    RefreshCw,
    Lock,
    Unlock,
    Smartphone,
    RotateCcw
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function InclinometerTest() {
    const [isSupported, setIsSupported] = useState<boolean | null>(null)
    const [permissionGranted, setPermissionGranted] = useState(false)
    const [displayAngle, setDisplayAngle] = useState(0)
    const [gaugeAngle, setGaugeAngle] = useState(0)
    const [isFrozen, setIsFrozen] = useState(false)
    const [showSign, setShowSign] = useState(false) // Toggle para Absoluto vs Sinal

    // Referências para Cálculo de Giro Contínuo
    const lastRawAngleRef = useRef(0)
    const cumulativeAngleRef = useRef(0)
    const referenceAngleRef = useRef(0)
    const lastDisplayRef = useRef(0)

    // Constantes de Sensibilidade clínica
    const SMOOTH_NUMBER = 0.08
    const SMOOTH_GAUGE = 0.7

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

            // ISOLAMENTO DE EIXO: Cálculo de rotação no plano da tela (Clock-hand)
            const rad = Math.atan2(gamma, beta)
            let currentRaw = rad * (180 / Math.PI)

            // LÓGICA DE GIRO CONTÍNUO (EVITA PULO NOS 180°)
            let delta = currentRaw - lastRawAngleRef.current

            // Corrige o wrap-around (se pular de 179 para -179)
            if (delta > 180) delta -= 360
            if (delta < -180) delta += 360

            cumulativeAngleRef.current += delta
            lastRawAngleRef.current = currentRaw

            // Ângulo relativo ao ZERO calibrado
            const relativeAngle = cumulativeAngleRef.current - referenceAngleRef.current

            // 1. Atualiza Barra (Rápida e Sem Limites)
            const fastVal = (lastDisplayRef.current * (1 - SMOOTH_GAUGE)) + (relativeAngle * SMOOTH_GAUGE)
            setGaugeAngle(fastVal)

            // 2. Atualiza Número (Suave)
            const slowVal = (lastDisplayRef.current * (1 - SMOOTH_NUMBER)) + (relativeAngle * SMOOTH_NUMBER)
            lastDisplayRef.current = slowVal

            // Decidimos se mostramos o valor absoluto ou com sinal (+/-)
            const finalVal = showSign ? slowVal : Math.abs(slowVal)
            setDisplayAngle(Number(finalVal.toFixed(1)))
        }

        window.addEventListener('deviceorientation', handleOrientation)
        return () => window.removeEventListener('deviceorientation', handleOrientation)
    }, [permissionGranted, isFrozen, showSign])

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
        // Marcamos o acúmulo atual como o novo ponto de referência
        referenceAngleRef.current = cumulativeAngleRef.current
        setDisplayAngle(0)
        setGaugeAngle(0)
        setIsFrozen(false)
        toast.success("Zero Calibrado")
    }

    if (isSupported === false) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-950 text-white text-center">
                <h1 className="text-xl font-bold">Sensores não suportados</h1>
            </div>
        )
    }

    if (!permissionGranted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-950 text-white text-center">
                <Smartphone className="h-10 w-10 text-blue-500 mb-6" />
                <h1 className="text-2xl font-black mb-4">GONIMETRO V3</h1>
                <Button onClick={requestPermission} className="w-full bg-blue-600 h-14 font-bold rounded-2xl">Ativar Sensores</Button>
            </div>
        )
    }

    // Cálculos para o SVG Bidirecional e Contínuo
    const radius = 90
    const circumference = 2 * Math.PI * radius
    // Mostramos visualmente apenas o resto de 360 para a barra não ficar "vazando" o círculo
    const visualMod = gaugeAngle % 360
    const offset = circumference - (Math.abs(visualMod) / 360) * circumference

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-between min-h-screen p-6 transition-colors duration-500 bg-slate-950",
                isFrozen && "bg-blue-900"
            )}
            onClick={toggleFreeze}
        >
            <div className="w-full flex justify-between items-center pt-4">
                <div className="text-left">
                    <span className="text-[10px] font-black tracking-widest text-blue-400 uppercase">Goniômetro Pro</span>
                    <h2 className="text-white font-bold text-sm tracking-tight italic">Rotação Contínua 360°+</h2>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); setShowSign(!showSign); }}
                    className={cn(
                        "h-8 gap-2 rounded-full border-slate-800 transition-all",
                        showSign ? "bg-white text-blue-950 border-white" : "bg-slate-900 text-white"
                    )}
                >
                    <span className="text-[10px] font-black tracking-tighter uppercase">{showSign ? "Sinal ON" : "Sinal OFF"}</span>
                </Button>
            </div>

            <div className="relative flex items-center justify-center w-full max-w-[320px] aspect-square">
                <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full -rotate-90">
                    <circle cx="100" cy="100" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-900" />
                    {!isFrozen && (
                        <circle
                            cx="100" cy="100" r={radius} stroke="currentColor" strokeWidth="12" fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            className={cn("text-blue-500 transition-all", gaugeAngle < 0 ? "scale-y-[-1]" : "scale-y-[1]")}
                            style={{ transformOrigin: 'center' }}
                        />
                    )}
                </svg>

                <div className="flex flex-col items-center z-10 text-white">
                    <div className="flex items-center">
                        {showSign && displayAngle !== 0 && (
                            <span className="text-4xl font-black mr-2 text-blue-400">
                                {displayAngle > 0 ? "+" : ""}
                            </span>
                        )}
                        <span className="text-[100px] font-black tracking-tighter tabular-nums leading-none">
                            {displayAngle.toFixed(1)}
                        </span>
                    </div>
                    <span className="text-2xl font-bold opacity-30 tracking-widest uppercase">Graus</span>
                </div>

                <div className="absolute -bottom-4 bg-slate-900 border border-slate-800 p-4 rounded-full shadow-2xl">
                    {isFrozen ? <Lock className="h-6 w-6 text-white" /> : <Unlock className="h-6 w-6 text-blue-400" />}
                </div>
            </div>

            <div className="w-full grid grid-cols-2 gap-4 pb-12">
                <Button
                    variant="outline"
                    onClick={(e) => { e.stopPropagation(); calibrateZero(); }}
                    className="h-20 rounded-[30px] border-slate-800 bg-slate-900 text-white text-xl font-black gap-2 hover:bg-slate-800 active:scale-95 transition-all shadow-lg"
                >
                    <RotateCcw className="h-5 w-5 text-blue-400" />
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

            <div className="pb-4 flex flex-col items-center opacity-40">
                <span className="text-[10px] font-black uppercase text-blue-500 tracking-[0.2em] mb-1">Eixo Único Isolado</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-center">Permite ultrapassar 180° sem interrupção</span>
            </div>
        </div>
    )
}
