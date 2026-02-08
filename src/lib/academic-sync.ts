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

        // Busca via API servidora para evitar RLS e garantir acesso aos dados da organização
        const responseData = await fetch(`/api/academic/fetch-data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        if (!responseData.ok) return { professors: [], evidencias: [] };

        const fullData = await responseData.json();
        const { professors, evidencias: dbEvs, requester } = fullData;

        const formattedEvidencias = (dbEvs || []).map((ev: any) => ({
            ...ev,
            titulo: ev.title,
            professor: professors.find((p: any) => p.id === ev.professor_id || p.profile_id === ev.professor_id)?.name || ev.professor || 'Docente SINAES',
            data: new Date(ev.created_at).toLocaleDateString('pt-BR'),
            categoria: ev.category,
            img: ev.image_url,
            descricao: ev.description,
            impacto: ev.impact_results,
            eixos: ev.integration_axes || []
        }));

        return {
            professors: professors || [],
            evidencias: formattedEvidencias,
            requester: requester
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

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos de timeout

        const response = await fetch('/api/academic/sync-evidence', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: savedEmail, evidence: ev }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            let errorMsg = 'Erro ao salvar evidência';
            try {
                const err = await response.json();
                errorMsg = err.error || errorMsg;
            } catch (e) {
                if (response.status === 413) errorMsg = "Arquivo muito grande para ser enviado.";
            }
            throw new Error(errorMsg);
        }

        return true;
    } catch (error: any) {
        if (error.name === 'AbortError') throw new Error('Tempo de conexão esgotado. Tente novamente.');
        console.error("Erro saveEvidence:", error);
        throw error;
    }
}

export async function saveProfessor(prof: any) {
    try {
        const savedEmail = typeof window !== 'undefined' ? localStorage.getItem('axiom_sinaes_user_email') : null;
        if (!savedEmail) throw new Error('E-mail não encontrado no cache local');

        const response = await fetch('/api/academic/save-professor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requesterEmail: savedEmail, professor: prof })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Erro ao salvar professor');
        }

        return true;
    } catch (error) {
        console.error("Erro saveProfessor:", error);
        throw error;
    }
}

export async function deleteEvidenceSupabase(id: string) {
    try {
        const savedEmail = typeof window !== 'undefined' ? localStorage.getItem('axiom_sinaes_user_email') : null;
        if (!savedEmail) throw new Error('E-mail não encontrado no cache local');

        const response = await fetch('/api/academic/delete-evidence', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requesterEmail: savedEmail, evidenceId: id })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Erro ao deletar evidência');
        }

        return true;
    } catch (error) {
        console.error("Erro deleteEvidenceSupabase:", error);
        throw error;
    }
}

export async function deleteProfessorSupabase(id: string) {
    try {
        const savedEmail = typeof window !== 'undefined' ? localStorage.getItem('axiom_sinaes_user_email') : null;
        if (!savedEmail) throw new Error('E-mail não encontrado no cache local');

        const response = await fetch('/api/academic/delete-professor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requesterEmail: savedEmail, professorId: id })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Erro ao deletar professor');
        }

        return true;
    } catch (error) {
        console.error("Erro deleteProfessorSupabase:", error);
        throw error;
    }
}
