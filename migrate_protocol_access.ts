import { Client } from 'pg';

async function run() {
    const client = new Client({
        connectionString: "postgresql://postgres:0xw8SnQc09fHn7S4@db.robptuukezhqvtasjyhz.supabase.co:5432/postgres"
    });

    try {
        await client.connect();
        console.log('Creating organization_protocol_access table...');
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS organization_protocol_access (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
                protocol_id uuid NOT NULL,
                created_at timestamp with time zone DEFAULT now(),
                UNIQUE(organization_id, protocol_id)
            )
        `);
        
        console.log('Success.');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}
run();
