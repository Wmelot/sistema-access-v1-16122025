import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/patient-portal/[token] — Verifica token e retorna dados do portal
export async function GET(request: Request, { params }: { params: { token: string } }) {
    try {
        const { token } = params;

        // Buscar token
        const { data: tokenData, error } = await supabase
            .from('patient_portal_tokens')
            .select('id, patient_id, clinic_id, permissions, expires_at, access_count, is_revoked')
            .eq('token', token)
            .single();

        if (error || !tokenData) {
            return NextResponse.json({ valid: false, reason: 'TOKEN_NOT_FOUND' }, { status: 404 });
        }

        if (tokenData.is_revoked) {
            return NextResponse.json({ valid: false, reason: 'TOKEN_REVOKED' }, { status: 403 });
        }

        if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
            return NextResponse.json({ valid: false, reason: 'TOKEN_EXPIRED' }, { status: 403 });
        }

        // Buscar dados do paciente
        const { data: patient } = await supabase
            .from('patients')
            .select('id, name, birthdate')
            .eq('id', tokenData.patient_id)
            .single();

        // Buscar clínica
        const { data: clinic } = await supabase
            .from('organizations')
            .select('id, name')
            .eq('id', tokenData.clinic_id)
            .single();

        // Atualizar acesso
        await supabase
            .from('patient_portal_tokens')
            .update({
                last_accessed_at: new Date().toISOString(),
                access_count: (tokenData.access_count || 0) + 1
            })
            .eq('id', tokenData.id);

        // Log
        await supabase.from('portal_access_logs').insert({
            token_id: tokenData.id,
            patient_id: tokenData.patient_id,
            accessed_at: new Date().toISOString(),
            ip: request.headers.get('x-forwarded-for') || 'localhost'
        });

        // Fetch Report if permission exists
        let reportData = null;
        const perms: any = tokenData.permissions;
        if (perms?.view_report?.enabled) {
            const rid = perms.view_report.record_id;
            if (rid) {
                const { data: record } = await supabase
                    .from('patient_records')
                    .select('id, content, created_at')
                    .eq('id', rid)
                    .single();

                if (record) {
                    // Filter content to only what's safe/needed for the patient if necessary
                    // For now, let's include important summary bits
                    reportData = {
                        id: record.id,
                        date: record.created_at,
                        // Extract clinical reasoning or summary if available
                        summary: record.content?.aiReport || record.content?.report?.clinical_reasoning || "Relatório disponível",
                        type: record.content?.report?.clinical_reasoning ? 'smart' : 'standard'
                    };
                }
            }
        }

        return NextResponse.json({
            valid: true,
            patient: patient || { name: 'Paciente', birthdate: null, id: tokenData.patient_id },
            clinic: clinic || { name: 'Clínica', id: tokenData.clinic_id },
            permissions: tokenData.permissions,
            report: reportData
        });

    } catch (e: any) {
        console.error('[Patient Portal API]', e);
        return NextResponse.json({ valid: false, reason: 'SERVER_ERROR' }, { status: 500 });
    }
}
