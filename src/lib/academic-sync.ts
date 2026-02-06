import { createClient } from './supabase/client';

export async function syncAcademicData() {
    const supabase = createClient();

    // 1. Get current organization
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.error("Sync: User not found");
        return { success: false, error: "User not logged in" };
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (!profile?.organization_id) {
        console.error("Sync: No organization_id for user");
        return { success: false, error: "No organization linked" };
    }
    const orgId = profile.organization_id;

    console.log(`Syncing data for Org: ${orgId}`);

    // 2. Sync Professors
    const localProfs = JSON.parse(localStorage.getItem('axiom_sinaes_profs_v2') || '[]');
    let profsSynced = 0;

    // Tenta também a chave legada se a v2 estiver vazia
    if (localProfs.length === 0) {
        const legacyProfs = JSON.parse(localStorage.getItem('axiom_profs') || '[]');
        if (legacyProfs.length > 0) localProfs.push(...legacyProfs);
    }

    if (localProfs.length > 0) {
        for (const prof of localProfs) {
            // SEGURANÇA: Bloquear Silvia de subir para o banco
            if (prof.name.includes('Silvia')) continue;

            // Check existence manually to avoid constraint errors
            const { data: existing } = await supabase
                .from('academic_professors')
                .select('id')
                .eq('organization_id', orgId)
                .eq('email', prof.email)
                .single();

            const payload = {
                organization_id: orgId,
                name: prof.name,
                email: prof.email,
                status: prof.status || 'ativo',
                role: prof.role || 'professor',
                permissions: prof.permissions || { canInvite: false, canDelete: false, canViewDashboard: false },
                lattes_url: prof.lattesUrl || prof.lattes_url || ''
            };

            if (existing) {
                // Update
                await supabase.from('academic_professors').update(payload).eq('id', existing.id);
            } else {
                // Insert
                await supabase.from('academic_professors').insert(payload);
            }
            profsSynced++;
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

            // Generate a deterministic ID or use title+date to check existence if needed, 
            // but for evidences we might want to just rely on UPSERT if we had a unique key. 
            // Lacking a clear unique key for evidence from local storage (id is random), 
            // we will try to match by Title + Date + Professor

            let matchQuery = supabase.from('academic_evidences').select('id').eq('organization_id', orgId);
            if (professor?.id) matchQuery = matchQuery.eq('professor_id', professor.id);
            matchQuery = matchQuery.eq('title', ev.titulo || ev.title).eq('evidence_date', ev.data || ev.evidence_date);

            const { data: existingEv } = await matchQuery.maybeSingle();

            const evPayload = {
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
            };

            if (existingEv) {
                await supabase.from('academic_evidences').update(evPayload).eq('id', existingEv.id);
            } else {
                await supabase.from('academic_evidences').insert(evPayload);
            }
        }
    }

    return { success: true, count: profsSynced };
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
