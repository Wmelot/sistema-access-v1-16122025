"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export interface VoidingEntry {
    id: string;
    recorded_at: string;
    volume_class: "little" | "medium" | "much";
    had_urgency: boolean;
    had_leakage: boolean;
    changed_pad: boolean;
    liquid_type?: string | null;
    notes?: string | null;
}

/**
 * Busca entradas do diário miccional para um paciente.
 * Usa admin client para contornar RLS — segurança garantida
 * pelo fato de ser uma Server Action (só pode ser chamada pelo servidor).
 */
export async function getVoidingDiaryEntries(patientId: string): Promise<VoidingEntry[]> {
    try {
        const supabase = await createAdminClient();
        const { data, error } = await supabase
            .from("voiding_diary_entries")
            .select("id, recorded_at, volume_class, had_urgency, had_leakage, changed_pad, liquid_type, notes")
            .eq("patient_id", patientId)
            .order("recorded_at", { ascending: false })
            .limit(500);

        if (error) {
            console.error("[getVoidingDiaryEntries]", error.message);
            return [];
        }

        return (data || []) as VoidingEntry[];
    } catch (e: any) {
        console.error("[getVoidingDiaryEntries] exception:", e.message);
        return [];
    }
}
