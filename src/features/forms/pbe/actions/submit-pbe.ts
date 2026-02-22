"use server";

import { createClient } from "@/lib/supabase/server";
import { SmartAssessmentSchema } from "../schemas/smart-assessment-schema";
import { z } from "zod";

export async function submitPBE(
    data: any,
    patientId: string
): Promise<{ success: boolean, message: string; details?: any }> {
    try {
        const parsed = SmartAssessmentSchema.safeParse(data);
        if (!parsed.success) {
            return {
                success: false,
                message: "Dados inválidos: verifique os campos obrigatórios.",
                details: parsed.error.format()
            };
        }

        const supabase = await createClient();

        // Get organization_id from logged user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, message: "Usuário não autenticado." }

        const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
        const organizationId = profile?.organization_id

        if (!organizationId) return { success: false, message: "Erro crítico: Organização não identificada." }

        // Cast 'pbe_assessments' as any until types are generated
        const { error } = await supabase.from("pbe_assessments" as any).insert({
            patient_id: patientId,
            organization_id: organizationId, // Include organization_id
            type: "pbe_v1",
            data: parsed.data,
            status: "completed",
            created_at: new Date().toISOString()
        });

        if (error) {
            console.error("Erro Supabase (PBE):", error);
            if (error.code === '23503') return { success: false, message: "Paciente não encontrado." };
            return { success: false, message: "Erro ao salvar avaliação PBE." };
        }

        return { success: true, message: "Avaliação PBE salva com sucesso!" };

    } catch (err) {
        console.error("Erro submitPBE:", err);
        return { success: false, message: "Erro interno do servidor." };
    }
}
