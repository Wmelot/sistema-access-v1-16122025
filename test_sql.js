require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function run() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });
    await client.connect();

    const query = `
    CREATE TABLE IF NOT EXISTS public.organization_message_access (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
        message_template_id UUID NOT NULL REFERENCES public.message_templates(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
        UNIQUE(organization_id, message_template_id)
    );

    ALTER TABLE public.organization_message_access ENABLE ROW LEVEL SECURITY;

    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Super admin all access org_msg_access' AND tablename = 'organization_message_access') THEN
            CREATE POLICY "Super admin all access org_msg_access" ON public.organization_message_access
                AS PERMISSIVE FOR ALL
                TO authenticated
                USING ((EXISTS ( SELECT 1 FROM public.profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'master'::text)))));
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their orgs msg access' AND tablename = 'organization_message_access') THEN
            CREATE POLICY "Users can view their orgs msg access" ON public.organization_message_access
                FOR SELECT TO authenticated
                USING (organization_id IN (
                    SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
                    UNION
                    SELECT organization_id FROM profiles WHERE id = auth.uid()
                ));
        END IF;
    END $$;
  `;

    try {
        await client.query(query);
        console.log('Migration successful');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

run();
