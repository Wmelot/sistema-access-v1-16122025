import { getFormTemplates } from './actions';
import { createClient } from '@/lib/supabase/server';
import { FormsList } from './components/forms-list';

export const dynamic = 'force-dynamic';

export default async function CustomFormsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const allTemplates = await getFormTemplates();
    const customForms = allTemplates.filter((t: any) => !t.is_locked || t.type === 'assessment');

    return <FormsList customForms={customForms} user={user} />
}
