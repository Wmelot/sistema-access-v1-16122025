import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// Esquemas de Validação Reutilizáveis
export const idSchema = z.string().uuid("ID inválido");
export const slugSchema = z.string().min(1, "Slug é obrigatório");

/**
 * Valida se o usuário logado tem acesso ao paciente/organização informado.
 * Esta é a trava de segurança principal (Anti-Hacker).
 */
export async function validateAccess(subjectId: string, type: 'patient' | 'organization', slug?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Não autorizado: Usuário não autenticado");

    // 1. Pega o perfil do usuário e sua organização
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, role')
        .eq('id', user.id)
        .single();

    if (!profile) throw new Error("Não autorizado: Perfil não encontrado");

    // Usuário 'Master' tem passe livre (suporte técnico)
    if (profile.role === 'Master') return { userId: user.id, organizationId: profile.organization_id };

    let targetOrgId = profile.organization_id;

    // 2. Se for validação de paciente, checa se o paciente pertence à org do usuário
    if (type === 'patient') {
        const { data: patient } = await supabase
            .from('patients')
            .select('organization_id')
            .eq('id', subjectId)
            .single();

        if (!patient || patient.organization_id !== targetOrgId) {
            throw new Error("Não autorizado: Este paciente não pertence à sua organização");
        }
    }

    // 3. Se um slug foi passado, garante que o slug bate com a org do usuário
    if (slug) {
        const { data: org } = await supabase
            .from('organizations')
            .select('id')
            .eq('slug', slug)
            .single();

        if (!org || org.id !== targetOrgId) {
            throw new Error("Não autorizado: Acesso negado a esta clínica");
        }
    }

    return { userId: user.id, organizationId: targetOrgId };
}
