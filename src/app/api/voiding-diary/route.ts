import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST — Adiciona entrada no diário miccional
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { token, entry } = body;

        // Validar token
        const { data: portalData, error: tokenError } = await supabase
            .from('patient_portal_tokens')
            .select('id, patient_id, clinic_id, permissions, expires_at')
            .eq('token', token)
            .single();

        if (tokenError || !portalData) {
            return NextResponse.json({ success: false, error: 'Token inválido' }, { status: 403 });
        }

        if (portalData.expires_at && new Date(portalData.expires_at) < new Date()) {
            return NextResponse.json({ success: false, error: 'Acesso expirado' }, { status: 403 });
        }

        const permissions = portalData.permissions as any;
        const diary = permissions?.voiding_diary;

        if (!diary?.enabled) {
            return NextResponse.json({ success: false, error: 'Diário não habilitado' }, { status: 403 });
        }

        // Verificar se diário ainda está ativo
        if (diary.expires_at && new Date(diary.expires_at) < new Date()) {
            return NextResponse.json({
                success: false,
                error: 'O período do diário miccional encerrou. Aguarde orientação do seu fisioterapeuta.',
                diary_closed: true
            }, { status: 403 });
        }

        // Salvar entrada
        const { data: savedEntry, error: saveError } = await supabase
            .from('voiding_diary_entries')
            .insert({
                patient_id: portalData.patient_id,
                clinic_id: portalData.clinic_id,
                token_id: portalData.id,
                recorded_at: new Date().toISOString(),
                volume_class: entry.volume_class,      // 'little' | 'medium' | 'much'
                had_urgency: entry.had_urgency,         // boolean
                had_leakage: entry.had_leakage,         // boolean
                changed_pad: entry.changed_pad,         // boolean
                liquid_intake: entry.liquid_intake,     // string | null
                liquid_type: entry.liquid_type,         // 'water' | 'coffee' | 'juice' | 'other'
                notes: entry.notes || null
            })
            .select()
            .single();

        if (saveError) throw saveError;

        // ── Notificar o profissional ────────────────────────────────────────
        try {
            // Buscar paciente e profissional responsável
            const { data: patient } = await supabase
                .from('patients')
                .select('name, organization_id')
                .eq('id', portalData.patient_id)
                .single();

            // Buscar profissional principal da clínica (criador do token)
            const { data: tokenDetail } = await supabase
                .from('patient_portal_tokens')
                .select('created_by')
                .eq('id', portalData.id)
                .single();

            if (patient && tokenDetail?.created_by) {
                const isAlert = entry.had_leakage || entry.had_urgency;
                const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                const detalhes = [
                    entry.had_urgency ? '⚡ Urgência' : '',
                    entry.had_leakage ? '💧 Perda urinária' : '',
                    entry.changed_pad ? '🩹 Trocou absorvente' : '',
                ].filter(Boolean).join(' · ');

                await supabase.from('reminders').insert({
                    user_id: tokenDetail.created_by,
                    creator_id: tokenDetail.created_by,
                    organization_id: portalData.clinic_id,
                    content: isAlert
                        ? `⚠️ Alerta Diário Miccional — ${patient.name}\n${hora} · ${detalhes}`
                        : `📋 ${patient.name} preencheu o diário miccional às ${hora}. ${detalhes || 'Sem intercorrências.'}`,
                    status: isAlert ? 'pending' : 'pending',
                    is_read: false,
                    due_date: new Date().toISOString(),
                    created_at: new Date().toISOString(),
                });
            }
        } catch (notifErr) {
            // Notificação falhou silenciosamente — não impede o salvamento
            console.warn('[VoidingDiary] Notificação falhou:', notifErr);
        }

        return NextResponse.json({ success: true, entry: savedEntry });

    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

// GET — Busca todas as entradas do período
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) return NextResponse.json({ success: false }, { status: 400 });

        const { data: portalData } = await supabase
            .from('patient_portal_tokens')
            .select('patient_id, clinic_id, permissions')
            .eq('token', token)
            .single();

        if (!portalData) return NextResponse.json({ success: false }, { status: 403 });

        const { data: entries } = await supabase
            .from('voiding_diary_entries')
            .select('*')
            .eq('patient_id', portalData.patient_id)
            .order('recorded_at', { ascending: false });

        return NextResponse.json({ success: true, entries: entries || [] });

    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
