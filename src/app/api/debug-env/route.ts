import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const envStatus = {
        NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? 'DEFINED' : 'MISSING',
        SUPABASE_SERVICE_ROLE_KEY: serviceKey ? 'DEFINED' : 'MISSING',
        NODE_ENV: process.env.NODE_ENV,
    };

    let connectionStatus = 'NOT_TESTED';
    let connectionError = null;

    if (supabaseUrl && serviceKey) {
        try {
            const supabase = createClient(supabaseUrl, serviceKey, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            });

            // Try a simple operation that requires admin rights or at least connection
            const { data, error } = await supabase.from('clinic_settings').select('count', { count: 'exact', head: true });

            if (error) {
                connectionStatus = 'FAILED';
                connectionError = error;
            } else {
                connectionStatus = 'SUCCESS';
            }
        } catch (e: any) {
            connectionStatus = 'EXCEPTION';
            connectionError = e.message;
        }
    }

    return NextResponse.json({
        env: envStatus,
        connection: {
            status: connectionStatus,
            error: connectionError
        },
        timestamp: new Date().toISOString()
    });
}
