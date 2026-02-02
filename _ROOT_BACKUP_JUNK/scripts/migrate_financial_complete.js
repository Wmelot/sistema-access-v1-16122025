
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

async function migrateFinancialData() {
    try {
        await legacy.connect();
        await local.connect();
        console.log('Connected to both databases.');

        // Build Profile Map
        const legacyProfiles = await legacy.query('SELECT id, full_name FROM profiles');
        const localProfiles = await local.query('SELECT id, full_name FROM profiles');

        const profileMap = new Map();
        const norm = s => s && s.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        legacyProfiles.rows.forEach(lp => {
            const match = localProfiles.rows.find(p => norm(p.full_name) === norm(lp.full_name));
            if (match) {
                profileMap.set(lp.id, match.id);
            }
        });
        console.log(`Mapped ${profileMap.size} profiles.`);

        // 1. PAYMENT METHOD FEES
        console.log('\n--- PAYMENT METHOD FEES ---');
        const fees = await legacy.query('SELECT * FROM payment_method_fees');
        let feeCount = 0;

        for (const f of fees.rows) {
            try {
                await local.query(`
                    INSERT INTO payment_method_fees (
                        id, method, installments, fee_percent, updated_at
                    )
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (id) DO UPDATE SET
                        fee_percent = EXCLUDED.fee_percent,
                        updated_at = EXCLUDED.updated_at
                `, [f.id, f.method, f.installments, f.fee_percent, f.updated_at]);
                feeCount++;
            } catch (e) {
                console.error(`Fee ${f.id} failed: ${e.message}`);
            }
        }
        console.log(`Migrated ${feeCount} payment method fees.`);

        // 2. PROFESSIONAL COMMISSION RULES
        console.log('\n--- PROFESSIONAL COMMISSION RULES ---');
        const rules = await legacy.query('SELECT * FROM professional_commission_rules');
        let ruleCount = 0;

        for (const r of rules.rows) {
            const mappedProfId = profileMap.get(r.professional_id) || r.professional_id;

            try {
                await local.query(`
                    INSERT INTO professional_commission_rules (
                        id, professional_id, service_id, type, value
                    )
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (id) DO UPDATE SET
                        value = EXCLUDED.value,
                        type = EXCLUDED.type
                `, [r.id, mappedProfId, r.service_id, r.type, r.value]);
                ruleCount++;
            } catch (e) {
                console.error(`Commission Rule ${r.id} failed: ${e.message}`);
            }
        }
        console.log(`Migrated ${ruleCount} commission rules.`);

        // 3. FINANCIAL COMMISSIONS
        console.log('\n--- FINANCIAL COMMISSIONS ---');
        const commissions = await legacy.query('SELECT * FROM financial_commissions');
        let commCount = 0;

        for (const c of commissions.rows) {
            const mappedProfId = profileMap.get(c.professional_id) || c.professional_id;

            try {
                await local.query(`
                    INSERT INTO financial_commissions (
                        id, professional_id, appointment_id, amount, status, created_at, paid_at
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    ON CONFLICT (id) DO UPDATE SET
                        status = EXCLUDED.status,
                        paid_at = EXCLUDED.paid_at
                `, [c.id, mappedProfId, c.appointment_id, c.amount, c.status, c.created_at, c.paid_at]);
                commCount++;
            } catch (e) {
                console.error(`Commission ${c.id} failed: ${e.message}`);
            }
        }
        console.log(`Migrated ${commCount} financial commissions.`);

        console.log('\n✅ Financial Data Migration Complete!');
        console.log(`  - ${feeCount} Payment Method Fees`);
        console.log(`  - ${ruleCount} Commission Rules`);
        console.log(`  - ${commCount} Financial Commissions`);

    } catch (e) {
        console.error('Migration Error:', e);
    } finally {
        await legacy.end();
        await local.end();
    }
}

migrateFinancialData();
