
const { Client } = require('pg');

const config = {
    user: 'postgres',
    password: 'WMFM@26222425',
    host: 'db.robptuukezhqvtasjyhz.supabase.co',
    port: 5432,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
};

async function repairSystem() {
    console.log('🩺 REPAIRING PROFILES & TRIGGERS...');
    const client = new Client(config);
    try {
        await client.connect();

        // 1. GET PROFESSIONAL ROLE ID
        const roleRes = await client.query("SELECT id FROM roles WHERE name = 'Professional'");
        const proRoleId = roleRes.rows[0]?.id;

        if (!proRoleId) throw new Error('Professional Role not found!');
        console.log(`ℹ️ Professional Role ID: ${proRoleId}`);

        // 2. FIX NULL ROLE_IDs & EMPTY NAMES
        const updateRes = await client.query(`
            UPDATE profiles 
            SET 
                role_id = $1,
                role = 'professional',
                full_name = CASE WHEN full_name = '' OR full_name IS NULL THEN 'Profissional (Nome Pendente)' ELSE full_name END
            WHERE role_id IS NULL AND id NOT IN (SELECT id FROM profiles WHERE email IN ('wmelot@gmail.com', 'accessfisio@gmail.com'));
        `, [proRoleId]);
        console.log(`✅ Fixed ${updateRes.rowCount} profiles (Role ID & Name).`);

        // 3. UPDATE TRIGGER FUNCTION (handle_new_user)
        // Ensure it sets role_id correctly
        await client.query(`
            CREATE OR REPLACE FUNCTION public.handle_new_user()
            RETURNS trigger
            LANGUAGE plpgsql
            SECURITY DEFINER
            AS $function$
            DECLARE
                default_org_id uuid := '00000000-0000-0000-0000-000000000001';
                pro_role_id uuid;
            BEGIN
                -- Find Professional Role ID
                SELECT id INTO pro_role_id FROM public.roles WHERE name = 'Professional' LIMIT 1;

                -- Insert into public.profiles
                INSERT INTO public.profiles (
                    id, 
                    full_name, 
                    email, 
                    organization_id, 
                    role,
                    role_id, -- SET ROLE ID
                    photo_url
                )
                VALUES (
                    NEW.id, 
                    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Novo Usuário'), 
                    NEW.email, 
                    default_org_id, 
                    'professional', 
                    pro_role_id,
                    NEW.raw_user_meta_data->>'avatar_url'
                )
                ON CONFLICT (id) DO UPDATE
                SET
                    full_name = EXCLUDED.full_name,
                    email = EXCLUDED.email,
                    role_id = EXCLUDED.role_id,
                    organization_id = EXCLUDED.organization_id;
                    
                RETURN NEW;
            END;
            $function$;
        `);
        console.log('✅ Updated handle_new_user function.');

        // 4. RESTORE TRIGGER
        // Drop first to be safe
        await client.query("DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;");
        await client.query(`
            CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
        `);
        console.log('✅ Restored on_auth_user_created trigger.');

        // 5. RELOAD CACHE
        await client.query("NOTIFY pgrst, 'reload config';");

        console.log('✨ REPAIR COMPLETED ✨');

    } catch (err) {
        console.error('❌ ERROR:', err.message);
    } finally {
        await client.end();
    }
}

repairSystem();
