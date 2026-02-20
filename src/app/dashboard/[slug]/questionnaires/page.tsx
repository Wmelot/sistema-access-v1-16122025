import { getFormTemplates, getOrganizationProfessionals } from '../forms/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, ClipboardList, Pencil, Activity, HeartHandshake, Eye } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { QuestionnaireBrowser } from './components/questionnaire-browser';
import { ManagementHeader } from "@/components/dashboard/management-header";
import { canAccessAsset } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export default async function QuestionnairesPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch all templates
    const allTemplates = await getFormTemplates(slug);

    // Layer 3 Filter: Can the user VIEW these assets?
    const templatesWithViewAccess = await Promise.all(
        allTemplates.map(async (t: any) => {
            const canView = await canAccessAsset(t, 'view');
            return canView ? t : null;
        })
    );
    const visibleTemplates = templatesWithViewAccess.filter(Boolean);

    // Filter by type - ONLY LOCKED (STANDARD)
    const questionnaires = visibleTemplates.filter((t: any) => {
        const title = t.title.toLowerCase();
        const isFollowup = title.includes('acompanhamento') || title.includes('manutenção') || t.type === 'followup';
        return t.is_locked && !isFollowup && (t.type === 'questionnaire' || t.type === 'assessment' || !t.type);
    });
    const followups = visibleTemplates.filter((t: any) => {
        const title = t.title.toLowerCase();
        const isFollowup = title.includes('acompanhamento') || title.includes('manutenção') || t.type === 'followup';
        return t.is_locked && isFollowup;
    });

    // Fetch professionals for access settings
    const professionals = await getOrganizationProfessionals(slug);

    return (
        <div className="space-y-6">
            <ManagementHeader
                slug={slug}
                title="Biblioteca de Questionários"
                description="Visualize os modelos de questionários padronizados e escalas globais."
            />
            {/* Creation button moved to Custom Forms page */}

            <QuestionnaireBrowser
                questionnaires={questionnaires}
                followups={followups}
                user={user}
                slug={slug}
                professionals={professionals}
            />
        </div>
    );
}
