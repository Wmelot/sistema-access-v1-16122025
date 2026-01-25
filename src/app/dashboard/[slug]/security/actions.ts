'use server'

import {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const RP_ID = process.env.NEXT_PUBLIC_RP_ID || 'localhost';
const RP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Sistema Access';
// Should be the full URL (e.g. https://app.example.com or http://localhost:3000)
// For local dev, we need to be careful with ports in RP_ID vs Origin.
const ORIGIN = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function getRegistrationOptions() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { error: 'Unauthorized' };

        // Get existing authenticators to exclude them
        const { data: authenticators } = await supabase
            .from('user_authenticators' as any)
            .select('credential_id, transports')
            .eq('user_id', user.id);

        const options = await generateRegistrationOptions({
            rpName: RP_NAME,
            rpID: RP_ID,
            userID: new Uint8Array(Buffer.from(user.id)), // Convert UUID string to Uint8Array
            userName: user.email || user.id,
            // Don't prompt if already registered
            excludeCredentials: (authenticators || []).map((auth: any) => ({
                id: auth.credential_id,
                transports: auth.transports,
            })) as any,
            authenticatorSelection: {
                residentKey: 'preferred',
                userVerification: 'preferred',
                authenticatorAttachment: 'platform',
            },
        });

        const { cookies } = require('next/headers');
        const cookieStore = await cookies();
        cookieStore.set('webauthn_challenge', options.challenge, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 5 // 5 minutes
        });

        return options;
    } catch (err: any) {
        console.error("getRegistrationOptions Error:", err);
        return { error: err.message || 'Error generating registration options' };
    }
}

export async function verifyRegistration(response: any) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Unauthorized' };

        const { cookies } = require('next/headers');
        const cookieStore = await cookies();
        const expectedChallenge = cookieStore.get('webauthn_challenge')?.value;

        if (!expectedChallenge) return { error: 'Challenge expired or not found. Please try again.' };

        // Allow multiple origins in development to prevent mismatches (localhost vs 127.0.0.1)
        const expectedOrigins = [ORIGIN];
        if (process.env.NODE_ENV === 'development') {
            if (!expectedOrigins.includes('http://localhost:3000')) expectedOrigins.push('http://localhost:3000');
            if (!expectedOrigins.includes('http://127.0.0.1:3000')) expectedOrigins.push('http://127.0.0.1:3000');
        }

        let verification;
        try {
            verification = await verifyRegistrationResponse({
                response,
                expectedChallenge,
                expectedOrigin: expectedOrigins, // Pass array of allowed origins
                expectedRPID: RP_ID,
            });
        } catch (error: any) {
            console.error("verifyRegistrationResponse Error:", error);
            return { error: `Verification failed: ${error.message}` };
        }

        const { verified, registrationInfo } = verification;

        if (verified && registrationInfo) {
            let { credentialPublicKey, credentialID } = registrationInfo as any;
            const { counter, credentialDeviceType, credentialBackedUp } = registrationInfo as any;

            // Fallback: Check if they are nested inside 'credential' property
            const regInfoAny = registrationInfo as any;
            if (!credentialID && regInfoAny.credential?.id) {
                credentialID = regInfoAny.credential.id;
            }
            if (!credentialPublicKey && regInfoAny.credential?.publicKey) {
                credentialPublicKey = regInfoAny.credential.publicKey;
            }

            if (!credentialID || !credentialPublicKey) {
                return { error: '[DEBUG] Critical: Credential ID or Public Key missing from verification result.' };
            }

            // Robust Base64URL conversion using Buffer
            const credentialIDBase64 = Buffer.from(credentialID).toString('base64')
                .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

            // Robust Hex conversion for Postgres BYTEA using Buffer
            const credentialPublicKeyHex = '\\x' + Buffer.from(credentialPublicKey).toString('hex');

            const { error } = await supabase.from('user_authenticators' as any).insert({
                user_id: user.id,
                credential_id: credentialIDBase64,
                credential_public_key: credentialPublicKeyHex,
                counter: Number(counter) || 0,
                credential_device_type: credentialDeviceType,
                credential_backed_up: credentialBackedUp,
                transports: response.response.transports || [],
                name: 'Biometria (' + (response.id.slice(0, 4)) + ')'
            });

            if (error) {
                console.error('DB Error:', error);
                return { error: `Database Error: ${error.message}` };
            }

            revalidatePath('/dashboard/profile');
            return { success: true };
        }

        return { error: 'Verification returned false' };
    } catch (err: any) {
        console.error("verifyRegistration Error:", err);
        return { error: err.message || 'Internal Verification Error' };
    }
}

export async function getAuthenticationOptions() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Unauthorized' };

        // Get user's authenticators
        const { data: authenticators } = await supabase
            .from('user_authenticators' as any)
            .select('credential_id, transports')
            .eq('user_id', user.id);

        if (!authenticators || authenticators.length === 0) {
            return { error: 'No authenticators registered' };
        }

        const options = await generateAuthenticationOptions({
            rpID: RP_ID,
            allowCredentials: (authenticators as any[]).map(authenticator => ({
                id: authenticator.credential_id,
                type: 'public-key',
                transports: authenticator.transports,
            })),
            userVerification: 'preferred',
        });

        const { cookies } = require('next/headers');
        const cookieStore = await cookies();
        cookieStore.set('webauthn_challenge', options.challenge, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 5
        });

        return options;
    } catch (err: any) {
        console.error("getAuthenticationOptions Error:", err);
        return { error: err.message || 'Error generating auth options' };
    }
}

export async function verifyAuthentication(response: any) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Unauthorized' };

        const { cookies } = require('next/headers');
        const cookieStore = await cookies();
        const expectedChallenge = cookieStore.get('webauthn_challenge')?.value;
        if (!expectedChallenge) return { error: 'Challenge expired' };

        // Find the authenticator in DB
        const credentialID = response.id; // Base64URL string from client

        const { data: authenticator } = await supabase
            .from('user_authenticators' as any)
            .select('*')
            .eq('credential_id', credentialID)
            .single();

        if (!authenticator) return { error: 'Authenticator not found in database' };

        // Convert stored Hex/Bytea back to Uint8Array for library
        const hexToUint8Array = (hexInfo: string) => {
            // remove \x prefix if present
            const hex = hexInfo.startsWith('\\x') ? hexInfo.slice(2) : hexInfo;
            const matches = hex.match(/.{1,2}/g);
            if (!matches) return new Uint8Array();
            return new Uint8Array(matches.map(byte => parseInt(byte, 16)));
        };

        // Allow multiple origins in development
        const expectedOrigins = [ORIGIN];
        if (process.env.NODE_ENV === 'development') {
            if (!expectedOrigins.includes('http://localhost:3000')) expectedOrigins.push('http://localhost:3000');
            if (!expectedOrigins.includes('http://127.0.0.1:3000')) expectedOrigins.push('http://127.0.0.1:3000');
        }

        let verification;
        try {
            const auth: any = authenticator
            // @ts-ignore - authenticator property exists in newer versions but types might mismatch
            verification = await verifyAuthenticationResponse({
                response,
                expectedChallenge,
                expectedOrigin: expectedOrigins,
                expectedRPID: RP_ID,
                authenticator: {
                    credentialPublicKey: hexToUint8Array(auth.credential_public_key),
                    credentialID: auth.credential_id,
                    counter: parseInt(auth.counter) || 0,
                    transports: auth.transports
                },
            } as any);
        } catch (error: any) {
            console.error("verifyAuthenticationResponse Error:", error);
            return { error: `Verification failed: ${error.message}` };
        }

        const { verified, authenticationInfo } = verification;

        if (verified && authenticationInfo) {
            // Update counter
            await supabase
                .from('user_authenticators' as any)
                .update({
                    counter: authenticationInfo.newCounter,
                    last_used_at: new Date().toISOString()
                })
                .eq('id', (authenticator as any).id);

            return { success: true };
        }

        return { error: 'Verification failed' };
    } catch (error: any) {
        console.error("verifyAuthentication Error:", error);
        return { error: error.message || 'Verification Error' };
    }
}

export async function getAuthenticators() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
        .from('user_authenticators' as any)
        .select('id, credential_device_type, created_at, last_used_at, transports, name')
        .eq('user_id', user.id)
        .order('last_used_at', { ascending: false });

    return data || [];
}

export async function deleteAuthenticator(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { error } = await supabase
        .from('user_authenticators' as any)
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) return { error: 'Failed to delete' };

    revalidatePath('/dashboard/profile');
    return { success: true };
}
