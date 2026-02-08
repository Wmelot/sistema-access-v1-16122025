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
            return NextResponse.json({ professors: [], evidencias: [] });
        }

        const orgId = professor.organization_id;

        // 2. Busca todos os docentes e evidências da mesma organização (Sem RLS)
        const [profsRes, evsRes] = await Promise.all([
            supabase.from('academic_professors').select('*').eq('organization_id', orgId),
            supabase.from('academic_evidences').select('*').eq('organization_id', orgId)
        ]);

        return NextResponse.json({
            professors: profsRes.data || [],
            evidencias: evsRes.data || [],
            requester: professor
        });

    } catch (err) {
        console.error('Erro na API de fetch-data:', err);
        return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
    }
}
