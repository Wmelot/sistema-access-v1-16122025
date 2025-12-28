// Smart Booking Type Definitions
// All types for the intelligent scheduling system

export interface TimeSlot {
    time: string // HH:MM format
    date: string // YYYY-MM-DD format
    available: boolean
    score: number
    reasons: string[]
    endTime?: string
}

export interface SuggestionContext {
    professionalId: string
    serviceId: string
    date: string
    existingAppointments: Appointment[]
    patientHistory?: Appointment[]
    serviceDuration?: number // in minutes
}

export interface SmartSuggestion {
    date: string
    morning: TimeSlot | null
    afternoon: TimeSlot | null
    alternativeSlots: TimeSlot[]
}

export interface Appointment {
    id: string
    date: string
    start_time: string
    end_time: string
    status: string
    patient_id?: string
    professional_id: string
}

export interface ScoringWeights {
    GAP_FILLER: number        // Adjacent to existing appointment
    PRIME_TIME: number        // 17:00 - 20:00
    EARLY_BIRD: number        // Before 09:00
    LUNCH_PENALTY: number     // 12:00 - 14:00
    SAME_DAY: number          // Today or tomorrow
    PATIENT_HISTORY: number   // Matches patient's usual time
    LOAD_BALANCE: number      // Day is overbooked (negative)
}

export interface SmartSuggestionsRequest {
    professionalId: string
    serviceId: string
    date: string
    patientId?: string
}

export interface SmartSuggestionsResponse {
    success: boolean
    data?: SmartSuggestion
    error?: string
}

// Default scoring weights
export const DEFAULT_WEIGHTS: ScoringWeights = {
    GAP_FILLER: 50,
    PRIME_TIME: 20,
    EARLY_BIRD: 10,
    LUNCH_PENALTY: -15,
    SAME_DAY: 30,
    PATIENT_HISTORY: 15,
    LOAD_BALANCE: -10,
}
