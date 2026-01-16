
import { Client } from 'pg';

const config = {
    user: 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'WMFM@26222425', // Fallback for safety
    host: 'db.robptuukezhqvtasjyhz.supabase.co',
    port: 5432,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
};

export async function verifyUserPassword(email: string, inputPass: string) {
    const client = new Client({
        ...config,
        password: process.env.POSTGRES_PASSWORD || 'WMFM@26222425' // Ensure password is used
    });

    try {
        await client.connect();

        // 1. Fetch User and Encrypted Password (Case Insensitive)
        const res = await client.query("SELECT id, email, encrypted_password, raw_user_meta_data FROM auth.users WHERE LOWER(email) = LOWER($1)", [email]);

        if (res.rows.length === 0) {
            return { error: 'Usuário não encontrado.' };
        }

        const user = res.rows[0];
        const storedHash = user.encrypted_password;

        // 2. Verify with pgcrypto (crypt)
        const verifyRes = await client.query("SELECT (crypt($1, $2) = $2) as match", [inputPass, storedHash]);

        if (verifyRes.rows[0].match) {
            return {
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    meta: user.raw_user_meta_data
                }
            };
        } else {
            return { error: 'Senha incorreta.' };
        }

    } catch (err: any) {
        console.error('Auth Bypass Error:', err);
        return { error: 'Erro interno de validação.' };
    } finally {
        await client.end();
    }
}

export async function listUsersDirect() {
    const client = new Client({
        ...config,
        password: process.env.POSTGRES_PASSWORD || 'WMFM@26222425'
    });

    try {
        await client.connect();
        const res = await client.query(`
            SELECT id, email, created_at, last_sign_in_at, raw_user_meta_data as user_metadata 
            FROM auth.users 
            ORDER BY created_at DESC
        `);
        return { users: res.rows, error: null };
    } catch (err: any) {
        console.error('❌ LIST USERS BYPASS ERROR:', err);
        return { users: [], error: err.message };
    } finally {
        await client.end();
    }
}

export async function updatePasswordDirect(userId: string, newPassword: string) {
    const client = new Client({
        ...config,
        password: process.env.POSTGRES_PASSWORD || 'WMFM@26222425'
    });

    try {
        await client.connect();
        // Use pgcrypto to hash and update
        const res = await client.query(`
            UPDATE auth.users 
            SET encrypted_password = crypt($1, gen_salt('bf')),
                updated_at = now()
            WHERE id = $2
        `, [newPassword, userId]);

        if (res.rowCount === 0) {
            return { error: 'Usuário não encontrado.' };
        }

        return { success: true };
    } catch (err: any) {
        console.error('❌ UPDATE PASSWORD BYPASS ERROR:', err);
        return { error: err.message };
    } finally {
        await client.end();
    }
}
