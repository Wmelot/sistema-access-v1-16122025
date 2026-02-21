'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { addDays } from "date-fns"
import { sendMessage, getWhatsappConfig } from "@/app/dashboard/[slug]/settings/communication/actions"
import { headers } from "next/headers"
import { z } from "zod"
import { validateAccess, idSchema, slugSchema } from "@/lib/security"

// ESQUEMAS DE VALIDAÇÃO (Blindagem de Input)
const RegisterDeliverySchema = z.object({
    patientId: idSchema,
    deliveryDate: z.coerce.date(),
    slug: slugSchema.optional(),
    note: z.string().max(2000, "Nota muito longa").optional(),
    isAdjustment: z.boolean().default(false)
});

const MaintenanceSchema = z.object({
    patientId: idSchema,
    scheduledDate: z.coerce.date(),
    type: z.enum(['insoles_1y', 'insoles_40d']),
    slug: slugSchema
});

/**
 * Registra a entrega de palmilha com auditoria e segurança reforçada.
 */
export async function registerInsoleDelivery(rawInput: any) {
    // 1. Validar Schema de Input
    const result = RegisterDeliverySchema.safeParse(rawInput);
    if (!result.success) return { success: false, message: result.error.issues[0].message };

    const { patientId, deliveryDate, slug, note, isAdjustment } = result.data;

    try {
        // 2. Trava de Segurança (Check de Org/Paciente)
        const { userId, organizationId } = await validateAccess(patientId, 'patient', slug);

        const { createAdminClient } = await import("@/lib/supabase/server");
        const adminSupabase = await createAdminClient();

        // 3. Processamento de Datas
        const deliveryAsDate = new Date(deliveryDate);
        deliveryAsDate.setHours(12, 0, 0, 0);
        const date40d = addDays(deliveryAsDate, 40);
        const date1y = addDays(deliveryAsDate, 365);

        // 4. Cancelar agendamentos anteriores pendentes
        await adminSupabase
            .from('assessment_follow_ups')
            .update({ status: 'cancelled' })
            .eq('patient_id', patientId)
            .in('type', ['insoles_40d', 'insoles_1y'])
            .eq('status', 'pending');

        // 5. Inserir agendamentos novos usando Admin Client com segurança garantida pelo passo 2
        const followUps = [
            { patient_id: patientId, organization_id: organizationId, type: 'insoles_40d', delivery_date: deliveryAsDate.toISOString(), scheduled_date: date40d.toISOString(), status: 'pending', token: crypto.randomUUID() },
            { patient_id: patientId, organization_id: organizationId, type: 'insoles_1y', delivery_date: deliveryAsDate.toISOString(), scheduled_date: date1y.toISOString(), status: 'pending', token: crypto.randomUUID() }
        ];

        const { error: upsError } = await adminSupabase.from('assessment_follow_ups').insert(followUps);
        if (upsError) throw new Error("Erro ao criar agendamentos");

        // 6. Registro de Evolução Clínica (Blindado contra injeção de script)
        if (note) {
            await adminSupabase.from('patient_records').insert({
                patient_id: patientId,
                organization_id: organizationId,
                professional_id: userId,
                template_id: 'e0000000-0000-0000-0000-000000000001',
                content: {
                    note: note.substring(0, 2000), // Hard limit
                    _record_type: 'evolution',
                    title: isAdjustment ? 'Ajuste de Palmilha' : 'Entrega de Palmilha'
                },
                status: 'finalized'
            });
        }

        if (slug) revalidatePath(`/dashboard/${slug}/patients/${patientId}`);

        const { logAction } = await import("@/lib/logger");
        await logAction("REGISTER_INSOLE_DELIVERY_SUCCESS", { patientId, isAdjustment }, 'patient', patientId, organizationId);

        return { success: true, message: 'Entrega registrada com sucesso.' };

    } catch (error: any) {
        console.error("Critical Security Failure in Insoles:", error.message);

        // [AUDIT] Log unauthorized or failed attempt
        try {
            const { logAction } = await import("@/lib/logger");
            await logAction("SECURITY_VIOLATION_INSOLE", { error: error.message, patientId }, 'security', patientId);
        } catch (e) { }

        return { success: false, message: error.message || 'Erro de segurança.' };
    }
}

export async function getInsoleFollowUps(patientId: string, slug?: string) {
    try {
        await validateAccess(patientId, 'patient', slug);
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('assessment_follow_ups')
            .select('*')
            .eq('patient_id', patientId)
            .in('type', ['insoles_40d', 'insoles_1y'])
            .order('scheduled_date', { ascending: true });

        if (error) throw error;
        return data;
    } catch (e) {
        return [];
    }
}

export async function cancelFollowUp(followUpId: string, patientId: string, slug?: string) {
    try {
        await validateAccess(patientId, 'patient', slug);
        const supabase = await createClient();

        const { error } = await supabase
            .from('assessment_follow_ups')
            .update({ status: 'cancelled' })
            .eq('id', followUpId)
            .eq('patient_id', patientId); // Extra safety

        if (error) return { success: false, message: 'Erro ao cancelar.' };
        if (slug) revalidatePath(`/dashboard/${slug}/patients/${patientId}`);
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function triggerInsoleMaintenance(data: any) {
    const result = MaintenanceSchema.safeParse(data);
    if (!result.success) return { success: false, message: result.error.issues[0].message };

    const { patientId, scheduledDate, type, slug } = result.data;

    try {
        const { userId, organizationId } = await validateAccess(patientId, 'patient', slug);
        const adminSupabase = await createAdminClient();
        const token = crypto.randomUUID();

        const { error } = await adminSupabase
            .from('assessment_follow_ups')
            .insert({
                patient_id: patientId,
                organization_id: organizationId,
                type: type,
                scheduled_date: scheduledDate.toISOString(),
                delivery_date: new Date().toISOString(),
                status: 'pending',
                token: token,
                created_by: userId
            });

        if (error) throw error;

        // Se a data agendada for agora ou passado, tenta enviar imediatamente
        if (scheduledDate <= new Date()) {
            const { data: patient } = await adminSupabase.from('patients').select('name, phone').eq('id', patientId).single();
            const config = await getWhatsappConfig(slug);

            if (patient?.phone && config) {
                const host = headers().get('host');
                const protocol = host?.includes('localhost') ? 'http' : 'https';
                const baseUrl = host ? `${protocol}://${host}` : 'https://axiom-production.vercel.app';

                const link = `${baseUrl}/avaliacao/${token}`;
                const firstName = patient.name?.split(' ')[0] || 'Paciente';
                const templateTitle = type === 'insoles_40d' ? 'Acompanhamento de Palmilhas (40 dias)' : 'Renovação de Palmilhas (1 ano)';
                const messageText = `Olá ${firstName}, por favor preencha o *${templateTitle}* clicando aqui:\n\n${link}`;

                const sendRes = await sendMessage(patient.phone, messageText, config);
                if (sendRes.success) {
                    await adminSupabase.from('assessment_follow_ups').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('token', token);
                }
            }
        }

        revalidatePath(`/dashboard/${slug}/patients/${patientId}`);
        return { success: true, message: 'Agendamento realizado com sucesso.' };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}
