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
// Should be the full URL (e.g. https://app.example.com)
const ORIGIN = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function getRegistrationOptions() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { error: 'Unauthorized' };

        // Get existing authenticators to exclude them
        const { data: authenticators } = await supabase
            .from('user_authenticators')
            .select('credential_id, transports')
            .eq('user_id', user.id);

        const options = await generateRegistrationOptions({
            rpName: RP_NAME,
            rpID: RP_ID,
            userID: new Uint8Array(Buffer.from(user.id)), // Convert UUID string to Uint8Array
            userName: user.email || user.id,
            // Don't prompt if already registered
            excludeCredentials: authenticators?.map(auth => ({
                id: auth.credential_id,
                transports: auth.transports,
            })) || [],
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

        let verification;
        try {
            verification = await verifyRegistrationResponse({
                response,
                expectedChallenge,
                expectedOrigin: ORIGIN,
                expectedRPID: RP_ID,
            });
        } catch (error: any) {
            console.error("verifyRegistrationResponse Error:", error);
            // Return simpler error message for common issues
            return { error: `Verification failed: ${error.message}` };
        }

        const { verified, registrationInfo } = verification;

        if (verified && registrationInfo) {
            let { credentialPublicKey, credentialID } = registrationInfo as any;
            const { counter, credentialDeviceType, credentialBackedUp } = registrationInfo as any;

            // Fallback: Check if they are nested inside 'credential' property (common in some contexts)
            const regInfoAny = registrationInfo as any;
            if (!credentialID && regInfoAny.credential?.id) {
                credentialID = regInfoAny.credential.id;
            }
            if (!credentialPublicKey && regInfoAny.credential?.publicKey) {
                credentialPublicKey = regInfoAny.credential.publicKey;
            }

            if (!credentialID) {
                const keys = Object.keys(registrationInfo || {}).join(', ');
                const credentialKeys = registrationInfo.credential ? Object.keys(registrationInfo.credential).join(', ') : 'N/A';
                const verKeys = Object.keys(verification || {}).join(', ');

                console.error('DEBUG FACEID: regKeys=', keys, ' credKeys=', credentialKeys, ' verKeys=', verKeys);
                return { error: `[DEBUG] ID Missing. RegKeys: ${keys} | CredKeys: ${credentialKeys}` };
            }
            if (!credentialPublicKey) {
                return { error: '[DEBUG] Public Key Missing' };
            }

            // Robust Base64URL conversion using Buffer
            const credentialIDBase64 = Buffer.from(credentialID).toString('base64')
                .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

            // Robust Hex conversion for Postgres BYTEA using Buffer
            const credentialPublicKeyHex = '\\x' + Buffer.from(credentialPublicKey).toString('hex');

            const { error } = await supabase.from('user_authenticators').insert({
                user_id: user.id,
                credential_id: credentialIDBase64,
                credential_public_key: credentialPublicKeyHex,
                counter: Number(counter) || 0,
                credential_device_type: credentialDeviceType,
                credential_backed_up: credentialBackedUp,
                transports: response.response.transports || [],
            });

            if (error) {
                console.error('DB Error:', error);
                return { error: `Database Error: ${error.message}` };
            }

            revalidatePath('/dashboard/profile'); // Assuming profile is where we manage this
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
            .from('user_authenticators')
            .select('credential_id, transports')
            .eq('user_id', user.id);

        if (!authenticators || authenticators.length === 0) {
            return { error: 'No authenticators registered' };
        }

        const options = await generateAuthenticationOptions({
            rpID: RP_ID,
            allowCredentials: authenticators.map(auth => ({
                id: auth.credential_id, // simplewebauthn handles base64url strings usually? Yes.
                transports: auth.transports,
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
            .from('user_authenticators')
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

        let verification;
        try {
            // @ts-ignore - authenticator property exists in newer versions but types might mismatch
            verification = await verifyAuthenticationResponse({
                response,
                expectedChallenge,
                expectedOrigin: ORIGIN,
                expectedRPID: RP_ID,
                authenticator: {
                    credentialPublicKey: hexToUint8Array(authenticator.credential_public_key),
                    credentialID: authenticator.credential_id,
                    counter: parseInt(authenticator.counter) || 0,
                    transports: authenticator.transports
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
                .from('user_authenticators')
                .update({
                    counter: authenticationInfo.newCounter,
                    last_used_at: new Date().toISOString()
                })
                .eq('id', authenticator.id);

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
        .from('user_authenticators')
        .select('id, credential_device_type, created_at, last_used_at, transports, device_name')
        .eq('user_id', user.id)
        .order('last_used_at', { ascending: false });

    return data || [];
}

export async function deleteAuthenticator(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { error } = await supabase
        .from('user_authenticators')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) return { error: 'Failed to delete' };

    revalidatePath('/dashboard/profile');
    return { success: true };
}
