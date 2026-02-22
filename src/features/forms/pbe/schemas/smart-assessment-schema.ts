import { z } from "zod";

// Helper for optional numeric fields that might be empty strings
const numeric = z.union([z.number(), z.string()]).transform(val => Number(val) || 0);

// Dynamic Structure for Physical Exam which varies by region
// We use z.any() for deep nested dynamic objects like 'specialTests' or 'rom' to avoid rigid schema issues during rapid migration,
// but we define the top-level structure clearly.

export const SmartAssessmentSchema = z.object({
    // 1. Patient Info & History
    qp: z.string().optional(),
    hma: z.string().optional(),
    painDuration: z.string().optional(),
    eva: numeric.optional(),

    efep: z.object({
        items: z.array(z.object({
            activity: z.string().optional(),
            score: numeric.optional()
        })).optional()
    }).optional(),

    history: z.object({
        hp: z.string().optional(), // History Previous
        medication: z.string().optional(),
        meds: z.array(z.object({
            name: z.string().optional(),
            dose: z.string().optional()
        })).optional(),
        comorbidities: z.array(z.string()).optional(),
        prevTreatment: z.array(z.string()).optional(),
        physicalActivity: z.array(z.string()).optional(),
        activityFrequency: z.string().optional(), // sedentary, 1x, etc
        goals: z.array(z.string()).optional(), // Reduzir Dor, Performance etc
        experience: z.string().optional(),
        injuryStatus: z.string().optional(),
        sleepQuality: z.string().optional(),
    }).optional(),

    // 2. Red Flags (Boolean Map)
    redFlags: z.record(z.string(), z.boolean()).optional(),

    // 3. Clinical Logic / Anamnesis
    anamnesis: z.object({
        onset: z.string().optional(),
        painNature: z.string().optional(),
        mainRegion: z.string().optional(), // Mantido para compatibilidade pontual
        mainRegions: z.array(z.string()).optional(), // 'spine_lumbar', 'knee', etc.
    }).optional(),

    // 4. Physical Exam (Complex Nested Object)
    physicalExam: z.object({
        observation: z.string().optional(),
        movementQuality: z.record(z.string(), z.string().optional()).optional(),
        rom: z.record(z.string(), z.any()).optional(), // Range of Motion
        strength: z.record(z.string(), z.any()).optional(),
        specialTests: z.record(z.string(), z.any()).optional(), // Dynamic keys for tests
        mckenzie: z.any().optional(), // Specific for Lumbar/Cervical
        palpation: z.string().optional(),
        functional: z.any().optional(), // Gait, Single Leg etc
    }).optional(),

    // 5. Neurological
    neurological: z.object({
        reflexes: z.record(z.string(), z.any()).optional(),
        myotomes: z.record(z.string(), z.any()).optional(),
        dermatomes: z.array(z.string()).optional(),
        neuralTension: z.record(z.string(), z.any()).optional(),
    }).optional(),

    // 6. Functional / Radar Data
    functional: z.object({
        functionScore: numeric.optional(),
        chronicity: numeric.optional(),
        flexibility: z.object({
            thomasTest: numeric.optional(),
            lungeTest: numeric.optional(),
            wells: numeric.optional(),
        }).optional(),
        strength: z.object({
            bridgeTest: numeric.optional(),
            plankTest: numeric.optional(),
            dynamometry: numeric.optional(),
        }).optional(),
    }).optional(),

    // 7. Pain Map
    painMap: z.object({
        points: z.array(z.object({
            id: z.string(),
            x: z.number(),
            y: z.number(),
            label: z.string().optional()
        })).optional(),
        observations: z.string().optional()
    }).optional(),

    // 8. Shoe Analysis
    currentShoe: z.object({
        model: z.string().optional(),
        selectionId: z.string().optional(),
        type: z.string().optional(),
        brand: z.string().optional(),
        size: z.union([z.string(), z.number()]).optional(),
        specs: z.object({
            weight: numeric.optional(),
            drop: numeric.optional(),
            stack: numeric.optional(),
            flexLong: z.string().optional(),
            flexTor: z.string().optional(),
            stability: z.any().optional()
        }).optional(),
        minScoreData: z.object({
            flexLong: numeric.optional(),
            flexTor: numeric.optional(),
            stability: numeric.optional()
        }).optional()
    }).optional(),
    // 9. Plan & Follow-up
    plan: z.object({
        orientations: z.string().optional(),
        exercises: z.array(z.any()).optional(),
        followUpDays: z.array(z.string()).optional(),
        monitorPain: z.boolean().optional(),
        extraQuestionnaire: z.string().optional(),
        questionnaires: z.array(z.object({
            type: z.string(),
            data: z.any().optional(),
            score: z.any().optional(),
            savedAt: z.string().optional()
        })).optional()
    }).optional()
});

export type SmartAssessmentValues = z.infer<typeof SmartAssessmentSchema>;
