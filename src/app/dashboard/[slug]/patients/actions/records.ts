'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { validateAccess, idSchema, slugSchema } from "@/lib/security"

const GetRecordsSchema = z.object({
    patientId: idSchema,
    type: z.enum(['assessment', 'evolution']).optional(),
    slug: slugSchema.optional()
});

/**
 * Busca o histórico do paciente com validação de acesso e filtragem por tipo.
 */
export async function getPatientRecords(patientId: string, type?: 'assessment' | 'evolution', slug?: string) {
    // 1. Validação de Input
    const validation = GetRecordsSchema.safeParse({ patientId, type, slug });
    if (!validation.success) return [];

    try {
        // 2. Trava de Segurança
        await validateAccess(patientId, 'patient', slug);

        const supabase = await createClient();

        let query = supabase
            .from('patient_records')
            .select(`
                id,
                created_at,
                content,
                template_id,
                organization_id,
                appointment_id,
                appointments (
                    status
                ),
                form_templates (
                    title,
                    type,
                    ai_generation_script
                ),
                professionals:profiles (
                    full_name
                )
            `)
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false });

        if (slug) {
            const { data: orgData } = await supabase.from('organizations').select('id').eq('slug', slug).single();
            if (orgData?.id) {
                query = query.eq('organization_id', orgData.id);
            }
        }

        const { data: rawData, error } = await query;
        if (error) throw error;

        // 3. Filtragem de Negócio (Lógica Original Preservada)
        // Remove cancelados
        let data = (rawData || []).filter((r: any) => {
            const apptData = Array.isArray(r.appointments) ? r.appointments[0] : r.appointments;
            return apptData?.status !== 'cancelled';
        });

        // Filtra por tipo (assessment/evolution)
        if (type) {
            data = data.filter((r: any) => {
                const CLINICAL_EVOLUTION_ID = 'e0000000-0000-0000-0000-000000000001';
                if (r.template_id === CLINICAL_EVOLUTION_ID) {
                    return type === 'evolution';
                }

                const rType = r.content?._record_type || r.form_templates?.type;
                const normalizedType = rType === 'evaluation' ? 'assessment' : rType;
                return normalizedType === type;
            });
        }

        return data;

    } catch (error) {
        console.error('[getPatientRecords] Security Failure or Error:', error);
        return [];
    }
}
