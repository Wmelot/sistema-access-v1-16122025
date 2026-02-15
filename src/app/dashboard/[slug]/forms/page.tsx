import { getFormTemplates } from './actions';
import { createClient } from '@/lib/supabase/server';
import { FormsList } from './components/forms-list';

export const dynamic = 'force-dynamic';

export default async function CustomFormsPage({ params }: { params: { slug: string } }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { slug } = params // Destructure slug

    const allTemplates = await getFormTemplates();
    const customForms = allTemplates.filter((t: any) =>
        !t.is_locked ||
        t.type === 'assessment' ||
        t.title?.includes('Avaliação PBE') ||
        t.title?.includes('PBE')
    );

    return <FormsList customForms={customForms} user={user} slug={slug} />
}
