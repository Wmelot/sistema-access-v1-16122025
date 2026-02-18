"use client"

import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useOnboarding } from "./OnboardingProvider"
import { Button } from "@/components/ui/button"
import { ChevronRight, ChevronLeft, X, Minimize2, Maximize2, CheckCircle2, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"

export function OnboardingTour() {
    const { isActive, currentStepIndex, steps, nextStep, prevStep, skipOnboarding, completeOnboarding, startOnboarding, isInitialTour } = useOnboarding()
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
    const [isMinimized, setIsMinimized] = useState(false)
    const [dontShowAgain, setDontShowAgain] = useState(false)
    const step = steps[currentStepIndex]
    const lastClickedStepRef = useRef<string | null>(null)

    // Reseta o estado minimizado ao trocar de passo se o usuário desejar, 
    // ou mantém se for um passo de preenchimento. Vamos manter para dar controle.
    useEffect(() => {
        // Se o passo mudar e for um passo de boas vindas, expande
        if (step.id === 'welcome') setIsMinimized(false)
    }, [currentStepIndex, step.id])

    useEffect(() => {
        if (!isActive) return

        const updateTarget = () => {
            const element = document.getElementById(step.targetId)

            // DETECÇÃO DE SUCESSO: Se um modal de sucesso apareceu, avança o tutorial
            const successModal = document.body.innerText.includes('Sucesso!') ||
                document.body.innerText.includes('Operação concluída') ||
                document.querySelector('[role="dialog"] h2')?.textContent?.includes('Sucesso')

            if (successModal && step.id !== 'agenda-final' && !isInitialTour) {
                // Pequeno delay para o usuário ver o "Sucesso!" antes de mudar o passo do tutorial
                setTimeout(() => nextStep(), 1500)
                return
            }

            // [NEW] AUTO-AVANÇO AGRESSIVO: Se o próximo elemento já está disponível e visível, avança logo.
            // Especialmente útil se o passo atual é um gatilho que já foi acionado (ex: abriu o modal).
            if (currentStepIndex < steps.length - 1) {
                const nextStepObj = steps[currentStepIndex + 1]
                const nextElement = document.getElementById(nextStepObj.targetId)

                // Se o próximo elemento está visível no DOM
                if (nextElement && (nextElement.getBoundingClientRect().width > 0)) {
                    const currentElement = document.getElementById(step.targetId)
                    const nextInModal = !!nextElement.closest('[role="dialog"]')
                    const currentInModal = !!currentElement?.closest('[role="dialog"]')

                    // Se o próximo está em um modal e o atual não, ou se o atual SUMIU, avança.
                    if ((nextInModal && !currentInModal) || !currentElement) {
                        nextStep()
                        return
                    }
                }
            }

            // REDE DE SEGURANÇA: Se o elemento atual SUMIU mas a página mudou ou estamos em um passo de ação
            if (!element && currentStepIndex < steps.length - 1) {
                const nextStepObj = steps[currentStepIndex + 1]
                const nextElement = document.getElementById(nextStepObj.targetId)
                if (nextElement) {
                    nextStep()
                    return
                }
            }

            // LÓGICA ESPECIAL: Se estamos no passo de abrir o menu e o item do menu já apareceu, avança automático
            if (step.id === 'profile-me') {
                const nextStepElement = document.getElementById('user-profile-settings-link')
                if (nextStepElement) {
                    nextStep()
                    return
                }
            }

            if (element) {
                const rect = element.getBoundingClientRect()
                if (rect.width > 0 && rect.height > 0) {
                    setTargetRect(rect)
                }
            } else {
                setTargetRect(null)
            }
        }

        const handleGlobalClick = (e: MouseEvent) => {
            if (!isActive || !step.targetId) return
            if ((e.target as HTMLElement).closest('.onboarding-controls')) return

            const element = document.getElementById(step.targetId)
            if (element && (element.contains(e.target as Node) || element === e.target)) {
                const clickId = `${step.id}-${currentStepIndex}`
                if (lastClickedStepRef.current !== clickId) {
                    lastClickedStepRef.current = clickId
                    setTimeout(() => nextStep(), 150)
                }
            }
        }

        updateTarget()
        window.addEventListener('click', handleGlobalClick, true)
        window.addEventListener('resize', updateTarget)
        window.addEventListener('scroll', updateTarget, true)
        const interval = setInterval(updateTarget, 100)

        return () => {
            window.removeEventListener('click', handleGlobalClick, true)
            window.removeEventListener('resize', updateTarget)
            window.removeEventListener('scroll', updateTarget, true)
            clearInterval(interval)
        }
    }, [isActive, step.targetId, currentStepIndex, nextStep, step.id])

    if (!isActive) return null

    const hole = (() => {
        if (!targetRect) return null
        const element = document.getElementById(step.targetId)

        // [FIX] Não tenta encontrar containers se o alvo estiver na sidebar ou navegação
        const isSidebarItem = element?.closest('aside') || element?.closest('nav')

        const container = isSidebarItem ? null : (
            element?.closest('[role="dialog"]') ||
            element?.closest('form') ||
            element?.closest('.form-container') ||
            element?.closest('.professional-form') ||
            element?.closest('.grid')
        );

        const rect = container ? container.getBoundingClientRect() : targetRect
        const p = container ? 12 : 6

        return {
            top: rect.top - p,
            left: rect.left - p,
            width: rect.width + (p * 2),
            height: rect.height + (p * 2),
            right: rect.right + p,
            bottom: rect.bottom + p
        }
    })()

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 99999 }}>
            {/* Backdrop com Box Shadow (Mais robusto) */}
            {hole && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute pointer-events-none rounded-xl"
                    style={{
                        left: hole.left,
                        top: hole.top,
                        width: hole.width,
                        height: hole.height,
                        boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.65)',
                        zIndex: 99998,
                    }}
                />
            )}

            {/* PULSE HIGH-CONTRAST */}
            {targetRect && (
                <motion.div
                    key={`pulse-${step.id}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{
                        opacity: [0, 1, 0],
                        scale: [1, 1.05, 1.1],
                        borderWidth: [4, 2, 1]
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute border-blue-400 rounded-2xl pointer-events-none"
                    style={{
                        zIndex: 99999,
                        left: targetRect.left - 8,
                        top: targetRect.top - 8,
                        width: targetRect.width + 16,
                        height: targetRect.height + 16,
                        boxShadow: '0 0 20px rgba(59, 130, 246, 0.6)',
                    }}
                />
            )}

            {/* TOOLTIP CARD */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${step.id}-${isMinimized}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                        "absolute pointer-events-auto bg-white shadow-2xl border border-slate-200 flex flex-col transition-all duration-300 ease-in-out",
                        isMinimized
                            ? "w-[240px] rounded-xl p-3 gap-2"
                            : step.id === 'agenda-final' ? "w-[400px] rounded-3xl p-8 gap-5" : "w-[350px] rounded-3xl p-7 gap-5",
                        (step.position === 'center' || !targetRect) && "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                    )}
                    style={(step.position !== 'center' && targetRect) ? {
                        zIndex: 100001,
                        left: (() => {
                            if (!targetRect) return '50%'
                            const tooltipWidth = isMinimized ? 240 : (step.id === 'agenda-final' ? 400 : 350)
                            const margin = 20
                            const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1000

                            if (isMinimized) return windowWidth - tooltipWidth - margin

                            const element = document.getElementById(step.targetId)
                            // Se estiver em um diálogo, posiciona no canto superior esquerdo para não tampar o botão Salvar (que fica na direita/baixo)
                            if (element?.closest('[role="dialog"]')) return margin

                            let x = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2)
                            if (step.position === 'right') x = targetRect.right + 24
                            if (step.position === 'left') x = targetRect.left - tooltipWidth - 24
                            return Math.min(windowWidth - tooltipWidth - margin, Math.max(margin, x))
                        })(),
                        top: (() => {
                            if (!targetRect) return '50%'
                            const tooltipHeight = isMinimized ? 60 : 250
                            const margin = 20
                            const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 1000

                            if (isMinimized) return windowHeight - tooltipHeight - margin

                            const element = document.getElementById(step.targetId)
                            // Se estiver em um diálogo, posiciona no topo para evitar tampar o formulário
                            if (element?.closest('[role="dialog"]')) return margin + 80

                            let y = targetRect.top
                            if (step.position === 'bottom') y = targetRect.bottom + 16
                            return Math.min(windowHeight - tooltipHeight - margin, Math.max(margin, y))
                        })(),
                        transform: !targetRect ? undefined : 'none'
                    } : { zIndex: 100001 }}
                >
                    {/* Seta do Tooltip */}
                    {step.position !== 'center' && targetRect && (
                        <div
                            className={cn(
                                "absolute w-4 h-4 bg-white rotate-45 border-slate-200",
                                step.position === 'right' && "left-[-8px] top-10 border-l border-b",
                                step.position === 'left' && "right-[-8px] top-10 border-r border-t",
                                step.position === 'bottom' && "top-[-8px] left-10 border-l border-t",
                                step.position === 'top' && "bottom-[-8px] left-10 border-r border-b"
                            )}
                        />
                    )}

                    {/* Header com Controles */}
                    <div className="flex items-center justify-between">
                        {!isMinimized && (
                            <div className="flex gap-1.5">
                                {steps.map((_, i) => (
                                    <div key={i} className={cn("h-1.5 rounded-full transition-all duration-300", i === currentStepIndex ? "w-8 bg-blue-600" : "w-2 bg-slate-100")} />
                                ))}
                            </div>
                        )}
                        {isMinimized && (
                            <span className="text-xs font-bold text-blue-600 flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                                {currentStepIndex + 1} / {steps.length}
                            </span>
                        )}
                        <div className="flex items-center gap-1 onboarding-controls">
                            <button
                                onClick={() => setIsMinimized(!isMinimized)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title={isMinimized ? "Expandir tutorial" : "Minimizar tutorial"}
                            >
                                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                            </button>
                            <button onClick={() => {
                                if (dontShowAgain) localStorage.setItem('onboarding_skip_auto', 'true')
                                skipOnboarding()
                            }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Conteúdo */}
                    <div className={cn("space-y-3", isMinimized && "hidden")}>
                        <h3 className="text-xl font-extrabold text-slate-900 tracking-tight leading-tight">{step.title}</h3>
                        <div className="text-sm text-slate-600 leading-relaxed font-medium">
                            {step.description}
                            {step.targetId !== 'welcome-tour' && step.id !== 'agenda-final' && (
                                <div className="mt-4 flex items-center gap-2 text-blue-600 font-bold animate-bounce">
                                    <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center">
                                        <ChevronRight className="h-4 w-4" />
                                    </div>
                                    <span>Próximo passo</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {isMinimized && (
                        <h4 className="text-sm font-bold text-slate-800 truncate pr-8">{step.title}</h4>
                    )}

                    {/* Footer (Apenas expandido) */}
                    {!isMinimized && (
                        <div className="flex flex-col gap-4 onboarding-controls pt-2">
                            <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                                <Button variant="ghost" size="sm" onClick={prevStep} disabled={currentStepIndex === 0} className="text-slate-500 font-bold hover:bg-slate-50 border-slate-100">
                                    <ChevronLeft className="h-4 w-4 mr-1" />Anterior
                                </Button>

                                {step.targetId === 'welcome-tour' || step.id === 'nav-agenda-start' ? (
                                    <Button size="sm" onClick={nextStep} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 rounded-2xl shadow-xl shadow-blue-100 group transition-all">
                                        Começar <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                ) : step.id === 'agenda-final' ? (
                                    <div className="flex flex-col gap-2 w-full">
                                        <Button
                                            size="lg"
                                            onClick={() => startOnboarding('schedule')}
                                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl shadow-xl shadow-green-100 gap-2 h-12"
                                        >
                                            <Calendar className="h-5 w-5" />
                                            Fazer treinamento de agendamento
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                if (dontShowAgain) localStorage.setItem('onboarding_skip_auto', 'true')
                                                completeOnboarding()
                                            }}
                                            className="w-full text-slate-500 font-bold hover:bg-slate-50 border-slate-100 h-10 rounded-xl"
                                        >
                                            Fechar Tutorial
                                        </Button>
                                    </div>
                                ) : (
                                    <Button variant="ghost" size="sm" onClick={nextStep} className="text-slate-400 hover:text-slate-600 text-xs font-semibold">
                                        Próximo Passo
                                    </Button>
                                )}
                            </div>

                            {/* Checkbox "Não mostrar novamente" */}
                            {(currentStepIndex === 0 || step.id === 'agenda-final') && (
                                <div className="flex items-center space-x-2 px-1">
                                    <Checkbox
                                        id="dont-show"
                                        checked={dontShowAgain}
                                        onCheckedChange={(c) => setDontShowAgain(!!c)}
                                        className="border-slate-300 data-[state=checked]:bg-blue-600"
                                    />
                                    <label htmlFor="dont-show" className="text-[11px] font-bold text-slate-400 cursor-pointer select-none">
                                        Não mostrar na próxima vez
                                    </label>
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    )
}
