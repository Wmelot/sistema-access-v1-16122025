"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface OnboardingStep {
    id: string
    title: string
    description: string
    targetId: string
    position: "top" | "bottom" | "left" | "right" | "center"
    path?: string // Optional: navigate to this path before showing this step
}

interface OnboardingContextType {
    isActive: boolean
    currentStepIndex: number
    steps: OnboardingStep[]
    startOnboarding: (type?: 'initial' | 'schedule') => void
    nextStep: () => void
    prevStep: () => void
    completeOnboarding: () => void
    skipOnboarding: () => void
    isInitialTour: boolean
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({
    children,
    userHasCompleted,
    userId,
    slug,
    userRole
}: {
    children: React.ReactNode,
    userHasCompleted: boolean,
    userId: string
    slug?: string
    userRole?: string
}) {
    const [isActive, setIsActive] = useState(false)
    const [currentStepIndex, setCurrentStepIndex] = useState(0)
    const [isInitialTour, setIsInitialTour] = useState(true)
    const supabase = createClient()
    const router = useRouter()

    const isAdmin = userRole === 'admin' || userRole === 'master' || userRole === 'Administrador' || userRole === 'Master'

    // Steps focused on Admin/Clinic Setup
    const adminSetupSteps: OnboardingStep[] = [
        {
            id: "welcome-admin",
            title: isAdmin ? "Configuração da Clínica" : "Bem-vindo ao Axiom!",
            description: "Vamos configurar os pilares da sua clínica. Se você já cadastrou seus locais e serviços, sinta-se à vontade para avançar os passos.",
            targetId: "welcome-tour",
            position: "center"
        },
        {
            id: "nav-management",
            title: "Central de Gestão",
            description: "Aqui é onde a mágica acontece. Se sua clínica ainda não tem salas cadastradas, vamos começar por aqui.",
            targetId: "nav-management",
            position: "right",
            path: `/dashboard/${slug}`
        },
        {
            id: "mgmt-locations",
            title: "1. Gestão de Locais",
            description: "Clique aqui para gerenciar seus consultórios. Caso já tenha suas salas configuradas, clique em 'Próximo passo'.",
            targetId: "mgmt-locations",
            position: "bottom",
            path: `/dashboard/${slug}/management`
        },
        {
            id: "add-location",
            title: "Novo Local",
            description: "Aqui você adiciona salas, box ou consultórios. Se já fez isso, clique no botão de pular no tour.",
            targetId: "add-location-btn",
            position: "bottom",
            path: `/dashboard/${slug}/locations`
        },
        {
            id: "save-location",
            title: "Salvar Local",
            description: "Dê um nome e salve. Se este local já estiver na lista abaixo, avance o tutorial.",
            targetId: "save-location-btn",
            position: "bottom",
            path: `/dashboard/${slug}/locations`
        }
    ]

    // Steps focused on Personal/Professional Setup
    const professionalSteps: OnboardingStep[] = [
        {
            id: "profile-me",
            title: "Seu Perfil Profissional",
            description: "Agora uma parte crucial: sua identidade. Clique no menu do usuário para configurar seu nome, foto e horários de atendimento.",
            targetId: "user-menu-trigger",
            position: "bottom",
            path: isAdmin ? `/dashboard/${slug}/locations` : `/dashboard/${slug}`
        },
        {
            id: "click-profile-settings",
            title: "Configurações de Perfil",
            description: "Clique aqui para editar seus dados. É aqui que você deixa de ser 'Usuário' para ter seu nome e foto no sistema.",
            targetId: "user-profile-settings-link",
            position: "left"
        },
        {
            id: "tab-availability",
            title: "Sua Agenda de Trabalho",
            description: "Na aba 'Horários', defina sua disponibilidade. Isso é o que permite que os pacientes sejam agendados para você.",
            targetId: "tab-availability",
            position: "bottom",
            path: `/dashboard/${slug}/profile/me`
        },
        {
            id: "save-profile",
            title: "Finalizar Perfil",
            description: "Tudo pronto? Clique em 'Salvar' para que seus horários passem a valer na agenda.",
            targetId: "save-professional-btn",
            position: "bottom",
            path: `/dashboard/${slug}/profile/me`
        }
    ]

    // Service Setup (Admin only)
    const serviceSteps: OnboardingStep[] = [
        {
            id: "go-back-mgmt",
            title: "Catálogo de Serviços",
            description: "Por fim, vamos aos procedimentos. Clique em 'Configurações Gerais' novamente.",
            targetId: "nav-management",
            position: "right",
            path: isAdmin ? `/dashboard/${slug}/profile/me` : `/dashboard/${slug}`
        },
        {
            id: "mgmt-services",
            title: "Gestão de Serviços",
            description: "Configure o que você oferece (ex: Consulta, Pilates, RPG). Se já estão cadastrados, avance.",
            targetId: "mgmt-services",
            position: "bottom",
            path: `/dashboard/${slug}/management`
        },
        {
            id: "add-service",
            title: "Novo Procedimento",
            description: "Defina o nome, valor e duração. Se seu catálogo já está pronto, pule este passo.",
            targetId: "add-service-btn",
            position: "bottom",
            path: `/dashboard/${slug}/services`
        },
        {
            id: "save-service",
            title: "Confirmar Serviço",
            description: "Salve para concluir a base da sua clínica. Se já terminou, clique em 'Próximo passo'.",
            targetId: "save-service-btn",
            position: "bottom",
            path: `/dashboard/${slug}/services`
        }
    ]

    const finalStep: OnboardingStep = {
        id: "agenda-final",
        title: "Tudo Pronto!",
        description: "A configuração básica foi concluída! Agora você pode gerenciar sua clínica com total controle. O que deseja fazer agora?",
        targetId: "nav-agenda",
        position: "right",
        path: isAdmin ? `/dashboard/${slug}/services` : `/dashboard/${slug}/profile/me`
    }

    // Compose final list based on role
    const initialSteps: OnboardingStep[] = isAdmin
        ? [...adminSetupSteps, ...professionalSteps, ...serviceSteps, finalStep]
        : [{
            id: "welcome-pro",
            title: "Olá Profissional!",
            description: "Bem-vindo! Vamos configurar seu perfil e horários de atendimento para que você possa começar a usar a agenda.",
            targetId: "welcome-tour",
            position: "center"
        }, ...professionalSteps, finalStep]

    const scheduleSteps: OnboardingStep[] = [
        {
            id: "nav-agenda-start",
            title: "Abrindo a Agenda",
            description: "Clique em 'Agenda' no menu lateral para visualizar seus horários.",
            targetId: "nav-agenda",
            position: "right",
            path: `/dashboard/${slug}`
        },
        {
            id: "click-slot",
            title: "Escolhendo o Horário",
            description: "Clique duas vezes ou arraste em um horário livre no calendário para iniciar o agendamento.",
            targetId: "calendar-grid",
            position: "center",
            path: `/dashboard/${slug}/schedule`
        },
        {
            id: "select-patient",
            title: "Selecionar Paciente",
            description: "Busque um paciente existente ou cadastre um novo rapidamente.",
            targetId: "appointment-patient-select",
            position: "bottom",
            path: `/dashboard/${slug}/schedule`
        },
        {
            id: "select-service",
            title: "Escolher o Serviço",
            description: "Selecione qual procedimento será realizado.",
            targetId: "appointment-service-select",
            position: "bottom",
            path: `/dashboard/${slug}/schedule`
        },
        {
            id: "confirm-appointment",
            title: "Finalizar Agendamento",
            description: "Tudo certo! Agora é só clicar em 'Confirmar Agendamento'.",
            targetId: "save-appointment-btn",
            position: "top",
            path: `/dashboard/${slug}/schedule`
        }
    ]

    const steps = isInitialTour ? initialSteps : scheduleSteps

    useEffect(() => {
        if (!userHasCompleted) {
            const skipAuto = localStorage.getItem('onboarding_skip_auto') === 'true'
            if (skipAuto) return

            const timer = setTimeout(() => {
                setIsActive(true)
            }, 2000)
            return () => clearTimeout(timer)
        }
    }, [userHasCompleted])

    const startOnboarding = useCallback((type: 'initial' | 'schedule' = 'initial') => {
        setIsInitialTour(type === 'initial')
        setCurrentStepIndex(0)
        setIsActive(true)
    }, [])

    const nextStep = useCallback(async () => {
        if (currentStepIndex < steps.length - 1) {
            const nextIdx = currentStepIndex + 1
            const nextPath = steps[nextIdx].path

            if (nextPath && !window.location.pathname.includes(nextPath)) {
                router.push(nextPath)
                setTimeout(() => setCurrentStepIndex(nextIdx), 500)
            } else {
                setCurrentStepIndex(nextIdx)
            }
        } else {
            completeOnboarding()
        }
    }, [currentStepIndex, steps, router])

    const prevStep = useCallback(() => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(currentStepIndex - 1)
        }
    }, [currentStepIndex])

    const completeOnboarding = useCallback(async () => {
        setIsActive(false)
        if (userId) {
            await supabase.from('profiles').update({ has_completed_onboarding: true }).eq('id', userId)
        }
    }, [userId, supabase])

    const skipOnboarding = useCallback(async () => {
        setIsActive(false)
    }, [])

    return (
        <OnboardingContext.Provider value={{
            isActive,
            currentStepIndex,
            steps,
            startOnboarding,
            nextStep,
            prevStep,
            completeOnboarding,
            skipOnboarding,
            isInitialTour
        }}>
            {children}
        </OnboardingContext.Provider>
    )
}

export function useOnboarding() {
    const context = useContext(OnboardingContext)
    if (context === undefined) {
        throw new Error("useOnboarding must be used within an OnboardingProvider")
    }
    return context
}
