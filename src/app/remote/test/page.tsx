"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    RefreshCw,
    Lock,
    Unlock,
    Smartphone,
    RotateCcw,
    IterationCw,
    AlertCircle,
    CheckCircle2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function InclinometerTest() {
    const [isSupported, setIsSupported] = useState<boolean | null>(null)
    const [permissionGranted, setPermissionGranted] = useState(false)
    const [showInstructions, setShowInstructions] = useState(true) // Nova tela de setup
    const [displayAngle, setDisplayAngle] = useState(0)
    const [gaugeAngle, setGaugeAngle] = useState(0)
    const [isFrozen, setIsFrozen] = useState(false)
    const [showSign, setShowSign] = useState(false)

    const lastRawAngleRef = useRef(0)
    const cumulativeAngleRef = useRef(0)
    const referenceAngleRef = useRef(0)
    const lastDisplayRef = useRef(0)

    const SMOOTH_NUMBER = 0.08
    const SMOOTH_GAUGE = 0.4 // Um pouco mais suave para a barra não tremer tanto

    const startSensors = async () => {
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
            try {
                const permission = await (DeviceOrientationEvent as any).requestPermission()
                if (permission === 'granted') {
                    setPermissionGranted(true)
                    setShowInstructions(false)
                }
            } catch (err) {
                console.error("Erro ao solicitar permissão:", err)
            }
        } else {
            setPermissionGranted(true)
            setShowInstructions(false)
        }
    }

    useEffect(() => {
        if (!permissionGranted || isFrozen) return

        const handleOrientation = (event: DeviceOrientationEvent) => {
            const beta = event.beta || 0
            const gamma = event.gamma || 0

            // Eixo isolado: Rotação no plano da tela
            const rad = Math.atan2(gamma, beta)
            let currentRaw = rad * (180 / Math.PI)

            // Lógica de Giro Contínuo
            let delta = currentRaw - lastRawAngleRef.current
            if (delta > 180) delta -= 360
            if (delta < -180) delta += 360

            cumulativeAngleRef.current += delta
            lastRawAngleRef.current = currentRaw

            const relativeAngle = cumulativeAngleRef.current - referenceAngleRef.current

            // Barra (Gauge) - Rápida
            const fastVal = (lastRawAngleRef.current * (1 - SMOOTH_GAUGE)) + (relativeAngle * SMOOTH_GAUGE)
            setGaugeAngle(relativeAngle)

            // Número (Display) - Lento
            const slowVal = (lastDisplayRef.current * (1 - SMOOTH_NUMBER)) + (relativeAngle * SMOOTH_NUMBER)
            lastDisplayRef.current = slowVal

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

    const calibrateZero = () => {
        referenceAngleRef.current = cumulativeAngleRef.current
        setDisplayAngle(0)
        setGaugeAngle(0)
        setIsFrozen(false)
        toast.success("Referência Zerada")
    }

    if (showInstructions) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-slate-950 text-white text-center font-sans tracking-tight">
                <div className="mb-8 relative">
                    <div className="w-24 h-24 bg-blue-500/10 rounded-3xl flex items-center justify-center animate-pulse">
                        <IterationCw className="h-12 w-12 text-blue-500" />
                    </div>
                    <div className="absolute -top-2 -right-2 bg-amber-500 p-2 rounded-full shadow-lg animate-bounce">
                        <Lock className="h-4 w-4 text-slate-950" />
                    </div>
                </div>

                <h1 className="text-3xl font-black mb-4">PREPARAÇÃO</h1>

                <div className="space-y-6 mb-10 text-left bg-slate-900/50 p-6 rounded-2xl border border-white/5">
                    <div className="flex gap-4">
                        <div className="bg-blue-500 h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">1</div>
                        <p className="text-slate-300 text-sm">Abra a <b>Central de Controle</b> do iPhone (arraste do topo direito).</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-blue-500 h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">2</div>
                        <p className="text-slate-300 text-sm">Ative o <b>Bloqueio de Orientação Vertical</b> (ícone de cadeado circular).</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-blue-500 h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">3</div>
                        <p className="text-slate-300 text-sm italic opacity-70 italic font-medium">Isso garante que o sensor não se perca durante as medidas.</p>
                    </div>
                </div>

                <Button
                    onClick={startSensors}
                    className="w-full max-w-[280px] h-16 bg-blue-600 hover:bg-blue-500 text-lg font-black rounded-[20px] shadow-2xl shadow-blue-500/20"
                >
                    TUDO PRONTO
                </Button>
            </div>
        )
    }

    // Configuração SVG para barra que cresce (Stroke Dash)
    const radius = 85
    const circumference = 2 * Math.PI * radius
    // Limitamos visualmente mas deixamos ela crescer até 180° por lado
    const visualAngle = Math.max(-180, Math.min(180, gaugeAngle))
    const percentage = Math.abs(visualAngle) / 360
    const dashOffset = circumference * (1 - percentage)

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-between min-h-screen p-6 transition-colors duration-700 bg-slate-950 select-none touch-none",
                isFrozen && "bg-blue-900"
            )}
            onClick={() => setIsFrozen(!isFrozen)}
        >
            <div className="w-full flex justify-between items-center pt-4">
                <div className="text-left">
                    <span className="text-[10px] font-black tracking-widest text-blue-400 uppercase opacity-60">Smart Clinometer</span>
                    <h2 className="text-white font-bold text-sm">Goniometria Digital</h2>
                </div>
                <Badge className={cn(
                    "px-4 py-1.5 text-[10px] font-black uppercase rounded-full border-none",
                    isFrozen ? "bg-white text-blue-900" : "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                )}>
                    {isFrozen ? "CONGELADO" : "AO VIVO"}
                </Badge>
            </div>

            <div className="relative flex items-center justify-center w-full max-w-[340px] aspect-square">
                {/* SVG da Barra Circular Progressiva */}
                <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full -rotate-90">
                    {/* Ring de fundo */}
                    <circle cx="100" cy="100" r={radius} stroke="rgba(255,255,255,0.03)" strokeWidth="6" fill="transparent" />

                    {/* Linha do Ponto Zero (Topo) */}
                    <line x1="100" y1="10" x2="100" y2="20" stroke="rgba(59,130,246,0.3)" strokeWidth="2" />

                    {/* A BARRA QUE CRESCE REALMENTE */}
                    <circle
                        cx="100"
                        cy="100"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="10"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset}
                        strokeLinecap="round"
                        className={cn(
                            "text-blue-500 transition-all duration-300",
                            gaugeAngle < 0 ? "scale-y-[-1]" : "scale-y-[1]"
                        )}
                        style={{ transformOrigin: 'center' }}
                    />
                </svg>

                <div className="flex flex-col items-center z-10 text-white">
                    <div className="flex items-center">
                        <span className="text-[110px] font-black tracking-tighter tabular-nums leading-none">
                            {displayAngle.toFixed(1)}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xl font-bold opacity-30 tracking-[0.3em] uppercase">Graus</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); setShowSign(!showSign); }}
                            className={cn(
                                "h-10 w-10 rounded-xl border border-white/10",
                                showSign ? "bg-white text-slate-900" : "bg-slate-900/50 text-white"
                            )}
                        >
                            <span className="font-black text-xs">+/-</span>
                        </Button>
                    </div>
                </div>

                <div className="absolute -bottom-4 bg-slate-900 border border-white/5 p-4 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                    {isFrozen ? <Lock className="h-6 w-6 text-white" /> : <Unlock className="h-6 w-6 text-blue-500" />}
                </div>
            </div>

            <div className="w-full grid grid-cols-2 gap-4 pb-14">
                <Button
                    onClick={(e) => { e.stopPropagation(); calibrateZero(); }}
                    className="h-20 rounded-[28px] bg-slate-900 border border-white/5 text-white text-xl font-black gap-2 hover:bg-slate-800 active:scale-95 transition-all shadow-xl"
                >
                    <RotateCcw className="h-5 w-5 text-blue-400" />
                    ZERAR
                </Button>

                <Button
                    className="h-20 rounded-[28px] bg-slate-900 border border-white/5 text-white text-xl font-black gap-2 opacity-20 cursor-not-allowed"
                    disabled
                >
                    <RefreshCw className="h-5 w-5" />
                    ENVIAR
                </Button>
            </div>
        </div>
    )
}
