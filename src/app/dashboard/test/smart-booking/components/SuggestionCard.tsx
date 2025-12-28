'use client'

import { TimeSlot } from '@/lib/smart-booking/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Sparkles, Sun, Moon } from 'lucide-react'
import { formatTimeDisplay } from '@/lib/smart-booking/utils'

interface SuggestionCardProps {
    slot: TimeSlot | null
    period: 'morning' | 'afternoon'
    onBook: (slot: TimeSlot) => void
    loading?: boolean
}

export function SuggestionCard({ slot, period, onBook, loading }: SuggestionCardProps) {
    if (!slot) {
        return (
            <Card className="opacity-50">
                <CardContent className="p-6">
                    <div className="text-center text-muted-foreground">
                        <p className="text-sm">Nenhum horário disponível neste período</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const isPeriodMorning = period === 'morning'
    const gradientClass = isPeriodMorning
        ? 'from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20'
        : 'from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20'

    const iconClass = isPeriodMorning ? 'text-amber-600' : 'text-indigo-600'
    const Icon = isPeriodMorning ? Sun : Moon

    return (
        <Card className={`overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] bg-gradient-to-br ${gradientClass} border-2`}>
            <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Icon className={`h-5 w-5 ${iconClass}`} />
                        <span className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                            {isPeriodMorning ? 'Manhã' : 'Tarde/Noite'}
                        </span>
                    </div>
                    {slot.score > 50 && (
                        <Sparkles className="h-4 w-4 text-yellow-500" />
                    )}
                </div>

                {/* Time Display */}
                <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <span className="text-3xl font-bold">
                            {formatTimeDisplay(slot.time)}
                        </span>
                        {slot.endTime && (
                            <span className="text-lg text-muted-foreground">
                                - {formatTimeDisplay(slot.endTime)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Reasons/Badges */}
                {slot.reasons && slot.reasons.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {slot.reasons.map((reason, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                                {reason === 'Gap Filler' && '🎯 Preenche Intervalo'}
                                {reason === 'Prime Time' && '⭐ Horário Nobre'}
                                {reason === 'Early Bird' && '🌅 Manhã Cedo'}
                                {reason === 'Soon Available' && '⚡ Disponível em Breve'}
                                {reason === 'Your Usual Time' && '🕐 Seu Horário Habitual'}
                                {reason === 'Lunch Time' && '🍽️ Horário de Almoço'}
                                {!['Gap Filler', 'Prime Time', 'Early Bird', 'Soon Available', 'Your Usual Time', 'Lunch Time'].includes(reason) && reason}
                            </Badge>
                        ))}
                    </div>
                )}

                {/* Score Indicator (for debugging/testing) */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="text-xs text-muted-foreground mb-3">
                        Score: {slot.score}
                    </div>
                )}

                {/* Action Button */}
                <Button
                    onClick={() => onBook(slot)}
                    disabled={loading}
                    className="w-full"
                    size="lg"
                >
                    {loading ? 'Agendando...' : 'Agendar Agora'}
                </Button>
            </CardContent>
        </Card>
    )
}
