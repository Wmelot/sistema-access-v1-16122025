import { createClient } from './supabase/client';

export async function syncAcademicData() {
    try {
        const supabase = createClient();

        // 1. Get current organization
        const { data: { user } } = await supabase.auth.getUser();
        const savedEmail = typeof window !== 'undefined' ? localStorage.getItem('axiom_sinaes_user_email') : null;

        if (!user && !savedEmail) {
            console.error("Sync: User not found");
            return { success: false, error: "User not logged in" };
        }

        let orgId = null;
        if (user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('organization_id')
                .eq('id', user.id)
                .single();
            orgId = profile?.organization_id;
        }

        // Tenta encontrar orgId pelo email se o profile falhar
        if (!orgId && (user?.email || savedEmail)) {
            const emailToSearch = user?.email || savedEmail;
            const { data: profData } = await supabase
                .from('academic_professors')
                .select('organization_id')
                .eq('email', emailToSearch)
                .limit(1)
                .maybeSingle();
            orgId = profData?.organization_id;
        }

        if (!orgId) {
            console.error("Sync: No organization_id found");
            return { success: false, error: "No organization linked" };
        }

        console.log(`Syncing data for Org: ${orgId}`);

        // 2. Sync Professors
        const localProfs = JSON.parse(localStorage.getItem('axiom_sinaes_profs_v2') || '[]');
        let profsSynced = 0;

        if (localProfs.length === 0) {
            const legacyProfs = JSON.parse(localStorage.getItem('axiom_profs') || '[]');
            if (legacyProfs.length > 0) localProfs.push(...legacyProfs);
        }

        if (localProfs.length > 0) {
            const FAKE_NAMES = ['Márcia Coelho', 'Tatiana G. S. Figueiredo', 'Gisele Mara Silva', 'Sabrina P. L. de Castro'];
            for (const prof of localProfs) {
                if (prof.name.includes('Silvia') || FAKE_NAMES.some(fn => prof.name.includes(fn))) {
                    console.log("Ignorando sincronização de docente fictício:", prof.name);
                    continue;
                }

                const { data: existing } = await supabase
                    .from('academic_professors')
                    .select('id, lattes_url')
                    .eq('organization_id', orgId)
                    .eq('email', prof.email)
                    .maybeSingle();

                const payload = {
                    organization_id: orgId,
                    name: prof.name,
                    email: prof.email,
                    status: prof.status || 'ativo',
                    role: prof.role || 'professor',
                    permissions: prof.permissions || { canInvite: false, canDelete: false, canViewDashboard: false },
                    lattes_url: prof.lattesUrl || prof.lattes_url || existing?.lattes_url || ''
                };

                if (existing) {
                    await supabase.from('academic_professors').update(payload).eq('id', existing.id);
                } else {
                    await supabase.from('academic_professors').insert(payload);
                }
                profsSynced++;
            }
        }

        // 3. Sync Evidences (Tabela Única: academic_evidences)
        const localEvs = JSON.parse(localStorage.getItem('axiom_evidencias') || '[]');
        if (localEvs.length > 0) {
            for (const ev of localEvs) {
                const { data: dbProfs } = await supabase
                    .from('academic_professors')
                    .select('profile_id, name, email')
                    .eq('organization_id', orgId);

                const professor = dbProfs?.find(p => p.name === ev.professor || p.email === ev.email);
                const authUserId = professor?.profile_id || user?.id;

                if (!authUserId) continue;

                const payload = {
                    organization_id: orgId,
                    professor_id: authUserId,
                    title: ev.titulo || ev.title,
                    category: ev.categoria || ev.category || 'Ensino',
                    description: ev.descricao || ev.description || '',
                    impact_results: ev.impacto || ev.impact_results || '',
                    image_url: ev.img || ev.image_url || '',
                    integration_axes: ev.eixos || ev.integration_axes || [],
                    professor: ev.professor || professor?.name || 'Docente'
                };

                const { data: existing } = await supabase
                    .from('academic_evidences')
                    .select('id')
                    .eq('organization_id', orgId)
                    .eq('title', payload.title)
                    .maybeSingle();

                if (existing) {
                    await supabase.from('academic_evidences').update(payload).eq('id', existing.id);
                } else {
                    await supabase.from('academic_evidences').insert(payload);
                }
            }
        }
        return { success: true, count: profsSynced };
    } catch (e) {
        console.error("Erro syncAcademicData:", e);
        return { success: false, error: e };
    }
}

export async function fetchAcademicData(overrideEmail?: string) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const savedEmail = typeof window !== 'undefined' ? localStorage.getItem('axiom_sinaes_user_email') : null;
        const effectiveEmail = user?.email || overrideEmail || savedEmail;

        if (!user && !effectiveEmail) return { professors: [], evidencias: [] };

        let orgId = null;
        if (user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('organization_id')
                .eq('id', user.id)
                .single();
            orgId = profile?.organization_id;
        }

        if (!orgId && effectiveEmail) {
            const { data: profData } = await supabase
                .from('academic_professors')
                .select('organization_id')
                .eq('email', effectiveEmail)
                .maybeSingle();
            orgId = profData?.organization_id;
        }

        if (!orgId) return { professors: [], evidencias: [] };

        const [profsRes, evsRes] = await Promise.all([
            supabase.from('academic_professors').select('*').eq('organization_id', orgId),
            supabase.from('academic_evidences').select('*').eq('organization_id', orgId)
        ]);

        const profs = profsRes.data || [];
        const dbEvs = evsRes.data || [];

        const formattedEvidencias = dbEvs.map((ev: any) => ({
            ...ev,
            titulo: ev.title,
            professor: profs.find(p => p.id === ev.professor_id || p.profile_id === ev.professor_id)?.name || ev.professor || 'Docente SINAES',
            data: new Date(ev.created_at).toLocaleDateString('pt-BR'),
            categoria: ev.category,
            img: ev.image_url,
            descricao: ev.description,
            impacto: ev.impact_results,
            eixos: ev.integration_axes || []
        }));

        // Deduplicar por título para garantir UI limpa
        const uniqueEvidencias = formattedEvidencias.filter((v, i, a) => a.findIndex(t => (t.titulo === v.titulo)) === i);

        return {
            professors: profs,
            evidencias: uniqueEvidencias
        };
    } catch (e) {
        console.error("Erro fetchAcademicData:", e);
        return { professors: [], evidencias: [] };
    }
}

export async function saveEvidence(ev: any) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) throw new Error('Organização não identificada');

        const { error } = await supabase
            .from('academic_evidences')
            .insert({
                organization_id: profile.organization_id,
                professor_id: user.id,
                title: ev.titulo,
                category: ev.categoria || 'Ensino',
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
    } catch (error) {
        console.error("Erro saveEvidence:", error);
        throw error;
    }
}

export async function saveProfessor(prof: any) {
    try {
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
            lattes_url: prof.lattesUrl || prof.lattes_url || ''
        }, { onConflict: 'organization_id,email' });

        if (error) throw error;
        return true;
    } catch (error) {
        console.error("Erro saveProfessor:", error);
        throw error;
    }
}

export async function deleteEvidenceSupabase(id: string) {
    try {
        const supabase = createClient();
        // Busca o ID real se for um título enviado no lugar do id
        const { error } = await supabase.from('academic_evidences').delete().or(`id.eq.${id},title.eq.${id}`);
        if (error) throw error;
        return true;
    } catch (error) {
        console.error("Erro deleteEvidenceSupabase:", error);
        throw error;
    }
}

export async function deleteProfessorSupabase(id: string) {
    try {
        const supabase = createClient();
        const { error } = await supabase.from('academic_professors').delete().eq('id', id);
        if (error) throw error;
        return true;
    } catch (error) {
        console.error("Erro deleteProfessorSupabase:", error);
        throw error;
    }
}
