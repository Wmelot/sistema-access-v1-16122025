import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export const ACTION_TRANSLATIONS: Record<string, { label: string; color: string }> = {
    // Ações de Paciente
    'VIEW_PATIENT': { label: 'Visualizou Paciente', color: 'bg-sky-50 text-sky-700 border-sky-100' },
    'PATIENT_CREATE': { label: 'Criou Paciente', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    'CREATE_PATIENT': { label: 'Criou Paciente', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    'PATIENT_QUICK_CREATE': { label: 'Cadastro Rápido', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    'UPDATE_PATIENT': { label: 'Editou Paciente', color: 'bg-amber-50 text-amber-700 border-amber-100' },
    'DELETE_PATIENT': { label: 'Excluiu Paciente', color: 'bg-red-50 text-red-700 border-red-100' },
    'PATIENT_MERGE': { label: 'Unificou Pacientes', color: 'bg-purple-50 text-purple-700 border-purple-100' },
    'PATIENT_KINSHIP': { label: 'Marcou Parentesco', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },

    // Registros Clínicos
    'FINALIZE_RECORD': { label: 'Finalizou Prontuário', color: 'bg-green-50 text-green-700 border-green-100' },
    'DELETE_RECORD': { label: 'Excluiu Prontuário', color: 'bg-red-50 text-red-700 border-red-100' },
    'UPDATE_PATIENT_RECORD': { label: 'Alterou Prontuário', color: 'bg-amber-50 text-amber-700 border-amber-100' },
    'FINAL_ATTENDANCE': { label: 'Finalizou Atendimento', color: 'bg-green-50 text-green-700 border-green-100' },
    'CREATE_IMMEDIATE_ATTENDANCE': { label: 'Iniciou Atendimento', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },

    // Agendamentos
    'CREATE_APPOINTMENT': { label: 'Novo Agendamento', color: 'bg-blue-50 text-blue-700 border-blue-100' },
    'UPDATE_APPOINTMENT': { label: 'Alterou Agendamento', color: 'bg-amber-50 text-amber-700 border-amber-100' },
    'CANCEL_APPOINTMENT': { label: 'Cancelou Agendamento', color: 'bg-red-50 text-red-700 border-red-100' },
    'UPDATE_APPOINTMENT_STATUS': { label: 'Status do Agendamento Atualizado', color: 'bg-sky-50 text-sky-700 border-sky-100' },
    'CREATE_BLOCK': { label: 'Bloqueou Agenda', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    'Agendamento com Ajuste': { label: 'Agendamento com Desconto/Acréscimo', color: 'bg-teal-50 text-teal-700 border-teal-100' },
    'Agendamento Atualizado (Valores)': { label: 'Alterou Valores do Agendamento', color: 'bg-teal-50 text-teal-700 border-teal-100' },

    // Comunicação
    'SEND_WHATSAPP': { label: 'Enviou WhatsApp', color: 'bg-green-50 text-green-700 border-green-100' },
    'SEND_SMS': { label: 'Enviou SMS', color: 'bg-blue-50 text-blue-700 border-blue-100' },
    'SEND_EMAIL': { label: 'Enviou E-mail', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },

    // Financeiro
    'INVOICE_CREATE': { label: 'Criou Fatura', color: 'bg-teal-50 text-teal-700 border-teal-100' },
    'CREATE_INVOICE': { label: 'Criou Fatura', color: 'bg-teal-50 text-teal-700 border-teal-100' },
    'PAYMENT_RECEIVE': { label: 'Recebeu Pagamento', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },

    // Configurações
    'UPDATE_LOCATION': { label: 'Alterou Localização', color: 'bg-slate-50 text-slate-700 border-slate-200' },
    'UPDATE_SYSTEM_SETTINGS': { label: 'Alterou Configurações', color: 'bg-slate-50 text-slate-700 border-slate-200' },

    // Triggers do Banco (automáticos)
    'INSERT': { label: 'Registro Criado', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    'UPDATE': { label: 'Registro Alterado', color: 'bg-blue-50 text-blue-700 border-blue-100' },
    'DELETE': { label: 'Registro Removido', color: 'bg-red-50 text-red-700 border-red-100' },
}

export const TABLE_TRANSLATIONS: Record<string, string> = {
    'patients': 'Pacientes',
    'patient': 'Paciente',
    'appointments': 'Agendamentos',
    'appointment': 'Agendamento',
    'services': 'Serviços',
    'invoices': 'Faturas',
    'invoice': 'Fatura',
    'products': 'Produtos',
    'profiles': 'Usuários',
    'organizations': 'Organizações',
    'payment_method_fees': 'Taxas de Pagamento',
    'patient_records': 'Prontuários',
    'patient_record': 'Prontuário',
    'patient_assessments': 'Avaliações',
    'communications': 'Comunicações',
    'system': 'Sistema',
}

export function translateAction(action: string): { label: string; color: string } {
    // Check exact match
    if (ACTION_TRANSLATIONS[action]) return ACTION_TRANSLATIONS[action]

    // Check partial matches or patterns
    if (action.includes('CANCEL')) return { label: 'Cancelamento', color: 'bg-red-50 text-red-700 border-red-100' }
    if (action.includes('CREATE')) return { label: 'Criação', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' }
    if (action.includes('UPDATE')) return { label: 'Edição', color: 'bg-amber-50 text-amber-700 border-amber-100' }
    if (action.includes('DELETE')) return { label: 'Exclusão', color: 'bg-red-50 text-red-700 border-red-100' }
    if (action.includes('SEND')) return { label: 'Envio', color: 'bg-sky-50 text-sky-700 border-sky-100' }

    return { label: action, color: 'bg-slate-50 text-slate-700 border-slate-200' }
}

export function translateTable(tableName: string | null | undefined): string {
    if (!tableName) return 'Sistema'
    const cleanName = tableName.toLowerCase().trim()
    return TABLE_TRANSLATIONS[cleanName] || tableName
}

export function humanizeDetails(log: any): string {
    const details = typeof log.details === 'string' ? (() => { try { return JSON.parse(log.details) } catch { return {} } })() : (log.details || {})

    // Ações específicas da aplicação
    if (log.action === 'VIEW_PATIENT') {
        return details.name ? `Acessou o prontuário de "${details.name}"` : 'Acessou prontuário de paciente'
    }
    if (['PATIENT_CREATE', 'PATIENT_QUICK_CREATE', 'CREATE_PATIENT'].includes(log.action)) {
        return details.name ? `Cadastrou o paciente "${details.name}"` : 'Cadastrou um novo paciente'
    }
    if (log.action === 'UPDATE_PATIENT') {
        return details.name ? `Editou informações de "${details.name}"` : 'Editou dados de paciente'
    }
    if (log.action === 'DELETE_PATIENT') {
        return 'Exclusão permanente de ficha de paciente'
    }
    if (log.action === 'PATIENT_MERGE') {
        return 'Unificou duas fichas de paciente (mesclagem de registros)'
    }
    if (log.action === 'PATIENT_KINSHIP') {
        const degree = details.degree || 'Familiar'
        return `Vinculou dois pacientes como "${degree}"`
    }
    if (log.action === 'FINALIZE_RECORD' || log.action === 'FINAL_ATTENDANCE') {
        return 'Finalizou e assinou atendimento clínico'
    }
    if (log.action === 'CREATE_IMMEDIATE_ATTENDANCE') {
        return 'Iniciou atendimento imediato (sem agendamento prévio)'
    }
    if (log.action === 'DELETE_RECORD') {
        return 'Removeu prontuário/evolução clínica'
    }
    if (['INVOICE_CREATE', 'CREATE_INVOICE'].includes(log.action)) {
        const amount = details.amount ? `R$ ${Number(details.amount).toFixed(2)}` : ''
        return amount ? `Fatura criada no valor de ${amount}` : 'Nova fatura criada'
    }
    if (log.action === 'SEND_WHATSAPP') {
        return `Envio de mensagem via WhatsApp`
    }
    if (log.action === 'UPDATE_LOCATION') {
        return `Alterou configurações de endereço ou mapa da unidade`
    }

    // Trigger UPDATE com changes
    if (log.action === 'UPDATE' && details?.changes) {
        const changedFields = Object.keys(details.changes)
        if (changedFields.length > 0 && changedFields.length <= 3) {
            return `Campos alterados: ${changedFields.join(', ')}`
        }
        return `${changedFields.length} campos modificados`
    }

    if (log.action === 'INSERT') return 'Novo registro criado automaticamente'
    if (log.action === 'UPDATE') return 'Registro modificado'
    if (log.action === 'DELETE') return 'Registro removido permanentemente'

    // Fallback for generic metadata
    if (details.message) return details.message
    if (typeof details === 'object' && Object.keys(details).length > 0) {
        // Try to find a 'name' or 'title' or 'id' to show something useful
        const hint = details.name || details.title || details.full_name || details.id
        if (hint && typeof hint === 'string') return `Referente a: ${hint}`
    }

    return log.resource ? `Ação sobre ${translateTable(log.resource)}` : 'Ação registrada'
}
