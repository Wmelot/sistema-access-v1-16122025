'use server'

import { generateClinicalEvolution } from "@/lib/ai/gemini";
import { createClient } from "@/lib/supabase/server";

export async function generateEvolutionAction(notes: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Usuário não autenticado." };
    }

    try {
        const evolution = await generateClinicalEvolution(notes);
        return { success: true, data: evolution };
    } catch (error) {
        console.error("AI Action Error:", error);
        return { success: false, error: "Falha ao gerar evolução. Verifique a chave de API." };
    }
}
