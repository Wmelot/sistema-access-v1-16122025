import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Esquema de Validação super estrito (Zod) - O escudo anti-hacker
const bookLeadSchema = z.object({
    professionalId: z.string().uuid("Formato de ID inválido."),
    patientName: z.string().min(3).max(100),
    patientPhone: z.string().min(10).max(15).regex(/^[0-9]+$/, "Telefone deve conter apenas números"),
    patientEmail: z.string().email("E-mail inválido.").optional().or(z.literal('')),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve ser YYYY-MM-DD"),
    time: z.string().regex(/^\d{2}:\d{2}$/, "Hora deve ser HH:MM"),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // 1. BLINDAGEM ZOD: Se o Hacker enviar dados maliciosos ou SQL Injection, o Zod barra aqui.
        const parsed = bookLeadSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ success: false, error: "Dados inválidos.", details: parsed.error.issues }, { status: 400 });
        }

        const { professionalId, patientName, patientPhone, patientEmail, date, time } = parsed.data;

        // O Service Role é usado pois o Lead é "Anônimo" (fora do sistema logado)
        // Isso exige precisão CLÍNICA nas chaves que vamos forçar no INSERT para não quebrar o Multi-Tenant.
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 2. BLINDAGEM DE DESTINO: O Profissional EXISTE e é realmente PARCEIRO PROPULSÃO?
        // Impede que a API seja usada para descobrir nomes ou enviar spam para a "Access Fisioterapia"
        const { data: profData, error: profError } = await supabase
            .from('profiles')
            .select(`
                id, is_propulsao_partner,
                organization_users!inner(organization_id)
            `)
            .eq('id', professionalId)
            .eq('is_propulsao_partner', true)
            .single();

        if (profError || !profData) {
            // Retorno genérico para não dar dicas a invasores
            return NextResponse.json({ success: false, error: "Profissional indisponível ou não suporta este serviço." }, { status: 403 });
        }

        const orgId = profData.organization_users[0].organization_id;

        // 3. BUSCA OU CRIA O PACIENTE (Scopeado rigidamente para a Clínica-Alvo)
        let patientId = null;
        const { data: existingPatient } = await supabase
            .from('patients')
            .select('id')
            .eq('organization_id', orgId)
            .eq('phone', patientPhone)
            .maybeSingle();

        if (existingPatient) {
            patientId = existingPatient.id;
        } else {
            const { data: newPatient, error: newPatError } = await supabase
                .from('patients')
                .insert({
                    organization_id: orgId,
                    name: patientName,
                    phone: patientPhone,
                    email: patientEmail || null,
                    status: 'lead_propulsao' // Status customizado
                })
                .select('id')
                .single();

            if (newPatError) throw newPatError;
            patientId = newPatient.id;
        }

        // 4. CRIA O AGENDAMENTO COMO PENDENTE (O fisio vai ter que aprovar depois)
        const appointmentStart = new Date(`${date}T${time}:00-03:00`).toISOString(); // UTC-3 Brasil
        // Padrão de 1 hora de avaliação
        const appointmentEnd = new Date(new Date(appointmentStart).getTime() + 60 * 60 * 1000).toISOString();

        const { data: newAppt, error: apptError } = await supabase
            .from('appointments')
            .insert({
                organization_id: orgId,
                patient_id: patientId,
                professional_id: professionalId,
                title: "Avaliação Biomecânica - Propulsão",
                type: "Avaliação",
                status: "Pendente",
                start_time: appointmentStart,
                end_time: appointmentEnd,
                notes: "🚨 Lead Automático via Portal Propulsão. Ligar para confirmar horário."
            })
            .select('id')
            .single();

        if (apptError) throw apptError;

        // O Retorno de Sucesso (Não expõe IDs internos de pacientes)
        return NextResponse.json({
            success: true,
            message: "Pré-agendamento solicitado com sucesso! A clínica entrará em contato."
        });

    } catch (e: any) {
        console.error("Booking API Error:", e);
        // Em vez de retornar e.message (que pode conter schemas de banco), retorna erro padrão.
        return NextResponse.json({ success: false, error: "Erro interno no processamento do lead." }, { status: 500 });
    }
}
