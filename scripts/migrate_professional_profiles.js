
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

async function migrateProfessionalProfiles() {
    try {
        await legacy.connect();
        await local.connect();
        console.log('Connected to both databases.');

        // Get profiles from legacy
        const legacyProfiles = await legacy.query(`
            SELECT * FROM profiles 
            WHERE full_name IN ('Felipe França Perdigão', 'Fábio de Oliveira Cardoso', 'Rayane Vilela Pereira')
        `);

        console.log(`Found ${legacyProfiles.rows.length} professional profiles in legacy database.\n`);

        // Get local profiles to map IDs
        const localProfiles = await local.query(`
            SELECT id, full_name FROM profiles 
            WHERE full_name IN ('Felipe França Perdigão', 'Fábio de Oliveira Cardoso', 'Rayane Vilela Pereira')
        `);

        const profileMap = new Map();
        const norm = s => s && s.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        legacyProfiles.rows.forEach(lp => {
            const match = localProfiles.rows.find(p => norm(p.full_name) === norm(lp.full_name));
            if (match) {
                profileMap.set(lp.id, match.id);
            }
        });

        console.log('Profile Mapping:');
        profileMap.forEach((newId, oldId) => {
            const legacy = legacyProfiles.rows.find(p => p.id === oldId);
            console.log(`  ${legacy.full_name}: ${oldId} -> ${newId}`);
        });

        // Update each profile with complete data
        for (const legacyProfile of legacyProfiles.rows) {
            const localId = profileMap.get(legacyProfile.id);
            if (!localId) {
                console.log(`\n⚠️  No local match for ${legacyProfile.full_name}`);
                continue;
            }

            console.log(`\n📝 Updating ${legacyProfile.full_name}...`);

            try {
                await local.query(`
                    UPDATE profiles SET
                        cpf = $1,
                        birthdate = $2,
                        gender = $3,
                        phone = $4,
                        council_type = $5,
                        council_number = $6,
                        specialty = $7,
                        color = $8,
                        photo_url = $9,
                        bio = $10,
                        address_zip = $11,
                        address_street = $12,
                        address_number = $13,
                        address_complement = $14,
                        address_neighborhood = $15,
                        address_city = $16,
                        address_state = $17,
                        slot_interval = $18,
                        online_booking_enabled = $19
                    WHERE id = $20
                `, [
                    legacyProfile.cpf,
                    legacyProfile.birth_date,
                    legacyProfile.gender,
                    legacyProfile.phone,
                    legacyProfile.council_type,
                    legacyProfile.council_number,
                    legacyProfile.qualifications,
                    legacyProfile.color || '#64748b',
                    legacyProfile.avatar_url,
                    legacyProfile.bio,
                    legacyProfile.address_zip,
                    legacyProfile.address_street,
                    legacyProfile.address_number,
                    legacyProfile.address_complement,
                    legacyProfile.address_neighborhood,
                    legacyProfile.address_city,
                    legacyProfile.address_state,
                    legacyProfile.slot_interval || 30,
                    legacyProfile.online_booking_enabled !== false,
                    localId
                ]);

                console.log(`  ✅ Profile updated successfully`);
                console.log(`     CPF: ${legacyProfile.cpf}`);
                console.log(`     Phone: ${legacyProfile.phone}`);
                console.log(`     Council: ${legacyProfile.council_type} ${legacyProfile.council_number}`);
                console.log(`     Address: ${legacyProfile.address_street}, ${legacyProfile.address_number} - ${legacyProfile.address_city}`);

            } catch (error) {
                console.error(`  ❌ Error updating ${legacyProfile.full_name}:`, error.message);
            }
        }

        console.log('\n✅ Professional profiles migration completed!');

    } catch (error) {
        console.error('Migration error:', error);
    } finally {
        await legacy.end();
        await local.end();
    }
}

migrateProfessionalProfiles();
