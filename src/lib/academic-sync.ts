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
            for (const prof of localProfs) {
                if (prof.name.includes('Silvia')) continue;

                const { data: existing } = await supabase
                    .from('academic_professors')
                    .select('id')
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
                    lattes_url: prof.lattesUrl || prof.lattes_url || ''
                };

                if (existing) {
                    await supabase.from('academic_professors').update(payload).eq('id', existing.id);
                } else {
                    await supabase.from('academic_professors').insert(payload);
                }
                profsSynced++;
            }
        }

        // 3. Sync Evidences (Now: acad_registros + acad_midias)
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

                const imageUrl = ev.img || ev.image_url;
                if (imageUrl && registroId) {
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

        const [profsRes, regsRes] = await Promise.all([
            supabase.from('academic_professors').select('*').eq('organization_id', orgId),
            supabase.from('acad_registros').select('*, acad_midias(*)').eq('organization_id', orgId)
        ]);

        const profs = profsRes.data || [];
        const regs = regsRes.data || [];

        const formattedEvidencias = regs.map((reg: any) => {
            const professor = profs.find(p => p.profile_id === reg.professor_id || p.id === reg.professor_id);
            return {
                ...reg,
                titulo: reg.title,
                professor: professor?.name || 'Docente SINAES',
                data: new Date(reg.created_at).toLocaleDateString('pt-BR'),
                categoria: reg.category,
                img: reg.acad_midias?.[0]?.url || '',
                descricao: reg.description,
                impacto: reg.impact,
                eixos: reg.integration || []
            };
        });

        return {
            professors: profs,
            evidencias: formattedEvidencias
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

        const { data: newReg, error: regErr } = await supabase
            .from('acad_registros')
            .insert({
                organization_id: profile.organization_id,
                professor_id: user.id,
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

        if (ev.img && newReg) {
            await supabase.from('acad_midias').insert({
                registro_id: newReg.id,
                url: ev.img,
                media_type: 'image'
            });
        }
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
            lattes_url: prof.lattesUrl || ''
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
        const { error } = await supabase.from('acad_registros').delete().eq('id', id);
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
