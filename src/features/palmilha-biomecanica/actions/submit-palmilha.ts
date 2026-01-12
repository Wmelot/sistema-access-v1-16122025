"use server";

import { createClient } from "@/lib/supabase/server";
import { PalmilhaSchema } from "../schemas/palmilha-schema";
import { z } from "zod";

export async function submitPalmilha(
    data: z.infer<typeof PalmilhaSchema>,
    patientId: string
): Promise<{ success: boolean, message: string; details?: any }> {
    try {
        // 1. Validar Dados
        const parsed = PalmilhaSchema.safeParse(data);
        if (!parsed.success) {
            const errorMessages = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
            console.error("Erro de validação:", errorMessages);
            return {
                success: false,
                message: "Dados inválidos: verifique os campos obrigatórios.",
                details: parsed.error.format()
            };
        }

        const supabase = await createClient();

        // 2. Inserir no Banco
        const { error } = await supabase.from("patient_assessments").insert({
            patient_id: patientId,
            type: "biomecanica_v2",
            data: parsed.data,
            status: "completed",
            created_at: new Date().toISOString()
        });

        if (error) {
            console.error("Erro Supabase:", error);
            // Tratamento básico de erros conhecidos do Supabase/PostgREST
            if (error.code === '23505') return { success: false, message: "Avaliação já existe (duplicidade)." };
            if (error.code === '23503') return { success: false, message: "Paciente não encontrado." };

            return { success: false, message: "Erro ao salvar no banco de dados. Tente novamente." };
        }

        return { success: true, message: "Avaliação salva com sucesso!" };

    } catch (err) {
        console.error("Erro inesperado em submitPalmilha:", err);
        return { success: false, message: "Erro interno do servidor. Contate o suporte." };
    }
}
