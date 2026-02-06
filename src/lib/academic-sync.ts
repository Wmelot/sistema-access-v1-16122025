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

    // 3. Sync Evidences (Now: acad_registros + acad_midias)
    const localEvs = JSON.parse(localStorage.getItem('axiom_evidencias') || '[]');
    if (localEvs.length > 0) {
        for (const ev of localEvs) {
            // No formato novo, tentamos encontrar o ID de Auth se existir no profile
            // Como fallback, usaremos o ID do usuário atual que está sincronizando
            const { data: dbProfs } = await supabase
                .from('academic_professors')
                .select('profile_id, name, email')
                .eq('organization_id', orgId);

            const professor = dbProfs?.find(p => p.name === ev.professor || p.email === ev.email);
            const authUserId = professor?.profile_id || user.id;

            // Upsert acad_registros
            const registroPayload = {
                organization_id: orgId,
                professor_id: authUserId,
                title: ev.titulo || ev.title,
                category: (ev.categoria || ev.category || 'ENSINO').toUpperCase(),
                description: ev.descricao || ev.description || '',
                impact: ev.impacto || ev.impact_results || '',
                integration: ev.eixos || ev.integration_axes || [],
                status: 'finalized'
            };

            // Para evitar duplicidade complexa sem chave única clara, tentamos buscar por título+org+docente
            const { data: existingReg } = await supabase
                .from('acad_registros')
                .select('id')
                .eq('organization_id', orgId)
                .eq('title', registroPayload.title)
                .maybeSingle();

            let registroId;
            if (existingReg) {
                await supabase.from('acad_registros').update(registroPayload).eq('id', existingReg.id);
                registroId = existingReg.id;
            } else {
                const { data: newReg, error: regErr } = await supabase
                    .from('acad_registros')
                    .insert(registroPayload)
                    .select('id')
                    .single();
                if (regErr) {
                    console.error("Erro ao inserir registro:", regErr);
                    continue;
                }
                registroId = newReg.id;
            }

            // Sync Midias (Foto)
            const imageUrl = ev.img || ev.image_url;
            if (imageUrl && registroId) {
                // Verifica se já existe a mídia para esse registro
                const { data: existingMidia } = await supabase
                    .from('acad_midias')
                    .select('id')
                    .eq('registro_id', registroId)
                    .eq('url', imageUrl)
                    .maybeSingle();

                if (!existingMidia) {
                    await supabase.from('acad_midias').insert({
                        registro_id: registroId,
                        url: imageUrl,
                        media_type: 'image'
                    });
                }
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

    // 1. Buscar Professores (academic_professors - o que o usuário preencheu)
    const { data: profsData, error: profsErr } = await supabase
        .from('academic_professors')
        .select('*')
        .eq('organization_id', profile.organization_id);

    // 2. Buscar Registros de Atividade (acad_registros)
    const { data: registrosData, error: regErr } = await supabase
        .from('acad_registros')
        .select(`
            *,
            acad_midias (*)
        `)
        .eq('organization_id', profile.organization_id);

    if (profsErr) console.error("Erro ao buscar professores:", profsErr);
    if (regErr) console.error("Erro ao buscar registros/mídias:", regErr);

    // Map para o formato que a UI espera
    const formattedEvidencias = (registrosData || []).map(reg => {
        // Pega a primeira mídia como imagem principal (ou um placeholder se vazio)
        const primaryMedia = reg.acad_midias?.[0]?.url || '';

        // Tenta encontrar o nome do professor
        // Nota: registrosData.professor_id aponta para Auth, mas podemos tentar cruzar por outros meios se necessário.
        // Por enquanto, mostraremos o título e os dados do registro.
        const professorRecord = profsData?.find(p => p.profile_id === reg.professor_id);

        return {
            ...reg,
            id: reg.id,
            titulo: reg.title,
            professor: professorRecord?.name || 'Docente SINAES',
            data: new Date(reg.created_at).toLocaleDateString('pt-BR'),
            categoria: reg.category,
            img: primaryMedia,
            descricao: reg.description,
            impacto: reg.impact,
            eixos: reg.integration || []
        };
    });

    return {
        professors: profsData || [],
        evidencias: formattedEvidencias
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

    // 1. Criar Registro
    const { data: newReg, error: regErr } = await supabase
        .from('acad_registros')
        .insert({
            organization_id: profile.organization_id,
            professor_id: user.id, // Vincula ao usuário logado que está criando
            title: ev.titulo,
            category: (ev.categoria || 'ENSINO').toUpperCase(),
            description: ev.descricao || '',
            impact: ev.impacto || '',
            integration: ev.eixos || [],
            status: 'finalized'
        })
        .select('id')
        .single();

    if (regErr) throw regErr;

    // 2. Criar Mídia se houver imagem
    if (ev.img && newReg) {
        const { error: mediaErr } = await supabase
            .from('acad_midias')
            .insert({
                registro_id: newReg.id,
                url: ev.img,
                media_type: 'image'
            });

        if (mediaErr) console.error("Erro ao salvar mídia:", mediaErr);
    }

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
