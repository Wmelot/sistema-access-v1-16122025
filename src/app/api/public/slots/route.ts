import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { addMinutes, format, parse, isWithinInterval, addHours } from 'date-fns';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const professionalId = searchParams.get('professionalId');
        const dateStr = searchParams.get('date'); // YYYY-MM-DD

        if (!professionalId || !dateStr) {
            return NextResponse.json({ success: false, error: 'Dados insuficientes.' }, { status: 400 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // [CORREÇÃO CRÍTICA] Forçar interpretação da data no fuso de Brasília para determinar o dia da semana
        const date = new Date(`${dateStr}T12:00:00-03:00`);
        const dayOfWeek = date.getDay();

        console.log(`[Slots API] Requisitado: Prof=${professionalId}, Data=${dateStr}, Detectado DayOfWeek=${dayOfWeek}`);

        // 1. Horários de trabalho (Configurados no Perfil -> Agenda)
        const { data: availability, error: availError } = await supabase
            .from('professional_availability')
            .select('*')
            .eq('profile_id', professionalId)
            .eq('day_of_week', dayOfWeek);

        if (availError) throw availError;

        if (!availability || availability.length === 0) {
            console.log(`[Slots API] Nenhuma disponibilidade encontrada para o dia ${dayOfWeek}`);
            return NextResponse.json({ success: true, slots: [] });
        }

        // 2. Agendamentos existentes (para remover slots ocupados)
        // Buscamos com offset explícito de Brasília (-03:00)
        const dayStart = `${dateStr}T00:00:00-03:00`;
        const dayEnd = `${dateStr}T23:59:59-03:00`;

        const { data: appointments, error: appError } = await supabase
            .from('appointments')
            .select('start_time, end_time')
            .eq('professional_id', professionalId)
            .neq('status', 'cancelled')
            .gte('start_time', dayStart)
            .lte('start_time', dayEnd);

        if (appError) throw appError;

        const duration = 60; // Duração padrão da avaliação Propulsão em minutos
        const availableSlots: string[] = [];

        // 3. Gerar slots baseados em cada bloco de disponibilidade
        for (const slot of availability) {
            // Parse do horário no formato HH:mm:ss
            let current = parse(slot.start_time, 'HH:mm:ss', new Date());
            const end = parse(slot.end_time, 'HH:mm:ss', new Date());

            while (addMinutes(current, duration) <= end) {
                const timeStr = format(current, 'HH:mm');

                // Criar timestamps absolutos para comparação (com offset -03:00)
                const slotStart = new Date(`${dateStr}T${timeStr}:00-03:00`);
                const slotEnd = addMinutes(slotStart, duration);

                // Checar se este slot está livre de conflitos com agendamentos existentes
                const hasConflict = appointments?.some(app => {
                    const appStart = new Date(app.start_time);
                    const appEnd = new Date(app.end_time);
                    // Sobreposição: Início do Slot < Fim do Agendamento E Fim do Slot > Início do Agendamento
                    return slotStart < appEnd && slotEnd > appStart;
                });

                if (!hasConflict) {
                    availableSlots.push(timeStr);
                }

                current = addMinutes(current, duration);
            }
        }

        // Ordenar slots e remover duplicatas (caso haja blocos de disponibilidade sobrepostos)
        const uniqueSlots = Array.from(new Set(availableSlots)).sort();

        console.log(`[Slots API] Encontrados ${uniqueSlots.length} horários livres.`);

        return NextResponse.json({ success: true, slots: uniqueSlots });

    } catch (e: any) {
        console.error("[Slots API Error]:", e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
