import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
    try {
        const { email, evidence, evidences } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email é obrigatório para identificação.' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // 1. Buscar o ID e Org do professor pelo email (Garante segurança sem RLS)
        const { data: professor, error: profError } = await supabase
            .from('academic_professors')
            .select('id, organization_id, name')
            .eq('email', email.toLowerCase())
            .maybeSingle();

        if (profError || !professor) {
            return NextResponse.json({ error: 'Professor não encontrado para este e-mail.' }, { status: 404 });
        }

        const orgId = professor.organization_id;
        const profId = professor.id;

        // 2. Se for um lote de evidências (Sincronização)
        if (evidences && Array.isArray(evidences)) {
            console.log(`Sincronizando ${evidences.length} evidências para ${email}`);
            for (const ev of evidences) {
                const payload = {
                    id: ev.id,
                    organization_id: orgId,
                    professor_id: profId,
                    title: ev.titulo || ev.title,
                    category: ev.categoria || ev.category || 'Ensino',
                    activity_type: ev.activity_type || ev.tipo || '',
                    evidence_date: ev.data_atividade || ev.evidence_date || ev.data || new Date().toLocaleDateString('pt-BR'),
                    description: ev.description || ev.descricao || '',
                    impact_results: ev.impact_results || ev.impacto || '',
                    subject: ev.subject || ev.disciplina || '',
                    image_url: ev.image_url || ev.img || '',
                    links: ev.links || [],
                    integration_axes: ev.integration_axes || ev.eixos || [],
                    integration_description: ev.integration_description || ev.descricaoIntegracao || '',
                    caption: ev.caption || ev.legenda || '',
                    professor: professor.name
                };

                // Upsert pelo ID (se houver) ou combinação de org/title
                const onConflict = ev.id ? 'id' : 'organization_id,title';
                await supabase.from('academic_evidences').upsert(payload, { onConflict });
            }
            return NextResponse.json({ success: true, message: 'Sincronização concluída.' });
        }

        // 3. Se for uma evidência única (Salvar Novo)
        if (evidence) {
            const payload = {
                id: evidence.id,
                organization_id: orgId,
                professor_id: profId,
                title: evidence.titulo,
                category: evidence.categoria || 'Ensino',
                activity_type: evidence.tipo || '',
                evidence_date: evidence.data_atividade || evidence.data || new Date().toLocaleDateString('pt-BR'),
                description: evidence.descricao || '',
                impact_results: evidence.impacto || '',
                subject: evidence.disciplina || evidence.disciplina_nome || '',
                image_url: evidence.img || '',
                links: evidence.links || [],
                integration_axes: evidence.eixos || [],
                integration_description: evidence.integration_description || evidence.descricaoIntegracao || '',
                caption: evidence.legenda || '',
                professor: professor.name
            };

            const onConflict = evidence.id ? 'id' : 'organization_id,title';
            const { error: saveErr } = await supabase.from('academic_evidences').upsert(payload, { onConflict });
            if (saveErr) {
                console.error('Erro ao salvar evidência:', saveErr);
                return NextResponse.json({ error: 'Erro ao salvar no banco.' }, { status: 500 });
            }
            return NextResponse.json({ success: true, message: 'Evidência salva com sucesso.' });
        }

        return NextResponse.json({ error: 'Nenhum dado para salvar.' }, { status: 400 });

    } catch (err) {
        console.error('Erro na API de sincronização:', err);
        return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
    }
}
