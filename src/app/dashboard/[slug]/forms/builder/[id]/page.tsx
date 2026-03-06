import { createClient, createAdminClient } from '@/lib/supabase/server';
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
    // USE ADMIN CLIENT TO BYPASS RLS/AUTH ISSUES
    const supabase = await createAdminClient();

    const { data: template, error } = await supabase
        .from('form_templates')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error(`[BuilderPage] Error fetching template ${id}:`, error);
    }
    if (!template) {
        console.error(`[BuilderPage] Template ${id} not found.`);
        return notFound();
    }

    // SANITIZATION: Fix legacy data issues (e.g. options as objects instead of strings)
    // This fixes the "Objects are not valid as a React child" error.
    if (template.fields && Array.isArray(template.fields)) {
        template.fields = template.fields.map((f: any) => {
            // Fix options
            if (f.options && Array.isArray(f.options)) {
                f.options = f.options.map((opt: any) => {
                    if (typeof opt === 'object' && opt !== null) {
                        return opt.label || opt.value || JSON.stringify(opt);
                    }
                    return String(opt);
                });
            }
            // Fix rows/columns for grids if needed
            if (f.rows && Array.isArray(f.rows)) {
                f.rows = f.rows.map((r: any) => typeof r === 'object' ? (r.label || JSON.stringify(r)) : String(r));
            }
            if (f.columns && Array.isArray(f.columns)) {
                f.columns = f.columns.map((c: any) => typeof c === 'object' ? (c.label || JSON.stringify(c)) : String(c));
            }
            return f;
        });
    }

    console.log(`[BuilderPage] Successfully loaded and sanitized template: ${template.title} (${id})`);

    return (
        <div className="w-full h-full py-4">
            <FormBuilder template={(template as any)} />
        </div>
    );
}
