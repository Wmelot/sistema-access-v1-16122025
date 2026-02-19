const { Pool } = require('pg');

const getConnectionString = () => {
    let url = "postgresql://postgres:0xw8SnQc09fHn7S4@db.robptuukezhqvtasjyhz.supabase.co:5432/postgres";
    return url;
};

const pool = new Pool({
    connectionString: getConnectionString(),
    ssl: { rejectUnauthorized: false },
    max: 1,
});

const tables = [
    'public.audit_logs',
    'public.system_logs',
    'public.webhook_logs',
    'public.access_logs',
    'public.message_logs',
    'public.campaign_messages',
    'public.marketing_campaigns',
    'public.reminders',
    'public.assessment_follow_ups',
    'public.consent_tokens',
    'public.clinical_records',
    'public.patient_records',
    'public.patient_assessments',
    'public.patient_documents',
    'public.appointments',
    'public.waiting_list',
    'public.invoices',
    'public.transactions',
    'public.financial_payables',
    'public.financial_commissions',
    'public.patients'
];

async function cleanup() {
    console.log('--- STARTING DATABASE CLEANUP (PRODUCTION) ---');
    try {
        const query = `TRUNCATE TABLE ${tables.join(', ')} RESTART IDENTITY CASCADE;`;
        console.log('Running TRUNCATE operation...');
        await pool.query(query);
        console.log('✅ Success! Database is clean (Data reset).');
    } catch (err) {
        console.error('❌ Error during cleanup:', err);
    } finally {
        await pool.end();
        process.exit();
    }
}

cleanup();
