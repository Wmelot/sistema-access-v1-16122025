import { z } from "zod";

export const PBESchema = z.object({
    condition: z.string().min(1, "Selecione uma condição clínica"),
    appliedEvidence: z.array(z.string()).min(1, "Selecione pelo menos uma evidência aplicada"),
    clinicalNotes: z.string().optional(),
});

export type PBEFormValues = z.infer<typeof PBESchema>;
