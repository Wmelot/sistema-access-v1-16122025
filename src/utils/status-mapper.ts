export const APPOINTMENT_STATUS_MAP: Record<string, { label: string, color: string }> = {
    'scheduled': {
        label: 'Agendado',
        color: 'bg-slate-50 text-slate-700 border-slate-200'
    },
    'confirmed': {
        label: 'Confirmado',
        color: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    'checked_in': {
        label: 'Chegou',
        color: 'bg-purple-50 text-purple-700 border-purple-200'
    },
    'in_progress': {
        label: 'Em Atendimento',
        color: 'bg-orange-50 text-orange-700 border-orange-200'
    },
    'attended': {
        label: 'Atendido',
        color: 'bg-green-50 text-green-700 border-green-200'
    },
    'billed': {
        label: 'Faturado',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    'cancelled': {
        label: 'Cancelado',
        color: 'bg-zinc-50 text-zinc-500 border-zinc-200'
    },
    'no_show': {
        label: 'Faltou',
        color: 'bg-red-50 text-red-700 border-red-200'
    },
    'rescheduled': {
        label: 'Reagendado',
        color: 'bg-slate-50 text-slate-700 border-slate-200'
    }
}

export function translateStatus(status: string | null | undefined): { label: string, color: string } {
    if (!status) return APPOINTMENT_STATUS_MAP['scheduled']
    const cleanStatus = status.toLowerCase().trim()

    // Exact mapping or fallback
    if (APPOINTMENT_STATUS_MAP[cleanStatus]) {
        return APPOINTMENT_STATUS_MAP[cleanStatus]
    }

    // Mapping for common aliases
    if (cleanStatus === 'attended_unpaid') return APPOINTMENT_STATUS_MAP['attended']

    return { label: status, color: 'bg-slate-50 text-slate-700 border-slate-200' }
}
