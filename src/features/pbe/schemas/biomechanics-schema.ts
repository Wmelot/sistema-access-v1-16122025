import { z } from "zod";

// --- Sub-schemas ---

export const ClinicalSchema = z.object({
    mainComplaint: z.string().min(1, "Queixa principal obrigatória"),
    hma: z.string().optional(),
    painLevel: z.number().min(0).max(10), // EVA
    functionality: z.array(z.string()).optional(), // EFEP, PSFS dynamic list
    priorTreatments: z.array(z.string()).optional(),
    activityLevel: z.enum(["sedentary", "active", "athlete"]).optional(),
});

export const PainMapSchema = z.object({
    points: z.array(z.object({
        x: z.number(),
        y: z.number(),
        painType: z.string().optional(),
        observations: z.string().optional()
    })).optional(),
    goals: z.array(z.string()).optional(),
    injuryStatus: z.enum(["acute", "subacute", "chronic"]).optional(),
});

export const PosturalSchema = z.object({
    photos: z.object({
        baro2D: z.string().optional(), // URL
        baro3D: z.string().optional(), // URL
    }).optional(),
    dismetria: z.coerce.number().optional(),
    naviculometer: z.coerce.number().optional(),
    shoeSize: z.coerce.number().min(1),
});

export const StaticTestsSchema = z.object({
    fpiLeft: z.object({
        talarHead: z.number().min(-2).max(2),
        curves: z.number().min(-2).max(2),
        calcanealInversion: z.number().min(-2).max(2),
        talarNavicular: z.number().min(-2).max(2),
        medialArch: z.number().min(-2).max(2),
        abdAdd: z.number().min(-2).max(2),
    }).optional(),
    fpiRight: z.object({
        talarHead: z.number().min(-2).max(2),
        curves: z.number().min(-2).max(2),
        calcanealInversion: z.number().min(-2).max(2),
        talarNavicular: z.number().min(-2).max(2),
        medialArch: z.number().min(-2).max(2),
        abdAdd: z.number().min(-2).max(2),
    }).optional(),
    jackTest: z.enum(["normal", "rigid"]).optional(),
    lungeTest: z.coerce.number().optional()
});

export const DecubitoSchema = z.object({
    thomasTest: z.enum(["negative", "positive"]).optional(),
    craigTest: z.coerce.number().optional(),
    hipRotationInternal: z.coerce.number().optional(),
    hipRotationExternal: z.coerce.number().optional(),
    muscleStrength: z.number().min(-5).max(5).optional(), // -5 to +5 visual slider
});

export const DynamicSchema = z.object({
    singleLegSquat: z.enum(["stable", "valgus", "varus"]).optional(),
    dfi: z.number().optional(),
    gaitPhotos: z.array(z.string()).optional(),
});

export const CurrentShoeSchema = z.object({
    model: z.string().optional(),
    selectionId: z.string().optional(),
    specs: z.object({
        weight: z.number().optional(),
        drop: z.number().optional(),
        stack: z.number().optional(),
        flexLong: z.union([z.string(), z.number()]).optional(), // can be 'high' or number
        flexTor: z.union([z.string(), z.number()]).optional(),
        stability: z.boolean().optional(),
    }).optional(),
    minScoreData: z.object({
        flexLong: z.number().min(0).max(5).optional(), // 0-5 scale
        flexTor: z.number().min(0).max(5).optional(),
        stability: z.number().min(0).max(5).optional(), // 0-5 count
    }).optional(),
    minimalistIndex: z.number().optional(), // Calculated %
});

// --- Main Schema ---

export const BiomechanicsSchema = z.object({
    clinical: ClinicalSchema,
    painMap: PainMapSchema,
    postural: PosturalSchema,
    statictests: StaticTestsSchema,
    decubito: DecubitoSchema,
    dynamic: DynamicSchema,
    currentShoe: CurrentShoeSchema,
});

export type BiomechanicsFormValues = z.infer<typeof BiomechanicsSchema>;
