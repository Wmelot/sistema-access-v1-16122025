// Smart Booking Scoring System
// Intelligent slot ranking algorithm

import type { TimeSlot, Appointment, ScoringWeights, SuggestionContext } from './types'
import { DEFAULT_WEIGHTS } from './types'
import { parseTimeToMinutes, addMinutes, hasOverlap, isSameDay, hashDate } from './utils'

/**
 * Calculate score for a time slot based on multiple factors
 */
export function calculateSlotScore(
    slot: TimeSlot,
    context: SuggestionContext,
    weights: ScoringWeights = DEFAULT_WEIGHTS
): number {
    let score = 1 // Base score

    // 1. Gap Filler: Prioritize slots adjacent to existing appointments
    if (isGapFiller(slot, context.existingAppointments, context.serviceDuration || 60)) {
        score += weights.GAP_FILLER
        slot.reasons.push('Gap Filler')
    }

    // 2. Prime Time: Boost evening slots (17h-20h)
    if (isPrimeTime(slot.time)) {
        score += weights.PRIME_TIME
        slot.reasons.push('Prime Time')
    }

    // 3. Early Bird: Boost morning slots (before 9h)
    if (isEarlyBird(slot.time)) {
        score += weights.EARLY_BIRD
        slot.reasons.push('Early Bird')
    }

    // 4. Lunch Time Penalty: Reduce score for lunch hours (12h-14h)
    if (isLunchTime(slot.time)) {
        score += weights.LUNCH_PENALTY
        slot.reasons.push('Lunch Time')
    }

    // 5. Same Day Urgency: Boost today/tomorrow slots
    if (isSameDay(slot.date)) {
        score += weights.SAME_DAY
        slot.reasons.push('Soon Available')
    }

    // 6. Patient History: Boost slots matching patient's usual time
    if (context.patientHistory && context.patientHistory.length > 0) {
        const preferredTime = getPatientPreferredTime(context.patientHistory)
        if (preferredTime && isNearTime(slot.time, preferredTime, 60)) {
            score += weights.PATIENT_HISTORY
            slot.reasons.push('Your Usual Time')
        }
    }

    // 7. Load Balance: Penalize overbooked days
    const appointmentsOnDay = context.existingAppointments.length
    const averagePerDay = 8 // Configurable
    if (appointmentsOnDay > averagePerDay * 1.5) {
        score += weights.LOAD_BALANCE
    }

    slot.score = Math.max(0, score) // Ensure non-negative
    return slot.score
}

/**
 * Check if slot fills a gap between appointments
 */
export function isGapFiller(
    slot: TimeSlot,
    appointments: Appointment[],
    serviceDuration: number
): boolean {
    const slotStartMin = parseTimeToMinutes(slot.time)
    const slotEndMin = slotStartMin + serviceDuration

    for (const apt of appointments) {
        const aptStartMin = parseTimeToMinutes(apt.start_time)
        const aptEndMin = parseTimeToMinutes(apt.end_time)

        // Check if slot is immediately after this appointment (within 15 min)
        if (Math.abs(slotStartMin - aptEndMin) <= 15) {
            return true
        }

        // Check if slot is immediately before this appointment (within 15 min)
        if (Math.abs(aptStartMin - slotEndMin) <= 15) {
            return true
        }
    }

    return false
}

/**
 * Check if time is in prime time range (17h-20h)
 */
export function isPrimeTime(time: string): boolean {
    const hour = parseInt(time.split(':')[0])
    return hour >= 17 && hour < 20
}

/**
 * Check if time is early bird range (before 9h)
 */
export function isEarlyBird(time: string): boolean {
    const hour = parseInt(time.split(':')[0])
    return hour < 9
}

/**
 * Check if time is in lunch range (12h-14h)
 */
export function isLunchTime(time: string): boolean {
    const hour = parseInt(time.split(':')[0])
    return hour >= 12 && hour < 14
}

/**
 * Check if two times are within a certain range
 */
export function isNearTime(time1: string, time2: string, thresholdMinutes: number): boolean {
    const diff = Math.abs(parseTimeToMinutes(time1) - parseTimeToMinutes(time2))
    return diff <= thresholdMinutes
}

/**
 * Get patient's preferred time based on history
 */
export function getPatientPreferredTime(history: Appointment[]): string | null {
    if (history.length === 0) return null

    // Count frequency of each hour
    const hourCounts: Record<number, number> = {}

    for (const apt of history) {
        const hour = parseInt(apt.start_time.split(':')[0])
        hourCounts[hour] = (hourCounts[hour] || 0) + 1
    }

    // Find most common hour
    let maxCount = 0
    let preferredHour = 0

    for (const [hour, count] of Object.entries(hourCounts)) {
        if (count > maxCount) {
            maxCount = count
            preferredHour = parseInt(hour)
        }
    }

    return `${preferredHour.toString().padStart(2, '0')}:00`
}

/**
 * Shuffle top-scoring slots for variety
 * Uses date-based seed for consistency within same day
 */
export function shuffleTopScores(slots: TimeSlot[], topN: number = 3): TimeSlot | null {
    if (slots.length === 0) return null

    // Sort by score descending
    const sorted = [...slots].sort((a, b) => b.score - a.score)

    // Get max score
    const maxScore = sorted[0].score

    // Get all slots with max score
    const topSlots = sorted.filter(s => s.score === maxScore).slice(0, topN)

    if (topSlots.length === 0) return null
    if (topSlots.length === 1) return topSlots[0]

    // Use date-based seed for consistent randomness within same day
    const seed = hashDate(slots[0].date)
    const index = seed % topSlots.length

    return topSlots[index]
}

/**
 * Group slots by morning (< 12:00) and afternoon (>= 12:00)
 */
export function groupSlotsByPeriod(slots: TimeSlot[]): {
    morning: TimeSlot[]
    afternoon: TimeSlot[]
} {
    const morning: TimeSlot[] = []
    const afternoon: TimeSlot[] = []

    for (const slot of slots) {
        const hour = parseInt(slot.time.split(':')[0])
        if (hour < 12) {
            morning.push(slot)
        } else {
            afternoon.push(slot)
        }
    }

    return { morning, afternoon }
}

/**
 * Filter available slots (no overlap with existing appointments)
 */
export function filterAvailableSlots(
    allSlots: string[],
    appointments: Appointment[],
    date: string,
    serviceDuration: number
): TimeSlot[] {
    const availableSlots: TimeSlot[] = []

    for (const time of allSlots) {
        const endTime = addMinutes(time, serviceDuration)
        let isAvailable = true

        // Check for overlaps
        for (const apt of appointments) {
            if (hasOverlap(time, endTime, apt.start_time, apt.end_time)) {
                isAvailable = false
                break
            }
        }

        if (isAvailable) {
            availableSlots.push({
                time,
                date,
                available: true,
                score: 0,
                reasons: [],
                endTime
            })
        }
    }

    return availableSlots
}
