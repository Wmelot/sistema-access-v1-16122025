import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email é obrigatório.' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // 1. Busca o professor para identificar a organização (Sem RLS)
        const { data: professor, error: profError } = await supabase
            .from('academic_professors')
            .select('*')
            .ilike('email', email.toLowerCase())
            .maybeSingle();

        if (profError || !professor || !professor.organization_id) {
            console.error('Professor ou Organização não encontrados para:', email);
            return NextResponse.json({ professors: [], evidencias: [] });
        }

        const orgId = professor.organization_id;

        // 2. Busca todos os docentes (Sem RLS)
        const { data: professors } = await supabase
            .from('academic_professors')
            .select('*')
            .eq('organization_id', orgId);

        // 3. Busca evidências da tabela ANTIGA (academic_evidences)
        const { data: oldEvs } = await supabase
            .from('academic_evidences')
            .select('*')
            .eq('organization_id', orgId);

        // 4. Busca evidências da tabela NOVA (acad_registros + acad_midias)
        const { data: newRegs } = await supabase
            .from('acad_registros')
            .select(`
                *,
                acad_midias (*)
            `)
            .eq('organization_id', orgId);

        // 5. Normalizar e Mesclar Evidências
        const normalizedOld = (oldEvs || []).map(ev => ({
            ...ev,
            source: 'old'
        }));

        const normalizedNew = (newRegs || []).map(reg => ({
            id: reg.id,
            organization_id: reg.organization_id,
            professor_id: reg.professor_id,
            title: reg.title,
            category: reg.category,
            description: reg.description,
            impact_results: reg.impact,
            integration_axes: reg.integration,
            image_url: reg.acad_midias?.[0]?.url || '',
            created_at: reg.created_at,
            source: 'new'
        }));

        // Combinar e manter IDs únicos + Deduplicação inteligente entre fontes (evita duplicar migrados)
        const allEvs = [...normalizedOld, ...normalizedNew];
        const uniqueEvs = allEvs.filter((ev, index, self) =>
            index === self.findIndex((t) => (
                t.id === ev.id ||
                (t.title === (ev.title || (ev as any).titulo) && t.professor_id === ev.professor_id && t.description === ev.description)
            ))
        );

        console.log(`Fetch concluído para org ${orgId}: ${professors?.length} profs, ${uniqueEvs.length} total evs.`);

        return NextResponse.json({
            professors: professors || [],
            evidencias: uniqueEvs,
            requester: professor
        });

    } catch (err) {
        console.error('Erro na API de fetch-data:', err);
        return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
    }
}
