import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Normalize phone number to match database format
function normalizePhone(phone: string): string[] {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');

    // Generate variations to match against database
    const variations = [
        cleaned, // Full number with country code: 5511987654321
        cleaned.replace(/^55/, ''), // Without country code: 11987654321
        cleaned.replace(/^55/, '').replace(/^(\d{2})/, '($1) '), // Formatted: (11) 987654321
        cleaned.replace(/^55/, '').replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3'), // Full format: (11) 98765-4321
        cleaned.replace(/^55/, '').replace(/^(\d{2})(\d{4})(\d{4})/, '($1) $2-$3'), // Landline format: (11) 9876-5432
    ];

    return [...new Set(variations)]; // Remove duplicates
}

// Check if message contains confirmation keywords
function isConfirmationMessage(text: string): boolean {
    const normalizedText = text.toLowerCase().trim();
    const confirmationKeywords = ['1', 'sim', 'confirmar', 'ok', 'confirmo', 'yes'];

    return confirmationKeywords.some(keyword => normalizedText === keyword || normalizedText.includes(keyword));
}

// Log webhook event for debugging
async function logWebhookEvent(supabase: SupabaseClient, data: any, status: string, details?: string) {
    try {
        await supabase.from('webhook_logs').insert({
            provider: 'zapi',
            event_type: 'message_received',
            payload: data,
            status,
            details,
            created_at: new Date().toISOString()
        });
    } catch (error) {
        console.error('Failed to log webhook event:', error);
    }
}

export async function POST(request: NextRequest) {
    // Initialize Supabase with Service Role Key for webhook operations (Lazy Init)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase credentials for Webhook');
        return NextResponse.json({ error: 'Configuration Error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    try {
        // 1. Security: Validate webhook token
        const webhookToken = request.headers.get('x-webhook-token');
        const expectedToken = process.env.ZAPI_WEBHOOK_TOKEN;

        if (expectedToken && webhookToken !== expectedToken) {
            console.warn('Invalid webhook token received');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // 2. Parse incoming payload
        const payload = await request.json();
        console.log('Z-API Webhook received:', JSON.stringify(payload, null, 2));

        // Extract phone and message from Z-API payload
        const phone = payload.phone || payload.from;
        const messageText = payload.message?.text || payload.text || '';
        const fromMe = payload.message?.fromMe || false;

        // Ignore messages sent by us
        if (fromMe) {
            console.log('Ignoring message sent by us');
            return NextResponse.json({ success: true, message: 'Message from self ignored' });
        }

        // Validate required fields
        if (!phone || !messageText) {
            await logWebhookEvent(supabase, payload, 'error', 'Missing phone or message text');
            return NextResponse.json(
                { error: 'Invalid payload: missing phone or message' },
                { status: 400 }
            );
        }

        // 3. Check if message is a confirmation
        if (!isConfirmationMessage(messageText)) {
            console.log(`Message "${messageText}" is not a confirmation keyword`);
            await logWebhookEvent(supabase, payload, 'ignored', 'Not a confirmation message');
            return NextResponse.json({ success: true, message: 'Not a confirmation message' });
        }

        // 4. Normalize phone number and find patient
        const phoneVariations = normalizePhone(phone);
        console.log('Searching for patient with phone variations:', phoneVariations);

        const { data: patients, error: patientError } = await supabase
            .from('patients')
            .select('id, name, phone')
            .or(phoneVariations.map(p => `phone.eq.${p}`).join(','))
            .limit(1);

        if (patientError) {
            console.error('Error finding patient:', patientError);
            await logWebhookEvent(supabase, payload, 'error', `Database error: ${patientError.message}`);
            return NextResponse.json({ success: true, message: 'Error finding patient' });
        }

        if (!patients || patients.length === 0) {
            console.log('Patient not found for phone:', phone);
            await logWebhookEvent(supabase, payload, 'ignored', 'Patient not found');
            return NextResponse.json({ success: true, message: 'Patient not found' });
        }

        const patient = patients[0];
        console.log('Patient found:', patient.name, patient.id);

        // 5. Find next future appointment for this patient
        const { data: appointments, error: appointmentError } = await supabase
            .from('appointments')
            .select('id, date, start_time, status')
            .eq('patient_id', patient.id)
            .gte('date', new Date().toISOString().split('T')[0]) // Future dates only
            .neq('status', 'Cancelado')
            .order('date', { ascending: true })
            .order('start_time', { ascending: true })
            .limit(1);

        if (appointmentError) {
            console.error('Error finding appointment:', appointmentError);
            await logWebhookEvent(supabase, payload, 'error', `Database error: ${appointmentError.message}`);
            return NextResponse.json({ success: true, message: 'Error finding appointment' });
        }

        if (!appointments || appointments.length === 0) {
            console.log('No future appointments found for patient:', patient.name);
            await logWebhookEvent(supabase, payload, 'ignored', 'No future appointments found');
            return NextResponse.json({ success: true, message: 'No future appointments' });
        }

        const appointment = appointments[0];
        console.log('Appointment found:', appointment.id, appointment.date, appointment.start_time);

        // 6. Update appointment status to 'Confirmado'
        const { error: updateError } = await supabase
            .from('appointments')
            .update({
                status: 'Confirmado',
                updated_at: new Date().toISOString()
            })
            .eq('id', appointment.id);

        if (updateError) {
            console.error('Error updating appointment:', updateError);
            await logWebhookEvent(supabase, payload, 'error', `Failed to update appointment: ${updateError.message}`);
            return NextResponse.json({ success: true, message: 'Error updating appointment' });
        }

        console.log('✅ Appointment confirmed successfully:', appointment.id);
        await logWebhookEvent(supabase, payload, 'success', `Appointment ${appointment.id} confirmed for patient ${patient.name}`);

        return NextResponse.json({
            success: true,
            message: 'Appointment confirmed',
            data: {
                patient: patient.name,
                appointmentId: appointment.id,
                date: appointment.date,
                time: appointment.start_time
            }
        });

    } catch (error: any) {
        console.error('Webhook processing error:', error);
        // Can't log event if supabase init failed, but if it succeeded, we try
        if (supabase) {
            await logWebhookEvent(supabase, { error: error.message }, 'error', 'Unexpected error');
        }

        // Always return 200 to prevent Z-API from retrying
        return NextResponse.json({
            success: false,
            message: 'Internal error',
            error: error.message
        });
    }
}

// Health check endpoint
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        endpoint: 'Z-API Webhook',
        timestamp: new Date().toISOString()
    });
}
