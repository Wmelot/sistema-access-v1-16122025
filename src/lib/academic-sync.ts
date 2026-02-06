import { createClient } from './supabase/client';

export async function syncAcademicData() {
    try {
        const savedEmail = typeof window !== 'undefined' ? localStorage.getItem('axiom_sinaes_user_email') : null;
        if (!savedEmail) return { success: false, error: "User not logged in" };

        const localEvs = JSON.parse(localStorage.getItem('axiom_evidencias') || '[]');

        if (localEvs.length > 0) {
            const response = await fetch('/api/academic/sync-evidence', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: savedEmail, evidences: localEvs })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Erro na sincronização');
            }
        }

        return { success: true };
    } catch (e) {
        console.error("Erro syncAcademicData:", e);
        return { success: false, error: e };
    }
}

export async function fetchAcademicData(overrideEmail?: string) {
    try {
        const savedEmail = typeof window !== 'undefined' ? localStorage.getItem('axiom_sinaes_user_email') : null;
        const email = overrideEmail || savedEmail;

        if (!email) return { professors: [], evidencias: [] };

        // Busca via API servidora para evitar RLS
        const response = await fetch(`/api/academic/verify-professor`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        if (!response.ok) return { professors: [], evidencias: [] };

        const { professor } = await response.json();
        const orgId = professor?.organization_id;

        if (!orgId) return { professors: [], evidencias: [] };

        const supabase = createClient();
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
        const savedEmail = typeof window !== 'undefined' ? localStorage.getItem('axiom_sinaes_user_email') : null;
        if (!savedEmail) throw new Error('E-mail não encontrado no cache local');

        const response = await fetch('/api/academic/sync-evidence', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: savedEmail, evidence: ev })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Erro ao salvar evidência');
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
