import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isMasterUser } from "@/lib/auth-master";

// Esquemas de Validação Reutilizáveis
export const idSchema = z.string().uuid("ID inválido");
export const slugSchema = z.string().min(1, "Slug é obrigatório");

export interface SecurityContext {
    userId: string;
    isMaster: boolean;
    homeOrgId: string;
    activeOrgId: string; // A organização na qual o usuário está atuando agora
    userEmail: string;
}

/**
 * RESOLUÇÃO DEFINITIVA DE CONTEXTO
 * Resolve quem é o usuário, se é Master e em qual organização ele está "operando".
 */
export async function getSecurityContext(slug?: string): Promise<SecurityContext> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Não autorizado: Usuário não autenticado");

    const isMaster = await isMasterUser(user.id);
    const adminSupabase = await createAdminClient();

    // Busca o perfil para ter a Home Org
    const { data: profile } = await adminSupabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (!profile) throw new Error("Não autorizado: Perfil não encontrado");

    const homeOrgId = profile.organization_id;
    let activeOrgId = homeOrgId;

    // Se houver um slug e o usuário for Master, a Active Org muda para a da clínica visitada
    if (slug && isMaster) {
        const { data: org } = await adminSupabase
            .from('organizations')
            .select('id')
            .eq('slug', slug)
            .single();
        if (org) activeOrgId = org.id;
    }

    return {
        userId: user.id,
        userEmail: user.email || '',
        isMaster,
        homeOrgId,
        activeOrgId
    };
}

/**
 * VALIDAÇÃO DE ACESSO (O PADRÃO OURO DE SEGURANÇA DO AXIOM)
 * Garante que o usuário tem direito de interagir com um recurso específico.
 */
export async function validateAccess(subjectId: string, type: 'patient' | 'organization', slug?: string) {
    const context = await getSecurityContext(slug);
    const { isMaster, activeOrgId, userId } = context;

    const adminSupabase = await createAdminClient();

    // 1. Validação de Organização (Contexto da URL/Clínica)
    if (slug) {
        const { data: org } = await adminSupabase
            .from('organizations')
            .select('id')
            .eq('slug', slug)
            .single();

        if (!org) throw new Error("Clínica não encontrada");

        // Bloqueio: Se não for Master e a Org do slug não for a sua
        if (!isMaster && org.id !== activeOrgId) {
            throw new Error("Não autorizado: Você não pertence a esta clínica");
        }
    }

    // 2. Validação de Paciente
    if (type === 'patient') {
        const { data: patient } = await adminSupabase
            .from('patients')
            .select('organization_id')
            .eq('id', subjectId)
            .single();

        if (!patient) throw new Error("Paciente não encontrado");

        // Bloqueio: Se não for Master e o paciente não pertence à sua Org
        // Ou se você é Master mas o paciente não pertence à Org que você está "emulando" (activeOrgId)
        if (patient.organization_id !== activeOrgId && !isMaster) {
            throw new Error("Não autorizado: Este paciente não pertence à sua organização");
        }

        // Se for Master, garantimos que a activeOrgId seja a do paciente para que
        // os inserts/updates subsequentes caiam no lugar certo.
        if (isMaster) {
            return { userId, organizationId: patient.organization_id, isMaster, context };
        }
    }

    return { userId, organizationId: activeOrgId, isMaster, context };
}
