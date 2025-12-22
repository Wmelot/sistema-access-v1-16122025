import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import FormBuilder from '@/components/forms/FormBuilder';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function BuilderPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: template, error } = await supabase
        .from('form_templates')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !template) {
        return notFound();
    }

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col">
            <FormBuilder template={template} />
        </div>
    );
}
