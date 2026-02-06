import { createClient } from './supabase/client';

export async function syncAcademicData() {
    const supabase = createClient();

    // 1. Get current organization
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (!profile?.organization_id) return;
    const orgId = profile.organization_id;

    // 2. Sync Professors
    const localProfs = JSON.parse(localStorage.getItem('axiom_sinaes_profs_v2') || '[]');
    if (localProfs.length > 0) {
        for (const prof of localProfs) {
            await supabase.from('academic_professors').upsert({
                organization_id: orgId,
                name: prof.name,
                email: prof.email,
                status: prof.status || 'ativo',
                role: prof.role || 'professor',
                permissions: prof.permissions || { canInvite: false, canDelete: false, canViewDashboard: false },
                lattes_url: prof.lattesUrl || prof.lattes_url || ''
            }, { onConflict: 'organization_id,email' });
        }
    }

    // 3. Sync Evidences
    const localEvs = JSON.parse(localStorage.getItem('axiom_evidencias') || '[]');
    if (localEvs.length > 0) {
        // We need the database IDs of the professors to link them correctly
        const { data: dbProfs } = await supabase
            .from('academic_professors')
            .select('id, email, name')
            .eq('organization_id', orgId);

        for (const ev of localEvs) {
            // Find the professor in DB by name or email (fallback)
            const professor = dbProfs?.find(p => p.name === ev.professor || p.email === ev.email);

            await supabase.from('academic_evidences').upsert({
                organization_id: orgId,
                professor_id: professor?.id,
                title: ev.titulo || ev.title,
                category: ev.categoria || ev.category,
                activity_type: ev.tipo || ev.activity_type || '',
                evidence_date: ev.data || ev.evidence_date || '',
                description: ev.descricao || ev.description || '',
                impact_results: ev.impacto || ev.impact_results || '',
                subject: ev.disciplina || ev.subject || '',
                image_url: ev.img || ev.image_url || '',
                links: ev.links || [],
                integration_axes: ev.eixos || ev.integration_axes || [],
                integration_description: ev.descricaoIntegracao || ev.integration_description || '',
                caption: ev.legenda || ev.caption || ''
            });
        }
    }

    return true;
}

export async function fetchAcademicData() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        console.warn("fetchAcademicData: Usuário não autenticado no Supabase.");
        return { professors: [], evidencias: [] };
    }

    const { data: profile, error: profError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (profError || !profile?.organization_id) {
        console.warn("fetchAcademicData: Organização não encontrada para o usuário.", profError);
        return { professors: [], evidencias: [] };
    }

    console.log(`fetchAcademicData: Buscando dados para org ${profile.organization_id}`);

    const [profsRes, evsRes] = await Promise.all([
        supabase.from('academic_professors').select('*').eq('organization_id', profile.organization_id),
        supabase.from('academic_evidences').select('*, academic_professors(name)').eq('organization_id', profile.organization_id)
    ]);

    if (profsRes.error) console.error("Erro ao buscar professores:", profsRes.error);
    if (evsRes.error) console.error("Erro ao buscar evidências:", evsRes.error);

    return {
        professors: profsRes.data || [],
        evidencias: (evsRes.data || []).map(ev => ({
            ...ev,
            titulo: ev.title,
            professor: ev.academic_professors?.name || 'Desconhecido',
            data: ev.evidence_date,
            categoria: ev.category,
            img: ev.image_url,
            descricao: ev.description,
            disciplina: ev.subject
        }))
    };
}

export async function saveEvidence(ev: any) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (!profile?.organization_id) throw new Error('Organização não identificada');

    // Find professor
    const { data: dbProf } = await supabase
        .from('academic_professors')
        .select('id')
        .eq('organization_id', profile.organization_id)
        .eq('name', ev.professor || ev.docente)
        .maybeSingle();

    const { error } = await supabase.from('academic_evidences').insert({
        organization_id: profile.organization_id,
        professor_id: dbProf?.id,
        title: ev.titulo,
        category: ev.categoria,
        activity_type: ev.tipo || '',
        evidence_date: ev.data || new Date().toLocaleDateString('pt-BR'),
        description: ev.descricao || '',
        impact_results: ev.impacto || '',
        subject: ev.disciplina || '',
        image_url: ev.img || '',
        links: ev.links || [],
        integration_axes: ev.eixos || [],
        integration_description: ev.descricaoIntegracao || '',
        caption: ev.legenda || ''
    });

    if (error) throw error;
    return true;
}

export async function saveProfessor(prof: any) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (!profile?.organization_id) throw new Error('Organização não identificada');

    const { error } = await supabase.from('academic_professors').upsert({
        organization_id: profile.organization_id,
        name: prof.name,
        email: prof.email,
        status: prof.status || 'ativo',
        role: prof.role || 'professor',
        permissions: prof.permissions || { canInvite: false, canDelete: false, canViewDashboard: false },
        lattes_url: prof.lattesUrl || ''
    }, { onConflict: 'organization_id,email' });

    if (error) throw error;
    return true;
}

export async function deleteEvidenceSupabase(id: string | number) {
    const supabase = createClient();
    const { error } = await supabase.from('academic_evidences').delete().eq('id', id);
    if (error) throw error;
    return true;
}

export async function deleteProfessorSupabase(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from('academic_professors').delete().eq('id', id);
    if (error) throw error;
    return true;
}
