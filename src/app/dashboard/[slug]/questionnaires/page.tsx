import { getFormTemplates, createFormTemplate } from '../forms/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, ClipboardList, Pencil, Activity, HeartHandshake, Eye } from 'lucide-react';
import Link from 'next/link';
import { FormCardActions } from '../forms/components/form-card-actions';
import { createClient } from '@/lib/supabase/server';
import { QuestionnaireBrowser } from './components/questionnaire-browser';
import { ManagementHeader } from "@/components/dashboard/management-header";

export const dynamic = 'force-dynamic';

export default async function QuestionnairesPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch all templates
    const allTemplates = await getFormTemplates();

    // Filter by type
    // Filter by type - ONLY LOCKED (STANDARD)
    const questionnaires = allTemplates.filter((t: any) => t.is_locked && (t.type === 'questionnaire' || t.type === 'assessment' || !t.type));
    const followups = allTemplates.filter((t: any) => t.is_locked && t.type === 'followup');

    return (
        <div className="space-y-6">
            <ManagementHeader
                slug={slug}
                title="Biblioteca de Questionários"
                description="Visualize os modelos de questionários padronizados e escalas globais."
            />
            {/* Creation button moved to Custom Forms page */}

            <QuestionnaireBrowser questionnaires={questionnaires} followups={followups} user={user} slug={slug} />
        </div>
    );
}
