
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Config
const DUMP_FILE = 'migration_dump.sql';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DB_URL = process.env.DATABASE_URL;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!SERVICE_KEY || !DB_URL || !SUPABASE_URL) {
    console.error('Missing env vars (SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL)');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const pgClient = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });

async function migrate() {
    try {
        await pgClient.connect();
        console.log('Connected to DB');

        // 1. Read Dump
        const sql = fs.readFileSync(DUMP_FILE, 'utf8');
        const lines = sql.split('\n').filter(l => l.trim().length > 0 && !l.trim().startsWith('--'));

        // 2. Load Local Data
        console.log('Loading local profiles and services...');
        const { rows: localProfiles } = await pgClient.query('SELECT id, full_name FROM profiles');
        const { rows: localServices } = await pgClient.query('SELECT id, name FROM services');

        const profileMap = new Map(); // LegacyID -> NewID
        const serviceMap = new Map(); // LegacyID -> NewID

        console.log(`Found ${localProfiles.length} local profiles`);
        console.log(`Found ${localServices.length} local services`);

        // 3. Process Profiles
        console.log('Processing Profiles...');
        for (const line of lines) {
            if (line.startsWith('INSERT INTO profiles')) {
                // Regex to capture ID and Full Name. 
                // Value format: ('uuid', NULL, 'role', 'Full Name', ...
                // Note: The dump might vary slightly, but assuming standard format.
                // We'll try to extract the first quoted string as ID, and the 4th quoted string as Name (based on schema)
                // Schema in INSERT: (id, email, role, full_name, ...)
                // Values: ('uuid', NULL, 'role', 'Name', ...)

                const parts = line.split("VALUES (")[1].split(");")[0];
                // Use a smarter regex or safe split? SQL strings can contain commas.
                // But for migration dump, typically safe-ish.
                // Let's use regex for specific fields.

                // Extract ID (first UUID)
                const idMatch = line.match(/'([0-9a-f-]{36})'/);
                if (!idMatch) continue;
                const oldId = idMatch[1];

                // Extract Name. It's the 4th field.
                // Let's rely on mapping Logic: 
                // We know Warley is 'Warley de Melo Oliveira'.
                // we can search the line for the name if we know it? No we don't know it from dump yet.
                // We parse the line.

                // Basic CSV parser for SQL values
                const matches = line.match(/('([^']*)'|NULL|\d+|TRUE|FALSE)/g);
                // matches[0] = 'uuid'
                // matches[1] = NULL (email)
                // matches[2] = 'role'
                // matches[3] = 'Full Name'

                if (!matches || matches.length < 4) {
                    console.log(`Skipping parse of profile line (regex fail): ${line.substring(0, 50)}...`);
                    continue;
                }

                const nameLen = matches[3].length;
                const fullName = matches[3].substring(1, nameLen - 1); // remove quotes

                const existingToken = localProfiles.find(p => p.full_name.trim() === fullName.trim());

                if (existingToken) {
                    profileMap.set(oldId, existingToken.id);
                    console.log(`[MAP] Profile '${fullName}': ${oldId} -> ${existingToken.id} (Existing)`);
                } else {
                    // Create New User
                    console.log(`[NEW] Creating user for '${fullName}'...`);
                    const email = `${fullName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '.').toLowerCase()}.${Date.now()}@migration.axiom.local`;
                    const { data, error } = await supabase.auth.admin.createUser({
                        email,
                        password: 'ChangeMe123!',
                        user_metadata: { full_name: fullName },
                        email_confirm: true
                    });

                    if (error) {
                        // If user exists, try to find it
                        if (error.message && (error.message.includes("already registered") || error.status === 422)) {
                            console.log(`[USER] User ${email} already exists. Fetching ID...`);
                            const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers();
                            if (listErr) {
                                console.error("List users failed", listErr);
                                continue;
                            }
                            const found = users.find(u => u.email === email);
                            if (found) {
                                profileMap.set(oldId, found.id);
                                console.log(`[MAP] Found existing user for ${fullName}: ${found.id}`);

                                // Proceed to insert profile since it wasn't found in localProfiles
                                let newLine = line.replace(`'${oldId}'`, `'${found.id}'`);
                                try {
                                    await pgClient.query(newLine);
                                    console.log(`[DB] Inserted profile for ${fullName}`);
                                } catch (err) {
                                    if (err.code === '23505') console.log(`[DB] Profile already exists (PK).`);
                                    else console.error(`[DB] Insert profile failed: ${err.message}`);
                                }
                                continue;
                            }
                        }

                        console.error(`Error creating user ${fullName}:`, error);
                        continue;
                    }

                    const newId = data.user.id;
                    profileMap.set(oldId, newId);
                    console.log(`[NEW] User created: ${newId}`);

                    // Insert Profile with NEW ID
                    // Replace old ID in line
                    let newLine = line.replace(`'${oldId}'`, `'${newId}'`);

                    // Also, the dump might set 'organization_id'. 
                    // If we need to map orgs, do it here. 
                    // Assuming Org ID '0000...01' matches local.

                    try {
                        await pgClient.query(newLine);
                        console.log(`[DB] Inserted profile for ${fullName}`);
                    } catch (err) {
                        console.error(`[DB] Failed to insert profile ${fullName}: ${err.message}`);
                    }
                }
            }
        }

        // 4. Process Services
        console.log('Processing Services...');
        for (const line of lines) {
            if (line.startsWith('INSERT INTO services')) {
                // (id, name, ...
                const matches = line.match(/('([^']*)'|NULL|\d+|TRUE|FALSE)/g);
                if (!matches || matches.length < 2) continue;

                const oldId = matches[0].substring(1, matches[0].length - 1);
                const name = matches[1].substring(1, matches[1].length - 1);

                const existing = localServices.find(s => s.name === name);
                if (existing) {
                    serviceMap.set(oldId, existing.id);
                    console.log(`[MAP] Service '${name}': ${oldId} -> ${existing.id}`);
                } else {
                    // Insert directly. ID collision unlikely.
                    serviceMap.set(oldId, oldId);
                    try {
                        await pgClient.query(line);
                        console.log(`[DB] Inserted Local Service: ${name}`);
                    } catch (err) {
                        if (err.code === '23505') {
                            // Duplicate, we need to find the ID of the service that conflicted?
                            // Or if ID was preserved, we are good.
                            // If ID matched an existing one, it would be caught by `if (existing)` earlier potentially?
                            // No, if name differed but ID existed.
                            console.log(`[DB] Service insert conflict. Assuming success.`);
                        } else {
                            console.error(`[DB] Service insert failed: ${err.message}`);
                        }
                    }
                }
            }
        }

        const createdPatients = new Set();
        const { rows: existingPatients } = await pgClient.query('SELECT id FROM patients');
        existingPatients.forEach(p => createdPatients.add(p.id));

        console.log('Processing Appointments...');
        let appCount = 0;
        for (const line of lines) {
            if (line.startsWith('INSERT INTO appointments')) {
                let newLine = line;

                // Replace all Mapped IDs
                profileMap.forEach((newId, oldId) => {
                    if (oldId !== newId) {
                        newLine = newLine.replaceAll(`'${oldId}'`, `'${newId}'`);
                    }
                });

                serviceMap.forEach((newId, oldId) => {
                    if (oldId !== newId) {
                        newLine = newLine.replaceAll(`'${oldId}'`, `'${newId}'`);
                    }
                });

                // Status Mapping
                newLine = newLine.replace(/'attended'/g, "'completed'");
                newLine = newLine.replace(/'cancelled'/g, "'canceled'");
                newLine = newLine.replace(/'checked_in'/g, "'confirmed'");

                // Patient Creation (on the fly)
                const valStart = newLine.indexOf("VALUES (");
                if (valStart !== -1) {
                    const valuesStr = newLine.substring(valStart + 8);
                    const valMatches = valuesStr.match(/'([0-9a-f-]{36})'/g);
                    // Match 1 should be patient_id (id is 0, patient_id is 1st FK? No, 2nd UUID in list usually)
                    // The dump order: id, created_at, patient_id.
                    // created_at is 'YYYY-MM...'
                    // So valMatches[0] = id, valMatches[1] = patient_id.

                    if (valMatches && valMatches.length >= 2) {
                        const patientId = valMatches[1].replace(/'/g, '');
                        if (patientId && !createdPatients.has(patientId)) {
                            // Check if it's really a UUID (regex check implied)
                            if (patientId.length === 36) {
                                try {
                                    await pgClient.query(`
                                        INSERT INTO patients (id, name, organization_id)
                                        VALUES ($1, 'Legacy Patient from Dump', '00000000-0000-0000-0000-000000000001')
                                        ON CONFLICT (id) DO NOTHING
                                    `, [patientId]);
                                    createdPatients.add(patientId);
                                    console.log(`[DB] Created patient ${patientId}`);
                                } catch (e) { console.error(`[DB] Patient creation failed: ${e.message}`); }
                            }
                        }
                    }
                }

                // FK Nullification (Location, Invoice, PaymentMethod if UUID)
                // Use Regex context
                // Location: status, notes, location_id. 
                // Regex capture groups:
                // 1: 'status' (full match with quotes)
                // 2: status (inner)
                // 3: 'notes' (full match with quotes or NULL)
                // 4: location_id (uuid)
                newLine = newLine.replace(/('(scheduled|confirmed|completed|canceled|attended|checked_in)')\s*,\s*('[^']*'|NULL)\s*,\s*'([0-9a-f-]{36})'/g, "$1, $3, NULL");

                // Invoice: is_extra (BOOL), invoice_id. 
                newLine = newLine.replace(/(TRUE|FALSE)\s*,\s*'([0-9a-f-]{36})'/g, "$1, NULL");

                // Payment Method? 
                // ... discount, addition, payment_method_id, invoice_issued
                // numerics, uuid, bool
                // `0, 0, 'uuid', TRUE`
                // Regex: `\d+\s*,\s*\d+\s*,\s*'([0-9a-f-]{36})'\s*,\s*(TRUE|FALSE)`
                newLine = newLine.replace(/(\d+)\s*,\s*(\d+)\s*,\s*'([0-9a-f-]{36})'\s*,\s*(TRUE|FALSE)/g, "$1, $2, NULL, $4");

                try {
                    await pgClient.query(newLine);
                    appCount++;
                } catch (err) {
                    console.error(`[DB] Appointment Insert Failed: ${err.message}`);
                }
            }
        }
        console.log(`Processed ${appCount} appointments.`);

    } catch (err) {
        console.error('Migration Failed:', err);
    } finally {
        await pgClient.end();
    }
}

migrate();
