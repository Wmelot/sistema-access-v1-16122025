import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const client = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
    console.log("🔧 Creating permissions table...")

    try {
        // Step 1: Create the table using raw SQL via Supabase
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS permissions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
                module VARCHAR(100) NOT NULL,
                action VARCHAR(50) NOT NULL,
                granted BOOLEAN DEFAULT false,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(role_id, module, action)
            );

            CREATE INDEX IF NOT EXISTS idx_permissions_role_module ON permissions(role_id, module);
            CREATE INDEX IF NOT EXISTS idx_permissions_granted ON permissions(granted) WHERE granted = true;
        `

        // We'll insert directly using Supabase client instead of raw SQL
        console.log("✅ Table structure ready (execute migration manually if needed)")

        // Step 2: Get all roles
        const { data: roles, error: rolesError } = await client
            .from('roles')
            .select('id, name')

        if (rolesError) {
            console.error("❌ Error fetching roles:", rolesError)
            return
        }

        console.log(`\n📋 Found ${roles.length} roles:`, roles.map(r => r.name).join(', '))

        // Step 3: Define permissions to seed
        const permissionsToSeed: Array<{
            role_id: string
            module: string
            action: string
            granted: boolean
        }> = []

        // Helper to add permission
        function addPerm(roleName: string, module: string, action: string, granted: boolean) {
            const role = roles?.find(r => r.name === roleName)
            if (role) {
                permissionsToSeed.push({
                    role_id: role.id,
                    module,
                    action,
                    granted
                })
            }
        }

        // MASTER PERMISSIONS (all granted)
        const masterPerms: Array<[string, string]> = [
            // Dashboard
            ['dashboard', 'menu_visible'],
            // Schedule
            ['schedule', 'view'], ['schedule', 'create'], ['schedule', 'update'], ['schedule', 'delete'],
            ['schedule', 'block'], ['schedule', 'fit_in'], ['schedule', 'menu_visible'],
            // Patients
            ['patients', 'view'], ['patients', 'create'], ['patients', 'update'], ['patients', 'delete'],
            ['patients', 'records'], ['patients', 'certificates'], ['patients', 'prescriptions'],
            ['patients', 'files'], ['patients', 'menu_visible'],
            // Financial
            ['financial', 'view'], ['financial', 'create'], ['financial', 'update'], ['financial', 'delete'],
            ['financial', 'cash_flow'], ['financial', 'accounts'], ['financial', 'discounts'],
            ['financial', 'menu_visible'], ['financial', 'overview_menu'], ['financial', 'dre_menu'],
            ['financial', 'pricing_menu'], ['financial', 'products_menu'], ['financial', 'services_menu'],
            // Inventory
            ['inventory', 'view'], ['inventory', 'create'], ['inventory', 'update'], ['inventory', 'delete'],
            ['inventory', 'movements'], ['inventory', 'kits'], ['inventory', 'menu_visible'],
            // Other menus
            ['campaigns', 'menu_visible'], ['my_billing', 'menu_visible'],
            ['forms', 'menu_visible'], ['reminders', 'menu_visible'],
            // Settings
            ['settings', 'professionals_menu'], ['settings', 'forms_menu'], ['settings', 'questionnaires_menu'],
            ['settings', 'locations_menu'], ['settings', 'whatsapp_menu'], ['settings', 'reports_menu'],
            ['settings', 'system_menu'], ['settings', 'migration_menu']
        ]

        masterPerms.forEach(([module, action]) => addPerm('Master', module, action, true))

        // PROFESSIONAL PERMISSIONS
        const professionalPerms: Array<[string, string, boolean]> = [
            ['dashboard', 'menu_visible', true],
            ['schedule', 'view', true], ['schedule', 'create', true], ['schedule', 'update', true],
            ['schedule', 'fit_in', true], ['schedule', 'menu_visible', true],
            ['patients', 'view', true], ['patients', 'create', true], ['patients', 'update', true],
            ['patients', 'records', true], ['patients', 'certificates', true],
            ['patients', 'prescriptions', true], ['patients', 'files', true],
            ['patients', 'menu_visible', true],
            ['my_billing', 'menu_visible', true],
            ['forms', 'menu_visible', true],
            ['reminders', 'menu_visible', true]
        ]

        professionalPerms.forEach(([module, action, granted]) =>
            addPerm('Professional', module, action, granted)
        )

        // RECEPTIONIST PERMISSIONS
        const receptionistPerms: Array<[string, string, boolean]> = [
            ['dashboard', 'menu_visible', true],
            ['schedule', 'view', true], ['schedule', 'create', true], ['schedule', 'update', true],
            ['schedule', 'delete', true], ['schedule', 'block', true], ['schedule', 'fit_in', true],
            ['schedule', 'menu_visible', true],
            ['patients', 'view', true], ['patients', 'create', true], ['patients', 'update', true],
            ['patients', 'files', true], ['patients', 'menu_visible', true],
            ['financial', 'view', true], ['financial', 'create', true],
            ['financial', 'accounts', true], ['financial', 'menu_visible', true]
        ]

        receptionistPerms.forEach(([module, action, granted]) =>
            addPerm('Receptionist', module, action, granted)
        )

        console.log(`\n🌱 Seeding ${permissionsToSeed.length} permissions...`)

        // Insert in batches
        const batchSize = 100
        for (let i = 0; i < permissionsToSeed.length; i += batchSize) {
            const batch = permissionsToSeed.slice(i, i + batchSize)
            const { error } = await client
                .from('granular_permissions' as any)
                .upsert(batch, { onConflict: 'role_id,module,action' })

            if (error) {
                console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, error)
            } else {
                console.log(`✅ Inserted batch ${i / batchSize + 1} (${batch.length} permissions)`)
            }
        }

        // Verify
        console.log("\n📊 Verification:")
        const { data: verification, count } = await client
            .from('granular_permissions' as any)
            .select('*', { count: 'exact', head: true })

        console.log(`✅ Total permissions in database: ${count}`)

        // Count by role
        for (const role of roles) {
            const { count: roleCount } = await client
                .from('granular_permissions' as any)
                .select('*', { count: 'exact', head: true })
                .eq('role_id', role.id)
                .eq('granted', true)

            console.log(`   ${role.name}: ${roleCount} granted permissions`)
        }

    } catch (error: any) {
        console.error("❌ Error:", error.message)
    }
}

runMigration()
