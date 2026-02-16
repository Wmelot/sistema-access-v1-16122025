'use client'

import { useState, useEffect, useMemo } from 'react'
import { ASSESSMENTS, AssessmentType, Question } from '@/app/dashboard/[slug]/patients/components/assessments/definitions'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { submitPublicAssessment, confirmInsoleOrder, getAdjustmentAvailability, requestAdjustment, getProfessionalInfo, getOccupiedDays } from './actions'
import { CheckCircle, Zap, Phone, ChevronLeft, ChevronRight, ShoppingCart, Plus, Minus, Calendar, Star, Layout, Frown, Meh, Smile, Laugh, Angry } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import Swal from 'sweetalert2'
import { Calendar as CalendarUI } from "@/components/ui/calendar"
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'

interface PublicAssessmentFormProps {
    item: any
    isPreview?: boolean
}

export function PublicAssessmentForm({ item, isPreview = false }: PublicAssessmentFormProps) {
    let type = (item.questionnaire_type || item.type || item.template_id || 'spadi') as AssessmentType
    let definition = ASSESSMENTS[type]

    // Fallback for custom templates or matching by title
    if (!definition && item.template?.title) {
        const found = Object.values(ASSESSMENTS).find(d => d.title === item.template.title || d.title.includes(item.template.title))
        if (found) definition = found
    }
    if (!definition && item.template && item.template.fields) {
        try {
            const dbFields = item.template.fields as any[]
            const questions: Question[] = dbFields.map((f, idx) => ({
                id: f.id || `q${idx + 1}`,
                text: f.label || f.text || '',
                type: f.type === 'radio_group' || f.type === 'select' ? 'mcq' :
                    f.type === 'range' ? 'vas' :
                        f.type === 'text' || f.type === 'textarea' ? 'custom_text' : 'mcq',
                options: f.options?.map((o: any) => {
                    if (typeof o === 'string') return { label: o, value: o }
                    return { label: o.label || o.text || o.value || 'Opção', value: isNaN(Number(o.value)) ? o.value : Number(o.value) }
                }),
                min: f.min, max: f.max
            }))
            definition = {
                id: item.template.id, title: item.template.title, description: item.template.description || '',
                questions: questions, instruction: 'Responda abaixo.',
                calculateScore: (answers: Record<string, any>) => ({ total: 0, classification: 'Escore', note: 'Calculado', flow: { showUpsell: true } })
            } as any
        } catch (e) { }
    }

    const [answers, setAnswers] = useState<Record<string, any>>({})
    const [currentStep, setCurrentStep] = useState(-1) // -1 is Welcome
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [activeView, setActiveView] = useState<'intro' | 'form' | 'success' | 'checkout' | 'adjustment_booking'>('intro')
    const [finalStatus, setFinalStatus] = useState<any>(null)
    const [orderResponse, setOrderResponse] = useState<any>(null)
    const [professional, setProfessional] = useState<any>(null)
    const [quantity, setQuantity] = useState(1)
    const [occupiedDays, setOccupiedDays] = useState<string[]>([])
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
    const [availableSlots, setAvailableSlots] = useState<string[]>([])
    const [isLoadingSlots, setIsLoadingSlots] = useState(false)
    const primaryColor = (item as any).organization?.primary_color || '#ffffff'

    // Handle Completed Status on Mount
    useEffect(() => {
        if (item.status === 'completed' && !isPreview) {
            setActiveView('success')
        }
    }, [item.status, isPreview])

    useEffect(() => {
        if (item.created_by === 'test-prof-id') {
            setProfessional({ full_name: 'Dr(a). Fisioterapeuta (Teste)', phone: '11999999999' })
        } else if (item.created_by) {
            getProfessionalInfo(item.created_by).then(setProfessional)
        }
    }, [item.created_by])

    useEffect(() => {
        if (activeView === 'adjustment_booking' && item.created_by) getOccupiedDays(item.created_by).then(setOccupiedDays)
        if (activeView === 'adjustment_booking' && selectedDate) {
            const fetchSlots = async (date: Date) => {
                setIsLoadingSlots(true)
                try {
                    const slots = await getAdjustmentAvailability(item.created_by, format(date, 'yyyy-MM-dd'))
                    setAvailableSlots(slots)
                } finally { setIsLoadingSlots(false) }
            }
            fetchSlots(selectedDate)
        }
    }, [activeView, selectedDate, item.created_by])

    if (!definition) return <div className="p-10 text-center">Modelo não encontrado.</div>

    const totalQuestions = definition.questions.length
    const currentQuestion = currentStep >= 0 ? definition.questions[currentStep] : null

    const handleAnswer = (questionId: string, value: any) => {
        const newAnswers = { ...answers, [questionId]: value }
        setAnswers(newAnswers)

        if (currentQuestion?.type === 'mcq' && currentStep < totalQuestions - 1) {
            setTimeout(() => setCurrentStep(prev => prev + 1), 400)
        }
    }

    const goToNext = () => {
        if (currentStep === -1) {
            setCurrentStep(0)
            setActiveView('form')
            return
        }
        if (answers[currentQuestion!.id] === undefined && !isPreview) {
            toast.error('Por favor, responda para continuar.')
            return
        }
        if (currentStep < totalQuestions - 1) {
            setCurrentStep(prev => prev + 1)
        } else {
            handleSubmit()
        }
    }

    // Fixed base calculation for 0-5 scale
    const calculateCustomScore = (currentAnswers: Record<string, any>) => {
        const avg = Object.values(currentAnswers).reduce((a, b) => a + Number(b), 0) / Object.values(currentAnswers).length;

        // Critical Logic: Score >= 4 -> Upsell, Score < 4 -> Adjustment
        const isHighSatisfaction = avg >= 4;

        return {
            total: avg * 2, // normalized to 10
            classification: isHighSatisfaction ? 'Excelente Adaptação' : 'Necessário Ajuste',
            flow: {
                showUpsell: isHighSatisfaction,
                showRenewal: isHighSatisfaction,
                showReview: !isHighSatisfaction
            }
        };
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)
        try {
            // Use definition's score calculation if available, otherwise use custom fallback
            const score = definition?.calculateScore ? definition.calculateScore(answers) : calculateCustomScore(answers)
            const res = await submitPublicAssessment(item, answers, score, definition!.title)
            if (res.success) {
                setFinalStatus(score)
                setActiveView('success')
            } else {
                toast.error(res.error || 'Erro ao enviar.')
            }
        } finally { setIsSubmitting(false) }
    }

    const handleConfirmOrder = async (orderType: 'upsell' | 'renewal', amount: number) => {
        setIsSubmitting(true)
        try {
            const res = await confirmInsoleOrder(item, orderType, amount)
            if (res.success) {
                setOrderResponse(res)
                Swal.fire({
                    title: '<span class="text-slate-800 font-black">SOLICITAÇÃO RECEBIDA!</span>',
                    html: `
                        <div class="space-y-4 py-2">
                            <p class="text-slate-600 font-medium"><strong>Pedido confirmado com sucesso!</strong> Seu fisioterapeuta já foi notificado.</p>
                            ${res.paymentLink ? '<p class="text-sm text-emerald-600 font-bold">Clique no botão abaixo para concluir o pagamento.</p>' : ''}
                        </div>
                    `,
                    icon: 'success',
                    confirmButtonText: res.paymentLink ? 'PAGAR AGORA' : 'OK',
                    confirmButtonColor: '#10b981',
                    showCancelButton: !!res.paymentLink,
                    cancelButtonText: 'MAIS TARDE',
                }).then((result) => {
                    if (result.isConfirmed && res.paymentLink) {
                        window.open(res.paymentLink, '_blank')
                    }
                })
            }
        } finally { setIsSubmitting(false) }
    }

    const handleAdjustmentRequest = async () => {
        const res = await requestAdjustment(item)
        if (res.success) setActiveView('adjustment_booking')
    }

    // Checkout Calculations
    const basePrice = 450
    const sendDate = item.created_at ? new Date(item.created_at) : new Date()
    const diffDays = Math.floor((new Date().getTime() - sendDate.getTime()) / (1000 * 3600 * 24))
    const hasDiscount = diffDays <= 10

    // Logic: 1st (15%), 2nd (20%), 3rd+ (25%)
    const discountRate = quantity === 1 ? 0.15 : quantity === 2 ? 0.20 : 0.25
    const originalTotalPrice = basePrice * quantity
    const finalTotalPrice = hasDiscount ? originalTotalPrice * (1 - discountRate) : originalTotalPrice

    // VIEW: INTRO
    if (activeView === 'intro') {
        const titleParts = definition.title.split('(')
        const mainTitle = titleParts[0].trim()
        const subtitle = titleParts[1] ? `(${titleParts[1]}` : null

        return (
            <div className="min-h-screen bg-[#0f1115] flex flex-col items-center justify-center p-6 text-slate-100 font-sans overflow-hidden relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-white/5 rounded-full blur-[120px] -z-10" />
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl w-full text-center space-y-8 md:space-y-12">
                    <div className="mx-auto w-24 h-24 md:w-32 md:h-32 bg-white rounded-[1.5rem] md:rounded-[2.2rem] flex items-center justify-center shadow-2xl overflow-hidden border-2" style={{ borderColor: `${primaryColor}40` }}>
                        {item.organization?.logo_url ? (
                            <img src={item.organization.logo_url} alt={item.organization.name} className="w-full h-full object-contain p-2 md:p-4" />
                        ) : (
                            <div className="text-slate-900 font-black text-3xl md:text-5xl opacity-20">{item.organization?.name?.charAt(0)}</div>
                        )}
                    </div>
                    <div className="space-y-4 md:space-y-6">
                        <Badge variant="outline" className="px-4 md:px-6 py-1 md:py-2 rounded-full uppercase tracking-[0.3em] text-[10px] bg-slate-800/50" style={{ color: `${primaryColor}CC`, borderColor: `${primaryColor}40` }}>Acompanhamento Clínico</Badge>
                        <h1 className="text-4xl md:text-8xl font-black tracking-tighter leading-tight md:leading-[0.9] flex flex-col items-center">
                            <span>{mainTitle}</span>
                            {subtitle && <span className="text-3xl md:text-6xl mt-2 block opacity-80" style={{ color: primaryColor }}>{subtitle}</span>}
                        </h1>
                        <p className="text-slate-400 text-base md:text-2xl font-medium max-w-2xl mx-auto leading-relaxed">
                            {professional ? (
                                <>Responda a esta avaliação para ajudar o(a) <strong className="text-white">{professional.full_name}</strong> a potencializar os efeitos do seu tratamento e garantir o melhor resultado.</>
                            ) : (
                                definition.description || "Gostaríamos de saber como está sua adaptação. Conte-nos para otimizarmos seu tratamento."
                            )}
                        </p>
                        <div className="bg-slate-900/50 p-4 md:p-6 rounded-[2rem] max-w-xl mx-auto space-y-2 border" style={{ borderColor: `${primaryColor}30` }}>
                            <p className="text-[10px] md:text-xs font-black uppercase tracking-widest" style={{ color: primaryColor }}>📋 Instruções de Preenchimento</p>
                            <p className="text-xs md:text-sm font-medium opacity-60" style={{ color: primaryColor }}>Selecione o número ou a carinha que melhor representa sua sensação atual. O processo leva menos de 1 minuto.</p>
                        </div>
                    </div>
                    <div className="pt-4 md:pt-6">
                        <Button size="lg" className="bg-white hover:bg-slate-200 text-slate-950 font-black text-xl md:text-2xl h-14 md:h-20 px-10 md:px-16 rounded-[1.2rem] md:rounded-[2.5rem] shadow-2xl group overflow-hidden relative" onClick={goToNext}>
                            COMEÇAR AGORA <ChevronRight className="ml-2 md:ml-3 w-5 h-5 md:w-8 md:h-8 group-hover:translate-x-2 transition-transform" />
                        </Button>
                    </div>
                </motion.div>
            </div>
        )
    }

    // SUCCESS / CHECKOUT / BOOKING views...
    if (activeView === 'success' || activeView === 'checkout' || activeView === 'adjustment_booking') {
        const flow = (finalStatus || calculateCustomScore(answers))?.flow
        const isUpsell = flow?.showUpsell || flow?.showRenewal

        if (orderResponse?.success) {
            return (
                <div className="min-h-screen bg-[#0f1115] flex flex-col items-center justify-center p-6 font-sans">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-lg w-full bg-[#1a1a1b] p-8 md:p-12 rounded-[3.5rem] border border-slate-800 text-center space-y-6 md:space-y-8 shadow-2xl text-slate-100">
                        <div className="mx-auto w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/20"><CheckCircle className="h-12 w-12 text-white" /></div>
                        <div className="space-y-3">
                            <h2 className="text-4xl font-black tracking-tight text-white">Pedido Recebido!</h2>
                            <p className="text-slate-400 font-medium text-lg leading-relaxed">Seu fisioterapeuta já está trabalhando no seu novo par.</p>
                        </div>
                        {orderResponse.paymentLink && (
                            <Button className="w-full h-16 text-xl font-black rounded-2xl bg-white text-slate-950 hover:bg-slate-200 shadow-xl" onClick={() => window.open(orderResponse.paymentLink, '_blank')}>PAGAR AGORA</Button>
                        )}
                        <Button variant="ghost" className="text-slate-500 font-bold hover:text-white" onClick={() => window.open(`https://wa.me/55${professional?.phone?.replace(/\D/g, '')}`, '_blank')}><Phone className="w-4 h-4 mr-2" /> Falar no WhatsApp</Button>
                    </motion.div>
                </div>
            )
        }

        if (activeView === 'adjustment_booking') {
            return (
                <div className="min-h-screen bg-[#0f1115] flex items-center justify-center p-4 md:p-6 font-sans text-slate-100">
                    <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="max-w-2xl w-full bg-[#1a1a1b] rounded-[3.5rem] border border-slate-800 overflow-hidden shadow-2xl">
                        <header className="p-8 bg-indigo-600/10 border-b border-indigo-500/20 text-center relative">
                            <Button variant="ghost" size="icon" className="absolute top-6 left-6 text-white hover:bg-slate-800" onClick={() => setActiveView('success')}><ChevronLeft /></Button>
                            <h2 className="text-3xl md:text-4xl font-black text-white">Agenda de Ajustes</h2>
                            <p className="text-indigo-400/70 font-bold text-sm md:text-base">Selecione uma vaga para sua revisão</p>
                        </header>
                        <div className="p-10 space-y-8">
                            <div className="flex flex-col md:flex-row gap-10">
                                <div className="flex-1 flex justify-center">
                                    <CalendarUI mode="single" selected={selectedDate} onSelect={setSelectedDate} disabled={(date) => date < new Date() || !occupiedDays.includes(format(date, 'yyyy-MM-dd'))} className="rounded-[2.5rem] bg-slate-900 text-white p-6 shadow-2xl border border-slate-800" locale={ptBR} />
                                </div>
                                <div className="flex-1 space-y-6">
                                    <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Horários Sugeridos</h3>
                                    {isLoadingSlots ? <div className="py-20 text-center"><Zap className="mx-auto w-10 h-10 text-indigo-400 animate-spin" /></div> : (
                                        <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                            {availableSlots.map(t => (
                                                <Button key={t} variant="outline" className="border-slate-800 bg-slate-900 text-slate-100 font-bold h-14 rounded-2xl hover:bg-indigo-600 hover:border-indigo-400 hover:text-white transition-all">{t}</Button>
                                            ))}
                                        </div>
                                    )}
                                    {availableSlots.length === 0 && !isLoadingSlots && <p className="text-slate-600 text-sm text-center italic">Não há vagas disponíveis neste dia.</p>}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )
        }

        if (activeView === 'checkout') {
            return (
                <div className="min-h-screen bg-[#0f1115] flex items-center justify-center p-4 md:p-6 font-sans text-slate-100">
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-xl w-full bg-[#1a1a1b] rounded-[3.5rem] border border-slate-800 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
                        <div className="p-8 md:p-10 bg-slate-800/50 border-b border-slate-800 text-center space-y-2 flex-shrink-0">
                            <Badge className="bg-emerald-500 text-emerald-950 uppercase tracking-widest text-[10px] font-black">OFERTA EXCLUSIVA</Badge>
                            <h2 className="text-3xl md:text-5xl font-black text-white">Meu Par Reserva</h2>
                            <p className="text-slate-400 font-bold text-sm md:text-base italic">Ative seu desconto preferencial agora</p>
                        </div>
                        <div className="p-8 md:p-10 space-y-6 md:space-y-8 overflow-y-auto custom-scrollbar">
                            <div className="flex items-center justify-between p-6 md:p-8 bg-slate-950/50 rounded-[2rem] md:rounded-[3rem] border border-slate-800/50">
                                <span className="font-black text-slate-600 uppercase text-[10px] md:text-xs tracking-wider">Quantidade:</span>
                                <div className="flex items-center gap-6 md:gap-8">
                                    <Button variant="outline" size="icon" className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-slate-800 border-slate-700 text-white hover:bg-slate-700 shadow-lg" onClick={() => setQuantity(q => Math.max(1, q - 1))}><Minus className="w-5 h-5 md:w-6 md:h-6" /></Button>
                                    <span className="text-3xl md:text-4xl font-black text-white w-10 md:w-12 text-center">{quantity}</span>
                                    <Button variant="outline" size="icon" className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-slate-800 border-slate-700 text-white hover:bg-slate-700 shadow-lg" onClick={() => setQuantity(q => Math.min(5, q + 1))}><Plus className="w-5 h-5 md:w-6 md:h-6" /></Button>
                                </div>
                            </div>
                            <div className="text-center space-y-2">
                                <div className="text-slate-600 line-through text-xl md:text-2xl font-bold">R$ {originalTotalPrice.toFixed(2)}</div>
                                <div className="flex items-center justify-center gap-4">
                                    <span className="text-5xl md:text-7xl font-black text-white">R$ {finalTotalPrice.toFixed(2)}</span>
                                    <Badge className="bg-emerald-400 text-emerald-950 font-black h-8 md:h-10 px-3 md:px-4 rounded-full text-base md:text-lg">-{Math.round(discountRate * 100)}%</Badge>
                                </div>
                            </div>
                            <Button className="w-full h-20 md:h-24 text-2xl md:text-3xl font-black rounded-[2rem] md:rounded-[2.5rem] bg-white text-slate-950 hover:bg-slate-200 shadow-2xl transition-all active:scale-95" onClick={() => handleConfirmOrder(flow?.showUpsell ? 'upsell' : 'renewal', finalTotalPrice)}>CONFIRMAR AGORA</Button>
                            <Button variant="ghost" className="w-full text-slate-600 font-black h-12 hover:text-white mb-4" onClick={() => setActiveView('success')}>Deixar para depois</Button>
                        </div>
                    </motion.div>
                </div>
            )
        }

        return (
            <div className="min-h-screen bg-[#0f1115] flex flex-col items-center justify-center p-6 font-sans text-slate-100 text-center">
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="max-w-2xl w-full space-y-8 md:space-y-12">
                    <div className="mx-auto w-24 h-24 md:w-32 md:h-32 bg-emerald-500 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-emerald-500/20"><CheckCircle className="w-10 h-10 md:w-16 md:h-16 text-white" /></div>
                    <div className="space-y-4">
                        <h2 className="text-3xl md:text-6xl font-black tracking-tight text-white uppercase italic">Processo Concluído</h2>
                        <h3 className="text-lg md:text-2xl font-medium text-slate-400">Agradecemos por sua participação. Confira abaixo as próximas etapas sugeridas pelo seu fisioterapeuta:</h3>
                    </div>
                    <div className="grid gap-4 md:gap-8 pt-6 md:pt-8 w-full">
                        {isUpsell && (
                            <Card className="bg-slate-900 border-slate-800 hover:border-emerald-500/50 transition-all cursor-pointer group rounded-[2rem] md:rounded-[3.5rem] overflow-hidden" onClick={() => setActiveView('checkout')}>
                                <CardContent className="p-6 md:p-10 flex items-center gap-6 md:gap-10">
                                    <div className="h-16 w-16 md:h-24 md:w-24 bg-emerald-500 rounded-[1rem] md:rounded-[2rem] flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform flex-shrink-0 text-white"><Zap className="w-8 h-8 md:w-12 md:h-12" /></div>
                                    <div className="text-left w-full">
                                        <h4 className="text-2xl md:text-4xl font-black text-white">Meu Par Reserva</h4>
                                        <p className="text-slate-400 text-sm md:text-lg font-bold">Solicite seu par adicional com desconto.</p>
                                    </div>
                                    <ChevronRight className="text-slate-700 w-8 h-8 flex-shrink-0" />
                                </CardContent>
                            </Card>
                        )}
                        {flow?.showReview && (
                            <Card className="bg-slate-900 border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer group rounded-[2rem] md:rounded-[3.5rem] overflow-hidden" onClick={handleAdjustmentRequest}>
                                <CardContent className="p-6 md:p-10 flex items-center gap-6 md:gap-10">
                                    <div className="h-16 w-16 md:h-24 md:w-24 bg-indigo-500 rounded-[1rem] md:rounded-[2rem] flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform flex-shrink-0 text-white"><Calendar className="w-8 h-8 md:w-12 md:h-12" /></div>
                                    <div className="text-left w-full">
                                        <h4 className="text-2xl md:text-4xl font-black text-white">Agendar Revisão</h4>
                                        <p className="text-slate-400 text-sm md:text-lg font-bold">Marque seu ajuste técnico presencial.</p>
                                    </div>
                                    <ChevronRight className="text-slate-700 w-8 h-8 flex-shrink-0" />
                                </CardContent>
                            </Card>
                        )}
                        <Card className="bg-slate-900 border-slate-800 hover:border-slate-500/50 transition-all cursor-pointer group rounded-[2rem] md:rounded-[3.5rem] overflow-hidden" onClick={() => window.open(`https://wa.me/55${professional?.phone?.replace(/\D/g, '')}?text=Olá! Acabei de completar a avaliação e gostaria de agendar uma consulta.`, '_blank')}>
                            <CardContent className="p-6 md:p-10 flex items-center gap-6 md:gap-10">
                                <div className="h-16 w-16 md:h-24 md:w-24 bg-slate-700 rounded-[1rem] md:rounded-[2rem] flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform flex-shrink-0 text-white"><Phone className="w-8 h-8 md:w-12 md:h-12" /></div>
                                <div className="text-left w-full">
                                    <h4 className="text-2xl md:text-4xl font-black text-white">Agendar Consulta</h4>
                                    <p className="text-slate-400 text-sm md:text-lg font-bold">Falar com nossa equipe no WhatsApp.</p>
                                </div>
                                <ChevronRight className="text-slate-700 w-8 h-8 flex-shrink-0" />
                            </CardContent>
                        </Card>
                    </div>
                    <div className="pt-6 md:pt-10">
                        <Button variant="ghost" className="text-slate-600 font-black h-12 hover:text-white" onClick={() => window.location.reload()}>Finalizar e Fechar</Button>
                    </div>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0f1115] flex flex-col font-sans select-none overflow-x-hidden text-slate-100">
            <header className="p-4 md:p-8 flex items-center justify-between bg-[#0f1115]/80 backdrop-blur sticky top-0 z-50 border-b border-slate-800/50">
                <div className="flex items-center gap-2 md:gap-4">
                    <div className="w-10 h-10 md:w-14 md:h-14 bg-white rounded-[0.8rem] md:rounded-[1rem] flex items-center justify-center shadow-lg overflow-hidden border" style={{ borderColor: `${primaryColor}30` }}>
                        {item.organization?.logo_url ? (
                            <img src={item.organization.logo_url} alt={item.organization.name} className="w-full h-full object-contain p-1.5" />
                        ) : (
                            <span className="text-slate-950 font-black text-xl">{item.organization?.name?.charAt(0)}</span>
                        )}
                    </div>
                    <span className="font-black uppercase tracking-[0.3em] text-[8px] md:text-[10px] hidden sm:block opacity-60" style={{ color: primaryColor }}>{item.organization?.name || 'Axiom Clinical Support'}</span>
                </div>
                <div className="flex items-center gap-4 md:gap-8">
                    <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: primaryColor }}>Etapa {currentStep + 1} / {totalQuestions}</div>
                    <div className="w-32 md:w-60 h-1.5 bg-slate-900 rounded-full overflow-hidden" style={{ backgroundColor: `${primaryColor}10` }}>
                        <motion.div className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.2)]" initial={{ width: 0 }} animate={{ width: `${((currentStep + 1) / totalQuestions) * 100}%` }} style={{ backgroundColor: primaryColor }} />
                    </div>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12">
                <AnimatePresence mode="wait">
                    <motion.div key={currentQuestion!.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }} className="max-w-5xl w-full">
                        <QuestionRenderer
                            question={currentQuestion!}
                            value={answers[currentQuestion!.id]}
                            onChange={(val) => handleAnswer(currentQuestion!.id, val)}
                            primaryColor={primaryColor}
                        />
                    </motion.div>
                </AnimatePresence>
            </main>

            <footer className="p-8 md:p-20 flex items-center justify-between max-w-5xl mx-auto w-full gap-4 md:gap-10">
                <Button variant="ghost" className="text-slate-600 font-black uppercase text-[10px] md:text-xs tracking-[0.2em] md:tracking-[0.4em] h-12 md:h-16 px-4 md:px-10 rounded-xl md:rounded-2xl hover:text-white transition-all disabled:opacity-0" onClick={() => setCurrentStep(prev => prev - 1)} disabled={currentStep <= 0}>VOLTAR</Button>
                <Button size="lg" className={cn("flex-1 md:flex-none h-16 md:h-24 px-8 md:px-20 rounded-[1.5rem] md:rounded-[2.5rem] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] text-lg md:text-2xl shadow-2xl transition-all hover:scale-105 active:scale-95", currentStep === totalQuestions - 1 ? "bg-emerald-500 text-emerald-950" : "bg-white text-slate-950 hover:bg-slate-200")} onClick={goToNext} disabled={isSubmitting}>
                    {isSubmitting ? '...' : (currentStep === totalQuestions - 1 ? 'FINALIZAR' : 'PRÓXIMO')}
                </Button>
            </footer>
        </div>
    )
}

function QuestionRenderer({ question, value, onChange, primaryColor }: { question: Question, value: any, onChange: (v: any) => void, primaryColor: string }) {
    const parts = question.text.split('(')
    const mainQuestion = parts[0].trim()
    const instructionPart = parts[1] ? parts[1].split(')')[0] : ''

    let minText = ''
    let maxText = ''
    if (instructionPart.includes('=')) {
        const labels = instructionPart.split(',').map(s => s.trim())
        minText = labels.find(l => l.includes('0=') || l.includes('1='))?.split('=')[1] || ''
        maxText = labels.find(l => l.includes('10=') || l.includes('5='))?.split('=')[1] || ''
    }

    if (question.type === 'vas') {
        const emojiItems = [
            { icon: Angry, val: 0, label: 'Crítico' },
            { icon: Frown, val: 1, label: 'Ruim' },
            { icon: Meh, val: 2, label: 'Regular' },
            { icon: Meh, val: 3, label: 'Bom' },
            { icon: Smile, val: 4, label: 'Muito Bom' },
            { icon: Laugh, val: 5, label: 'Perfeito' }
        ]

        return (
            <div className="space-y-10 md:space-y-16 text-center w-full">
                <div className="space-y-4 md:space-y-6 px-4">
                    <h2 className="text-2xl md:text-5xl font-black text-white leading-tight tracking-tighter drop-shadow-2xl">
                        {mainQuestion}
                    </h2>
                    {instructionPart && (
                        <p className="text-lg md:text-3xl font-bold tracking-tight opacity-50 italic" style={{ color: primaryColor }}>
                            ({instructionPart})
                        </p>
                    )}
                </div>

                <div className="flex flex-row justify-between md:justify-center items-end gap-1 md:gap-8 pt-6 md:pt-10 px-1 w-full max-w-2xl mx-auto">
                    {emojiItems.map((item, idx) => {
                        const isSelected = value === item.val
                        const Icon = item.icon

                        // Neutral but clear premium colors
                        const colorClass = item.val < 3 ? "text-red-400" : item.val < 4 ? "text-amber-200" : "text-emerald-300"
                        const bgColorClass = item.val < 3 ? "bg-red-400/5 border-red-400/20" : item.val < 4 ? "bg-amber-100/5 border-amber-100/20" : "bg-emerald-300/5 border-emerald-300/20"

                        return (
                            <motion.button
                                key={item.val}
                                whileHover={{ y: -10, scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => onChange(item.val)}
                                className="flex flex-col items-center gap-2 group flex-shrink-0"
                            >
                                <div className={cn(
                                    "w-12 h-12 sm:w-16 sm:h-16 md:w-32 md:h-32 rounded-[1.2rem] sm:rounded-[1.5rem] md:rounded-[3rem] flex flex-col items-center justify-center border-2 transition-all duration-500 shadow-2xl relative",
                                    isSelected ? cn(bgColorClass.split(' ')[0], "border-current scale-110 -translate-y-2 md:-translate-y-4 ring-2 md:ring-4 ring-current/20", colorClass) : "bg-slate-900/30 border-slate-800/50 grayscale"
                                )}>
                                    <Icon className={cn("w-6 h-6 sm:w-8 sm:h-8 md:w-16 md:h-16", isSelected ? "animate-bounce-short" : "text-slate-200/50 group-hover:text-slate-200 transition-colors")} />
                                </div>

                                <motion.span
                                    initial={false}
                                    animate={{ opacity: isSelected ? 1 : 0.8 }}
                                    className={cn(
                                        "text-[10px] md:text-xl font-black transition-colors px-1",
                                        isSelected ? colorClass : "text-slate-200"
                                    )}
                                >
                                    {item.val}
                                </motion.span>
                            </motion.button>
                        )
                    })}
                </div>

                <style jsx global>{`
                    @keyframes bounce-short {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-3px); }
                    }
                    .animate-bounce-short { animation: bounce-short 1s infinite; }
                    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
                `}</style>
            </div>
        )
    }

    if (question.type === 'mcq') {
        return (
            <div className="space-y-10 md:space-y-16 text-center w-full">
                <div className="space-y-4 md:space-y-6">
                    <h2 className="text-2xl md:text-5xl font-black text-white tracking-tighter leading-tight drop-shadow-2xl">
                        {mainQuestion}
                    </h2>
                    {instructionPart && (
                        <p className="text-lg md:text-3xl font-bold tracking-tight opacity-50 italic" style={{ color: primaryColor }}>
                            ({instructionPart})
                        </p>
                    )}
                </div>

                <RadioGroup value={value?.toString() ?? ''} onValueChange={(val) => onChange(Number(val))} className="grid gap-3 md:gap-4 max-w-2xl mx-auto pt-6 lg:pt-8 w-full">
                    {question.options?.map((opt, idx) => {
                        const safeVal = opt.value?.toString() ?? `opt-${idx}`
                        const isSelected = value?.toString() === safeVal
                        return (
                            <motion.div
                                key={idx}
                                whileHover={{ x: 10 }}
                                whileTap={{ scale: 0.98 }}
                                className={cn(
                                    "group flex items-center px-6 md:px-12 py-5 md:py-8 rounded-[1.5rem] md:rounded-[3rem] border-2 transition-all cursor-pointer shadow-xl",
                                    isSelected ? "border-emerald-500 bg-emerald-500/10 shadow-emerald-500/10" : "border-slate-800 bg-slate-900/50 hover:bg-slate-900"
                                )}
                                onClick={() => onChange(Number(safeVal))}
                            >
                                <div className={cn("w-6 h-6 md:w-8 md:h-8 rounded-full border-2 flex items-center justify-center mr-4 md:mr-8 transition-colors flex-shrink-0", isSelected ? "border-emerald-500 bg-emerald-500" : "border-slate-700")}>
                                    {isSelected && <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-emerald-950 rounded-full" />}
                                </div>
                                <span className={cn("text-lg md:text-3xl font-black tracking-tight text-left transition-colors", isSelected ? "text-white" : "text-slate-500")}>
                                    {opt.label}
                                </span>
                            </motion.div>
                        )
                    })}
                </RadioGroup>
            </div>
        )
    }

    return null
}
