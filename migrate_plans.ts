import { Client } from 'pg';

async function run() {
    const client = new Client({
        connectionString: "postgresql://postgres:0xw8SnQc09fHn7S4@db.robptuukezhqvtasjyhz.supabase.co:5432/postgres"
    });

    try {
        await client.connect();
        console.log('Adding columns to plan_configs...');
        
        await client.query('ALTER TABLE plan_configs ADD COLUMN IF NOT EXISTS slug text');
        await client.query('ALTER TABLE plan_configs ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true');
        
        console.log('Success.');
        
        // Add unique constraint to slug
        await client.query('ALTER TABLE plan_configs ADD CONSTRAINT unique_plan_slug UNIQUE (slug)');
        console.log('Added unique constraint to slug.');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}
run();
