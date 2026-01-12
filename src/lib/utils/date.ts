import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";

// Standard Timezone for the System
const TIMEZONE = 'America/Sao_Paulo';

/**
 * Formats a date string or object to standard Brazilian format (dd/MM/yyyy).
 * Forces timezone to 'America/Sao_Paulo' to avoid hydration mismatches.
 * @param date ISO string or Date object
 * @param formatStr Optional format string (default: 'dd/MM/yyyy')
 */
export function formatDate(date: string | Date | null | undefined, formatStr = 'dd/MM/yyyy'): string {
    if (!date) return '-';

    try {
        const d = typeof date === 'string' ? new Date(date) : date;
        const zonedDate = toZonedTime(d, TIMEZONE);
        return format(zonedDate, formatStr, { locale: ptBR });
    } catch (e) {
        console.error("Invalid date:", date);
        return '-';
    }
}
