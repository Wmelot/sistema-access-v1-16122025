import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
    try {
        const supabase = createAdminClient();

        // Try to add the column - if it already exists, update will just work
        const { error } = await supabase.from('academic_evidences').update({ relevance: 0 }).eq('id', 'test-nonexistent-id');

        if (error && error.message.includes('column "relevance" of relation')) {
            // Column doesn't exist - we need to tell user to create it via Supabase dashboard
            return NextResponse.json({
                success: false,
                message: 'A coluna "relevance" não existe na tabela academic_evidences. Execute o SQL no painel Supabase:',
                sql: 'ALTER TABLE academic_evidences ADD COLUMN relevance integer DEFAULT 0;'
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Coluna relevance já existe na tabela.'
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
