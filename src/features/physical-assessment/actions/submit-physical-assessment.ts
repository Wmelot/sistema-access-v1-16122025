"use server";

import { createClient } from "@/lib/supabase/server";
import { PhysicalAssessmentSchema } from "../schemas/physical-assessment-schema";
import { z } from "zod";

export async function submitPhysicalAssessment(
    data: z.infer<typeof PhysicalAssessmentSchema>,
    patientId: string
): Promise<{ success: boolean, message: string; details?: any }> {
    try {
        // 1. Validar Dados
        const parsed = PhysicalAssessmentSchema.safeParse(data);
        if (!parsed.success) {
            const errorMessages = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
            console.error("Erro de validação (Physical Assessment):", errorMessages);
            return {
                success: false,
                message: "Dados inválidos: verifique os campos obrigatórios.",
                details: parsed.error.format()
            };
        }

        const supabase = await createClient();

        // 2. Inserir no Banco
        const { error } = await supabase.from("physical_assessments").insert({
            patient_id: patientId,
            type: "physical_assessment_v1", // Explicit type identifier
            data: parsed.data,
            status: "completed",
            created_at: new Date().toISOString()
        });

        if (error) {
            console.error("Erro Supabase (Physical Assessment):", error);
            // Tratamento de erros comuns
            if (error.code === '23505') return { success: false, message: "Avaliação já existe." };
            if (error.code === '23503') return { success: false, message: "Paciente não encontrado." };

            return { success: false, message: "Erro ao salvar no banco de dados." };
        }

        return { success: true, message: "Avaliação física salva com sucesso!" };

    } catch (err) {
        console.error("Erro inesperado em submitPhysicalAssessment:", err);
        return { success: false, message: "Erro interno do servidor." };
    }
}
