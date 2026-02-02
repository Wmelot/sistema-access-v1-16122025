
const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const legacy = new Client({
    connectionString: 'postgresql://postgres:Accessfisio%402022@db.djhipxldlkvkcrmudinv.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

const local = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrateLocations() {
    try {
        await legacy.connect();
        await local.connect();
        console.log('Connected to both databases.');

        // Get locations from legacy
        const legacyLocations = await legacy.query('SELECT * FROM locations ORDER BY created_at');

        console.log(`Found ${legacyLocations.rows.length} locations in legacy database.\n`);

        const orgId = '9571532e-fdf8-4aaa-b236-416fd6459566'; // Access Fisioterapia

        let migrated = 0;
        for (const loc of legacyLocations.rows) {
            try {
                await local.query(`
                    INSERT INTO locations (
                        id, name, capacity, color, organization_id, created_at
                    )
                    VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT (id) DO UPDATE SET
                        name = EXCLUDED.name,
                        capacity = EXCLUDED.capacity,
                        color = EXCLUDED.color
                `, [
                    loc.id,
                    loc.name,
                    loc.capacity || 1,
                    loc.color || '#64748b',
                    orgId,
                    loc.created_at
                ]);

                console.log(`✅ ${loc.name}`);
                console.log(`   Capacity: ${loc.capacity || 1}`);
                console.log(`   Color: ${loc.color || '#64748b'}\n`);

                migrated++;
            } catch (error) {
                console.error(`❌ Error migrating ${loc.name}:`, error.message);
            }
        }

        console.log(`\n✅ Migration completed! ${migrated}/${legacyLocations.rows.length} locations migrated.`);

    } catch (error) {
        console.error('Migration error:', error);
    } finally {
        await legacy.end();
        await local.end();
    }
}

migrateLocations();
