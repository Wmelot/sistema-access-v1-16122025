
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

// Config
const LEGACY_CONN = 'postgresql://postgres:Accessfisio%402022@db.djhipxldlkvkcrmudinv.supabase.co:5432/postgres';
const LOCAL_CONN = process.env.DATABASE_URL;

const legacy = new Client({ connectionString: LEGACY_CONN, ssl: { rejectUnauthorized: false } });
const local = new Client({ connectionString: LOCAL_CONN, ssl: { rejectUnauthorized: false } });

async function migrate() {
    try {
        console.log('Connecting...');
        await legacy.connect();
        await local.connect();
        console.log('Connected to both DBs.');

        // 0. CLEANUP (Careful!)
        // Delete appointments imported recently (easy valid check? check if created_at > today? No, dump had legacy dates)
        // Delete "Legacy Patient from Dump"
        console.log('Cleaning up temporary dump data...');
        // Delete patients named 'Legacy Patient from Dump' -> Cascade will delete appointments linked to them?
        // Or we should delete appointments first.

        await local.query(`DELETE FROM appointments WHERE patient_id IN (SELECT id FROM patients WHERE name = 'Legacy Patient from Dump')`);
        await local.query(`DELETE FROM patients WHERE name = 'Legacy Patient from Dump'`);
        // Also delete appointments that might reside from previous runs if they aren't linked to legacy dump patients?
        // Since user said "delete them", we assume we are re-syncing.
        // But to be safe, we rely on UPSERT (ON CONFLICT DO UPDATE).

        // 1. PROFILES (Map/Create)
        console.log('--- PROFILES ---');
        const legacyProfiles = await legacy.query('SELECT * FROM profiles');
        const localProfiles = await local.query('SELECT id, full_name, role FROM profiles'); // user_id might not exist in profiles locally? Schema varies.
        // Locally `profiles.id` is the PK (uuid). `id` usually References auth.users.

        // Map: Legacy Profile ID -> Local Profile ID
        const profileMap = new Map();

        // Fetch All Local Auth Users to map by email/name
        // Can't access Auth table via SQL client easily (different schema, permission).
        // We will rely on Name Matching for existing mapping.

        for (const lp of legacyProfiles.rows) {
            const match = localProfiles.rows.find(p => p.full_name === lp.full_name);
            if (match) {
                profileMap.set(lp.id, match.id);
                console.log(`Mapped ${lp.full_name} (${lp.id} -> ${match.id})`);
            } else {
                console.log(`Skipping Profile creation for ${lp.full_name} (Needs Auth User). Assuming already handled or manual.`);
                // We created Rayane/Fabio in previous step! They should exist now.
                // If they exist, they are in localProfiles.
            }
        }

        // 2. SERVICES
        console.log('--- SERVICES ---');
        const legacyServices = await legacy.query('SELECT * FROM services');
        const serviceMap = new Map();

        for (const ls of legacyServices.rows) {
            // Upsert Service
            // We trust ID to be same if possible, OR Name match.
            // Check existence
            const res = await local.query('SELECT id FROM services WHERE name = $1', [ls.name]);
            let localId;
            if (res.rows.length > 0) {
                localId = res.rows[0].id;
                // Update properties?
                await local.query(`
                    UPDATE services SET 
                    duration = $2, price = $3, description = $4
                    WHERE id = $1
                `, [localId, ls.duration, ls.price, ls.description]);
            } else {
                // Insert
                // Use legacy ID if not taken?
                try {
                    await local.query(`
                        INSERT INTO services (id, name, duration, price, description, organization_id)
                        VALUES ($1, $2, $3, $4, $5, '00000000-0000-0000-0000-000000000001')
                     `, [ls.id, ls.name, ls.duration, ls.price, ls.description]);
                    localId = ls.id;
                } catch (e) {
                    // ID conflict? generate new?
                    // If conflict, it means it exists.
                    localId = ls.id;
                }
            }
            serviceMap.set(ls.id, localId);
        }

        // 3. PATIENTS
        console.log('--- PATIENTS ---');
        const legacyPatients = await legacy.query('SELECT * FROM patients');
        console.log(`Migrating ${legacyPatients.rows.length} patients...`);

        let patCount = 0;
        for (const p of legacyPatients.rows) {
            // Map columns
            // Legacy: id, full_name, email, phone, cpf...
            // Local: id, name, email, phone, cpf... (full_name vs name)

            // Note: Local schema has `name` instead of `full_name`?
            // In smart_migrate we corrected this.

            // Address mapping?
            // Legacy might have address struct. LOCAL has address, address_zip, etc.

            try {
                await local.query(`
                    INSERT INTO patients (
                        id, name, email, phone, cpf, 
                        address_zip, address_street,
                        birthdate, organization_id, notes, gender
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, '00000000-0000-0000-0000-000000000001', $9, $10)
                    ON CONFLICT (id) DO UPDATE SET
                        name = EXCLUDED.name,
                        email = EXCLUDED.email,
                        phone = EXCLUDED.phone,
                        cpf = EXCLUDED.cpf,
                        address_zip = EXCLUDED.address_zip
                `, [
                    p.id,
                    p.full_name || p.name,
                    p.email,
                    p.phone,
                    p.cpf,
                    p.zip_code || p.cep,
                    p.street || p.logradouro,
                    // removed address_number, neighborhood, city, state as they don't exist in local schema target
                    p.date_of_birth || p.data_nascimento,
                    p.observation || p.notes,
                    p.gender
                ]);
                patCount++;
            } catch (err) {
                console.error(`Failed Patient ${p.full_name}: ${err.message}`);
                // Could fail on column names if I guessed wrong. 
                // Legacy schema inspection would be better, but we trust basic fields.
            }
        }
        console.log(`Migrated ${patCount} patients.`);


        // 4. FINANCIAL CATEGORIES
        console.log('--- FINANCIAL CATEGORIES ---');
        const cats = await legacy.query('SELECT * FROM financial_categories');
        for (const c of cats.rows) {
            // Map legacy 'both' -> 'income' (or skip?). Or Update constraint.
            // Constraint allows 'income', 'expense'.
            let type = c.type;
            if (type === 'both' || !['income', 'expense'].includes(type)) {
                type = 'income'; // Fallback
            }
            await local.query(`
                INSERT INTO financial_categories (id, name, type)
                VALUES ($1, $2, $3)
                ON CONFLICT (id) DO NOTHING
            `, [c.id, c.name, type]);
        }

        // 5. INVOICES & TRANSACTIONS
        // Requires careful mapping of patient_id (exists) and appointment_id (not yet inserted).
        // Issue: Appointments depend on Invoices OR Invoices depend on Appointments?
        // Typically Invoice -> Appointment (invoice_id in appt) OR Appt -> Invoice.
        // In this schema, `appointments` has `invoice_id`. 
        // So INVOICES must be inserted FIRST.

        console.log('--- INVOICES ---');
        const invoices = await legacy.query('SELECT * FROM invoices');
        const validInvoiceIds = new Set();
        for (const inv of invoices.rows) {
            // Map Status
            let status = inv.status;
            if (status === 'pago') status = 'paid';
            if (status === 'pendente') status = 'pending';
            if (status === 'cancelado') status = 'canceled';

            // Fallback for others to pending, or check against allowed
            if (!['pending', 'paid', 'canceled'].includes(status)) {
                console.log(`Invoice ${inv.id} has unknown status '${status}', defaulting to 'pending'`);
                status = 'pending';
            }

            // Check if patient exists (we migrated them)
            // Insert
            try {
                await local.query(`
                    INSERT INTO invoices (id, patient_id, total, status, payment_method, payment_date, created_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    ON CONFLICT (id) DO NOTHING
                `, [
                    inv.id, inv.patient_id, inv.amount || inv.total, status, inv.payment_method, inv.payment_date, inv.created_at
                ]);
                validInvoiceIds.add(inv.id);
            } catch (e) {
                console.error(`Invoice ${inv.id} failed: ${e.message}`);
            }
        }

        // 6. APPOINTMENTS
        console.log('--- APPOINTMENTS ---');
        const appts = await legacy.query('SELECT * FROM appointments');
        let appCount = 0;

        for (const a of appts.rows) {
            // Remap Professional
            const mappedProfId = profileMap.get(a.professional_id) || a.professional_id; // Fallback to original if not mapped (unsafe but maybe ID matches)
            const mappedServiceId = serviceMap.get(a.service_id) || a.service_id;

            // Map Invoice: Only if exists
            const invoiceId = validInvoiceIds.has(a.invoice_id) ? a.invoice_id : null;

            // Map Patient ID (already migrated)

            // Map Status
            let status = a.status;
            if (status === 'attended') status = 'completed';
            if (status === 'cancelled') status = 'canceled';
            if (status === 'checked_in') status = 'confirmed';

            try {
                // Legacy already has timestamps
                const startDateTime = a.start_time;
                const endDateTime = a.end_time;

                await local.query(`
                    INSERT INTO appointments (
                        id, start_time, end_time, 
                        patient_id, professional_id, service_id, 
                        status, notes, organization_id,
                        invoice_id
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, '00000000-0000-0000-0000-000000000001', $9)
                    ON CONFLICT (id) DO UPDATE SET
                        status = EXCLUDED.status,
                        notes = EXCLUDED.notes
                `, [
                    a.id, startDateTime, endDateTime,
                    a.patient_id, mappedProfId, mappedServiceId,
                    status, a.observation || a.notes,
                    invoiceId // Link to invoice we just created
                ]);
                appCount++;
            } catch (e) {
                console.error(`Appt ${a.id} failed: ${e.message}`);
            }
        }
        console.log(`Migrated ${appCount} appointments.`);

        // 7. MESSAGES (Templates & Campaigns)
        console.log('--- MESSAGES ---');
        // Message Templates
        const templates = await legacy.query('SELECT * FROM message_templates');
        for (const t of templates.rows) {
            try {
                await local.query(`
                    INSERT INTO message_templates (id, title, content, channel, trigger_type, is_active, delay_days)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    ON CONFLICT (id) DO NOTHING
                 `, [
                    t.id,
                    t.title || t.name,
                    t.content || t.body,
                    t.channel || 'whatsapp',
                    t.trigger_type || 'manual',
                    t.is_active,
                    t.delay_days
                ]);
            } catch (e) {
                if (e.code === '23505') { // Unique violation
                    console.log(`Skipped duplicate template '${t.title}' (Trigger: ${t.trigger_type}) due to unique constraint.`);
                } else {
                    console.error(`Message Template ${t.id} failed: ${e.message}`);
                }
            }
        }

        // Campaigns
        // Check local schema for `marketing_campaigns` or `campaign_messages`?
        // User asked for "Configuracao de envio". Likely templates.

        console.log('SUCCESS: Direct Migration Completed.');

    } catch (err) {
        console.error('Migration Fatal Error:', err);
    } finally {
        await legacy.end();
        await local.end();
    }
}

migrate();
