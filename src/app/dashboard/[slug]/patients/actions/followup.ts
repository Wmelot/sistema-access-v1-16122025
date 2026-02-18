'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { generateSecureToken } from '@/lib/crypto'
import { z } from 'zod'
import { validateAccess, idSchema, slugSchema } from "@/lib/security"

const ScheduleFollowupSchema = z.object({
    patientId: idSchema,
    templateId: z.string().min(1, "Template é obrigatório"),
    originalAssessmentId: idSchema.optional().nullable(),
    scheduledFor: z.string().datetime("Data inválida"),
    customMessage: z.string().max(1000).optional(),
    slug: slugSchema.optional()
});

/**
 * Agenda um acompanhamento automático com segurança reforçada.
 */
export async function scheduleFollowup(rawInput: any) {
    // 1. Validação de Input
    const validation = ScheduleFollowupSchema.safeParse(rawInput);
    if (!validation.success) return { success: false, error: validation.error.issues[0].message };

    const data = validation.data;

    try {
        // 2. Trava de Segurança
        const { userId, organizationId } = await validateAccess(data.patientId, 'patient', data.slug);

        const supabase = await createClient();

        // 3. Lógica de Negócio (Expiração e Tokens)
        const scheduledDate = new Date(data.scheduledFor);
        const expiresAt = new Date(scheduledDate);
        expiresAt.setDate(expiresAt.getDate() + 30);

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.templateId);
        const token = generateSecureToken(16);

        const payload: any = {
            patient_id: data.patientId,
            original_assessment_id: data.originalAssessmentId,
            scheduled_date: data.scheduledFor,
            custom_message: data.customMessage,
            token: token,
            link_expires_at: expiresAt.toISOString(),
            status: 'pending',
            created_by: userId,
            organization_id: organizationId
        };

        if (isUuid) {
            payload.template_id = data.templateId;
            const { data: tmpl } = await supabase
                .from('message_templates' as any)
                .select('questionnaire_type')
                .eq('id', data.templateId)
                .maybeSingle();

            if (tmpl?.questionnaire_type && tmpl.questionnaire_type !== 'none') {
                payload.questionnaire_type = tmpl.questionnaire_type;
            }
        } else {
            payload.questionnaire_type = data.templateId;
        }

        const { data: followup, error } = await supabase
            .from('assessment_follow_ups')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;

        if (data.slug) revalidatePath(`/dashboard/${data.slug}/patients/${data.patientId}`);
        return { success: true, data: followup };

    } catch (error: any) {
        console.error('[scheduleFollowup] Error:', error.message);
        return { success: false, error: error.message };
    }
}

export async function getScheduledFollowups(patientId: string, slug?: string) {
    try {
        await validateAccess(patientId, 'patient', slug);
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('assessment_follow_ups')
            .select(`
                *,
                template:form_templates(id, title),
                patient:patients(id, name)
            `)
            .eq('patient_id', patientId)
            .order('scheduled_date', { ascending: true });

        if (error) throw error;
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function cancelFollowup(followupId: string, slug?: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Unauthorized');

        const { error } = await supabase
            .from('assessment_follow_ups')
            .update({ status: 'cancelled' })
            .eq('id', followupId)
            .eq('created_by', user.id); // Garante que o usuário só cancele o que ele criou

        if (error) throw error;
        if (slug) revalidatePath(`/dashboard/${slug}/patients`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function validateFollowupToken(token: string) {
    // 1. Bypass para Links de Teste (Lógica Original Preservada)
    if (token && (token.includes('teste-123') || token.includes('teste-40d') || token.includes('teste-1y'))) {
        const type = token.includes('teste-1y') ? 'insoles_1y' : 'insoles_40d';
        return {
            success: true,
            data: {
                id: 'mock-id',
                questionnaire_type: type,
                status: 'pending',
                patient: { name: 'Paciente de Teste' },
                organization: { name: 'Sua Clínica (Teste)' },
                created_by: 'test-prof-id',
                link_expires_at: new Date(Date.now() + 86400000).toISOString(),
                token: token
            }
        }
    }

    const adminSupabase = await createAdminClient();
    const { data, error } = await adminSupabase
        .from('assessment_follow_ups')
        .select(`
            *,
            template:form_templates(*),
            patient:patients(id, name, email, phone),
            organization:organizations(id, name, slug, primary_color, logo_url)
        `)
        .eq('token', token)
        .in('status', ['pending', 'sent', 'completed'])
        .single();

    if (error || !data) return { success: false, error: 'Link inválido ou expirado' };
    if (data.link_expires_at && new Date(data.link_expires_at) < new Date()) {
        return { success: false, error: 'Link expirado' };
    }

    return { success: true, data: { ...data, slug: (data as any).organization?.slug || 'slug' } };
}
