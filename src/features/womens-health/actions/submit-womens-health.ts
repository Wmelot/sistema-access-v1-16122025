"use server";

import { createClient } from "@/lib/supabase/server";
import { WomensHealthSchema } from "../schemas/womens-health-schema";
import { z } from "zod";

export async function submitWomensHealth(
    data: z.infer<typeof WomensHealthSchema>,
    patientId: string
): Promise<{ success: boolean, message: string; details?: any }> {
    try {
        // 1. Validar Dados
        const parsed = WomensHealthSchema.safeParse(data);
        if (!parsed.success) {
            const errorMessages = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
            console.error("Erro de validação (Women's Health):", errorMessages);
            return {
                success: false,
                message: "Dados inválidos: verifique os campos obrigatórios.",
                details: parsed.error.format()
            };
        }

        const supabase = await createClient();

        // 2. Inserir no Banco
        const { error } = await supabase.from("womens_health_assessments" as any).insert({
            patient_id: patientId,
            type: "womens_health_v1",
            data: parsed.data,
            status: "completed",
            created_at: new Date().toISOString()
        });

        if (error) {
            console.error("Erro Supabase (Women's Health):", error);
            if (error.code === '23505') return { success: false, message: "Avaliação já existe para hoje." };
            if (error.code === '23503') return { success: false, message: "Paciente não encontrado." };

            return { success: false, message: "Erro ao salvar no banco de dados." };
        }

        return { success: true, message: "Avaliação Saúde da Mulher salva com sucesso!" };

    } catch (err) {
        console.error("Erro inesperado em submitWomensHealth:", err);
        return { success: false, message: "Erro interno do servidor." };
    }
}
