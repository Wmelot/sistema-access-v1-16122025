
const { Client } = require('pg');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config({ path: '.env.local' });

const legacy = new Client({
    connectionString: 'postgresql://postgres:Accessfisio%402022@db.djhipxldlkvkcrmudinv.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

const local = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrateTransactions() {
    try {
        await legacy.connect();
        await local.connect();
        console.log('Connected.');

        // 1. Rebuild Profile Map
        const legacyProfiles = await legacy.query('SELECT id, full_name, email FROM profiles');
        const localProfiles = await local.query('SELECT id, full_name, role FROM profiles');

        const profileMap = new Map();

        legacyProfiles.rows.forEach(lp => {
            // Find match by Name (clean) or Email (if available in profiles?)
            // Local profiles might not have email in 'profiles' table if it's in auth.
            // Match by Name strictly for now as per previous script logic?
            const norm = s => s && s.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const match = localProfiles.rows.find(p => norm(p.full_name) === norm(lp.full_name));
            if (match) {
                profileMap.set(lp.id, match.id);
            }
        });
        console.log(`Mapped ${profileMap.size} profiles.`);

        // 2. Transactions
        console.log('Migrating Transactions...');
        const trans = await legacy.query('SELECT * FROM transactions');
        let count = 0;

        for (const t of trans.rows) {
            const mappedProfId = profileMap.get(t.professional_id) || t.professional_id;

            // Fix amount (string to float?) - PG handles it usually if param is string for numeric column.

            try {
                await local.query(`
                    INSERT INTO transactions (
                        id, created_at, type, amount, description, category,
                        patient_id, date, product_id, quantity, production_cost,
                        status, due_date, paid_at, is_recurring,
                        professional_id, organization_id, installments
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
                    ON CONFLICT (id) DO UPDATE SET
                        status = EXCLUDED.status,
                        paid_at = EXCLUDED.paid_at
                `, [
                    t.id, t.created_at, t.type, t.amount, t.description, t.category,
                    t.patient_id, t.date, t.product_id, t.quantity, t.production_cost,
                    t.status, t.due_date, t.paid_at, t.is_recurring,
                    mappedProfId, '9571532e-fdf8-4aaa-b236-416fd6459566', 1 // default integer for installments?
                ]);
                count++;
            } catch (e) {
                console.error(`Transaction ${t.id} failed: ${e.message}`);
            }
        }
        console.log(`Migrated ${count} transactions.`);

    } catch (e) {
        console.error(e);
    } finally {
        await legacy.end();
        await local.end();
    }
}

migrateTransactions();
