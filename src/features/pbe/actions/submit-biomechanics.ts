"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { BiomechanicsSchema, BiomechanicsFormValues } from "../schemas/biomechanics-schema";

export async function submitBiomechanics(data: BiomechanicsFormValues, patientId: string) {
    const supabase = await createClient();

    // Validate with Zod
    const parsed = BiomechanicsSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, message: "Dados inválidos", details: parsed.error.format() };
    }

    // Get Auth (assuming Clerk or Supabase Auth - based on previous files using `auth()` from clerk or `supabase.auth.getUser()`)
    // Checking previous action `submit-physical-assessment.ts`: uses `await supabase.auth.getUser()`.
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, message: "Usuário não autenticado" };
    }

    // Get organization_id from logged user
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    const organizationId = profile?.organization_id

    if (!organizationId) return { success: false, message: "Erro crítico: Organização não identificada." }

    // Insert/Update
    const { error } = await supabase
        .from("biomechanics_assessments" as any)
        .insert({
            patient_id: patientId,
            professional_id: user.id, // using user.id from supabase auth
            organization_id: organizationId, // Include organization_id
            data: parsed.data,
            status: "completed"
        });

    if (error) {
        console.error("Error saving biomechanics:", error);
        return { success: false, message: "Erro ao salvar avaliação" };
    }

    revalidatePath("/dashboard/patients");
    return { success: true, message: "Avaliação biomecânica salva com sucesso!" };
}
