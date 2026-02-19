import { getFormTemplates, getOrganizationProfessionals } from './actions';
import { createClient } from '@/lib/supabase/server';
import { FormsList } from './components/forms-list';
import { canAccessAsset } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export default async function CustomFormsPage({ params }: { params: { slug: string } }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { slug } = params // Destructure slug

    const [allTemplates, professionals] = await Promise.all([
        getFormTemplates(),
        getOrganizationProfessionals(slug)
    ]);

    // Layer 3 Filter: Can the user VIEW these assets?
    const templatesWithViewAccess = await Promise.all(
        allTemplates.map(async (t: any) => {
            const canView = await canAccessAsset(t, 'view');
            return canView ? t : null;
        })
    );

    // Layer 3 Filter: Calculate permissions for each asset
    const customForms = await Promise.all(
        templatesWithViewAccess
            .filter(Boolean)
            .filter((t: any) =>
                !t.is_locked ||
                t.type === 'assessment' ||
                t.title?.includes('Avaliação PBE') ||
                t.title?.includes('PBE')
            )
            .map(async (t: any) => {
                const canEdit = await canAccessAsset(t, 'edit');
                return { ...t, canEdit };
            })
    );

    return <FormsList customForms={customForms} user={user} slug={slug} professionals={professionals} />
}
