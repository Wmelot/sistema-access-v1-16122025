'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { validateAccess, idSchema, slugSchema } from "@/lib/security"

// SCHEMAS DE VALIDAÇÃO (Blindagem de Input)
// Usamos z.record(z.any()) para os dados flexíveis, permitindo que qualquer estrutura de formulário seja salva.
const CreateAssessmentSchema = z.object({
    patientId: idSchema,
    type: z.string().min(1, "Tipo é obrigatório"),
    data: z.record(z.any()).default({}),
    scores: z.record(z.any()).optional(),
    title: z.string().optional(),
    slug: slugSchema.optional()
});

/**
 * Cria uma avaliação vinculada ao histórico do paciente com validação de acesso.
 */
export async function createAssessment(patientId: string, type: string, data: any, scores: any, title?: string, slug?: string) {
    // 1. Validar inputs básicos (para evitar ataques de buffer ou injeção)
    const validation = CreateAssessmentSchema.safeParse({ patientId, type, data, scores, title, slug });
    if (!validation.success) {
        return { success: false, msg: validation.error.issues[0].message };
    }

    // 2. Trava de Segurança (Multi-tenancy)
    // Garante que o usuário logado tem permissão para escrever neste paciente.
    try {
        const { userId, organizationId } = await validateAccess(patientId, 'patient', slug);

        const { createAdminClient } = await import('@/lib/supabase/server');
        const adminSupabase = await createAdminClient();

        // 3. Montagem do Payload (Preservando a lógica original de scores)
        const payload = {
            patient_id: patientId,
            professional_id: userId,
            organization_id: organizationId,
            type: validation.data.type,
            title: validation.data.title || validation.data.type,
            data: validation.data.data,
            scores: {
                ...(validation.data.scores || {}),
                savedAt: new Date().toISOString()
            }
        };

        const { error: insertError } = await adminSupabase
            .from('patient_assessments')
            .insert(payload);

        if (insertError) throw insertError;

        if (slug) {
            revalidatePath(`/dashboard/${slug}/patients`);
            revalidatePath(`/dashboard/${slug}/patients/${patientId}`);
        }

        return { success: true };

    } catch (error: any) {
        console.error('[createAssessment] Security or Persistence Failure:', error.message);

        // Se o erro for do paciente Sandbox, mantemos a mensagem amigável original
        if (patientId === 'sandbox') {
            return { success: false, msg: 'Modo Sandbox: Histórico não persistido' };
        }

        return { success: false, msg: error.message || 'Erro ao salvar avaliação.' };
    }
}

/**
 * Recupera avaliações com filtro de segurança automático (RLS).
 */
export async function getAssessments(patientId: string, slug?: string) {
    try {
        // Validação de acesso antes de abrir a consulta
        await validateAccess(patientId, 'patient', slug);

        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient();

        let query = supabase
            .from('patient_assessments')
            .select(`
                *,
                profiles (
                    full_name
                )
            `)
            .eq('patient_id', patientId);

        // Se houver slug, filtramos pela organização para garantir isolamento extra
        if (slug) {
            const { data: orgData } = await supabase.from('organizations').select('id').eq('slug', slug).single();
            if (orgData?.id) {
                query = query.eq('organization_id', orgData.id);
            }
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];

    } catch (error) {
        console.error('[getAssessments] Error:', error);
        return [];
    }
}
