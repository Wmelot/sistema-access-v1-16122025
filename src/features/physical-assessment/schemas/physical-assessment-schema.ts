import { z } from "zod";

// --- Sub-schemas for clarity ---

export const AntroSchema = z.object({
    gender: z.enum(["male", "female"]),
    age: z.coerce.number().min(0, "Idade inválida"),
    weight: z.coerce.number().min(0, "Peso inválido"),
    height: z.coerce.number().min(0, "Altura inválida"),
    thigh: z.coerce.number().min(0).optional(),
    suprailiac: z.coerce.number().min(0).optional(),
    abdominal: z.coerce.number().min(0).optional(),
});

export const CardioSchema = z.object({
    method: z.enum(["rockport", "cooper"]),
    timeMin: z.coerce.number().min(0).optional(),
    heartRate: z.coerce.number().min(0).optional(),
    distance: z.coerce.number().min(0).optional(),
    vo2Max: z.coerce.number().min(0).optional(),
});

export const MobilitySchema = z.object({
    wells: z.coerce.number().optional(),
    legRaiseRight: z.coerce.number().optional(),
    legRaiseLeft: z.coerce.number().optional(),
    shoulderReachRight: z.coerce.number().optional(),
    shoulderReachLeft: z.coerce.number().optional(),
});

export const PerimetrySchema = z.object({
    chest: z.coerce.number().optional(),
    waist: z.coerce.number().optional(),
    hip: z.coerce.number().optional(),
    armRelaxedRight: z.coerce.number().optional(),
    armContractedRight: z.coerce.number().optional(),
    thighRight: z.coerce.number().optional(),
    calfRight: z.coerce.number().optional(),
});

export const VitalsSchema = z.object({
    restingHeartRate: z.coerce.number().optional(),
    bloodPressureSys: z.coerce.number().optional(),
    bloodPressureDia: z.coerce.number().optional(),
});

export const AnamnesisSchema = z.object({
    mainComplaint: z.string().min(1, "Queixa principal é obrigatória"),
    hma: z.string().optional(),
    trainingLevel: z.enum(["beginner", "intermediate", "advanced"]),
    goal: z.enum(["hypertrophy", "weight_loss", "rehab", "performance"]),
});

export const StrengthSchema = z.object({
    upperBody: z.record(z.string(), z.object({ left: z.coerce.number(), right: z.coerce.number() })).optional(),
    lowerBody: z.record(z.string(), z.object({ left: z.coerce.number(), right: z.coerce.number() })).optional(),
});

export const PostureSchema = z.object({
    observations: z.array(z.string()).optional(),
    photos: z.object({
        anterior: z.string().optional(),
        posterior: z.string().optional(),
        left: z.string().optional(),
        right: z.string().optional(),
    }).optional(),
    alterations: z.record(z.string(), z.boolean()).optional()
});

// --- Main Schema ---

export const PhysicalAssessmentSchema = z.object({
    antro: AntroSchema,
    cardio: CardioSchema,
    strength: StrengthSchema,
    mobility: MobilitySchema,
    perimetry: PerimetrySchema,
    vitals: VitalsSchema,
    anamnesis: AnamnesisSchema,
    posture: PostureSchema,
});

export type PhysicalAssessmentFormValues = z.infer<typeof PhysicalAssessmentSchema>;
