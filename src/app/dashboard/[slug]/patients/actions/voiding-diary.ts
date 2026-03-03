"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendReportViaWhatsapp } from "./reports";

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

export async function generatePortalToken(patientId: string, slug?: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: "Usuário não autenticado" };

        const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
        if (!profile) return { success: false, error: "Clínica não encontrada" };

        const token = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 5);

        const { data, error } = await supabase.from("patient_portal_tokens").insert({
            patient_id: patientId,
            clinic_id: profile.organization_id,
            created_by: user.id,
            token,
            permissions: {
                voiding_diary: { enabled: true, duration_days: 5, expires_at: expiresAt.toISOString() }
            },
            expires_at: expiresAt.toISOString()
        }).select('token').single();

        if (error) return { success: false, error: error.message };

        const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.'));
        const baseUrl = isLocalhost ? `http://${window.location.host}` : (process.env.NEXT_PUBLIC_APP_URL || 'https://axiom-production.vercel.app');
        const portalUrl = `${baseUrl}/paciente/${token}`;

        // Tentativa de envio inteligente pelo Zapi/Evolution
        try {
            const message = `Olá! Mapeamos a necessidade de você preencher o *Diário Miccional* para acompanharmos sua evolução.\n\nAcesse seu Portal do Paciente pelo link abaixo (não precisa criar senha):\n${portalUrl}\n\nLembre-se de anotar cada ida ao banheiro, combinado?`;

            await sendReportViaWhatsapp({
                patientId,
                content: message,
                reportType: 'Portal do Paciente',
                slug
            });
        } catch (err) {
            console.error("Erro ao enviar portal pelo whatsapp nativo", err);
        }

        return { success: true, url: portalUrl, token };

    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
