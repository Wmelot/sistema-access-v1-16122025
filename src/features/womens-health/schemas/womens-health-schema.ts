import { z } from "zod";

export const ObstetricSchema = z.object({
    gestations: z.coerce.number().min(0).optional(),
    births: z.coerce.number().min(0).optional(),
    birthType: z.enum(["vaginal", "c_section", "mixed", "null"]).optional(),
    abortions: z.coerce.number().min(0).optional(),
    episiotomy: z.boolean().optional(),
    menopause: z.boolean().optional(),
});

export const ComplaintsSchema = z.object({
    stressUrinaryIncontinence: z.boolean().optional(),
    urgeIncontinence: z.boolean().optional(),
    nocturia: z.boolean().optional(),
    prolapseSensation: z.boolean().optional(),
    constipation: z.boolean().optional(),
    dyspareunia: z.boolean().optional(),
});

export const RedFlagsSchema = z.object({
    vaginalBleeding: z.boolean().optional(),
    amnioticFluidLeak: z.boolean().optional(),
    severeHeadache: z.boolean().optional(),
    reducedFetalMovement: z.boolean().optional(),
});

export const PerfectSchema = z.object({
    power: z.coerce.number().min(0).max(5).optional(), // 0-5 Oxford Scale
    endurance: z.coerce.number().min(0).optional(),
    repetitions: z.coerce.number().min(0).optional(),
    fast: z.coerce.number().min(0).optional(),
    diastasis: z.boolean().optional(),
});

// --- Main Schema ---

export const WomensHealthSchema = z.object({
    obstetric: ObstetricSchema,
    complaints: ComplaintsSchema,
    redFlags: RedFlagsSchema,
    perfect: PerfectSchema,
});

export type WomensHealthFormValues = z.infer<typeof WomensHealthSchema>;
